/**
 * @license MIT
 * Makron.js Wllama (GGUF WASM / Worker) Browser Adapter
 * Source: https://github.com/ngxson/wllama
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

export interface WllamaConfig {
  modelUrl?: string;
  wllamaPath?: string; // Path to wllama.wasm / wllama.worker.js
  threads?: number;
  nContext?: number;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  wllamaModule?: any; // Direct module injection
}

export class WllamaAdapter implements ProviderAdapter {
  public readonly id = 'wllama';
  public readonly name = 'Wllama GGUF Engine';
  private config: WllamaConfig;
  private instance: any = null;

  constructor(config: WllamaConfig = {}) {
    this.config = config;
  }

  private async getInstance(): Promise<any> {
    assertBrowserEnvironment('Wllama');

    if (this.instance) return this.instance;

    const caps = await detectBrowserCapabilities();
    if (!caps.isCrossOriginIsolated) {
      console.warn(
        '[Makron:Wllama] Page is not crossOriginIsolated. Multi-threaded WASM execution requires headers:\n' +
        '  Cross-Origin-Opener-Policy: same-origin\n' +
        '  Cross-Origin-Embedder-Policy: require-corp\n' +
        'Wllama will fallback to single-threaded mode.'
      );
    }

    let WllamaClass: any;
    if (this.config.wllamaModule?.Wllama) {
      WllamaClass = this.config.wllamaModule.Wllama;
    } else {
      try {
        const mod = await import(/* @vite-ignore */ '@wllama/wllama');
        WllamaClass = mod.Wllama;
      } catch (err: any) {
        throw new IntegrationDependencyError(
          '@wllama/wllama',
          'Wllama browser GGUF WASM inference',
          { cause: err }
        );
      }
    }

    try {
      this.instance = new WllamaClass({
        'wllama.wasm': this.config.wllamaPath || '/wllama.wasm',
      });

      if (this.config.modelUrl) {
        await this.instance.loadModelFromUrl(this.config.modelUrl, {
          n_ctx: this.config.nContext || 2048,
          n_threads: this.config.threads || 4,
          progressCallback: this.config.onProgress,
        });
      }

      return this.instance;
    } catch (err: any) {
      throw new ModelLoadError(this.config.modelUrl || 'gguf-model', err.message || String(err), { cause: err });
    }
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    const wllama = await this.getInstance();
    const prompt = request.messages.map((m) => `${m.role}: ${contentToString(m.content)}`).join('\n') + '\nassistant:';

    const startTime = Date.now();
    const completion = await wllama.createCompletion(prompt, {
      nPredict: request.maxTokens || 256,
      sampling: {
        temp: request.temperature || 0.7,
        top_p: request.topP || 0.9,
      },
    });

    const latencyMs = Date.now() - startTime;
    const text = completion.trim();

    return {
      id: `wllama_${Date.now()}`,
      model: this.config.modelUrl || 'wllama-gguf',
      provider: this.id,
      text,
      message: { role: 'assistant', content: text },
      finishReason: { reason: 'stop' },
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      latencyMs,
      raw: completion,
    };
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    const wllama = await this.getInstance();
    const prompt = request.messages.map((m) => `${m.role}: ${contentToString(m.content)}`).join('\n') + '\nassistant:';

    let chunkIndex = 0;
    // Wllama completion with token callback
    const fullText = await wllama.createCompletion(prompt, {
      nPredict: request.maxTokens || 256,
      sampling: {
        temp: request.temperature || 0.7,
      },
      onNewToken: (token: number, piece: Uint8Array, currentText: string) => {
        // Can be intercepted if custom streaming hook is enabled
      },
    });

    yield {
      id: `wllama_chunk_${Date.now()}`,
      model: this.config.modelUrl || 'wllama-gguf',
      provider: this.id,
      deltaText: fullText,
      finishReason: { reason: 'stop' },
    };
  }

  async embed(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse> {
    const wllama = await this.getInstance();
    const text = Array.isArray(request.input) ? request.input[0] : request.input;

    const startTime = Date.now();
    const embedding = await wllama.createEmbedding(text);
    const latencyMs = Date.now() - startTime;

    return {
      model: this.config.modelUrl || 'wllama-gguf',
      provider: this.id,
      embeddings: [{ index: 0, vector: Array.from(embedding) }],
      latencyMs,
    };
  }

  async unload(): Promise<void> {
    if (this.instance?.exit) {
      await this.instance.exit();
    }
    this.instance = null;
  }
}
