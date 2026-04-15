# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
