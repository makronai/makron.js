/**
 * @license MIT
 * Makron.js Content Guardrails & PII Sanitizer Component
 * Protects applications from prompt injections, leaks, and unwanted terms.
 */

export interface PiiDetection {
  type: 'email' | 'phone' | 'credit_card' | 'api_key' | 'ssn';
  match: string;
}

export interface GuardrailOptions {
  redactPii?: boolean;
  blocklist?: string[];
  checkPromptInjection?: boolean;
  maxCharacters?: number;
}

export interface GuardrailResult {
  text: string;
  isSafe: boolean;
  violations: string[];
  piiDetections: PiiDetection[];
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|directions)/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+in\s+(developer|dan|jailbreak)\s+mode/i,
  /system\s+override\s*:/i,
  /bypass\s+all\s+(filters|rules|safeguards)/i,
];

export class ContentGuard {
  private blocklist: Set<string>;
  private checkInjection: boolean;
  private redactPiiEnabled: boolean;
  private maxCharacters: number;

  constructor(options: GuardrailOptions = {}) {
    this.blocklist = new Set((options.blocklist || []).map((w) => w.toLowerCase()));
    this.checkInjection = options.checkPromptInjection ?? true;
    this.redactPiiEnabled = options.redactPii ?? true;
    this.maxCharacters = options.maxCharacters ?? 50000;
  }

  /**
   * Redacts sensitive personal identifiable information (PII) and secret API keys
   */
  public redactPii(text: string): { redactedText: string; detections: PiiDetection[] } {
    let result = text;
    const detections: PiiDetection[] = [];

    // Email
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => {
      detections.push({ type: 'email', match });
      return '[REDACTED_EMAIL]';
    });

    // Credit Cards
    result = result.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, (match) => {
      detections.push({ type: 'credit_card', match });
      return '[REDACTED_CARD]';
    });

    // US SSN
    result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, (match) => {
      detections.push({ type: 'ssn', match });
      return '[REDACTED_SSN]';
    });

    // API Keys (sk-..., AIza...)
    result = result.replace(/\b(?:sk-[a-zA-Z0-9_-]{20,}|AIza[0-9A-Za-z-_]{35})\b/g, (match) => {
      detections.push({ type: 'api_key', match });
      return '[REDACTED_API_KEY]';
    });

    return { redactedText: result, detections };
  }

  /**
   * Check for known adversarial jailbreak & system prompt override patterns
   */
  public detectPromptInjection(text: string): { suspicious: boolean; matches: string[] } {
    const matches: string[] = [];
    for (const pattern of INJECTION_PATTERNS) {
      const found = text.match(pattern);
      if (found) {
        matches.push(found[0]);
      }
    }
    return {
      suspicious: matches.length > 0,
      matches,
    };
  }

  /**
   * Complete validation and sanitization pass
   */
  public inspect(text: string): GuardrailResult {
    const violations: string[] = [];
    let processed = text;
    let detections: PiiDetection[] = [];

    // Max characters check
    if (processed.length > this.maxCharacters) {
      violations.push(`Text length exceeds maximum allowed character limit (${this.maxCharacters})`);
      processed = processed.slice(0, this.maxCharacters);
    }

    // Prompt injection check
    if (this.checkInjection) {
      const injection = this.detectPromptInjection(processed);
      if (injection.suspicious) {
        violations.push(`Suspected prompt injection pattern: "${injection.matches[0]}"`);
      }
    }

    // Blocklist check
    if (this.blocklist.size > 0) {
      const lower = processed.toLowerCase();
      for (const blocked of this.blocklist) {
        if (lower.includes(blocked)) {
          violations.push(`Content contains blocked term: "${blocked}"`);
        }
      }
    }

    // PII Redaction
    if (this.redactPiiEnabled) {
      const pii = this.redactPii(processed);
      processed = pii.redactedText;
      detections = pii.detections;
    }

    return {
      text: processed,
      isSafe: violations.length === 0,
      violations,
      piiDetections: detections,
    };
  }
}

/**
 * Convenience factory to create a content guard instance
 */
export function createContentGuard(options: GuardrailOptions = {}): ContentGuard {
  return new ContentGuard(options);
}
