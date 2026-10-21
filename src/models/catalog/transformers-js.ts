/**
 * @license MIT
 * Makron.js Transformers.js Browser Runtime Catalog
 * Source: https://huggingface.co/docs/transformers.js
 */

import { ModelInfo } from '../../core/types';

export const TRANSFORMERS_JS_MODELS: ModelInfo[] = [
  {
    id: 'onnx-community/Phi-3.5-mini-instruct',
    provider: 'transformers-js',
    displayName: 'Phi-3.5 Mini Instruct (ONNX Browser)',
    description: 'Runs directly in modern browsers via Transformers.js with WebGPU / WASM execution.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: false,
      structuredOutput: false,
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://huggingface.co/docs/transformers.js',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'onnx-community/Llama-3.2-1B-Instruct',
    provider: 'transformers-js',
    displayName: 'Llama 3.2 1B Instruct (ONNX Browser)',
    description: 'Compact 1B instruction-tuned model running fully client-side.',
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
    sourceURL: 'https://huggingface.co/docs/transformers.js',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'onnx-community/SmolLM2-1.7B-Instruct',
    provider: 'transformers-js',
    displayName: 'SmolLM2 1.7B Instruct (ONNX Browser)',
    description: 'Hugging Face SmolLM2 1.7B parameter browser-native model.',
    capabilities: {
      chat: true,
      streaming: true,
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://huggingface.co/docs/transformers.js',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'onnx-community/SmolLM2-360M-Instruct',
    provider: 'transformers-js',
    displayName: 'SmolLM2 360M Instruct (Lightweight Browser)',
    description: 'Ultra-small 360M parameter model for fast browser execution even on low-end hardware.',
    capabilities: {
      chat: true,
      streaming: true,
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://huggingface.co/docs/transformers.js',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
  {
    id: 'mixedbread-ai/mxbai-embed-xsmall-v1',
    provider: 'transformers-js',
    displayName: 'MixedBread Embed XSmall V1 (Browser Embedding)',
    description: 'Browser-executable embedding model for 100% client-side vector search and RAG.',
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true,
    },
    contextWindow: 512,
    maxOutputTokens: 0,
    inputModalities: ['text'],
    outputModalities: ['embeddings'],
    lifecycle: 'stable',
    sourceURL: 'https://huggingface.co/docs/transformers.js',
    verifiedAt: '2026-10-21',
    availability: 'browser',
  },
];
