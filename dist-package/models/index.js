// src/models/aliases.ts
var DEFAULT_MODEL_ALIASES = [
  {
    alias: "gpt-default",
    targetId: "gpt-5-mini",
    provider: "openai",
    description: "Default fast OpenAI reasoning model"
  },
  {
    alias: "claude-default",
    targetId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    description: "Default Anthropic model"
  },
  {
    alias: "gemini-default",
    targetId: "gemini-3.8-flash",
    provider: "gemini",
    description: "Default Google Gemini model"
  },
  {
    alias: "grok-default",
    targetId: "grok-4.7",
    provider: "xai",
    description: "Default xAI Grok model"
  },
  {
    alias: "groq-fast",
    targetId: "openai/gpt-oss-20b",
    provider: "groq",
    description: "Ultra-fast Groq LPU inference target"
  },
  {
    alias: "deepseek-chat",
    targetId: "deepseek-flash",
    provider: "deepseek",
    description: "Default DeepSeek chat endpoint"
  },
  {
    alias: "qwen-default",
    targetId: "qwen3.8-max",
    provider: "qwen",
    description: "Default Qwen flagship model"
  },
  {
    alias: "ollama-default",
    targetId: "gpt-oss:20b",
    provider: "ollama",
    description: "Default local Ollama model"
  },
  {
    alias: "browser-default",
    targetId: "onnx-community/SmolLM2-360M-Instruct",
    provider: "transformers-js",
    description: "Default lightweight browser model"
  }
];
function resolveModelAlias(modelOrAlias, provider) {
  const match = DEFAULT_MODEL_ALIASES.find((item) => {
    if (provider && item.provider !== provider) return false;
    return item.alias === modelOrAlias;
  });
  return match ? match.targetId : modelOrAlias;
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
function redactHeaders(headers) {
  const normalized = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      normalized[key] = value;
    }
  } else if (typeof headers === "object" && headers !== null) {
    Object.assign(normalized, headers);
  }
  const redacted = {};
  for (const [key, value] of Object.entries(normalized)) {
    const lower = key.toLowerCase();
    if (lower === "authorization" || lower === "x-api-key" || lower.includes("key") || lower.includes("token")) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
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
var AuthenticationError = class extends MakronError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode ?? 401, retryable: false });
    this.name = "AuthenticationError";
  }
};
var ProviderError = class extends MakronError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 500,
      retryable: options.retryable ?? (options.statusCode ? options.statusCode >= 500 : false)
    });
    this.name = "ProviderError";
  }
};
var RateLimitError = class extends MakronError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 429,
      retryable: true
    });
    this.name = "RateLimitError";
  }
};
var RequestTimeoutError = class extends MakronError {
  constructor(message = "Request timed out", options = {}) {
    super(message, {
      ...options,
      statusCode: options.statusCode ?? 408,
      retryable: true
    });
    this.name = "RequestTimeoutError";
  }
};
var RequestAbortedError = class extends MakronError {
  constructor(message = "Request was aborted", options = {}) {
    super(message, { ...options, retryable: false });
    this.name = "RequestAbortedError";
  }
};

// src/utils/json.ts
function safeJsonParse(input, fallback) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

