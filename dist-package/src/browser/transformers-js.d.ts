/**
 * @license MIT
 * Makron.js Transformers.js Browser Adapter
 * Source: https://huggingface.co/docs/transformers.js
 */
import { ChatChunk, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, ProviderAdapter, RequestOptions } from '../core/types';
export interface TransformersJsConfig {
    defaultModel?: string;
    device?: 'webgpu' | 'wasm' | 'cpu';
    dtype?: 'q4' | 'q8' | 'fp16' | 'fp32';
    progressCallback?: (progress: {
        status: string;
        progress?: number;
        file?: string;
    }) => void;
    transformersModule?: any;
}
export declare class TransformersJsAdapter implements ProviderAdapter {
    readonly id = "transformers-js";
    readonly name = "Transformers.js Browser Engine";
    private config;
    private pipelineInstance;
    private loadedModelId;
    constructor(config?: TransformersJsConfig);
    private loadPipeline;
    chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
    stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
    embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse>;
    dispose(): Promise<void>;
}
