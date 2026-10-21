/**
 * @license MIT
 * Makron.js Model Capability Engine
 */

import { ModelCapabilities, ModelInfo } from './types';
import { UnsupportedCapabilityError } from './errors';

export const CAPABILITY_LIST: Array<keyof ModelCapabilities> = [
  'chat',
  'streaming',
  'tools',
  'structuredOutput',
  'vision',
  'audioInput',
  'audioOutput',
  'embeddings',
  'reranking',
  'reasoning',
  'webSearch',
];

/**
 * Checks whether a given model or capabilities object supports a specific capability.
 */
export function supportsCapability(
  target: ModelInfo | ModelCapabilities | undefined,
  capability: keyof ModelCapabilities
): boolean {
  if (!target) return false;
  const caps = 'capabilities' in target ? target.capabilities : target;
  return Boolean(caps && caps[capability]);
}

/**
 * Asserts that a model supports a capability, throwing an explicit UnsupportedCapabilityError otherwise.
 */
export function assertCapability(
  target: ModelInfo | ModelCapabilities | undefined,
  capability: keyof ModelCapabilities,
  providerOrModelName: string = 'model'
): void {
  if (!supportsCapability(target, capability)) {
    throw new UnsupportedCapabilityError(capability, providerOrModelName);
  }
}

/**
 * Creates a capabilities object with safe defaults
 */
export function createCapabilities(caps: Partial<ModelCapabilities> = {}): ModelCapabilities {
  return {
    chat: caps.chat ?? true,
    streaming: caps.streaming ?? true,
    tools: caps.tools ?? false,
    structuredOutput: caps.structuredOutput ?? false,
    vision: caps.vision ?? false,
    audioInput: caps.audioInput ?? false,
    audioOutput: caps.audioOutput ?? false,
    embeddings: caps.embeddings ?? false,
    reranking: caps.reranking ?? false,
    reasoning: caps.reasoning ?? false,
    webSearch: caps.webSearch ?? false,
  };
}
