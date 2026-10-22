/**
 * @license MIT
 * Makron.js Plug-and-Play RAG Pipeline & Text Splitter
 * Complete semantic document retrieval and context-grounded generation component.
 */

import { InMemoryVectorStore } from '../integrations/vector-store';
import { cosineSimilarity } from '../embeddings';
import { ChatRequest, EmbeddingRequest, EmbeddingResponse } from '../core/types';

export interface DocumentInput {
  id?: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface ChunkDocument {
  id: string;
  docId: string;
  text: string;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
}

export interface TextSplitterOptions {
  /** Maximum chunk character length (default: 500) */
  chunkSize?: number;
  /** Overlap character length between sequential chunks (default: 50) */
  chunkOverlap?: number;
  /** Separator priority list */
  separators?: string[];
}

/**
 * Splits text recursively by paragraphs, sentences, and words while preserving chunk overlap
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: TextSplitterOptions = {}) {
    this.chunkSize = options.chunkSize ?? 500;
    this.chunkOverlap = options.chunkOverlap ?? 50;
    this.separators = options.separators ?? ['\n\n', '\n', '. ', ' ', ''];
  }

  public splitText(text: string): string[] {
    return this._split(text, this.separators);
  }

  private _split(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];
    if (!text || text.length === 0) return finalChunks;
    if (text.length <= this.chunkSize) return [text.trim()];

    let separator = separators[separators.length - 1];
    let newSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === '') {
        separator = '';
        break;
      }
      if (text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator ? text.split(separator) : text.split('');
    const goodSplits: string[] = [];

    for (const s of splits) {
      if (s.length < this.chunkSize) {
        goodSplits.push(s);
      } else {
        if (goodSplits.length > 0) {
          const merged = this._mergeSplits(goodSplits, separator);
          finalChunks.push(...merged);
          goodSplits.length = 0;
        }
        if (newSeparators.length === 0) {
          finalChunks.push(s.trim());
        } else {
          finalChunks.push(...this._split(s, newSeparators));
        }
      }
    }

    if (goodSplits.length > 0) {
      finalChunks.push(...this._mergeSplits(goodSplits, separator));
    }

    return finalChunks.filter((c) => c.trim().length > 0);
  }

  private _mergeSplits(splits: string[], separator: string): string[] {
    const docs: string[] = [];
    const currentDoc: string[] = [];
    let total = 0;

    for (const piece of splits) {
      const len = piece.length + (currentDoc.length > 0 ? separator.length : 0);
      if (total + len > this.chunkSize && currentDoc.length > 0) {
        const docText = currentDoc.join(separator).trim();
        if (docText) docs.push(docText);

        // Keep overlap
        while (total > this.chunkOverlap && currentDoc.length > 0) {
          const dropped = currentDoc.shift()!;
          total -= dropped.length + (currentDoc.length > 0 ? separator.length : 0);
        }
      }
      currentDoc.push(piece);
      total += len;
    }

    if (currentDoc.length > 0) {
      const remaining = currentDoc.join(separator).trim();
      if (remaining) docs.push(remaining);
    }

    return docs;
  }
}

export interface RagClient {
  chat(request: ChatRequest): Promise<{ text: string; raw?: unknown }>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

export interface RagPipelineConfig {
  /** Makron client or adapter */
  client: RagClient;
  /** Custom embedder function if not using client.embed */
  embedder?: (text: string) => Promise<number[]>;
  /** Text splitter options */
  splitterOptions?: TextSplitterOptions;
  /** Default number of context chunks to retrieve (default: 3) */
  topK?: number;
  /** Custom system prompt template */
  systemPrompt?: string;
}

export interface Citation {
  chunkId: string;
  docId: string;
  snippet: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface RagQueryResult {
  answer: string;
  citations: Citation[];
  latencyMs: number;
  contextUsed: string;
}

/**
 * Fast deterministic fallback hash-embedding when no external embedding model is configured
 */
function createFastHashEmbedding(text: string, dimensions: number = 64): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((v) => v / norm);
}

