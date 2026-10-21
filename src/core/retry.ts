/**
 * @license MIT
 * Makron.js Retry Engine with Exponential Backoff and Jitter
 */

import { MakronError } from './errors';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 500,
    maxDelayMs = 10000,
    signal,
    shouldRetry = defaultShouldRetry,
  } = options;

  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      throw new Error('Operation aborted prior to execution');
    }

    try {
      return await operation(attempt);
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries || !shouldRetry(err, attempt)) {
        throw err;
      }

      if (signal?.aborted) {
        throw err;
      }

      // Check if error provides explicit retryAfterMs
      let delay = 0;
      if (err instanceof MakronError && err.retryAfterMs && err.retryAfterMs > 0) {
        delay = Math.min(err.retryAfterMs, maxDelayMs);
      } else {
        // Exponential backoff: baseDelayMs * 2^(attempt - 1) with jitter
        const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.5 + 0.5; // 0.5 - 1.0 jitter factor
        delay = Math.min(Math.floor(exponentialDelay * jitter), maxDelayMs);
      }

      await sleep(delay, signal);
    }
  }
}

function defaultShouldRetry(error: unknown, _attempt: number): boolean {
  if (error instanceof MakronError) {
    return error.retryable;
  }
  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Aborted'));
    }

    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}
