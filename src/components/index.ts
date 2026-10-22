/**
 * @license MIT
 * Makron.js Ready-to-Use Components & Built-in Functionalities
 * Subpath entry point: `makron.js/components`
 */

// Autonomous ReAct Agent Component
export {
  Agent,
  createAgent,
} from './agent';
export type {
  AgentConfig,
  AgentStep,
  AgentRunResult,
  AgentTool,
  ExecutableTool,
  AgentClient,
} from './agent';

// Built-in Standard Tool Library
export {
  calculatorTool,
  dateTimeTool,
  jsonParserTool,
  textProcessingTool,
  webSearchTool,
  standardTools,
} from './tools';
export type { StandardTool } from './tools';

// RAG Pipeline & Recursive Text Splitter
export {
  RagPipeline,
  createRagPipeline,
  RecursiveCharacterTextSplitter,
} from './rag';
export type {
  DocumentInput,
  ChunkDocument,
  TextSplitterOptions,
  RagPipelineConfig,
  RagQueryResult,
  Citation,
} from './rag';

// Multi-Provider Fallback Resilience Chain
export {
  FallbackChain,
  createFallbackChain,
} from './fallback-chain';
export type {
  FallbackChainConfig,
  FallbackClient,
  FallbackEvent,
} from './fallback-chain';

// Conversation Session & Token Budget Memory
export {
  ConversationSession,
  TokenBudgetMemory,
  createSession,
} from './memory-session';
export type {
  SessionConfig,
  SessionClient,
} from './memory-session';

// Prompt Templates & Presets
export {
  PromptTemplate,
  ChatPromptTemplate,
  SystemPrompts,
} from './prompt-template';

// Structured Parser & JSON Auto-Repair
export {
  extractJson,
  repairJson,
  createStructuredParser,
} from './structured-parser';
export type { StructuredParser } from './structured-parser';

// Stream Consumer & Buffer
export {
  collectStreamWithStats,
  StreamSentenceBuffer,
} from './stream-consumer';
export type { StreamStats } from './stream-consumer';

// Content Guardrails & PII Sanitizer
export {
  ContentGuard,
  createContentGuard,
} from './guardrails';
export type {
  GuardrailOptions,
  GuardrailResult,
  PiiDetection,
} from './guardrails';
