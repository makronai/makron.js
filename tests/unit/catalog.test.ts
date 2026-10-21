import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listModels,
  getModelInfo,
  BUNDLED_MODEL_CATALOG,
  resolveModelAlias,
} from '../../src/index';

test('BUNDLED_MODEL_CATALOG contains verified seed models across major providers', () => {
  assert.ok(BUNDLED_MODEL_CATALOG.length >= 40);

  const openaiModels = listModels({ provider: 'openai' });
  assert.ok(openaiModels.some((m) => m.id === 'gpt-5-mini'));
  assert.ok(openaiModels.some((m) => m.id === 'gpt-5.1'));

  const geminiModels = listModels({ provider: 'gemini' });
  assert.ok(geminiModels.some((m) => m.id === 'gemini-3.8-flash'));
  const geminiEmbed = geminiModels.find((m) => m.id === 'gemini-embedding-001');
  assert.ok(geminiEmbed);
  assert.equal(geminiEmbed.capabilities.chat, false);
  assert.equal(geminiEmbed.capabilities.embeddings, true);

  const groqModels = listModels({ provider: 'groq' });
  assert.ok(groqModels.some((m) => m.id === 'openai/gpt-oss-120b'));

  const deepseekModels = listModels({ provider: 'deepseek' });
  assert.ok(deepseekModels.some((m) => m.id === 'deepseek-flash'));
  assert.ok(deepseekModels.some((m) => m.id === 'deepseek-v4-pro'));

  const ollamaModels = listModels({ provider: 'ollama' });
  assert.ok(ollamaModels.some((m) => m.id === 'gpt-oss:20b'));
  assert.equal(ollamaModels[0].availability, 'local');

  const browserModels = listModels({ provider: 'transformers-js' });
  assert.ok(browserModels.some((m) => m.id === 'onnx-community/SmolLM2-360M-Instruct'));
  assert.equal(browserModels[0].availability, 'browser');
});

test('getModelInfo retrieves model by ID or alias', () => {
  const model = getModelInfo('gpt-5-mini');
  assert.ok(model);
  assert.equal(model.provider, 'openai');
  assert.equal(model.capabilities.chat, true);

  const resolved = resolveModelAlias('gpt-default');
  assert.equal(resolved, 'gpt-5-mini');
});

test('listModels filters by capability, availability, and search query', () => {
  const browserOnly = listModels({ availability: 'browser' });
  assert.ok(browserOnly.every((m) => m.availability === 'browser'));

  const embeddingOnly = listModels({ capability: 'embeddings' });
  assert.ok(embeddingOnly.every((m) => m.capabilities.embeddings === true));

  const queryResults = listModels({ searchQuery: 'reasoning' });
  assert.ok(queryResults.length > 0);
});
