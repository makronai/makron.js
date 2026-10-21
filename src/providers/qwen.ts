/**
 * @license MIT
 * Makron.js Alibaba Cloud Model Studio / Qwen Provider Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class QwenAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('QWEN_API_KEY') || getEnv('DASHSCOPE_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'qwen3.8-max',
      },
      'qwen',
      'Alibaba Cloud Qwen',
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
    );
  }
}
