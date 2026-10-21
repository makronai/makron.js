/**
 * @license MIT
 * Makron.js Retry Engine with Exponential Backoff and Jitter
 */
export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    signal?: AbortSignal;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
}
export declare function withRetry<T>(operation: (attempt: number) => Promise<T>, options?: RetryOptions): Promise<T>;
