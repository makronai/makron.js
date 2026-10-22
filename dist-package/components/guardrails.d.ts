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
export declare class ContentGuard {
    private blocklist;
    private checkInjection;
    private redactPiiEnabled;
    private maxCharacters;
    constructor(options?: GuardrailOptions);
    /**
     * Redacts sensitive personal identifiable information (PII) and secret API keys
     */
    redactPii(text: string): {
        redactedText: string;
        detections: PiiDetection[];
    };
    /**
     * Check for known adversarial jailbreak & system prompt override patterns
     */
    detectPromptInjection(text: string): {
        suspicious: boolean;
        matches: string[];
    };
    /**
     * Complete validation and sanitization pass
     */
    inspect(text: string): GuardrailResult;
}
/**
 * Convenience factory to create a content guard instance
 */
export declare function createContentGuard(options?: GuardrailOptions): ContentGuard;
