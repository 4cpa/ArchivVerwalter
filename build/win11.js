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
    publisherName: pkg.author.name,
    // Triggers UAC prompt → fixes "run as administrator" issues on Win 10/11
    requestedExecutionLevel: 'requireAdministrator',
    icon: 'electron/icons/icon.ico',
    verifyUpdateCodeSignature: false,
    artifactName: '${productName}-Setup-${version}-win11-${arch}.${ext}'
  },

  nsis: {
    oneClick: false,
    // perMachine: true → installs into Program Files → less UAC friction
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'ArchivVerwalter',
    installerIcon: 'electron/icons/icon.ico',
    uninstallerIcon: 'electron/icons/icon.ico'
  }
};
