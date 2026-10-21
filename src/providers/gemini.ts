/**
 * @license MIT
 * Makron.js Google Gemini Provider Adapter
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
import { validateChatRequest } from '../core/validation';
import { getEnv } from '../utils/env';
import { safeFetch } from '../utils/fetch';
import { safeJsonStringify } from '../utils/json';
import { contentToString, extractSystemPrompt } from '../core/messages';
import { normalizeGeminiResponse } from '../core/response-normalizer';

export class GeminiAdapter extends BaseProviderAdapter {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini';
  public readonly defaultBaseURL = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('GEMINI_API_KEY');
    super({
      ...config,
      apiKey,
      defaultModel: config.defaultModel || 'gemini-3.8-flash',
    });
  }

  protected getApiKey(options?: RequestOptions): string | undefined {
    return options?.apiKey || this.config.apiKey;
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || 'gemini-3.8-flash';
    const apiKey = this.getApiKey(options);
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;

    // Mock transport support
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return normalizeGeminiResponse(mockResult, model, 25);
    }

    const { systemPrompt, conversationMessages } = extractSystemPrompt(request.messages);

    const contents = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: contentToString(msg.content) }],
    }));

    const payload: Record<string, unknown> = {
      contents,
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const genConfig: Record<string, unknown> = {};
    if (request.temperature !== undefined) genConfig.temperature = request.temperature;
    if (request.topP !== undefined) genConfig.topP = request.topP;
    if (request.maxTokens !== undefined) genConfig.maxOutputTokens = request.maxTokens;
    if (request.stop) genConfig.stopSequences = Array.isArray(request.stop) ? request.stop : [request.stop];

    if (Object.keys(genConfig).length > 0) {
      payload.generationConfig = genConfig;
    }

    if (request.tools && request.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
          })),
        },
      ];
    }

    const url = new URL(`${baseURL.replace(/\/+$/, '')}/models/${model}:generateContent`);
    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const startTime = Date.now();
    const response = await safeFetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 60000,
      provider: this.id,
    });

    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    return normalizeGeminiResponse(raw, model, latencyMs);
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    // Gemini streaming can fallback to single-chunk or generateContentStream SSE
    const full = await this.chat(request, options);
    yield {
      id: full.id,
      model: full.model,
      provider: 'gemini',
      deltaText: full.text,
      finishReason: full.finishReason,
      usage: full.usage,
      raw: full.raw,
    };
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    const model = request.model || 'gemini-embedding-001';
    const apiKey = this.getApiKey(options);
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;

    const textToEmbed = Array.isArray(request.input) ? request.input[0] : request.input;
    const payload = {
      model: `models/${model}`,
      content: {
        parts: [{ text: textToEmbed }],
      },
    };

    const url = new URL(`${baseURL.replace(/\/+$/, '')}/models/${model}:embedContent`);
    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const startTime = Date.now();
    const response = await safeFetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options?.headers,
      },
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 30000,
      provider: this.id,
    });

    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const values = raw.embedding?.values || [];

    return {
      model,
      provider: 'gemini',
      embeddings: [
        {
          index: 0,
          vector: values,
        },
      ],
      latencyMs,
      raw,
    };
  }
}
