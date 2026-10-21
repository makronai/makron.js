/**
 * @license MIT
 * Makron.js Ollama Local Endpoint Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class OllamaAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const baseURL = config.baseURL || getEnv('OLLAMA_BASE_URL') || 'http://localhost:11434/v1';
    super(
      {
        ...config,
        baseURL,
        defaultModel: config.defaultModel || 'gpt-oss:20b',
      },
      'ollama',
      'Ollama Local Endpoint',
      'http://localhost:11434/v1'
    );
  }
}
