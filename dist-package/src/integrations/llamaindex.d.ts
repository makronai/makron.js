/**
 * @license MIT
 * Makron.js LlamaIndex Adapter Bridge
 */
import { MakronClient } from '../core/client';
export declare class MakronLlamaIndexLLM {
    readonly client: MakronClient;
    constructor(client: MakronClient);
    complete(prompt: string): Promise<{
        text: string;
    }>;
    streamComplete(prompt: string): AsyncIterable<{
        text: string;
        delta: string;
    }>;
}
