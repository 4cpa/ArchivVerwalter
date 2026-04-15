# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
