/**
 * @license MIT
 * Makron.js Ecosystem Integrations Types
 */

export type IntegrationSupportLevel =
  | 'built-in'
  | 'optional-adapter'
  | 'compatible-endpoint'
  | 'integration-recipe'
  | 'community'
  | 'planned';

export type IntegrationCategory =
  | 'llm-provider'
  | 'llm-platform'
  | 'agent-framework'
  | 'rag-retrieval'
  | 'embeddings'
  | 'mcp'
  | 'security-guardrails'
  | 'observability'
  | 'memory'
  | 'agent-sdk'
  | 'automation'
  | 'vector-database';

export interface IntegrationRecord {
  id: string;
  name: string;
  category: IntegrationCategory;
  supportLevel: IntegrationSupportLevel;
  requiredPackage?: string;
  peerDependency?: string;
  description: string;
  documentationUrl?: string;
  recipeCode?: string;
  verified: boolean;
}

export interface ObservabilitySpan {
  traceId: string;
  spanId: string;
  provider: string;
  model: string;
  startTime: number;
  endTime?: number;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface ObservabilityHandler {
  onSpanStart?: (span: ObservabilitySpan) => void;
  onSpanEnd?: (span: ObservabilitySpan) => void;
  onError?: (span: ObservabilitySpan, error: Error) => void;
}
