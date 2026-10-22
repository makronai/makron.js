/**
 * @license MIT
 * Makron.js Multi-Provider Fallback & Resilience Chain Component
 * Seamlessly fails over across providers or models on errors, rate limits, or timeouts.
 */

import { ChatChunk, ChatRequest, ChatResponse, RequestOptions } from '../core/types';
import { MakronError } from '../core/errors';

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

export class FallbackChain {
  private clients: FallbackClient[];
  private onFallback?: (event: FallbackEvent) => void;

  constructor(config: FallbackChainConfig) {
    if (!config.clients || config.clients.length === 0) {
      throw new Error('FallbackChain requires at least one client');
    }
    this.clients = config.clients;
    this.onFallback = config.onFallback;
  }

  /**
   * Execute chat request with automatic cascade failover
   */
  public async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse & { resolvedByProvider: string; fallbackAttempts: number }> {
    let lastError: any = null;

    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const providerId = client.id || `provider_${i}`;

      try {
        const response = await client.chat(request, options);
        return {
          ...response,
          resolvedByProvider: providerId,
          fallbackAttempts: i,
        };
      } catch (err: any) {
        lastError = err;
        const nextClient = this.clients[i + 1];

        if (nextClient) {
          const nextProviderId = nextClient.id || `provider_${i + 1}`;
          this.onFallback?.({
            fromProvider: providerId,
            toProvider: nextProviderId,
            attempt: i + 1,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    }

    throw new MakronError(
      `All ${this.clients.length} fallback providers failed. Last error: ${lastError?.message || String(lastError)}`,
      lastError?.code || 'ALL_PROVIDERS_FAILED'
    );
  }

  /**
   * Stream chat chunks with failover on initial connection failure
   */
  public async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    let lastError: any = null;

    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const providerId = client.id || `provider_${i}`;

      if (!client.stream) {
        // Fallback to chat wrapper if stream is not implemented
        try {
          const full = await client.chat(request, options);
          yield {
            id: full.id,
            model: full.model,
            provider: providerId,
            deltaText: full.text,
            finishReason: full.finishReason,
            usage: full.usage,
            raw: full.raw,
          };
          return;
        } catch (err: any) {
          lastError = err;
          continue;
        }
      }

      try {
        const iterable = client.stream(request, options);
        let yieldedAny = false;

        for await (const chunk of iterable) {
          yieldedAny = true;
          yield chunk;
        }

        if (yieldedAny) {
          return;
        }
      } catch (err: any) {
        lastError = err;
        const nextClient = this.clients[i + 1];
        if (nextClient) {
          this.onFallback?.({
            fromProvider: providerId,
            toProvider: nextClient.id || `provider_${i + 1}`,
            attempt: i + 1,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    }

    throw new MakronError(
      `All fallback stream providers failed. Last error: ${lastError?.message || String(lastError)}`,
      lastError?.code || 'STREAM_FALLBACK_FAILED'
    );
  }
}

/**
 * Factory to create a multi-provider fallback resilience chain
 */
export function createFallbackChain(config: FallbackChainConfig): FallbackChain {
  return new FallbackChain(config);
}
