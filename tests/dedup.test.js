'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const Database = require('../src/db');
const { findDuplicates, deleteFile, resolveGroup, countDuplicateGroups } = require('../src/dedup');

let db;
let tmpDir;

async function insertArchive(name = 'TestArch', p = '/tmp') {
  const { lastID } = await db.run(
    'INSERT INTO archives (name, path) VALUES (?, ?)',
    [name, p]
  );
  return lastID;
}

async function insertFile(archiveId, opts = {}) {
  const { path: filePath = `/tmp/f${Date.now()}`, name = 'file.txt', ext = 'txt', size = 100, hash = 'abc' } = opts;
  const { lastID } = await db.run(
    'INSERT INTO files (archive_id, path, name, ext, size, hash) VALUES (?, ?, ?, ?, ?, ?)',
    [archiveId, filePath, name, ext, size, hash]
  );
  return lastID;
}

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-dedup-'));
  db = new Database(':memory:');
  await db.open();
  await db.init();
});

afterEach(async () => {
  await db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── findDuplicates ─────────────────────────────────────────────────────────
describe('findDuplicates', () => {
  test('returns empty array when no duplicates', async () => {
    const archId = await insertArchive();
    await insertFile(archId, { hash: 'aaa' });
    await insertFile(archId, { path: '/tmp/f2.txt', hash: 'bbb' });
    const groups = await findDuplicates(db);
    expect(groups).toHaveLength(0);
  });

  test('groups files by matching hash', async () => {
    const archId = await insertArchive();
    await insertFile(archId, { path: '/tmp/d1.txt', name: 'd1.txt', hash: 'DUPE' });
    await insertFile(archId, { path: '/tmp/d2.txt', name: 'd2.txt', hash: 'DUPE' });
    await insertFile(archId, { path: '/tmp/d3.txt', name: 'd3.txt', hash: 'DUPE' });
    await insertFile(archId, { path: '/tmp/u.txt',  name: 'u.txt',  hash: 'UNIQ' });

    const groups = await findDuplicates(db);
    expect(groups).toHaveLength(1);
    expect(groups[0].hash).toBe('DUPE');
    expect(groups[0].count).toBe(3);
    expect(groups[0].files).toHaveLength(3);
  });

  test('includes archive_name in file records', async () => {
    const archId = await insertArchive('MyArch');
    await insertFile(archId, { path: '/a', hash: 'X' });
    await insertFile(archId, { path: '/b', hash: 'X' });
    const groups = await findDuplicates(db);
    expect(groups[0].files[0].archive_name).toBe('MyArch');
  });
});

// ── countDuplicateGroups ───────────────────────────────────────────────────
describe('countDuplicateGroups', () => {
  test('returns 0 when no duplicates', async () => {
    expect(await countDuplicateGroups(db)).toBe(0);
  });

  test('counts distinct hash groups', async () => {
    const archId = await insertArchive();
    await insertFile(archId, { path: '/1', hash: 'H1' });
    await insertFile(archId, { path: '/2', hash: 'H1' });
    await insertFile(archId, { path: '/3', hash: 'H2' });
    await insertFile(archId, { path: '/4', hash: 'H2' });
    expect(await countDuplicateGroups(db)).toBe(2);
  });
});

// ── deleteFile ─────────────────────────────────────────────────────────────
describe('deleteFile', () => {
  test('deletes file from disk and DB', async () => {
    const filePath = path.join(tmpDir, 'to-delete.txt');
    fs.writeFileSync(filePath, 'bye');

    const archId = await insertArchive('A', tmpDir);
    const fileId = await insertFile(archId, { path: filePath, name: 'to-delete.txt' });

    await deleteFile(db, fileId);

    expect(fs.existsSync(filePath)).toBe(false);
    const row = await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
    expect(row).toBeUndefined();
  });

  test('throws NOT_FOUND for unknown id', async () => {
    await expect(deleteFile(db, 9999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('succeeds if file already gone from disk (ENOENT)', async () => {
    const archId = await insertArchive('B', tmpDir);
    const fileId = await insertFile(archId, { path: '/nonexistent/ghost.txt', name: 'ghost.txt' });
    await expect(deleteFile(db, fileId)).resolves.toMatchObject({ id: fileId });
    const row = await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
    expect(row).toBeUndefined();
  });
});

// ── resolveGroup ───────────────────────────────────────────────────────────
describe('resolveGroup', () => {
  test('deletes all files except keepId', async () => {
    const a = path.join(tmpDir, 'keep.txt');
    const b = path.join(tmpDir, 'del1.txt');
    const c = path.join(tmpDir, 'del2.txt');
    fs.writeFileSync(a, 'x');
    fs.writeFileSync(b, 'x');
    fs.writeFileSync(c, 'x');

    const archId  = await insertArchive('R', tmpDir);
    const keepId  = await insertFile(archId, { path: a, name: 'keep.txt' });
    const delId1  = await insertFile(archId, { path: b, name: 'del1.txt' });
    const delId2  = await insertFile(archId, { path: c, name: 'del2.txt' });

    const result = await resolveGroup(db, keepId, [delId1, delId2]);
    expect(result.deleted).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    expect(fs.existsSync(a)).toBe(true);
    expect(fs.existsSync(b)).toBe(false);
    expect(fs.existsSync(c)).toBe(false);
  });

  test('skips keepId even if included in deleteIds', async () => {
    const a = path.join(tmpDir, 'safe.txt');
    fs.writeFileSync(a, 'data');
    const archId = await insertArchive('S', tmpDir);
    const id     = await insertFile(archId, { path: a, name: 'safe.txt' });
    const result = await resolveGroup(db, id, [id]);
    expect(result.deleted).toHaveLength(0);
    expect(fs.existsSync(a)).toBe(true);
  });
});
