/**
 * @license MIT
 * Makron.js WebLLM Prebuilt Catalog
 * Source: https://github.com/mlc-ai/web-llm
 */

import { ModelInfo } from '../../core/types';

export const WEBLLM_MODELS: ModelInfo[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    provider: 'webllm',
    displayName: 'Llama 3.2 1B Instruct (q4f32_1 MLC)',
    description: 'WebGPU-accelerated prebuilt MLC model for browser execution.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: false,
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://github.com/mlc-ai/web-llm',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    provider: 'webllm',
    displayName: 'Llama 3.2 1B Instruct (q4f16_1 MLC)',
    description: '16-bit float WebGPU optimized variant for supported GPUs.',
    capabilities: {
      chat: true,
      streaming: true,
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://github.com/mlc-ai/web-llm',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    provider: 'webllm',
    displayName: 'Llama 3.2 3B Instruct (q4f16_1 MLC)',
    description: 'Higher quality 3B model requiring WebGPU with at least 3GB VRAM buffer.',
    capabilities: {
      chat: true,
      streaming: true,
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://github.com/mlc-ai/web-llm',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    provider: 'webllm',
    displayName: 'SmolLM2 1.7B Instruct (q4f16_1 MLC)',
    description: 'Fast responsive browser model for chat assistants.',
    capabilities: {
      chat: true,
      streaming: true,
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://github.com/mlc-ai/web-llm',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'SmolLM2-360M-Instruct-q0f16-MLC',
    provider: 'webllm',
    displayName: 'SmolLM2 360M Instruct (q0f16 MLC)',
    description: 'Ultra-low footprint MLC model for quick browser initialization.',
    capabilities: {
      chat: true,
      streaming: true,
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://github.com/mlc-ai/web-llm',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
];
