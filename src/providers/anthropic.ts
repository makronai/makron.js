/**
 * @license MIT
 * Makron.js Anthropic Claude Provider Adapter
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  ProviderConfig,
  RequestOptions,
} from '../core/types';
import { BaseProviderAdapter } from './base';
import { validateChatRequest } from '../core/validation';
import { getEnv } from '../utils/env';
import { safeFetch } from '../utils/fetch';
import { safeJsonParse, safeJsonStringify } from '../utils/json';
import { contentToString, extractSystemPrompt } from '../core/messages';
import { normalizeAnthropicResponse } from '../core/response-normalizer';
import { parseSseStream } from '../core/stream-normalizer';

export class AnthropicAdapter extends BaseProviderAdapter {
  public readonly id = 'anthropic';
  public readonly name = 'Anthropic Claude';
  public readonly defaultBaseURL = 'https://api.anthropic.com/v1';

  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('ANTHROPIC_API_KEY');
    super({
      ...config,
      apiKey,
      defaultModel: config.defaultModel || 'claude-3-5-sonnet-20241022',
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
      'anthropic-version': '2023-06-01',
      ...this.config.headers,
      ...options?.headers,
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    return headers;
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || 'claude-3-5-sonnet-20241022';
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);

    // Mock transport support
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return normalizeAnthropicResponse(mockResult, model, 30);
    }

    const { systemPrompt, conversationMessages } = extractSystemPrompt(request.messages);

    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: contentToString(msg.content),
    }));

    const payload: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: request.maxTokens || 4096,
    };

    if (systemPrompt) payload.system = systemPrompt;
    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.topP !== undefined) payload.top_p = request.topP;
    if (request.stop) {
      payload.stop_sequences = Array.isArray(request.stop) ? request.stop : [request.stop];
    }

    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    const endpoint = `${baseURL.replace(/\/+$/, '')}/messages`;
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
    return normalizeAnthropicResponse(raw, model, latencyMs);
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || 'claude-3-5-sonnet-20241022';
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = {
      ...this.getHeaders(options),
      'Accept': 'text/event-stream',
    };

    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, stream: true });
      if (Array.isArray(mockResult)) {
        for (const chunk of mockResult) yield chunk as ChatChunk;
        return;
      }
    }

    const { systemPrompt, conversationMessages } = extractSystemPrompt(request.messages);
    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: contentToString(msg.content),
    }));

    const payload: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: request.maxTokens || 4096,
      stream: true,
    };
    if (systemPrompt) payload.system = systemPrompt;

    const endpoint = `${baseURL.replace(/\/+$/, '')}/messages`;
    const response = await safeFetch(endpoint, {
      method: 'POST',
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 60000,
      provider: this.id,
    });

    if (!response.body) throw new Error('Missing response body for stream');

    for await (const rawData of parseSseStream(response.body, options?.signal)) {
      const event = safeJsonParse<any>(rawData);
      if (!event) continue;

      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        yield {
          id: `anthropic-chunk-${Date.now()}`,
          model,
          provider: 'anthropic',
          deltaText: event.delta.text,
          raw: event,
        };
      } else if (event.type === 'message_stop') {
        yield {
          id: `anthropic-stop-${Date.now()}`,
          model,
          provider: 'anthropic',
          deltaText: '',
          finishReason: { reason: 'stop' },
          raw: event,
        };
      }
    }
  }
}
