import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../../src/core/retry';
import { RateLimitError } from '../../src/index';

test('withRetry retries retryable errors and succeeds on recovery', async () => {
  let attempts = 0;
  const result = await withRetry(
    async (attempt) => {
      attempts++;
      if (attempt === 0) {
        throw new RateLimitError('Rate limit exceeded', { retryAfterMs: 10 });
      }
      return 'success-after-retry';
    },
    { maxRetries: 2, baseDelayMs: 10 }
  );

  assert.equal(result, 'success-after-retry');
  assert.equal(attempts, 2);
});

test('withRetry stops retrying when maxRetries exceeded', async () => {
  let attempts = 0;
  await assert.rejects(
    async () => {
      await withRetry(
        async () => {
          attempts++;
          throw new RateLimitError('Rate limit exceeded', { retryAfterMs: 5 });
        },
        { maxRetries: 2, baseDelayMs: 5 }
      );
    },
    (err: any) => err instanceof RateLimitError
  );

  assert.equal(attempts, 3); // initial + 2 retries
});
