/**
 * @license MIT
 * Makron.js Streaming Capability Utilities
 */
import { ChatChunk } from '../core/types';
export declare function collectStreamText(stream: AsyncIterable<ChatChunk>): Promise<string>;
export declare function transformStreamText(stream: AsyncIterable<ChatChunk>): AsyncIterable<string>;
