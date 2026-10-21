/**
 * @license MIT
 * Makron.js Anthropic Claude Model Catalog
 * Source: https://docs.anthropic.com/en/docs/about-claude/models
 */

import { ModelInfo } from '../../core/types';

export const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-3-7-sonnet-20250219',
    provider: 'anthropic',
    displayName: 'Claude 3.7 Sonnet',
    description: 'Hybrid reasoning and standard model with dynamic thinking control and tool use.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      reasoning: true,
    },
    contextWindow: 200000,
    maxOutputTokens: 64000,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.anthropic.com/en/docs/about-claude/models',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet v2',
    description: 'High intelligence and industry-standard coding performance.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
    },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.anthropic.com/en/docs/about-claude/models',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Haiku',
    description: 'Fastest model for high-throughput lightweight tasks.',
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
    },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputModalities: ['text'],
    outputModalities: ['text'],
    lifecycle: 'stable',
    sourceURL: 'https://docs.anthropic.com/en/docs/about-claude/models',
    verifiedAt: '2026-10-21',
    availability: 'hosted',
  },
];
