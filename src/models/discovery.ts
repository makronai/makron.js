/**
 * @license MIT
 * Makron.js Live Model Discovery
 */

import { safeFetch } from '../utils/fetch';
import { safeJsonParse } from '../utils/json';
import { ModelDiscoveryResult } from './types';

export interface DiscoverModelsOptions {
  provider: string;
  baseURL?: string;
  apiKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function discoverModels(options: DiscoverModelsOptions): Promise<ModelDiscoveryResult> {
  const { provider, baseURL, apiKey, signal, timeoutMs = 8000 } = options;

  if (provider === 'ollama') {
    return discoverOllamaModels(baseURL || 'http://localhost:11434', signal, timeoutMs);
  }

  // Generic OpenAI-compatible endpoint discovery (/models or /v1/models)
  const defaultBaseUrl = getProviderDefaultBaseUrl(provider) || baseURL;
  if (!defaultBaseUrl) {
    throw new Error(`Cannot discover models: unknown base URL for provider '${provider}'`);
  }

  const endpoint = defaultBaseUrl.endsWith('/v1')
    ? `${defaultBaseUrl}/models`
    : defaultBaseUrl.includes('/openai/v1')
    ? `${defaultBaseUrl}/models`
    : `${defaultBaseUrl}/v1/models`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await safeFetch(endpoint, {
    method: 'GET',
    headers,
    signal,
    timeoutMs,
    provider,
  });

  const text = await response.text();
  const data = safeJsonParse<any>(text);
  const rawList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const models = rawList.map((item: any) => ({
    id: typeof item === 'string' ? item : item.id,
    displayName: item.name || item.id,
    ownedBy: item.owned_by,
    created: item.created,
    contextWindow: item.context_window,
    raw: item,
  }));

  return {
    provider,
    models,
    fetchedAt: new Date().toISOString(),
    source: 'remote_api',
  };
}

async function discoverOllamaModels(
  baseURL: string,
  signal?: AbortSignal,
  timeoutMs: number = 8000
): Promise<ModelDiscoveryResult> {
  const endpoint = `${baseURL.replace(/\/+$/, '')}/api/tags`;

  const response = await safeFetch(endpoint, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal,
    timeoutMs,
    provider: 'ollama',
  });

  const text = await response.text();
  const data = safeJsonParse<any>(text);
  const rawModels = Array.isArray(data?.models) ? data.models : [];

  const models = rawModels.map((item: any) => ({
    id: item.name || item.model,
    displayName: `${item.name} (${item.details?.parameter_size || 'local'})`,
    ownedBy: 'ollama',
    raw: item,
  }));

  return {
    provider: 'ollama',
    models,
    fetchedAt: new Date().toISOString(),
    source: 'local_service',
  };
}

function getProviderDefaultBaseUrl(provider: string): string | undefined {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'groq':
      return 'https://api.groq.com/openai/v1';
    case 'deepseek':
      return 'https://api.deepseek.com/v1';
    case 'xai':
      return 'https://api.x.ai/v1';
    case 'ollama':
      return 'http://localhost:11434';
    case 'vllm':
      return 'http://localhost:8000/v1';
    default:
      return undefined;
  }
}