// src/utils/fetch.ts
async function safeFetch(url, options = {}) {
  const { timeoutMs = 6e4, provider = "unknown", ...init } = options;
  let timeoutId;
  let signal = init.signal;
  if (timeoutMs > 0) {
    const controller = new AbortController();
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }
    timeoutId = setTimeout(() => {
      controller.abort(new RequestTimeoutError(`Request timed out after ${timeoutMs}ms`, { provider }));
    }, timeoutMs);
    signal = controller.signal;
  }
  try {
    const response = await fetch(url, {
      ...init,
      signal
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (!response.ok) {
      await handleHttpError(response, provider);
    }
    return response;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err instanceof RequestTimeoutError) {
      throw err;
    }
    if (err.name === "AbortError" || signal?.aborted) {
      throw new RequestAbortedError("Request aborted by caller or timeout", {
        provider,
        cause: err
      });
    }
    if (err.name?.includes("Error") && err.provider) {
      throw err;
    }
    throw new ProviderError(
      `Network request failed to ${redactString(url)}: ${err.message || String(err)}`,
      {
        provider,
        cause: err
      }
    );
  }
}
async function handleHttpError(response, provider) {
  const status = response.status;
  const rawText = await response.text().catch(() => "");
  const parsed = safeJsonParse(rawText);
  const errorMessage = parsed?.error?.message || parsed?.message || parsed?.detail || rawText || `HTTP ${status} ${response.statusText}`;
  const retryAfterHeader = response.headers.get("retry-after");
  let retryAfterMs;
  if (retryAfterHeader) {
    const parsedSec = parseInt(retryAfterHeader, 10);
    if (!isNaN(parsedSec)) {
      retryAfterMs = parsedSec * 1e3;
    }
  }
  const details = {
    url: redactString(response.url),
    status,
    headers: redactHeaders(response.headers),
    rawError: parsed || rawText
  };
  if (status === 401 || status === 403) {
    throw new AuthenticationError(
      `Authentication failed for provider '${provider}': ${errorMessage}`,
      { provider, statusCode: status, details }
    );
  }
  if (status === 429) {
    throw new RateLimitError(
      `Rate limit exceeded for provider '${provider}': ${errorMessage}`,
      { provider, statusCode: status, retryAfterMs, details }
    );
  }
  if (status === 408 || status === 504) {
    throw new RequestTimeoutError(
      `Gateway or request timeout (${status}) from provider '${provider}': ${errorMessage}`,
      { provider, statusCode: status, details }
    );
  }
  throw new ProviderError(
    `Provider '${provider}' returned error (${status}): ${errorMessage}`,
    {
      provider,
      statusCode: status,
      retryable: status >= 500,
      details
    }
  );
}

// src/models/discovery.ts
async function discoverModels(options) {
  const { provider, baseURL, apiKey, signal, timeoutMs = 8e3 } = options;
  if (provider === "ollama") {
    return discoverOllamaModels(baseURL || "http://localhost:11434", signal, timeoutMs);
  }
  const defaultBaseUrl = getProviderDefaultBaseUrl(provider) || baseURL;
  if (!defaultBaseUrl) {
    throw new Error(`Cannot discover models: unknown base URL for provider '${provider}'`);
  }
  const endpoint = defaultBaseUrl.endsWith("/v1") ? `${defaultBaseUrl}/models` : defaultBaseUrl.includes("/openai/v1") ? `${defaultBaseUrl}/models` : `${defaultBaseUrl}/v1/models`;
  const headers = {
    "Accept": "application/json"
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  const response = await safeFetch(endpoint, {
    method: "GET",
    headers,
    signal,
    timeoutMs,
    provider
  });
  const text = await response.text();
  const data = safeJsonParse(text);
  const rawList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const models = rawList.map((item) => ({
    id: typeof item === "string" ? item : item.id,
    displayName: item.name || item.id,
    ownedBy: item.owned_by,
    created: item.created,
    contextWindow: item.context_window,
    raw: item
  }));
  return {
    provider,
    models,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "remote_api"
  };
}
async function discoverOllamaModels(baseURL, signal, timeoutMs = 8e3) {
  const endpoint = `${baseURL.replace(/\/+$/, "")}/api/tags`;
  const response = await safeFetch(endpoint, {
    method: "GET",
    headers: { "Accept": "application/json" },
    signal,
    timeoutMs,
    provider: "ollama"
  });
  const text = await response.text();
  const data = safeJsonParse(text);
  const rawModels = Array.isArray(data?.models) ? data.models : [];
  const models = rawModels.map((item) => ({
    id: item.name || item.model,
    displayName: `${item.name} (${item.details?.parameter_size || "local"})`,
    ownedBy: "ollama",
    raw: item
  }));
  return {
    provider: "ollama",
    models,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "local_service"
  };
}
function getProviderDefaultBaseUrl(provider) {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1";
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "deepseek":
      return "https://api.deepseek.com/v1";
    case "xai":
      return "https://api.x.ai/v1";
    case "ollama":
      return "http://localhost:11434";
    case "vllm":
      return "http://localhost:8000/v1";
    default:
      return void 0;
  }
}

