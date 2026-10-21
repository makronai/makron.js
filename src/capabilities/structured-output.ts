/**
 * @license MIT
 * Makron.js Structured Output Helper
 */

import { StructuredOutputSchema } from '../core/types';
import { safeJsonParse } from '../utils/json';

export function defineSchema(
  name: string,
  schema: Record<string, unknown>,
  description?: string,
  strict: boolean = true
): StructuredOutputSchema {
  return {
    name,
    description,
    schema,
    strict,
  };
}

export function parseStructuredOutput<T = unknown>(text: string): T | undefined {
  return safeJsonParse<T>(text);
}
