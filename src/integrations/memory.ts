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

export class BufferWindowMemory implements ConversationMemory {
  private messages: Message[] = [];
  private windowSize: number;

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    if (this.messages.length > this.windowSize) {
      this.messages.shift();
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }
}
