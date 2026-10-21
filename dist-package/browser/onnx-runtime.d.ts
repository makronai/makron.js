/**
 * @license MIT
 * Makron.js ONNX Runtime Web Adapter
 * Source: https://onnxruntime.ai/docs/get-started/with-javascript/web.html
 */
export interface OnnxRuntimeConfig {
    modelPathOrBuffer: string | ArrayBufferLike;
    executionProviders?: Array<'webgpu' | 'wasm' | 'webgl'>;
    graphOptimizationLevel?: 'disabled' | 'basic' | 'extended' | 'all';
    ortModule?: any;
}
export declare class OnnxRuntimeWebAdapter {
    readonly id = "onnx-runtime-web";
    readonly name = "ONNX Runtime Web Generic Engine";
    private config;
    private session;
    private ort;
    constructor(config: OnnxRuntimeConfig);
    private getOrt;
    createSession(): Promise<any>;
    run(feeds: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Note on Text Generation limitation as per Makron.js architecture:
     * Raw ONNX Runtime provides tensor computation, not an automatic text generation loop.
     * Full chat generation requires tokenizer embeddings and autoregressive sampling (use Transformers.js for complete chat).
     */
    chat(): Promise<never>;
    release(): Promise<void>;
}
