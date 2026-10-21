// src/browser/browser-capabilities.ts
async function detectBrowserCapabilities() {
  const isBrowser = typeof window !== "undefined" && typeof navigator !== "undefined";
  if (!isBrowser) {
    return {
      isBrowser: false,
      hasWebGPU: false,
      hasWasm: false,
      hasSharedArrayBuffer: false,
      isCrossOriginIsolated: false
    };
  }
  let hasWebGPU = false;
  if ("gpu" in navigator && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      hasWebGPU = Boolean(adapter);
    } catch {
      hasWebGPU = false;
    }
  }
  const hasWasm = typeof WebAssembly !== "undefined" && typeof WebAssembly.instantiate === "function";
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
  const isCrossOriginIsolated = typeof window !== "undefined" && Boolean(window.crossOriginIsolated);
  const deviceMemoryGB = navigator.deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;
  return {
    isBrowser: true,
    hasWebGPU,
    hasWasm,
    hasSharedArrayBuffer,
    isCrossOriginIsolated,
    deviceMemoryGB,
    hardwareConcurrency
  };
}
function assertBrowserEnvironment(runtimeName) {
  if (typeof window === "undefined") {
    throw new Error(
      `Runtime '${runtimeName}' requires a browser environment with DOM and window access.`
    );
  }
}

// src/utils/redact.ts
var SECRET_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9_\-]{20,}/g,
  // OpenAI, Groq, Anthropic, DeepSeek, etc.
  /AIza[0-9A-Za-z-_]{35}/g,
  // Google API keys
  /gsk_[a-zA-Z0-9]{30,}/g,
  // Groq keys
  /hf_[a-zA-Z0-9]{30,}/g,
  // HuggingFace tokens
  /xai-[a-zA-Z0-9]{30,}/g,
  // xAI keys
  /Bearer\s+[a-zA-Z0-9._\-]+/gi
  // Authorization headers
];
function redactString(input) {
  if (!input) return input;
  let redacted = input;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      if (match.toLowerCase().startsWith("bearer ")) {
        return "Bearer [REDACTED]";
      }
      return `${match.slice(0, 4)}...[REDACTED]`;
    });
  }
  return redacted;
}

// src/core/errors.ts
var MakronError = class extends Error {
  constructor(message, options = {}) {
    super(redactString(message));
    this.name = "MakronError";
    this.provider = options.provider;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
    this.details = options.details;
    if (options.cause) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var UnsupportedCapabilityError = class extends MakronError {
  constructor(capability, modelOrProvider, options = {}) {
    super(`Capability '${capability}' is not supported by ${modelOrProvider}`, {
      ...options,
      retryable: false
    });
    this.name = "UnsupportedCapabilityError";
    this.capability = capability;
  }
};
var IntegrationDependencyError = class extends MakronError {
  constructor(packageName, feature, options = {}) {
    super(
      `Optional package '${packageName}' is required to use ${feature}. Please install it via 'npm install ${packageName}'`,
      { ...options, retryable: false }
    );
    this.name = "IntegrationDependencyError";
    this.packageName = packageName;
  }
};
var ModelLoadError = class extends MakronError {
  constructor(modelId, reason, options = {}) {
    super(`Failed to load model '${modelId}': ${reason}`, {
      ...options,
      retryable: false
    });
    this.name = "ModelLoadError";
    this.modelId = modelId;
  }
};

// src/core/messages.ts
function contentToString(content) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
  }
  return "";
}

