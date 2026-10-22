/**
 * @license MIT
 * Makron.js Multi-Provider Fallback & Resilience Chain Component
 * Seamlessly fails over across providers or models on errors, rate limits, or timeouts.
 */
import { ChatChunk, ChatRequest, ChatResponse, RequestOptions } from '../core/types';
export interface FallbackClient {
    id?: string;
    chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
    stream?(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
}
export interface FallbackEvent {
    fromProvider: string;
    toProvider: string;
    attempt: number;
    error: Error;
}
export interface FallbackChainConfig {
    /** Ordered list of clients/adapters to try in sequence */
    clients: FallbackClient[];
    /** Callback fired whenever failover occurs */
    onFallback?: (event: FallbackEvent) => void;
    /** Whether to failover on 4xx validation errors (default: false, only on 429, 5xx, timeouts) */
    fallbackOnValidationError?: boolean;
}
export declare class FallbackChain {
    private clients;
    private onFallback?;
    constructor(config: FallbackChainConfig);
    /**
     * Execute chat request with automatic cascade failover
     */
    chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse & {
        resolvedByProvider: string;
        fallbackAttempts: number;
    }>;
    /**
     * Stream chat chunks with failover on initial connection failure
     */
    stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
}
/**
 * Factory to create a multi-provider fallback resilience chain
 */
export declare function createFallbackChain(config: FallbackChainConfig): FallbackChain;
