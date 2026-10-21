/**
 * @license MIT
 * Makron.js Chat Capability Helpers
 */
import { ChatRequest, ChatResponse, Message } from '../core/types';
export declare function createSimpleChatRequest(prompt: string, model?: string): ChatRequest;
export declare function appendAssistantMessage(messages: Message[], response: ChatResponse): Message[];
