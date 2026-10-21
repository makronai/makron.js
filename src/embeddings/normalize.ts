/**
 * @license MIT
 * Makron.js Vector Normalization and Similarity Math
 */

import { SimilarityResult } from './types';

export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function magnitude(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

export function l2Normalize(v: number[]): number[] {
  const mag = magnitude(v);
  if (mag === 0) return [...v];
  return v.map((val) => val / mag);
}

export function findMostSimilar(
  queryVector: number[],
  candidateVectors: number[][],
  topK: number = 5
): SimilarityResult[] {
  const scores: SimilarityResult[] = candidateVectors.map((candidate, index) => ({
    index,
    score: cosineSimilarity(queryVector, candidate),
  }));

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}
