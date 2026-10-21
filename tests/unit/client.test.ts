import test from 'node:test';
import assert from 'node:assert/strict';
import { createMakron, MakronClient } from '../../src/index';

test('createMakron initializes a MakronClient with provider configuration', () => {
  const client = createMakron({
    provider: 'openai',
    apiKey: 'sk-test-key-12345678901234567890',
    model: 'gpt-5-mini',
  });

  assert.ok(client instanceof MakronClient);
  assert.equal(client.provider, 'openai');
  assert.equal(client.model, 'gpt-5-mini');
});

test('MakronClient executes chat with mock transport', async () => {
  const client = createMakron({
    provider: 'openai-compatible',
    baseURL: 'http://localhost:8000/v1',
    model: 'custom-model',
    mockTransport: async () => {
      return {
        id: 'mock-123',
        model: 'custom-model',
        choices: [
          {
            message: { role: 'assistant', content: 'Vector databases index high-dimensional embeddings.' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
      };
    },
  });

  const response = await client.chat({
    messages: [{ role: 'user', content: 'Explain vector database' }],
  });

  assert.equal(response.text, 'Vector databases index high-dimensional embeddings.');
  assert.equal(response.model, 'custom-model');
  assert.equal(response.provider, 'openai-compatible');
  assert.equal(response.usage.totalTokens, 20);
  assert.equal(response.finishReason.reason, 'stop');
});

test('MakronClient streams response with mock transport', async () => {
  const client = createMakron({
    provider: 'openai-compatible',
    model: 'gpt-5-mini',
    mockTransport: async () => {
      return [
        { id: '1', model: 'gpt-5-mini', provider: 'openai-compatible', deltaText: 'Hello ' },
        { id: '2', model: 'gpt-5-mini', provider: 'openai-compatible', deltaText: 'world!' },
      ];
    },
  });

  let full = '';
  for await (const chunk of client.stream({
    messages: [{ role: 'user', content: 'Say hello' }],
  })) {
    full += chunk.deltaText;
  }

  assert.equal(full, 'Hello world!');
});
