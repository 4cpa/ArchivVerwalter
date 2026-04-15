'use strict';

const sqlite3 = require('sqlite3');
const fs      = require('fs');
const path    = require('path');

/**
 * Thin Promise wrapper around the sqlite3 callback API.
 * One instance = one open database connection.
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
    await new Promise((resolve, reject) => {
      this._db = new sqlite3.Database(this.dbPath, (err) =>
        err ? reject(err) : resolve()
      );
    });
    // Performance & integrity settings
    await this.run('PRAGMA journal_mode = WAL');
    await this.run('PRAGMA foreign_keys = ON');
    await this.run('PRAGMA synchronous = NORMAL');
  }

  /** Create tables and indexes. Idempotent — safe to call on every start. */
  async init() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS archives (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        path       TEXT    NOT NULL UNIQUE,
        added_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await this.run(`
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

    await this.run(`CREATE INDEX IF NOT EXISTS idx_files_hash    ON files(hash)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_files_archive ON files(archive_id)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_files_ext     ON files(ext)`);
  }

  /** Execute a statement; resolves with { lastID, changes }. */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this._db.run(sql, params, function (err) {
        err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /** Fetch one row; resolves with the row object or undefined. */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this._db.get(sql, params, (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
  }

  /** Fetch all matching rows; resolves with an array. */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this._db.all(sql, params, (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
  }

  /** Close the connection gracefully. */
  close() {
    return new Promise((resolve, reject) => {
      if (!this._db) return resolve();
      this._db.close((err) => {
        this._db = null;
        err ? reject(err) : resolve();
      });
    });
  }
}

module.exports = Database;
