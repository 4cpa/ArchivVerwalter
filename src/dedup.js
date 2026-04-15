'use strict';

const fs = require('fs');

/**
 * Find all duplicate groups (files sharing the same SHA-256 hash).
 * Each group contains the full file records joined with archive name.
 *
 * @param {import('./db')} db
 * @returns {Promise<Array<{ hash: string, count: number, files: Array }>>}
 */
async function findDuplicates(db) {
  // Hashes that appear more than once
  const hashes = await db.all(`
    SELECT hash, COUNT(*) AS count
    FROM   files
    WHERE  hash IS NOT NULL
    GROUP  BY hash
    HAVING count > 1
    ORDER  BY count DESC, hash
  `);

  const groups = [];
  for (const { hash, count } of hashes) {
    const files = await db.all(
      `SELECT f.*, a.name AS archive_name
       FROM   files f
       JOIN   archives a ON a.id = f.archive_id
       WHERE  f.hash = ?
       ORDER  BY f.indexed_at ASC`,
      [hash]
    );
    groups.push({ hash, count, files });
  }

  return groups;
}

/**
 * Delete a single file from disk and remove its DB record.
 *
 * @param {import('./db')} db
 * @param {number}         fileId
 * @returns {Promise<{ id: number, path: string, name: string }>}
 */
async function deleteFile(db, fileId) {
  const file = await db.get('SELECT id, path, name FROM files WHERE id = ?', [fileId]);
  if (!file) throw Object.assign(new Error('File not found'), { code: 'NOT_FOUND' });

  try {
    await fs.promises.unlink(file.path);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // ignore "already gone"
  }

  await db.run('DELETE FROM files WHERE id = ?', [fileId]);
  return file;
}

/**
 * Resolve a duplicate group: keep one file, delete the rest.
 *
 * @param {import('./db')} db
 * @param {number}         keepId    file ID to keep
 * @param {number[]}       deleteIds file IDs to delete
 * @returns {Promise<{ deleted: Array, errors: Array }>}
 */
async function resolveGroup(db, keepId, deleteIds) {
  const deleted = [];
  const errors  = [];

  for (const id of deleteIds) {
    if (id === keepId) continue; // safety guard
    try {
      const file = await deleteFile(db, id);
      deleted.push(file);
    } catch (err) {
      errors.push({ id, message: err.message });
    }
  }

  return { deleted, errors };
}

/**
 * Count how many duplicate groups exist (quick summary for UI badge).
 *
 * @param {import('./db')} db
 * @returns {Promise<number>}
 */
async function countDuplicateGroups(db) {
  const row = await db.get(`
    SELECT COUNT(*) AS cnt
    FROM (
      SELECT hash
      FROM   files
      WHERE  hash IS NOT NULL
      GROUP  BY hash
      HAVING COUNT(*) > 1
    )
  `);
  return row ? row.cnt : 0;
}

module.exports = { findDuplicates, deleteFile, resolveGroup, countDuplicateGroups };
