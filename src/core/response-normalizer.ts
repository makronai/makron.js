/**
 * @license MIT
 * Makron.js Universal Response Normalizer
 */

import { ChatResponse, FinishReason, Message, TokenUsage, ToolCall } from './types';

export function normalizeOpenAIResponse(
  raw: any,
  provider: string,
  model: string,
  latencyMs: number
): ChatResponse {
  const choice = raw.choices?.[0] || {};
  const messageData = choice.message || {};
  const text = messageData.content || '';

  let toolCalls: ToolCall[] | undefined;
  if (Array.isArray(messageData.tool_calls) && messageData.tool_calls.length > 0) {
    toolCalls = messageData.tool_calls.map((tc: any) => ({
      id: tc.id || `call_${Math.random().toString(36).substring(2, 9)}`,
      name: tc.function?.name || '',
      arguments: tc.function?.arguments || '{}',
    }));
  }

  const finishReasonRaw = choice.finish_reason || 'stop';
  const finishReason: FinishReason = {
    reason:
      finishReasonRaw === 'stop'
        ? 'stop'
        : finishReasonRaw === 'length'
        ? 'length'
        : finishReasonRaw === 'tool_calls'
        ? 'tool_calls'
        : finishReasonRaw === 'content_filter'
        ? 'content_filter'
        : 'other',
    raw: finishReasonRaw,
  };

  const usage: TokenUsage = {
    promptTokens: raw.usage?.prompt_tokens ?? 0,
    completionTokens: raw.usage?.completion_tokens ?? 0,
    totalTokens: raw.usage?.total_tokens ?? (raw.usage?.prompt_tokens ?? 0) + (raw.usage?.completion_tokens ?? 0),
    reasoningTokens: raw.usage?.completion_tokens_details?.reasoning_tokens,
    cachedPromptTokens: raw.usage?.prompt_tokens_details?.cached_tokens,
  };

  const message: Message = {
    role: 'assistant',
    content: text,
    toolCalls,
  };

  return {
    id: raw.id || `resp_${Date.now()}`,
    model: raw.model || model,
    provider,
    text,
    message,
    toolCalls,
    finishReason,
    usage,
    latencyMs,
    raw,
  };
}

export function normalizeAnthropicResponse(
  raw: any,
  model: string,
  latencyMs: number
): ChatResponse {
  let text = '';
  const toolCalls: ToolCall[] = [];

  if (Array.isArray(raw.content)) {
    for (const block of raw.content) {
      if (block.type === 'text') {
        text += (text ? '\n' : '') + block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input || {},
        });
      }
    }
  }

  const stopReason = raw.stop_reason;
  const finishReason: FinishReason = {
    reason:
      stopReason === 'end_turn' || stopReason === 'stop_sequence'
        ? 'stop'
        : stopReason === 'max_tokens'
        ? 'length'
        : stopReason === 'tool_use'
        ? 'tool_calls'
        : 'other',
    raw: stopReason,
  };

  const usage: TokenUsage = {
    promptTokens: raw.usage?.input_tokens ?? 0,
    completionTokens: raw.usage?.output_tokens ?? 0,
    totalTokens: (raw.usage?.input_tokens ?? 0) + (raw.usage?.output_tokens ?? 0),
  };

  const message: Message = {
    role: 'assistant',
    content: text,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };

  return {
    id: raw.id || `anthropic_${Date.now()}`,
    model: raw.model || model,
    provider: 'anthropic',
    text,
    message,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    finishReason,
    usage,
    latencyMs,
    raw,
  };
}

export function normalizeGeminiResponse(
  raw: any,
  model: string,
  latencyMs: number
): ChatResponse {
  const candidate = raw.candidates?.[0];
  let text = '';
  const toolCalls: ToolCall[] = [];

  if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
    for (const part of candidate.content.parts) {
      if (part.text) {
        text += (text ? '\n' : '') + part.text;
      } else if (part.functionCall) {
        toolCalls.push({
          id: `call_${Math.random().toString(36).substring(2, 9)}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args || {},
        });
      }
    }
  }

  const finishReasonRaw = candidate?.finishReason || 'STOP';
  const finishReason: FinishReason = {
    reason:
      finishReasonRaw === 'STOP'
        ? 'stop'
        : finishReasonRaw === 'MAX_TOKENS'
        ? 'length'
        : finishReasonRaw === 'SAFETY'
        ? 'content_filter'
        : 'other',
    raw: finishReasonRaw,
  };

  const usage: TokenUsage = {
    promptTokens: raw.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: raw.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: raw.usageMetadata?.totalTokenCount ?? 0,
  };

  const message: Message = {
    role: 'assistant',
    content: text,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };

  return {
    id: `gemini_${Date.now()}`,
    model,
    provider: 'gemini',
    text,
    message,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    finishReason,
    usage,
    latencyMs,
    raw,
  };
}
