/**
 * @license MIT
 * Makron.js Stream Consumer & Token Buffer Component
 * Utilities for consuming, buffering, and typewriter-rendering token streams.
 */

import { ChatChunk } from '../core/types';

export interface StreamStats {
  text: string;
  totalChunks: number;
  timeToFirstTokenMs: number;
  totalDurationMs: number;
  tokensPerSecond: number;
}

/**
 * Collects an async iterable token stream while measuring real-time latency and throughput
 */
export async function collectStreamWithStats(
  stream: AsyncIterable<ChatChunk>,
  onChunk?: (chunk: ChatChunk) => void
): Promise<StreamStats> {
  const startTime = Date.now();
  let firstTokenTime = 0;
  let chunkCount = 0;
  let fullText = '';

  for await (const chunk of stream) {
    chunkCount++;
    if (chunkCount === 1) {
      firstTokenTime = Date.now() - startTime;
    }
    fullText += chunk.deltaText;
    onChunk?.(chunk);
  }

  const totalDurationMs = Math.max(1, Date.now() - startTime);
  const estimatedTokens = Math.ceil(fullText.length / 4);
  const tokensPerSecond = (estimatedTokens / (totalDurationMs / 1000));

  return {
    text: fullText,
    totalChunks: chunkCount,
    timeToFirstTokenMs: firstTokenTime,
    totalDurationMs,
    tokensPerSecond: Math.round(tokensPerSecond * 10) / 10,
  };
}

/**
 * StreamSentenceBuffer: Buffers incoming token chunks and emits complete sentences as they arrive
 */
export class StreamSentenceBuffer {
  private buffer = '';
  private onSentence: (sentence: string) => void;

  constructor(onSentence: (sentence: string) => void) {
    this.onSentence = onSentence;
  }

  public feed(chunk: string): void {
    this.buffer += chunk;
    const sentenceEndRegex = /([.!?]+[\s\n]+)/;

    let match = this.buffer.match(sentenceEndRegex);
    while (match && match.index !== undefined) {
      const splitIdx = match.index + match[0].length;
      const sentence = this.buffer.slice(0, splitIdx).trim();
      if (sentence) {
        this.onSentence(sentence);
      }
      this.buffer = this.buffer.slice(splitIdx);
      match = this.buffer.match(sentenceEndRegex);
    }
  }

  public flush(): void {
    if (this.buffer.trim()) {
      this.onSentence(this.buffer.trim());
      this.buffer = '';
    }
  }
}
