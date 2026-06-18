import fs from "node:fs/promises";

const SOURCES_PATH = "public/data/sources.json";
const ITEMS_PATH = "public/data/items.json";
const BRIEFING_PATH = "public/data/briefing.json";

const MAX_LINKS_PER_SOURCE = 8;
const MAX_ITEMS_TOTAL = 120;
const FETCH_TIMEOUT_MS = 12000;

const WOMEN_TERMS = [
  "frauen",
  "frau",
  "mädchen",
  "maedchen",
  "girls",
  "women",
  "weiblich",
  "frauensport",
  "mädchensport",
  "maedchensport",
  "frauen im sport",
  "mädchen im sport",
  "maedchen im sport",
  "sportlerin",
  "sportlerinnen",
  "athletin",
  "athletinnen",
  "trainerin",
  "trainerinnen",
  "übungsleiterin",
  "uebungsleiterin",
  "vorständin",
  "vorständinnen",
  "mentorinnen"
];

const SPORT_TERMS = [
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
  "toolbox",
  "umsetzung",
  "beispiel"
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
  "ansprache",
  "beteiligung"
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
  "gleichstellung im sport",
  "geschlechtergerechtigkeit im sport"
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
  "sicherer sport",
  "kinderschutz",
  "jugendschutz"
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
  "sozial benachteiligt",
  "zugang zum sport"
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
  "finanzierung",
  "geld",
  "antrag",
  "antragsfrist",
  "beantragen",
  "grant",
  "funding",
  "tenders",
  "erasmus+",
  "cerv"
];

const HARD_BLOCK_TERMS = [
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
  "tickets",
  "downloads",
  "download",
  "bestandserhebung",
  "gesamtmitgliederzahl",
  "mitgliedsorganisationen",
  "service",
  "termine",
  "kalender",
  "presse",
  "mediathek"
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
  "liveticker",
  "sportpolitik allgemein",
  "sportdeutschland",
  "bewerbung um olympische"
];

const GOOD_PATH_PARTS = [
  "frauen",
  "maedchen",
  "mädchen",
  "girls",
  "women",
  "gleichstellung",
  "geschlechtergerechtigkeit",
  "gender",
  "safe-sport",
  "safesport",
  "schutz",
  "praevention",
  "prävention",
  "teilhabe",
  "inklusion",
  "integration",
  "sportjugend",
  "vereinsentwicklung",
  "ehrenamt",
  "engagement",
  "trainerinnen",
  "trainerin"
];

