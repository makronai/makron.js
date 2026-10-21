/**
 * @license MIT
 * Makron.js Request Options Normalization
 */

import { RequestOptions } from './types';

export function mergeRequestOptions(
  defaultOptions?: RequestOptions,
  overrideOptions?: RequestOptions
): RequestOptions {
  return {
    ...defaultOptions,
    ...overrideOptions,
    headers: {
      ...defaultOptions?.headers,
      ...overrideOptions?.headers,
    },
    custom: {
      ...defaultOptions?.custom,
      ...overrideOptions?.custom,
    },
  };
}
