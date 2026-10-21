/**
 * @license MIT
 * Makron.js Vercel AI SDK Bridge
 */

import { MakronClient } from '../core/client';
import { ChatChunk } from '../core/types';

/**
 * Converts a Makron stream to a ReadableStream compatible with Vercel AI SDK text streams
 */
export function toTextStream(stream: AsyncIterable<ChatChunk>): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.deltaText) {
            controller.enqueue(chunk.deltaText);
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
