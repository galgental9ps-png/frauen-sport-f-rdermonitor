import fs from "node:fs/promises";

const SOURCES_PATH = "public/data/sources.json";
const ITEMS_PATH = "public/data/items.json";
const BRIEFING_PATH = "public/data/briefing.json";

const MAX_LINKS_PER_SOURCE = 3;
const MAX_ITEMS_TOTAL = 120;
const FETCH_TIMEOUT_MS = 10000;

const POSITIVE_TERMS = [
  "frauen", "frau", "mädchen", "maedchen", "girls", "women",
  "sport", "sportverein", "verein", "vereine", "breitensport",
  "gleichstellung", "geschlechtergerechtigkeit", "chancengleichheit",
  "förderung", "foerderung", "fördermittel", "foerdermittel", "zuschuss",
  "projekt", "projektförderung", "projektfoerderung", "ausschreibung",
  "antrag", "frist", "deadline", "call", "bewerbung",
  "trainerin", "trainerinnen", "übungsleiterin", "uebungsleiterin",
  "führung", "fuehrung", "vorstand", "ehrenamt", "engagement",
  "bayern", "augsburg", "schwaben", "kommunal", "stadt",
  "integration", "inklusion", "teilhabe", "migration",
  "gewaltschutz", "prävention", "praevention", "safe sport",
  "gesundheit", "bildung", "jugend", "kinder"
];

const HIGH_VALUE_TERMS = [
  "fördermittel", "foerdermittel", "zuschuss", "ausschreibung",
  "antrag", "frist", "deadline", "bewerbung", "call",
  "frauen im sport", "mädchen im sport", "maedchen im sport",
  "trainerinnen", "sportverein", "vereinspauschale",
  "augsburg", "bayern", "blsv", "dosb", "erasmus+", "cerv"
];

const NEGATIVE_LINK_TERMS = [
  "impressum", "datenschutz", "privacy", "cookie", "cookies",
  "kontakt", "login", "anmelden", "registrieren", "newsletter",
  "presse", "jobs", "karriere", "stellenangebote", "sitemap",
  "barrierefreiheit", "leichte sprache", "gebärdensprache",
  "gebaerdensprache", "vorlesen", "teilen", "facebook", "instagram",
  "linkedin", "youtube", "twitter", "x.com", "rss"
];

const PROJECT_IDEAS = [
  {
    title: "Mädchen bleiben im Verein",
    bullets: [
      "Drop-out von Mädchen senken",
      "Trainerinnen als Vorbilder einsetzen",
      "sichere Trainingszeiten schaffen",
      "Elternkommunikation verbessern"
    ]
  },
  {
    title: "Trainerinnen gewinnen",
    bullets: [
      "junge Frauen für Übungsleiterinnen-Ausbildung ansprechen",
      "Mentoring durch erfahrene Trainerinnen",
      "Kostenübernahme über Fördermittel prüfen",
      "Sichtbarkeit weiblicher Vorbilder erhöhen"
    ]
  },
  {
    title: "Frauen in Führung",
    bullets: [
      "Vorstands-Nachwuchs fördern",
      "Qualifizierung und Coaching anbieten",
      "Frauen gezielt für Gremien ansprechen",
      "familienfreundliche Sitzungszeiten prüfen"
    ]
  },
  {
    title: "Sport für Frauen mit wenig Zugang",
    bullets: [
      "niedrige Teilnahmehürden schaffen",
      "Kinderbetreuung prüfen",
      "Kooperation mit Stadt und sozialen Trägern",
      "Integration, Gesundheit und Teilhabe verbinden"
    ]
  },
  {
    title: "Sicherer Sport für Mädchen und Frauen",
    bullets: [
      "Schutzkonzept prüfen",
      "Ansprechpersonen sichtbar machen",
      "Safe-Sport-Schulungen anbieten",
      "Prävention gegen Diskriminierung und Gewalt stärken"
    ]
  }
];

function cleanText(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#034;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&uuml;/g, "ü")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&szlig;/g, "ß")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html = "") {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function normalizeUrl(baseUrl, href) {
  try {
    if (!href) return null;

    const trimmed = href.trim();

    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:") ||
      trimmed.startsWith("javascript:") ||
      trimmed.startsWith("data:")
    ) {
      return null;
    }

    const url = new URL(trimmed, baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getMeta(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const lower = tag.toLowerCase();

    if (!lower.includes(key.toLowerCase())) continue;

    const content =
      tag.match(/\bcontent=["']([^"']+)["']/i) ||
      tag.match(/\bcontent=([^ >]+)/i);

    if (content?.[1]) return cleanText(content[1]);
  }

  return "";
}

function extractTitle(html, fallback = "Ohne Titel") {
  const ogTitle = getMeta(html, "og:title");
  if (ogTitle) return ogTitle;

  const twitterTitle = getMeta(html, "twitter:title");
  if (twitterTitle) return twitterTitle;

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) return stripHtml(h1[1]);

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title?.[1]) {
    return stripHtml(title[1])
      .replace(/\s+\|\s+.*$/, "")
      .replace(/\s+-\s+.*$/, "")
      .trim();
  }

  return fallback;
}

