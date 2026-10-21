/**
 * @license MIT
 * Makron.js xAI Grok Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class XAIAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('XAI_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'grok-4.7',
      },
      'xai',
      'xAI Grok',
      'https://api.x.ai/v1'
    );
  }
}
