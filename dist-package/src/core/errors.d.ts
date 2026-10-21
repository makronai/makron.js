/**
 * @license MIT
 * Makron.js Error Hierarchy
 */
export interface ErrorOptions {
    cause?: unknown;
    provider?: string;
    statusCode?: number;
    code?: string;
    retryable?: boolean;
    retryAfterMs?: number;
    details?: Record<string, unknown>;
}
export declare class MakronError extends Error {
    readonly provider?: string;
    readonly statusCode?: number;
    readonly code?: string;
    readonly retryable: boolean;
    readonly retryAfterMs?: number;
    readonly details?: Record<string, unknown>;
    constructor(message: string, options?: ErrorOptions);
}
export declare class ConfigurationError extends MakronError {
    constructor(message: string, options?: ErrorOptions);
}
export declare class AuthenticationError extends MakronError {
    constructor(message: string, options?: ErrorOptions);
}
export declare class ProviderError extends MakronError {
    constructor(message: string, options?: ErrorOptions);
}
export declare class RateLimitError extends MakronError {
    constructor(message: string, options?: ErrorOptions);
}
export declare class RequestTimeoutError extends MakronError {
    constructor(message?: string, options?: ErrorOptions);
}
export declare class RequestAbortedError extends MakronError {
    constructor(message?: string, options?: ErrorOptions);
}
export declare class UnsupportedCapabilityError extends MakronError {
    readonly capability: string;
    constructor(capability: string, modelOrProvider: string, options?: ErrorOptions);
}
export declare class ModelNotFoundError extends MakronError {
    readonly modelId: string;
    constructor(modelId: string, provider?: string, options?: ErrorOptions);
}
export declare class AdapterNotFoundError extends MakronError {
    readonly adapterId: string;
    constructor(adapterId: string, options?: ErrorOptions);
}
export declare class IntegrationDependencyError extends MakronError {
    readonly packageName: string;
    constructor(packageName: string, feature: string, options?: ErrorOptions);
}
export declare class ModelLoadError extends MakronError {
    readonly modelId: string;
    constructor(modelId: string, reason: string, options?: ErrorOptions);
}
