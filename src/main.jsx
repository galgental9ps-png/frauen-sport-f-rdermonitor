import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DATA_URL = `${import.meta.env.BASE_URL}data/items.json`;
const BRIEFING_URL = `${import.meta.env.BASE_URL}data/briefing.json`;

const CATEGORY_ORDER = [
  "Alle",
  "Sofort wichtig",
  "Fördermittel",
  "Augsburg",
  "Bayern",
  "Frauen im Sport",
  "Mädchen im Sport",
  "Trainerinnen",
  "Gleichstellung",
  "Schutz & Prävention",
  "Inklusion",
  "Integration",
  "Ehrenamt"
];

function safeText(value, fallback = "Keine Angabe") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatDate(value) {
  if (!value) return "unbekannt";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "unbekannt";
  }
}

function getScore(item) {
  return Number(item.score ?? item.relevanceScore ?? item.relevance ?? 0);
}

function getSource(item) {
  return safeText(item.source || item.sourceName || item.sourceLabel, "Quelle unbekannt");
}

function getUrl(item) {
  return item.sourceUrl || item.url || item.link || item.href || item.originalUrl || "";
}

function getSummary(item) {
  return safeText(
    item.summary || item.description || item.excerpt,
    "Zu diesem Treffer liegt noch keine automatisch lesbare Kurzfassung vor."
  );
}

function getRecommendation(item) {
  return safeText(
    item.recommendation || item.recommendedAction || item.action,
    "Diesen Treffer prüfen und bei passendem Bezug für Vereinsentwicklung, Förderung oder Projektideen vormerken."
  );
}

function getImpact(item) {
  return safeText(
    item.impact || item.benefit || item.value,
    "Kann als Hintergrundinformation für Frauenförderung, Sportverein oder Fördermittelbeobachtung dienen."
  );
}

function getUrgency(item) {
  const score = getScore(item);
  const text = `${item.urgency || ""} ${item.title || ""} ${getSummary(item)} ${getRecommendation(item)}`.toLowerCase();

  if (
    text.includes("frist") ||
    text.includes("deadline") ||
    text.includes("antrag") ||
    text.includes("sofort prüfen")
  ) {
    return "Sofort prüfen";
  }

  if (score >= 90) return "Sehr wichtig";
  if (score >= 75) return "Wichtig";
  if (score >= 55) return "Beobachten";
  return "Hintergrund";
}

function getScoreLabel(score) {
  if (score >= 90) return "Top-Priorität";
  if (score >= 75) return "Wichtig";
  if (score >= 55) return "Beobachten";
  return "Hintergrund";
}

function getScoreClass(score) {
  if (score >= 90) return "score-high";
  if (score >= 75) return "score-good";
  if (score >= 55) return "score-watch";
  return "score-low";
}

function isFunding(item) {
  const text = `${item.category || ""} ${item.title || ""} ${getSummary(item)} ${getRecommendation(item)}`.toLowerCase();

  return (
    text.includes("förder") ||
    text.includes("foerder") ||
    text.includes("zuschuss") ||
    text.includes("antrag") ||
    text.includes("frist") ||
    text.includes("grant") ||
    text.includes("funding")
  );
}

function isWomenSport(item) {
  const text = `${item.category || ""} ${item.title || ""} ${getSummary(item)} ${getRecommendation(item)}`.toLowerCase();

  const women =
    text.includes("frauen") ||
    text.includes("frau") ||
    text.includes("mädchen") ||
    text.includes("maedchen") ||
    text.includes("trainerin") ||
    text.includes("trainerinnen");

  const sport =
    text.includes("sport") ||
    text.includes("verein") ||
    text.includes("trainer") ||
    text.includes("übungsleiter") ||
    text.includes("uebungsleiter");

  return women && sport;
}

