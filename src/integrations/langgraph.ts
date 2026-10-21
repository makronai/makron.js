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

export function createMakronNode(client: MakronClient) {
  return async (state: LangGraphAgentState): Promise<Partial<LangGraphAgentState>> => {
    const res = await client.chat({
      messages: state.messages,
    });

    const newMessages: Message[] = [
      ...state.messages,
      {
        role: 'assistant',
        content: res.text,
        toolCalls: res.toolCalls,
      },
    ];

    return {
      messages: newMessages,
      lastResponse: res,
    };
  };
}
