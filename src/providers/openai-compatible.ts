/**
 * @license MIT
 * Makron.js OpenAI-Compatible Provider Adapter
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderConfig,
  RequestOptions,
} from '../core/types';
import { BaseProviderAdapter } from './base';
import { validateChatRequest, validateBaseURL } from '../core/validation';
import { safeFetch } from '../utils/fetch';
import { safeJsonParse, safeJsonStringify } from '../utils/json';
import { normalizeOpenAIResponse } from '../core/response-normalizer';
import { normalizeOpenAIStream } from '../core/stream-normalizer';
import { withRetry } from '../core/retry';

export class OpenAICompatibleAdapter extends BaseProviderAdapter {
  public readonly id: string;
  public readonly name: string;
  declare public readonly defaultBaseURL: string;

  constructor(
    config: ProviderConfig = {},
    id: string = 'openai-compatible',
    name: string = 'OpenAI Compatible Endpoint',
    defaultBaseURL: string = 'http://localhost:8000/v1'
  ) {
    super(config);
    this.id = id;
    this.name = name;
    this.defaultBaseURL = defaultBaseURL;
  }

  protected getBaseURL(options?: RequestOptions): string {
    const rawUrl = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    return validateBaseURL(rawUrl, this.name);
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
    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }
    if (this.config.project) {
      headers['OpenAI-Project'] = this.config.project;
    }
    return headers;
  }

  protected serializeMessages(messages: ChatRequest['messages']): any[] {
    return messages.map((msg) => {
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: msg.content,
          name: msg.name,
          tool_calls: msg.toolCalls,
          tool_call_id: msg.toolCallId,
        };
      }

      // Handle multimodal array content
      const contentParts = msg.content.map((part) => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        if (part.type === 'image') {
          let url = '';
          if (typeof part.image === 'string') {
            url = part.image;
          } else {
            // Uint8Array to base64
            const mime = part.mimeType || 'image/jpeg';
            const base64 = isBrowser()
              ? btoa(String.fromCharCode(...part.image))
              : Buffer.from(part.image).toString('base64');
            url = `data:${mime};base64,${base64}`;
          }
          return {
            type: 'image_url',
            image_url: { url },
          };
        }
        return part;
      });

      return {
        role: msg.role,
        content: contentParts,
      };
    });
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || 'gpt-5-mini';
    const baseURL = this.getBaseURL(options);
    const headers = this.getHeaders(options);

    // If mockTransport is provided (for unit tests / zero-config demo), use it
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return normalizeOpenAIResponse(mockResult, this.id, model, 25);
    }

    const payload: Record<string, unknown> = {
      model,
      messages: this.serializeMessages(request.messages),
      stream: false,
    };

    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.topP !== undefined) payload.top_p = request.topP;
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
    if (request.stop !== undefined) payload.stop = request.stop;
    if (request.seed !== undefined) payload.seed = request.seed;
    if (request.presencePenalty !== undefined) payload.presence_penalty = request.presencePenalty;
    if (request.frequencyPenalty !== undefined) payload.frequency_penalty = request.frequencyPenalty;

    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools;
      if (request.toolChoice) payload.tool_choice = request.toolChoice;
    }

    if (request.responseFormat) {
      if (typeof request.responseFormat === 'object' && 'schema' in request.responseFormat) {
        payload.response_format = {
          type: 'json_schema',
          json_schema: {
            name: request.responseFormat.name,
            strict: request.responseFormat.strict ?? true,
            schema: request.responseFormat.schema,
          },
        };
      } else if (request.responseFormat === 'json_object') {
        payload.response_format = { type: 'json_object' };
      }
    }

    if (request.custom) {
      Object.assign(payload, request.custom);
    }

    const endpoint = `${baseURL}/chat/completions`;
    const startTime = Date.now();

    const response = await withRetry(
      async () => {
        return await safeFetch(endpoint, {
          method: 'POST',
          headers,
          body: safeJsonStringify(payload),
          signal: options?.signal,
          timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 60000,
          provider: this.id,
        });
      },
      {
        maxRetries: options?.retries ?? this.config.retries ?? 2,
        signal: options?.signal,
      }
    );

    const rawJson = await response.json();
    const latencyMs = Date.now() - startTime;
    return normalizeOpenAIResponse(rawJson, this.id, model, latencyMs);
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || 'gpt-5-mini';
    const baseURL = this.getBaseURL(options);
    const headers = {
      ...this.getHeaders(options),
      'Accept': 'text/event-stream',
    };

    // Mock transport support for streaming
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL, stream: true });
      if (Array.isArray(mockResult)) {
        for (const chunk of mockResult) {
          yield chunk as ChatChunk;
        }
        return;
      }
    }

    const payload: Record<string, unknown> = {
      model,
      messages: this.serializeMessages(request.messages),
      stream: true,
      stream_options: { include_usage: true },
    };

    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.maxTokens !== undefined) payload.max_tokens = request.maxTokens;
    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools;
      if (request.toolChoice) payload.tool_choice = request.toolChoice;
    }

    const endpoint = `${baseURL}/chat/completions`;
    const response = await safeFetch(endpoint, {
      method: 'POST',
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 60000,
      provider: this.id,
    });

    if (!response.body) {
      throw new Error('Streaming response body is missing');
    }

    yield* normalizeOpenAIStream(response.body, this.id, model, options?.signal);
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    const model = request.model || 'text-embedding-3-large';
    const baseURL = this.getBaseURL(options);
    const headers = this.getHeaders(options);

    const payload: Record<string, unknown> = {
      model,
      input: request.input,
    };
    if (request.dimensions) payload.dimensions = request.dimensions;
    if (request.user) payload.user = request.user;

    const endpoint = `${baseURL}/embeddings`;
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

    const embeddings = (raw.data || []).map((item: any) => ({
      index: item.index ?? 0,
      vector: item.embedding,
    }));

    return {
      model: raw.model || model,
      provider: this.id,
      embeddings,
      usage: raw.usage
        ? {
            promptTokens: raw.usage.prompt_tokens ?? 0,
            totalTokens: raw.usage.total_tokens ?? 0,
          }
        : undefined,
      latencyMs,
      raw,
    };
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
