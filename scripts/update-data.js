import fs from "node:fs/promises";

const SOURCES_PATH = "public/data/sources.json";
const ITEMS_PATH = "public/data/items.json";
const BRIEFING_PATH = "public/data/briefing.json";

const IMPORTANT_WORDS = [
  "frauen",
  "mädchen",
  "maedchen",
  "gleichstellung",
  "geschlechtergerechtigkeit",
  "förderung",
  "foerderung",
  "fördermittel",
  "foerdermittel",
  "zuschuss",
  "projekt",
  "sport",
  "sportverein",
  "verein",
  "trainerin",
  "trainerinnen",
  "übungsleiterin",
  "uebungsleiterin",
  "ehrenamt",
  "führung",
  "fuehrung",
  "bayern",
  "augsburg",
  "integration",
  "inklusion",
  "teillhabe",
  "gewaltschutz",
  "safe sport",
  "prävention",
  "praevention",
  "frist",
  "antrag",
  "bewerbung",
  "ausschreibung",
  "call"
];

const HIGH_PRIORITY_WORDS = [
  "fördermittel",
  "foerdermittel",
  "zuschuss",
  "frist",
  "antrag",
  "ausschreibung",
  "augsburg",
  "bayern",
  "sportverein",
  "mädchen",
  "maedchen",
  "frauen im sport",
  "trainerinnen"
];

function normalize(text = "") {
  return text
    .toString()
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripHtml(html = "") {
  return normalize(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function extractTitle(html, fallback) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og?.[1]) return normalize(og[1]);

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title?.[1]) return normalize(stripHtml(title[1]));

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) return normalize(stripHtml(h1[1]));

  return fallback;
}

function extractDescription(html, fallback) {
  const meta =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

  if (meta?.[1]) return normalize(meta[1]);

  const text = stripHtml(html);
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return normalize(sentences.slice(0, 3).join(" ")) || fallback;
}

function absoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const label = normalize(stripHtml(match[2]));

    if (!href || !label || label.length < 8) continue;
    if (href.startsWith("#")) continue;
    if (href.startsWith("mailto:")) continue;
    if (href.startsWith("tel:")) continue;

    const url = absoluteUrl(baseUrl, href);
    if (!url) continue;

    links.push({ title: label, url });
  }

  const unique = new Map();
  for (const link of links) {
    if (!unique.has(link.url)) unique.set(link.url, link);
  }

  return Array.from(unique.values()).slice(0, 80);
}

function scoreText(text, source = {}) {
  const lower = text.toLowerCase();
  let score = source.priority || 40;

  for (const word of IMPORTANT_WORDS) {
    if (lower.includes(word.toLowerCase())) score += 3;
  }

  for (const word of HIGH_PRIORITY_WORDS) {
    if (lower.includes(word.toLowerCase())) score += 7;
  }

  if (lower.includes("augsburg")) score += 14;
  if (lower.includes("bayern")) score += 10;
  if (lower.includes("förder") || lower.includes("foerder")) score += 12;
  if (lower.includes("frist") || lower.includes("antrag")) score += 12;
  if (lower.includes("sportverein") || lower.includes("verein")) score += 10;
  if (lower.includes("frauen") || lower.includes("mädchen") || lower.includes("maedchen")) score += 12;

  return Math.max(30, Math.min(100, score));
}

function categoryFromText(text, source = {}) {
  const lower = text.toLowerCase();

  if (lower.includes("förder") || lower.includes("foerder") || lower.includes("zuschuss") || lower.includes("antrag")) {
    return "Fördermittel";
  }

  if (lower.includes("augsburg")) return "Augsburg";
  if (lower.includes("bayern") || source.region === "Bayern") return "Bayern";
  if (lower.includes("mädchen") || lower.includes("maedchen")) return "Mädchen im Sport";
  if (lower.includes("frauen")) return "Frauen im Sport";
  if (lower.includes("inklusion")) return "Inklusion";
  if (lower.includes("integration")) return "Integration";
  if (lower.includes("ehrenamt")) return "Ehrenamt";
  if (lower.includes("gleichstellung")) return "Gleichstellung";

  return source.type || "Info";
}

function recommendation(score, category, text) {
  const lower = text.toLowerCase();

  if (score >= 90) {
    return "Sofort prüfen: Diese Information ist sehr relevant für Frauenförderung, Sportverein oder Fördermöglichkeiten.";
  }

  if (category === "Fördermittel") {
    return "Förderfähigkeit prüfen: Diese Quelle kann für Projektanträge, Zuschüsse oder Fristen wichtig sein.";
  }

  if (lower.includes("augsburg")) {
    return "Lokal relevant: Für den Verein in Augsburg genauer prüfen und ggf. Ansprechpartner kontaktieren.";
  }

  if (lower.includes("bayern")) {
    return "Für Bayern relevant: Als mögliche Grundlage für Vereinsentwicklung oder Projektplanung nutzen.";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen") || lower.includes("frauen")) {
    return "Für Projektideen nutzen: Geeignet für Mädchenförderung, Trainerinnengewinnung oder Frauen im Verein.";
  }

  return "Beobachten: Als Hintergrundinformation speichern und bei passenden Projekten erneut prüfen.";
}

