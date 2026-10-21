/**
 * @license MIT
 * Makron.js Error Hierarchy
 */

import { redactString } from '../utils/redact';

export interface ErrorOptions {
  cause?: unknown;
  provider?: string;
  statusCode?: number;
  code?: string;
  retryable?: boolean;
  retryAfterMs?: number;
  details?: Record<string, unknown>;
}

export class MakronError extends Error {
  public readonly provider?: string;
  public readonly statusCode?: number;
  public readonly code?: string;
  public readonly retryable: boolean;
  public readonly retryAfterMs?: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, options: ErrorOptions = {}) {
    super(redactString(message));
    this.name = 'MakronError';
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
    this.details = options.details;
    if (options.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends MakronError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, { ...options, retryable: false });
    this.name = 'ConfigurationError';
  }
}

export class AuthenticationError extends MakronError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 401, retryable: false });
    this.name = 'AuthenticationError';
  }
}

export class ProviderError extends MakronError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 500,
      retryable: options.retryable ?? (options.statusCode ? options.statusCode >= 500 : false),
    });
    this.name = 'ProviderError';
  }
}

export class RateLimitError extends MakronError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 429,
      retryable: true,
    });
    this.name = 'RateLimitError';
  }
}

export class RequestTimeoutError extends MakronError {
  constructor(message: string = 'Request timed out', options: ErrorOptions = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 408,
      retryable: true,
    });
    this.name = 'RequestTimeoutError';
  }
}

export class RequestAbortedError extends MakronError {
  constructor(message: string = 'Request was aborted', options: ErrorOptions = {}) {
    super(message, { ...options, retryable: false });
    this.name = 'RequestAbortedError';
  }
}

export class UnsupportedCapabilityError extends MakronError {
  public readonly capability: string;

  constructor(capability: string, modelOrProvider: string, options: ErrorOptions = {}) {
    super(`Capability '${capability}' is not supported by ${modelOrProvider}`, {
      ...options,
      retryable: false,
    });
    this.name = 'UnsupportedCapabilityError';
    this.capability = capability;
  }
}

export class ModelNotFoundError extends MakronError {
  public readonly modelId: string;

  constructor(modelId: string, provider?: string, options: ErrorOptions = {}) {
    super(`Model '${modelId}' was not found${provider ? ` for provider '${provider}'` : ''}`, {
      ...options,
      statusCode: options.statusCode ?? 404,
      retryable: false,
    });
    this.name = 'ModelNotFoundError';
    this.modelId = modelId;
  }
}

export class AdapterNotFoundError extends MakronError {
  public readonly adapterId: string;

  constructor(adapterId: string, options: ErrorOptions = {}) {
    super(`Adapter or provider '${adapterId}' is not registered or supported`, {
      ...options,
      retryable: false,
    });
    this.name = 'AdapterNotFoundError';
    this.adapterId = adapterId;
  }
}

export class IntegrationDependencyError extends MakronError {
  public readonly packageName: string;

  constructor(packageName: string, feature: string, options: ErrorOptions = {}) {
    super(
      `Optional package '${packageName}' is required to use ${feature}. Please install it via 'npm install ${packageName}'`,
      { ...options, retryable: false }
    );
    this.name = 'IntegrationDependencyError';
    this.packageName = packageName;
  }
}

export class ModelLoadError extends MakronError {
  public readonly modelId: string;

  constructor(modelId: string, reason: string, options: ErrorOptions = {}) {
    super(`Failed to load model '${modelId}': ${reason}`, {
      ...options,
      retryable: false,
    });
    this.name = 'ModelLoadError';
    this.modelId = modelId;
  }
}
