# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.2.14] — 2026-04-15

### Fixed
- Duplikate-Ansicht: `<table>`-Rendering vollständig durch CSS-Grid-Zeilen ersetzt.
  Jede Datei-Zeile ist ein `<div class="dup-row">` mit `display:grid` und fixen
  Spaltenbreiten — kein Browser-seitiges Tabellen-Layout mehr, das Zellen kollabieren
  lassen kann. Spaltenköpfe, Zebra-Streifen und Keeper-Hervorhebung bleiben erhalten.

---

## [1.2.13] — 2026-04-15

### Fixed
- Duplikate-Ansicht: Zeilen 2–N einer Gruppe wurden als leere Striche dargestellt,
  weil verschachtelte `<div>`-Blöcke in `<td>` das Layout kollabierten.
  Zellen rendern nun als einfache Text-Zellen; Schriftgrösse angehoben (`.84rem`),
  explizite Textfarbe `#212529`, Zebra-Streifen und stärkere Keeper-Hervorhebung
  sorgen für deutlich bessere Lesbarkeit. `table-layout: fixed` verhindert
  kollabierende Spaltenbreiten.

---

## [1.2.12] — 2026-04-15

### Added
- Duplikate-Ansicht: Tabellenkopfzeile (Name / Archiv / Grösse / Geändert) in jeder
  Duplikatgruppe; Dateiname und vollständiger Pfad werden pro Zeile angezeigt; Gruppen-
  Karten haben mehr visuellen Abstand und sind leichter zu lesen.
- Mehrfachauswahl in der Datei-Liste: neue Schaltfläche „Pfade kopieren" in der
  Batch-Aktionsleiste kopiert die Pfade aller sichtbar ausgewählten Dateien in die
  Zwischenablage (eine Zeile pro Pfad).
- Archiv-Quellennavigation: ↑-Schaltfläche im Modal-Header springt direkt eine Ebene
  hoch; Breadcrumb-Segmente sind klickbar und erlauben den Sprung zu beliebigen
  Vorfahren-Ordnern; Backspace-Taste navigiert ebenfalls eine Ebene hoch (sofern kein
  Eingabefeld fokussiert ist).
- Startbildschirm (Windows 11): Fenster wird erst sichtbar, nachdem der dunkle
  Ladebildschirm vollständig gerendert ist (`show:false` + `ready-to-show`), sodass
  kein weisser Flash mehr vor der Ladeanimation erscheint.

---

## [1.2.11] — 2026-04-15

### Added
- Mehrfachauswahl in der Datei-Liste: Checkbox-Spalte mit „Alle wählen"-Header-Checkbox;
  blau hervorgehobene Batch-Aktionsleiste erscheint sobald Dateien ausgewählt sind und
  erlaubt das gleichzeitige Löschen beliebig vieler Dateien.
- Duplikate-Ansicht: Client-seitige Paginierung (30 Gruppen/Seite) verhindert, dass
  Tausende von Duplikat-Gruppen auf einmal in den DOM gerendert werden — die Ansicht ist
  nun performant und zeigt echten Inhalt statt horizontaler Striche.

### Fixed
- Scan-Button in der Archiv-Sidebar ist jetzt dauerhaft sichtbar (▶ Scan starten) statt
  nur beim Hover aufzutauchen; während eines laufenden Scans zeigt er „Wird gescannt…".
- Index-Entfernen (macOS): Der Löschen-Button wechselt sofort in einen Ladezustand (…),
  damit das Warten auf die SQLite-Operation klar als laufend erkennbar ist.

---

## [1.2.10] — 2026-04-15

### Fixed
- NSIS-Installer: `ManifestDPIAware true` in `build/installer.nsh` eingebunden — ohne
  diesen Eintrag rendert Windows den Installer-Dialog per Bitmap-Hochskalierung, was auf
  HiDPI-/Retina-Displays zu unscharf wirkenden Schriften führt. Mit dem DPI-Manifest wird
  die UI in nativer Auflösung gezeichnet.

---

## [1.2.9] — 2026-04-15

### Fixed
- Laufwerk-Icons (HDD/USB/NET/CD) nicht dargestellt: Emoji U+1F5B4 🖴 und
  Verwandte sind in den meisten Windows-Emoji-Fonts nicht enthalten und werden
  als kaputtes Platzhalter-Zeichen gerendert. Ersetzt durch farbige Text-Badges
  (`HDD` blau / `USB` grün / `NET` orange / `CD` violett) — keine Font-
  Abhängigkeit, funktioniert in jedem Chromium/Windows zuverlässig.

---

## [1.2.8] — 2026-04-15

