/**
 * @license MIT
 * Makron.js Request & Configuration Validation
 */
import { ChatRequest, Message } from './types';
export declare function validateChatRequest(request: ChatRequest): void;
export declare function validateMessage(message: Message, index?: number): void;
export declare function validateBaseURL(url: string, providerName?: string): string;
