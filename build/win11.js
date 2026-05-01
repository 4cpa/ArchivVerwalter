/**
 * electron-builder config — Windows 11 (x64 + arm64)
 * Produces:
 *   ArchivVerwalter-Setup-<version>-win11-x64.exe   (Intel/AMD)
 *   ArchivVerwalter-Setup-<version>-win11-arm64.exe  (Surface Pro X, Copilot+ PCs)
 *
 * Run:  npm run dist:win11
 */

'use strict';

const pkg = require('../package.json');
const base = pkg.build;

module.exports = {
  ...base,

  win: {
    target: [
      { target: 'nsis', arch: ['x64', 'arm64'] }
    ],
    legalTrademarks: pkg.author.name,
    // asInvoker: no UAC prompt, no SmartScreen admin-level scan delay
    requestedExecutionLevel: 'asInvoker',
    icon: 'electron/icons/icon.ico',
    verifyUpdateCodeSignature: false,
    artifactName: '${productName}-Setup-${version}-win11-${arch}.${ext}'
  },

  // store = no LZMA compression → no decompression step during install.
  // Windows Defender (24H2+) interferes with NSIS's LZMA extraction in %TEMP%,
  // causing "Fehler beim Entpacken". Without compression the files are copied
  // directly — Defender can scan them but cannot block the extraction step.
  compression: 'store',

  nsis: {
    oneClick: false,
    // perMachine: false → installs to %LOCALAPPDATA%\Programs, no UAC needed
    perMachine: false,
    // Fixed install dir avoids the electron-builder shortcut bug where the
    // shortcut keeps pointing to the default path even when the user picked
    // a different directory ("Datei kann nicht gefunden werden" on launch).
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'ArchivVerwalter',
    installerIcon: 'electron/icons/icon.ico',
    uninstallerIcon: 'electron/icons/icon.ico',
    // Do not auto-launch after install — avoids false "crash" if first-run
    // takes unusually long (antivirus scan of native modules on first launch).
    runAfterFinish: false,
    // DPI-aware manifest so Windows renders installer at native resolution
    // instead of bitmap-upscaling it — prevents blurry text on HiDPI displays.
    include: 'build/installer.nsh',
  }
};
