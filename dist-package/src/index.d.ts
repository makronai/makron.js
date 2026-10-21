/**
 * @license MIT
 * Makron.js - Unified AI Integration & Model Orchestration Engine
 * Root Library Entry Point
 */
export { createMakron, MakronClient } from './core/client';
export type { Role, TextPart, ImagePart, AudioPart, ContentPart, MessageContent, ToolCall, ToolResult, Message, ToolFunction, ToolDefinition, ToolChoice, StructuredOutputSchema, TokenUsage, FinishReason, RequestOptions, ChatRequest, ChatResponse, ChatChunk, EmbeddingRequest, EmbeddingVector, EmbeddingResponse, RerankDocument, RerankRequest, RerankResult, RerankResponse, ModelAvailability, ModelLifecycle, ModelCapabilities, ModelInfo, ProviderAdapter, ProviderDefinition, ProviderConfig, MakronConfig, } from './core/types';
export { MakronError, ConfigurationError, AuthenticationError, ProviderError, RateLimitError, RequestTimeoutError, RequestAbortedError, UnsupportedCapabilityError, ModelNotFoundError, AdapterNotFoundError, IntegrationDependencyError, ModelLoadError, } from './core/errors';
export { supportsCapability, assertCapability, createCapabilities, CAPABILITY_LIST, } from './core/capabilities';
export { normalizeMessages, contentToString, hasVisionContent, hasAudioContent, extractSystemPrompt, } from './core/messages';
export { defineProvider, registerProvider, getProvider, listProviders, defaultProviderRegistry, ProviderRegistry, } from './providers/registry';
export { listModels, getModelInfo, defaultModelRegistry, ModelRegistry, resolveModelAlias, discoverModels, BUNDLED_MODEL_CATALOG, } from './models';
export { defineTool, executeToolCalls, defineSchema, collectStreamText, transformStreamText, } from './capabilities';
export { cosineSimilarity, dotProduct, l2Normalize, findMostSimilar, } from './embeddings';
export { defaultIntegrationRegistry, IntegrationRegistry, INTEGRATION_CATALOG, convertMcpToolsToMakron, createMcpToolBridge, InMemoryVectorStore, } from './integrations';
export { VERSION, PACKAGE_NAME, DISPLAY_NAME } from './version';
