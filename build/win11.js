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
      { target: 'nsis', arch: ['x64'] },
      { target: 'nsis', arch: ['arm64'] }
    ],
    legalTrademarks: pkg.author.name,
    // asInvoker: no UAC prompt, no SmartScreen admin-level scan delay
    requestedExecutionLevel: 'asInvoker',
    icon: 'electron/icons/icon.ico',
    verifyUpdateCodeSignature: false,
    artifactName: '${productName}-Setup-${version}-win11-${arch}.${ext}'
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
    uninstallerIcon: 'electron/icons/icon.ico'
  }
};
