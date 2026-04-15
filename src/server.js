'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { exec } = require('child_process');

const { scanArchive, pruneStale } = require('./scanner');
const { findDuplicates, deleteFile, resolveGroup, countDuplicateGroups } = require('./dedup');
const logger = require('./logger');

// Whitelisted sort columns to prevent SQL injection
const SORT_COLS = new Set(['name', 'size', 'ext', 'modified_at', 'indexed_at']);

/**
 * Open a file with the default OS application.
 * Cross-platform: Windows, macOS, Linux.
 *
 * @param {string} filePath absolute path to the file
 */
function openWithOS(filePath) {
  const p = filePath;
  if (process.platform === 'win32') {
    // `start` is a CMD shell built-in; shell:true is required on Windows
    const safe = p.replace(/"/g, '""');
    exec(`start "" "${safe}"`, { shell: true });
  } else if (process.platform === 'darwin') {
    exec(`open "${p.replace(/"/g, '\\"')}"`);
  } else {
    // Linux and other POSIX
    exec(`xdg-open "${p.replace(/"/g, '\\"')}"`);
  }
}

/**
 * Build and return the Express application.
 * The `db` instance must already be open and initialised.
 *
 * @param {import('./db')} db
 * @returns {import('express').Application}
 */
function createApp(db) {
  const app = express();

  // ── Middleware ──────────────────────────────────────────────────────────────
  app.use(express.json());

  // Minimal HTTP request logger
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
  });

  // Serve the web UI.
  // PUBLIC_DIR is overridden by electron/main.js when running as a packaged app
  // so that static files are read from outside the asar archive.
  const publicDir = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  // ── Health / Monitoring ──────────────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    try {
      const [archives, files, sizeRow, dupGroups] = await Promise.all([
        db.get('SELECT COUNT(*) AS cnt FROM archives'),
        db.get('SELECT COUNT(*) AS cnt FROM files'),
        db.get('SELECT COALESCE(SUM(size), 0) AS total FROM files'),
        countDuplicateGroups(db),
      ]);
      res.json({
        status:          'ok',
        uptime:          Math.round(process.uptime()),
        archives:        archives.cnt,
        files:           files.cnt,
        totalBytes:      sizeRow.total,
        duplicateGroups: dupGroups,
        memoryMB:        Math.round(process.memoryUsage().rss / 1024 / 1024),
        nodeVersion:     process.version,
        platform:        process.platform,  // 'win32' | 'darwin' | 'linux'
      });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Archives ─────────────────────────────────────────────────────────────────
  app.get('/api/archives', async (_req, res) => {
    try {
      const archives = await db.all(`
        SELECT a.*,
               COUNT(f.id)            AS file_count,
               COALESCE(SUM(f.size), 0) AS total_size
        FROM   archives a
        LEFT JOIN files f ON f.archive_id = a.id
        GROUP  BY a.id
        ORDER  BY a.added_at DESC
      `);
      res.json(archives);
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/archives', async (req, res) => {
    const { name, path: archivePath } = req.body || {};
    if (!name || !archivePath) {
      return res.status(400).json({ error: '"name" and "path" are required' });
    }

    try {
      await fs.promises.access(archivePath, fs.constants.R_OK);
    } catch {
      return res.status(400).json({ error: 'Path does not exist, is not readable, or network share is not reachable' });
    }

    try {
      const { lastID } = await db.run(
        'INSERT INTO archives (name, path) VALUES (?, ?)',
        [name.trim(), path.resolve(archivePath)]
      );
      const archive = await db.get('SELECT * FROM archives WHERE id = ?', [lastID]);
      logger.info(`Archive added: "${name}" → ${archivePath}`);
      res.status(201).json(archive);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'This path is already registered' });
      }
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/archives/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    try {
      const archive = await db.get('SELECT * FROM archives WHERE id = ?', [id]);
      if (!archive) return res.status(404).json({ error: 'Archive not found' });

      await db.run('DELETE FROM archives WHERE id = ?', [id]);
      logger.info(`Archive removed: "${archive.name}"`);
      res.json({ message: 'Archive removed', archive });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Scan ─────────────────────────────────────────────────────────────────────
  /** In-memory scan state: archiveId → { started, progress, result } */
  const activeScans = new Map();

  app.post('/api/archives/:id/scan', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const archive = await db.get('SELECT * FROM archives WHERE id = ?', [id]);
      if (!archive) return res.status(404).json({ error: 'Archive not found' });

      if (activeScans.has(id)) {
        return res.status(409).json({ error: 'Scan already running for this archive' });
      }

      activeScans.set(id, { started: new Date().toISOString(), progress: null, done: false });

      // Run async, respond immediately
      scanArchive(db, id, archive.path, (progress) => {
        activeScans.set(id, { ...activeScans.get(id), progress });
      })
        .then(async (result) => {
          const pruned = await pruneStale(db, id);
          logger.info(
            `Scan done: "${archive.name}" — ${result.indexed} indexed, ` +
            `${result.errors} errors, ${pruned} stale removed`
          );
          activeScans.set(id, { ...activeScans.get(id), done: true, result: { ...result, pruned } });
        })
        .catch((err) => {
          logger.error(`Scan failed for "${archive.name}": ${err.message}`);
          activeScans.set(id, { ...activeScans.get(id), done: true, error: err.message });
        });

      res.json({ message: 'Scan started', archiveId: id });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/archives/:id/scan/status', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const scan = activeScans.get(id);
    if (!scan) return res.json({ status: 'idle' });

    const status = scan.done ? 'done' : 'running';

    // Clean up completed scans after first read
    if (scan.done) activeScans.delete(id);

    res.json({ status, ...scan });
  });

  // ── Files ────────────────────────────────────────────────────────────────────
  app.get('/api/files', async (req, res) => {
    const {
      archive, ext, name,
      dups   = 'false',
      page   = '1',
      limit  = '50',
      sort   = 'name',
      order  = 'asc',
    } = req.query;

    const sortCol   = SORT_COLS.has(sort) ? `f.${sort}` : 'f.name';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    const pageNum   = Math.max(1, parseInt(page, 10) || 1);
    const limitNum  = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const offset    = (pageNum - 1) * limitNum;

    const conditions = [];
    const params     = [];

    if (archive) { conditions.push('f.archive_id = ?');  params.push(parseInt(archive, 10)); }
    if (ext)     { conditions.push('f.ext = ?');          params.push(ext.toLowerCase()); }
    if (name)    { conditions.push('f.name LIKE ?');      params.push(`%${name}%`); }
    if (dups === 'true') {
      conditions.push(
        'f.hash IN (SELECT hash FROM files WHERE hash IS NOT NULL GROUP BY hash HAVING COUNT(*) > 1)'
      );
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    try {
      const [{ cnt: total }, files] = await Promise.all([
        db.get(`SELECT COUNT(*) AS cnt FROM files f ${where}`, params),
        db.all(
          `SELECT f.*,
                  a.name AS archive_name,
                  (SELECT COUNT(*) FROM files f2 WHERE f2.hash = f.hash AND f2.hash IS NOT NULL) AS dup_count
           FROM   files f
           JOIN   archives a ON a.id = f.archive_id
           ${where}
           ORDER  BY ${sortCol} ${sortOrder}
           LIMIT  ? OFFSET ?`,
          [...params, limitNum, offset]
        ),
      ]);

      res.json({ total, page: pageNum, limit: limitNum, files });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/files/:id/download', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const file = await db.get('SELECT path, name FROM files WHERE id = ?', [id]);
      if (!file) return res.status(404).json({ error: 'File not found' });
      res.download(file.path, file.name);
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/files/:id/preview', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const file = await db.get('SELECT path, name FROM files WHERE id = ?', [id]);
      if (!file) return res.status(404).json({ error: 'File not found' });
      res.sendFile(file.path);
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/files/:id/open', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const file = await db.get('SELECT path FROM files WHERE id = ?', [id]);
      if (!file) return res.status(404).json({ error: 'File not found' });

      openWithOS(file.path);
      res.json({ message: 'Opening file', path: file.path });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/files/:id', async (req, res) => {
    const id      = parseInt(req.params.id, 10);
    const dbOnly  = req.query.dbOnly === 'true'; // remove from index only, keep on disk

    try {
      if (dbOnly) {
        const file = await db.get('SELECT id, path, name FROM files WHERE id = ?', [id]);
        if (!file) return res.status(404).json({ error: 'File not found' });
        await db.run('DELETE FROM files WHERE id = ?', [id]);
        logger.info(`Removed from index (kept on disk): ${file.path}`);
        return res.json({ message: 'Removed from index', file });
      }

      const file = await deleteFile(db, id);
      logger.info(`File deleted from disk: ${file.path}`);
      res.json({ message: 'File deleted', file });
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ error: 'File not found' });
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Duplicates ────────────────────────────────────────────────────────────────
  app.get('/api/duplicates', async (_req, res) => {
    try {
      const groups = await findDuplicates(db);
      res.json(groups);
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/duplicates/resolve', async (req, res) => {
    const { keepId, deleteIds } = req.body || {};
    if (!keepId || !Array.isArray(deleteIds) || deleteIds.length === 0) {
      return res.status(400).json({ error: '"keepId" and non-empty "deleteIds" array required' });
    }

    try {
      const result = await resolveGroup(db, keepId, deleteIds);
      logger.info(
        `Resolved duplicates — kept ${keepId}, deleted ${result.deleted.length} files`
      );
      res.json({ message: `Deleted ${result.deleted.length} file(s)`, ...result });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── 404 catch-all ────────────────────────────────────────────────────────────
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}

module.exports = createApp;
