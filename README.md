# ArchivVerwalter

Web-basierte Dateiarchiv-Verwaltung: beliebige Verzeichnisse als Archive anschliessen, Dateien indexieren, filtern, sortieren, Duplikate erkennen und entfernen.

## Features

- **Multi-Archiv** — beliebig viele Verzeichnisse registrieren und separat scannen
- **Volltextsuche** — Dateien nach Name, Typ, Archiv filtern
- **Duplikat-Erkennung** — SHA-256-basiert, gruppenweise anzeigen und auflösen
- **Datei-Aktionen** — Herunterladen, Vorschau, Pfad kopieren, löschen
- **Monitor** — Live-Statistiken (Archive, Dateien, Grösse, RAM, Uptime)
- **Logging** — HTTP-Log + App-Log in `logs/app.log`, automatisches Rotation bei 5 MB
- **Mehrsprachig** — DE / EN / FR, Sprachumschaltung per Klick, Auswahl persistent (localStorage)
- **Plattformübergreifend** — Windows, macOS, Linux

## Voraussetzungen

- **Node.js** ≥ 18
- **npm** ≥ 9 (oder yarn)

## Installation

```bash
cd ArchivVerwalter
npm install
```

## Starten

```bash
npm start
# → http://127.0.0.1:3000
```

### Entwicklungsmodus (live-reload)

```bash
npm run dev
```

### Umgebungsvariablen

| Variable   | Standard               | Beschreibung              |
|------------|------------------------|---------------------------|
| `PORT`     | `3000`                 | HTTP-Port                 |
| `HOST`     | `127.0.0.1`            | Bind-Adresse              |
| `DB_PATH`  | `./data/main.db`       | SQLite-Datenbankpfad      |
| `LOG_DIR`  | `./logs`               | Verzeichnis für Logs      |
| `DEBUG`    | *(nicht gesetzt)*      | Aktiviert Debug-Logging   |

## Tests

```bash
npm test                 # alle Tests einmalig
npm run test:watch       # Tests bei Dateiänderungen
npm run test:coverage    # mit Coverage-Report
```

## Projektstruktur

```
ArchivVerwalter/
├── src/
│   ├── db.js          — SQLite-Wrapper (Promise-API)
│   ├── scanner.js     — Datei-Crawler & SHA-256-Hasher
│   ├── dedup.js       — Duplikat-Erkennung & -Auflösung
│   ├── logger.js      — Datei- & Konsolen-Logger
│   └── server.js      — Express-App mit allen API-Routen
├── public/
│   ├── index.html     — Single-Page-App
│   ├── i18n.js        — Übersetzungen DE / EN / FR
│   ├── app.js         — Frontend-Logik (Vanilla JS)
│   └── style.css      — UI-Styles
├── tests/
│   ├── db.test.js
│   ├── scanner.test.js
│   ├── dedup.test.js
│   └── api.test.js
├── data/              — SQLite-Datenbank (gitignored)
├── logs/              — Logdateien (gitignored)
└── index.js           — Einstiegspunkt
```

## REST-API

### Health

| Methode | Endpoint         | Beschreibung                        |
|---------|------------------|-------------------------------------|
| GET     | `/api/health`    | Status, Statistiken, Uptime         |

### Archive

| Methode | Endpoint                      | Beschreibung                         |
|---------|-------------------------------|--------------------------------------|
| GET     | `/api/archives`               | Alle Archive mit Dateianzahl/Grösse  |
| POST    | `/api/archives`               | Neues Archiv `{ name, path }`        |
| DELETE  | `/api/archives/:id`           | Archiv aus Index entfernen           |
| POST    | `/api/archives/:id/scan`      | Scan starten (asynchron)             |
| GET     | `/api/archives/:id/scan/status` | Scan-Status abfragen               |

### Dateien

| Methode | Endpoint                    | Beschreibung                                |
|---------|-----------------------------|---------------------------------------------|
| GET     | `/api/files`                | Dateiliste (Filter + Sortierung + Paging)   |
| DELETE  | `/api/files/:id`            | Datei löschen (`?dbOnly=true` = nur Index)  |
| GET     | `/api/files/:id/download`   | Datei herunterladen                         |
| GET     | `/api/files/:id/preview`    | Datei inline anzeigen (Bilder, PDF)         |
| GET     | `/api/files/:id/open`       | Mit Standard-App öffnen (server-seitig)     |

#### Query-Parameter für `/api/files`

| Parameter | Typ     | Beschreibung                             |
|-----------|---------|------------------------------------------|
| `archive` | number  | Auf ein Archiv einschränken              |
| `ext`     | string  | Dateiendung (z.B. `pdf`)                |
| `name`    | string  | Teilstring-Suche im Dateinamen           |
| `dups`    | boolean | Nur Duplikate anzeigen (`true`)          |
| `sort`    | string  | `name` \| `size` \| `ext` \| `modified_at` |
| `order`   | string  | `asc` \| `desc`                         |
| `page`    | number  | Seitennummer (Standard: 1)              |
| `limit`   | number  | Ergebnisse pro Seite (max: 500)         |

### Duplikate

| Methode | Endpoint                    | Beschreibung                                    |
|---------|-----------------------------|-------------------------------------------------|
| GET     | `/api/duplicates`           | Alle Duplikat-Gruppen                          |
| POST    | `/api/duplicates/resolve`   | `{ keepId, deleteIds[] }` — Gruppe auflösen    |

## Wie es funktioniert

1. **Archiv registrieren** — Pfad + Name eingeben → im Index gespeichert
2. **Scannen** — Server durchläuft rekursiv das Verzeichnis, berechnet SHA-256-Hash jeder Datei per Stream
3. **Duplikate** — Dateien mit identischem Hash werden gruppiert
4. **Auflösen** — Eine Datei behalten, Rest von Disk + Index löschen
5. **Stale-Prune** — Nach jedem Scan werden verwaiste Einträge (Datei gelöscht) bereinigt

## Lizenz

MIT
