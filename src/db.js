'use strict';

const BetterSqlite3 = require('better-sqlite3');
const fs            = require('fs');
const path          = require('path');

/**
 * Thin Promise wrapper around the better-sqlite3 synchronous API.
 * Keeps the same async interface as the previous sqlite3-based class so
 * all callers (server.js, scanner.js, dedup.js) remain unchanged.
 *
 * better-sqlite3 advantages over sqlite3:
 *  – Official prebuilt binaries for every Electron release (no compilation).
 *  – ~2-3× faster for typical workloads.
 *  – Simpler error model (throws synchronously instead of errback).
 */
class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this._db    = null;
  }

  /** Open the database file (creates it + parent directory if needed). */
  async open() {
    if (this._db) return; // already open
    if (this.dbPath !== ':memory:') {
      await fs.promises.mkdir(path.dirname(this.dbPath), { recursive: true });
    }
    this._db = new BetterSqlite3(this.dbPath);
    // Performance & integrity settings
    this._db.pragma('journal_mode = WAL');
    this._db.pragma('foreign_keys = ON');
    this._db.pragma('synchronous = NORMAL');
  }

  /** Create tables and indexes. Idempotent — safe to call on every start. */
  async init() {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS archives (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        path       TEXT    NOT NULL UNIQUE,
        added_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);

    this._db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        archive_id   INTEGER NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
        path         TEXT    NOT NULL UNIQUE,
        name         TEXT    NOT NULL,
        ext          TEXT,
        size         INTEGER NOT NULL DEFAULT 0,
        hash         TEXT,
        modified_at  TEXT,
        indexed_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);

    this._db.exec(`CREATE INDEX IF NOT EXISTS idx_files_hash    ON files(hash)`);
    this._db.exec(`CREATE INDEX IF NOT EXISTS idx_files_archive ON files(archive_id)`);
    this._db.exec(`CREATE INDEX IF NOT EXISTS idx_files_ext     ON files(ext)`);
  }

  /**
   * Execute a statement; resolves with { lastID, changes }.
   * Maps better-sqlite3's `lastInsertRowid` → `lastID` for API compatibility.
   * better-sqlite3 throws synchronously on constraint violations — we convert
   * those to rejected Promises so callers can use the same await/catch pattern.
   */
  run(sql, params = []) {
    try {
      const result = this._db.prepare(sql).run(...params);
      return Promise.resolve({ lastID: result.lastInsertRowid, changes: result.changes });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /** Fetch one row; resolves with the row object or undefined. */
  get(sql, params = []) {
    try {
      return Promise.resolve(this._db.prepare(sql).get(...params));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /** Fetch all matching rows; resolves with an array. */
  all(sql, params = []) {
    try {
      return Promise.resolve(this._db.prepare(sql).all(...params));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /** Close the connection gracefully. */
  close() {
    if (this._db) {
      this._db.close();
      this._db = null;
    }
    return Promise.resolve();
  }
}

module.exports = Database;
