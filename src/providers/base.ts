/**
 * @license MIT
 * Makron.js Base Provider Adapter
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelInfo,
  ProviderAdapter,
  ProviderConfig,
  RequestOptions,
  RerankRequest,
  RerankResponse,
} from '../core/types';
import { UnsupportedCapabilityError } from '../core/errors';
import { defaultModelRegistry } from '../models/registry';

export abstract class BaseProviderAdapter implements ProviderAdapter {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public readonly defaultBaseURL?: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = config;
  }

  abstract chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    throw new UnsupportedCapabilityError('streaming', this.name);
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    throw new UnsupportedCapabilityError('embeddings', this.name);
  }

  async rerank(request: RerankRequest, options?: RequestOptions): Promise<RerankResponse> {
    throw new UnsupportedCapabilityError('reranking', this.name);
  }

  async listModels(options?: RequestOptions): Promise<ModelInfo[]> {
    return defaultModelRegistry.listModels({ provider: this.id });
  }

  async getModelInfo(modelId: string, options?: RequestOptions): Promise<ModelInfo | undefined> {
    return defaultModelRegistry.getModelInfo(modelId, this.id);
  }
}