// src/browser/transformers-js.ts
var TransformersJsAdapter = class {
  constructor(config = {}) {
    this.id = "transformers-js";
    this.name = "Transformers.js Browser Engine";
    this.pipelineInstance = null;
    this.loadedModelId = null;
    this.config = config;
  }
  async loadPipeline(task, modelId) {
    assertBrowserEnvironment("Transformers.js");
    if (this.pipelineInstance && this.loadedModelId === modelId) {
      return this.pipelineInstance;
    }
    let pipelineFn;
    if (this.config.transformersModule?.pipeline) {
      pipelineFn = this.config.transformersModule.pipeline;
    } else {
      try {
        const mod = await import(
          /* @vite-ignore */
          '@huggingface/transformers'
        );
        pipelineFn = mod.pipeline;
      } catch (err) {
        throw new IntegrationDependencyError(
          "@huggingface/transformers",
          "Transformers.js browser inference",
          { cause: err }
        );
      }
    }
    const caps = await detectBrowserCapabilities();
    const device = this.config.device || (caps.hasWebGPU ? "webgpu" : "wasm");
    try {
      this.pipelineInstance = await pipelineFn(task, modelId, {
        device,
        dtype: this.config.dtype || "q4",
        progress_callback: this.config.progressCallback
      });
      this.loadedModelId = modelId;
      return this.pipelineInstance;
    } catch (err) {
      throw new ModelLoadError(modelId, err.message || String(err), { cause: err });
    }
  }
  async chat(request, options) {
    const model = request.model || this.config.defaultModel || "onnx-community/SmolLM2-360M-Instruct";
    const generator = await this.loadPipeline("text-generation", model);
    const messages = request.messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content)
    }));
    const startTime = Date.now();
    const output = await generator(messages, {
      max_new_tokens: request.maxTokens || 256,
      temperature: request.temperature || 0.7,
      top_p: request.topP || 0.9
    });
    const latencyMs = Date.now() - startTime;
    const generatedText = output?.[0]?.generated_text;
    const lastMessage = Array.isArray(generatedText) ? generatedText[generatedText.length - 1]?.content : String(generatedText || "");
    return {
      id: `tfjs_${Date.now()}`,
      model,
      provider: this.id,
      text: lastMessage,
      message: { role: "assistant", content: lastMessage },
      finishReason: { reason: "stop" },
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      latencyMs,
      raw: output
    };
  }
  async *stream(request, options) {
    const res = await this.chat(request, options);
    yield {
      id: res.id,
      model: res.model,
      provider: this.id,
      deltaText: res.text,
      finishReason: res.finishReason,
      usage: res.usage,
      raw: res.raw
    };
  }
  async embed(request, options) {
    const model = request.model || "mixedbread-ai/mxbai-embed-xsmall-v1";
    const extractor = await this.loadPipeline("feature-extraction", model);
    const texts = Array.isArray(request.input) ? request.input : [request.input];
    const startTime = Date.now();
    const output = await extractor(texts, {
      pooling: "mean",
      normalize: true
    });
    const latencyMs = Date.now() - startTime;
    const vectors = output.tolist ? output.tolist() : Array.from(output);
    return {
      model,
      provider: this.id,
      embeddings: vectors.map((vector, index) => ({ index, vector })),
      latencyMs,
      raw: output
    };
  }
  async dispose() {
    if (this.pipelineInstance?.dispose) {
      await this.pipelineInstance.dispose();
    }
    this.pipelineInstance = null;
    this.loadedModelId = null;
  }
};

// src/browser/webllm.ts
var WebLLMAdapter = class {
  constructor(config = {}) {
    this.id = "webllm";
    this.name = "WebLLM (MLC WebGPU Engine)";
    this.engineInstance = null;
    this.loadedModelId = null;
    this.config = config;
  }
  async getEngine(modelId) {
    assertBrowserEnvironment("WebLLM");
    const caps = await detectBrowserCapabilities();
    if (!caps.hasWebGPU) {
      throw new UnsupportedCapabilityError(
        "webgpu",
        "WebLLM requires a browser and GPU that supports WebGPU."
      );
    }
    if (this.engineInstance && this.loadedModelId === modelId) {
      return this.engineInstance;
    }
    let createEngineFn;
    if (this.config.webLLMModule?.CreateMLCEngine) {
      createEngineFn = this.config.webLLMModule.CreateMLCEngine;
    } else {
      try {
        const mod = await import(
          /* @vite-ignore */
          '@mlc-ai/web-llm'
        );
        createEngineFn = mod.CreateMLCEngine;
      } catch (err) {
        throw new IntegrationDependencyError(
          "@mlc-ai/web-llm",
          "WebLLM browser WebGPU inference",
          { cause: err }
        );
      }
    }
    try {
      this.engineInstance = await createEngineFn(modelId, {
        initProgressCallback: this.config.initProgressCallback
      });
      this.loadedModelId = modelId;
      return this.engineInstance;
    } catch (err) {
      throw new ModelLoadError(modelId, err.message || String(err), { cause: err });
    }
  }
  async chat(request, options) {
    const model = request.model || this.config.defaultModel || "Llama-3.2-1B-Instruct-q4f32_1-MLC";
    const engine = await this.getEngine(model);
    const messages = request.messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content)
    }));
    const startTime = Date.now();
    const reply = await engine.chat.completions.create({
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false
    });
    const latencyMs = Date.now() - startTime;
    const choice = reply.choices?.[0];
    const text = choice?.message?.content || "";
    return {
      id: reply.id || `webllm_${Date.now()}`,
      model,
      provider: this.id,
      text,
      message: { role: "assistant", content: text },
      finishReason: { reason: "stop", raw: choice?.finish_reason },
      usage: {
        promptTokens: reply.usage?.prompt_tokens ?? 0,
        completionTokens: reply.usage?.completion_tokens ?? 0,
        totalTokens: reply.usage?.total_tokens ?? 0
      },
      latencyMs,
      raw: reply
    };
  }
  async *stream(request, options) {
    const model = request.model || this.config.defaultModel || "Llama-3.2-1B-Instruct-q4f32_1-MLC";
    const engine = await this.getEngine(model);
    const messages = request.messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content)
    }));
    const chunks = await engine.chat.completions.create({
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true
    });
    for await (const chunk of chunks) {
      const deltaText = chunk.choices?.[0]?.delta?.content || "";
      yield {
        id: chunk.id || `webllm_chunk_${Date.now()}`,
        model,
        provider: this.id,
        deltaText,
        finishReason: chunk.choices?.[0]?.finish_reason ? { reason: "stop", raw: chunk.choices[0].finish_reason } : void 0,
        raw: chunk
      };
    }
  }
  async unload() {
    if (this.engineInstance?.unload) {
      await this.engineInstance.unload();
    }
    this.engineInstance = null;
    this.loadedModelId = null;
  }
};

