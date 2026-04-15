'use strict';

/**
 * Electron entry point.
 *
 * Strategy: run the Express HTTP server inside the main process (no child
 * process needed), then open a BrowserWindow that loads the local URL.
 * This works both in development (electron .) and in the packaged installer.
 *
 * Environment variables are set BEFORE any project modules are required so
 * that logger.js, db.js etc. pick up the correct paths at module-load time.
 */

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');

// ── Single-instance lock ──────────────────────────────────────────────────
// Prevents a second instance from starting when the app is already running
// (e.g. after a Windows auto-start or a double-click during update).
// The second instance immediately quits; the first instance brings its window
// to the foreground so the user's click still feels responsive.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const isDev = !app.isPackaged;
const PORT  = parseInt(process.env.PORT, 10) || 4041; // separate from npm start (4040) and Prognostic (3000)
const HOST  = '127.0.0.1';
const URL   = `http://${HOST}:${PORT}`;

let mainWindow = null;
let httpServer = null;
let db         = null;

// ── Server startup ────────────────────────────────────────────────────────
async function startServer() {
  const userData = app.getPath('userData');

  // Must be set BEFORE requiring project modules (logger reads LOG_DIR at load time)
  process.env.LOG_DIR    = path.join(userData, 'logs');
  process.env.DB_PATH    = path.join(userData, 'archivverwalter.db');
  process.env.PORT       = String(PORT);
  process.env.HOST       = HOST;

  // In a packaged app, static files are placed in resources/public via extraResources.
  // In development, they live in public/ relative to the project root.
  process.env.PUBLIC_DIR = isDev
    ? path.join(__dirname, '..', 'public')
    : path.join(process.resourcesPath, 'public');

  // Lazy-require so env vars are already set when modules initialise
  const Database  = require('../src/db');
  const createApp = require('../src/server');

  db = new Database(process.env.DB_PATH);
  await db.open();
  await db.init();

  const expressApp = createApp(db);
  httpServer = http.createServer(expressApp);

  await new Promise((resolve, reject) =>
    httpServer.listen(PORT, HOST, (err) => (err ? reject(err) : resolve()))
  );
}

// ── Window ────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        900,
    minHeight:       600,
    title:           'ArchivVerwalter',
    backgroundColor: '#1a1f2e',   // matches sidebar colour → no white flash
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
    },
  });

  // Open <a target="_blank"> links in the OS default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(URL);

  // Open DevTools in development
  if (isDev && process.env.DEVTOOLS) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // Remove menu bar in production (app has its own UI)
  if (!isDev) Menu.setApplicationMenu(null);
}

// ── Wait for server to be ready ───────────────────────────────────────────
function waitForServer(retries = 30, delay = 300) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      http.get(`${URL}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry(n);
      }).on('error', () => retry(n));
    }
    function retry(n) {
      if (n <= 0) return reject(new Error(`Server did not become ready on ${URL}`));
      setTimeout(() => attempt(n - 1), delay);
    }
    attempt(retries);
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startServer();
    await waitForServer();
    createWindow();
  } catch (err) {
    const isPortBusy = err.code === 'EADDRINUSE';
    const title   = 'ArchivVerwalter — Startup Error';
    const message = isPortBusy
      ? `Port ${PORT} is already in use.\n\nA previous ArchivVerwalter instance may still be running. Please close it via the Windows Task Manager (look for "ArchivVerwalter" or "electron.exe") and try again.`
      : err.message;
    dialog.showErrorBox(title, message);
    app.quit();
  }
});

app.on('second-instance', () => {
  // A second launch was attempted — focus the existing window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  // On macOS, apps stay in the dock until explicitly quit
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // Re-create window when dock icon is clicked (macOS)
  if (!mainWindow) createWindow();
});

app.on('before-quit', async () => {
  if (httpServer) httpServer.close();
  if (db) await db.close().catch(() => {});
});
