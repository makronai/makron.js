/**
 * @license MIT
 * Makron.js Vector Store Interface & In-Memory Implementation
 */

import { cosineSimilarity } from '../embeddings/normalize';

export interface VectorDocument<T = Record<string, unknown>> {
  id: string;
  vector: number[];
  content: string;
  metadata?: T;
}

export interface VectorSearchResult<T = Record<string, unknown>> {
  document: VectorDocument<T>;
  score: number;
}

export interface VectorStore<T = Record<string, unknown>> {
  upsert(documents: VectorDocument<T>[]): Promise<void>;
  query(vector: number[], topK?: number): Promise<VectorSearchResult<T>[]>;
  delete(ids: string[]): Promise<void>;
}

export class InMemoryVectorStore<T = Record<string, unknown>> implements VectorStore<T> {
  private docs: Map<string, VectorDocument<T>> = new Map();

  async upsert(documents: VectorDocument<T>[]): Promise<void> {
    for (const doc of documents) {
      this.docs.set(doc.id, doc);
    }
  }

  async query(vector: number[], topK: number = 5): Promise<VectorSearchResult<T>[]> {
    const scored: VectorSearchResult<T>[] = [];

    for (const doc of this.docs.values()) {
      const score = cosineSimilarity(vector, doc.vector);
      scored.push({ document: doc, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.docs.delete(id);
    }
  }

  count(): number {
    return this.docs.size;
  }
}
