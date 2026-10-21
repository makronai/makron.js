/**
 * @license MIT
 * Makron.js Mistral AI Model Catalog
 * Source: https://docs.mistral.ai/getting-started/models/
 */

import { ModelInfo } from '../../core/types';

export const MISTRAL_MODELS: ModelInfo[] = [
  {
    id: 'mistral-large-2411',
    provider: 'mistral',
    displayName: 'Mistral Large 2411',
    description: 'Flagship reasoning and multilingual model by Mistral AI.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.mistral.ai/getting-started/models/',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'codestral-2501',
    provider: 'mistral',
    displayName: 'Codestral 2501',
    description: 'Specialized generative AI model for code generation and completion.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
    },
    contextWindow: 256000,
    maxOutputTokens: 8192,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.mistral.ai/getting-started/models/',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'mistral-embed',
    provider: 'mistral',
    displayName: 'Mistral Embed',
    description: 'Embedding model for semantic search and retrieval.',
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true,
    },
    contextWindow: 8192,
    maxOutputTokens: 0,
    inputModalities: ['text'],
    outputModalities: ['embeddings'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.mistral.ai/getting-started/models/',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
];