// src/models/catalog/openai.ts
var OPENAI_MODELS = [
  {
    id: "gpt-5.1",
    provider: "openai",
    displayName: "GPT-5.1 Flagship",
    description: "Flagship frontier multimodal model with advanced reasoning, coding, and autonomous tool use.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      audioInput: true,
      audioOutput: true,
      reasoning: true
    },
    contextWindow: 256e3,
    maxOutputTokens: 32768,
    inputModalities: ["text", "image", "audio"],
    outputModalities: ["text", "audio"],
    lifecycle: "stable",
    sourceURL: "https://platform.openai.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gpt-5-mini",
    provider: "openai",
    displayName: "GPT-5 Mini",
    description: "High-throughput, cost-efficient reasoning model for production agents and chat.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 16384,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://platform.openai.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gpt-5-nano",
    provider: "openai",
    displayName: "GPT-5 Nano",
    description: "Ultra-low latency edge and mobile reasoning model.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 64e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://platform.openai.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gpt-oss-120b",
    provider: "openai",
    displayName: "GPT-OSS 120B",
    description: "Open-weight high-capacity reasoning model for hosted API and local endpoints.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 16384,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://platform.openai.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gpt-oss-20b",
    provider: "openai",
    displayName: "GPT-OSS 20B",
    description: "Compact open-weight model optimized for local serving (vLLM/Ollama).",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 64e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://platform.openai.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "text-embedding-3-large",
    provider: "openai",
    displayName: "Text Embedding 3 Large",
    description: "High-performance text embedding model with dimensions up to 3072.",
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true
    },
    contextWindow: 8191,
    maxOutputTokens: 0,
    inputModalities: ["text"],
    outputModalities: ["embeddings"],
    lifecycle: "stable",
    sourceURL: "https://platform.openai.com/docs/models/embeddings",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/gemini.ts
var GEMINI_MODELS = [
  {
    id: "gemini-3.8-flash",
    provider: "gemini",
    displayName: "Gemini 3.8 Flash",
    description: "Next-gen multimodal flash model with ultra-fast latency and 1M context window.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      audioInput: true,
      webSearch: true,
      reasoning: true
    },
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputModalities: ["text", "image", "audio", "video"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ai.google.dev/gemini-api/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gemini-3.6-flash",
    provider: "gemini",
    displayName: "Gemini 3.6 Flash",
    description: "High efficiency workhorse model for production reasoning and high-volume workloads.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      audioInput: true,
      webSearch: true
    },
    contextWindow: 1048576,
    maxOutputTokens: 32768,
    inputModalities: ["text", "image", "audio", "video"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ai.google.dev/gemini-api/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gemini-3.1-pro-preview",
    provider: "gemini",
    displayName: "Gemini 3.1 Pro Preview",
    description: "Frontier reasoning model for advanced coding, math, and multimodal reasoning.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      audioInput: true,
      webSearch: true,
      reasoning: true
    },
    contextWindow: 2097152,
    maxOutputTokens: 65536,
    inputModalities: ["text", "image", "audio", "video"],
    outputModalities: ["text"],
    lifecycle: "preview",
    sourceURL: "https://ai.google.dev/gemini-api/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gemini-3-flash-preview",
    provider: "gemini",
    displayName: "Gemini 3 Flash Preview",
    description: "Experimental fast inference engine with low latency.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true
    },
    contextWindow: 524288,
    maxOutputTokens: 16384,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "preview",
    sourceURL: "https://ai.google.dev/gemini-api/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "gemini-embedding-001",
    provider: "gemini",
    displayName: "Gemini Embedding 001",
    description: "Text embedding model optimized for retrieval and semantic search (not a chat model).",
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true,
      tools: false
    },
    contextWindow: 2048,
    maxOutputTokens: 0,
    inputModalities: ["text"],
    outputModalities: ["embeddings"],
    lifecycle: "stable",
    sourceURL: "https://ai.google.dev/gemini-api/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/anthropic.ts
var ANTHROPIC_MODELS = [
  {
    id: "claude-3-7-sonnet-20250219",
    provider: "anthropic",
    displayName: "Claude 3.7 Sonnet",
    description: "Hybrid reasoning and standard model with dynamic thinking control and tool use.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      reasoning: true
    },
    contextWindow: 2e5,
    maxOutputTokens: 64e3,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.anthropic.com/en/docs/about-claude/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    displayName: "Claude 3.5 Sonnet v2",
    description: "High intelligence and industry-standard coding performance.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true
    },
    contextWindow: 2e5,
    maxOutputTokens: 8192,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.anthropic.com/en/docs/about-claude/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "claude-3-5-haiku-20241022",
    provider: "anthropic",
    displayName: "Claude 3.5 Haiku",
    description: "Fastest model for high-throughput lightweight tasks.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 2e5,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.anthropic.com/en/docs/about-claude/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/xai.ts