// src/browser/wllama.ts
var WllamaAdapter = class {
  constructor(config = {}) {
    this.id = "wllama";
    this.name = "Wllama GGUF Engine";
    this.instance = null;
    this.config = config;
  }
  async getInstance() {
    assertBrowserEnvironment("Wllama");
    if (this.instance) return this.instance;
    const caps = await detectBrowserCapabilities();
    if (!caps.isCrossOriginIsolated) {
      console.warn(
        "[Makron:Wllama] Page is not crossOriginIsolated. Multi-threaded WASM execution requires headers:\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\nWllama will fallback to single-threaded mode."
      );
    }
    let WllamaClass;
    if (this.config.wllamaModule?.Wllama) {
      WllamaClass = this.config.wllamaModule.Wllama;
    } else {
      try {
        const mod = await import(
          /* @vite-ignore */
          '@wllama/wllama'
        );
        WllamaClass = mod.Wllama;
      } catch (err) {
        throw new IntegrationDependencyError(
          "@wllama/wllama",
          "Wllama browser GGUF WASM inference",
          { cause: err }
        );
      }
    }
    try {
      this.instance = new WllamaClass({
        "wllama.wasm": this.config.wllamaPath || "/wllama.wasm"
      });
      if (this.config.modelUrl) {
        await this.instance.loadModelFromUrl(this.config.modelUrl, {
          n_ctx: this.config.nContext || 2048,
          n_threads: this.config.threads || 4,
          progressCallback: this.config.onProgress
        });
      }
      return this.instance;
    } catch (err) {
      throw new ModelLoadError(this.config.modelUrl || "gguf-model", err.message || String(err), { cause: err });
    }
  }
  async chat(request, options) {
    const wllama = await this.getInstance();
    const prompt = request.messages.map((m) => `${m.role}: ${contentToString(m.content)}`).join("\n") + "\nassistant:";
    const startTime = Date.now();
    const completion = await wllama.createCompletion(prompt, {
      nPredict: request.maxTokens || 256,
      sampling: {
        temp: request.temperature || 0.7,
        top_p: request.topP || 0.9
      }
    });
    const latencyMs = Date.now() - startTime;
    const text = completion.trim();
    return {
      id: `wllama_${Date.now()}`,
      model: this.config.modelUrl || "wllama-gguf",
      provider: this.id,
      text,
      message: { role: "assistant", content: text },
      finishReason: { reason: "stop" },
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      latencyMs,
      raw: completion
    };
  }
  async *stream(request, options) {
    const wllama = await this.getInstance();
    const prompt = request.messages.map((m) => `${m.role}: ${contentToString(m.content)}`).join("\n") + "\nassistant:";
    const fullText = await wllama.createCompletion(prompt, {
      nPredict: request.maxTokens || 256,
      sampling: {
        temp: request.temperature || 0.7
      },
      onNewToken: (token, piece, currentText) => {
      }
    });
    yield {
      id: `wllama_chunk_${Date.now()}`,
      model: this.config.modelUrl || "wllama-gguf",
      provider: this.id,
      deltaText: fullText,
      finishReason: { reason: "stop" }
    };
  }
  async embed(request, options) {
    const wllama = await this.getInstance();
    const text = Array.isArray(request.input) ? request.input[0] : request.input;
    const startTime = Date.now();
    const embedding = await wllama.createEmbedding(text);
    const latencyMs = Date.now() - startTime;
    return {
      model: this.config.modelUrl || "wllama-gguf",
      provider: this.id,
      embeddings: [{ index: 0, vector: Array.from(embedding) }],
      latencyMs
    };
  }
  async unload() {
    if (this.instance?.exit) {
      await this.instance.exit();
    }
    this.instance = null;
  }
};

