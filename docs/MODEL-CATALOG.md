# Makron.js Model Catalog & Discovery

Makron.js treats model identifiers and capabilities as **data**, not code assumptions.

## Model Catalog Principles

1. **Live Discovery is Primary**: When credentials or endpoints allow, `ai.listModels()` calls the provider's native discovery API (`/v1/models`, `/api/tags`) to return live served models.
2. **Curated Bundled Catalog as Fallback**: 60+ verified models with capabilities (tools, vision, reasoning, embeddings, context window limits) are bundled as offline fallbacks.
3. **No Automatic Multi-Gigabyte Downloads**: Units tests and package installations never download model weights automatically.

## Model Metadata Schema

```ts
interface ModelInfo {
  id: string;
  provider: string;
  displayName?: string;
  description?: string;
  capabilities: {
    chat?: boolean;
    streaming?: boolean;
    tools?: boolean;
    structuredOutput?: boolean;
    vision?: boolean;
    audioInput?: boolean;
    audioOutput?: boolean;
    embeddings?: boolean;
    reranking?: boolean;
    reasoning?: boolean;
  };
  contextWindow?: number;
  maxOutputTokens?: number;
  inputModalities?: string[];
  outputModalities?: string[];
  lifecycle?: 'stable' | 'preview' | 'deprecated' | 'unknown';
  aliasOf?: string;
  sourceURL?: string;
  verifiedAt?: string;
  availability?: 'hosted' | 'local' | 'browser' | 'deployment';
}
```

## Discovery Command

```bash
# Validate bundled catalog schema and urls
npm run models:validate

# Sync live models from remote providers (safe dry-run)
npm run models:sync -- --dry-run
```