function buildNextStep(item) {
  const text = `${item.category || ""} ${item.title || ""} ${getSummary(item)} ${getRecommendation(item)}`.toLowerCase();

  if (text.includes("frist") || text.includes("deadline") || text.includes("antrag")) {
    return "Frist, Antragsberechtigung und mögliche Projektidee sofort prüfen.";
  }

  if (isFunding(item)) {
    return "Förderfähigkeit prüfen und passende Vereinsidee notieren.";
  }

  if (text.includes("augsburg")) {
    return "Lokalen Ansprechpartner oder passende Stelle in Augsburg prüfen.";
  }

  if (text.includes("bayern") || text.includes("blsv")) {
    return "BLSV-/Bayern-Bezug prüfen und für Vereinsstrategie vormerken.";
  }

  if (text.includes("trainerin") || text.includes("trainerinnen")) {
    return "Als Ansatz für Trainerinnen-Gewinnung oder Mentoring prüfen.";
  }

  if (text.includes("mädchen") || text.includes("maedchen")) {
    return "Als mögliche Projektidee für Mädchenbindung im Verein bewerten.";
  }

  if (text.includes("frauen")) {
    return "Als Impuls für Frauenförderung, Sichtbarkeit oder Führung prüfen.";
  }

  return "Bei nächster Projekt- oder Vorstandsrunde kurz bewerten.";
}

function categoryMatches(item, selectedCategory) {
  if (selectedCategory === "Alle") return true;

  const category = safeText(item.category, "").toLowerCase();
  const urgency = getUrgency(item).toLowerCase();
  const text = `${item.title || ""} ${category} ${getSummary(item)} ${getRecommendation(item)}`.toLowerCase();

  if (selectedCategory === "Sofort wichtig") {
    return urgency.includes("sofort") || getScore(item) >= 90;
  }

  if (selectedCategory === "Fördermittel") return isFunding(item);
  if (selectedCategory === "Augsburg") return text.includes("augsburg");
  if (selectedCategory === "Bayern") return text.includes("bayern") || text.includes("blsv");
  if (selectedCategory === "Frauen im Sport") return isWomenSport(item) || category.includes("frauen");
  if (selectedCategory === "Mädchen im Sport") return text.includes("mädchen") || text.includes("maedchen");
  if (selectedCategory === "Trainerinnen") return text.includes("trainerin") || text.includes("trainerinnen");
  if (selectedCategory === "Gleichstellung") return text.includes("gleichstellung") || text.includes("geschlechtergerechtigkeit");
  if (selectedCategory === "Schutz & Prävention") {
    return text.includes("safe sport") || text.includes("gewaltschutz") || text.includes("prävention") || text.includes("praevention");
  }
  if (selectedCategory === "Inklusion") return text.includes("inklusion");
  if (selectedCategory === "Integration") return text.includes("integration") || text.includes("migration");
  if (selectedCategory === "Ehrenamt") return text.includes("ehrenamt") || text.includes("engagement");

  return category.includes(selectedCategory.toLowerCase());
}

