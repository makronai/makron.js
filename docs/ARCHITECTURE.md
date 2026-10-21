# Makron.js Architecture

Makron.js is a unified JavaScript and TypeScript integration engine for hosted LLM providers, local inference servers, browser-native AI runtimes, and ecosystem bridges.

## Architectural Tenets

1. **Keep Core Lightweight**: No heavy provider SDKs, vector databases, or agent frameworks are bundled as mandatory dependencies. Zero-dependency footprint for standard projects.
2. **Treat Model IDs as Data**: Live model discovery is the source of truth when supported by the provider, with bundled, verified catalogs acting as an offline fallback.
3. **Browser Inference as a First-Class, Separate Subpath**: Transformers.js, WebLLM, Wllama, and ONNX Runtime Web are loaded on-demand via `./browser` without polluting Node.js runtimes.
4. **Honest Integration Levels**: Native adapters, compatible endpoints, and documentation recipes are distinctly labeled.

## Core System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                       Developer API                         │
│  createMakron() | chat() | stream() | embed() | rerank()   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Makron Client Core                       │
│  - Normalization (Request, Response, SSE Streaming, Errors) │
│  - Resiliency (Backoff Retry, Jitter, AbortSignal Timeout)  │
│  - Capability Detection & Assertion                         │
│  - Safe Redaction & Logging                                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Hosted Providers │ │  Local Runtimes  │ │ Browser Runtimes │
│ - OpenAI         │ │ - Ollama (11434) │ │ - Transformers.js│
│ - Anthropic      │ │ - vLLM (8000)    │ │ - WebLLM (WebGPU)│
│ - Google Gemini  │ │ - Generic OpenAI │ │ - Wllama (GGUF)  │
│ - xAI / Grok     │ └──────────────────┘ │ - ONNX Web       │
│ - Groq LPU       │                      └──────────────────┘
│ - DeepSeek       │
│ - Qwen / Alibaba │
│ - Z.ai / GLM     │
│ - Mistral AI     │
│ - Cohere         │
└──────────────────┘
```

## Module Subpaths

- `makron.js`: Core client, type system, error hierarchy, capability detection.
- `makron.js/providers`: First-party provider adapters and registry.
- `makron.js/browser`: Browser-native WebGPU, WASM, and Web worker model runtimes.
- `makron.js/models`: Consolidated model catalog, aliases, and discovery engine.
- `makron.js/integrations`: MCP tool bridges, LangChain/LlamaIndex wrappers, vector stores.
