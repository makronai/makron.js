/**
 * @license MIT
 * Makron.js Core Client
 */
import { ChatChunk, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, MakronConfig, ModelCapabilities, ModelInfo, ProviderAdapter, RequestOptions, RerankRequest, RerankResponse } from './types';
export declare class MakronClient {
    private adapter;
    private config;
    private defaultModel?;
    constructor(config: MakronConfig);
    get provider(): string;
    get model(): string | undefined;
    getProviderAdapter(): ProviderAdapter;
    chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
    stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
    embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse>;
    rerank(request: RerankRequest, options?: RequestOptions): Promise<RerankResponse>;
    listModels(options?: RequestOptions): Promise<ModelInfo[]>;
    getModelInfo(modelId?: string): Promise<ModelInfo | undefined>;
    getCapabilities(modelId?: string): Promise<ModelCapabilities | undefined>;
    supportsCapability(capability: keyof ModelCapabilities, modelId?: string): Promise<boolean>;
}
/**
 * Creates a configured Makron client
 */
export declare function createMakron(config: MakronConfig): MakronClient;