### Fixed
- win11-arm64 Installer: native Modul `better-sqlite3` wurde bisher mit der x64-Architektur
  des CI-Runners gebaut und in den arm64-Installer eingebettet. Beim Start auf echter
  ARM-Hardware lehnte die arm64-Electron-Binary das x64-`.node`-File ab — die App startete
  nicht und der Installer-Shortcut zeigte ins Leere.
  Lösung: `dist:win11` aufgeteilt in `dist:win11:x64` und `dist:win11:arm64`; jeder
  Schritt ruft `electron-builder install-app-deps --arch <ziel>` vor dem Packaging auf,
  sodass `better-sqlite3` das passende vorkompilierte Binary herunterlädt.
  GitHub-Actions-Workflow entsprechend in zwei separate Matrix-Jobs aufgeteilt.

---

## [1.2.7] — 2026-04-15

### Fixed
- Laufwerkserkennung hängt nicht mehr: `fs.promises.access()` für A–Z-Buchstabenprüfung
  (Windows) hatte keinen Timeout — eine einzige nicht erreichbare Netzlaufwerk-Zuordnung
  (z.B. getrenntes Z:) blockierte `Promise.all` für 30+ Sekunden und liess die
  Laufwerksliste nie laden. Jedes Prüfung wird nun nach 1,5 s abgebrochen.
  Gleiches gilt für alle `readdir`-Aufrufe in der Laufwerks- und Verzeichnis-API
  (macOS/Linux: 3 s, Browse-Endpoint: 10 s).
- NSIS-Installer: `runAfterFinish: false` gesetzt — ohne diese Option versuchte der
  Installer, die App direkt nach Installation zu starten. Da Windows-Defender dabei
  alle nativen Module erstmals scannt, erschien dieser erste Start als App-Absturz
  im Installer-Fenster. Die App wird jetzt nicht mehr automatisch gestartet.
- Installer-Kompression von `store` auf `normal` zurückgestellt — `store` erzeugt
  eine 2–3× grössere .exe, die Defender vor dem Anzeigen des Dialogs vollständig
  scannt. `normal` (zlib) ist der richtige Kompromiss: kleinere Datei, schnellerer
  Dialog, akzeptable Extraktionszeit.

---

## [1.2.6] — 2026-04-15

### Fixed
- Laufwerksbrowser komplett als Modal-Overlay neu gebaut — war vorher als 160 px
  hohes Inline-Panel in der Sidebar eingebettet; Laufwerke und Ordner waren kaum
  erreichbar. Das neue Modal öffnet sich zentriert über der App (700 × 540 px),
  listet alle Volumes prominent auf und erlaubt beliebig tiefe Navigation.
- "Laufwerke"-Schaltfläche (🖴) im Modal-Header kehrt jederzeit zur Laufwerksliste
  zurück, ohne das Modal zu schliessen — auch nach einem Navigationsfehler.
- `waitForServer` in `electron/main.js`: Response-Body wird jetzt mit `res.resume()`
  sofort geleert (Sockets blieben sonst offen), jeder Versuch hat einen 1-s-Timeout
  (verhindert hängende Verbindungen beim Hochfahren), und die Retry-Grenze wurde von
  40 × 200 ms (8 s) auf 150 × 200 ms (30 s) erhöht — ausreichend auch für
  Antivirus-Scans beim Erststart unter Windows.
- NSIS-Installer: Kompression von `normal` auf `store` geändert — Dateien werden
  nicht mehr komprimiert, die Installation ist dadurch rein I/O-gebunden und
  deutlich schneller abgeschlossen.

---

## [1.2.5] — 2026-04-15

### Fixed
- Windows CI build: upgraded `better-sqlite3` from v9 to v12 — v9 forced `/std:c++17`
  which conflicted with Electron 41's C++20 requirement, causing `C1189` compile error.
  v12 ships prebuilt binaries for Electron 41 (x64 + arm64) and builds with C++20.

---

## [1.2.4] — 2026-04-15

### Fixed
- Test suite: eliminated a deterministic flaky failure in the UNIQUE-constraint test.
  `better-sqlite3`'s native addon stores the `SqliteError` class from the first Jest VM
  context it's loaded in; subsequent test files ran in a different context where
  `instanceof Error` returned `false`, causing `rejects.toThrow()` to silently pass.
  `db.run()` now wraps cross-context errors in a plain `Error` to keep the prototype chain
  in the current context.
- Test suite: scan test in `api.test.js` now polls until scan is `done` before returning,
  and an `afterAll` drains pending I/O — prevents async scan callbacks from bleeding into
  subsequent test files.

---

## [1.2.3] — 2026-04-15

### Fixed
- Windows drive browser: replaced WMIC-primary detection (locale-fragile, missed drives)
  with parallel A–Z `Promise.all` access check — all attached drives now reliably listed
- Windows startup: removed `show:false` / `ready-to-show` delay from BrowserWindow —
  branded loading screen appears immediately on double-click without waiting for paint event

---

## [1.2.2] — 2026-04-15

---

## [1.2.1] — 2026-04-15

