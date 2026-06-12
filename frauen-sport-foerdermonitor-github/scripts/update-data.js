import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dataDir = path.join(root, 'public', 'data');
const now = new Date();

const KEYWORDS = [
  'Frauen Sport Förderung',
  'Mädchen Sportverein Förderung',
  'Frauen im Sport Gleichstellung',
  'Trainerinnen Mentoring Sportverein',
  'Bayern Sportverein Frauen Förderung',
  'Augsburg Frauen Sport Förderung',
  'Förderprogramm Frauen Mädchen Sport',
  'Geschlechtergerechtigkeit Sport DOSB',
  'BLSV Frauen im Sport',
  'EU gender equality sport funding'
];

const PRIORITY_TERMS = {
  high: ['förderung', 'förderprogramm', 'zuschuss', 'frist', 'antrag', 'sportverein', 'verein', 'mädchen', 'frauen', 'trainerinnen', 'gleichstellung', 'bayern', 'augsburg', 'dosb', 'blsv'],
  medium: ['ehrenamt', 'führung', 'mentoring', 'safe sport', 'prävention', 'integration', 'inklusion', 'gesundheit', 'bildung', 'projekt'],
  local: ['augsburg', 'bayern', 'schwaben', 'münchen', 'blsv']
};

const CATEGORY_RULES = [
  ['Fördermittel', ['förder', 'zuschuss', 'grant', 'funding', 'erasmus', 'cerv', 'antrag', 'frist']],
  ['Sport & Gleichstellung', ['sport', 'dosb', 'blsv', 'trainerin', 'athletin', 'verein']],
  ['Gleichstellungspolitik', ['gleichstellung', 'gender', 'frauenpolitik', 'teilhabe']],
  ['Lokal', ['augsburg', 'schwaben']],
  ['Bayern', ['bayern', 'bayerisch', 'blsv']],
  ['EU-Förderung', ['eu', 'european', 'erasmus', 'cerv']]
];

function clean(text = '') {
  return String(text).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function hash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 16);
}

function scoreFor(text, sourceWeight = 5) {
  const t = text.toLowerCase();
  let score = 20 + sourceWeight * 3;
  for (const term of PRIORITY_TERMS.high) if (t.includes(term)) score += 6;
  for (const term of PRIORITY_TERMS.medium) if (t.includes(term)) score += 3;
  for (const term of PRIORITY_TERMS.local) if (t.includes(term)) score += 6;
  if (/\b(frist|deadline|bewerbung|antrag|ausschreibung)\b/i.test(text)) score += 8;
  if (/\b(2026|2027|aktuell|neu|startet|gestartet)\b/i.test(text)) score += 4;
  return Math.max(35, Math.min(99, Math.round(score)));
}

function categoryFor(text) {
  const t = text.toLowerCase();
  for (const [cat, terms] of CATEGORY_RULES) {
    if (terms.some(term => t.includes(term))) return cat;
  }
  return 'Strategie';
}

function regionFor(text) {
  const t = text.toLowerCase();
  if (t.includes('augsburg')) return 'Augsburg';
  if (t.includes('bayern') || t.includes('bayer') || t.includes('blsv')) return 'Bayern';
  if (t.includes('eu ') || t.includes('european') || t.includes('erasmus') || t.includes('cerv')) return 'EU';
  return 'Deutschland';
}

function tagsFor(text) {
  const tags = [];
  const map = [
    ['Frauen', /frauen|woman|women/i],
    ['Mädchen', /mädchen|girls/i],
    ['Sportverein', /sportverein|verein/i],
    ['Förderung', /förder|zuschuss|funding|grant/i],
    ['Bayern', /bayern|bayer/i],
    ['Augsburg', /augsburg/i],
    ['Trainerinnen', /trainerin|trainerinnen/i],
    ['Gleichstellung', /gleichstellung|gender/i],
    ['Führung', /führung|leadership/i],
    ['Integration', /integration|inklusion|migration/i],
    ['Safe Sport', /safe sport|schutz|prävention/i]
  ];
  for (const [tag, rx] of map) if (rx.test(text)) tags.push(tag);
  return [...new Set(tags)].slice(0, 8);
}

function itemFromRaw(raw) {
  const combined = `${raw.title} ${raw.summary} ${raw.sourceName}`;
  const score = scoreFor(combined, raw.weight || 5);
  return {
    id: hash(raw.url || raw.title),
    title: clean(raw.title).slice(0, 180),
    summary: clean(raw.summary || 'Keine Zusammenfassung verfügbar. Originalquelle öffnen und prüfen.').slice(0, 420),
    category: raw.category || categoryFor(combined),
    region: raw.region || regionFor(combined),
    sourceName: raw.sourceName || 'Online-Quelle',
    sourceUrl: raw.url,
    publishedAt: raw.publishedAt || now.toISOString(),
    relevanceScore: score,
    impact: impactFor(combined, score),
    recommendedAction: actionFor(combined, score),
    tags: tagsFor(combined)
  };
}

