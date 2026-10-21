/**
 * @license MIT
 * Makron.js ONNX Runtime Web Adapter
 * Source: https://onnxruntime.ai/docs/get-started/with-javascript/web.html
 */

import { IntegrationDependencyError, UnsupportedCapabilityError } from '../core/errors';
import { assertBrowserEnvironment, detectBrowserCapabilities } from './browser-capabilities';

export interface OnnxRuntimeConfig {
  modelPathOrBuffer: string | ArrayBufferLike;
  executionProviders?: Array<'webgpu' | 'wasm' | 'webgl'>;
  graphOptimizationLevel?: 'disabled' | 'basic' | 'extended' | 'all';
  ortModule?: any; // Direct module injection
}

export class OnnxRuntimeWebAdapter {
  public readonly id = 'onnx-runtime-web';
  public readonly name = 'ONNX Runtime Web Generic Engine';
  private config: OnnxRuntimeConfig;
  private session: any = null;
  private ort: any = null;

  constructor(config: OnnxRuntimeConfig) {
    this.config = config;
  }

  private async getOrt(): Promise<any> {
    assertBrowserEnvironment('ONNX Runtime Web');

    if (this.ort) return this.ort;
    if (this.config.ortModule) {
      this.ort = this.config.ortModule;
      return this.ort;
    }

    try {
      this.ort = await import(/* @vite-ignore */ 'onnxruntime-web');
      return this.ort;
    } catch (err: any) {
      throw new IntegrationDependencyError(
        'onnxruntime-web',
        'ONNX Runtime Web generic inference',
        { cause: err }
      );
    }
  }

  async createSession(): Promise<any> {
    if (this.session) return this.session;

    const ort = await this.getOrt();
    const caps = await detectBrowserCapabilities();

    const executionProviders =
      this.config.executionProviders || (caps.hasWebGPU ? ['webgpu', 'wasm'] : ['wasm']);

    this.session = await ort.InferenceSession.create(this.config.modelPathOrBuffer, {
      executionProviders,
      graphOptimizationLevel: this.config.graphOptimizationLevel || 'all',
    });

    return this.session;
  }

  async run(feeds: Record<string, any>): Promise<Record<string, any>> {
    const session = await this.createSession();
    return await session.run(feeds);
  }

  /**
   * Note on Text Generation limitation as per Makron.js architecture:
   * Raw ONNX Runtime provides tensor computation, not an automatic text generation loop.
   * Full chat generation requires tokenizer embeddings and autoregressive sampling (use Transformers.js for complete chat).
   */
  async chat(): Promise<never> {
    throw new UnsupportedCapabilityError(
      'chat',
      'Raw ONNX Runtime Web does not provide built-in tokenizers or autoregressive decode loops. Use the Transformers.js adapter for full text generation, or use run() for tensor inference.'
    );
  }

  async release(): Promise<void> {
    if (this.session?.release) {
      await this.session.release();
    }
    this.session = null;
  }
}
