/**
 * @license MIT
 * Makron.js Timeout Utilities
 */
export declare function createTimeoutSignal(timeoutMs: number, parentSignal?: AbortSignal): {
    signal: AbortSignal;
    cleanup: () => void;
};
