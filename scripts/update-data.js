import fs from "node:fs/promises";

const SOURCES_PATH = "public/data/sources.json";
const ITEMS_PATH = "public/data/items.json";
const BRIEFING_PATH = "public/data/briefing.json";

const MAX_LINKS_PER_SOURCE = 4;
const MAX_ITEMS_TOTAL = 120;
const FETCH_TIMEOUT_MS = 12000;

const CORE_WOMEN_TERMS = [
  "frauen",
  "frau",
  "mädchen",
  "maedchen",
  "girls",
  "women",
  "trainerin",
  "trainerinnen",
  "übungsleiterin",
  "uebungsleiterin",
  "vorständin",
  "mentorinnen",
  "frauenförderung",
  "frauenfoerderung",
  "mädchenförderung",
  "maedchenfoerderung",
  "frauen im sport",
  "mädchen im sport",
  "maedchen im sport"
];

const SPORT_TERMS = [
  "sport",
  "sportverein",
  "sportvereine",
  "verein",
  "vereine",
  "breitensport",
  "vereinssport",
  "training",
  "trainer",
  "trainerinnen",
  "übungsleiter",
  "uebungsleiter",
  "sportstätte",
  "sportstaette",
  "sportstätten",
  "sportstaetten",
  "blsv",
  "dosb",
  "landessportbund"
];

const FUNDING_TERMS = [
  "fördermittel",
  "foerdermittel",
  "förderprogramm",
  "foerderprogramm",
  "förderung",
  "foerderung",
  "zuschuss",
  "zuwendung",
  "projektförderung",
  "projektfoerderung",
  "mikroförderung",
  "mikrofoerderung",
  "förderfähig",
  "foerderfaehig",
  "antragsberechtigt",
  "antragstellung",
  "antrag stellen",
  "beantragen",
  "förderrichtlinie",
  "foerderrichtlinie",
  "ausschreibung",
  "call for proposals",
  "grant",
  "funding",
  "cerv",
  "erasmus+"
];

const DEADLINE_TERMS = [
  "frist",
  "deadline",
  "bewerbungsfrist",
  "antragsfrist",
  "einsendeschluss",
  "bis zum",
  "stichtag"
];

const REGION_TERMS = [
  "augsburg",
  "stadt augsburg",
  "landkreis augsburg",
  "bayern",
  "bayerisch",
  "schwaben",
  "blsv"
];

const EQUALITY_TERMS = [
  "gleichstellung",
  "geschlechtergerechtigkeit",
  "chancengleichheit",
  "gleichberechtigung",
  "diversität",
  "diversitaet",
  "teilhabe",
  "diskriminierung",
  "antidiskriminierung",
  "inklusion",
  "integration",
  "migration",
  "gewaltschutz",
  "safe sport",
  "prävention",
  "praevention",
  "schutzkonzept"
];

const ACTION_TERMS = [
  "projekt",
  "programm",
  "initiative",
  "maßnahme",
  "massnahme",
  "workshop",
  "qualifizierung",
  "fortbildung",
  "mentoring",
  "netzwerk",
  "veranstaltung",
  "beratung",
  "kampagne",
  "leitfaden",
  "praxisbeispiel"
];

const NEGATIVE_TERMS = [
  "impressum",
  "datenschutz",
  "privacy",
  "cookie",
  "cookies",
  "kontakt",
  "login",
  "anmelden",
  "registrieren",
  "newsletter",
  "pressekontakt",
  "jobs",
  "karriere",
  "stellenangebote",
  "sitemap",
  "barrierefreiheitserklärung",
  "barrierefreiheitserklaerung",
  "leichte sprache",
  "gebärdensprache",
  "gebaerdensprache",
  "vorlesen",
  "teilen",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "twitter",
  "x.com"
];

const LOW_RELEVANCE_SPORT_POLITICS = [
  "olympische spiele",
  "paralympische spiele",
  "olympia-bewerbung",
  "olympiabewerbung",
  "deutsche olympiabewerbung",
  "leistungssport",
  "spitzensport",
  "nationalmannschaft",
  "bundesliga",
  "meisterschaft",
  "weltmeisterschaft",
  "europameisterschaft"
];

