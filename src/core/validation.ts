/**
 * @license MIT
 * Makron.js Request & Configuration Validation
 */

import { ConfigurationError } from './errors';
import { ChatRequest, Message } from './types';

export function validateChatRequest(request: ChatRequest): void {
  if (!request) {
    throw new ConfigurationError('Chat request is required');
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new ConfigurationError('Chat request must contain at least one message in messages array');
  }

  for (let i = 0; i < request.messages.length; i++) {
    const msg = request.messages[i];
    validateMessage(msg, i);
  }

  if (request.temperature !== undefined) {
    if (typeof request.temperature !== 'number' || request.temperature < 0 || request.temperature > 2) {
      throw new ConfigurationError(`Invalid temperature: ${request.temperature}. Must be between 0 and 2.`);
    }
  }

  if (request.maxTokens !== undefined) {
    if (typeof request.maxTokens !== 'number' || request.maxTokens <= 0) {
      throw new ConfigurationError(`Invalid maxTokens: ${request.maxTokens}. Must be a positive integer.`);
    }
  }
}

export function validateMessage(message: Message, index?: number): void {
  const prefix = index !== undefined ? `Message at index ${index}` : 'Message';
  if (!message || typeof message !== 'object') {
    throw new ConfigurationError(`${prefix} must be an object`);
  }

  const validRoles = ['system', 'user', 'assistant', 'tool'];
  if (!validRoles.includes(message.role)) {
    throw new ConfigurationError(
      `${prefix} has invalid role '${message.role}'. Allowed roles: ${validRoles.join(', ')}`
    );
  }

  if (message.content === undefined || message.content === null) {
    throw new ConfigurationError(`${prefix} must have a content property`);
  }
}

export function validateBaseURL(url: string, providerName: string = 'provider'): string {
  if (!url || typeof url !== 'string') {
    throw new ConfigurationError(`Invalid baseURL for ${providerName}: must be a non-empty string`);
  }

  const trimmed = url.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ConfigurationError(`baseURL for ${providerName} must use http or https protocol`);
    }
    return trimmed;
  } catch (err: any) {
    throw new ConfigurationError(`Malformed baseURL '${trimmed}' for ${providerName}: ${err.message}`);
  }
}
