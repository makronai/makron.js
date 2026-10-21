/**
 * @license MIT
 * Makron.js JSON Parsing Utilities
 */

export function safeJsonParse<T = unknown>(input: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown, indent?: number): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch (err) {
    return String(value);
  }
}
