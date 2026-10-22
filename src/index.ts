/**
 * @license MIT
 * Makron.js - Unified AI Integration & Model Orchestration Engine
 * Root Library Entry Point
 */

// Core Client and Factory
export { createMakron, MakronClient } from './core/client';

// Core Types
export type {
  Role,
  TextPart,
  ImagePart,
  AudioPart,
  ContentPart,
  MessageContent,
  ToolCall,
  ToolResult,
  Message,
  ToolFunction,
  ToolDefinition,
  ToolChoice,
  StructuredOutputSchema,
  TokenUsage,
  FinishReason,
  RequestOptions,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  EmbeddingRequest,
  EmbeddingVector,
  EmbeddingResponse,
  RerankDocument,
  RerankRequest,
  RerankResult,
  RerankResponse,
  ModelAvailability,
  ModelLifecycle,
  ModelCapabilities,
  ModelInfo,
  ProviderAdapter,
  ProviderDefinition,
  ProviderConfig,
  MakronConfig,
} from './core/types';

// Error Hierarchy
export {
  MakronError,
  ConfigurationError,
  AuthenticationError,
  ProviderError,
  RateLimitError,
  RequestTimeoutError,
  RequestAbortedError,
  UnsupportedCapabilityError,
  ModelNotFoundError,
  AdapterNotFoundError,
  IntegrationDependencyError,
  ModelLoadError,
} from './core/errors';

// Capabilities and Detection
export {
  supportsCapability,
  assertCapability,
  createCapabilities,
  CAPABILITY_LIST,
} from './core/capabilities';

// Message Helpers
export {
  normalizeMessages,
  contentToString,
  hasVisionContent,
  hasAudioContent,
  extractSystemPrompt,
} from './core/messages';

// Providers and Registry
export {
  defineProvider,
  registerProvider,
  getProvider,
  listProviders,
  defaultProviderRegistry,
  ProviderRegistry,
} from './providers/registry';

// Model Catalog and Registry
export {
  listModels,
  getModelInfo,
  defaultModelRegistry,
  ModelRegistry,
  resolveModelAlias,
  discoverModels,
  BUNDLED_MODEL_CATALOG,
} from './models';

// Capabilities & Execution Helpers
export {
  defineTool,
  executeToolCalls,
  defineSchema,
  collectStreamText,
  transformStreamText,
} from './capabilities';

// Embeddings & Math
export {
  cosineSimilarity,
  dotProduct,
  l2Normalize,
  findMostSimilar,
} from './embeddings';

// Integrations
export {
  defaultIntegrationRegistry,
  IntegrationRegistry,
  INTEGRATION_CATALOG,
  convertMcpToolsToMakron,
  createMcpToolBridge,
  InMemoryVectorStore,
} from './integrations';

// Ready-to-Use Components & Built-in Functionalities
export {
  createAgent,
  Agent,
  calculatorTool,
  dateTimeTool,
  jsonParserTool,
  textProcessingTool,
  webSearchTool,
  standardTools,
  createRagPipeline,
  RagPipeline,
  RecursiveCharacterTextSplitter,
  createFallbackChain,
  FallbackChain,
  ConversationSession,
  TokenBudgetMemory,
  createSession,
  PromptTemplate,
  ChatPromptTemplate,
  SystemPrompts,
  extractJson,
  repairJson,
  createStructuredParser,
  collectStreamWithStats,
  StreamSentenceBuffer,
  ContentGuard,
  createContentGuard,
} from './components';

export type {
  AgentConfig,
  AgentStep,
  AgentRunResult,
  AgentTool,
  ExecutableTool,
  StandardTool,
  DocumentInput,
  ChunkDocument,
  TextSplitterOptions,
  RagPipelineConfig,
  RagQueryResult,
  Citation,
  FallbackChainConfig,
  FallbackClient,
  FallbackEvent,
  SessionConfig,
  SessionClient,
  StructuredParser,
  StreamStats,
  GuardrailOptions,
  GuardrailResult,
  PiiDetection,
} from './components';

// Package Version
export { VERSION, PACKAGE_NAME, DISPLAY_NAME } from './version';

