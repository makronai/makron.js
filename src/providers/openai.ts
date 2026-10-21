/**
 * @license MIT
 * Makron.js OpenAI First-Party Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class OpenAIAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('OPENAI_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'gpt-5-mini',
      },
      'openai',
      'OpenAI',
      'https://api.openai.com/v1'
    );
  }
}
