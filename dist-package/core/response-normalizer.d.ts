/**
 * @license MIT
 * Makron.js Universal Response Normalizer
 */
import { ChatResponse } from './types';
export declare function normalizeOpenAIResponse(raw: any, provider: string, model: string, latencyMs: number): ChatResponse;
export declare function normalizeAnthropicResponse(raw: any, model: string, latencyMs: number): ChatResponse;
export declare function normalizeGeminiResponse(raw: any, model: string, latencyMs: number): ChatResponse;
