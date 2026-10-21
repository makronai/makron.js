/**
 * @license MIT
 * Makron.js LangChain Bridge
 * Wraps MakronClient to conform to LangChain BaseChatModel interfaces
 */
import { MakronClient } from '../core/client';
import { Message } from '../core/types';
export interface LangChainMessage {
    _getType(): 'human' | 'ai' | 'system' | 'generic';
    text?: string;
    content: string | any[];
}
export declare class MakronLangChainChatModel {
    readonly client: MakronClient;
    readonly modelName: string;
    constructor(client: MakronClient);
    invoke(input: string | LangChainMessage[] | Message[]): Promise<{
        content: string;
        response_metadata: Record<string, unknown>;
    }>;
}
