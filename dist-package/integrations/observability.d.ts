/**
 * @license MIT
 * Makron.js Observability & Tracing Engine
 */
import { ObservabilityHandler, ObservabilitySpan } from './types';
export declare class ObservabilityManager {
    private handlers;
    addHandler(handler: ObservabilityHandler): void;
    startSpan(provider: string, model: string, metadata?: Record<string, unknown>): ObservabilitySpan;
    endSpan(span: ObservabilitySpan, usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }, error?: Error): void;
}
export declare const defaultObservability: ObservabilityManager;
