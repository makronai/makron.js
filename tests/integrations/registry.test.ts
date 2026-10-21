import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultIntegrationRegistry, INTEGRATION_CATALOG } from '../../src/index';

test('Integration catalog covers all 12 architectural categories', () => {
  assert.ok(INTEGRATION_CATALOG.length >= 30);

  const categories = new Set(INTEGRATION_CATALOG.map((i) => i.category));
  assert.ok(categories.has('llm-provider'));
  assert.ok(categories.has('llm-platform'));
  assert.ok(categories.has('agent-framework'));
  assert.ok(categories.has('rag-retrieval'));
  assert.ok(categories.has('embeddings'));
  assert.ok(categories.has('mcp'));
  assert.ok(categories.has('security-guardrails'));
  assert.ok(categories.has('observability'));
  assert.ok(categories.has('memory'));
  assert.ok(categories.has('agent-sdk'));
  assert.ok(categories.has('automation'));
  assert.ok(categories.has('vector-database'));
});

test('Integration records maintain honest support levels without false claims', () => {
  const mcpRecord = defaultIntegrationRegistry.get('mcp-sdk');
  assert.ok(mcpRecord);
  assert.equal(mcpRecord.supportLevel, 'built-in');

  const langGraphRecord = defaultIntegrationRegistry.get('langgraph');
  assert.ok(langGraphRecord);
  assert.equal(langGraphRecord.supportLevel, 'optional-adapter');
  assert.equal(langGraphRecord.peerDependency, '@langchain/langgraph');

  const n8nRecord = defaultIntegrationRegistry.get('n8n');
  assert.ok(n8nRecord);
  assert.equal(n8nRecord.supportLevel, 'compatible-endpoint');
});
