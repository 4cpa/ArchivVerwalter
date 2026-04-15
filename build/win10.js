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
    allowToChangeInstallationDirectory: true,
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
