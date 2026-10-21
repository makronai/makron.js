/**
 * @license MIT
 * Makron.js WebLLM Browser Adapter
 * Source: https://github.com/mlc-ai/web-llm
 */
import { ChatChunk, ChatRequest, ChatResponse, ProviderAdapter, RequestOptions } from '../core/types';
export interface WebLLMConfig {
    defaultModel?: string;
    initProgressCallback?: (report: {
        progress: number;
        text: string;
        timeElapsed: number;
    }) => void;
    webLLMModule?: any;
}
export declare class WebLLMAdapter implements ProviderAdapter {
    readonly id = "webllm";
    readonly name = "WebLLM (MLC WebGPU Engine)";
    private config;
    private engineInstance;
    private loadedModelId;
    constructor(config?: WebLLMConfig);
    private getEngine;
    chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
    stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
    unload(): Promise<void>;
}
