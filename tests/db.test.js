'use strict';

const Database = require('../src/db');

let db;

beforeEach(async () => {
  db = new Database(':memory:');
  await db.open();
  await db.init();
});

afterEach(async () => {
  await db.close();
});

describe('Database.open + init', () => {
  test('opens and initialises without error', async () => {
    const archives = await db.all('SELECT * FROM archives');
    const files    = await db.all('SELECT * FROM files');
    expect(archives).toEqual([]);
    expect(files).toEqual([]);
  });

  test('foreign_keys are enabled', async () => {
    const row = await db.get('PRAGMA foreign_keys');
    expect(row.foreign_keys).toBe(1);
  });

  test('init() is idempotent', async () => {
    await expect(db.init()).resolves.not.toThrow();
    await expect(db.init()).resolves.not.toThrow();
  });
});

describe('Database CRUD', () => {
  test('run() returns lastID and changes', async () => {
    const result = await db.run(
      "INSERT INTO archives (name, path) VALUES ('Test', '/tmp/test')"
    );
    expect(result.lastID).toBe(1);
    expect(result.changes).toBe(1);
  });

  test('get() returns one row', async () => {
    await db.run("INSERT INTO archives (name, path) VALUES ('A', '/a')");
    const row = await db.get('SELECT * FROM archives WHERE id = ?', [1]);
    expect(row).toMatchObject({ id: 1, name: 'A', path: '/a' });
  });

  test('get() returns undefined for missing row', async () => {
    const row = await db.get('SELECT * FROM archives WHERE id = ?', [999]);
    expect(row).toBeUndefined();
  });

  test('all() returns multiple rows', async () => {
    await db.run("INSERT INTO archives (name, path) VALUES ('A', '/a')");
    await db.run("INSERT INTO archives (name, path) VALUES ('B', '/b')");
    const rows = await db.all('SELECT * FROM archives ORDER BY id');
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('A');
    expect(rows[1].name).toBe('B');
  });

  test('UNIQUE constraint on archives.path', async () => {
    await db.run("INSERT INTO archives (name, path) VALUES ('A', '/dup')");
    await expect(
      db.run("INSERT INTO archives (name, path) VALUES ('B', '/dup')")
    ).rejects.toThrow();
  });

  test('CASCADE delete removes files when archive is deleted', async () => {
    const { lastID: archId } = await db.run(
      "INSERT INTO archives (name, path) VALUES ('X', '/x')"
    );
    await db.run(
      'INSERT INTO files (archive_id, path, name, size) VALUES (?, ?, ?, ?)',
      [archId, '/x/file.txt', 'file.txt', 100]
    );
    await db.run('DELETE FROM archives WHERE id = ?', [archId]);
    const files = await db.all('SELECT * FROM files');
    expect(files).toHaveLength(0);
  });
});
