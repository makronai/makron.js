/**
 * @license MIT
 * Makron.js Consolidated Model Catalog
 */

import { ModelInfo } from '../../core/types';
import { OPENAI_MODELS } from './openai';
import { GEMINI_MODELS } from './gemini';
import { ANTHROPIC_MODELS } from './anthropic';
import { XAI_MODELS } from './xai';
import { GROQ_MODELS } from './groq';
import { DEEPSEEK_MODELS } from './deepseek';
import { QWEN_MODELS } from './qwen';
import { ZAI_MODELS } from './zai';
import { HUGGINGFACE_MODELS } from './huggingface';
import { OLLAMA_MODELS } from './ollama';
import { TRANSFORMERS_JS_MODELS } from './transformers-js';
import { WEBLLM_MODELS } from './webllm';
import { MISTRAL_MODELS } from './mistral';
import { COHERE_MODELS } from './cohere';

export {
  OPENAI_MODELS,
  GEMINI_MODELS,
  ANTHROPIC_MODELS,
  XAI_MODELS,
  GROQ_MODELS,
  DEEPSEEK_MODELS,
  QWEN_MODELS,
  ZAI_MODELS,
  HUGGINGFACE_MODELS,
  OLLAMA_MODELS,
  TRANSFORMERS_JS_MODELS,
  WEBLLM_MODELS,
  MISTRAL_MODELS,
  COHERE_MODELS,
};

export const BUNDLED_MODEL_CATALOG: ModelInfo[] = [
  ...OPENAI_MODELS,
  ...GEMINI_MODELS,
  ...ANTHROPIC_MODELS,
  ...XAI_MODELS,
  ...GROQ_MODELS,
  ...DEEPSEEK_MODELS,
  ...QWEN_MODELS,
  ...ZAI_MODELS,
  ...HUGGINGFACE_MODELS,
  ...OLLAMA_MODELS,
  ...TRANSFORMERS_JS_MODELS,
  ...WEBLLM_MODELS,
  ...MISTRAL_MODELS,
  ...COHERE_MODELS,
];
