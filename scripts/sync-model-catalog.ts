/**
 * @license MIT
 * Makron.js Model Catalog Sync Script
 */

import { discoverModels } from '../src/models/discovery';

export async function syncCatalog(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun ?? process.argv.includes('--dry-run');
  console.log(`📡 Starting model catalog sync (dryRun: ${isDryRun})...`);

  const providersToSync = ['openai', 'groq', 'deepseek', 'ollama'];
  const results: Record<string, number> = {};

  for (const provider of providersToSync) {
    try {
      console.log(`Checking live models for '${provider}'...`);
      const result = await discoverModels({ provider, timeoutMs: 5000 });
      results[provider] = result.models.length;
      console.log(`  ✓ ${provider}: Found ${result.models.length} active models`);
    } catch (err: any) {
      console.log(`  ℹ️ ${provider}: Skipped (${err.message}) - credentials or local service not reachable`);
      results[provider] = 0;
    }
  }

  console.log('✅ Catalog sync run complete. No secrets stored in output.');
}

if (process.argv[1]?.endsWith('sync-model-catalog.ts')) {
  syncCatalog().catch(console.error);
}