// src/browser/onnx-runtime.ts
var OnnxRuntimeWebAdapter = class {
  constructor(config) {
    this.id = "onnx-runtime-web";
    this.name = "ONNX Runtime Web Generic Engine";
    this.session = null;
    this.ort = null;
    this.config = config;
  }
  async getOrt() {
    assertBrowserEnvironment("ONNX Runtime Web");
    if (this.ort) return this.ort;
    if (this.config.ortModule) {
      this.ort = this.config.ortModule;
      return this.ort;
    }
    try {
      this.ort = await import(
        /* @vite-ignore */
        'onnxruntime-web'
      );
      return this.ort;
    } catch (err) {
      throw new IntegrationDependencyError(
        "onnxruntime-web",
        "ONNX Runtime Web generic inference",
        { cause: err }
      );
    }
  }
  async createSession() {
    if (this.session) return this.session;
    const ort = await this.getOrt();
    const caps = await detectBrowserCapabilities();
    const executionProviders = this.config.executionProviders || (caps.hasWebGPU ? ["webgpu", "wasm"] : ["wasm"]);
    this.session = await ort.InferenceSession.create(this.config.modelPathOrBuffer, {
      executionProviders,
      graphOptimizationLevel: this.config.graphOptimizationLevel || "all"
    });
    return this.session;
  }
  async run(feeds) {
    const session = await this.createSession();
    return await session.run(feeds);
  }
  /**
   * Note on Text Generation limitation as per Makron.js architecture:
   * Raw ONNX Runtime provides tensor computation, not an automatic text generation loop.
   * Full chat generation requires tokenizer embeddings and autoregressive sampling (use Transformers.js for complete chat).
   */
  async chat() {
    throw new UnsupportedCapabilityError(
      "chat",
      "Raw ONNX Runtime Web does not provide built-in tokenizers or autoregressive decode loops. Use the Transformers.js adapter for full text generation, or use run() for tensor inference."
    );
  }
  async release() {
    if (this.session?.release) {
      await this.session.release();
    }
    this.session = null;
  }
};
/**
 * @license MIT
 * Makron.js Browser Capability & WebGPU Detection
 */
/**
 * @license MIT
 * Makron.js Secret and Token Redaction Utilities
 */
/**
 * @license MIT
 * Makron.js Error Hierarchy
 */
/**
 * @license MIT
 * Makron.js Message Normalization Engine
 */
/**
 * @license MIT
 * Makron.js Transformers.js Browser Adapter
 * Source: https://huggingface.co/docs/transformers.js
 */
/**
 * @license MIT
 * Makron.js WebLLM Browser Adapter
 * Source: https://github.com/mlc-ai/web-llm
 */
/**
 * @license MIT
 * Makron.js Wllama (GGUF WASM / Worker) Browser Adapter
 * Source: https://github.com/ngxson/wllama
 */
/**
 * @license MIT
 * Makron.js ONNX Runtime Web Adapter
 * Source: https://onnxruntime.ai/docs/get-started/with-javascript/web.html
 */
/**
 * @license MIT
 * Makron.js Browser Runtime Entry Point
 */

export { OnnxRuntimeWebAdapter, TransformersJsAdapter, WebLLMAdapter, WllamaAdapter, assertBrowserEnvironment, detectBrowserCapabilities };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map