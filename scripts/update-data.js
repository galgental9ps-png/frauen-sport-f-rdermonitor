import fs from "node:fs/promises";

const SOURCES_PATH = "public/data/sources.json";
const ITEMS_PATH = "public/data/items.json";
const BRIEFING_PATH = "public/data/briefing.json";

const MAX_LINKS_PER_SOURCE = 6;
const MAX_ITEMS_TOTAL = 140;
const FETCH_TIMEOUT_MS = 12000;

const WOMEN_TERMS = [
  "frauen",
  "frau",
  "mädchen",
  "maedchen",
  "girls",
  "women",
  "weiblich",
  "trainerin",
  "trainerinnen",
  "übungsleiterin",
  "uebungsleiterin",
  "sportlerin",
  "sportlerinnen",
  "athletin",
  "athletinnen",
  "vorständin",
  "vorständinnen",
  "mentorinnen",
  "mädchensport",
  "maedchensport",
  "frauensport",
  "frauen im sport",
  "mädchen im sport",
  "maedchen im sport"
];

const SPORT_CLUB_TERMS = [
  "sport",
  "sportverein",
  "sportvereine",
  "verein",
  "vereine",
  "vereinssport",
  "breitensport",
  "training",
  "trainingsgruppe",
  "mannschaft",
  "abteilung",
  "trainer",
  "trainerin",
  "trainerinnen",
  "übungsleiter",
  "uebungsleiter",
  "übungsleiterin",
  "uebungsleiterin",
  "ehrenamt",
  "engagement",
  "vorstand",
  "vereinsführung",
  "vereinsfuehrung",
  "sportjugend",
  "blsv",
  "dosb",
  "landessportbund"
];

const PRACTICE_TERMS = [
  "projekt",
  "praxis",
  "praxisbeispiel",
  "best practice",
  "gute praxis",
  "initiative",
  "maßnahme",
  "massnahme",
  "angebot",
  "programm",
  "kampagne",
  "workshop",
  "aktion",
  "leitfaden",
  "konzept",
  "handreichung",
  "checkliste",
  "strategie",
  "empfehlung",
  "tipps",
  "material",
  "toolbox"
];

const DEVELOPMENT_TERMS = [
  "vereinsentwicklung",
  "mitgliedergewinnung",
  "mitgliederbindung",
  "drop-out",
  "dropout",
  "teilhabe",
  "partizipation",
  "sichtbarkeit",
  "vorbild",
  "vorbilder",
  "mentoring",
  "qualifizierung",
  "fortbildung",
  "ausbildung",
  "führung",
  "fuehrung",
  "gremien",
  "vorstand",
  "ehrenamt",
  "engagement",
  "netzwerk",
  "kommunikation",
  "ansprache"
];

const EQUALITY_TERMS = [
  "gleichstellung",
  "gleichberechtigung",
  "geschlechtergerechtigkeit",
  "chancengleichheit",
  "diversität",
  "diversitaet",
  "diskriminierung",
  "antidiskriminierung",
  "sexismus",
  "rollenbilder",
  "stereotype",
  "gender",
  "gleichstellung im sport"
];

const PROTECTION_TERMS = [
  "safe sport",
  "schutzkonzept",
  "gewaltschutz",
  "prävention",
  "praevention",
  "sexualisierte gewalt",
  "belästigung",
  "belaestigung",
  "missbrauch",
  "diskriminierung",
  "ansprechperson",
  "beschwerde",
  "sicherheit",
  "sicherer sport"
];

const INCLUSION_TERMS = [
  "inklusion",
  "integration",
  "migration",
  "barrierefrei",
  "behinderung",
  "teilhabe",
  "vielfalt",
  "diversität",
  "diversitaet",
  "interkulturell",
  "niedrigschwellig",
  "sozial benachteiligt"
];

const HEALTH_TERMS = [
  "gesundheit",
  "bewegung",
  "körperbild",
  "koerperbild",
  "selbstbewusstsein",
  "psychische gesundheit",
  "menstruation",
  "zyklus",
  "pubertät",
  "pubertaet",
  "gewaltprävention",
  "gewaltpraevention"
];

const REGION_TERMS = [
  "augsburg",
  "stadt augsburg",
  "landkreis augsburg",
  "bayern",
  "bayerisch",
  "schwaben",
  "blsv",
  "sportjugend bayern"
];

