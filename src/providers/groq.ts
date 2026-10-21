/**
 * @license MIT
 * Makron.js Groq LPU Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class GroqAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('GROQ_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'openai/gpt-oss-120b',
      },
      'groq',
      'Groq LPU',
      'https://api.groq.com/openai/v1'
    );
  }
}