var XAI_MODELS = [
  {
    id: "grok-4.7",
    provider: "xai",
    displayName: "Grok 4.7",
    description: "Frontier reasoning and real-time knowledge model by xAI.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      webSearch: true,
      reasoning: true
    },
    contextWindow: 131072,
    maxOutputTokens: 16384,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.x.ai/developers/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "grok-4.7-latest",
    provider: "xai",
    displayName: "Grok 4.7 Latest Alias",
    description: "Pointer alias pointing to the most up-to-date Grok 4.7 checkpoint.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      reasoning: true
    },
    contextWindow: 131072,
    maxOutputTokens: 16384,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    aliasOf: "grok-4.7",
    sourceURL: "https://docs.x.ai/developers/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "grok-4.5",
    provider: "xai",
    displayName: "Grok 4.5",
    description: "High-speed reasoning model with strong coding and instruction following.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.x.ai/developers/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "grok-4.5-latest",
    provider: "xai",
    displayName: "Grok 4.5 Latest Alias",
    description: "Pointer alias for the latest Grok 4.5 release.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    aliasOf: "grok-4.5",
    sourceURL: "https://docs.x.ai/developers/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "grok-4.3",
    provider: "xai",
    displayName: "Grok 4.3",
    description: "Balanced low-latency Grok model.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.x.ai/developers/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/groq.ts
