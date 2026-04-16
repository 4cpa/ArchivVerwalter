/**
 * electron-builder config — Windows 10 (x64)
 * Produces: ArchivVerwalter-Setup-<version>-win10-x64.exe
 *
 * Run:  npm run dist:win10
 */

'use strict';

const pkg = require('../package.json');
const base = pkg.build;

module.exports = {
  ...base,

  win: {
    target: [
      { target: 'nsis', arch: ['x64'] }
    ],
    legalTrademarks: pkg.author.name,
    // asInvoker: no UAC prompt, no SmartScreen admin-level scan delay
    requestedExecutionLevel: 'asInvoker',
    icon: 'electron/icons/icon.ico',
    verifyUpdateCodeSignature: false,
    artifactName: '${productName}-Setup-${version}-win10-x64.${ext}'
  },

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
    // Use ZIP instead of 7z for the app bundle inside the NSIS installer.
    // With 7z, NSIS extracts everything to %TEMP%\<random>.tmp\app-64.7z\
    // first; Defender watches that path and locks unsigned EXEs (e.g.
    // Uninstall ArchivVerwalter.exe) mid-write, causing "Fehler beim
    // Überschreiben der Datei". ZIP extraction writes files in smaller
    // chunks without the 7z temp-dir stage, avoiding the Defender lock.
    useZip: true,
    // DPI-aware manifest so Windows renders installer at native resolution
    // instead of bitmap-upscaling it — prevents blurry text on HiDPI displays.
    include: 'build/installer.nsh',
  }
};