export class RagPipeline {
  private client: RagClient;
  private embedder: (text: string) => Promise<number[]>;
  private splitter: RecursiveCharacterTextSplitter;
  private chunks: Map<string, { chunk: ChunkDocument; vector: number[] }> = new Map();
  private topK: number;
  private systemPrompt: string;

  constructor(config: RagPipelineConfig) {
    this.client = config.client;
    this.topK = config.topK ?? 3;
    this.splitter = new RecursiveCharacterTextSplitter(config.splitterOptions);
    this.systemPrompt =
      config.systemPrompt ||
      `You are a knowledgeable assistant answering questions based solely on the provided reference context.
If the reference context does not contain enough information to answer the question, state that honestly.
Cite your sources using [Doc: <id>].`;

    if (config.embedder) {
      this.embedder = config.embedder;
    } else if (this.client.embed) {
      this.embedder = async (text: string) => {
        const res = await this.client.embed!({ input: text });
        return res.embeddings[0].vector;
      };
    } else {
      this.embedder = async (text: string) => createFastHashEmbedding(text);
    }
  }

  /**
   * Add a text snippet or document to the RAG knowledge base
   */
  public async addText(text: string, metadata: Record<string, unknown> = {}): Promise<number> {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return this.addDocument({ id: docId, text, metadata });
  }

  /**
   * Add and chunk a structured document
   */
  public async addDocument(doc: DocumentInput): Promise<number> {
    const docId = doc.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const splitTexts = this.splitter.splitText(doc.text);

    let added = 0;
    for (let i = 0; i < splitTexts.length; i++) {
      const chunkId = `${docId}_chunk_${i}`;
      const chunkDoc: ChunkDocument = {
        id: chunkId,
        docId,
        text: splitTexts[i],
        chunkIndex: i,
        metadata: doc.metadata,
      };

      const vector = await this.embedder(chunkDoc.text);
      this.chunks.set(chunkId, { chunk: chunkDoc, vector });
      added++;
    }

    return added;
  }

  /**
   * Add multiple documents in batch
   */
  public async addDocuments(docs: DocumentInput[]): Promise<number> {
    let totalAdded = 0;
    for (const d of docs) {
      totalAdded += await this.addDocument(d);
    }
    return totalAdded;
  }

  /**
   * Retrieve the most semantically relevant chunks for a given query
   */
  public async retrieve(query: string, options: { topK?: number; minScore?: number } = {}): Promise<Citation[]> {
    if (this.chunks.size === 0) return [];

    const k = options.topK ?? this.topK;
    const minScore = options.minScore ?? -1.0;
    const queryVec = await this.embedder(query);

    const scored: Citation[] = [];
    for (const [id, entry] of this.chunks.entries()) {
      const score = cosineSimilarity(queryVec, entry.vector);
      if (score >= minScore) {
        scored.push({
          chunkId: id,
          docId: entry.chunk.docId,
          snippet: entry.chunk.text,
          score,
          metadata: entry.chunk.metadata,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  /**
   * Ask a question against the indexed documents
   */
  public async query(question: string, options: { topK?: number; minScore?: number } = {}): Promise<RagQueryResult> {
    const startTime = Date.now();
    const citations = await this.retrieve(question, options);

    const contextBlocks = citations
      .map((c, idx) => `[Reference ${idx + 1} | Source: ${c.docId}]\n${c.snippet}`)
      .join('\n\n---\n\n');

    const contextUsed = contextBlocks || 'No relevant reference documents found.';

    const prompt = `REFERENCE CONTEXT:
${contextUsed}

USER QUESTION:
${question}

ANSWER:`;

    const response = await this.client.chat({
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const latencyMs = Date.now() - startTime;
    return {
      answer: response.text,
      citations,
      latencyMs,
      contextUsed,
    };
  }

  /**
   * Clear all indexed chunks
   */
  public clear(): void {
    this.chunks.clear();
  }

  /**
   * Total number of indexed chunks
   */
  public get chunkCount(): number {
    return this.chunks.size;
  }
}

/**
 * Create a new RAG pipeline instance
 */
export function createRagPipeline(config: RagPipelineConfig): RagPipeline {
  return new RagPipeline(config);
}
