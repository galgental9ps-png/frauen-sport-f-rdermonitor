import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, RefreshCw, Star, ExternalLink, CalendarDays, Lightbulb, ShieldCheck, TrendingUp, Filter, Download, BookOpen, AlertTriangle } from 'lucide-react';
import './styles.css';

const DATA_BASE = import.meta.env.BASE_URL || '/';
const categories = ['Alle', 'Fördermittel', 'Sport & Gleichstellung', 'Gleichstellungspolitik', 'EU-Förderung', 'Bayern', 'Lokal', 'Projektidee', 'Strategie'];
const regions = ['Alle', 'Augsburg', 'Bayern', 'Deutschland', 'EU', 'Deutschland/EU', 'Augsburg/Bayern'];

function formatDate(value) {
  if (!value) return 'unbekannt';
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

function scoreLabel(score) {
  if (score >= 90) return 'Sofort prüfen';
  if (score >= 75) return 'Sehr relevant';
  if (score >= 55) return 'Beobachten';
  return 'Hintergrund';
}

function normalize(text) {
  return String(text || '').toLowerCase();
}

function useJson(path, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${DATA_BASE}${path}?v=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [path]);
  return { data, loading, error, reload: load };
}

function App() {
  const { data: items, loading, error, reload } = useJson('data/items.json', []);
  const { data: sources } = useJson('data/sources.json', []);
  const { data: briefing } = useJson('data/briefing.json', null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle');
  const [region, setRegion] = useState('Alle');
  const [minScore, setMinScore] = useState(0);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('fsm:favorites') || '[]'));

  useEffect(() => {
    localStorage.setItem('fsm:favorites', JSON.stringify(favorites));
  }, [favorites]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return [...items]
      .filter(item => category === 'Alle' || item.category === category)
      .filter(item => region === 'Alle' || normalize(item.region).includes(normalize(region)))
      .filter(item => Number(item.relevanceScore || 0) >= minScore)
      .filter(item => !q || [item.title, item.summary, item.impact, item.recommendedAction, item.category, item.region, item.sourceName, ...(item.tags || [])].some(v => normalize(v).includes(q)))
      .sort((a, b) => Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0) || new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [items, query, category, region, minScore]);

  const stats = useMemo(() => ({
    total: items.length,
    funding: items.filter(i => i.category === 'Fördermittel').length,
    high: items.filter(i => Number(i.relevanceScore || 0) >= 80).length,
    favorites: favorites.length
  }), [items, favorites]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exportBriefing = () => {
    const top = filtered.slice(0, 8).map((item, idx) => `${idx + 1}. ${item.title}\nScore: ${item.relevanceScore}/100\nKategorie: ${item.category}\nRegion: ${item.region}\nKurzfassung: ${item.summary}\nAktion: ${item.recommendedAction}\nQuelle: ${item.sourceUrl}`).join('\n\n');
    const text = `Frauen Sport Fördermonitor - Briefing\nErstellt: ${new Date().toLocaleString('de-DE')}\n\n${briefing?.summary || ''}\n\nTop-Themen:\n\n${top}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'frauen-sport-briefing.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="heroText">
          <div className="eyebrow"><ShieldCheck size={16}/> Strategischer Monitor für Vereine</div>
          <h1>Frauen, Sport & Förderung</h1>
          <p>Aktuelle Informationen, Förderchancen, Gleichstellungsthemen und Projektideen für Sportvereine — mit Fokus auf Augsburg, Bayern und praktische Umsetzung.</p>
          <div className="heroActions">
            <button onClick={reload} className="primary"><RefreshCw size={18}/> Daten neu laden</button>
            <button onClick={exportBriefing} className="secondary"><Download size={18}/> Briefing exportieren</button>
          </div>
          {error && <p className="warning"><AlertTriangle size={16}/> Lokale Fallback-Daten aktiv. Fehler: {error}</p>}
        </div>
        <div className="briefingCard">
          <div className="cardTitle"><BookOpen size={18}/> Wochenbriefing</div>
          <h2>{briefing?.title || 'Wochenbriefing'}</h2>
          <p>{briefing?.summary || 'Aktuelle Top-Themen werden nach dem nächsten Datenlauf angezeigt.'}</p>
          <ul>
            {(briefing?.topActions || []).slice(0, 3).map((action, idx) => <li key={idx}>{action}</li>)}
          </ul>
          <small>Generiert: {formatDate(briefing?.generatedAt)}</small>
        </div>
      </header>

      <section className="stats">
        <Stat icon={<TrendingUp/>} label="Treffer" value={stats.total}/>
        <Stat icon={<CalendarDays/>} label="Fördermittel" value={stats.funding}/>
        <Stat icon={<ShieldCheck/>} label="Hohe Priorität" value={stats.high}/>
        <Stat icon={<Star/>} label="Favoriten" value={stats.favorites}/>
      </section>

      <section className="filters">
        <div className="searchBox"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Suche: Mädchen, Trainerinnen, Förderung, Bayern, Safe Sport ..." /></div>
        <label><Filter size={16}/> Kategorie<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Region<select value={region} onChange={e => setRegion(e.target.value)}>{regions.map(r => <option key={r}>{r}</option>)}</select></label>
        <label>Score ab {minScore}<input type="range" min="0" max="100" value={minScore} onChange={e => setMinScore(Number(e.target.value))}/></label>
      </section>

      <main className="grid">
        <section className="results">
          <div className="sectionHead"><h2>Wichtige Treffer</h2><span>{loading ? 'Lade …' : `${filtered.length} angezeigt`}</span></div>
          {filtered.length === 0 && <div className="empty">Keine Treffer für diese Filter. Score senken oder Suchbegriff ändern.</div>}
          {filtered.map(item => (
            <article className="itemCard" key={item.id}>
              <div className="itemTop">
                <div>
                  <span className={`badge score${Math.floor((item.relevanceScore || 0)/10)*10}`}>{item.relevanceScore}/100 · {scoreLabel(item.relevanceScore || 0)}</span>
                  <span className="badge neutral">{item.category}</span>
                  <span className="badge neutral">{item.region}</span>
                </div>
                <button className={favorites.includes(item.id) ? 'fav active' : 'fav'} onClick={() => toggleFavorite(item.id)} aria-label="Favorit"><Star size={18}/></button>
              </div>
              <h3>{item.title}</h3>
              <p className="summary">{item.summary}</p>
              <div className="insight"><strong>Mehrwert:</strong> {item.impact || 'Einordnung noch offen.'}</div>
              <div className="action"><Lightbulb size={17}/><strong>Empfohlene Aktion:</strong> {item.recommendedAction || 'Prüfen und intern bewerten.'}</div>
              <div className="tags">{(item.tags || []).slice(0, 8).map(tag => <span key={tag}>{tag}</span>)}</div>
              <div className="meta"><span>{formatDate(item.publishedAt)}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">Quelle öffnen <ExternalLink size={15}/></a></div>
            </article>
          ))}
        </section>

        <aside className="side">
          <div className="panel">
            <h2>Projektideen</h2>
            <Project title="Mädchen bleiben im Verein" points={["Drop-out senken", "Trainerinnen als Vorbilder", "sichere Trainingszeiten", "Elternkommunikation"]}/>
            <Project title="Frauen in Führung" points={["Mentoring", "Vorstands-Nachwuchs", "Qualifizierung", "Sichtbarkeit"]}/>
            <Project title="Sport für Frauen mit wenig Zugang" points={["niedrige Hürden", "Kinderbetreuung", "Kooperation mit Stadt", "Integration & Gesundheit"]}/>
          </div>
          <div className="panel">
            <h2>Kernquellen</h2>
            <div className="sources">
              {sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><strong>{source.name}</strong><small>{source.category} · {source.region}</small></a>)}
            </div>
          </div>
        </aside>
      </main>

      <footer>
        <strong>Hinweis:</strong> Diese App ersetzt keine Förderberatung. Sie ist ein Monitoring- und Briefing-Werkzeug. Förderbedingungen, Fristen und Antragsberechtigung immer bei der Originalquelle prüfen.
      </footer>
    </div>
  );
}

function Stat({ icon, label, value }) { return <div className="stat"><div>{React.cloneElement(icon, { size: 22 })}</div><strong>{value}</strong><span>{label}</span></div>; }
function Project({ title, points }) { return <div className="project"><h3>{title}</h3><ul>{points.map(p => <li key={p}>{p}</li>)}</ul></div>; }

createRoot(document.getElementById('root')).render(<App />);
