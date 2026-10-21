/**
 * @license MIT
 * Makron.js Cohere Model Catalog
 * Source: https://docs.cohere.com/docs/models
 */

import { ModelInfo } from '../../core/types';

export const COHERE_MODELS: ModelInfo[] = [
  {
    id: 'command-r-plus-08-2024',
    provider: 'cohere',
    displayName: 'Command R+ (08-2024)',
    description: 'Enterprise grade model optimized for complex RAG workflows and multi-step tool use.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.cohere.com/docs/models',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'embed-multilingual-v3.0',
    provider: 'cohere',
    displayName: 'Cohere Embed Multilingual v3.0',
    description: 'Multilingual embedding model across 100+ languages.',
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
    sourceURL: 'https://docs.cohere.com/docs/models',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'rerank-v3.5',
    provider: 'cohere',
    displayName: 'Cohere Rerank v3.5',
    description: 'State-of-the-art semantic reranking model for RAG pipelines.',
    capabilities: {
      chat: false,
      streaming: false,
      reranking: true,
    },
    contextWindow: 4096,
    maxOutputTokens: 0,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.cohere.com/docs/models',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
];
