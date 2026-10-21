/**
 * @license MIT
 * Makron.js Vector Normalization and Similarity Math
 */
import { SimilarityResult } from './types';
export declare function dotProduct(a: number[], b: number[]): number;
export declare function magnitude(v: number[]): number;
export declare function cosineSimilarity(a: number[], b: number[]): number;
export declare function l2Normalize(v: number[]): number[];
export declare function findMostSimilar(queryVector: number[], candidateVectors: number[][], topK?: number): SimilarityResult[];
