/**
 * @license MIT
 * Makron.js Mistral AI Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class MistralAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('MISTRAL_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'mistral-large-2411',
      },
      'mistral',
      'Mistral AI',
      'https://api.mistral.ai/v1'
    );
  }
}
