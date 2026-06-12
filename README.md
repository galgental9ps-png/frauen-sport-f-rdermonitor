# Frauen Sport Fördermonitor

Eine GitHub-Pages-Webapp für Frauenförderung, Mädchen im Sport, Gleichstellung, Fördermittel und Projektideen im Sportverein.

Die App ist für den Einsatz in einem Sportverein gedacht, z. B. für Geschäftsführung, Vorstand, Projektentwicklung oder Öffentlichkeitsarbeit.

## Was die App macht

- zeigt aktuelle relevante Treffer als Dashboard
- bewertet Treffer mit einem Relevanzscore von 0 bis 100
- priorisiert Frauen, Mädchen, Sportverein, Förderung, Bayern und Augsburg
- enthält Projektideen für die Vereinsentwicklung
- enthält Kernquellen wie DOSB, BLSV, BMFSFJ, Förderdatenbank und EU-Förderung
- erzeugt ein Wochenbriefing
- läuft als GitHub-Pages-Webseite
- aktualisiert Daten automatisch per GitHub Actions

## Schnellstart auf GitHub

### 1. Neues Repository erstellen

Auf GitHub ein neues Repository erstellen, zum Beispiel:

```text
frauen-sport-foerdermonitor
```

Dann alle Dateien aus diesem Projekt in das Repository hochladen.

### 2. GitHub Pages aktivieren

Im Repository:

```text
Settings → Pages → Build and deployment → Source: GitHub Actions
```

### 3. Workflow starten

Danach:

```text
Actions → Update data and deploy GitHub Pages → Run workflow
```

Nach dem ersten Lauf zeigt GitHub die fertige Webadresse an, zum Beispiel:

```text
https://DEIN-NAME.github.io/frauen-sport-foerdermonitor/
```

Diese Adresse kann auf iPhone, iPad, Mac und Windows geöffnet werden.

## Als App auf dem iPhone speichern

In Safari öffnen:

```text
Teilen → Zum Home-Bildschirm
```

Dann erscheint sie wie eine normale App auf dem iPhone.

## Lokale Vorschau

Nur nötig, wenn du sie lokal testen willst:

```bash
npm install
npm run dev
```

## Automatische Aktualisierung

Die Datei `.github/workflows/deploy.yml` startet die Aktualisierung:

- bei jedem Push auf `main`
- manuell über `Run workflow`
- automatisch jeden Tag um 05:15 UTC

Die Aktualisierung ruft öffentliche Online-Treffer ab, bewertet sie und schreibt neue Daten in:

```text
public/data/items.json
public/data/briefing.json
```

Im Deployment werden diese aktualisierten Daten direkt verwendet.

## Quellen ändern

Quellen stehen in:

```text
public/data/sources.json
```

Dort kannst du neue Quellen ergänzen, zum Beispiel Stadt Augsburg, Stiftungen, Verbände oder Förderportale.

Beispiel:

```json
{
  "name": "Neue Stiftung",
  "type": "website",
  "category": "Fördermittel",
  "region": "Bayern",
  "url": "https://example.org",
  "weight": 8,
  "keywords": ["Frauen", "Sport", "Förderung"]
}
```

## Suchlogik ändern

Die wichtigsten Suchbegriffe stehen in:

```text
scripts/update-data.js
```

Dort kannst du in `KEYWORDS` neue Suchanfragen ergänzen.

## Wichtiger Hinweis

Diese App ist ein Monitoring- und Briefing-Werkzeug. Sie ersetzt keine offizielle Förderberatung. Förderbedingungen, Fristen, Antragsberechtigung und Rechtsfragen müssen immer bei der Originalquelle geprüft werden.
