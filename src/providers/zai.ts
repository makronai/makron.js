/**
 * @license MIT
 * Makron.js Z.ai / GLM Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class ZaiAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('ZAI_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'glm-5.3',
      },
      'zai',
      'Z.ai GLM',
      'https://open.bigmodel.cn/api/paas/v4'
    );
  }
}
