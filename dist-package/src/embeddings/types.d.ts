/**
 * @license MIT
 * Makron.js Embeddings Types
 */
export type { EmbeddingRequest, EmbeddingResponse, EmbeddingVector, } from '../core/types';
export interface SimilarityResult {
    index: number;
    score: number;
}
