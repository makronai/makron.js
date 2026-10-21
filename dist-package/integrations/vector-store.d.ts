/**
 * @license MIT
 * Makron.js Vector Store Interface & In-Memory Implementation
 */
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
export declare class InMemoryVectorStore<T = Record<string, unknown>> implements VectorStore<T> {
    private docs;
    upsert(documents: VectorDocument<T>[]): Promise<void>;
    query(vector: number[], topK?: number): Promise<VectorSearchResult<T>[]>;
    delete(ids: string[]): Promise<void>;
    count(): number;
}
