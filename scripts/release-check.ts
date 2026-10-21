/**
 * @license MIT
 * Makron.js Release Readiness Gate
 */

import { execSync } from 'node:child_process';
import { validateCatalog } from './validate-model-catalog';
import { checkPackageName } from './check-package-name';
import { checkExports } from './check-exports';
import { checkOptionalDependencies } from './check-optional-dependencies';

export function runReleaseCheck() {
  console.log('🚀 Running Makron.js Complete Release Readiness Checks...\n');

  try {
    console.log('1. Checking Package Identity...');
    checkPackageName();

    console.log('\n2. Validating Model Catalog Metadata...');
    validateCatalog();

    console.log('\n3. Verifying Package Exports...');
    checkExports();

    console.log('\n4. Inspecting Optional Peer Dependencies...');
    checkOptionalDependencies();

    console.log('\n5. Running Pure Unit Tests...');
    execSync('npx tsx --test tests/**/*.test.ts', { stdio: 'inherit' });

    console.log('\n===========================================');
    console.log('🎉 ALL RELEASE READINESS GATES PASSED! 🎉');
    console.log('Package is ready for npm dry-run and publication.');
    console.log('===========================================\n');
  } catch (err: any) {
    console.error('\n❌ Release check failed:', err.message);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('release-check.ts')) {
  runReleaseCheck();
}
