/**
 * @license MIT
 * Makron.js Conversation Memory Systems
 */
import { Message } from '../core/types';
export interface ConversationMemory {
    addMessage(message: Message): void;
    getMessages(): Message[];
    clear(): void;
}
export declare class BufferWindowMemory implements ConversationMemory {
    private messages;
    private windowSize;
    constructor(windowSize?: number);
    addMessage(message: Message): void;
    getMessages(): Message[];
    clear(): void;
}
