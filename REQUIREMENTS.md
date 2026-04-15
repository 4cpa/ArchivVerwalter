# Anforderungen — ArchivVerwalter

## Zweck

Webbasierte Archiv-Verwaltungsapplikation, bei der beliebige Datenarchive (lokale Verzeichnisse) angeschlossen, indexiert, gefiltert, dedupliziert und übersichtlich ausgegeben werden.

---

## Funktionale Anforderungen

### F1 — Archiv-Verwaltung
- [x] Beliebige lokale Verzeichnisse als Archive registrieren
- [x] Archive benennen (Name frei wählbar)
- [x] Archive aus dem Index entfernen (Dateien auf Disk bleiben erhalten)
- [x] Mehrere Archive gleichzeitig verwalten

### F2 — Indexierung (Scan)
- [x] Rekursives Durchlaufen des gesamten Archivverzeichnisses
- [x] Indexierung: Name, Pfad, Dateityp, Grösse, Änderungsdatum
- [x] SHA-256-Hash pro Datei (Streaming, memory-effizient)
- [x] Wiederholbares Scannen (Upsert — Update statt Duplikat)
- [x] Fortschrittsanzeige während des Scans
- [x] Scan läuft asynchron (UI bleibt bedienbar)
- [x] Stale-Pruning: Einträge für gelöschte Dateien werden bereinigt
- [x] Unlesbare Verzeichnisse werden übersprungen (kein Absturz)

### F3 — Suche & Filter
- [x] Volltextsuche nach Dateiname (Teilstring)
- [x] Filter nach Dateityp (Endung)
- [x] Filter nach Archiv
- [x] Filter "Nur Duplikate"
- [x] Sortierung nach: Name, Typ, Grösse, Änderungsdatum, Indexierungsdatum
- [x] Sortierrichtung: aufsteigend / absteigend
- [x] Paginierung (konfigurierbare Seitengrösse, max. 500)

### F4 — Datei-Aktionen
- [x] Datei herunterladen (Browser-Download)
- [x] Datei inline anzeigen (Vorschau für Bilder, PDFs)
- [x] Dateipfad in Zwischenablage kopieren
- [x] Datei löschen (Disk + Index)
- [x] Datei nur aus Index entfernen (Disk bleibt unberührt)
- [x] Datei mit Standardanwendung öffnen (server-seitig, xdg-open/open/start)

### F5 — Duplikat-Management
- [x] Duplikate erkennen anhand SHA-256-Hash
- [x] Duplikat-Gruppen anzeigen (alle betroffenen Dateien)
- [x] "Behalten"-Datei auswählen
- [x] Duplikate einer Gruppe in einem Schritt auflösen
- [x] Anzahl Duplikat-Gruppen im Sidebar-Badge

### F6 — Monitoring
- [x] Health-Endpoint: Status, Uptime, Archivanzahl, Dateianzahl, Gesamtgrösse, Duplikat-Gruppen, RAM, Node-Version
- [x] HTTP-Request-Logging (Methode, URL, Zeitstempel)
- [x] Applikations-Logging (INFO, WARN, ERROR, DEBUG) in Datei und Konsole
- [x] Log-Rotation bei 5 MB

---

### F7 — Mehrsprachigkeit
- [x] Benutzeroberfläche vollständig auf Deutsch, Englisch und Französisch verfügbar
- [x] Sprachumschaltung per Klick (DE / EN / FR) ohne Seitenneuladung
- [x] Gewählte Sprache wird in `localStorage` gespeichert und beim nächsten Start wiederhergestellt
- [x] Alle UI-Texte, Toast-Nachrichten, Bestätigungsdialoge und Tabellenkopfzeilen übersetzt
- [x] Datum- und Zahlenformatierung je nach Sprache (de-CH, en-GB, fr-CH)
- [x] Pfad-Platzhalter passt sich dem Server-Betriebssystem an (Windows vs. POSIX)

### F8 — Plattformunterstützung
- [x] Windows — `start ""` über Shell für Datei-Öffnen; POSIX-kompatible Pfadverarbeitung via Node `path`
- [x] macOS — `open`-Befehl für Datei-Öffnen
- [x] Linux — `xdg-open`-Befehl für Datei-Öffnen
- [x] Server-Plattform wird im Health-Endpoint zurückgegeben (`platform`-Feld)

---

## Nicht-funktionale Anforderungen

### NF1 — Performance
- Hashing via Streams (kein RAM-Overflow bei grossen Dateien)
- WAL-Modus für SQLite (bessere Concurrent-Read-Performance)
- Paginierung verhindert Laden aller Dateien auf einmal
- Debounce bei Sucheingaben (max. 1 Request pro 300 ms)

### NF2 — Sicherheit
- Sort-Spalten werden gegen Whitelist geprüft (kein SQL-Injection via Query-Param)
- Alle DB-Queries parametrisiert (keine String-Konkatenation)
- `xdg-open`-Aufruf mit escaped Pfad
- App bindet standardmässig nur auf `127.0.0.1` (nicht öffentlich)

### NF3 — Zuverlässigkeit
- Graceful Shutdown (SIGTERM/SIGINT) mit Force-Exit nach 10 s
- Fehler beim Scannen einzelner Dateien unterbrechen nicht den Gesamtscan
- ENOENT beim Löschen wird ignoriert (Datei schon weg — kein Fehler)
- Foreign Key Constraints mit CASCADE DELETE

### NF4 — Wartbarkeit
- Klare Schichtentrennung: `db.js` → `scanner.js` / `dedup.js` → `server.js`
- Kein Framework im Frontend (Vanilla JS, keine Build-Pipeline)
- Jest-Tests für alle Module mit In-Memory-SQLite und Temp-Verzeichnissen

---

## Technologie-Stack

| Komponente       | Technologie           |
|------------------|-----------------------|
| Laufzeit         | Node.js ≥ 18          |
| Webserver        | Express 4             |
| Datenbank        | SQLite 3 (WAL-Modus)  |
| Hashing          | Node.js `crypto`      |
| Frontend         | Vanilla JS / HTML / CSS |
| Tests            | Jest + supertest      |

---

## Offene Punkte / mögliche Erweiterungen

| Priorität | Feature                                               |
|-----------|-------------------------------------------------------|
| Mittel    | CSV/Excel-Export der Dateiliste                      |
| Mittel    | Bild-Thumbnails in der Tabelle                       |
| Mittel    | `fs.watch` für automatischen Re-Scan bei Änderungen  |
| Niedrig   | Drag & Drop eines Ordners → neues Archiv             |
| Niedrig   | SFTP/S3-Archiv-Support                               |
| Niedrig   | Benutzerauthentifizierung (wenn öffentlich erreichbar)|
| Niedrig   | Batch-Aktionen (mehrere Dateien gleichzeitig löschen) |
