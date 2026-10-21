/**
 * @license MIT
 * Makron.js DeepSeek Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('DEEPSEEK_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'deepseek-flash',
      },
      'deepseek',
      'DeepSeek',
      'https://api.deepseek.com'
    );
  }
}
