/**
 * @license MIT
 * Makron.js LangGraph Agent Node Bridge
 */
import { MakronClient } from '../core/client';
import { Message } from '../core/types';
export interface LangGraphAgentState {
    messages: Message[];
    [key: string]: any;
}
export declare function createMakronNode(client: MakronClient): (state: LangGraphAgentState) => Promise<Partial<LangGraphAgentState>>;
