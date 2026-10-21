import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defineProvider,
  getProvider,
  listProviders,
  ProviderRegistry,
  AdapterNotFoundError,
} from '../../src/index';

test('ProviderRegistry resolves built-in providers', () => {
  const registry = new ProviderRegistry();
  assert.ok(registry.has('openai'));
  assert.ok(registry.has('anthropic'));
  assert.ok(registry.has('gemini'));
  assert.ok(registry.has('ollama'));
  assert.ok(registry.has('groq'));
  assert.ok(registry.has('deepseek'));

  const adapter = registry.create('groq');
  assert.equal(adapter.id, 'groq');
});

test('ProviderRegistry supports custom provider registration via defineProvider', () => {
  const custom = defineProvider({
    id: 'my-custom-llm',
    name: 'My Custom LLM',
    create: (cfg) => ({
      id: 'my-custom-llm',
      name: 'My Custom LLM',
      chat: async () => ({
        id: '1',
        model: 'custom',
        provider: 'my-custom-llm',
        text: 'custom answer',
        message: { role: 'assistant', content: 'custom answer' },
        finishReason: { reason: 'stop' },
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        latencyMs: 10,
      }),
    }),
  });

  const adapter = getProvider('my-custom-llm');
  assert.equal(adapter.name, 'My Custom LLM');
});

test('ProviderRegistry throws AdapterNotFoundError on unregistered provider', () => {
  assert.throws(
    () => {
      getProvider('non-existent-provider-xyz');
    },
    (err: any) => err instanceof AdapterNotFoundError
  );
});
