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
    // Triggers UAC prompt → fixes "run as administrator" issues on Win 10/11
    requestedExecutionLevel: 'requireAdministrator',
    icon: 'electron/icons/icon.ico',
    verifyUpdateCodeSignature: false,
    artifactName: '${productName}-Setup-${version}-win10-x64.${ext}'
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
