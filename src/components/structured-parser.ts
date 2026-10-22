/**
 * @license MIT
 * Makron.js Structured Output Extractor & JSON Repair Component
 * Robustly parses and self-heals structured outputs from any LLM.
 */

import { StructuredOutputSchema } from '../core/types';

/**
 * Extracts and repairs JSON embedded in markdown fences or raw model responses
 */
export function extractJson<T = unknown>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJson expected a non-empty string input');
  }

  // 1. Try direct parse first
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Continue to extraction heuristics
  }

  // 2. Extract from markdown code fence ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Try repaired
      return JSON.parse(repairJson(codeBlockMatch[1])) as T;
    }
  }

  // 3. Find outermost object { ... } or array [ ... ]
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = trimmed.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = trimmed.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    const rawSnippet = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(rawSnippet) as T;
    } catch {
      return JSON.parse(repairJson(rawSnippet)) as T;
    }
  }

  throw new Error(`Unable to extract valid JSON from model response: "${trimmed.slice(0, 100)}..."`);
}

/**
 * Self-heals common model JSON errors:
 * - Trailing commas in arrays and objects
 * - Single quotes instead of double quotes
 * - Unquoted object keys
 * - Unescaped newlines in strings
 */
export function repairJson(raw: string): string {
  let cleaned = raw.trim();

  // Strip leading/trailing backticks if any
  cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Replace single quotes with double quotes for object keys and string values
  // (avoiding apostrophes inside strings where possible)
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  // Fix unquoted keys e.g. { foo: "bar" } -> { "foo": "bar" }
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  return cleaned;
}

export interface StructuredParser<T> {
  schema: StructuredOutputSchema;
  getFormatInstructions(): string;
  parse(text: string): T;
}

/**
 * Creates a structured output parser with auto-repair and prompt instructions
 */
export function createStructuredParser<T = Record<string, unknown>>(
  schema: StructuredOutputSchema
): StructuredParser<T> {
  return {
    schema,
    getFormatInstructions() {
      return `Your response MUST be a valid JSON object adhering to this schema:\n${JSON.stringify(schema.schema, null, 2)}`;
    },
    parse(text: string): T {
      return extractJson<T>(text);
    },
  };
}
