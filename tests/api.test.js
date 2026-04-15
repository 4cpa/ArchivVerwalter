'use strict';

const request  = require('supertest');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');

const Database  = require('../src/db');
const createApp = require('../src/server');

let app, db, tmpDir;

async function seed() {
  await db.run("INSERT INTO archives (name, path) VALUES ('Arch1', ?)", [tmpDir]);
  await db.run(
    'INSERT INTO files (archive_id, path, name, ext, size, hash) VALUES (1, ?, ?, ?, ?, ?)',
    [path.join(tmpDir, 'a.pdf'), 'a.pdf', 'pdf', 1024, 'HASH1']
  );
  await db.run(
    'INSERT INTO files (archive_id, path, name, ext, size, hash) VALUES (1, ?, ?, ?, ?, ?)',
    [path.join(tmpDir, 'b.pdf'), 'b.pdf', 'pdf', 2048, 'HASH1']
  );
  await db.run(
    'INSERT INTO files (archive_id, path, name, ext, size, hash) VALUES (1, ?, ?, ?, ?, ?)',
    [path.join(tmpDir, 'c.jpg'), 'c.jpg', 'jpg', 512, 'HASH2']
  );
}

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-api-'));
  db  = new Database(':memory:');
  await db.open();
  await db.init();
  app = createApp(db);
});

afterEach(async () => {
  await db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── GET /api/health ────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  test('returns ok status with stats', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('archives');
    expect(res.body).toHaveProperty('files');
  });
});

// ── Archives CRUD ─────────────────────────────────────────────────────────
describe('GET /api/archives', () => {
  test('returns empty array initially', async () => {
    const res = await request(app).get('/api/archives');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns archives with file_count and total_size', async () => {
    await seed();
    const res = await request(app).get('/api/archives');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      name: 'Arch1',
      file_count: 3,
      total_size: 1024 + 2048 + 512,
    });
  });
});

