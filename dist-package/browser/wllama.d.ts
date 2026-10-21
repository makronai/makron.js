/**
 * @license MIT
 * Makron.js Wllama (GGUF WASM / Worker) Browser Adapter
 * Source: https://github.com/ngxson/wllama
 */
import { ChatChunk, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, ProviderAdapter, RequestOptions } from '../core/types';
export interface WllamaConfig {
    modelUrl?: string;
    wllamaPath?: string;
    threads?: number;
    nContext?: number;
    onProgress?: (progress: {
        loaded: number;
        total: number;
    }) => void;
    wllamaModule?: any;
}
export declare class WllamaAdapter implements ProviderAdapter {
    readonly id = "wllama";
    readonly name = "Wllama GGUF Engine";
    private config;
    private instance;
    constructor(config?: WllamaConfig);
    private getInstance;
    chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
    stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
    embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse>;
    unload(): Promise<void>;
}
