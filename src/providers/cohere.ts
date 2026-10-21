/**
 * @license MIT
 * Makron.js Cohere Provider Adapter with Chat, Embeddings, and Rerank
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderConfig,
  RequestOptions,
  RerankRequest,
  RerankResponse,
} from '../core/types';
import { BaseProviderAdapter } from './base';
import { validateChatRequest } from '../core/validation';
import { getEnv } from '../utils/env';
import { safeFetch } from '../utils/fetch';
import { safeJsonStringify } from '../utils/json';
import { contentToString } from '../core/messages';

export class CohereAdapter extends BaseProviderAdapter {
  public readonly id = 'cohere';
  public readonly name = 'Cohere';
  public readonly defaultBaseURL = 'https://api.cohere.com/v2';

  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('COHERE_API_KEY');
    super({
      ...config,
      apiKey,
      defaultModel: config.defaultModel || 'command-r-plus-08-2024',
    });
  }

  protected getApiKey(options?: RequestOptions): string | undefined {
    return options?.apiKey || this.config.apiKey;
  }

  protected getHeaders(options?: RequestOptions): Record<string, string> {
    const apiKey = this.getApiKey(options);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.config.headers,
      ...options?.headers,
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || 'command-r-plus-08-2024';
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);

    // Mock transport support
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return {
        id: (mockResult as any)?.id || `cohere_${Date.now()}`,
        model,
        provider: 'cohere',
        text: (mockResult as any)?.text || 'Cohere response',
        message: { role: 'assistant', content: (mockResult as any)?.text || 'Cohere response' },
        finishReason: { reason: 'stop' },
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        latencyMs: 25,
        raw: mockResult,
      };
    }

    const messages = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: contentToString(m.content),
    }));

    const payload: Record<string, unknown> = {
      model,
      messages,
    };
    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;

    const endpoint = `${baseURL.replace(/\/+$/, '')}/chat`;
    const startTime = Date.now();

    const response = await safeFetch(endpoint, {
      method: 'POST',
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 60000,
      provider: this.id,
    });

    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const text = raw.message?.content?.[0]?.text || '';

    return {
      id: raw.id || `cohere_${Date.now()}`,
      model,
      provider: 'cohere',
      text,
      message: { role: 'assistant', content: text },
      finishReason: { reason: 'stop', raw: raw.finish_reason },
      usage: {
        promptTokens: raw.usage?.tokens?.input_tokens ?? 0,
        completionTokens: raw.usage?.tokens?.output_tokens ?? 0,
        totalTokens: (raw.usage?.tokens?.input_tokens ?? 0) + (raw.usage?.tokens?.output_tokens ?? 0),
      },
      latencyMs,
      raw,
    };
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    const model = request.model || 'embed-multilingual-v3.0';
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);

    const texts = Array.isArray(request.input) ? request.input : [request.input];
    const payload = {
      model,
      texts,
      input_type: 'search_query',
    };

    const endpoint = `${baseURL.replace(/\/+$/, '')}/embed`;
    const startTime = Date.now();

    const response = await safeFetch(endpoint, {
      method: 'POST',
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 30000,
      provider: this.id,
    });

    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const rawEmbeddings: number[][] = raw.embeddings?.float || raw.embeddings || [];

    return {
      model,
      provider: 'cohere',
      embeddings: rawEmbeddings.map((vector, index) => ({ index, vector })),
      usage: raw.meta?.billed_units
        ? {
            promptTokens: raw.meta.billed_units.input_tokens || 0,
            totalTokens: raw.meta.billed_units.input_tokens || 0,
          }
        : undefined,
      latencyMs,
      raw,
    };
  }

  async rerank(request: RerankRequest, options?: RequestOptions): Promise<RerankResponse> {
    const model = request.model || 'rerank-v3.5';
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);

    const documents = request.documents.map((doc) => (typeof doc === 'string' ? doc : doc.text));
    const payload: Record<string, unknown> = {
      model,
      query: request.query,
      documents,
      top_n: request.topN ?? documents.length,
      return_documents: request.returnDocuments ?? true,
    };

    const endpoint = `${baseURL.replace(/\/+$/, '')}/rerank`;
    const startTime = Date.now();

    const response = await safeFetch(endpoint, {
      method: 'POST',
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 30000,
      provider: this.id,
    });

    const raw = await response.json();
    const latencyMs = Date.now() - startTime;

    const results = (raw.results || []).map((item: any) => ({
      index: item.index,
      relevanceScore: item.relevance_score,
      document: item.document?.text || request.documents[item.index],
    }));

    return {
      model,
      provider: 'cohere',
      results,
      latencyMs,
      raw,
    };
  }
}
