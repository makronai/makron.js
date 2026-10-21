/**
 * @license MIT
 * Makron.js Structured Output Helper
 */
import { StructuredOutputSchema } from '../core/types';
export declare function defineSchema(name: string, schema: Record<string, unknown>, description?: string, strict?: boolean): StructuredOutputSchema;
export declare function parseStructuredOutput<T = unknown>(text: string): T | undefined;
