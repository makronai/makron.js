/**
 * @license MIT
 * Makron.js Server-Sent Events & Stream Normalizer
 */
import { ChatChunk } from './types';
/**
 * Parses raw text chunks into SSE lines
 */
export declare function parseSseStream(stream: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncIterable<string>;
/**
 * Normalizes OpenAI-compatible streaming chunks
 */
export declare function normalizeOpenAIStream(stream: ReadableStream<Uint8Array>, providerName: string, modelName: string, signal?: AbortSignal): AsyncIterable<ChatChunk>;
