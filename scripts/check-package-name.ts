/**
 * @license MIT
 * Makron.js Package Name Verification Script
 */

import { PACKAGE_NAME } from '../src/version';

export function checkPackageName() {
  console.log(`📦 Checking package name: '${PACKAGE_NAME}'...`);
  // Validate standard npm package name regex
  const validNpmRegex = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  if (!validNpmRegex.test(PACKAGE_NAME)) {
    console.error(`❌ Package name '${PACKAGE_NAME}' is invalid under npm naming rules!`);
    process.exit(1);
  }

  console.log(`✅ Package name '${PACKAGE_NAME}' conforms to npm naming specifications.`);
  console.log(`ℹ️ Alternative scoped registry identifiers: '@makron-ai/core', '@makron/sdk'`);
}

if (process.argv[1]?.endsWith('check-package-name.ts')) {
  checkPackageName();
}
