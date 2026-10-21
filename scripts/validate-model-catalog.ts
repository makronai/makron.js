/**
 * @license MIT
 * Makron.js Model Catalog Validator Script
 */

import { BUNDLED_MODEL_CATALOG } from '../src/models/catalog/index';

export function validateCatalog() {
  console.log('🔍 Validating Makron.js bundled model catalog...');
  let errors = 0;
  const seenKeys = new Set<string>();

  for (const model of BUNDLED_MODEL_CATALOG) {
    const key = `${model.provider}:${model.id}`;
    if (seenKeys.has(key)) {
      console.error(`❌ Duplicate model entry found: ${key}`);
      errors++;
    }
    seenKeys.add(key);

    if (!model.id || typeof model.id !== 'string') {
      console.error(`❌ Model missing valid id: ${JSON.stringify(model)}`);
      errors++;
    }
    if (!model.provider || typeof model.provider !== 'string') {
      console.error(`❌ Model ${model.id} missing provider`);
      errors++;
    }
    if (!model.capabilities) {
      console.error(`❌ Model ${key} missing capabilities`);
      errors++;
    }
    if (!model.sourceURL) {
      console.warn(`⚠️ Model ${key} has no sourceURL`);
    }
  }

  if (errors > 0) {
    console.error(`❌ Model catalog validation failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`✅ Model catalog valid! Verified ${BUNDLED_MODEL_CATALOG.length} models across all providers.`);
  }
}

if (process.argv[1]?.endsWith('validate-model-catalog.ts')) {
  validateCatalog();
}