const MONEY_TERMS = [
  "fördermittel",
  "foerdermittel",
  "förderprogramm",
  "foerderprogramm",
  "förderung",
  "foerderung",
  "zuschuss",
  "zuwendung",
  "geld",
  "finanzierung",
  "antrag",
  "antragsfrist",
  "beantragen",
  "grant",
  "funding",
  "erasmus+",
  "cerv"
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
  "x.com",
  "warenkorb",
  "shop",
  "ticket",
  "tickets"
];

const LOW_RELEVANCE_TERMS = [
  "olympische spiele",
  "paralympische spiele",
  "olympiabewerbung",
  "olympia-bewerbung",
  "bundesliga",
  "weltmeisterschaft",
  "europameisterschaft",
  "meisterschaft",
  "nationalmannschaft",
  "leistungssport",
  "spitzensport",
  "transfermarkt",
  "spielbericht",
  "tabellenstand",
  "ergebnis",
  "live ticker",
  "liveticker"
];

const PROJECT_IDEAS = [
  {
    title: "Mädchen bleiben im Verein",
    goal: "Mädchen langfristig im Verein halten und Drop-out reduzieren.",
    actions: [
      "Mädchen gezielt nach ihren Bedürfnissen fragen",
      "Trainerinnen und weibliche Vorbilder sichtbar machen",
      "sichere Trainingszeiten und geschützte Räume prüfen",
      "Elternkommunikation verbessern"
    ]
  },
  {
    title: "Trainerinnen gewinnen",
    goal: "Mehr Frauen als Übungsleiterinnen, Trainerinnen und Betreuerinnen gewinnen.",
    actions: [
      "junge Frauen im Verein direkt ansprechen",
      "Mentoring durch erfahrene Trainerinnen anbieten",
      "kleine Einstiegsrollen schaffen",
      "Trainerinnen öffentlich sichtbar machen"
    ]
  },
  {
    title: "Frauen in Führung",
    goal: "Frauen stärker in Vorstand, Abteilungsleitung und Projektleitung bringen.",
    actions: [
      "familienfreundliche Sitzungszeiten prüfen",
      "Frauen gezielt für Gremien ansprechen",
      "Aufgaben in kleine Rollen aufteilen",
      "Führungstandem oder Mentoring einführen"
    ]
  },
  {
    title: "Sicherer Sport für Mädchen und Frauen",
    goal: "Schutz, Vertrauen und Prävention im Verein stärken.",
    actions: [
      "Schutzkonzept prüfen oder erstellen",
      "Ansprechpersonen sichtbar machen",
      "Safe-Sport-Schulungen anbieten",
      "Beschwerdewege klar kommunizieren"
    ]
  },
  {
    title: "Sichtbarkeit von Frauen im Verein",
    goal: "Sportlerinnen, Trainerinnen und Ehrenamtliche sichtbarer machen.",
    actions: [
      "Frauen regelmäßig auf Webseite und Social Media zeigen",
      "Erfolgsgeschichten erzählen",
      "weibliche Vorbilder bei Veranstaltungen einbinden",
      "Sprache und Bilder im Verein prüfen"
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

function isAllowedUrl(url, sourceUrl) {
  try {
    const target = new URL(url);
    const source = new URL(sourceUrl);

    if (!["http:", "https:"].includes(target.protocol)) return false;

    const targetHost = target.hostname.replace(/^www\./, "");
    const sourceHost = source.hostname.replace(/^www\./, "");

    return targetHost === sourceHost || targetHost.endsWith(`.${sourceHost}`);
  } catch {
    return false;
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
    .map((sentence) => cleanText(sentence))
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 360);
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

  const womenHits = countHits(lower, WOMEN_TERMS);
  const sportHits = countHits(lower, SPORT_CLUB_TERMS);
  const practiceHits = countHits(lower, PRACTICE_TERMS);
  const developmentHits = countHits(lower, DEVELOPMENT_TERMS);
  const equalityHits = countHits(lower, EQUALITY_TERMS);
  const protectionHits = countHits(lower, PROTECTION_TERMS);
  const inclusionHits = countHits(lower, INCLUSION_TERMS);
  const healthHits = countHits(lower, HEALTH_TERMS);
  const regionHits = countHits(lower, REGION_TERMS);
  const moneyHits = countHits(lower, MONEY_TERMS);
  const negativeHits = countHits(lower, NEGATIVE_TERMS);
  const lowRelevanceHits = countHits(lower, LOW_RELEVANCE_TERMS);

  const hasWomen = womenHits > 0;
  const hasSport = sportHits > 0;
  const hasPractice = practiceHits > 0;
  const hasDevelopment = developmentHits > 0;
  const hasEquality = equalityHits > 0;
  const hasProtection = protectionHits > 0;
  const hasInclusion = inclusionHits > 0;
  const hasHealth = healthHits > 0;
  const hasRegion = regionHits > 0;

  let score = 8;

  score += Math.min(Number(source.priority || 50), 100) * 0.18;

  score += womenHits * 12;
  score += sportHits * 7;
  score += practiceHits * 6;
  score += developmentHits * 6;
  score += equalityHits * 5;
  score += protectionHits * 7;
  score += inclusionHits * 4;
  score += healthHits * 4;
  score += regionHits * 6;

  if (hasWomen && hasSport) score += 20;
  if (hasWomen && hasSport && hasPractice) score += 18;
  if (hasWomen && hasSport && hasDevelopment) score += 16;
  if (hasWomen && hasSport && hasEquality) score += 14;
  if (hasWomen && hasSport && hasProtection) score += 16;
  if (hasWomen && hasSport && hasRegion) score += 14;
  if (hasWomen && hasSport && hasInclusion) score += 10;
  if (hasWomen && hasSport && hasHealth) score += 8;

  if (lower.includes("sportverein")) score += 12;
  if (lower.includes("trainerinnen")) score += 14;
  if (lower.includes("frauen in führung") || lower.includes("frauen in fuehrung")) score += 14;
  if (lower.includes("mädchen im sport") || lower.includes("maedchen im sport")) score += 14;
  if (lower.includes("frauen im sport")) score += 14;
  if (lower.includes("safe sport")) score += 10;
  if (lower.includes("schutzkonzept")) score += 10;
  if (lower.includes("best practice") || lower.includes("praxisbeispiel")) score += 10;
  if (lower.includes("augsburg")) score += 8;
  if (lower.includes("bayern") || lower.includes("blsv")) score += 7;

  if (moneyHits > 0) score -= moneyHits * 5;
  if (negativeHits > 0) score -= negativeHits * 22;
  if (lowRelevanceHits > 0) score -= lowRelevanceHits * 14;

  if (lowRelevanceHits > 0 && !hasWomen && !hasEquality && !hasProtection) {
    score -= 35;
  }

  if (!hasWomen && !hasEquality && !hasProtection) {
    score -= 25;
  }

  if (!hasSport && !hasPractice && !hasDevelopment) {
    score -= 16;
  }

  if (lower.includes("impressum") || lower.includes("datenschutz") || lower.includes("barrierefreiheitserklärung")) {
    score = 0;
  }

  const qualifiesForTop =
    (hasWomen && hasSport && (hasPractice || hasDevelopment || hasEquality || hasProtection || hasRegion)) ||
    (hasWomen && hasSport && lower.includes("trainerinnen")) ||
    (hasWomen && hasSport && lower.includes("sportverein")) ||
    (hasWomen && hasSport && lower.includes("mädchen")) ||
    (hasProtection && hasSport && hasWomen);

  if (!qualifiesForTop && score > 82) {
    score = 82;
  }

  if (moneyHits > 0 && !hasWomen && !hasSport) {
    score = Math.min(score, 45);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function categoryFromText(text, source = {}) {
  const lower = text.toLowerCase();

  if (lower.includes("trainerin") || lower.includes("trainerinnen") || lower.includes("übungsleiterin") || lower.includes("uebungsleiterin")) {
    return "Trainerinnen";
  }

  if (lower.includes("mädchen") || lower.includes("maedchen") || lower.includes("girls")) {
    return "Mädchen im Sport";
  }

  if (
    lower.includes("frauen in führung") ||
    lower.includes("frauen in fuehrung") ||
    lower.includes("vorstand") ||
    lower.includes("gremien") ||
    lower.includes("führung") ||
    lower.includes("fuehrung")
  ) {
    return "Frauen in Führung";
  }

  if (
    lower.includes("safe sport") ||
    lower.includes("schutzkonzept") ||
    lower.includes("gewaltschutz") ||
    lower.includes("prävention") ||
    lower.includes("praevention") ||
    lower.includes("sexualisierte gewalt")
  ) {
    return "Schutz & Prävention";
  }

  if (lower.includes("gleichstellung") || lower.includes("geschlechtergerechtigkeit") || lower.includes("chancengleichheit")) {
    return "Gleichstellung";
  }

  if (lower.includes("inklusion") || lower.includes("behinderung") || lower.includes("barrierefrei")) {
    return "Inklusion";
  }

  if (lower.includes("integration") || lower.includes("migration") || lower.includes("interkulturell")) {
    return "Integration & Teilhabe";
  }

  if (lower.includes("gesundheit") || lower.includes("bewegung") || lower.includes("selbstbewusstsein")) {
    return "Gesundheit";
  }

  if (lower.includes("praxisbeispiel") || lower.includes("best practice") || lower.includes("gute praxis")) {
    return "Best Practice";
  }

  if (lower.includes("vereinsentwicklung") || lower.includes("mitgliederbindung") || lower.includes("ehrenamt")) {
    return "Vereinsentwicklung";
  }

  if (lower.includes("augsburg") || lower.includes("bayern") || lower.includes("blsv")) {
    return "Augsburg/Bayern";
  }

  if (hasAny(lower, WOMEN_TERMS) && hasAny(lower, SPORT_CLUB_TERMS)) {
    return "Frauen im Sport";
  }

  return source.type || "Frauen im Sport";
}

function urgencyFromScore(score, text) {
  const lower = text.toLowerCase();

  if (
    lower.includes("schutzkonzept") ||
    lower.includes("safe sport") ||
    lower.includes("sexualisierte gewalt") ||
    lower.includes("prävention") ||
    lower.includes("praevention")
  ) {
    return "Sofort prüfen";
  }

  if (score >= 90) return "Sehr wichtig";
  if (score >= 75) return "Wichtig";
  if (score >= 55) return "Beobachten";
  return "Hintergrund";
}

function createRecommendation(score, category, text) {
  const lower = text.toLowerCase();

  if (category === "Schutz & Prävention") {
    return "Im Verein prüfen: Schutzkonzept, Ansprechpersonen, Beschwerdewege und Präventionsschulungen mit Blick auf Mädchen und Frauen weiterentwickeln.";
  }

  if (category === "Trainerinnen") {
    return "Als Projektidee nutzen: Trainerinnen gezielt ansprechen, Mentoring anbieten und weibliche Vorbilder im Verein sichtbarer machen.";
  }

  if (category === "Mädchen im Sport") {
    return "Als Maßnahme für Mädchenbindung prüfen: Bedürfnisse von Mädchen abfragen, sichere Trainingsumgebung schaffen und passende Angebote entwickeln.";
  }

  if (category === "Frauen in Führung") {
    return "Im Vorstand besprechen: Wie können Frauen leichter Verantwortung übernehmen, welche Rollen sind machbar und welche Unterstützung brauchen sie?";
  }

  if (category === "Gleichstellung") {
    return "Als strategischen Impuls nutzen: Sprache, Bilder, Rollenverteilung, Sichtbarkeit und Beteiligung von Frauen im Verein prüfen.";
  }

  if (category === "Inklusion" || category === "Integration & Teilhabe") {
    return "Für niedrigschwellige Angebote prüfen: Frauen und Mädchen mit wenig Zugang zum Vereinssport gezielt erreichen und Barrieren abbauen.";
  }

  if (category === "Best Practice") {
    return "Als Vorbild speichern: Prüfen, welche Idee auf den eigenen Verein übertragen werden kann.";
  }

  if (category === "Vereinsentwicklung") {
    return "Für die Vereinsentwicklung nutzen: Als Thema für Vorstand, Abteilungen oder nächste Projektplanung aufnehmen.";
  }

  if (lower.includes("augsburg") || lower.includes("bayern") || lower.includes("blsv")) {
    return "Regional relevant: Für Augsburg/Bayern prüfen und mögliche Kontakte, Partner oder Maßnahmen für den Verein ableiten.";
  }

  if (score >= 80) {
    return "Intern bewerten: Thema ist relevant für Frauenförderung, Mädchen im Sport oder Vereinsentwicklung.";
  }

  return "Beobachten: Als Hintergrundinformation speichern und bei passenden Vereinsprojekten erneut prüfen.";
}

function createImpact(score, category, text) {
  const lower = text.toLowerCase();

  if (category === "Trainerinnen") {
    return "Kann helfen, mehr weibliche Vorbilder, Übungsleiterinnen und Trainerinnen im Verein aufzubauen.";
  }

  if (category === "Mädchen im Sport") {
    return "Kann Mädchen im Verein stärken, Bindung verbessern und sichere Teilhabe fördern.";
  }

  if (category === "Frauen in Führung") {
    return "Kann dazu beitragen, Frauen stärker in Verantwortung, Vorstand und Projektleitung zu bringen.";
  }

  if (category === "Schutz & Prävention") {
    return "Wichtig für Vertrauen, Sicherheit und professionelle Vereinsstrukturen.";
  }

  if (category === "Gleichstellung") {
    return "Hilft, Geschlechtergerechtigkeit und Sichtbarkeit von Frauen im Sportverein systematisch zu verbessern.";
  }

  if (category === "Best Practice") {
    return "Kann als direktes Vorbild für ein eigenes Vereinsprojekt genutzt werden.";
  }

  if (category === "Augsburg/Bayern" || lower.includes("augsburg") || lower.includes("bayern")) {
    return "Regionaler Bezug macht den Treffer besonders praktisch für Umsetzung, Kontakte oder Kommunikation.";
  }

  if (score >= 80) {
    return "Strategisch relevant für Frauenförderung, Vereinsentwicklung oder bessere Teilhabe im Sport.";
  }

  return "Nützlich als Hintergrund für spätere Projektideen oder Diskussionen im Verein.";
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
    summary = "Diese Quelle wurde als relevant für Frauen, Mädchen, Gleichstellung oder Vereinsentwicklung im Sport erkannt.";
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
    if (!isAllowedUrl(url, baseUrl)) continue;

    const combined = `${label} ${url} ${(source.keywords || []).join(" ")}`;
    const score = scoreText(combined, source);

    if (score < 54) continue;
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
        "User-Agent": "Mozilla/5.0 FrauenSport-Monitor/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("application/xml") &&
      !contentType.includes("text/xml")
    ) {
      throw new Error(`Nicht lesbarer Inhaltstyp: ${contentType || "unbekannt"}`);
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

    const combined = `${title} ${metaDescription} ${readableText.slice(0, 2800)} ${(source.keywords || []).join(" ")}`;

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
        "Diese Quelle konnte nicht vollständig automatisch gelesen werden. Sie bleibt im Monitor, weil sie fachlich relevant sein kann.",
      recommendation:
        "Quelle manuell öffnen und prüfen. Die Webseite blockiert eventuell automatische Abfragen oder liefert keine gut lesbaren Metadaten.",
      impact:
        "Die Quelle kann trotzdem als Beobachtungsquelle für Frauen im Sport, Mädchenförderung oder Vereinsentwicklung wichtig sein.",
      warning: error.message
    });
  }
}

function shouldKeepItem(item) {
  const text = `${item.title} ${item.summary} ${item.recommendation} ${item.category}`.toLowerCase();

  if (!item.url || item.url.startsWith("javascript:")) return false;
  if (countHits(text, NEGATIVE_TERMS) > 0) return false;

  const hasWomen = hasAny(text, WOMEN_TERMS);
  const hasSport = hasAny(text, SPORT_CLUB_TERMS);
  const hasPractice = hasAny(text, PRACTICE_TERMS);
  const hasDevelopment = hasAny(text, DEVELOPMENT_TERMS);
  const hasEquality = hasAny(text, EQUALITY_TERMS);
  const hasProtection = hasAny(text, PROTECTION_TERMS);

  if (item.score >= 75) return true;
  if (hasWomen && hasSport) return true;
  if (hasWomen && hasPractice) return true;
  if (hasWomen && hasDevelopment) return true;
  if (hasEquality && hasSport) return true;
  if (hasProtection && (hasSport || hasWomen)) return true;

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
    title: "Briefing FrauenSport Monitor",
    intro:
      "Automatisch erzeugtes Briefing aus öffentlichen Quellen zu Frauen im Sport, Mädchenförderung, Trainerinnen, Gleichstellung, Schutz und Vereinsentwicklung.",
    focus:
      "Der Monitor sucht keine Fördermittel, sondern Praxisimpulse und Artikel, die helfen, Frauen und Mädchen im Sportverein besser zu fördern.",
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