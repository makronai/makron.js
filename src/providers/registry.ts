/**
 * @license MIT
 * Makron.js Provider Registry
 */

import { AdapterNotFoundError } from '../core/errors';
import {
  ProviderAdapter,
  ProviderConfig,
  ProviderDefinition,
} from '../core/types';
import { AnthropicAdapter } from './anthropic';
import { CohereAdapter } from './cohere';
import { DeepSeekAdapter } from './deepseek';
import { GeminiAdapter } from './gemini';
import { GroqAdapter } from './groq';
import { HuggingFaceAdapter } from './huggingface';
import { MistralAdapter } from './mistral';
import { OllamaAdapter } from './ollama';
import { OpenAIAdapter } from './openai';
import { OpenAICompatibleAdapter } from './openai-compatible';
import { QwenAdapter } from './qwen';
import { VLLMAdapter } from './vllm';
import { XAIAdapter } from './xai';
import { ZaiAdapter } from './zai';

export type ProviderFactory = (config: ProviderConfig) => ProviderAdapter;

export class ProviderRegistry {
  private factories: Map<string, ProviderFactory> = new Map();
  private metadata: Map<string, { id: string; name: string; description?: string }> = new Map();

  constructor() {
    this.registerBuiltInProviders();
  }

  private registerBuiltInProviders() {
    this.register('openai', (cfg) => new OpenAIAdapter(cfg), 'OpenAI');
    this.register('openai-compatible', (cfg) => new OpenAICompatibleAdapter(cfg), 'OpenAI Compatible Endpoint');
    this.register('anthropic', (cfg) => new AnthropicAdapter(cfg), 'Anthropic Claude');
    this.register('gemini', (cfg) => new GeminiAdapter(cfg), 'Google Gemini');
    this.register('groq', (cfg) => new GroqAdapter(cfg), 'Groq LPU');
    this.register('deepseek', (cfg) => new DeepSeekAdapter(cfg), 'DeepSeek');
    this.register('xai', (cfg) => new XAIAdapter(cfg), 'xAI Grok');
    this.register('qwen', (cfg) => new QwenAdapter(cfg), 'Alibaba Cloud Qwen');
    this.register('zai', (cfg) => new ZaiAdapter(cfg), 'Z.ai GLM');
    this.register('ollama', (cfg) => new OllamaAdapter(cfg), 'Ollama Local');
    this.register('vllm', (cfg) => new VLLMAdapter(cfg), 'vLLM Serving Engine');
    this.register('huggingface', (cfg) => new HuggingFaceAdapter(cfg), 'Hugging Face Inference');
    this.register('mistral', (cfg) => new MistralAdapter(cfg), 'Mistral AI');
    this.register('cohere', (cfg) => new CohereAdapter(cfg), 'Cohere');
  }

  register(
    id: string,
    factory: ProviderFactory,
    name: string = id,
    description?: string
  ): void {
    const normalizedId = id.toLowerCase();
    this.factories.set(normalizedId, factory);
    this.metadata.set(normalizedId, { id: normalizedId, name, description });
  }

  registerDefinition(definition: ProviderDefinition): void {
    this.register(definition.id, definition.create, definition.name);
  }

  create(id: string, config: ProviderConfig = {}): ProviderAdapter {
    const normalizedId = id.toLowerCase();
    const factory = this.factories.get(normalizedId);
    if (!factory) {
      throw new AdapterNotFoundError(id);
    }
    return factory(config);
  }

  has(id: string): boolean {
    return this.factories.has(id.toLowerCase());
  }

  listProviders(): Array<{ id: string; name: string; description?: string }> {
    return Array.from(this.metadata.values());
  }

  remove(id: string): boolean {
    const normalizedId = id.toLowerCase();
    this.metadata.delete(normalizedId);
    return this.factories.delete(normalizedId);
  }
}

export const defaultProviderRegistry = new ProviderRegistry();

export function defineProvider(definition: ProviderDefinition): ProviderDefinition {
  defaultProviderRegistry.registerDefinition(definition);
  return definition;
}

export function registerProvider(
  id: string,
  factory: ProviderFactory,
  name?: string
): void {
  defaultProviderRegistry.register(id, factory, name);
}

export function getProvider(id: string, config?: ProviderConfig): ProviderAdapter {
  return defaultProviderRegistry.create(id, config);
}

export function listProviders(): Array<{ id: string; name: string }> {
  return defaultProviderRegistry.listProviders();
}