const PROJECT_IDEAS = [
  {
    title: "Mädchen bleiben im Verein",
    goal: "Mädchen langfristig im Verein halten und Drop-out reduzieren.",
    actions: [
      "Trainerinnen als Vorbilder sichtbar machen",
      "sichere Trainingszeiten und geschützte Räume prüfen",
      "Mädchen gezielt nach Bedürfnissen befragen",
      "Elternkommunikation verbessern"
    ]
  },
  {
    title: "Trainerinnen gewinnen",
    goal: "Mehr Frauen als Übungsleiterinnen, Trainerinnen und Betreuerinnen gewinnen.",
    actions: [
      "junge Frauen direkt ansprechen",
      "Ausbildungskosten und Fördermöglichkeiten prüfen",
      "Mentoring durch erfahrene Trainerinnen anbieten",
      "weibliche Vorbilder öffentlich sichtbar machen"
    ]
  },
  {
    title: "Frauen in Führung",
    goal: "Frauen stärker in Vorstand, Abteilungsleitung und Projektleitung bringen.",
    actions: [
      "familienfreundliche Sitzungszeiten prüfen",
      "Qualifizierung und Coaching anbieten",
      "Frauen gezielt für Gremien ansprechen",
      "Aufgaben in kleine, machbare Rollen aufteilen"
    ]
  },
  {
    title: "Sport für Frauen mit wenig Zugang",
    goal: "Frauen erreichen, die bisher wenig Zugang zum Vereinssport haben.",
    actions: [
      "niedrigschwellige Angebote schaffen",
      "Kinderbetreuung oder familienfreundliche Zeiten prüfen",
      "Kooperationen mit Stadt, Schulen und sozialen Trägern starten",
      "Integration, Gesundheit und Teilhabe verbinden"
    ]
  },
  {
    title: "Sicherer Sport für Mädchen und Frauen",
    goal: "Schutz, Prävention und Vertrauen im Verein stärken.",
    actions: [
      "Schutzkonzept prüfen oder erstellen",
      "Ansprechpersonen sichtbar machen",
      "Safe-Sport-Schulungen anbieten",
      "Diskriminierung und Gewaltprävention aktiv behandeln"
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
      .replace(/Impressum/gi, " ")
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
    .filter((s) => s.length >= 45 && s.length <= 340);
}

function countHits(text, terms) {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => {
    return lower.includes(term.toLowerCase()) ? count + 1 : count;
  }, 0);
}

function hasAny(text, terms) {
  return countHits(text, terms) > 0;
}

function scoreText(text, source = {}) {
  const lower = text.toLowerCase();

  const womenHits = countHits(lower, CORE_WOMEN_TERMS);
  const sportHits = countHits(lower, SPORT_TERMS);
  const fundingHits = countHits(lower, FUNDING_TERMS);
  const deadlineHits = countHits(lower, DEADLINE_TERMS);
  const regionHits = countHits(lower, REGION_TERMS);
  const equalityHits = countHits(lower, EQUALITY_TERMS);
  const actionHits = countHits(lower, ACTION_TERMS);
  const negativeHits = countHits(lower, NEGATIVE_TERMS);
  const lowSportPoliticsHits = countHits(lower, LOW_RELEVANCE_SPORT_POLITICS);

  let score = 15;

  score += Math.min(Number(source.priority || 50), 100) * 0.25;

  score += womenHits * 10;
  score += sportHits * 6;
  score += fundingHits * 9;
  score += deadlineHits * 8;
  score += regionHits * 7;
  score += equalityHits * 5;
  score += actionHits * 4;

  const hasWomen = womenHits > 0;
  const hasSport = sportHits > 0;
  const hasFunding = fundingHits > 0;
  const hasDeadline = deadlineHits > 0;
  const hasRegion = regionHits > 0;
  const hasEquality = equalityHits > 0;

  if (hasWomen && hasSport) score += 16;
  if (hasWomen && hasFunding) score += 14;
  if (hasSport && hasFunding) score += 12;
  if (hasWomen && hasSport && hasFunding) score += 18;
  if (hasWomen && hasSport && hasRegion) score += 14;
  if (hasFunding && hasDeadline) score += 16;
  if (hasRegion && hasFunding) score += 10;
  if (hasEquality && hasSport) score += 7;

  if (lower.includes("augsburg")) score += 12;
  if (lower.includes("bayern") || lower.includes("blsv")) score += 9;
  if (lower.includes("sportverein")) score += 10;
  if (lower.includes("trainerinnen")) score += 10;
  if (lower.includes("frauen im sport") || lower.includes("mädchen im sport") || lower.includes("maedchen im sport")) score += 14;

  if (negativeHits > 0) score -= negativeHits * 18;

  if (lowSportPoliticsHits > 0 && !hasWomen && !hasFunding) {
    score -= 35;
  }

  if (lower.includes("bewerbung") && !hasFunding && !lower.includes("förder") && !lower.includes("foerder")) {
    score -= 18;
  }

  if (!hasWomen && !hasFunding && !hasEquality) {
    score -= 22;
  }

  if (!hasSport && !hasFunding && !hasRegion) {
    score -= 12;
  }

  if (lower.includes("impressum") || lower.includes("datenschutz") || lower.includes("barrierefreiheitserklärung")) {
    score = 0;
  }

  const qualifiesForTop =
    (hasWomen && hasSport && (hasFunding || hasRegion || hasEquality)) ||
    (hasFunding && hasSport && hasRegion) ||
    (hasFunding && hasWomen) ||
    (lower.includes("augsburg") && hasSport && (hasWomen || hasFunding));

  if (!qualifiesForTop && score > 84) {
    score = 84;
  }

  if (score >= 96 && !qualifiesForTop) {
    score = 84;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function categoryFromText(text, source = {}) {
  const lower = text.toLowerCase();

  const hasWomen = hasAny(lower, CORE_WOMEN_TERMS);
  const hasSport = hasAny(lower, SPORT_TERMS);
  const hasFunding = hasAny(lower, FUNDING_TERMS);
  const hasDeadline = hasAny(lower, DEADLINE_TERMS);
  const hasRegion = hasAny(lower, REGION_TERMS);
  const hasEquality = hasAny(lower, EQUALITY_TERMS);

  if (hasFunding && (hasSport || hasWomen || hasRegion || hasDeadline)) {
    return "Fördermittel";
  }

  if (lower.includes("augsburg") && (hasSport || hasWomen || hasFunding || hasEquality)) {
    return "Augsburg";
  }

  if ((lower.includes("bayern") || lower.includes("blsv")) && (hasSport || hasWomen || hasFunding)) {
    return "Bayern";
  }

  if (lower.includes("trainerin") || lower.includes("trainerinnen") || lower.includes("übungsleiterin") || lower.includes("uebungsleiterin")) {
    return "Trainerinnen";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen")) {
    return "Mädchen im Sport";
  }

  if (hasWomen && hasSport) {
    return "Frauen im Sport";
  }

  if (hasEquality) {
    return "Gleichstellung";
  }

  if (lower.includes("inklusion")) return "Inklusion";
  if (lower.includes("integration")) return "Integration";
  if (lower.includes("ehrenamt") || lower.includes("engagement")) return "Ehrenamt";
  if (lower.includes("safe sport") || lower.includes("gewaltschutz") || lower.includes("prävention") || lower.includes("praevention")) {
    return "Schutz & Prävention";
  }

  return source.type || "Info";
}

function urgencyFromScore(score, text) {
  const lower = text.toLowerCase();

  const hasFunding = hasAny(lower, FUNDING_TERMS);
  const hasDeadline = hasAny(lower, DEADLINE_TERMS);
  const hasWomen = hasAny(lower, CORE_WOMEN_TERMS);
  const hasSport = hasAny(lower, SPORT_TERMS);

  if (hasFunding && hasDeadline) return "Sofort prüfen";
  if (score >= 90 && (hasWomen || hasFunding) && hasSport) return "Sehr wichtig";
  if (score >= 75) return "Wichtig";
  if (score >= 55) return "Beobachten";
  return "Hintergrund";
}

function createRecommendation(score, category, text) {
  const lower = text.toLowerCase();

  const hasFunding = hasAny(lower, FUNDING_TERMS);
  const hasDeadline = hasAny(lower, DEADLINE_TERMS);
  const hasWomen = hasAny(lower, CORE_WOMEN_TERMS);
  const hasSport = hasAny(lower, SPORT_TERMS);
  const hasRegion = hasAny(lower, REGION_TERMS);

  if (hasFunding && hasDeadline) {
    return "Sofort prüfen: Förderfrist, Antragsberechtigung und mögliche Projektidee für den Verein klären.";
  }

  if (category === "Fördermittel" || hasFunding) {
    return "Förderchance prüfen: Passt möglicherweise für Projekte zu Mädchen, Frauen, Teilhabe, Ehrenamt, Inklusion oder Sportverein.";
  }

  if (lower.includes("augsburg") && (hasSport || hasWomen)) {
    return "Lokal relevant: Für den Verein in Augsburg prüfen und mögliche Ansprechpartner bei Stadt, Sportamt oder Gleichstellungsstelle notieren.";
  }

  if ((lower.includes("bayern") || lower.includes("blsv")) && (hasSport || hasWomen)) {
    return "Für Bayern relevant: Als Grundlage für Vereinsentwicklung, BLSV-Bezug, Mädchenförderung oder Frauenförderung im Verein prüfen.";
  }

  if (lower.includes("trainerin") || lower.includes("trainerinnen")) {
    return "Für Projektidee nutzen: Trainerinnen gewinnen, qualifizieren und als Vorbilder im Verein sichtbar machen.";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen")) {
    return "Für Mädchenförderung nutzen: Prüfen, ob daraus ein Projekt gegen Drop-out oder für mehr Teilhabe entstehen kann.";
  }

  if (hasWomen && hasSport) {
    return "Für Frauen im Sport relevant: Als Impuls für Angebote, Führung, Ehrenamt oder Öffentlichkeitsarbeit im Verein prüfen.";
  }

  if (hasRegion) {
    return "Regional beobachten: Kann für Augsburg, Bayern oder lokale Kooperationen relevant werden.";
  }

  if (score >= 80) {
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
    return "Hoher lokaler Mehrwert, weil Augsburg-Bezug direkte Handlungsmöglichkeiten für Verein, Stadt oder Partner eröffnen kann.";
  }

  if (lower.includes("bayern") || lower.includes("blsv")) {
    return "Wichtig für Sportvereine in Bayern und mögliche Maßnahmen über BLSV, Land oder Kommune.";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen")) {
    return "Kann konkrete Projekte für Mädchen im Sport, Mitgliederbindung und sichere Teilnahme unterstützen.";
  }

  if (lower.includes("trainerin") || lower.includes("trainerinnen")) {
    return "Kann helfen, mehr weibliche Vorbilder, Übungsleiterinnen und Trainerinnen im Verein aufzubauen.";
  }

  if (lower.includes("frauen")) {
    return "Kann Frauenförderung, Sichtbarkeit und Beteiligung im Verein stärken.";
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

    if (score < 58) continue;
    if (countHits(combined, NEGATIVE_TERMS) > 0) continue;

    links.push({
      title: cleanText(label).slice(0, 170),
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
  const combined = `${title} ${summary} ${recommendation}`;
  const urgency = urgencyFromScore(score, combined);

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

function shouldKeepItem(item) {
  const text = `${item.title} ${item.summary} ${item.recommendation} ${item.category}`.toLowerCase();

  if (!item.url || item.url.startsWith("javascript:")) return false;
  if (countHits(text, NEGATIVE_TERMS) > 0) return false;

  const hasWomen = hasAny(text, CORE_WOMEN_TERMS);
  const hasSport = hasAny(text, SPORT_TERMS);
  const hasFunding = hasAny(text, FUNDING_TERMS);
  const hasRegion = hasAny(text, REGION_TERMS);
  const hasEquality = hasAny(text, EQUALITY_TERMS);

  if (item.score >= 75) return true;
  if (hasWomen && hasSport) return true;
  if (hasFunding && (hasSport || hasWomen || hasRegion)) return true;
  if (hasEquality && (hasSport || hasRegion || hasWomen)) return true;

  return item.score >= 55;
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
    if (shouldKeepItem(mainItem)) {
      items.push(mainItem);
    }

    try {
      const html = await fetchHtml(sourceUrl);
      const links = extractLinks(html, sourceUrl, source);

      for (const link of links) {
        const item = await buildItem(source, link.url, link.title);

        if (shouldKeepItem(item)) {
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

    const existing = unique.get(item.url);

    if (!existing || item.score > existing.score) {
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