describe('POST /api/archives', () => {
  test('creates an archive with valid path (name derived from path)', async () => {
    const res = await request(app)
      .post('/api/archives')
      .send({ path: tmpDir });
    expect(res.status).toBe(201);
    expect(res.body.name).toBeTruthy();
  });

  test('400 if path missing', async () => {
    const r1 = await request(app).post('/api/archives').send({});
    expect(r1.status).toBe(400);
  });

  test('400 if path does not exist', async () => {
    const res = await request(app)
      .post('/api/archives')
      .send({ path: '/totally/nonexistent/path' });
    expect(res.status).toBe(400);
  });

  test('409 for duplicate path', async () => {
    await request(app).post('/api/archives').send({ path: tmpDir });
    const res = await request(app).post('/api/archives').send({ path: tmpDir });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/archives/:id', () => {
  test('removes archive and cascades files', async () => {
    await seed();
    const res = await request(app).delete('/api/archives/1');
    expect(res.status).toBe(200);
    const files = await db.all('SELECT * FROM files');
    expect(files).toHaveLength(0);
  });

  test('404 for unknown archive', async () => {
    const res = await request(app).delete('/api/archives/9999');
    expect(res.status).toBe(404);
  });
});

// ── Files ─────────────────────────────────────────────────────────────────
describe('GET /api/files', () => {
  beforeEach(seed);

  test('returns paginated file list', async () => {
    const res = await request(app).get('/api/files');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.files).toHaveLength(3);
  });

  test('filters by archive id', async () => {
    const res = await request(app).get('/api/files?archive=1');
    expect(res.body.total).toBe(3);
  });

  test('filters by extension', async () => {
    const res = await request(app).get('/api/files?ext=jpg');
    expect(res.body.total).toBe(1);
    expect(res.body.files[0].name).toBe('c.jpg');
  });

  test('filters by name (partial)', async () => {
    const res = await request(app).get('/api/files?name=a');
    expect(res.body.files.some(f => f.name === 'a.pdf')).toBe(true);
  });

  test('filters duplicates only', async () => {
    const res = await request(app).get('/api/files?dups=true');
    // a.pdf and b.pdf share HASH1
    expect(res.body.total).toBe(2);
  });

  test('respects sort and order', async () => {
    const asc  = await request(app).get('/api/files?sort=size&order=asc');
    const desc = await request(app).get('/api/files?sort=size&order=desc');
    const sizes_asc  = asc.body.files.map(f => f.size);
    const sizes_desc = desc.body.files.map(f => f.size);
    expect(sizes_asc).toEqual([...sizes_asc].sort((a, b) => a - b));
    expect(sizes_desc).toEqual([...sizes_desc].sort((a, b) => b - a));
  });

  test('respects pagination', async () => {
    const res = await request(app).get('/api/files?limit=2&page=2');
    expect(res.body.files.length).toBeLessThanOrEqual(2);
  });
});

describe('DELETE /api/files/:id', () => {
  test('dbOnly=true removes from index but not disk', async () => {
    const filePath = path.join(tmpDir, 'keep-me.txt');
    fs.writeFileSync(filePath, 'data');
    await db.run("INSERT INTO archives (name, path) VALUES ('A', ?)", [tmpDir]);
    await db.run(
      'INSERT INTO files (archive_id, path, name, size) VALUES (1, ?, ?, 4)',
      [filePath, 'keep-me.txt']
    );
    const res = await request(app).delete('/api/files/1?dbOnly=true');
    expect(res.status).toBe(200);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('404 for unknown file', async () => {
    const res = await request(app).delete('/api/files/9999');
    expect(res.status).toBe(404);
  });
});

// ── Duplicates ─────────────────────────────────────────────────────────────
describe('GET /api/duplicates', () => {
  test('returns duplicate groups', async () => {
    await seed();
    const res = await request(app).get('/api/duplicates');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].hash).toBe('HASH1');
    expect(res.body[0].count).toBe(2);
  });
});

describe('POST /api/duplicates/resolve', () => {
  test('400 if keepId or deleteIds missing', async () => {
    const r1 = await request(app).post('/api/duplicates/resolve').send({ keepId: 1 });
    expect(r1.status).toBe(400);
  });

  test('resolves group by deleting files from disk', async () => {
    const a = path.join(tmpDir, 'keep.txt');
    const b = path.join(tmpDir, 'remove.txt');
    fs.writeFileSync(a, 'same');
    fs.writeFileSync(b, 'same');

    await db.run("INSERT INTO archives (name, path) VALUES ('Z', ?)", [tmpDir]);
    const { lastID: id1 } = await db.run(
      'INSERT INTO files (archive_id, path, name, size, hash) VALUES (1, ?, ?, 4, ?)',
      [a, 'keep.txt', 'HASH_X']
    );
    const { lastID: id2 } = await db.run(
      'INSERT INTO files (archive_id, path, name, size, hash) VALUES (1, ?, ?, 4, ?)',
      [b, 'remove.txt', 'HASH_X']
    );

    const res = await request(app)
      .post('/api/duplicates/resolve')
      .send({ keepId: id1, deleteIds: [id2] });

    expect(res.status).toBe(200);
    expect(res.body.deleted).toHaveLength(1);
    expect(fs.existsSync(b)).toBe(false);
    expect(fs.existsSync(a)).toBe(true);
  });
});

// ── Scan endpoints ─────────────────────────────────────────────────────────
describe('POST /api/archives/:id/scan', () => {
  test('404 for unknown archive', async () => {
    const res = await request(app).post('/api/archives/9999/scan');
    expect(res.status).toBe(404);
  });

  test('starts a scan and returns 200', async () => {
    await db.run("INSERT INTO archives (name, path) VALUES ('S', ?)", [tmpDir]);
    const res = await request(app).post('/api/archives/1/scan');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/started/i);
  });
});

describe('GET /api/archives/:id/scan/status', () => {
  test('returns idle for non-running archive', async () => {
    const res = await request(app).get('/api/archives/1/scan/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('idle');
  });
});
