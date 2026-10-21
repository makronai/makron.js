/**
 * @license MIT
 * Makron.js Model Capability Engine
 */
import { ModelCapabilities, ModelInfo } from './types';
export declare const CAPABILITY_LIST: Array<keyof ModelCapabilities>;
/**
 * Checks whether a given model or capabilities object supports a specific capability.
 */
export declare function supportsCapability(target: ModelInfo | ModelCapabilities | undefined, capability: keyof ModelCapabilities): boolean;
/**
 * Asserts that a model supports a capability, throwing an explicit UnsupportedCapabilityError otherwise.
 */
export declare function assertCapability(target: ModelInfo | ModelCapabilities | undefined, capability: keyof ModelCapabilities, providerOrModelName?: string): void;
/**
 * Creates a capabilities object with safe defaults
 */
export declare function createCapabilities(caps?: Partial<ModelCapabilities>): ModelCapabilities;
