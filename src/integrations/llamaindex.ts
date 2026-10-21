/**
 * @license MIT
 * Makron.js LlamaIndex Adapter Bridge
 */

import { MakronClient } from '../core/client';

export class MakronLlamaIndexLLM {
  public readonly client: MakronClient;

  constructor(client: MakronClient) {
    this.client = client;
  }

  async complete(prompt: string): Promise<{ text: string }> {
    const res = await this.client.chat({
      messages: [{ role: 'user', content: prompt }],
    });
    return { text: res.text };
  }

  async *streamComplete(prompt: string): AsyncIterable<{ text: string; delta: string }> {
    let accumulated = '';
    for await (const chunk of this.client.stream({
      messages: [{ role: 'user', content: prompt }],
    })) {
      accumulated += chunk.deltaText;
      yield {
        text: accumulated,
        delta: chunk.deltaText,
      };
    }
  }
}
