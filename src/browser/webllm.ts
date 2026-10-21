/**
 * @license MIT
 * Makron.js WebLLM Browser Adapter
 * Source: https://github.com/mlc-ai/web-llm
 */

import {
  ChatChunk,
  ChatRequest,
  ChatResponse,
  ProviderAdapter,
  RequestOptions,
} from '../core/types';
import { IntegrationDependencyError, ModelLoadError, UnsupportedCapabilityError } from '../core/errors';
import { contentToString } from '../core/messages';
import { assertBrowserEnvironment, detectBrowserCapabilities } from './browser-capabilities';

export interface WebLLMConfig {
  defaultModel?: string;
  initProgressCallback?: (report: { progress: number; text: string; timeElapsed: number }) => void;
  webLLMModule?: any; // Direct module injection
}

export class WebLLMAdapter implements ProviderAdapter {
  public readonly id = 'webllm';
  public readonly name = 'WebLLM (MLC WebGPU Engine)';
  private config: WebLLMConfig;
  private engineInstance: any = null;
  private loadedModelId: string | null = null;

  constructor(config: WebLLMConfig = {}) {
    this.config = config;
  }

  private async getEngine(modelId: string): Promise<any> {
    assertBrowserEnvironment('WebLLM');

    const caps = await detectBrowserCapabilities();
    if (!caps.hasWebGPU) {
      throw new UnsupportedCapabilityError(
        'webgpu',
        'WebLLM requires a browser and GPU that supports WebGPU.'
      );
    }

    if (this.engineInstance && this.loadedModelId === modelId) {
      return this.engineInstance;
    }

    let createEngineFn: any;
    if (this.config.webLLMModule?.CreateMLCEngine) {
      createEngineFn = this.config.webLLMModule.CreateMLCEngine;
    } else {
      try {
        const mod = await import(/* @vite-ignore */ '@mlc-ai/web-llm');
        createEngineFn = mod.CreateMLCEngine;
      } catch (err: any) {
        throw new IntegrationDependencyError(
          '@mlc-ai/web-llm',
          'WebLLM browser WebGPU inference',
          { cause: err }
        );
      }
    }

    try {
      this.engineInstance = await createEngineFn(modelId, {
        initProgressCallback: this.config.initProgressCallback,
      });
      this.loadedModelId = modelId;
      return this.engineInstance;
    } catch (err: any) {
      throw new ModelLoadError(modelId, err.message || String(err), { cause: err });
    }
  }

  async chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    const model = request.model || this.config.defaultModel || 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
    const engine = await this.getEngine(model);

    const messages = request.messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content),
    }));

    const startTime = Date.now();
    const reply = await engine.chat.completions.create({
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false,
    });

    const latencyMs = Date.now() - startTime;
    const choice = reply.choices?.[0];
    const text = choice?.message?.content || '';

    return {
      id: reply.id || `webllm_${Date.now()}`,
      model,
      provider: this.id,
      text,
      message: { role: 'assistant', content: text },
      finishReason: { reason: 'stop', raw: choice?.finish_reason },
      usage: {
        promptTokens: reply.usage?.prompt_tokens ?? 0,
        completionTokens: reply.usage?.completion_tokens ?? 0,
        totalTokens: reply.usage?.total_tokens ?? 0,
      },
      latencyMs,
      raw: reply,
    };
  }

  async *stream(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk> {
    const model = request.model || this.config.defaultModel || 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
    const engine = await this.getEngine(model);

    const messages = request.messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content),
    }));

    const chunks = await engine.chat.completions.create({
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
    });

    for await (const chunk of chunks) {
      const deltaText = chunk.choices?.[0]?.delta?.content || '';
      yield {
        id: chunk.id || `webllm_chunk_${Date.now()}`,
        model,
        provider: this.id,
        deltaText,
        finishReason: chunk.choices?.[0]?.finish_reason
          ? { reason: 'stop', raw: chunk.choices[0].finish_reason }
          : undefined,
        raw: chunk,
      };
    }
  }

  async unload(): Promise<void> {
    if (this.engineInstance?.unload) {
      await this.engineInstance.unload();
    }
    this.engineInstance = null;
    this.loadedModelId = null;
  }
}
