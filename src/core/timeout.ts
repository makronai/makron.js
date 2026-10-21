/**
 * @license MIT
 * Makron.js Timeout Utilities
 */

import { RequestTimeoutError } from './errors';

export function createTimeoutSignal(timeoutMs: number, parentSignal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new RequestTimeoutError(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  const onParentAbort = () => {
    clearTimeout(timer);
    controller.abort(parentSignal?.reason);
  };

  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(timer);
      controller.abort(parentSignal.reason);
    } else {
      parentSignal.addEventListener('abort', onParentAbort, { once: true });
    }
  }

  const cleanup = () => {
    clearTimeout(timer);
    if (parentSignal) {
      parentSignal.removeEventListener('abort', onParentAbort);
    }
  };

  return { signal: controller.signal, cleanup };
}
