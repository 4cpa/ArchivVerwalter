'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

/**
 * Compute SHA-256 hash of a file via streaming.
 * Handles large files without loading them entirely into memory.
 *
 * @param {string} filePath
 * @returns {Promise<string>} hex digest
 */
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data',  (chunk) => hash.update(chunk));
    stream.on('end',   ()      => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Async generator that yields every file path under `dir` recursively.
 * Silently skips directories that cannot be read (permissions, symlink loops).
 *
 * @param {string} dir
 * @yields {string} absolute file path
 */
async function* walkDir(dir) {
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return; // skip unreadable directory
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

/**
 * Scan (or re-scan) an archive directory and index every file into the DB.
 * Uses INSERT OR REPLACE so repeated scans update existing records.
 *
 * @param {import('./db')} db
 * @param {number}         archiveId
 * @param {string}         archivePath
 * @param {Function}       [onProgress]  called after each file with { indexed, errors, currentFile }
 * @returns {Promise<{ indexed: number, errors: number }>}
 */
async function scanArchive(db, archiveId, archivePath, onProgress) {
  let indexed = 0;
  let errors  = 0;

  for await (const filePath of walkDir(archivePath)) {
    try {
      const stat = await fs.promises.stat(filePath);
      const name = path.basename(filePath);
      const raw  = path.extname(filePath).toLowerCase();
      const ext  = raw.length > 1 ? raw.slice(1) : null; // strip leading dot

      const hash = await hashFile(filePath);
      const createdAt = stat.birthtimeMs > 1000 ? stat.birthtime.toISOString() : null;

      await db.run(
        `INSERT INTO files (archive_id, path, name, ext, size, hash, modified_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(path) DO UPDATE SET
           name        = excluded.name,
           ext         = excluded.ext,
           size        = excluded.size,
           hash        = excluded.hash,
           modified_at = excluded.modified_at,
           created_at  = excluded.created_at,
           indexed_at  = datetime('now')`,
        [archiveId, filePath, name, ext, stat.size, hash, stat.mtime.toISOString(), createdAt]
      );

      indexed++;
      if (onProgress) onProgress({ indexed, errors, currentFile: filePath });
    } catch {
      errors++;
    }
  }

  return { indexed, errors };
}

/**
 * Remove DB records for files that no longer exist on disk.
 * Useful after external deletions.
 *
 * @param {import('./db')} db
 * @param {number}         archiveId
 * @returns {Promise<number>} number of records removed
 */
async function pruneStale(db, archiveId) {
  const rows = await db.all(
    'SELECT id, path FROM files WHERE archive_id = ?',
    [archiveId]
  );
  let removed = 0;
  for (const row of rows) {
    try {
      await fs.promises.access(row.path, fs.constants.F_OK);
    } catch {
      await db.run('DELETE FROM files WHERE id = ?', [row.id]);
      removed++;
    }
  }
  return removed;
}

module.exports = { scanArchive, pruneStale, walkDir, hashFile };