function extractDescription(html) {
  const og = getMeta(html, "og:description");
  if (og) return og;

  const twitter = getMeta(html, "twitter:description");
  if (twitter) return twitter;

  const description = getMeta(html, "description");
  if (description) return description;

  return "";
}

function removeBoilerplate(text) {
  return cleanText(
    text
      .replace(/Zum Inhalt springen/gi, " ")
      .replace(/Navigation aufklappen/gi, " ")
      .replace(/Vorlesen/gi, " ")
      .replace(/Leichte Sprache/gi, " ")
      .replace(/Gebärdensprache/gi, " ")
      .replace(/Suche öffnen/gi, " ")
      .replace(/Newsletter/gi, " ")
      .replace(/Cookie[s]?/gi, " ")
      .replace(/Datenschutz/gi, " ")
  );
}

function extractReadableText(html) {
  const main =
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ||
    html;

  return removeBoilerplate(stripHtml(main));
}

function splitSentences(text) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => cleanText(s))
    .filter((s) => s.length >= 40 && s.length <= 320);
}

function termHits(text, terms) {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => {
    return lower.includes(term.toLowerCase()) ? count + 1 : count;
  }, 0);
}

function scoreText(text, source = {}) {
  const lower = text.toLowerCase();

  let score = Number(source.priority || 50);

  score += termHits(lower, POSITIVE_TERMS) * 3;
  score += termHits(lower, HIGH_VALUE_TERMS) * 8;

  if (lower.includes("augsburg")) score += 18;
  if (lower.includes("bayern")) score += 12;
  if (lower.includes("sportverein")) score += 15;
  if (lower.includes("frauen") || lower.includes("mädchen") || lower.includes("maedchen")) score += 15;
  if (lower.includes("förder") || lower.includes("foerder") || lower.includes("zuschuss")) score += 16;
  if (lower.includes("frist") || lower.includes("deadline") || lower.includes("antrag")) score += 15;

  if (termHits(lower, NEGATIVE_LINK_TERMS) >= 2) score -= 35;
  if (lower.includes("impressum") || lower.includes("datenschutz")) score -= 70;
  if (lower.includes("barrierefreiheitserklärung")) score -= 70;
  if (lower.includes("leichte sprache")) score -= 35;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function categoryFromText(text, source = {}) {
  const lower = text.toLowerCase();

  if (lower.includes("förder") || lower.includes("foerder") || lower.includes("zuschuss") || lower.includes("antrag") || lower.includes("frist")) {
    return "Fördermittel";
  }

  if (lower.includes("augsburg")) return "Augsburg";
  if (lower.includes("bayern") || source.region === "Bayern") return "Bayern";
  if (lower.includes("mädchen") || lower.includes("maedchen")) return "Mädchen im Sport";
  if (lower.includes("trainerin") || lower.includes("trainerinnen")) return "Trainerinnen";
  if (lower.includes("frauen")) return "Frauen im Sport";
  if (lower.includes("gleichstellung") || lower.includes("geschlechtergerechtigkeit")) return "Gleichstellung";
  if (lower.includes("inklusion")) return "Inklusion";
  if (lower.includes("integration")) return "Integration";
  if (lower.includes("ehrenamt") || lower.includes("engagement")) return "Ehrenamt";
  if (lower.includes("safe sport") || lower.includes("gewaltschutz") || lower.includes("prävention")) return "Schutz & Prävention";

  return source.type || "Info";
}

function urgencyFromScore(score, text) {
  const lower = text.toLowerCase();

  if (lower.includes("frist") || lower.includes("deadline") || lower.includes("bewerbung") || lower.includes("antrag")) {
    return "Sofort prüfen";
  }

  if (score >= 90) return "Sehr wichtig";
  if (score >= 75) return "Wichtig";
  if (score >= 55) return "Beobachten";
  return "Hintergrund";
}

function createRecommendation(score, category, text) {
  const lower = text.toLowerCase();

  if (lower.includes("frist") || lower.includes("deadline") || lower.includes("antrag")) {
    return "Frist und Förderfähigkeit sofort prüfen. Falls der Verein antragsberechtigt ist, Thema für Geschäftsführung oder Vorstand vorbereiten.";
  }

  if (category === "Fördermittel") {
    return "Förderchance prüfen: Passt möglicherweise für Projekte zu Mädchen, Frauen, Teilhabe, Ehrenamt oder Sportverein.";
  }

  if (lower.includes("augsburg")) {
    return "Lokal relevant: Für den Verein in Augsburg prüfen und mögliche Ansprechpartner bei Stadt, Sportamt oder Gleichstellungsstelle notieren.";
  }

  if (lower.includes("bayern") || lower.includes("blsv")) {
    return "Für Bayern relevant: Als Grundlage für Vereinsentwicklung, Projektplanung oder BLSV-bezogene Maßnahmen prüfen.";
  }

  if (lower.includes("trainerin") || lower.includes("trainerinnen")) {
    return "Für Projektidee nutzen: Trainerinnen gewinnen, qualifizieren und als Vorbilder im Verein sichtbar machen.";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen")) {
    return "Für Mädchenförderung nutzen: Prüfen, ob daraus ein Vereinsprojekt gegen Drop-out oder für mehr Teilhabe entstehen kann.";
  }

  if (lower.includes("frauen")) {
    return "Für Frauenförderung nutzen: Als Impuls für Angebote, Führung, Ehrenamt oder Öffentlichkeitsarbeit im Verein prüfen.";
  }

  if (score >= 85) {
    return "Intern bewerten: Thema ist relevant und sollte für Strategie, Projektideen oder Förderung geprüft werden.";
  }

  return "Beobachten: Als Hintergrundinformation speichern und bei passenden Projekten erneut prüfen.";
}

function createImpact(score, category, text) {
  const lower = text.toLowerCase();

  if (category === "Fördermittel") {
    return "Kann helfen, neue Projektmittel, Zuschüsse oder Förderchancen für den Verein zu finden.";
  }

  if (lower.includes("augsburg")) {
    return "Hoher lokaler Mehrwert, weil der Bezug zu Augsburg direkte Handlungsmöglichkeiten eröffnen kann.";
  }

  if (lower.includes("bayern") || lower.includes("blsv")) {
    return "Wichtig für Sportvereine in Bayern und mögliche Maßnahmen über BLSV, Land oder Kommune.";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen")) {
    return "Kann konkrete Projekte für Mädchen im Sport, Mitgliederbindung und sichere Teilnahme unterstützen.";
  }

  if (lower.includes("frauen")) {
    return "Kann die Frauenförderung, Sichtbarkeit und Beteiligung im Verein stärken.";
  }

  if (score >= 80) {
    return "Strategisch relevant für Vereinsentwicklung, Gleichstellung oder gesellschaftliches Engagement.";
  }

  return "Einordnung als Hintergrundinformation. Relevanz im Einzelfall prüfen.";
}

function createSummary(title, metaDescription, readableText, source) {
  const sentences = splitSentences(readableText);

  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: scoreText(`${title} ${sentence} ${(source.keywords || []).join(" ")}`, source)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((entry) => entry.sentence);

  let summary = "";

  if (metaDescription && metaDescription.length > 60) {
    summary = metaDescription;
  } else if (ranked.length > 0) {
    summary = ranked.join(" ");
  } else if (source.description) {
    summary = source.description;
  } else {
    summary = "Diese Quelle wurde als relevant für Frauenförderung, Sport, Gleichstellung oder Fördermittel erkannt.";
  }

  summary = cleanText(summary);
  return summary.length > 520 ? `${summary.slice(0, 517)}...` : summary;
}

function extractLinks(html, baseUrl, source) {
  const links = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const rawHref = match[1];
    const label = stripHtml(match[2]);
    const url = normalizeUrl(baseUrl, rawHref);

    if (!url || !label || label.length < 8) continue;

    const combined = `${label} ${url} ${(source.keywords || []).join(" ")}`;
    const score = scoreText(combined, source);

    if (score < 55) continue;
    if (termHits(combined, NEGATIVE_LINK_TERMS) >= 2) continue;

    links.push({
      title: cleanText(label).slice(0, 160),
      url,
      score
    });
  }

  const unique = new Map();

  for (const link of links) {
    if (!unique.has(link.url)) {
      unique.set(link.url, link);
    }
  }

  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LINKS_PER_SOURCE);
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 FrauenSport-Foerdermonitor/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error(`Kein HTML: ${contentType || "unbekannter Inhaltstyp"}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function makeId(url) {
  return Buffer.from(url).toString("base64url").slice(0, 22);
}

function makeCompatibleItem({
  title,
  source,
  url,
  category,
  score,
  summary,
  recommendation,
  impact,
  warning = null
}) {
  const checkedAt = new Date().toISOString();
  const urgency = urgencyFromScore(score, `${title} ${summary} ${recommendation}`);

  return {
    id: makeId(url),

    title,
    headline: title,

    source: source.name,
    sourceName: source.name,
    sourceLabel: source.name,
    sourceType: source.type || "Quelle",

    url,
    link: url,
    href: url,
    sourceUrl: url,
    originalUrl: url,

    region: source.region || "Deutschland",
    category,
    type: category,

    score,
    relevanceScore: score,
    relevance: score,
    urgency,

    summary,
    description: summary,
    excerpt: summary,

    recommendation,
    recommendedAction: recommendation,
    action: recommendation,

    impact,
    benefit: impact,
    value: impact,

    keywords: source.keywords || [],
    tags: source.keywords || [],

    checkedAt,
    updatedAt: checkedAt,
    publishedAt: checkedAt,

    warning
  };
}

async function buildItem(source, url, fallbackTitle = null) {
  try {
    const html = await fetchHtml(url);

    const title = cleanText(extractTitle(html, fallbackTitle || source.name));
    const metaDescription = extractDescription(html);
    const readableText = extractReadableText(html);

    const combined = `${title} ${metaDescription} ${readableText.slice(0, 2500)} ${(source.keywords || []).join(" ")}`;

    const score = scoreText(combined, source);
    const category = categoryFromText(combined, source);
    const summary = createSummary(title, metaDescription, readableText, source);
    const recommendation = createRecommendation(score, category, combined);
    const impact = createImpact(score, category, combined);

    return makeCompatibleItem({
      title,
      source,
      url,
      category,
      score,
      summary,
      recommendation,
      impact
    });
  } catch (error) {
    const combined = `${fallbackTitle || source.name} ${source.description || ""} ${(source.keywords || []).join(" ")}`;
    const score = scoreText(combined, source);
    const category = categoryFromText(combined, source);
    const title = fallbackTitle || source.name;

    return makeCompatibleItem({
      title,
      source,
      url,
      category,
      score,
      summary:
        source.description ||
        "Diese Quelle konnte nicht vollständig automatisch gelesen werden. Sie bleibt trotzdem im Monitor, weil sie fachlich relevant ist.",
      recommendation:
        "Quelle manuell öffnen und prüfen. Die Webseite blockiert eventuell automatische Abfragen oder liefert keine gut lesbaren Metadaten.",
      impact:
        "Die Quelle bleibt als Beobachtungsquelle wichtig, sollte aber bei Bedarf direkt geöffnet werden.",
      warning: error.message
    });
  }
}

async function main() {
  await fs.mkdir("public/data", { recursive: true });

  const rawSources = await fs.readFile(SOURCES_PATH, "utf8");
  const sources = JSON.parse(rawSources);

  const items = [];

  for (const source of sources) {
    if (!source?.url || !source?.name) continue;

    console.log(`Prüfe Quelle: ${source.name}`);

    const sourceUrl = normalizeUrl(source.url, source.url);
    if (!sourceUrl) continue;

    const mainItem = await buildItem(source, sourceUrl, source.name);
    items.push(mainItem);

    try {
      const html = await fetchHtml(sourceUrl);
      const links = extractLinks(html, sourceUrl, source);

      for (const link of links) {
        const item = await buildItem(source, link.url, link.title);
        if (item.score >= 50) {
          items.push(item);
        }
      }
    } catch (error) {
      console.log(`Links konnten nicht gelesen werden: ${source.name} (${error.message})`);
    }
  }

  const unique = new Map();

  for (const item of items) {
    if (!item.url || item.url.startsWith("javascript:")) continue;
    if (!unique.has(item.url)) {
      unique.set(item.url, item);
    }
  }

  const sortedItems = Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ITEMS_TOTAL);

  const topItems = sortedItems.slice(0, 10);

  const briefing = {
    updatedAt: new Date().toISOString(),
    title: "Briefing Frauen, Sport & Förderung",
    intro:
      "Automatisch erzeugtes Briefing aus öffentlichen Quellen zu Frauenförderung, Frauensport, Gleichstellung, Fördermitteln und Vereinsentwicklung.",
    highlights: topItems.map((item) => ({
      title: item.title,
      source: item.source,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      url: item.url,
      category: item.category,
      region: item.region,
      score: item.score,
      urgency: item.urgency,
      summary: item.summary,
      recommendation: item.recommendation,
      impact: item.impact
    })),
    projectIdeas: PROJECT_IDEAS
  };

  await fs.writeFile(ITEMS_PATH, JSON.stringify(sortedItems, null, 2), "utf8");
  await fs.writeFile(BRIEFING_PATH, JSON.stringify(briefing, null, 2), "utf8");

  console.log(`Fertig. ${sortedItems.length} Dashboard-Einträge geschrieben.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
