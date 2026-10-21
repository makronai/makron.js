/**
 * @license MIT
 * Makron.js Model Aliases
 */

import { ModelAlias } from './types';

export const DEFAULT_MODEL_ALIASES: ModelAlias[] = [
  {
    alias: 'gpt-default',
    targetId: 'gpt-5-mini',
    provider: 'openai',
    description: 'Default fast OpenAI reasoning model',
  },
  {
    alias: 'claude-default',
    targetId: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    description: 'Default Anthropic model',
  },
  {
    alias: 'gemini-default',
    targetId: 'gemini-3.8-flash',
    provider: 'gemini',
    description: 'Default Google Gemini model',
  },
  {
    alias: 'grok-default',
    targetId: 'grok-4.7',
    provider: 'xai',
    description: 'Default xAI Grok model',
  },
  {
    alias: 'groq-fast',
    targetId: 'openai/gpt-oss-20b',
    provider: 'groq',
    description: 'Ultra-fast Groq LPU inference target',
  },
  {
    alias: 'deepseek-chat',
    targetId: 'deepseek-flash',
    provider: 'deepseek',
    description: 'Default DeepSeek chat endpoint',
  },
  {
    alias: 'qwen-default',
    targetId: 'qwen3.8-max',
    provider: 'qwen',
    description: 'Default Qwen flagship model',
  },
  {
    alias: 'ollama-default',
    targetId: 'gpt-oss:20b',
    provider: 'ollama',
    description: 'Default local Ollama model',
  },
  {
    alias: 'browser-default',
    targetId: 'onnx-community/SmolLM2-360M-Instruct',
    provider: 'transformers-js',
    description: 'Default lightweight browser model',
  },
];

export function resolveModelAlias(modelOrAlias: string, provider?: string): string {
  const match = DEFAULT_MODEL_ALIASES.find((item) => {
    if (provider && item.provider !== provider) return false;
    return item.alias === modelOrAlias;
  });
  return match ? match.targetId : modelOrAlias;
}
