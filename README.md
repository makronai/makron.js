# Makron.js ⚡

> **Unified JavaScript & TypeScript Integration Engine for Hosted LLMs, Local Endpoints, Browser Runtimes, and Ecosystem Bridges.**

[![CI/CD Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/muktodmi/makron.js)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)](https://www.npmjs.com/package/makron.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org/)

Makron.js delivers a single, cohesive developer interface to connect, configure, switch between, and compose modern AI models—without pretending that every provider, vendor, framework, or runtime implements the exact same capabilities.

---

## 💎 Core Architectural Decisions

1. **Keep Core Lightweight**: No mandatory dependencies on heavyweight provider SDKs or AI frameworks. Works cleanly in existing JavaScript and TypeScript projects.
2. **Model IDs as Data, Not Code Assumptions**: Dynamic model discovery from endpoints (`/v1/models`, `/api/tags`) is the primary source of truth, backed by 60+ verified default catalog fallbacks.
3. **Browser Inference as a First-Class, Separate Subpath**: Transformers.js, WebLLM, Wllama, and ONNX Runtime Web run client-side via `makron.js/browser` without polluting Node.js runtimes.
4. **Honest Integration Levels**: Native adapters, compatible endpoints, and documentation recipes are clearly separated and honestly labeled.

---

## 📦 Installation

```bash
npm install makron.js
```

Makron.js publishes dual **ESM** and **CommonJS** bundles with full TypeScript declaration files (`.d.ts`).

---

## 🚀 Quick Start

### 1. Hosted Provider (e.g. OpenAI)

```ts
import { createMakron } from 'makron.js';

const ai = createMakron({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-5-mini',
});

const result = await ai.chat({
  messages: [{ role: 'user', content: 'Explain vector embeddings in one sentence.' }],
});

console.log(result.text);
console.log(`Tokens used: ${result.usage.totalTokens}`);
```

### 2. Local Endpoint (Ollama - No API Key Required)

```ts
import { createMakron } from 'makron.js';

const ai = createMakron({
  provider: 'ollama',
  baseURL: 'http://localhost:11434/v1',
  model: 'gpt-oss:20b',
});

const result = await ai.chat({
  messages: [{ role: 'user', content: 'Hello local model!' }],
});

console.log(result.text);
```

### 3. Real-Time Token Streaming

```ts
for await (const chunk of ai.stream({
  messages: [{ role: 'user', content: 'Write a haiku about open source software.' }],
})) {
  process.stdout.write(chunk.deltaText);
}
```

### 4. Client-Side Browser Inference (WebGPU / WASM)

```ts
import { TransformersJsAdapter } from 'makron.js/browser';

const browserAi = new TransformersJsAdapter({
  defaultModel: 'onnx-community/SmolLM2-360M-Instruct',
  progressCallback: (info) => console.log(`Downloading: ${Math.round((info.progress || 0) * 100)}%`),
});

const response = await browserAi.chat({
  messages: [{ role: 'user', content: 'Why run AI locally in the browser?' }],
});

console.log(response.text);
```

---

## 🛠️ Tool Calling & Schema Execution

```ts
import { createMakron, defineTool, executeToolCalls } from 'makron.js';

const weatherTool = defineTool(
  'get_weather',
  'Get the current weather for a given city',
  {
    type: 'object',
    properties: {
      city: { type: 'string' },
    },
    required: ['city'],
  },
  async ({ city }) => ({ temperature: 21, unit: 'celsius', city })
);

const ai = createMakron({ provider: 'openai', model: 'gpt-5-mini' });

const response = await ai.chat({
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools: [weatherTool.definition],
});

if (response.toolCalls) {
  const toolResults = await executeToolCalls(response.toolCalls, [weatherTool]);
  console.log(toolResults);
}
```

---

## 🧩 Model Context Protocol (MCP) Bridge

```ts
import { convertMcpToolsToMakron, createMcpToolBridge } from 'makron.js/integrations';

// Convert any MCP tools into Makron tool definitions
const makronTools = convertMcpToolsToMakron(mcpClientTools);
```

---

## 🧪 Testing and Verification

Run the complete test suite:

```bash
# Run unit tests
npm test

# Run model catalog verification
npm run models:validate

# Run complete release gate check
npm run release:check

# Dry-run npm packaging
npm pack --dry-run
```

---

## 📄 License

MIT © 2026 Makron.js Contributors
