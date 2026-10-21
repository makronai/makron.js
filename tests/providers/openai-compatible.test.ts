import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAICompatibleAdapter } from '../../src/providers/openai-compatible';
import { OpenAIAdapter } from '../../src/providers/openai';
import { GroqAdapter } from '../../src/providers/groq';
import { DeepSeekAdapter } from '../../src/providers/deepseek';
import { OllamaAdapter } from '../../src/providers/ollama';

test('OpenAICompatibleAdapter handles baseURL validation and normalization', () => {
  const adapter = new OpenAICompatibleAdapter({
    baseURL: 'http://localhost:11434/v1/',
  });
  assert.equal(adapter.id, 'openai-compatible');
});

test('OpenAIAdapter defaults to official OpenAI endpoints', () => {
  const adapter = new OpenAIAdapter();
  assert.equal(adapter.id, 'openai');
  assert.equal(adapter.defaultBaseURL, 'https://api.openai.com/v1');
});

test('GroqAdapter defaults to Groq LPU endpoint', () => {
  const adapter = new GroqAdapter();
  assert.equal(adapter.id, 'groq');
  assert.equal(adapter.defaultBaseURL, 'https://api.groq.com/openai/v1');
});

test('DeepSeekAdapter defaults to DeepSeek endpoint', () => {
  const adapter = new DeepSeekAdapter();
  assert.equal(adapter.id, 'deepseek');
  assert.equal(adapter.defaultBaseURL, 'https://api.deepseek.com');
});

test('OllamaAdapter defaults to local port 11434 without API key', () => {
  const adapter = new OllamaAdapter();
  assert.equal(adapter.id, 'ollama');
  assert.equal(adapter.defaultBaseURL, 'http://localhost:11434/v1');
});
