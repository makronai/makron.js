/**
 * @license MIT
 * Makron.js Model Registry
 */

import { ModelCapabilities, ModelInfo } from '../core/types';
import { resolveModelAlias } from './aliases';
import { BUNDLED_MODEL_CATALOG } from './catalog';
import { ModelCatalogFilter } from './types';

export class ModelRegistry {
  private models: Map<string, ModelInfo> = new Map();

  constructor() {
    this.loadBundledCatalog();
  }

  private loadBundledCatalog() {
    for (const model of BUNDLED_MODEL_CATALOG) {
      this.registerModel(model);
    }
  }

  registerModel(model: ModelInfo): void {
    const key = this.getKey(model.id, model.provider);
    this.models.set(key, model);
    // Also index by ID alone if not already present
    if (!this.models.has(model.id)) {
      this.models.set(model.id, model);
    }
  }

  getModelInfo(modelId: string, provider?: string): ModelInfo | undefined {
    const resolvedId = resolveModelAlias(modelId, provider);

    if (provider) {
      const key = this.getKey(resolvedId, provider);
      if (this.models.has(key)) return this.models.get(key);
    }

    if (this.models.has(resolvedId)) {
      return this.models.get(resolvedId);
    }

    // Try finding by prefix or partial match
    for (const [_, model] of this.models) {
      if (model.id.toLowerCase() === resolvedId.toLowerCase()) {
        if (!provider || model.provider === provider) {
          return model;
        }
      }
    }

    return undefined;
  }

  listModels(filter: ModelCatalogFilter = {}): ModelInfo[] {
    const results: ModelInfo[] = [];
    const seen = new Set<string>();

    for (const [key, model] of this.models) {
      // Avoid duplicate listing from both (id, provider) and (id) keys
      const uniqueKey = `${model.provider}:${model.id}`;
      if (seen.has(uniqueKey)) continue;

      if (filter.provider && model.provider !== filter.provider) {
        continue;
      }

      if (filter.availability && model.availability !== filter.availability) {
        continue;
      }

      if (filter.lifecycle && model.lifecycle !== filter.lifecycle) {
        continue;
      }

      if (filter.capability) {
        const cap = filter.capability as keyof ModelCapabilities;
        if (!model.capabilities || !model.capabilities[cap]) {
          continue;
        }
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesId = model.id.toLowerCase().includes(query);
        const matchesName = model.displayName?.toLowerCase().includes(query) ?? false;
        const matchesDesc = model.description?.toLowerCase().includes(query) ?? false;
        if (!matchesId && !matchesName && !matchesDesc) {
          continue;
        }
      }

      seen.add(uniqueKey);
      results.push(model);
    }

    return results;
  }

  hasCapability(modelId: string, capability: keyof ModelCapabilities, provider?: string): boolean {
    const info = this.getModelInfo(modelId, provider);
    if (!info) return false;
    return Boolean(info.capabilities && info.capabilities[capability]);
  }

  private getKey(id: string, provider: string): string {
    return `${provider}:${id}`;
  }
}

export const defaultModelRegistry = new ModelRegistry();

export function listModels(filter?: ModelCatalogFilter): ModelInfo[] {
  return defaultModelRegistry.listModels(filter);
}

export function getModelInfo(modelId: string, provider?: string): ModelInfo | undefined {
  return defaultModelRegistry.getModelInfo(modelId, provider);
}
