/**
 * @license MIT
 * Makron.js Core Client
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  MakronConfig,
  ModelCapabilities,
  ModelInfo,
  ProviderAdapter,
  RequestOptions,
  RerankRequest,
  RerankResponse,
} from './types';
import { defaultProviderRegistry } from '../providers/registry';
import { defaultModelRegistry } from '../models/registry';
import { mergeRequestOptions } from './request-options';
import { supportsCapability as checkCapability } from './capabilities';

export class MakronClient {
  private adapter: ProviderAdapter;
  private config: MakronConfig;
  private defaultModel?: string;

  constructor(config: MakronConfig) {
    this.config = config;
    this.defaultModel = config.model || config.defaultModel;

    if (typeof config.provider === 'string') {
      this.adapter = defaultProviderRegistry.create(config.provider, {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        organization: config.organization,
        project: config.project,
        headers: config.headers,
        defaultModel: this.defaultModel,
        timeoutMs: config.timeoutMs,
        retries: config.retries,
        custom: config.custom,
        mockTransport: config.mockTransport,
      });
    } else if (typeof config.provider === 'object') {
      if ('create' in config.provider) {
        // ProviderDefinition
        this.adapter = config.provider.create(config);
      } else {
        // Direct ProviderAdapter instance
        this.adapter = config.provider as ProviderAdapter;
      }
    } else {
      throw new Error(`Invalid provider configuration: ${String(config.provider)}`);
    }
  }

  get provider(): string {
    return this.adapter.id;
  }

  get model(): string | undefined {
    return this.defaultModel;
  }

  getProviderAdapter(): ProviderAdapter {
    return this.adapter;
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    const mergedRequest: ChatRequest = {
      ...request,
      model: request.model || this.defaultModel,
    };
    const mergedOptions = mergeRequestOptions(
      {
        timeoutMs: this.config.timeoutMs,
        retries: this.config.retries,
      },
      options
    );
    return await this.adapter.chat(mergedRequest, mergedOptions);
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    if (!this.adapter.stream) {
      // Fallback: execute regular chat and yield full response as single chunk
      const res = await this.chat(request, options);
      yield {
        id: res.id,
        model: res.model,
        provider: res.provider,
        deltaText: res.text,
        deltaToolCalls: res.toolCalls?.map((tc, index) => ({
          index,
          id: tc.id,
          name: tc.name,
          argumentsDelta: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
        })),
        finishReason: res.finishReason,
        usage: res.usage,
        raw: res.raw,
      };
      return;
    }

    const mergedRequest: ChatRequest = {
      ...request,
      model: request.model || this.defaultModel,
      stream: true,
    };
    const mergedOptions = mergeRequestOptions(
      {
        timeoutMs: this.config.timeoutMs,
        retries: this.config.retries,
      },
      options
    );

    yield* this.adapter.stream(mergedRequest, mergedOptions);
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    if (!this.adapter.embed) {
      throw new Error(`Provider '${this.adapter.id}' does not implement embedding`);
    }
    const mergedRequest: EmbeddingRequest = {
      ...request,
      model: request.model || this.defaultModel,
    };
    return await this.adapter.embed(mergedRequest, options);
  }

  async rerank(request: RerankRequest, options?: RequestOptions): Promise<RerankResponse> {
    if (!this.adapter.rerank) {
      throw new Error(`Provider '${this.adapter.id}' does not implement reranking`);
    }
    return await this.adapter.rerank(request, options);
  }

  async listModels(options?: RequestOptions): Promise<ModelInfo[]> {
    if (this.adapter.listModels) {
      return await this.adapter.listModels(options);
    }
    return defaultModelRegistry.listModels({ provider: this.adapter.id });
  }

  async getModelInfo(modelId?: string): Promise<ModelInfo | undefined> {
    const targetModel = modelId || this.defaultModel;
    if (!targetModel) return undefined;
    if (this.adapter.getModelInfo) {
      return await this.adapter.getModelInfo(targetModel);
    }
    return defaultModelRegistry.getModelInfo(targetModel, this.adapter.id);
  }

  async getCapabilities(modelId?: string): Promise<ModelCapabilities | undefined> {
    const info = await this.getModelInfo(modelId);
    return info?.capabilities;
  }

  async supportsCapability(capability: keyof ModelCapabilities, modelId?: string): Promise<boolean> {
    const caps = await this.getCapabilities(modelId);
    return checkCapability(caps, capability);
  }
}

/**
 * Creates a configured Makron client
 */
export function createMakron(config: MakronConfig): MakronClient {
  return new MakronClient(config);
}