var GROQ_MODELS = [
  {
    id: "openai/gpt-oss-120b",
    provider: "groq",
    displayName: "GPT-OSS 120B (Groq LPU)",
    description: "High-parameter open-weight reasoning model running at blazing tokens-per-second on Groq LPUs.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://console.groq.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "openai/gpt-oss-20b",
    provider: "groq",
    displayName: "GPT-OSS 20B (Groq LPU)",
    description: "Extremely fast 20B reasoning model delivering 600+ tokens per second.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://console.groq.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "openai/gpt-oss-safeguard-20b",
    provider: "groq",
    displayName: "GPT-OSS Safeguard 20B",
    description: "Safety-aligned moderation and guardrail model running on Groq hardware.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: false,
      structuredOutput: true
    },
    contextWindow: 32768,
    maxOutputTokens: 2048,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://console.groq.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "qwen/qwen3.8-27b",
    provider: "groq",
    displayName: "Qwen 3.8 27B (Groq LPU)",
    description: "High-capability multilingual model hosted on Groq inference cloud.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://console.groq.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "minimaxai/minimax-m2.7",
    provider: "groq",
    displayName: "MiniMax M2.7 (Groq LPU)",
    description: "Low-latency conversational and agent model served on Groq architecture.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://console.groq.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/deepseek.ts
var DEEPSEEK_MODELS = [
  {
    id: "deepseek-flash",
    provider: "deepseek",
    displayName: "DeepSeek Flash",
    description: "High-speed reasoning and code completion model via official DeepSeek API.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://api-docs.deepseek.com/api/list-models/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "deepseek-v4-pro",
    provider: "deepseek",
    displayName: "DeepSeek V4 Pro",
    description: "Frontier reasoning and mathematics powerhouse with deep thought generation.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 16384,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://api-docs.deepseek.com/api/list-models/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/qwen.ts
var QWEN_MODELS = [
  {
    id: "qwen3.8-max",
    provider: "qwen",
    displayName: "Qwen 3.8 Max",
    description: "Flagship multilingual reasoning and complex instruction-following model.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      vision: true,
      reasoning: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://www.alibabacloud.com/help/en/model-studio/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "qwen3.8-flash",
    provider: "qwen",
    displayName: "Qwen 3.8 Flash",
    description: "High-speed model optimized for real-time customer service and interactive chat.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://www.alibabacloud.com/help/en/model-studio/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "qwen3.7-plus",
    provider: "qwen",
    displayName: "Qwen 3.7 Plus",
    description: "Balanced performance and cost model for analytical and workflow automation tasks.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://www.alibabacloud.com/help/en/model-studio/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "qwen3.8-27b",
    provider: "qwen",
    displayName: "Qwen 3.8 27B",
    description: "High-efficiency 27B parameter dense architecture model.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://www.alibabacloud.com/help/en/model-studio/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "qwen3-coder-flash",
    provider: "qwen",
    displayName: "Qwen 3 Coder Flash",
    description: "Specialized low-latency code generation and software engineering assistant.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 131072,
    maxOutputTokens: 16384,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://www.alibabacloud.com/help/en/model-studio/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/zai.ts
var ZAI_MODELS = [
  {
    id: "glm-5.3",
    provider: "zai",
    displayName: "GLM 5.3",
    description: "Frontier bilingual Chinese-English flagship model with tool integration and agent capabilities.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      webSearch: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.z.ai/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "glm-5.3-flash",
    provider: "zai",
    displayName: "GLM 5.3 Flash",
    description: "Ultra-fast low cost GLM variant for production APIs.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.z.ai/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "glm-5.2",
    provider: "zai",
    displayName: "GLM 5.2",
    description: "High reliability general purpose conversational model.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.z.ai/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "glm-5.1",
    provider: "zai",
    displayName: "GLM 5.1",
    description: "Previous stable release for long-context document analysis.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.z.ai/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "glm-4.7",
    provider: "zai",
    displayName: "GLM 4.7 Legacy Stable",
    description: "Battle-tested legacy GLM checkpoint for backward compatibility.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 32768,
    maxOutputTokens: 2048,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.z.ai/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/huggingface.ts
var HUGGINGFACE_MODELS = [
  {
    id: "deepseek-ai/DeepSeek-V4.1-Flash-1017",
    provider: "huggingface",
    displayName: "DeepSeek V4.1 Flash (HF Repo)",
    description: "Hugging Face Hub repository for DeepSeek V4.1 Flash architecture.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/inference/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "meta-models/Muse-Spark-Open-816B-A42B",
    provider: "huggingface",
    displayName: "Muse Spark Open 816B A42B",
    description: "Extreme-scale open MoE architecture repository requiring dedicated inference endpoints.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      reasoning: true
    },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "preview",
    sourceURL: "https://huggingface.co/inference/models",
    verifiedAt: "2026-10-21",
    availability: "deployment"
  },
  {
    id: "Qwen/Qwen3.8-27B",
    provider: "huggingface",
    displayName: "Qwen 3.8 27B Hub Repo",
    description: "Community and dedicated inference container for Qwen 3.8 27B.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/inference/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "zai-org/GLM-5.3",
    provider: "huggingface",
    displayName: "GLM 5.3 Hub Repo",
    description: "Hugging Face hub weights and inference provider endpoints for GLM 5.3.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/inference/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "openai/gpt-oss-120b",
    provider: "huggingface",
    displayName: "GPT-OSS 120B Hub Repo",
    description: "Weights repository for open-weight GPT-OSS 120B.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 16384,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/inference/models",
    verifiedAt: "2026-10-21",
    availability: "deployment"
  }
];

// src/models/catalog/ollama.ts
var OLLAMA_MODELS = [
  {
    id: "gpt-oss:20b",
    provider: "ollama",
    displayName: "GPT-OSS 20B (Local)",
    description: "Local 20B reasoning model requiring ~12GB VRAM. Fast local inference.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ollama.com/library",
    verifiedAt: "2026-10-21",
    availability: "local"
  },
  {
    id: "gpt-oss:120b",
    provider: "ollama",
    displayName: "GPT-OSS 120B (Local)",
    description: "High-parameter local model requiring ~64GB unified memory / multi-GPU setup.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ollama.com/library",
    verifiedAt: "2026-10-21",
    availability: "local"
  },
  {
    id: "qwen3-coder:30b",
    provider: "ollama",
    displayName: "Qwen 3 Coder 30B (Local)",
    description: "Local code generation and refactoring powerhouse requiring ~18GB VRAM.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 65536,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ollama.com/library",
    verifiedAt: "2026-10-21",
    availability: "local"
  },
  {
    id: "mistral-small3.2:24b",
    provider: "ollama",
    displayName: "Mistral Small 3.2 24B (Local)",
    description: "Compact reasoning model with high benchmark scores, requiring ~14GB VRAM.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 32768,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ollama.com/library",
    verifiedAt: "2026-10-21",
    availability: "local"
  },
  {
    id: "gemma3n:e4b",
    provider: "ollama",
    displayName: "Gemma 3N E4B (Local Lightweight)",
    description: "Ultra-lightweight 4B model running comfortably on 4GB CPU/RAM.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: false,
      structuredOutput: true
    },
    contextWindow: 16384,
    maxOutputTokens: 2048,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://ollama.com/library",
    verifiedAt: "2026-10-21",
    availability: "local"
  }
];

// src/models/catalog/transformers-js.ts
var TRANSFORMERS_JS_MODELS = [
  {
    id: "onnx-community/Phi-3.5-mini-instruct",
    provider: "transformers-js",
    displayName: "Phi-3.5 Mini Instruct (ONNX Browser)",
    description: "Runs directly in modern browsers via Transformers.js with WebGPU / WASM execution.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: false,
      structuredOutput: false
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/docs/transformers.js",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "onnx-community/Llama-3.2-1B-Instruct",
    provider: "transformers-js",
    displayName: "Llama 3.2 1B Instruct (ONNX Browser)",
    description: "Compact 1B instruction-tuned model running fully client-side.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: false
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/docs/transformers.js",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "onnx-community/SmolLM2-1.7B-Instruct",
    provider: "transformers-js",
    displayName: "SmolLM2 1.7B Instruct (ONNX Browser)",
    description: "Hugging Face SmolLM2 1.7B parameter browser-native model.",
    capabilities: {
      chat: true,
      streaming: true
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/docs/transformers.js",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "onnx-community/SmolLM2-360M-Instruct",
    provider: "transformers-js",
    displayName: "SmolLM2 360M Instruct (Lightweight Browser)",
    description: "Ultra-small 360M parameter model for fast browser execution even on low-end hardware.",
    capabilities: {
      chat: true,
      streaming: true
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/docs/transformers.js",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "mixedbread-ai/mxbai-embed-xsmall-v1",
    provider: "transformers-js",
    displayName: "MixedBread Embed XSmall V1 (Browser Embedding)",
    description: "Browser-executable embedding model for 100% client-side vector search and RAG.",
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true
    },
    contextWindow: 512,
    maxOutputTokens: 0,
    inputModalities: ["text"],
    outputModalities: ["embeddings"],
    lifecycle: "stable",
    sourceURL: "https://huggingface.co/docs/transformers.js",
    verifiedAt: "2026-10-21",
    availability: "browser"
  }
];

// src/models/catalog/webllm.ts
var WEBLLM_MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    provider: "webllm",
    displayName: "Llama 3.2 1B Instruct (q4f32_1 MLC)",
    description: "WebGPU-accelerated prebuilt MLC model for browser execution.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: false
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://github.com/mlc-ai/web-llm",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    provider: "webllm",
    displayName: "Llama 3.2 1B Instruct (q4f16_1 MLC)",
    description: "16-bit float WebGPU optimized variant for supported GPUs.",
    capabilities: {
      chat: true,
      streaming: true
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://github.com/mlc-ai/web-llm",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    provider: "webllm",
    displayName: "Llama 3.2 3B Instruct (q4f16_1 MLC)",
    description: "Higher quality 3B model requiring WebGPU with at least 3GB VRAM buffer.",
    capabilities: {
      chat: true,
      streaming: true
    },
    contextWindow: 4096,
    maxOutputTokens: 1024,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://github.com/mlc-ai/web-llm",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    provider: "webllm",
    displayName: "SmolLM2 1.7B Instruct (q4f16_1 MLC)",
    description: "Fast responsive browser model for chat assistants.",
    capabilities: {
      chat: true,
      streaming: true
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://github.com/mlc-ai/web-llm",
    verifiedAt: "2026-10-21",
    availability: "browser"
  },
  {
    id: "SmolLM2-360M-Instruct-q0f16-MLC",
    provider: "webllm",
    displayName: "SmolLM2 360M Instruct (q0f16 MLC)",
    description: "Ultra-low footprint MLC model for quick browser initialization.",
    capabilities: {
      chat: true,
      streaming: true
    },
    contextWindow: 2048,
    maxOutputTokens: 512,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://github.com/mlc-ai/web-llm",
    verifiedAt: "2026-10-21",
    availability: "browser"
  }
];

// src/models/catalog/mistral.ts
var MISTRAL_MODELS = [
  {
    id: "mistral-large-2411",
    provider: "mistral",
    displayName: "Mistral Large 2411",
    description: "Flagship reasoning and multilingual model by Mistral AI.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true,
      reasoning: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.mistral.ai/getting-started/models/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "codestral-2501",
    provider: "mistral",
    displayName: "Codestral 2501",
    description: "Specialized generative AI model for code generation and completion.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 256e3,
    maxOutputTokens: 8192,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.mistral.ai/getting-started/models/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "mistral-embed",
    provider: "mistral",
    displayName: "Mistral Embed",
    description: "Embedding model for semantic search and retrieval.",
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true
    },
    contextWindow: 8192,
    maxOutputTokens: 0,
    inputModalities: ["text"],
    outputModalities: ["embeddings"],
    lifecycle: "stable",
    sourceURL: "https://docs.mistral.ai/getting-started/models/",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/cohere.ts
var COHERE_MODELS = [
  {
    id: "command-r-plus-08-2024",
    provider: "cohere",
    displayName: "Command R+ (08-2024)",
    description: "Enterprise grade model optimized for complex RAG workflows and multi-step tool use.",
    capabilities: {
      chat: true,
      streaming: true,
      tools: true,
      structuredOutput: true
    },
    contextWindow: 128e3,
    maxOutputTokens: 4096,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.cohere.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "embed-multilingual-v3.0",
    provider: "cohere",
    displayName: "Cohere Embed Multilingual v3.0",
    description: "Multilingual embedding model across 100+ languages.",
    capabilities: {
      chat: false,
      streaming: false,
      embeddings: true
    },
    contextWindow: 512,
    maxOutputTokens: 0,
    inputModalities: ["text"],
    outputModalities: ["embeddings"],
    lifecycle: "stable",
    sourceURL: "https://docs.cohere.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  },
  {
    id: "rerank-v3.5",
    provider: "cohere",
    displayName: "Cohere Rerank v3.5",
    description: "State-of-the-art semantic reranking model for RAG pipelines.",
    capabilities: {
      chat: false,
      streaming: false,
      reranking: true
    },
    contextWindow: 4096,
    maxOutputTokens: 0,
    inputModalities: ["text"],
    outputModalities: ["text"],
    lifecycle: "stable",
    sourceURL: "https://docs.cohere.com/docs/models",
    verifiedAt: "2026-10-21",
    availability: "hosted"
  }
];

// src/models/catalog/index.ts
var BUNDLED_MODEL_CATALOG = [
  ...OPENAI_MODELS,
  ...GEMINI_MODELS,
  ...ANTHROPIC_MODELS,
  ...XAI_MODELS,
  ...GROQ_MODELS,
  ...DEEPSEEK_MODELS,
  ...QWEN_MODELS,
  ...ZAI_MODELS,
  ...HUGGINGFACE_MODELS,
  ...OLLAMA_MODELS,
  ...TRANSFORMERS_JS_MODELS,
  ...WEBLLM_MODELS,
  ...MISTRAL_MODELS,
  ...COHERE_MODELS
];

// src/models/registry.ts
var ModelRegistry = class {
  constructor() {
    this.models = /* @__PURE__ */ new Map();
    this.loadBundledCatalog();
  }
  loadBundledCatalog() {
    for (const model of BUNDLED_MODEL_CATALOG) {
      this.registerModel(model);
    }
  }
  registerModel(model) {
    const key = this.getKey(model.id, model.provider);
    this.models.set(key, model);
    if (!this.models.has(model.id)) {
      this.models.set(model.id, model);
    }
  }
  getModelInfo(modelId, provider) {
    const resolvedId = resolveModelAlias(modelId, provider);
    if (provider) {
      const key = this.getKey(resolvedId, provider);
      if (this.models.has(key)) return this.models.get(key);
    }
    if (this.models.has(resolvedId)) {
      return this.models.get(resolvedId);
    }
    for (const [_, model] of this.models) {
      if (model.id.toLowerCase() === resolvedId.toLowerCase()) {
        if (!provider || model.provider === provider) {
          return model;
        }
      }
    }
    return void 0;
  }
  listModels(filter = {}) {
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    for (const [key, model] of this.models) {
      const uniqueKey = `${model.provider}:${model.id}`;
      if (seen.has(uniqueKey)) continue;
      if (filter.provider && model.provider !== filter.provider) {
        continue;
      }
      if (filter.availability && model.availability !== filter.availability) {
        continue;
      }
      if (filter.lifecycle && model.lifecycle !== filter.lifecycle) {
        continue;
      }
      if (filter.capability) {
        const cap = filter.capability;
        if (!model.capabilities || !model.capabilities[cap]) {
          continue;
        }
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesId = model.id.toLowerCase().includes(query);
        const matchesName = model.displayName?.toLowerCase().includes(query) ?? false;
        const matchesDesc = model.description?.toLowerCase().includes(query) ?? false;
        if (!matchesId && !matchesName && !matchesDesc) {
          continue;
        }
      }
      seen.add(uniqueKey);
      results.push(model);
    }
    return results;
  }
  hasCapability(modelId, capability, provider) {
    const info = this.getModelInfo(modelId, provider);
    if (!info) return false;
    return Boolean(info.capabilities && info.capabilities[capability]);
  }
  getKey(id, provider) {
    return `${provider}:${id}`;
  }
};
var defaultModelRegistry = new ModelRegistry();
function listModels(filter) {
  return defaultModelRegistry.listModels(filter);
}
function getModelInfo(modelId, provider) {
  return defaultModelRegistry.getModelInfo(modelId, provider);
}
/**
 * @license MIT
 * Makron.js Model Catalog Types
 */
/**
 * @license MIT
 * Makron.js Model Aliases
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
 * Makron.js JSON Parsing Utilities
 */
/**
 * @license MIT
 * Makron.js Universal Fetch & Transport
 */
/**
 * @license MIT
 * Makron.js Live Model Discovery
 */
/**
 * @license MIT
 * Makron.js OpenAI Model Catalog
 * Source: https://platform.openai.com/docs/models
 */
/**
 * @license MIT
 * Makron.js Google Gemini Model Catalog
 * Source: https://ai.google.dev/gemini-api/docs/models
 */
/**
 * @license MIT
 * Makron.js Anthropic Claude Model Catalog
 * Source: https://docs.anthropic.com/en/docs/about-claude/models
 */
/**
 * @license MIT
 * Makron.js xAI Grok Model Catalog
 * Source: https://docs.x.ai/developers/models
 */
/**
 * @license MIT
 * Makron.js Groq Model Catalog
 * Source: https://console.groq.com/docs/models
 */
/**
 * @license MIT
 * Makron.js DeepSeek Model Catalog
 * Note: Authoritative seed list strictly matching current official DeepSeek API endpoints.
 * Sources: https://api-docs.deepseek.com/api/list-models/, https://api-docs.deepseek.com/guides/search_fetch
 */
/**
 * @license MIT
 * Makron.js Alibaba Cloud Model Studio / Qwen Catalog
 * Sources: https://www.alibabacloud.com/help/en/model-studio/models
 */
/**
 * @license MIT
 * Makron.js Z.ai / GLM Model Catalog
 * Sources: https://docs.z.ai/
 */
/**
 * @license MIT
 * Makron.js Hugging Face Repository Catalog
 * Note: These are model repository candidates, not guarantees that every Hugging Face inference provider serves them.
 * Sources: https://huggingface.co/inference/models, https://huggingface.co/docs/hub/models-inference
 */
/**
 * @license MIT
 * Makron.js Ollama Local Model Catalog
 * Source: https://ollama.com/library
 */
/**
 * @license MIT
 * Makron.js Transformers.js Browser Runtime Catalog
 * Source: https://huggingface.co/docs/transformers.js
 */
/**
 * @license MIT
 * Makron.js WebLLM Prebuilt Catalog
 * Source: https://github.com/mlc-ai/web-llm
 */
/**
 * @license MIT
 * Makron.js Mistral AI Model Catalog
 * Source: https://docs.mistral.ai/getting-started/models/
 */
/**
 * @license MIT
 * Makron.js Cohere Model Catalog
 * Source: https://docs.cohere.com/docs/models
 */
/**
 * @license MIT
 * Makron.js Consolidated Model Catalog
 */
/**
 * @license MIT
 * Makron.js Model Registry
 */
/**
 * @license MIT
 * Makron.js Model Catalog and Registry Entry Point
 */

export { ANTHROPIC_MODELS, BUNDLED_MODEL_CATALOG, COHERE_MODELS, DEEPSEEK_MODELS, DEFAULT_MODEL_ALIASES, GEMINI_MODELS, GROQ_MODELS, HUGGINGFACE_MODELS, MISTRAL_MODELS, ModelRegistry, OLLAMA_MODELS, OPENAI_MODELS, QWEN_MODELS, TRANSFORMERS_JS_MODELS, WEBLLM_MODELS, XAI_MODELS, ZAI_MODELS, defaultModelRegistry, discoverModels, getModelInfo, listModels, resolveModelAlias };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map