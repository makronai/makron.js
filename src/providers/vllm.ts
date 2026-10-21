/**
 * @license MIT
 * Makron.js vLLM High-Throughput Serving Adapter
 */

import { ProviderConfig } from '../core/types';
import { getEnv } from '../utils/env';
import { OpenAICompatibleAdapter } from './openai-compatible';

export class VLLMAdapter extends OpenAICompatibleAdapter {
  constructor(config: ProviderConfig = {}) {
    const baseURL = config.baseURL || getEnv('VLLM_BASE_URL') || 'http://localhost:8000/v1';
    super(
      {
        ...config,
        baseURL,
        defaultModel: config.defaultModel || 'gpt-oss-120b',
      },
      'vllm',
      'vLLM Serving Engine',
      'http://localhost:8000/v1'
    );
  }
}
