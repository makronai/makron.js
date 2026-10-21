/**
 * @license MIT
 * Makron.js Universal Fetch & Transport
 */

import {
  AuthenticationError,
  ProviderError,
  RateLimitError,
  RequestAbortedError,
  RequestTimeoutError,
} from '../core/errors';
import { redactHeaders, redactString } from './redact';
import { safeJsonParse } from './json';

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  provider?: string;
}

export async function safeFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 60000, provider = 'unknown', ...init } = options;

  let timeoutId: any;
  let signal = init.signal;

  if (timeoutMs > 0) {
    const controller = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }
    timeoutId = setTimeout(() => {
      controller.abort(new RequestTimeoutError(`Request timed out after ${timeoutMs}ms`, { provider }));
    }, timeoutMs);
    signal = controller.signal;
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      await handleHttpError(response, provider);
    }

    return response;
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);

    if (err instanceof RequestTimeoutError) {
      throw err;
    }
    if (err.name === 'AbortError' || signal?.aborted) {
      throw new RequestAbortedError('Request aborted by caller or timeout', {
        provider,
        cause: err,
      });
    }
    if (err.name?.includes('Error') && err.provider) {
      throw err;
    }

    throw new ProviderError(
      `Network request failed to ${redactString(url)}: ${err.message || String(err)}`,
      {
        provider,
        cause: err,
      }
    );
  }
}

async function handleHttpError(response: Response, provider: string): Promise<never> {
  const status = response.status;
  const rawText = await response.text().catch(() => '');
  const parsed = safeJsonParse<any>(rawText);
  const errorMessage =
    parsed?.error?.message ||
    parsed?.message ||
    parsed?.detail ||
    rawText ||
    `HTTP ${status} ${response.statusText}`;

  const retryAfterHeader = response.headers.get('retry-after');
  let retryAfterMs: number | undefined;
  if (retryAfterHeader) {
    const parsedSec = parseInt(retryAfterHeader, 10);
    if (!isNaN(parsedSec)) {
      retryAfterMs = parsedSec * 1000;
    }
  }

  const details = {
    url: redactString(response.url),
    status,
    headers: redactHeaders(response.headers),
    rawError: parsed || rawText,
  };

  if (status === 401 || status === 403) {
    throw new AuthenticationError(
      `Authentication failed for provider '${provider}': ${errorMessage}`,
      { provider, statusCode: status, details }
    );
  }

  if (status === 429) {
    throw new RateLimitError(
      `Rate limit exceeded for provider '${provider}': ${errorMessage}`,
      { provider, statusCode: status, retryAfterMs, details }
    );
  }

  if (status === 408 || status === 504) {
    throw new RequestTimeoutError(
      `Gateway or request timeout (${status}) from provider '${provider}': ${errorMessage}`,
      { provider, statusCode: status, details }
    );
  }

  throw new ProviderError(
    `Provider '${provider}' returned error (${status}): ${errorMessage}`,
    {
      provider,
      statusCode: status,
      retryable: status >= 500,
      details,
    }
  );
}
