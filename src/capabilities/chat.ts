/**
 * @license MIT
 * Makron.js Chat Capability Helpers
 */

import { ChatRequest, ChatResponse, Message } from '../core/types';

export function createSimpleChatRequest(prompt: string, model?: string): ChatRequest {
  return {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };
}

export function appendAssistantMessage(messages: Message[], response: ChatResponse): Message[] {
  return [
    ...messages,
    {
      role: 'assistant',
      content: response.text,
      toolCalls: response.toolCalls,
    },
  ];
}
