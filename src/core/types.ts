/**
 * @license MIT
 * Makron.js Core Type System
 */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface TextPart {
  type: 'text';
  text: string;
}

export interface ImagePart {
  type: 'image';
  image: string | Uint8Array; // URL, Base64 data URL, or raw bytes
  mimeType?: string;
}

export interface AudioPart {
  type: 'audio';
  audio: string | Uint8Array;
  mimeType?: string;
}

export interface ToolCallPart {
  type: 'tool_call';
  toolCall: ToolCall;
}

export interface ToolResultPart {
  type: 'tool_result';
  toolResult: ToolResult;
}

export type ContentPart = TextPart | ImagePart | AudioPart | ToolCallPart | ToolResultPart;

export type MessageContent = string | ContentPart[];

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown> | string;
}

export interface ToolResult {
  toolCallId: string;
  name?: string;
  result: unknown;
  isError?: boolean;
}

export interface Message {
  role: Role;
  content: MessageContent;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolFunction {
  name: string;
  description?: string;
  parameters: Record<string, unknown>; // JSON Schema object
  strict?: boolean;
}

export interface ToolDefinition {
  type: 'function';
  function: ToolFunction;
}

export type ToolChoice = 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

export interface StructuredOutputSchema {
  name: string;
  description?: string;
  schema: Record<string, unknown>; // JSON Schema
  strict?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedPromptTokens?: number;
}

export interface FinishReason {
  reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error' | 'other';
  raw?: string;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
  baseURL?: string;
  apiKey?: string;
  custom?: Record<string, unknown>;
}

export interface ChatRequest {
  model?: string;
  messages: Message[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string | string[];
  tools?: ToolDefinition[];
  toolChoice?: ToolChoice;
  responseFormat?: 'text' | 'json_object' | StructuredOutputSchema;
  seed?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  custom?: Record<string, unknown>;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  provider: string;
  text: string;
  message: Message;
  toolCalls?: ToolCall[];
  finishReason: FinishReason;
  usage: TokenUsage;
  latencyMs: number;
  raw?: unknown;
}

export interface ChatChunk {
  id: string;
  model: string;
  provider: string;
  deltaText: string;
  deltaToolCalls?: Array<{
    index: number;
    id?: string;
    name?: string;
    argumentsDelta?: string;
  }>;
  finishReason?: FinishReason;
  usage?: TokenUsage;
  raw?: unknown;
}

export interface EmbeddingRequest {
  model?: string;
  input: string | string[];
  dimensions?: number;
  user?: string;
}

export interface EmbeddingVector {
  index: number;
  vector: number[];
}

export interface EmbeddingResponse {
  model: string;
  provider: string;
  embeddings: EmbeddingVector[];
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  raw?: unknown;
}

export interface RerankDocument {
  id?: string | number;
  text: string;
}

export interface RerankRequest {
  model?: string;
  query: string;
  documents: (string | RerankDocument)[];
  topN?: number;
  returnDocuments?: boolean;
}

export interface RerankResult {
  index: number;
  relevanceScore: number;
  document?: string | RerankDocument;
}

export interface RerankResponse {
  model: string;
  provider: string;
  results: RerankResult[];
  latencyMs: number;
  raw?: unknown;
}

export type ModelAvailability = 'hosted' | 'local' | 'browser' | 'deployment';
export type ModelLifecycle = 'stable' | 'preview' | 'deprecated' | 'unknown';

export interface ModelCapabilities {
  chat?: boolean;
  streaming?: boolean;
  tools?: boolean;
  structuredOutput?: boolean;
  vision?: boolean;
  audioInput?: boolean;
  audioOutput?: boolean;
  embeddings?: boolean;
  reranking?: boolean;
  reasoning?: boolean;
  webSearch?: boolean;
}

export interface ModelInfo {
  id: string;
  provider: string;
  displayName?: string;
  description?: string;
  capabilities: ModelCapabilities;
  contextWindow?: number;
  maxOutputTokens?: number;
  inputModalities?: string[];
  outputModalities?: string[];
  lifecycle?: ModelLifecycle;
  aliasOf?: string;
  sourceURL?: string;
  verifiedAt?: string;
  availability?: ModelAvailability;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  defaultBaseURL?: string;
  chat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse>;
  stream?(request: ChatRequest, options?: RequestOptions): AsyncIterable<ChatChunk>;
  embed?(request: EmbeddingRequest, options?: RequestOptions): Promise<EmbeddingResponse>;
  rerank?(request: RerankRequest, options?: RequestOptions): Promise<RerankResponse>;
  listModels?(options?: RequestOptions): Promise<ModelInfo[]>;
  getModelInfo?(modelId: string, options?: RequestOptions): Promise<ModelInfo | undefined>;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  create: (config: ProviderConfig) => ProviderAdapter;
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  headers?: Record<string, string>;
  defaultModel?: string;
  timeoutMs?: number;
  retries?: number;
  custom?: Record<string, unknown>;
  mockTransport?: (request: unknown) => Promise<unknown>;
}

export interface MakronConfig extends ProviderConfig {
  provider: string | ProviderDefinition | ProviderAdapter;
  model?: string;
}
