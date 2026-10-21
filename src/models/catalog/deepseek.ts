/**
 * @license MIT
 * Makron.js DeepSeek Model Catalog
 * Note: Authoritative seed list strictly matching current official DeepSeek API endpoints.
 * Sources: https://api-docs.deepseek.com/api/list-models/, https://api-docs.deepseek.com/guides/search_fetch
 */

import { ModelInfo } from '../../core/types';

export const DEEPSEEK_MODELS: ModelInfo[] = [
  {
    id: 'deepseek-flash',
    provider: 'deepseek',
    displayName: 'DeepSeek Flash',
    description: 'High-speed reasoning and code completion model via official DeepSeek API.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true,
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://api-docs.deepseek.com/api/list-models/',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'deepseek-v4-pro',
    provider: 'deepseek',
    displayName: 'DeepSeek V4 Pro',
    description: 'Frontier reasoning and mathematics powerhouse with deep thought generation.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://api-docs.deepseek.com/api/list-models/',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
];
