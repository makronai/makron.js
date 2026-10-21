/**
 * @license MIT
 * Makron.js Model Catalog Types
 */

export type {
  ModelAvailability,
  ModelCapabilities,
  ModelInfo,
  ModelLifecycle,
} from '../core/types';

export interface ModelCatalogFilter {
  provider?: string;
  capability?: string;
  availability?: 'hosted' | 'local' | 'browser' | 'deployment';
  lifecycle?: 'stable' | 'preview' | 'deprecated' | 'unknown';
  searchQuery?: string;
}

export interface ModelAlias {
  alias: string;
  targetId: string;
  provider: string;
  description?: string;
}

export interface ModelDiscoveryResult {
  provider: string;
  models: Array<{
    id: string;
    displayName?: string;
    ownedBy?: string;
    created?: number;
    contextWindow?: number;
    raw?: unknown;
  }>;
  fetchedAt: string;
  source: 'remote_api' | 'local_service' | 'bundled_cache';
}