### Changed
- Archive name field removed — name is now auto-derived from path basename
  (e.g. /media/usb/Fotos → "Fotos", C:\ → "C:", \\Server\Share → "Share")
- Add-archive form shows only path input + browse button

### Performance
- Installer compression: normal (was maximum/LZMA) — ~2x faster decompression
- requestedExecutionLevel: asInvoker — no UAC prompt, no SmartScreen admin scan
- perMachine: false — installs to %LOCALAPPDATA%\Programs without elevation
- Chromium: disabled background networking, SafeBrowsing, TranslateUI,
  phishing detection, renderer backgrounding — faster startup on Windows
- app.setAppUserModelId set for correct Windows taskbar grouping

---

## [1.2.0] — 2026-04-15

### Added
- Windows: wmic logicaldisk replaces slow A–Z scan — shows USB, Netzwerk, CD/DVD labels
- Linux: network mounts from /proc/mounts (CIFS, NFS, NFS4, SSHFS, davfs, GlusterFS)
- Drive browser icons distinguish network / USB / local / CD

### Fixed
- Windows slow start: BrowserWindow now shows immediately with branded loading screen
  while server boots in background (was blank for up to 9 seconds)
- Windows "not responding": before-quit has a 1.5 s hard timeout on db.close()
  so the process never hangs when closed via Task Manager

---

## [1.1.1] — 2026-04-15

### Changed
- App icon: white @4 logo on round #1a1f2e circle, transparent background
- logo-white.png: white @4 on transparent (was invisible white-on-white)
- favicon.png: black @4 on transparent (was black-on-white)
- icon.ico regenerated with 16/32/48/64/128/256 px layers

---

## [1.1.0] — 2026-04-15

### Added
- Filesystem browser in add-archive form: browse connected drives, USB sticks, network mounts and local folders without typing a path
- `/api/fs/drives` endpoint lists available volumes per platform (Windows A–Z, macOS `/Volumes/`, Linux `/media`, `/mnt`, `/run/media`)
- `/api/fs/browse` endpoint navigates directory trees, returns sorted subdirectories only

### Fixed
- Single-instance lock (`app.requestSingleInstanceLock`) prevents `EADDRINUSE` crash when a second instance starts during update or auto-start
- Second launch attempt now brings the existing window to the foreground instead of silently exiting
- Friendly error dialog when port is already in use, with Task Manager instructions for Windows users

---

## [1.0.6] — 2026-04-15

---

## [1.0.5] — 2026-04-15

---

## [1.0.4] — 2026-04-15

---

## [1.0.3] — 2026-04-15

---

## [1.0.2] — 2026-04-15

---

## [1.0.1] — 2026-04-15

### Added
- Electron desktop app: Express server runs inside the main process; BrowserWindow loads localhost
- electron-builder packaging: Windows NSIS installer (.exe), macOS DMG (.dmg), Linux AppImage + .deb
- Docker support: multi-stage Alpine image with HEALTHCHECK
- docker-compose.yml with persistent volumes and read-only archive mount examples
- `npm run dist` / `dist:win` / `dist:mac` / `dist:linux` build commands
- `npm run electron` to launch desktop app from source
- `npm run electron:rebuild` to rebuild native modules for the current Electron version

---

## [1.0.0] — 2026-04-15

### Added
- Multi-archive management: register any number of local directories as named archives
- Recursive filesystem crawler with SHA-256 streaming hash (memory-efficient)
- Upsert-based re-scan: repeated scans update existing records without duplicating them
- Stale-prune: DB entries for files deleted outside the app are cleaned up after each scan
- SHA-256 duplicate detection grouped by hash; per-group keeper selection
- One-click duplicate resolution (keep one, delete the rest from disk + index)
- File table: sort by name / type / size / modified date, paginated (max 500 per page)
- Filter by filename (partial), extension, archive, duplicates-only flag
- File actions: download, inline preview, copy path to clipboard, delete (disk + index or index-only)
- REST API: archives, files, duplicates, health/monitoring
- Health endpoint returns status, uptime, archive/file counts, total size, RAM, Node version and platform
- Web UI: single-page app, no build step (Vanilla JS + CSS)
- Multilingual interface: **German, English, French** — switchable at runtime, persisted in localStorage
- Date/number formatting locale-aware per selected language (de-CH / en-GB / fr-CH)
- Path placeholder adapts to server OS (Windows `C:\…` vs POSIX `/home/…`)
- Cross-platform file-open: `xdg-open` (Linux), `open` (macOS), `start` (Windows)
- HTTP request logging + rotating app log (5 MB cap) in `logs/app.log`
- 55 Jest tests covering DB, scanner, dedup and API layers
- Graceful shutdown on SIGTERM/SIGINT with 10 s force-exit fallback
- SQLite WAL mode + foreign-key cascade delete
