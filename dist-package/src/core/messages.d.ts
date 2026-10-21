/**
 * @license MIT
 * Makron.js Message Normalization Engine
 */
import { Message, MessageContent } from './types';
export declare function contentToString(content: MessageContent): string;
export declare function hasVisionContent(content: MessageContent): boolean;
export declare function hasAudioContent(content: MessageContent): boolean;
export declare function normalizeMessages(messages: (Message | {
    role: string;
    content: any;
})[]): Message[];
/**
 * Splits system messages from the remaining conversation for providers
 * like Anthropic or Gemini that require a distinct system prompt field.
 */
export declare function extractSystemPrompt(messages: Message[]): {
    systemPrompt: string | undefined;
    conversationMessages: Message[];
};
