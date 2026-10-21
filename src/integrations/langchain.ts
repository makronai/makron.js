/**
 * @license MIT
 * Makron.js LangChain Bridge
 * Wraps MakronClient to conform to LangChain BaseChatModel interfaces
 */

import { MakronClient } from '../core/client';
import { ChatResponse, Message } from '../core/types';

export interface LangChainMessage {
  _getType(): 'human' | 'ai' | 'system' | 'generic';
  text?: string;
  content: string | any[];
}

export class MakronLangChainChatModel {
  public readonly client: MakronClient;
  public readonly modelName: string;

  constructor(client: MakronClient) {
    this.client = client;
    this.modelName = client.model || 'gpt-5-mini';
  }

  async invoke(input: string | LangChainMessage[] | Message[]): Promise<{
    content: string;
    response_metadata: Record<string, unknown>;
  }> {
    let messages: Message[];

    if (typeof input === 'string') {
      messages = [{ role: 'user', content: input }];
    } else {
      messages = input.map((m: any) => {
        if (m._getType) {
          const type = m._getType();
          const role = (type === 'human' ? 'user' : type === 'ai' ? 'assistant' : type === 'system' ? 'system' : 'user') as Message['role'];
          return { role, content: m.content || m.text || '' };
        }
        return m as Message;
      });
    }

    const res: ChatResponse = await this.client.chat({ messages });

    return {
      content: res.text,
      response_metadata: {
        id: res.id,
        model: res.model,
        provider: res.provider,
        usage: res.usage,
        finish_reason: res.finishReason.reason,
      },
    };
  }
}
