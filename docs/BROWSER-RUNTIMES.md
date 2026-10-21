# Makron.js Browser Runtimes Guide

Makron.js supports 100% client-side inference directly inside modern web browsers. Browser runtimes are provided via the separate subpath `makron.js/browser` to guarantee zero browser-related dependencies in Node.js.

## Supported Browser Engines

| Engine | Primary Use Case | Execution Backend | Model Artifact Format |
|---|---|---|---|
| **Transformers.js** | Chat, Text Gen, Embeddings | WebGPU / WASM / CPU | ONNX |
| **WebLLM** | High-performance Chat (1B-3B) | WebGPU (MLC engine) | MLC compiled weights |
| **Wllama** | GGUF quantized models | WASM + Web Workers | GGUF |
| **ONNX Runtime Web** | Generic tensor inference | WebGPU / WASM | ONNX |

---

## 1. Transformers.js

Ideal for lightweight text generation and client-side semantic embeddings.

```ts
import { TransformersJsAdapter } from 'makron.js/browser';

const adapter = new TransformersJsAdapter({
  defaultModel: 'onnx-community/SmolLM2-360M-Instruct',
  device: 'webgpu', // Automatically falls back to 'wasm' if WebGPU is unavailable
  progressCallback: (info) => {
    console.log(`Download progress: ${info.status} - ${Math.round((info.progress || 0) * 100)}%`);
  },
});

const response = await adapter.chat({
  messages: [{ role: 'user', content: 'What is WebGPU?' }],
});

console.log(response.text);
```

### Browser Semantic Embeddings

```ts
const embedResponse = await adapter.embed({
  model: 'mixedbread-ai/mxbai-embed-xsmall-v1',
  input: ['What is semantic search?', 'How do vector databases work?'],
});

console.log(embedResponse.embeddings[0].vector);
```

---

## 2. WebLLM (MLC WebGPU)

WebLLM provides compiled GPU kernels for fast token generation on devices with modern WebGPU support.

```ts
import { WebLLMAdapter } from 'makron.js/browser';

const adapter = new WebLLMAdapter({
  defaultModel: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  initProgressCallback: (report) => {
    console.log(`Loading weights: ${Math.round(report.progress * 100)}% - ${report.text}`);
  },
});

for await (const chunk of adapter.stream({
  messages: [{ role: 'user', content: 'Write a haiku about modern web standards.' }],
})) {
  process.stdout.write(chunk.deltaText);
}
```

---

## 3. Wllama (GGUF WASM)

Wllama executes arbitrary quantized GGUF models inside web browsers.

### Cross-Origin Isolation Requirement

For high-performance multi-threaded execution, your web server must send the following HTTP headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If these headers are not present, Wllama automatically logs a warning and runs in single-threaded mode.

```ts
import { WllamaAdapter } from 'makron.js/browser';

const adapter = new WllamaAdapter({
  modelUrl: 'https://huggingface.co/my-repo/my-model.Q4_K_M.gguf',
  threads: 4,
  nContext: 2048,
  onProgress: (p) => console.log(`${p.loaded} of ${p.total} bytes loaded`),
});

const res = await adapter.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing simply.' }],
});
```

---

## 4. ONNX Runtime Web

Raw ONNX Runtime Web provides tensor evaluation. Note that raw ONNX Runtime does not bundle tokenizers or autoregressive text decoding loops. Use Transformers.js for complete chat pipelines.

```ts
import { OnnxRuntimeWebAdapter } from 'makron.js/browser';

const adapter = new OnnxRuntimeWebAdapter({
  modelPathOrBuffer: '/models/my-custom-model.onnx',
  executionProviders: ['webgpu', 'wasm'],
});

const session = await adapter.createSession();
const results = await adapter.run({ input_ids: myTensor });
```
