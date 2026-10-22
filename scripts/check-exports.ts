/**
 * @license MIT
 * Makron.js Package Exports Checker
 */

import fs from 'node:fs';
import path from 'node:path';

export function checkExports() {
  console.log('🔍 Checking package exports configuration...');
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const exportsMap = pkg.exports;
  if (!exportsMap) {
    console.error('❌ package.json missing "exports" field!');
    process.exit(1);
  }

  const expectedSubpaths = ['.', './providers', './browser', './models', './integrations', './components'];
  let missing = 0;

  for (const subpath of expectedSubpaths) {
    if (!exportsMap[subpath]) {
      console.warn(`⚠️ Export subpath '${subpath}' not configured in package.json exports.`);
      missing++;
    } else {
      console.log(`  ✓ ${subpath} -> ${JSON.stringify(exportsMap[subpath])}`);
    }
  }

  console.log(`✅ Exports check completed (${expectedSubpaths.length - missing}/${expectedSubpaths.length} mapped).`);
}

if (process.argv[1]?.endsWith('check-exports.ts')) {
  checkExports();
}