function impactFor(text, score) {
  const t = text.toLowerCase();
  if (t.includes('förder') || t.includes('zuschuss') || t.includes('funding') || t.includes('grant')) return 'Potenzielle Förderchance oder Finanzierungsinformation für Projekte im Verein.';
  if (t.includes('augsburg') || t.includes('bayern') || t.includes('blsv')) return 'Regionaler Bezug erhöht die praktische Relevanz für einen Sportverein in Augsburg/Bayern.';
  if (t.includes('trainer') || t.includes('führung') || t.includes('leadership')) return 'Nutzbar für Programme zu Trainerinnen, Ehrenamt und Frauen in Führungspositionen.';
  if (score >= 80) return 'Hohe strategische Relevanz für Frauenförderung, Gleichstellung oder Projektentwicklung im Sportverein.';
  return 'Als Hintergrundinformation beobachten und bei passendem Projektkontext erneut prüfen.';
}

function actionFor(text, score) {
  const t = text.toLowerCase();
  if (t.includes('frist') || t.includes('deadline') || t.includes('ausschreibung')) return 'Frist und Antragsberechtigung sofort prüfen; bei Passung Vorstand oder Geschäftsführung informieren.';
  if (t.includes('förder') || t.includes('zuschuss') || t.includes('funding')) return 'Förderfähigkeit, Eigenmittel, Zielgruppe und mögliche Projektidee prüfen.';
  if (t.includes('augsburg') || t.includes('bayern')) return 'Für lokale Kooperation, Vorstandsvorlage oder Vereinsentwicklung prüfen.';
  if (score >= 85) return 'In das nächste Wochenbriefing aufnehmen und konkrete Umsetzungsidee ableiten.';
  return 'Speichern, beobachten und bei thematischer Passung als Argumentationsquelle nutzen.';
}

async function fetchGdelt(query) {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=25&sort=HybridRel&timespan=30d`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'frauen-sport-foerdermonitor/1.0' } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.articles || []).map(a => itemFromRaw({
      title: a.title,
      summary: a.seendate ? `Aktueller Online-Treffer zum Suchbegriff „${query}“. Quelle öffnen, um Details und Originalkontext zu prüfen.` : '',
      sourceName: a.domain || 'GDELT News',
      url: a.url,
      publishedAt: a.seendate ? parseGdeltDate(a.seendate) : now.toISOString(),
      weight: 5
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseGdeltDate(value) {
  // GDELT: YYYYMMDDHHMMSS
  const s = String(value);
  if (s.length >= 8) return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T00:00:00Z`).toISOString();
  return now.toISOString();
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true });
  const sources = JSON.parse(await fs.readFile(path.join(dataDir, 'sources.json'), 'utf8'));
  const seed = JSON.parse(await fs.readFile(path.join(dataDir, 'items.json'), 'utf8')).filter(i => String(i.id).startsWith('seed'));

  const gdeltItems = [];
  for (const query of KEYWORDS) {
    const rows = await fetchGdelt(query);
    gdeltItems.push(...rows);
  }

  const sourceCards = sources.map(s => itemFromRaw({
    title: `Kernquelle beobachten: ${s.name}`,
    summary: `Regelmäßig prüfen: ${s.keywords.join(', ')}. Diese Quelle ist in der App als strategische Anlaufstelle hinterlegt.`,
    sourceName: s.name,
    url: s.url,
    category: s.category,
    region: s.region,
    weight: s.weight,
    publishedAt: now.toISOString()
  }));

  const all = [...gdeltItems, ...sourceCards, ...seed];
  const dedup = new Map();
  for (const item of all) {
    if (!item.sourceUrl) continue;
    const key = item.sourceUrl.replace(/[?#].*$/, '').toLowerCase();
    const existing = dedup.get(key);
    if (!existing || item.relevanceScore > existing.relevanceScore) dedup.set(key, item);
  }

  const finalItems = [...dedup.values()]
    .sort((a, b) => Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0) || new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 120);

  const top = finalItems.slice(0, 6);
  const briefing = {
    generatedAt: now.toISOString(),
    title: 'Wochenbriefing Frauen, Sport & Förderung',
    summary: top.length
      ? `Aktuell höchste Priorität: ${top[0].title}. Insgesamt wurden ${finalItems.length} relevante Treffer und Kernquellen bewertet.`
      : 'Keine neuen Treffer gefunden; Kernquellen manuell prüfen.',
    topActions: top.slice(0, 5).map(item => `${item.title}: ${item.recommendedAction}`)
  };

  await fs.writeFile(path.join(dataDir, 'items.json'), JSON.stringify(finalItems, null, 2));
  await fs.writeFile(path.join(dataDir, 'briefing.json'), JSON.stringify(briefing, null, 2));
  console.log(`Wrote ${finalItems.length} items.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
