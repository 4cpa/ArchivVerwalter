'use strict';

const path   = require('path');
const Database   = require('./src/db');
const createApp  = require('./src/server');
const logger     = require('./src/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'main.db');
const PORT    = parseInt(process.env.PORT, 10) || 3000;
const HOST    = process.env.HOST || '127.0.0.1';

async function main() {
  const db = new Database(DB_PATH);

  await db.open();
  await db.init();
  logger.info(`Database ready  →  ${DB_PATH}`);

  const app    = createApp(db);
  const server = app.listen(PORT, HOST, () => {
    logger.info(`ArchivVerwalter  →  http://${HOST}:${PORT}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  async function shutdown(signal) {
    logger.info(`${signal} received — shutting down …`);
    server.close(async () => {
      await db.close();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    // Force-exit after 10 s if connections hang
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error(`Fatal: ${err.message}`);
  process.exit(1);
});
