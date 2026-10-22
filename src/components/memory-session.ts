/**
 * @license MIT
 * Makron.js Stateful Conversation Session & Token Budget Memory
 * Plug-and-play chat session management with automated pruning.
 */

import { ChatChunk, ChatRequest, ChatResponse, Message, RequestOptions } from '../core/types';
import { ConversationMemory } from '../integrations/memory';
import { contentToString } from '../core/messages';

export interface SessionClient {
  chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
  stream?(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
}

export interface SessionConfig {
  client: SessionClient;
  systemPrompt?: string;
  memory?: ConversationMemory;
  maxTokensBudget?: number;
}

/**
 * Token budget memory: Prunes older user/assistant messages to stay within a token limit,
 * while always guaranteeing the system instruction remains intact.
 */
export class TokenBudgetMemory implements ConversationMemory {
  private messages: Message[] = [];
  private maxTokens: number;

  constructor(maxTokens: number = 4000) {
    this.maxTokens = maxTokens;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public addMessage(message: Message): void {
    this.messages.push(message);
    this.prune();
  }

  public getMessages(): Message[] {
    return [...this.messages];
  }

  public clear(): void {
    this.messages = [];
  }

  private prune(): void {
    let totalTokens = this.messages.reduce((sum, msg) => {
      return sum + this.estimateTokens(contentToString(msg.content));
    }, 0);

    // If budget exceeded, prune from oldest non-system message
    while (totalTokens > this.maxTokens && this.messages.length > 1) {
      // Find first non-system message index
      const pruneIndex = this.messages.findIndex((m) => m.role !== 'system');
      if (pruneIndex === -1) break;

      const removed = this.messages.splice(pruneIndex, 1)[0];
      totalTokens -= this.estimateTokens(contentToString(removed.content));
    }
  }
}

/**
 * ConversationSession: Plug-and-play multi-turn stateful chat manager
 */
export class ConversationSession {
  private client: SessionClient;
  private systemPrompt?: string;
  private memory: ConversationMemory;

  constructor(config: SessionConfig) {
    this.client = config.client;
    this.systemPrompt = config.systemPrompt;
    this.memory = config.memory || new TokenBudgetMemory(config.maxTokensBudget ?? 4000);

    if (this.systemPrompt) {
      this.memory.addMessage({ role: 'system', content: this.systemPrompt });
    }
  }

  /**
   * Send a user message and receive the model's response
   */
  public async sendMessage(input: string, options?: RequestOptions): Promise<ChatResponse> {
    const userMsg: Message = { role: 'user', content: input };
    this.memory.addMessage(userMsg);

    const history = this.memory.getMessages();
    const response = await this.client.chat({ messages: history }, options);

    const assistantMsg: Message = {
      role: 'assistant',
      content: response.text,
      toolCalls: response.toolCalls,
    };
    this.memory.addMessage(assistantMsg);

    return response;
  }

  /**
   * Stream a response to a user message, updating history upon completion
   */
  public async *streamMessage(input: string, options?: RequestOptions): AsyncIterable<ChatChunk> {
    const userMsg: Message = { role: 'user', content: input };
    this.memory.addMessage(userMsg);

    const history = this.memory.getMessages();
    let accumulatedText = '';

    if (this.client.stream) {
      for await (const chunk of this.client.stream({ messages: history }, options)) {
        accumulatedText += chunk.deltaText;
        yield chunk;
      }
    } else {
      const full = await this.client.chat({ messages: history }, options);
      accumulatedText = full.text;
      yield {
        id: full.id,
        model: full.model,
        provider: full.provider,
        deltaText: full.text,
        finishReason: full.finishReason,
        usage: full.usage,
      };
    }

    this.memory.addMessage({ role: 'assistant', content: accumulatedText });
  }

  public getHistory(): Message[] {
    return this.memory.getMessages();
  }

  public clear(): void {
    this.memory.clear();
    if (this.systemPrompt) {
      this.memory.addMessage({ role: 'system', content: this.systemPrompt });
    }
  }

  public setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    const current = this.memory.getMessages().filter((m) => m.role !== 'system');
    this.memory.clear();
    this.memory.addMessage({ role: 'system', content: prompt });
    for (const msg of current) {
      this.memory.addMessage(msg);
    }
  }

  public export(): string {
    return JSON.stringify(this.memory.getMessages(), null, 2);
  }

  public import(jsonString: string): void {
    const parsed = JSON.parse(jsonString) as Message[];
    this.memory.clear();
    for (const m of parsed) {
      this.memory.addMessage(m);
    }
  }
}

/**
 * Factory to create a stateful conversation session
 */
export function createSession(config: SessionConfig): ConversationSession {
  return new ConversationSession(config);
}
