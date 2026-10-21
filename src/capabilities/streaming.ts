/**
 * @license MIT
 * Makron.js Streaming Capability Utilities
 */

import { ChatChunk } from '../core/types';

export async function collectStreamText(stream: AsyncIterable<ChatChunk>): Promise<string> {
  let fullText = '';
  for await (const chunk of stream) {
    if (chunk.deltaText) {
      fullText += chunk.deltaText;
    }
  }
  return fullText;
}

export async function* transformStreamText(
  stream: AsyncIterable<ChatChunk>
): AsyncIterable<string> {
  for await (const chunk of stream) {
    if (chunk.deltaText) {
      yield chunk.deltaText;
    }
  }
}
