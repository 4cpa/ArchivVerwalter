'use strict';

/**
 * Electron entry point.
 *
 * Start-up strategy (fast path):
 *   1. Acquire single-instance lock — quit immediately if another instance runs.
 *   2. Create the BrowserWindow RIGHT AWAY with an inline loading screen so the
 *      user sees a responsive window within ~200 ms, long before SQLite/Express
 *      have finished initialising.
 *   3. Boot the Express server in the background.
 *   4. Once the server is ready, navigate the already-visible window to the app.
 */

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');

// ── Single-instance lock ──────────────────────────────────────────────────
// Prevents a second instance from starting (e.g. after Windows auto-start or
// double-click during update), which would cause an EADDRINUSE crash.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const isDev = !app.isPackaged;
const PORT  = parseInt(process.env.PORT, 10) || 4041;
const HOST  = '127.0.0.1';
const URL   = `http://${HOST}:${PORT}`;

let mainWindow = null;
let httpServer = null;
let db         = null;

// ── Inline loading page ───────────────────────────────────────────────────
// Shown immediately while the Express server is still starting up.
// Matches the sidebar colour so there is no jarring colour flash.
const LOADING_HTML = `data:text/html,<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    background:#1a1f2e;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    height:100vh;gap:20px;
    font-family:system-ui,-apple-system,sans-serif;
    color:rgba(255,255,255,.7);
  }
  .logo{font-size:2.8rem;font-weight:900;letter-spacing:-2px;color:#fff}
  .sub{font-size:.85rem;color:rgba(255,255,255,.45);letter-spacing:.5px}
  .bar{width:180px;height:3px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden}
  .fill{height:100%;width:40%;background:#4a9eff;border-radius:2px;
        animation:slide 1.2s ease-in-out infinite}
  @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
</style>
</head>
<body>
  <div class="logo">@4</div>
  <div class="sub">ArchivVerwalter startet&nbsp;&hellip;</div>
  <div class="bar"><div class="fill"></div></div>
</body>
</html>`;

// ── Server startup ────────────────────────────────────────────────────────
async function startServer() {
  const userData = app.getPath('userData');

  process.env.LOG_DIR    = path.join(userData, 'logs');
  process.env.DB_PATH    = path.join(userData, 'archivverwalter.db');
  process.env.PORT       = String(PORT);
  process.env.HOST       = HOST;
  process.env.PUBLIC_DIR = isDev
    ? path.join(__dirname, '..', 'public')
    : path.join(process.resourcesPath, 'public');

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
    backgroundColor: '#1a1f2e',
    show:            false,          // reveal only after first paint (avoids flash)
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  if (!isDev) Menu.setApplicationMenu(null);

  // Load the inline loading screen immediately — window becomes visible fast.
  mainWindow.loadURL(LOADING_HTML);
}

// ── Wait for server to be ready ───────────────────────────────────────────
function waitForServer(retries = 40, delay = 200) {
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
  // 1. Show the window with the loading page immediately
  createWindow();

  try {
    // 2. Boot server in background while window is already visible
    await startServer();
    await waitForServer();

    // 3. Navigate to the real app
    if (mainWindow) {
      mainWindow.loadURL(URL);

      if (isDev && process.env.DEVTOOLS) {
        mainWindow.webContents.openDevTools();
      }
    }
  } catch (err) {
    const isPortBusy = err.code === 'EADDRINUSE';
    const title   = 'ArchivVerwalter \u2014 Startup Error';
    const message = isPortBusy
      ? `Port ${PORT} is already in use.\n\nA previous ArchivVerwalter instance may still be running. Please close it via the Windows Task Manager (look for \u201cArchivVerwalter\u201d or \u201celectron.exe\u201d) and try again.`
      : err.message;
    dialog.showErrorBox(title, message);
    app.quit();
  }
});

// Bring existing window to front when a second instance tries to launch
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

app.on('before-quit', async () => {
  if (httpServer) httpServer.close();
  // Close DB with a hard timeout so the process never hangs "not responding"
  if (db) {
    await Promise.race([
      db.close().catch(() => {}),
      new Promise(r => setTimeout(r, 1500)),
    ]);
  }
});
