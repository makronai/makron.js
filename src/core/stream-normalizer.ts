/**
 * @license MIT
 * Makron.js Server-Sent Events & Stream Normalizer
 */

import { safeJsonParse } from '../utils/json';
import { ChatChunk } from './types';

/**
 * Parses raw text chunks into SSE lines
 */
export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) {
          continue; // Comment or empty heartbeat line
        }
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6).trim();
          if (data === '[DONE]') {
            return;
          }
          yield data;
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6).trim();
      if (data && data !== '[DONE]') {
        yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Normalizes OpenAI-compatible streaming chunks
 */
export async function* normalizeOpenAIStream(
  stream: ReadableStream<Uint8Array>,
  providerName: string,
  modelName: string,
  signal?: AbortSignal
): AsyncIterable<ChatChunk> {
  for await (const rawData of parseSseStream(stream, signal)) {
    const parsed = safeJsonParse<any>(rawData);
    if (!parsed) continue;

    const choice = parsed.choices?.[0];
    const delta = choice?.delta;
    const deltaText = delta?.content || '';
    const finishReasonStr = choice?.finish_reason;

    let finishReason: ChatChunk['finishReason'] = undefined;
    if (finishReasonStr) {
      finishReason = {
        reason:
          finishReasonStr === 'stop'
            ? 'stop'
            : finishReasonStr === 'length'
            ? 'length'
            : finishReasonStr === 'tool_calls'
            ? 'tool_calls'
            : 'other',
        raw: finishReasonStr,
      };
    }

    let deltaToolCalls: ChatChunk['deltaToolCalls'] = undefined;
    if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
      deltaToolCalls = delta.tool_calls.map((tc: any) => ({
        index: tc.index ?? 0,
        id: tc.id,
        name: tc.function?.name,
        argumentsDelta: tc.function?.arguments,
      }));
    }

    let usage: ChatChunk['usage'] = undefined;
    if (parsed.usage) {
      usage = {
        promptTokens: parsed.usage.prompt_tokens ?? 0,
        completionTokens: parsed.usage.completion_tokens ?? 0,
        totalTokens: parsed.usage.total_tokens ?? 0,
      };
    }

    yield {
      id: parsed.id || `chunk-${Date.now()}`,
      model: parsed.model || modelName,
      provider: providerName,
      deltaText,
      deltaToolCalls,
      finishReason,
      usage,
      raw: parsed,
    };
  }
}