function ItemCard({ item, compact = false }) {
  const score = getScore(item);
  const source = getSource(item);
  const url = getUrl(item);
  const urgency = getUrgency(item);
  const summary = getSummary(item);
  const recommendation = getRecommendation(item);
  const impact = getImpact(item);
  const nextStep = buildNextStep(item);
  const category = safeText(item.category || item.type, "Info");

  return (
    <article className={`item-card ${compact ? "compact" : ""}`}>
      <div className="card-top">
        <div className="card-title-block">
          <div className="meta-line">
            <span className="pill category-pill">{category}</span>
            <span className={`pill urgency-pill urgency-${urgency.toLowerCase().replaceAll(" ", "-")}`}>
              {urgency}
            </span>
          </div>
          <h3>{safeText(item.title || item.headline, "Ohne Titel")}</h3>
        </div>

        <div className={`score-box ${getScoreClass(score)}`}>
          <strong>{score}</strong>
          <span>{getScoreLabel(score)}</span>
        </div>
      </div>

      <div className="source-line">
        <span>Quelle: {source}</span>
        <span>Region: {safeText(item.region, "unbekannt")}</span>
      </div>

      <div className="content-block">
        <h4>Kurzfassung</h4>
        <p>{summary}</p>
      </div>

      {!compact && (
        <>
          <div className="content-block">
            <h4>Warum wichtig?</h4>
            <p>{impact}</p>
          </div>

          <div className="content-block recommendation">
            <h4>Empfehlung</h4>
            <p>{recommendation}</p>
          </div>

          <div className="next-step">
            <span className="next-step-icon">➜</span>
            <span>{nextStep}</span>
          </div>
        </>
      )}

      <div className="card-footer">
        <span>Aktualisiert: {formatDate(item.updatedAt || item.checkedAt || item.publishedAt)}</span>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="open-link">
            Quelle öffnen ↗
          </a>
        ) : (
          <span className="no-link">Kein Link vorhanden</span>
        )}
      </div>
    </article>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">!</div>
      <h3>Keine Treffer gefunden</h3>
      <p>
        Passe Suche oder Kategorie an. Falls dauerhaft wenig erscheint, sollten weitere News- und
        Förderquellen in <code>public/data/sources.json</code> ergänzt werden.
      </p>
    </div>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [itemsResponse, briefingResponse] = await Promise.all([
        fetch(DATA_URL, { cache: "no-store" }),
        fetch(BRIEFING_URL, { cache: "no-store" })
      ]);

      if (!itemsResponse.ok) {
        throw new Error("items.json konnte nicht geladen werden.");
      }

      const loadedItems = await itemsResponse.json();
      let loadedBriefing = null;

      if (briefingResponse.ok) {
        loadedBriefing = await briefingResponse.json();
      }

      setItems(Array.isArray(loadedItems) ? loadedItems : []);
      setBriefing(loadedBriefing);
    } catch (err) {
      setError(err.message || "Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => getScore(b) - getScore(a));
  }, [items]);

  const stats = useMemo(() => {
    const top = sortedItems.filter((item) => getScore(item) >= 90).length;
    const funding = sortedItems.filter(isFunding).length;
    const womenSport = sortedItems.filter(isWomenSport).length;
    const local = sortedItems.filter((item) => {
      const text = `${item.title || ""} ${getSummary(item)} ${getRecommendation(item)}`.toLowerCase();
      return text.includes("augsburg") || text.includes("bayern") || text.includes("blsv");
    }).length;

    return { top, funding, womenSport, local };
  }, [sortedItems]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();

    return sortedItems.filter((item) => {
      const haystack = [
        item.title,
        item.headline,
        item.category,
        item.region,
        getSource(item),
        getSummary(item),
        getRecommendation(item),
        getImpact(item),
        ...(Array.isArray(item.keywords) ? item.keywords : [])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || haystack.includes(search);
      const matchesCategory = categoryMatches(item, selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [sortedItems, query, selectedCategory]);

  const topItems = useMemo(() => {
    return sortedItems
      .filter((item) => getScore(item) >= 75)
      .slice(0, 3);
  }, [sortedItems]);

  const fundingItems = useMemo(() => {
    return sortedItems.filter(isFunding).slice(0, 4);
  }, [sortedItems]);

  const projectIdeas = briefing?.projectIdeas || [
    {
      title: "Mädchen bleiben im Verein",
      goal: "Mädchen langfristig im Verein halten und Drop-out reduzieren.",
      actions: ["Trainerinnen sichtbar machen", "sichere Trainingszeiten prüfen", "Elternkommunikation verbessern"]
    },
    {
      title: "Trainerinnen gewinnen",
      goal: "Mehr Frauen als Übungsleiterinnen und Trainerinnen gewinnen.",
      actions: ["Ausbildungskosten prüfen", "Mentoring anbieten", "weibliche Vorbilder sichtbar machen"]
    },
    {
      title: "Frauen in Führung",
      goal: "Frauen stärker in Vorstand, Abteilungsleitung und Projektleitung bringen.",
      actions: ["familienfreundliche Sitzungszeiten prüfen", "Qualifizierung anbieten", "Frauen gezielt für Gremien ansprechen"]
    }
  ];

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span>✦</span>
            Frauen · Sport · Förderung · Augsburg/Bayern
          </div>

          <h1>FrauenSport Fördermonitor</h1>

          <p>
            Automatischer Monitor für Frauenförderung, Mädchen im Sport, Gleichstellung,
            Fördermittel und Projektideen für Sportvereine.
          </p>

          <div className="hero-actions">
            <button onClick={loadData} className="primary-button" disabled={loading}>
              <span className={loading ? "spin" : ""}>⟳</span>
              Daten neu laden
            </button>

            <a
              className="secondary-button"
              href="https://github.com/galgental9ps-png/frauen-sport-f-rdermonitor/actions"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Actions öffnen ↗
            </a>
          </div>
        </div>

        <div className="hero-panel">
          <h2>Für die Geschäftsführung</h2>
          <p>
            Fokus auf: Was ist wichtig? Welche Förderchance gibt es? Was kann der Verein daraus machen?
          </p>
          <div className="panel-note">
            <span>✓</span>
            Öffentliche Quellen, keine Logins, keine privaten Daten.
          </div>
        </div>
      </header>

      {error && (
        <div className="error-box">
          <span>!</span>
          {error}
        </div>
      )}

      <section className="stats-grid">
        <StatCard
          icon="↗"
          value={items.length}
          label="gefundene Einträge"
          hint="aus öffentlichen Quellen"
        />
        <StatCard
          icon="!"
          value={stats.top}
          label="Top-Priorität"
          hint="Score ab 90"
        />
        <StatCard
          icon="€"
          value={stats.funding}
          label="Fördermittel-Bezug"
          hint="Zuschuss, Antrag, Frist"
        />
        <StatCard
          icon="♀"
          value={stats.womenSport}
          label="Frauen/Mädchen + Sport"
          hint="direkter Vereinsbezug"
        />
      </section>

      <section className="briefing-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Briefing</span>
            <h2>Was jetzt zuerst prüfen?</h2>
          </div>
          <span className="updated-label">
            Aktualisiert: {formatDate(briefing?.updatedAt || items[0]?.updatedAt || items[0]?.checkedAt)}
          </span>
        </div>

        {topItems.length > 0 ? (
          <div className="top-grid">
            {topItems.map((item) => (
              <ItemCard key={item.id || getUrl(item)} item={item} compact />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {fundingItems.length > 0 && (
        <section className="briefing-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Fördermittel-Radar</span>
              <h2>Mögliche Zuschüsse, Programme und Fristen</h2>
            </div>
          </div>

          <div className="top-grid">
            {fundingItems.map((item) => (
              <ItemCard key={`funding-${item.id || getUrl(item)}`} item={item} compact />
            ))}
          </div>
        </section>
      )}

      <section className="controls-section">
        <div className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Suchen: Augsburg, Mädchen, Trainerinnen, Förderung, BLSV..."
          />
        </div>

        <div className="filter-row">
          <div className="filter-label">
            <span>▾</span>
            Kategorie
          </div>

          <div className="chips">
            {CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "chip active" : "chip"}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="main-grid">
        <section className="results-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Dashboard</span>
              <h2>{filteredItems.length} passende Treffer</h2>
            </div>
          </div>

          {loading ? (
            <div className="loading-box">
              <span className="spin">⟳</span>
              Daten werden geladen...
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="items-list">
              {filteredItems.map((item) => (
                <ItemCard key={item.id || getUrl(item)} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>

        <aside className="side-panel">
          <section className="side-card">
            <h3>Projektideen aus den Treffern</h3>
            <p>
              Diese Ideen passen zu Frauenförderung, Mädchen im Sport und Vereinsentwicklung.
            </p>

            <div className="idea-list">
              {projectIdeas.slice(0, 5).map((idea, index) => (
                <div className="idea-card" key={`${idea.title}-${index}`}>
                  <h4>{idea.title}</h4>
                  <p>{idea.goal || idea.description || "Projektidee für den Verein prüfen."}</p>
                  <ul>
                    {(idea.actions || idea.bullets || []).slice(0, 4).map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="side-card">
            <h3>So liest man den Score</h3>
            <div className="score-guide">
              <div>
                <strong>90–100</strong>
                <span>Sofort prüfen</span>
              </div>
              <div>
                <strong>75–89</strong>
                <span>wichtig für Strategie oder Projekt</span>
              </div>
              <div>
                <strong>55–74</strong>
                <span>beobachten</span>
              </div>
              <div>
                <strong>0–54</strong>
                <span>Hintergrund</span>
              </div>
            </div>
          </section>

          <section className="side-card">
            <h3>Nächster Qualitätscheck</h3>
            <p>
              Prüfe die Top 10. Wenn falsche Treffer oben stehen, müssen Keywords oder
              Quellen in <code>sources.json</code> weiter geschärft werden.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
