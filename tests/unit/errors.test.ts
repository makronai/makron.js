import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MakronError,
  AuthenticationError,
  RateLimitError,
  RequestTimeoutError,
  UnsupportedCapabilityError,
  ModelNotFoundError,
  AdapterNotFoundError,
  IntegrationDependencyError,
} from '../../src/index';

test('Error hierarchy maintains proper inheritance and fields', () => {
  const authErr = new AuthenticationError('Unauthorized', { provider: 'openai', statusCode: 401 });
  assert.ok(authErr instanceof MakronError);
  assert.equal(authErr.name, 'AuthenticationError');
  assert.equal(authErr.statusCode, 401);
  assert.equal(authErr.retryable, false);

  const rateErr = new RateLimitError('Too many requests', { provider: 'anthropic', retryAfterMs: 3000 });
  assert.ok(rateErr instanceof MakronError);
  assert.equal(rateErr.retryable, true);
  assert.equal(rateErr.retryAfterMs, 3000);

  const capErr = new UnsupportedCapabilityError('reasoning', 'gpt-5-nano');
  assert.equal(capErr.name, 'UnsupportedCapabilityError');
  assert.equal(capErr.capability, 'reasoning');

  const depErr = new IntegrationDependencyError('@mlc-ai/web-llm', 'WebLLM WebGPU inference');
  assert.equal(depErr.name, 'IntegrationDependencyError');
  assert.equal(depErr.packageName, '@mlc-ai/web-llm');
});

test('Error messages redact sensitive API keys automatically', () => {
  const rawKey = 'sk-abcdef12345678901234567890abcdef';
  const err = new MakronError(`Failed request with key: ${rawKey}`);
  assert.ok(!err.message.includes(rawKey));
  assert.ok(err.message.includes('[REDACTED]'));
});
