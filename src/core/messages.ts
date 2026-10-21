/**
 * @license MIT
 * Makron.js Message Normalization Engine
 */

import { ContentPart, Message, MessageContent } from './types';

export function contentToString(content: MessageContent): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((part): part is ContentPart & { text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }
  return '';
}

export function hasVisionContent(content: MessageContent): boolean {
  if (typeof content === 'string') return false;
  if (Array.isArray(content)) {
    return content.some((part) => part.type === 'image');
  }
  return false;
}

export function hasAudioContent(content: MessageContent): boolean {
  if (typeof content === 'string') return false;
  if (Array.isArray(content)) {
    return content.some((part) => part.type === 'audio');
  }
  return false;
}

export function normalizeMessages(messages: (Message | { role: string; content: any })[]): Message[] {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  return messages.map((msg) => {
    const role = (msg.role || 'user').toLowerCase() as Message['role'];
    let content = msg.content;

    if (content === null || content === undefined) {
      content = '';
    }

    return {
      role,
      content,
      name: (msg as any).name,
      toolCalls: (msg as any).toolCalls || (msg as any).tool_calls,
      toolCallId: (msg as any).toolCallId || (msg as any).tool_call_id,
    };
  });
}

/**
 * Splits system messages from the remaining conversation for providers
 * like Anthropic or Gemini that require a distinct system prompt field.
 */
export function extractSystemPrompt(messages: Message[]): {
  systemPrompt: string | undefined;
  conversationMessages: Message[];
} {
  const systemTexts: string[] = [];
  const conversationMessages: Message[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemTexts.push(contentToString(msg.content));
    } else {
      conversationMessages.push(msg);
    }
  }

  return {
    systemPrompt: systemTexts.length > 0 ? systemTexts.join('\n\n') : undefined,
    conversationMessages,
  };
}
