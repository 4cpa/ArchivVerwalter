#!/usr/bin/env node
'use strict';

/**
 * Called automatically by npm during `npm version`.
 *
 * What it does:
 *   1. Reads the new version from package.json (npm has already bumped it).
 *   2. In CHANGELOG.md, replaces the `## [Unreleased]` heading with
 *      `## [x.y.z] — YYYY-MM-DD` and adds a fresh `## [Unreleased]` above it.
 *   3. Updates the version string shown in the sidebar of the web UI (i18n.js).
 */

const fs      = require('fs');
const path    = require('path');
const root    = path.join(__dirname, '..');
const pkg     = require(path.join(root, 'package.json'));
const version = pkg.version;
const today   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ── 1. Stamp CHANGELOG.md ─────────────────────────────────────────────────
const changelogPath = path.join(root, 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

const unreleasedHeading = '## [Unreleased]';
const newHeading        = `## [Unreleased]\n\n---\n\n## [${version}] — ${today}`;

if (!changelog.includes(unreleasedHeading)) {
  console.error('changelog-stamp: Could not find "## [Unreleased]" in CHANGELOG.md');
  process.exit(1);
}

changelog = changelog.replace(unreleasedHeading, newHeading);
fs.writeFileSync(changelogPath, changelog, 'utf8');
console.log(`changelog-stamp: stamped CHANGELOG.md with [${version}] — ${today}`);

// ── 2. Update version in i18n.js sidebar label ────────────────────────────
const i18nPath = path.join(root, 'public', 'i18n.js');
let i18n = fs.readFileSync(i18nPath, 'utf8');

// Replace  'app.version': 'v...'  if present; otherwise leave unchanged.
const updated = i18n.replace(
  /('app\.version'\s*:\s*)'v[\d.]+'/,
  `$1'v${version}'`
);

if (updated !== i18n) {
  fs.writeFileSync(i18nPath, updated, 'utf8');
  console.log(`changelog-stamp: updated app.version → v${version} in i18n.js`);
}
