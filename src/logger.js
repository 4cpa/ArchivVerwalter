'use strict';

const fs   = require('fs');
const path = require('path');

const LOG_DIR  = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — rotate beyond this

// Create log directory synchronously at module load
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}

function ts() {
  return new Date().toISOString();
}

function rotatIfNeeded() {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size >= MAX_BYTES) {
      fs.renameSync(LOG_FILE, LOG_FILE + '.1');
    }
  } catch (_) {}
}

function write(level, msg) {
  const line = `[${ts()}] [${level.padEnd(5)}] ${msg}\n`;
  process.stdout.write(line);
  rotatIfNeeded();
  fs.appendFile(LOG_FILE, line, () => {}); // non-blocking
}

const logger = {
  info:  (msg) => write('INFO',  msg),
  warn:  (msg) => write('WARN',  msg),
  error: (msg) => write('ERROR', msg),
  http:  (msg) => write('HTTP',  msg.trim()),
  debug: (msg) => { if (process.env.DEBUG) write('DEBUG', msg); },
};

module.exports = logger;
