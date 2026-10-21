/**
 * @license MIT
 * Makron.js Transformers.js Browser Adapter
 * Source: https://huggingface.co/docs/transformers.js
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderAdapter,
  RequestOptions,
} from '../core/types';
import { IntegrationDependencyError, ModelLoadError } from '../core/errors';
import { contentToString } from '../core/messages';
import { assertBrowserEnvironment, detectBrowserCapabilities } from './browser-capabilities';

export interface TransformersJsConfig {
  defaultModel?: string;
  device?: 'webgpu' | 'wasm' | 'cpu';
  dtype?: 'q4' | 'q8' | 'fp16' | 'fp32';
  progressCallback?: (progress: { status: string; progress?: number; file?: string }) => void;
  transformersModule?: any; // Allow injecting library directly
}

export class TransformersJsAdapter implements ProviderAdapter {
  public readonly id = 'transformers-js';
  public readonly name = 'Transformers.js Browser Engine';
  private config: TransformersJsConfig;
  private pipelineInstance: any = null;
  private loadedModelId: string | null = null;

  constructor(config: TransformersJsConfig = {}) {
    this.config = config;
  }

  private async loadPipeline(task: string, modelId: string): Promise<any> {
    assertBrowserEnvironment('Transformers.js');

    if (this.pipelineInstance && this.loadedModelId === modelId) {
      return this.pipelineInstance;
    }

    let pipelineFn: any;
    if (this.config.transformersModule?.pipeline) {
      pipelineFn = this.config.transformersModule.pipeline;
    } else {
      try {
        // Dynamic import to keep core lightweight and optional
        const mod = await import(/* @vite-ignore */ '@huggingface/transformers');
        pipelineFn = mod.pipeline;
      } catch (err: any) {
        throw new IntegrationDependencyError(
          '@huggingface/transformers',
          'Transformers.js browser inference',
          { cause: err }
        );
      }
    }

    const caps = await detectBrowserCapabilities();
    const device = this.config.device || (caps.hasWebGPU ? 'webgpu' : 'wasm');

    try {
      this.pipelineInstance = await pipelineFn(task, modelId, {
        device,
        dtype: this.config.dtype || 'q4',
        progress_callback: this.config.progressCallback,
      });
      this.loadedModelId = modelId;
      return this.pipelineInstance;
    } catch (err: any) {
      throw new ModelLoadError(modelId, err.message || String(err), { cause: err });
    }
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    const model = request.model || this.config.defaultModel || 'onnx-community/SmolLM2-360M-Instruct';
    const generator = await this.loadPipeline('text-generation', model);

    const messages = request.messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content),
    }));

    const startTime = Date.now();
    const output = await generator(messages, {
      max_new_tokens: request.maxTokens || 256,
      temperature: request.temperature || 0.7,
      top_p: request.topP || 0.9,
    });

    const latencyMs = Date.now() - startTime;
    const generatedText = output?.[0]?.generated_text;
    const lastMessage = Array.isArray(generatedText) ? generatedText[generatedText.length - 1]?.content : String(generatedText || '');

    return {
      id: `tfjs_${Date.now()}`,
      model,
      provider: this.id,
      text: lastMessage,
      message: { role: 'assistant', content: lastMessage },
      finishReason: { reason: 'stop' },
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      latencyMs,
      raw: output,
    };
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    // Single chunk fallback for browser generation when callback-based streamer is not attached
    const res = await this.chat(request, options);
    yield {
      id: res.id,
      model: res.model,
      provider: this.id,
      deltaText: res.text,
      finishReason: res.finishReason,
      usage: res.usage,
      raw: res.raw,
    };
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    const model = request.model || 'mixedbread-ai/mxbai-embed-xsmall-v1';
    const extractor = await this.loadPipeline('feature-extraction', model);

    const texts = Array.isArray(request.input) ? request.input : [request.input];
    const startTime = Date.now();

    const output = await extractor(texts, {
      pooling: 'mean',
      normalize: true,
    });

    const latencyMs = Date.now() - startTime;
    const vectors: number[][] = output.tolist ? output.tolist() : Array.from(output);

    return {
      model,
      provider: this.id,
      embeddings: vectors.map((vector, index) => ({ index, vector })),
      latencyMs,
      raw: output,
    };
  }

  async dispose(): Promise<void> {
    if (this.pipelineInstance?.dispose) {
      await this.pipelineInstance.dispose();
    }
    this.pipelineInstance = null;
    this.loadedModelId = null;
  }
}
