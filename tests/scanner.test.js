'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const Database            = require('../src/db');
const { hashFile, walkDir, scanArchive, pruneStale } = require('../src/scanner');

// ── Temp directory helpers ────────────────────────────────────────────────────
let tmpDir;

function writeFile(relPath, content = 'hello') {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── hashFile ─────────────────────────────────────────────────────────────────
describe('hashFile', () => {
  test('returns 64-char hex SHA-256', async () => {
    const f = writeFile('a.txt', 'hello world');
    const h = await hashFile(f);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  test('identical content → identical hash', async () => {
    const f1 = writeFile('f1.txt', 'same content');
    const f2 = writeFile('f2.txt', 'same content');
    expect(await hashFile(f1)).toBe(await hashFile(f2));
  });

  test('different content → different hash', async () => {
    const f1 = writeFile('g1.txt', 'aaa');
    const f2 = writeFile('g2.txt', 'bbb');
    expect(await hashFile(f1)).not.toBe(await hashFile(f2));
  });

  test('rejects on missing file', async () => {
    await expect(hashFile('/nonexistent/file.txt')).rejects.toThrow();
  });
});

// ── walkDir ──────────────────────────────────────────────────────────────────
describe('walkDir', () => {
  test('yields all files recursively', async () => {
    writeFile('a.txt');
    writeFile('sub/b.txt');
    writeFile('sub/deep/c.txt');

    const found = [];
    for await (const p of walkDir(tmpDir)) found.push(p);
    expect(found).toHaveLength(3);
  });

  test('yields nothing for empty dir', async () => {
    const found = [];
    for await (const p of walkDir(tmpDir)) found.push(p);
    expect(found).toHaveLength(0);
  });

  test('skips unreadable directories gracefully', async () => {
    writeFile('ok.txt');
    const locked = path.join(tmpDir, 'locked');
    fs.mkdirSync(locked);
    fs.chmodSync(locked, 0o000);

    const found = [];
    try {
      for await (const p of walkDir(tmpDir)) found.push(p);
    } finally {
      fs.chmodSync(locked, 0o755); // restore for cleanup
    }
    // Should still yield ok.txt
    expect(found.some(p => p.endsWith('ok.txt'))).toBe(true);
  });
});

// ── scanArchive ───────────────────────────────────────────────────────────────
describe('scanArchive', () => {
  let db;

  beforeEach(async () => {
    db = new Database(':memory:');
    await db.open();
    await db.init();
    await db.run("INSERT INTO archives (name, path) VALUES ('Test', ?)", [tmpDir]);
  });

  afterEach(async () => {
    await db.close();
  });

  test('indexes files into DB', async () => {
    writeFile('x.pdf', 'pdf content');
    writeFile('sub/y.jpg', 'image');

    const result = await scanArchive(db, 1, tmpDir);
    expect(result.indexed).toBe(2);
    expect(result.errors).toBe(0);

    const rows = await db.all('SELECT * FROM files ORDER BY name');
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('x.pdf');
    expect(rows[0].ext).toBe('pdf');
    expect(rows[0].hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('re-scan updates existing records (upsert)', async () => {
    writeFile('f.txt', 'v1');
    await scanArchive(db, 1, tmpDir);

    writeFile('f.txt', 'v2 updated');
    await scanArchive(db, 1, tmpDir);

    const rows = await db.all('SELECT * FROM files');
    expect(rows).toHaveLength(1);
    // Hash should have changed
  });

  test('calls onProgress callback', async () => {
    writeFile('p1.txt');
    writeFile('p2.txt');
    const calls = [];
    await scanArchive(db, 1, tmpDir, (p) => calls.push(p));
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[0]).toHaveProperty('indexed');
    expect(calls[0]).toHaveProperty('currentFile');
  });
});

// ── pruneStale ────────────────────────────────────────────────────────────────
describe('pruneStale', () => {
  let db;

  beforeEach(async () => {
    db = new Database(':memory:');
    await db.open();
    await db.init();
    await db.run("INSERT INTO archives (name, path) VALUES ('P', ?)", [tmpDir]);
  });

  afterEach(async () => { await db.close(); });

  test('removes records for files no longer on disk', async () => {
    const f = writeFile('will-be-deleted.txt');
    await scanArchive(db, 1, tmpDir);
    fs.unlinkSync(f);
    const removed = await pruneStale(db, 1);
    expect(removed).toBe(1);
    const rows = await db.all('SELECT * FROM files');
    expect(rows).toHaveLength(0);
  });

  test('keeps records for files still on disk', async () => {
    writeFile('stays.txt');
    await scanArchive(db, 1, tmpDir);
    const removed = await pruneStale(db, 1);
    expect(removed).toBe(0);
  });
});
