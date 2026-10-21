/**
 * @license MIT
 * Makron.js Secret and Token Redaction Utilities
 */

const SENSITIVE_KEY_PATTERNS = [
  /api[-_]?key/i,
  /auth[-_]?token/i,
  /bearer/i,
  /secret/i,
  /password/i,
  /private[-_]?key/i,
  /access[-_]?token/i,
];

const SECRET_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9_\-]{20,}/g,           // OpenAI, Groq, Anthropic, DeepSeek, etc.
  /AIza[0-9A-Za-z-_]{35}/g,           // Google API keys
  /gsk_[a-zA-Z0-9]{30,}/g,            // Groq keys
  /hf_[a-zA-Z0-9]{30,}/g,             // HuggingFace tokens
  /xai-[a-zA-Z0-9]{30,}/g,            // xAI keys
  /Bearer\s+[a-zA-Z0-9._\-]+/gi,      // Authorization headers
];

/**
 * Redacts secrets from a string (e.g. error message, log, URL query)
 */
export function redactString(input: string): string {
  if (!input) return input;
  let redacted = input;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      if (match.toLowerCase().startsWith('bearer ')) {
        return 'Bearer [REDACTED]';
      }
      return `${match.slice(0, 4)}...[REDACTED]`;
    });
  }
  return redacted;
}

/**
 * Deeply redacts sensitive keys from an object
 */
export function redactObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return redactString(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitiveKey) {
      if (typeof value === 'string' && value.length > 0) {
        result[key] = `${value.slice(0, 3)}...[REDACTED]`;
      } else {
        result[key] = '[REDACTED]';
      }
    } else {
      result[key] = redactObject(value);
    }
  }

  return result as T;
}

/**
 * Redacts sensitive HTTP headers
 */
export function redactHeaders(headers: HeadersInit | Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      normalized[key] = value;
    }
  } else if (typeof headers === 'object' && headers !== null) {
    Object.assign(normalized, headers);
  }

  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(normalized)) {
    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'x-api-key' || lower.includes('key') || lower.includes('token')) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}
