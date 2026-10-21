/**
 * @license MIT
 * Makron.js Hugging Face Inference Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class HuggingFaceAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || getEnv('HF_TOKEN') || getEnv('HUGGINGFACE_API_KEY');
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || 'deepseek-ai/DeepSeek-V4.1-Flash-1017',
      },
      'huggingface',
      'Hugging Face Inference',
      'https://router.huggingface.co/hf-inference/v1'
    );
  }
}