function makeSummary(title, description, source) {
  const clean = normalize(description);
  const short = clean.length > 360 ? `${clean.slice(0, 357)}...` : clean;

  return short || `Aktuelle Information aus der Quelle ${source.name}. Diese Quelle ist für Frauenförderung, Sport, Gleichstellung oder Fördermittel relevant.`;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FrauenSport-Foerdermonitor/1.0 (+https://github.com/galgental9ps-png/frauen-sport-f-rdermonitor)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function buildItemFromUrl(source, url, fallbackTitle = null) {
  try {
    const html = await fetchHtml(url);
    const title = extractTitle(html, fallbackTitle || source.name);
    const description = extractDescription(html, source.description || "");
    const combined = `${title} ${description} ${(source.keywords || []).join(" ")}`;

    const score = scoreText(combined, source);
    const category = categoryFromText(combined, source);

    return {
      id: Buffer.from(url).toString("base64url").slice(0, 18),
      title,
      sourceName: source.name,
      sourceType: source.type || "Quelle",
      region: source.region || "Deutschland",
      category,
      url,
      score,
      summary: makeSummary(title, description, source),
      recommendation: recommendation(score, category, combined),
      keywords: source.keywords || [],
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    const combined = `${source.name} ${source.description || ""} ${(source.keywords || []).join(" ")}`;
    const score = scoreText(combined, source);
    const category = categoryFromText(combined, source);

    return {
      id: Buffer.from(url).toString("base64url").slice(0, 18),
      title: fallbackTitle || source.name,
      sourceName: source.name,
      sourceType: source.type || "Quelle",
      region: source.region || "Deutschland",
      category,
      url,
      score,
      summary: source.description || "Diese Quelle konnte nicht vollständig automatisch gelesen werden. Der Link bleibt als wichtige Beobachtungsquelle gespeichert.",
      recommendation: "Quelle manuell prüfen: Die Webseite blockiert eventuell automatische Abfragen oder liefert keine gut lesbaren Artikeldaten.",
      keywords: source.keywords || [],
      checkedAt: new Date().toISOString(),
      warning: error.message
    };
  }
}

async function main() {
  await fs.mkdir("public/data", { recursive: true });

  const raw = await fs.readFile(SOURCES_PATH, "utf8");
  const sources = JSON.parse(raw);

  const items = [];

  for (const source of sources) {
    console.log(`Prüfe Quelle: ${source.name}`);

    let sourceHtml = null;

    try {
      sourceHtml = await fetchHtml(source.url);
    } catch {
      sourceHtml = null;
    }

    const mainItem = await buildItemFromUrl(source, source.url, source.name);
    items.push(mainItem);

    if (sourceHtml) {
      const links = extractLinks(sourceHtml, source.url);

      const relevantLinks = links
        .map((link) => {
          const text = `${link.title} ${link.url} ${(source.keywords || []).join(" ")}`;
          return {
            ...link,
            score: scoreText(text, source)
          };
        })
        .filter((link) => link.score >= 70)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      for (const link of relevantLinks) {
        const item = await buildItemFromUrl(source, link.url, link.title);
        items.push(item);
      }
    }
  }

  const unique = new Map();
  for (const item of items) {
    if (!unique.has(item.url)) unique.set(item.url, item);
  }

  const sortedItems = Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);

  const topItems = sortedItems.slice(0, 8);

  const briefing = {
    updatedAt: new Date().toISOString(),
    title: "Wochenbriefing Frauen, Sport & Förderung",
    intro: "Automatisch erzeugtes Briefing aus den wichtigsten Quellen für Frauenförderung, Frauensport, Gleichstellung, Fördermittel und Vereinsentwicklung.",
    highlights: topItems.map((item) => ({
      title: item.title,
      sourceName: item.sourceName,
      category: item.category,
      region: item.region,
      score: item.score,
      summary: item.summary,
      recommendation: item.recommendation,
      url: item.url
    }))
  };

  await fs.writeFile(ITEMS_PATH, JSON.stringify(sortedItems, null, 2), "utf8");
  await fs.writeFile(BRIEFING_PATH, JSON.stringify(briefing, null, 2), "utf8");

  console.log(`Fertig. ${sortedItems.length} Einträge geschrieben.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