const BAD_PATH_PARTS = [
  "impressum",
  "datenschutz",
  "privacy",
  "cookie",
  "login",
  "kontakt",
  "newsletter",
  "presse",
  "jobs",
  "karriere",
  "shop",
  "ticket",
  "tickets",
  "download",
  "downloads",
  "bestandserhebung",
  "foerderung",
  "foerderungen",
  "förderung",
  "förderungen",
  "funding",
  "tenders",
  "olympiabewerbung",
  "olympia",
  "service"
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

function normalizeHost(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function countHits(text, terms) {
  const lower = String(text).toLowerCase();

  return terms.reduce((count, term) => {
    return lower.includes(String(term).toLowerCase()) ? count + 1 : count;
  }, 0);
}

function hasAny(text, terms) {
  return countHits(text, terms) > 0;
}

function isAllowedUrl(url, sourceUrl, source = {}) {
  try {
    const target = new URL(url);
    const base = new URL(sourceUrl);

    if (!["http:", "https:"].includes(target.protocol)) return false;

    const targetHost = normalizeHost(target.hostname);
    const baseHost = normalizeHost(base.hostname);

    const sameDomain = targetHost === baseHost || targetHost.endsWith(`.${baseHost}`);
    if (!sameDomain) return false;

    const path = decodeURIComponent(target.pathname.toLowerCase());

    const sourceBlocked = source.blockedPathIncludes || [];
    const sourceAllowed = source.allowedPathIncludes || [];

    if (BAD_PATH_PARTS.some((part) => path.includes(part))) return false;

    if (sourceBlocked.some((part) => path.includes(String(part).toLowerCase()))) {
      return false;
    }

    if (sourceAllowed.length > 0) {
      return sourceAllowed.some((part) => path.includes(String(part).toLowerCase()));
    }

    if (path === "/" || path.length < 3) return true;

    return GOOD_PATH_PARTS.some((part) => path.includes(part));
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
      .replace(/Pressekontakt/gi, " ")
      .replace(/Teilen/gi, " ")
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

function getSignals(text) {
  const lower = String(text).toLowerCase();

  return {
    women: countHits(lower, WOMEN_TERMS),
    sport: countHits(lower, SPORT_TERMS),
    practice: countHits(lower, PRACTICE_TERMS),
    development: countHits(lower, DEVELOPMENT_TERMS),
    equality: countHits(lower, EQUALITY_TERMS),
    protection: countHits(lower, PROTECTION_TERMS),
    inclusion: countHits(lower, INCLUSION_TERMS),
    health: countHits(lower, HEALTH_TERMS),
    region: countHits(lower, REGION_TERMS),
    money: countHits(lower, MONEY_TERMS),
    hardBlock: countHits(lower, HARD_BLOCK_TERMS),
    lowRelevance: countHits(lower, LOW_RELEVANCE_TERMS)
  };
}

function isClearlyRelevant(text) {
  const s = getSignals(text);

  const hasWomen = s.women > 0;
  const hasSport = s.sport > 0;
  const hasPractice = s.practice > 0;
  const hasDevelopment = s.development > 0;
  const hasEquality = s.equality > 0;
  const hasProtection = s.protection > 0;
  const hasInclusion = s.inclusion > 0;
  const hasRegion = s.region > 0;

  if (s.hardBlock > 0) return false;

  if (hasWomen && hasSport) return true;
  if (hasWomen && hasPractice) return true;
  if (hasWomen && hasDevelopment) return true;
  if (hasEquality && hasSport) return true;
  if (hasProtection && (hasSport || hasWomen || hasEquality)) return true;
  if (hasInclusion && hasWomen && hasSport) return true;
  if (hasRegion && hasWomen && (hasSport || hasEquality || hasPractice)) return true;

  return false;
}

function scoreText(text, source = {}) {
  const lower = String(text).toLowerCase();
  const s = getSignals(lower);

  const hasWomen = s.women > 0;
  const hasSport = s.sport > 0;
  const hasPractice = s.practice > 0;
  const hasDevelopment = s.development > 0;
  const hasEquality = s.equality > 0;
  const hasProtection = s.protection > 0;
  const hasInclusion = s.inclusion > 0;
  const hasHealth = s.health > 0;
  const hasRegion = s.region > 0;

  if (s.hardBlock > 0) return 0;

  let score = 0;

  score += Math.min(Number(source.priority || source.weight || 50), 100) * 0.12;

  score += s.women * 13;
  score += s.sport * 7;
  score += s.practice * 7;
  score += s.development * 7;
  score += s.equality * 6;
  score += s.protection * 9;
  score += s.inclusion * 5;
  score += s.health * 4;
  score += s.region * 6;

  if (hasWomen && hasSport) score += 24;
  if (hasWomen && hasSport && hasPractice) score += 18;
  if (hasWomen && hasSport && hasDevelopment) score += 18;
  if (hasWomen && hasSport && hasEquality) score += 15;
  if (hasWomen && hasSport && hasProtection) score += 18;
  if (hasWomen && hasSport && hasRegion) score += 14;
  if (hasWomen && hasSport && hasInclusion) score += 10;
  if (hasWomen && hasSport && hasHealth) score += 8;

  if (lower.includes("sportverein")) score += 14;
  if (lower.includes("trainerinnen")) score += 16;
  if (lower.includes("frauen in führung") || lower.includes("frauen in fuehrung")) score += 16;
  if (lower.includes("mädchen im sport") || lower.includes("maedchen im sport")) score += 16;
  if (lower.includes("frauen im sport")) score += 16;
  if (lower.includes("safe sport")) score += 12;
  if (lower.includes("schutzkonzept")) score += 12;
  if (lower.includes("best practice") || lower.includes("praxisbeispiel")) score += 12;
  if (lower.includes("augsburg")) score += 8;
  if (lower.includes("bayern") || lower.includes("blsv")) score += 7;

  score -= s.money * 8;
  score -= s.lowRelevance * 18;

  if (s.lowRelevance > 0 && !hasWomen && !hasEquality && !hasProtection) {
    score -= 40;
  }

  if (!hasWomen && !hasEquality && !hasProtection) {
    score -= 35;
  }

  if (!hasSport && !hasPractice && !hasDevelopment) {
    score -= 22;
  }

  const qualifiesForTop =
    (hasWomen && hasSport && (hasPractice || hasDevelopment || hasEquality || hasProtection || hasRegion)) ||
    (hasWomen && hasSport && lower.includes("trainerinnen")) ||
    (hasWomen && hasSport && lower.includes("sportverein")) ||
    (hasWomen && hasSport && (lower.includes("mädchen") || lower.includes("maedchen"))) ||
    (hasProtection && hasSport && (hasWomen || hasEquality));

  if (!qualifiesForTop && score > 78) {
    score = 78;
  }

  if (s.money > 0 && !hasWomen && !hasSport) {
    score = Math.min(score, 35);
  }

  if (!isClearlyRelevant(text)) {
    score = Math.min(score, 45);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function categoryFromText(text, source = {}) {
  const lower = String(text).toLowerCase();

  if (
    lower.includes("safe sport") ||
    lower.includes("schutzkonzept") ||
    lower.includes("gewaltschutz") ||
    lower.includes("prävention") ||
    lower.includes("praevention") ||
    lower.includes("sexualisierte gewalt") ||
    lower.includes("kinderschutz")
  ) {
    return "Schutz & Prävention";
  }

  if (
    lower.includes("trainerin") ||
    lower.includes("trainerinnen") ||
    lower.includes("übungsleiterin") ||
    lower.includes("uebungsleiterin")
  ) {
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
    lower.includes("gleichstellung") ||
    lower.includes("geschlechtergerechtigkeit") ||
    lower.includes("chancengleichheit") ||
    lower.includes("gleichberechtigung")
  ) {
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

  if (
    lower.includes("vereinsentwicklung") ||
    lower.includes("mitgliederbindung") ||
    lower.includes("ehrenamt") ||
    lower.includes("engagement")
  ) {
    return "Vereinsentwicklung";
  }

  if (lower.includes("augsburg") || lower.includes("bayern") || lower.includes("blsv")) {
    return "Augsburg/Bayern";
  }

  if (hasAny(lower, WOMEN_TERMS) && hasAny(lower, SPORT_TERMS)) {
    return "Frauen im Sport";
  }

  return source.category || source.type || "Frauen im Sport";
}

function urgencyFromScore(score, text) {
  const lower = String(text).toLowerCase();

  if (
    lower.includes("schutzkonzept") ||
    lower.includes("safe sport") ||
    lower.includes("sexualisierte gewalt") ||
    lower.includes("prävention") ||
    lower.includes("praevention") ||
    lower.includes("kinderschutz")
  ) {
    return "Sofort prüfen";
  }

  if (score >= 90) return "Sehr wichtig";
  if (score >= 75) return "Wichtig";
  if (score >= 55) return "Beobachten";
  return "Hintergrund";
}

function createRecommendation(score, category, text) {
  const lower = String(text).toLowerCase();

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
  const lower = String(text).toLowerCase();

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

function createSummary(title, metaDescription, readableText) {
  const sentences = splitSentences(readableText);

  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: scoreText(`${title} ${sentence}`)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((entry) => entry.sentence);

  let summary = "";

  if (metaDescription && metaDescription.length > 60) {
    summary = metaDescription;
  } else if (ranked.length > 0) {
    summary = ranked.join(" ");
  } else {
    summary = "Diese Quelle wurde als möglicher Impuls für Frauen, Mädchen, Gleichstellung oder Vereinsentwicklung im Sport erkannt.";
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
    if (!isAllowedUrl(url, baseUrl, source)) continue;

    const linkText = `${label} ${url}`;
    if (!isClearlyRelevant(linkText)) continue;

    const score = scoreText(linkText, source);

    if (score < 55) continue;

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
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/xml;q=0.8,*/*;q=0.5"
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
    if (!isAllowedUrl(url, source.url, source)) {
      throw new Error("URL außerhalb erlaubter Bereiche");
    }

    const html = await fetchHtml(url);

    const title = cleanText(extractTitle(html, fallbackTitle || source.name));
    const metaDescription = extractDescription(html);
    const readableText = extractReadableText(html);

    const combinedForRelevance = `${title} ${metaDescription} ${readableText.slice(0, 3200)}`;

    if (!isClearlyRelevant(combinedForRelevance)) {
      throw new Error("Inhalt nicht ausreichend relevant für FrauenSport-Monitor");
    }

    const score = scoreText(combinedForRelevance, source);
    const category = categoryFromText(combinedForRelevance, source);
    const summary = createSummary(title, metaDescription, readableText);
    const recommendation = createRecommendation(score, category, combinedForRelevance);
    const impact = createImpact(score, category, combinedForRelevance);

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
    const fallbackText = `${fallbackTitle || source.name} ${source.description || ""} ${(source.keywords || []).join(" ")}`;

    if (!isClearlyRelevant(fallbackText)) {
      return null;
    }

    const score = Math.min(scoreText(fallbackText, source), 58);
    const category = categoryFromText(fallbackText, source);
    const title = fallbackTitle || source.name;

    return makeCompatibleItem({
      title,
      source,
      url,
      category,
      score,
      summary:
        source.description ||
        "Diese Quelle konnte nicht vollständig automatisch gelesen werden. Sie bleibt nur als niedriger Beobachtungstreffer im Monitor.",
      recommendation:
        "Quelle nur manuell prüfen, wenn das Thema wirklich zu Frauen, Mädchen oder Gleichstellung im Sportverein passt.",
      impact:
        "Niedrige Priorität, da der automatische Inhalt nicht sicher genug bewertet werden konnte.",
      warning: error.message
    });
  }
}

function shouldKeepItem(item) {
  if (!item) return false;

  const text = `${item.title} ${item.summary} ${item.recommendation} ${item.category}`.toLowerCase();

  if (!item.url || item.url.startsWith("javascript:")) return false;
  if (countHits(text, HARD_BLOCK_TERMS) > 0) return false;

  const s = getSignals(text);

  const hasWomen = s.women > 0;
  const hasSport = s.sport > 0;
  const hasPractice = s.practice > 0;
  const hasDevelopment = s.development > 0;
  const hasEquality = s.equality > 0;
  const hasProtection = s.protection > 0;
  const hasInclusion = s.inclusion > 0;
  const hasRegion = s.region > 0;

  const onlyGeneralSport =
    hasSport &&
    !hasWomen &&
    !hasEquality &&
    !hasProtection &&
    !hasInclusion;

  const onlyMoney =
    s.money > 0 &&
    !hasWomen &&
    !hasEquality &&
    !hasProtection;

  if (onlyGeneralSport) return false;
  if (onlyMoney) return false;

  const strongMatch =
    hasWomen &&
    hasSport &&
    (hasPractice || hasDevelopment || hasEquality || hasProtection || hasRegion);

  const protectionMatch =
    hasProtection &&
    (hasSport || hasWomen || hasEquality);

  const equalitySportMatch =
    hasEquality &&
    hasSport;

  const inclusionWomenSportMatch =
    hasInclusion &&
    hasWomen &&
    hasSport;

  if (strongMatch && item.score >= 60) return true;
  if (protectionMatch && item.score >= 55) return true;
  if (equalitySportMatch && item.score >= 58) return true;
  if (inclusionWomenSportMatch && item.score >= 58) return true;

  return item.score >= 72 && (hasWomen || hasEquality || hasProtection) && (hasSport || hasPractice || hasDevelopment);
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
    if (!item?.url || item.url.startsWith("javascript:")) continue;

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
    qualityRule:
      "Allgemeine Sportseiten, Fördermittel-Seiten, Service-Seiten, Downloads, Presse- und Kontaktseiten werden herausgefiltert.",
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

  console.log(`Fertig. ${sortedItems.length} passende FrauenSport-Einträge geschrieben.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
