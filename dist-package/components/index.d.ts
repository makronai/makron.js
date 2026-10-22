/**
 * @license MIT
 * Makron.js Ready-to-Use Components & Built-in Functionalities
 * Subpath entry point: `makron.js/components`
 */
export { Agent, createAgent, } from './agent';
export type { AgentConfig, AgentStep, AgentRunResult, AgentTool, ExecutableTool, AgentClient, } from './agent';
export { calculatorTool, dateTimeTool, jsonParserTool, textProcessingTool, webSearchTool, standardTools, } from './tools';
export type { StandardTool } from './tools';
export { RagPipeline, createRagPipeline, RecursiveCharacterTextSplitter, } from './rag';
export type { DocumentInput, ChunkDocument, TextSplitterOptions, RagPipelineConfig, RagQueryResult, Citation, } from './rag';
export { FallbackChain, createFallbackChain, } from './fallback-chain';
export type { FallbackChainConfig, FallbackClient, FallbackEvent, } from './fallback-chain';
export { ConversationSession, TokenBudgetMemory, createSession, } from './memory-session';
export type { SessionConfig, SessionClient, } from './memory-session';
export { PromptTemplate, ChatPromptTemplate, SystemPrompts, } from './prompt-template';
export { extractJson, repairJson, createStructuredParser, } from './structured-parser';
export type { StructuredParser } from './structured-parser';
export { collectStreamWithStats, StreamSentenceBuffer, } from './stream-consumer';
export type { StreamStats } from './stream-consumer';
export { ContentGuard, createContentGuard, } from './guardrails';
export type { GuardrailOptions, GuardrailResult, PiiDetection, } from './guardrails';
