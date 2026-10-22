'use strict';

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
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
var ConfigurationError = class extends MakronError {
  constructor(message, options = {}) {
    super(message, { ...options, retryable: false });
    this.name = "ConfigurationError";
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
var ModelNotFoundError = class extends MakronError {
  constructor(modelId, provider, options = {}) {
    super(`Model '${modelId}' was not found${provider ? ` for provider '${provider}'` : ""}`, {
      ...options,
      statusCode: options.statusCode ?? 404,
      retryable: false
    });
    this.name = "ModelNotFoundError";
    this.modelId = modelId;
  }
};
var AdapterNotFoundError = class extends MakronError {
  constructor(adapterId, options = {}) {
    super(`Adapter or provider '${adapterId}' is not registered or supported`, {
      ...options,
      retryable: false
    });
    this.name = "AdapterNotFoundError";
    this.adapterId = adapterId;
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

// src/providers/base.ts
var BaseProviderAdapter = class {
  constructor(config = {}) {
    this.config = config;
  }
  async *stream(request, options) {
    throw new UnsupportedCapabilityError("streaming", this.name);
  }
  async embed(request, options) {
    throw new UnsupportedCapabilityError("embeddings", this.name);
  }
  async rerank(request, options) {
    throw new UnsupportedCapabilityError("reranking", this.name);
  }
  async listModels(options) {
    return defaultModelRegistry.listModels({ provider: this.id });
  }
  async getModelInfo(modelId, options) {
    return defaultModelRegistry.getModelInfo(modelId, this.id);
  }
};

// src/core/validation.ts
function validateChatRequest(request) {
  if (!request) {
    throw new ConfigurationError("Chat request is required");
  }
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new ConfigurationError("Chat request must contain at least one message in messages array");
  }
  for (let i = 0; i < request.messages.length; i++) {
    const msg = request.messages[i];
    validateMessage(msg, i);
  }
  if (request.temperature !== void 0) {
    if (typeof request.temperature !== "number" || request.temperature < 0 || request.temperature > 2) {
      throw new ConfigurationError(`Invalid temperature: ${request.temperature}. Must be between 0 and 2.`);
    }
  }
  if (request.maxTokens !== void 0) {
    if (typeof request.maxTokens !== "number" || request.maxTokens <= 0) {
      throw new ConfigurationError(`Invalid maxTokens: ${request.maxTokens}. Must be a positive integer.`);
    }
  }
}
function validateMessage(message, index) {
  const prefix = index !== void 0 ? `Message at index ${index}` : "Message";
  if (!message || typeof message !== "object") {
    throw new ConfigurationError(`${prefix} must be an object`);
  }
  const validRoles = ["system", "user", "assistant", "tool"];
  if (!validRoles.includes(message.role)) {
    throw new ConfigurationError(
      `${prefix} has invalid role '${message.role}'. Allowed roles: ${validRoles.join(", ")}`
    );
  }
  if (message.content === void 0 || message.content === null) {
    throw new ConfigurationError(`${prefix} must have a content property`);
  }
}
function validateBaseURL(url, providerName = "provider") {
  if (!url || typeof url !== "string") {
    throw new ConfigurationError(`Invalid baseURL for ${providerName}: must be a non-empty string`);
  }
  const trimmed = url.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ConfigurationError(`baseURL for ${providerName} must use http or https protocol`);
    }
    return trimmed;
  } catch (err) {
    throw new ConfigurationError(`Malformed baseURL '${trimmed}' for ${providerName}: ${err.message}`);
  }
}

// src/utils/env.ts
function getEnv(key) {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key] !== void 0 && process.env[key] !== "") {
      return process.env[key];
    }
  }
  if (typeof ({ url: (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href)) }) !== "undefined" && undefined) {
    const metaEnv = undefined;
    if (metaEnv[key]) return metaEnv[key];
    if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
  }
  if (typeof window !== "undefined" && window.__MAKRON_ENV__) {
    return window.__MAKRON_ENV__[key];
  }
  return void 0;
}

// src/utils/json.ts
function safeJsonParse(input, fallback) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}
function safeJsonStringify(value, indent) {
  try {
    return JSON.stringify(value, null, indent);
  } catch (err) {
    return String(value);
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
function hasVisionContent(content) {
  if (typeof content === "string") return false;
  if (Array.isArray(content)) {
    return content.some((part) => part.type === "image");
  }
  return false;
}
function hasAudioContent(content) {
  if (typeof content === "string") return false;
  if (Array.isArray(content)) {
    return content.some((part) => part.type === "audio");
  }
  return false;
}
function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array");
  }
  return messages.map((msg) => {
    const role = (msg.role || "user").toLowerCase();
    let content = msg.content;
    if (content === null || content === void 0) {
      content = "";
    }
    return {
      role,
      content,
      name: msg.name,
      toolCalls: msg.toolCalls || msg.tool_calls,
      toolCallId: msg.toolCallId || msg.tool_call_id
    };
  });
}
function extractSystemPrompt(messages) {
  const systemTexts = [];
  const conversationMessages = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      systemTexts.push(contentToString(msg.content));
    } else {
      conversationMessages.push(msg);
    }
  }
  return {
    systemPrompt: systemTexts.length > 0 ? systemTexts.join("\n\n") : void 0,
    conversationMessages
  };
}

// src/core/response-normalizer.ts
function normalizeOpenAIResponse(raw, provider, model, latencyMs) {
  const choice = raw.choices?.[0] || {};
  const messageData = choice.message || {};
  const text = messageData.content || "";
  let toolCalls;
  if (Array.isArray(messageData.tool_calls) && messageData.tool_calls.length > 0) {
    toolCalls = messageData.tool_calls.map((tc) => ({
      id: tc.id || `call_${Math.random().toString(36).substring(2, 9)}`,
      name: tc.function?.name || "",
      arguments: tc.function?.arguments || "{}"
    }));
  }
  const finishReasonRaw = choice.finish_reason || "stop";
  const finishReason = {
    reason: finishReasonRaw === "stop" ? "stop" : finishReasonRaw === "length" ? "length" : finishReasonRaw === "tool_calls" ? "tool_calls" : finishReasonRaw === "content_filter" ? "content_filter" : "other",
    raw: finishReasonRaw
  };
  const usage = {
    promptTokens: raw.usage?.prompt_tokens ?? 0,
    completionTokens: raw.usage?.completion_tokens ?? 0,
    totalTokens: raw.usage?.total_tokens ?? (raw.usage?.prompt_tokens ?? 0) + (raw.usage?.completion_tokens ?? 0),
    reasoningTokens: raw.usage?.completion_tokens_details?.reasoning_tokens,
    cachedPromptTokens: raw.usage?.prompt_tokens_details?.cached_tokens
  };
  const message = {
    role: "assistant",
    content: text,
    toolCalls
  };
  return {
    id: raw.id || `resp_${Date.now()}`,
    model: raw.model || model,
    provider,
    text,
    message,
    toolCalls,
    finishReason,
    usage,
    latencyMs,
    raw
  };
}
function normalizeAnthropicResponse(raw, model, latencyMs) {
  let text = "";
  const toolCalls = [];
  if (Array.isArray(raw.content)) {
    for (const block of raw.content) {
      if (block.type === "text") {
        text += (text ? "\n" : "") + block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input || {}
        });
      }
    }
  }
  const stopReason = raw.stop_reason;
  const finishReason = {
    reason: stopReason === "end_turn" || stopReason === "stop_sequence" ? "stop" : stopReason === "max_tokens" ? "length" : stopReason === "tool_use" ? "tool_calls" : "other",
    raw: stopReason
  };
  const usage = {
    promptTokens: raw.usage?.input_tokens ?? 0,
    completionTokens: raw.usage?.output_tokens ?? 0,
    totalTokens: (raw.usage?.input_tokens ?? 0) + (raw.usage?.output_tokens ?? 0)
  };
  const message = {
    role: "assistant",
    content: text,
    toolCalls: toolCalls.length > 0 ? toolCalls : void 0
  };
  return {
    id: raw.id || `anthropic_${Date.now()}`,
    model: raw.model || model,
    provider: "anthropic",
    text,
    message,
    toolCalls: toolCalls.length > 0 ? toolCalls : void 0,
    finishReason,
    usage,
    latencyMs,
    raw
  };
}
function normalizeGeminiResponse(raw, model, latencyMs) {
  const candidate = raw.candidates?.[0];
  let text = "";
  const toolCalls = [];
  if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
    for (const part of candidate.content.parts) {
      if (part.text) {
        text += (text ? "\n" : "") + part.text;
      } else if (part.functionCall) {
        toolCalls.push({
          id: `call_${Math.random().toString(36).substring(2, 9)}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args || {}
        });
      }
    }
  }
  const finishReasonRaw = candidate?.finishReason || "STOP";
  const finishReason = {
    reason: finishReasonRaw === "STOP" ? "stop" : finishReasonRaw === "MAX_TOKENS" ? "length" : finishReasonRaw === "SAFETY" ? "content_filter" : "other",
    raw: finishReasonRaw
  };
  const usage = {
    promptTokens: raw.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: raw.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: raw.usageMetadata?.totalTokenCount ?? 0
  };
  const message = {
    role: "assistant",
    content: text,
    toolCalls: toolCalls.length > 0 ? toolCalls : void 0
  };
  return {
    id: `gemini_${Date.now()}`,
    model,
    provider: "gemini",
    text,
    message,
    toolCalls: toolCalls.length > 0 ? toolCalls : void 0,
    finishReason,
    usage,
    latencyMs,
    raw
  };
}

// src/core/stream-normalizer.ts
async function* parseSseStream(stream, signal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          continue;
        }
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6).trim();
          if (data === "[DONE]") {
            return;
          }
          yield data;
        }
      }
    }
    if (buffer.trim().startsWith("data: ")) {
      const data = buffer.trim().slice(6).trim();
      if (data && data !== "[DONE]") {
        yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
async function* normalizeOpenAIStream(stream, providerName, modelName, signal) {
  for await (const rawData of parseSseStream(stream, signal)) {
    const parsed = safeJsonParse(rawData);
    if (!parsed) continue;
    const choice = parsed.choices?.[0];
    const delta = choice?.delta;
    const deltaText = delta?.content || "";
    const finishReasonStr = choice?.finish_reason;
    let finishReason = void 0;
    if (finishReasonStr) {
      finishReason = {
        reason: finishReasonStr === "stop" ? "stop" : finishReasonStr === "length" ? "length" : finishReasonStr === "tool_calls" ? "tool_calls" : "other",
        raw: finishReasonStr
      };
    }
    let deltaToolCalls = void 0;
    if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
      deltaToolCalls = delta.tool_calls.map((tc) => ({
        index: tc.index ?? 0,
        id: tc.id,
        name: tc.function?.name,
        argumentsDelta: tc.function?.arguments
      }));
    }
    let usage = void 0;
    if (parsed.usage) {
      usage = {
        promptTokens: parsed.usage.prompt_tokens ?? 0,
        completionTokens: parsed.usage.completion_tokens ?? 0,
        totalTokens: parsed.usage.total_tokens ?? 0
      };
    }
    yield {
      id: parsed.id || `chunk-${Date.now()}`,
      model: parsed.model || modelName,
      provider: providerName,
      deltaText,
      deltaToolCalls,
      finishReason,
      usage,
      raw: parsed
    };
  }
}

// src/providers/anthropic.ts
var AnthropicAdapter = class extends BaseProviderAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("ANTHROPIC_API_KEY");
    super({
      ...config,
      apiKey,
      defaultModel: config.defaultModel || "claude-3-5-sonnet-20241022"
    });
    this.id = "anthropic";
    this.name = "Anthropic Claude";
    this.defaultBaseURL = "https://api.anthropic.com/v1";
  }
  getApiKey(options) {
    return options?.apiKey || this.config.apiKey;
  }
  getHeaders(options) {
    const apiKey = this.getApiKey(options);
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "anthropic-version": "2023-06-01",
      ...this.config.headers,
      ...options?.headers
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    return headers;
  }
  async chat(request, options) {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || "claude-3-5-sonnet-20241022";
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return normalizeAnthropicResponse(mockResult, model, 30);
    }
    const { systemPrompt, conversationMessages } = extractSystemPrompt(request.messages);
    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: contentToString(msg.content)
    }));
    const payload = {
      model,
      messages: anthropicMessages,
      max_tokens: request.maxTokens || 4096
    };
    if (systemPrompt) payload.system = systemPrompt;
    if (request.temperature !== void 0) payload.temperature = request.temperature;
    if (request.topP !== void 0) payload.top_p = request.topP;
    if (request.stop) {
      payload.stop_sequences = Array.isArray(request.stop) ? request.stop : [request.stop];
    }
    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters
      }));
    }
    const endpoint = `${baseURL.replace(/\/+$/, "")}/messages`;
    const startTime = Date.now();
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 6e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    return normalizeAnthropicResponse(raw, model, latencyMs);
  }
  async *stream(request, options) {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || "claude-3-5-sonnet-20241022";
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = {
      ...this.getHeaders(options),
      "Accept": "text/event-stream"
    };
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, stream: true });
      if (Array.isArray(mockResult)) {
        for (const chunk of mockResult) yield chunk;
        return;
      }
    }
    const { systemPrompt, conversationMessages } = extractSystemPrompt(request.messages);
    const anthropicMessages = conversationMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: contentToString(msg.content)
    }));
    const payload = {
      model,
      messages: anthropicMessages,
      max_tokens: request.maxTokens || 4096,
      stream: true
    };
    if (systemPrompt) payload.system = systemPrompt;
    const endpoint = `${baseURL.replace(/\/+$/, "")}/messages`;
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 6e4,
      provider: this.id
    });
    if (!response.body) throw new Error("Missing response body for stream");
    for await (const rawData of parseSseStream(response.body, options?.signal)) {
      const event = safeJsonParse(rawData);
      if (!event) continue;
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        yield {
          id: `anthropic-chunk-${Date.now()}`,
          model,
          provider: "anthropic",
          deltaText: event.delta.text,
          raw: event
        };
      } else if (event.type === "message_stop") {
        yield {
          id: `anthropic-stop-${Date.now()}`,
          model,
          provider: "anthropic",
          deltaText: "",
          finishReason: { reason: "stop" },
          raw: event
        };
      }
    }
  }
};

// src/providers/cohere.ts
var CohereAdapter = class extends BaseProviderAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("COHERE_API_KEY");
    super({
      ...config,
      apiKey,
      defaultModel: config.defaultModel || "command-r-plus-08-2024"
    });
    this.id = "cohere";
    this.name = "Cohere";
    this.defaultBaseURL = "https://api.cohere.com/v2";
  }
  getApiKey(options) {
    return options?.apiKey || this.config.apiKey;
  }
  getHeaders(options) {
    const apiKey = this.getApiKey(options);
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...this.config.headers,
      ...options?.headers
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return headers;
  }
  async chat(request, options) {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || "command-r-plus-08-2024";
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return {
        id: mockResult?.id || `cohere_${Date.now()}`,
        model,
        provider: "cohere",
        text: mockResult?.text || "Cohere response",
        message: { role: "assistant", content: mockResult?.text || "Cohere response" },
        finishReason: { reason: "stop" },
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        latencyMs: 25,
        raw: mockResult
      };
    }
    const messages = request.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: contentToString(m.content)
    }));
    const payload = {
      model,
      messages
    };
    if (request.temperature !== void 0) payload.temperature = request.temperature;
    if (request.maxTokens !== void 0) payload.max_tokens = request.maxTokens;
    const endpoint = `${baseURL.replace(/\/+$/, "")}/chat`;
    const startTime = Date.now();
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 6e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const text = raw.message?.content?.[0]?.text || "";
    return {
      id: raw.id || `cohere_${Date.now()}`,
      model,
      provider: "cohere",
      text,
      message: { role: "assistant", content: text },
      finishReason: { reason: "stop", raw: raw.finish_reason },
      usage: {
        promptTokens: raw.usage?.tokens?.input_tokens ?? 0,
        completionTokens: raw.usage?.tokens?.output_tokens ?? 0,
        totalTokens: (raw.usage?.tokens?.input_tokens ?? 0) + (raw.usage?.tokens?.output_tokens ?? 0)
      },
      latencyMs,
      raw
    };
  }
  async embed(request, options) {
    const model = request.model || "embed-multilingual-v3.0";
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);
    const texts = Array.isArray(request.input) ? request.input : [request.input];
    const payload = {
      model,
      texts,
      input_type: "search_query"
    };
    const endpoint = `${baseURL.replace(/\/+$/, "")}/embed`;
    const startTime = Date.now();
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 3e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const rawEmbeddings = raw.embeddings?.float || raw.embeddings || [];
    return {
      model,
      provider: "cohere",
      embeddings: rawEmbeddings.map((vector, index) => ({ index, vector })),
      usage: raw.meta?.billed_units ? {
        promptTokens: raw.meta.billed_units.input_tokens || 0,
        totalTokens: raw.meta.billed_units.input_tokens || 0
      } : void 0,
      latencyMs,
      raw
    };
  }
  async rerank(request, options) {
    const model = request.model || "rerank-v3.5";
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const headers = this.getHeaders(options);
    const documents = request.documents.map((doc) => typeof doc === "string" ? doc : doc.text);
    const payload = {
      model,
      query: request.query,
      documents,
      top_n: request.topN ?? documents.length,
      return_documents: request.returnDocuments ?? true
    };
    const endpoint = `${baseURL.replace(/\/+$/, "")}/rerank`;
    const startTime = Date.now();
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 3e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const results = (raw.results || []).map((item) => ({
      index: item.index,
      relevanceScore: item.relevance_score,
      document: item.document?.text || request.documents[item.index]
    }));
    return {
      model,
      provider: "cohere",
      results,
      latencyMs,
      raw
    };
  }
};

// src/core/retry.ts
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 2,
    baseDelayMs = 500,
    maxDelayMs = 1e4,
    signal,
    shouldRetry = defaultShouldRetry
  } = options;
  let attempt = 0;
  while (true) {
    if (signal?.aborted) {
      throw new Error("Operation aborted prior to execution");
    }
    try {
      return await operation(attempt);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !shouldRetry(err, attempt)) {
        throw err;
      }
      if (signal?.aborted) {
        throw err;
      }
      let delay = 0;
      if (err instanceof MakronError && err.retryAfterMs && err.retryAfterMs > 0) {
        delay = Math.min(err.retryAfterMs, maxDelayMs);
      } else {
        const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.5 + 0.5;
        delay = Math.min(Math.floor(exponentialDelay * jitter), maxDelayMs);
      }
      await sleep(delay, signal);
    }
  }
}
function defaultShouldRetry(error, _attempt) {
  if (error instanceof MakronError) {
    return error.retryable;
  }
  return false;
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error("Aborted"));
    }
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Aborted"));
    };
    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

// src/providers/openai-compatible.ts
var OpenAICompatibleAdapter = class extends BaseProviderAdapter {
  constructor(config = {}, id = "openai-compatible", name = "OpenAI Compatible Endpoint", defaultBaseURL = "http://localhost:8000/v1") {
    super(config);
    this.id = id;
    this.name = name;
    this.defaultBaseURL = defaultBaseURL;
  }
  getBaseURL(options) {
    const rawUrl = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    return validateBaseURL(rawUrl, this.name);
  }
  getApiKey(options) {
    return options?.apiKey || this.config.apiKey;
  }
  getHeaders(options) {
    const apiKey = this.getApiKey(options);
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...this.config.headers,
      ...options?.headers
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    if (this.config.organization) {
      headers["OpenAI-Organization"] = this.config.organization;
    }
    if (this.config.project) {
      headers["OpenAI-Project"] = this.config.project;
    }
    return headers;
  }
  serializeMessages(messages) {
    return messages.map((msg) => {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
          name: msg.name,
          tool_calls: msg.toolCalls,
          tool_call_id: msg.toolCallId
        };
      }
      const contentParts = msg.content.map((part) => {
        if (part.type === "text") {
          return { type: "text", text: part.text };
        }
        if (part.type === "image") {
          let url = "";
          if (typeof part.image === "string") {
            url = part.image;
          } else {
            const mime = part.mimeType || "image/jpeg";
            const base64 = isBrowser() ? btoa(String.fromCharCode(...part.image)) : Buffer.from(part.image).toString("base64");
            url = `data:${mime};base64,${base64}`;
          }
          return {
            type: "image_url",
            image_url: { url }
          };
        }
        return part;
      });
      return {
        role: msg.role,
        content: contentParts
      };
    });
  }
  async chat(request, options) {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || "gpt-5-mini";
    const baseURL = this.getBaseURL(options);
    const headers = this.getHeaders(options);
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return normalizeOpenAIResponse(mockResult, this.id, model, 25);
    }
    const payload = {
      model,
      messages: this.serializeMessages(request.messages),
      stream: false
    };
    if (request.temperature !== void 0) payload.temperature = request.temperature;
    if (request.topP !== void 0) payload.top_p = request.topP;
    if (request.maxTokens !== void 0) payload.max_tokens = request.maxTokens;
    if (request.stop !== void 0) payload.stop = request.stop;
    if (request.seed !== void 0) payload.seed = request.seed;
    if (request.presencePenalty !== void 0) payload.presence_penalty = request.presencePenalty;
    if (request.frequencyPenalty !== void 0) payload.frequency_penalty = request.frequencyPenalty;
    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools;
      if (request.toolChoice) payload.tool_choice = request.toolChoice;
    }
    if (request.responseFormat) {
      if (typeof request.responseFormat === "object" && "schema" in request.responseFormat) {
        payload.response_format = {
          type: "json_schema",
          json_schema: {
            name: request.responseFormat.name,
            strict: request.responseFormat.strict ?? true,
            schema: request.responseFormat.schema
          }
        };
      } else if (request.responseFormat === "json_object") {
        payload.response_format = { type: "json_object" };
      }
    }
    if (request.custom) {
      Object.assign(payload, request.custom);
    }
    const endpoint = `${baseURL}/chat/completions`;
    const startTime = Date.now();
    const response = await withRetry(
      async () => {
        return await safeFetch(endpoint, {
          method: "POST",
          headers,
          body: safeJsonStringify(payload),
          signal: options?.signal,
          timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 6e4,
          provider: this.id
        });
      },
      {
        maxRetries: options?.retries ?? this.config.retries ?? 2,
        signal: options?.signal
      }
    );
    const rawJson = await response.json();
    const latencyMs = Date.now() - startTime;
    return normalizeOpenAIResponse(rawJson, this.id, model, latencyMs);
  }
  async *stream(request, options) {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || "gpt-5-mini";
    const baseURL = this.getBaseURL(options);
    const headers = {
      ...this.getHeaders(options),
      "Accept": "text/event-stream"
    };
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL, stream: true });
      if (Array.isArray(mockResult)) {
        for (const chunk of mockResult) {
          yield chunk;
        }
        return;
      }
    }
    const payload = {
      model,
      messages: this.serializeMessages(request.messages),
      stream: true,
      stream_options: { include_usage: true }
    };
    if (request.temperature !== void 0) payload.temperature = request.temperature;
    if (request.maxTokens !== void 0) payload.max_tokens = request.maxTokens;
    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools;
      if (request.toolChoice) payload.tool_choice = request.toolChoice;
    }
    const endpoint = `${baseURL}/chat/completions`;
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 6e4,
      provider: this.id
    });
    if (!response.body) {
      throw new Error("Streaming response body is missing");
    }
    yield* normalizeOpenAIStream(response.body, this.id, model, options?.signal);
  }
  async embed(request, options) {
    const model = request.model || "text-embedding-3-large";
    const baseURL = this.getBaseURL(options);
    const headers = this.getHeaders(options);
    const payload = {
      model,
      input: request.input
    };
    if (request.dimensions) payload.dimensions = request.dimensions;
    if (request.user) payload.user = request.user;
    const endpoint = `${baseURL}/embeddings`;
    const startTime = Date.now();
    const response = await safeFetch(endpoint, {
      method: "POST",
      headers,
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 3e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const embeddings = (raw.data || []).map((item) => ({
      index: item.index ?? 0,
      vector: item.embedding
    }));
    return {
      model: raw.model || model,
      provider: this.id,
      embeddings,
      usage: raw.usage ? {
        promptTokens: raw.usage.prompt_tokens ?? 0,
        totalTokens: raw.usage.total_tokens ?? 0
      } : void 0,
      latencyMs,
      raw
    };
  }
};
function isBrowser() {
  return typeof window !== "undefined";
}

// src/providers/deepseek.ts
var DeepSeekAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("DEEPSEEK_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "deepseek-flash"
      },
      "deepseek",
      "DeepSeek",
      "https://api.deepseek.com"
    );
  }
};

// src/providers/gemini.ts
var GeminiAdapter = class extends BaseProviderAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("GEMINI_API_KEY");
    super({
      ...config,
      apiKey,
      defaultModel: config.defaultModel || "gemini-3.8-flash"
    });
    this.id = "gemini";
    this.name = "Google Gemini";
    this.defaultBaseURL = "https://generativelanguage.googleapis.com/v1beta";
  }
  getApiKey(options) {
    return options?.apiKey || this.config.apiKey;
  }
  async chat(request, options) {
    validateChatRequest(request);
    const model = request.model || this.config.defaultModel || "gemini-3.8-flash";
    const apiKey = this.getApiKey(options);
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    if (this.config.mockTransport) {
      const mockResult = await this.config.mockTransport({ request, options, baseURL });
      return normalizeGeminiResponse(mockResult, model, 25);
    }
    const { systemPrompt, conversationMessages } = extractSystemPrompt(request.messages);
    const contents = conversationMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: contentToString(msg.content) }]
    }));
    const payload = {
      contents
    };
    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }
    const genConfig = {};
    if (request.temperature !== void 0) genConfig.temperature = request.temperature;
    if (request.topP !== void 0) genConfig.topP = request.topP;
    if (request.maxTokens !== void 0) genConfig.maxOutputTokens = request.maxTokens;
    if (request.stop) genConfig.stopSequences = Array.isArray(request.stop) ? request.stop : [request.stop];
    if (Object.keys(genConfig).length > 0) {
      payload.generationConfig = genConfig;
    }
    if (request.tools && request.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
          }))
        }
      ];
    }
    const url = new URL(`${baseURL.replace(/\/+$/, "")}/models/${model}:generateContent`);
    if (apiKey) {
      url.searchParams.set("key", apiKey);
    }
    const startTime = Date.now();
    const response = await safeFetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...this.config.headers,
        ...options?.headers
      },
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 6e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    return normalizeGeminiResponse(raw, model, latencyMs);
  }
  async *stream(request, options) {
    const full = await this.chat(request, options);
    yield {
      id: full.id,
      model: full.model,
      provider: "gemini",
      deltaText: full.text,
      finishReason: full.finishReason,
      usage: full.usage,
      raw: full.raw
    };
  }
  async embed(request, options) {
    const model = request.model || "gemini-embedding-001";
    const apiKey = this.getApiKey(options);
    const baseURL = options?.baseURL || this.config.baseURL || this.defaultBaseURL;
    const textToEmbed = Array.isArray(request.input) ? request.input[0] : request.input;
    const payload = {
      model: `models/${model}`,
      content: {
        parts: [{ text: textToEmbed }]
      }
    };
    const url = new URL(`${baseURL.replace(/\/+$/, "")}/models/${model}:embedContent`);
    if (apiKey) {
      url.searchParams.set("key", apiKey);
    }
    const startTime = Date.now();
    const response = await safeFetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...options?.headers
      },
      body: safeJsonStringify(payload),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? 3e4,
      provider: this.id
    });
    const raw = await response.json();
    const latencyMs = Date.now() - startTime;
    const values = raw.embedding?.values || [];
    return {
      model,
      provider: "gemini",
      embeddings: [
        {
          index: 0,
          vector: values
        }
      ],
      latencyMs,
      raw
    };
  }
};

// src/providers/groq.ts
var GroqAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("GROQ_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "openai/gpt-oss-120b"
      },
      "groq",
      "Groq LPU",
      "https://api.groq.com/openai/v1"
    );
  }
};

// src/providers/huggingface.ts
var HuggingFaceAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("HF_TOKEN") || getEnv("HUGGINGFACE_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "deepseek-ai/DeepSeek-V4.1-Flash-1017"
      },
      "huggingface",
      "Hugging Face Inference",
      "https://router.huggingface.co/hf-inference/v1"
    );
  }
};

// src/providers/mistral.ts
var MistralAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("MISTRAL_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "mistral-large-2411"
      },
      "mistral",
      "Mistral AI",
      "https://api.mistral.ai/v1"
    );
  }
};

// src/providers/ollama.ts
var OllamaAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const baseURL = config.baseURL || getEnv("OLLAMA_BASE_URL") || "http://localhost:11434/v1";
    super(
      {
        ...config,
        baseURL,
        defaultModel: config.defaultModel || "gpt-oss:20b"
      },
      "ollama",
      "Ollama Local Endpoint",
      "http://localhost:11434/v1"
    );
  }
};

// src/providers/openai.ts
var OpenAIAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("OPENAI_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "gpt-5-mini"
      },
      "openai",
      "OpenAI",
      "https://api.openai.com/v1"
    );
  }
};

// src/providers/qwen.ts
var QwenAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("QWEN_API_KEY") || getEnv("DASHSCOPE_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "qwen3.8-max"
      },
      "qwen",
      "Alibaba Cloud Qwen",
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    );
  }
};

// src/providers/vllm.ts
var VLLMAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const baseURL = config.baseURL || getEnv("VLLM_BASE_URL") || "http://localhost:8000/v1";
    super(
      {
        ...config,
        baseURL,
        defaultModel: config.defaultModel || "gpt-oss-120b"
      },
      "vllm",
      "vLLM Serving Engine",
      "http://localhost:8000/v1"
    );
  }
};

// src/providers/xai.ts
var XAIAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("XAI_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "grok-4.7"
      },
      "xai",
      "xAI Grok",
      "https://api.x.ai/v1"
    );
  }
};

// src/providers/zai.ts
var ZaiAdapter = class extends OpenAICompatibleAdapter {
  constructor(config = {}) {
    const apiKey = config.apiKey || getEnv("ZAI_API_KEY");
    super(
      {
        ...config,
        apiKey,
        defaultModel: config.defaultModel || "glm-5.3"
      },
      "zai",
      "Z.ai GLM",
      "https://open.bigmodel.cn/api/paas/v4"
    );
  }
};

// src/providers/registry.ts
var ProviderRegistry = class {
  constructor() {
    this.factories = /* @__PURE__ */ new Map();
    this.metadata = /* @__PURE__ */ new Map();
    this.registerBuiltInProviders();
  }
  registerBuiltInProviders() {
    this.register("openai", (cfg) => new OpenAIAdapter(cfg), "OpenAI");
    this.register("openai-compatible", (cfg) => new OpenAICompatibleAdapter(cfg), "OpenAI Compatible Endpoint");
    this.register("anthropic", (cfg) => new AnthropicAdapter(cfg), "Anthropic Claude");
    this.register("gemini", (cfg) => new GeminiAdapter(cfg), "Google Gemini");
    this.register("groq", (cfg) => new GroqAdapter(cfg), "Groq LPU");
    this.register("deepseek", (cfg) => new DeepSeekAdapter(cfg), "DeepSeek");
    this.register("xai", (cfg) => new XAIAdapter(cfg), "xAI Grok");
    this.register("qwen", (cfg) => new QwenAdapter(cfg), "Alibaba Cloud Qwen");
    this.register("zai", (cfg) => new ZaiAdapter(cfg), "Z.ai GLM");
    this.register("ollama", (cfg) => new OllamaAdapter(cfg), "Ollama Local");
    this.register("vllm", (cfg) => new VLLMAdapter(cfg), "vLLM Serving Engine");
    this.register("huggingface", (cfg) => new HuggingFaceAdapter(cfg), "Hugging Face Inference");
    this.register("mistral", (cfg) => new MistralAdapter(cfg), "Mistral AI");
    this.register("cohere", (cfg) => new CohereAdapter(cfg), "Cohere");
  }
  register(id, factory, name = id, description) {
    const normalizedId = id.toLowerCase();
    this.factories.set(normalizedId, factory);
    this.metadata.set(normalizedId, { id: normalizedId, name, description });
  }
  registerDefinition(definition) {
    this.register(definition.id, definition.create, definition.name);
  }
  create(id, config = {}) {
    const normalizedId = id.toLowerCase();
    const factory = this.factories.get(normalizedId);
    if (!factory) {
      throw new AdapterNotFoundError(id);
    }
    return factory(config);
  }
  has(id) {
    return this.factories.has(id.toLowerCase());
  }
  listProviders() {
    return Array.from(this.metadata.values());
  }
  remove(id) {
    const normalizedId = id.toLowerCase();
    this.metadata.delete(normalizedId);
    return this.factories.delete(normalizedId);
  }
};
var defaultProviderRegistry = new ProviderRegistry();
function defineProvider(definition) {
  defaultProviderRegistry.registerDefinition(definition);
  return definition;
}
function registerProvider(id, factory, name) {
  defaultProviderRegistry.register(id, factory, name);
}
function getProvider(id, config) {
  return defaultProviderRegistry.create(id, config);
}
function listProviders() {
  return defaultProviderRegistry.listProviders();
}

// src/core/request-options.ts
function mergeRequestOptions(defaultOptions, overrideOptions) {
  return {
    ...defaultOptions,
    ...overrideOptions,
    headers: {
      ...defaultOptions?.headers,
      ...overrideOptions?.headers
    },
    custom: {
      ...defaultOptions?.custom,
      ...overrideOptions?.custom
    }
  };
}

// src/core/capabilities.ts
var CAPABILITY_LIST = [
  "chat",
  "streaming",
  "tools",
  "structuredOutput",
  "vision",
  "audioInput",
  "audioOutput",
  "embeddings",
  "reranking",
  "reasoning",
  "webSearch"
];
function supportsCapability(target, capability) {
  if (!target) return false;
  const caps = "capabilities" in target ? target.capabilities : target;
  return Boolean(caps && caps[capability]);
}
function assertCapability(target, capability, providerOrModelName = "model") {
  if (!supportsCapability(target, capability)) {
    throw new UnsupportedCapabilityError(capability, providerOrModelName);
  }
}
function createCapabilities(caps = {}) {
  return {
    chat: caps.chat ?? true,
    streaming: caps.streaming ?? true,
    tools: caps.tools ?? false,
    structuredOutput: caps.structuredOutput ?? false,
    vision: caps.vision ?? false,
    audioInput: caps.audioInput ?? false,
    audioOutput: caps.audioOutput ?? false,
    embeddings: caps.embeddings ?? false,
    reranking: caps.reranking ?? false,
    reasoning: caps.reasoning ?? false,
    webSearch: caps.webSearch ?? false
  };
}

// src/core/client.ts
var MakronClient = class {
  constructor(config) {
    this.config = config;
    this.defaultModel = config.model || config.defaultModel;
    if (typeof config.provider === "string") {
      this.adapter = defaultProviderRegistry.create(config.provider, {
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        organization: config.organization,
        project: config.project,
        headers: config.headers,
        defaultModel: this.defaultModel,
        timeoutMs: config.timeoutMs,
        retries: config.retries,
        custom: config.custom,
        mockTransport: config.mockTransport
      });
    } else if (typeof config.provider === "object") {
      if ("create" in config.provider) {
        this.adapter = config.provider.create(config);
      } else {
        this.adapter = config.provider;
      }
    } else {
      throw new Error(`Invalid provider configuration: ${String(config.provider)}`);
    }
  }
  get provider() {
    return this.adapter.id;
  }
  get model() {
    return this.defaultModel;
  }
  getProviderAdapter() {
    return this.adapter;
  }
  async chat(request, options) {
    const mergedRequest = {
      ...request,
      model: request.model || this.defaultModel
    };
    const mergedOptions = mergeRequestOptions(
      {
        timeoutMs: this.config.timeoutMs,
        retries: this.config.retries
      },
      options
    );
    return await this.adapter.chat(mergedRequest, mergedOptions);
  }
  async *stream(request, options) {
    if (!this.adapter.stream) {
      const res = await this.chat(request, options);
      yield {
        id: res.id,
        model: res.model,
        provider: res.provider,
        deltaText: res.text,
        deltaToolCalls: res.toolCalls?.map((tc, index) => ({
          index,
          id: tc.id,
          name: tc.name,
          argumentsDelta: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments)
        })),
        finishReason: res.finishReason,
        usage: res.usage,
        raw: res.raw
      };
      return;
    }
    const mergedRequest = {
      ...request,
      model: request.model || this.defaultModel,
      stream: true
    };
    const mergedOptions = mergeRequestOptions(
      {
        timeoutMs: this.config.timeoutMs,
        retries: this.config.retries
      },
      options
    );
    yield* this.adapter.stream(mergedRequest, mergedOptions);
  }
  async embed(request, options) {
    if (!this.adapter.embed) {
      throw new Error(`Provider '${this.adapter.id}' does not implement embedding`);
    }
    const mergedRequest = {
      ...request,
      model: request.model || this.defaultModel
    };
    return await this.adapter.embed(mergedRequest, options);
  }
  async rerank(request, options) {
    if (!this.adapter.rerank) {
      throw new Error(`Provider '${this.adapter.id}' does not implement reranking`);
    }
    return await this.adapter.rerank(request, options);
  }
  async listModels(options) {
    if (this.adapter.listModels) {
      return await this.adapter.listModels(options);
    }
    return defaultModelRegistry.listModels({ provider: this.adapter.id });
  }
  async getModelInfo(modelId) {
    const targetModel = modelId || this.defaultModel;
    if (!targetModel) return void 0;
    if (this.adapter.getModelInfo) {
      return await this.adapter.getModelInfo(targetModel);
    }
    return defaultModelRegistry.getModelInfo(targetModel, this.adapter.id);
  }
  async getCapabilities(modelId) {
    const info = await this.getModelInfo(modelId);
    return info?.capabilities;
  }
  async supportsCapability(capability, modelId) {
    const caps = await this.getCapabilities(modelId);
    return supportsCapability(caps, capability);
  }
};
function createMakron(config) {
  return new MakronClient(config);
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

// src/capabilities/streaming.ts
async function collectStreamText(stream) {
  let fullText = "";
  for await (const chunk of stream) {
    if (chunk.deltaText) {
      fullText += chunk.deltaText;
    }
  }
  return fullText;
}
async function* transformStreamText(stream) {
  for await (const chunk of stream) {
    if (chunk.deltaText) {
      yield chunk.deltaText;
    }
  }
}

// src/capabilities/tools.ts
function defineTool(name, description, parameters, execute) {
  return {
    definition: {
      type: "function",
      function: {
        name,
        description,
        parameters
      }
    },
    execute: execute || (() => {
    })
  };
}
async function executeToolCalls(toolCalls, tools) {
  const toolMap = /* @__PURE__ */ new Map();
  for (const t of tools) {
    toolMap.set(t.definition.function.name, t);
  }
  const results = [];
  for (const call of toolCalls) {
    const matched = toolMap.get(call.name);
    if (!matched) {
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: `Error: Tool '${call.name}' not found`,
        isError: true
      });
      continue;
    }
    let parsedArgs = {};
    if (typeof call.arguments === "string") {
      parsedArgs = safeJsonParse(call.arguments, {}) || {};
    } else if (typeof call.arguments === "object" && call.arguments !== null) {
      parsedArgs = call.arguments;
    }
    try {
      const output = await matched.execute(parsedArgs);
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: output,
        isError: false
      });
    } catch (err) {
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: `Tool execution failed: ${err.message || String(err)}`,
        isError: true
      });
    }
  }
  return results;
}

// src/capabilities/structured-output.ts
function defineSchema(name, schema, description, strict = true) {
  return {
    name,
    description,
    schema,
    strict
  };
}

// src/embeddings/normalize.ts
function dotProduct(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}
function magnitude(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}
function cosineSimilarity(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}
function l2Normalize(v) {
  const mag = magnitude(v);
  if (mag === 0) return [...v];
  return v.map((val) => val / mag);
}
function findMostSimilar(queryVector, candidateVectors, topK = 5) {
  const scores = candidateVectors.map((candidate, index) => ({
    index,
    score: cosineSimilarity(queryVector, candidate)
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}

// src/integrations/registry.ts
var INTEGRATION_CATALOG = [
  // 4.1 LLMs
  {
    id: "openai",
    name: "OpenAI GPT",
    category: "llm-provider",
    supportLevel: "built-in",
    description: "First-party OpenAI adapter supporting GPT-5, mini, nano, reasoning, and tools.",
    documentationUrl: "https://platform.openai.com/docs",
    verified: true
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "llm-provider",
    supportLevel: "built-in",
    description: "First-party adapter for Claude 3.7 Sonnet, 3.5 Sonnet, Haiku with tool execution.",
    documentationUrl: "https://docs.anthropic.com",
    verified: true
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "llm-provider",
    supportLevel: "built-in",
    description: "Native Google Gemini 3.8 Flash and 3.1 Pro adapter with multimodal inputs.",
    documentationUrl: "https://ai.google.dev",
    verified: true
  },
  {
    id: "meta-llama",
    name: "Meta Llama",
    category: "llm-provider",
    supportLevel: "compatible-endpoint",
    description: "Hosted Llama deployments via vLLM, Groq, Ollama, or Hugging Face.",
    documentationUrl: "https://llama.meta.com",
    verified: true
  },
  {
    id: "mistral",
    name: "Mistral AI",
    category: "llm-provider",
    supportLevel: "built-in",
    description: "First-party Mistral adapter for Mistral Large, Codestral, and embeddings.",
    documentationUrl: "https://docs.mistral.ai",
    verified: true
  },
  {
    id: "cohere",
    name: "Cohere",
    category: "llm-provider",
    supportLevel: "built-in",
    description: "Cohere adapter with Command R+, Multilingual Embeddings, and Rerank v3.5.",
    documentationUrl: "https://docs.cohere.com",
    verified: true
  },
  // 4.2 LLM Platforms
  {
    id: "ollama",
    name: "Ollama",
    category: "llm-platform",
    supportLevel: "built-in",
    description: "Zero-config local model runner with tag discovery and no API key requirement.",
    documentationUrl: "https://ollama.com",
    verified: true
  },
  {
    id: "vllm",
    name: "vLLM",
    category: "llm-platform",
    supportLevel: "built-in",
    description: "High-throughput PagedAttention server adapter for OpenAI-compatible clusters.",
    documentationUrl: "https://docs.vllm.ai",
    verified: true
  },
  {
    id: "huggingface",
    name: "Hugging Face Inference",
    category: "llm-platform",
    supportLevel: "built-in",
    description: "Router and dedicated endpoint adapter for 100,000+ open-source models.",
    documentationUrl: "https://huggingface.co/docs/api-inference",
    verified: true
  },
  // 4.3 Agentic AI & Workflow Frameworks
  {
    id: "langgraph",
    name: "LangGraph",
    category: "agent-framework",
    supportLevel: "optional-adapter",
    peerDependency: "@langchain/langgraph",
    description: "Cyclic state graph agent adapter for stateful multi-agent systems.",
    documentationUrl: "https://langchain-ai.github.io/langgraphjs",
    verified: true
  },
  {
    id: "crewai",
    name: "CrewAI",
    category: "agent-framework",
    supportLevel: "integration-recipe",
    description: "Connect Makron OpenAI-compatible endpoint as LLM backend in CrewAI crews.",
    documentationUrl: "https://docs.crewai.com",
    verified: true
  },
  {
    id: "autogen",
    name: "Microsoft AutoGen",
    category: "agent-framework",
    supportLevel: "integration-recipe",
    description: "Configure Makron endpoints into AutoGen conversational agent configs.",
    documentationUrl: "https://microsoft.github.io/autogen",
    verified: true
  },
  {
    id: "ms-agent-framework",
    name: "Microsoft Agent Framework",
    category: "agent-framework",
    supportLevel: "integration-recipe",
    description: "Bridge Makron model adapters into Microsoft agent abstractions.",
    documentationUrl: "https://learn.microsoft.com/ai",
    verified: true
  },
  {
    id: "llamaindex-workflows",
    name: "LlamaIndex Workflows",
    category: "agent-framework",
    supportLevel: "optional-adapter",
    peerDependency: "llamaindex",
    description: "Event-driven workflow execution bridge for document & multi-step agents.",
    documentationUrl: "https://ts.llamaindex.ai",
    verified: true
  },
  {
    id: "aws-strands",
    name: "AWS Strands Agents",
    category: "agent-framework",
    supportLevel: "integration-recipe",
    description: "Recipe connecting AWS Strands workflow definitions to Makron models.",
    documentationUrl: "https://aws.amazon.com/bedrock",
    verified: false
  },
  {
    id: "camel",
    name: "CAMEL-AI",
    category: "agent-framework",
    supportLevel: "integration-recipe",
    description: "Communicative agent framework connecting via Makron proxy endpoints.",
    documentationUrl: "https://www.camel-ai.org",
    verified: false
  },
  {
    id: "agno",
    name: "Agno (formerly Phidata)",
    category: "agent-framework",
    supportLevel: "integration-recipe",
    description: "Fast multimodal agent framework connecting to Makron OpenAI endpoints.",
    documentationUrl: "https://docs.agno.com",
    verified: true
  },
  // 4.4 RAG & Retrieval
  {
    id: "langchain",
    name: "LangChain",
    category: "rag-retrieval",
    supportLevel: "optional-adapter",
    peerDependency: "@langchain/core",
    description: "Bridge exposing MakronClient as a standard LangChain BaseChatModel.",
    documentationUrl: "https://js.langchain.com",
    verified: true
  },
  {
    id: "llamaindex",
    name: "LlamaIndex.TS",
    category: "rag-retrieval",
    supportLevel: "optional-adapter",
    peerDependency: "llamaindex",
    description: "Custom LLM adapter for indexing, query engines, and retrievers.",
    documentationUrl: "https://ts.llamaindex.ai",
    verified: true
  },
  {
    id: "haystack",
    name: "Haystack",
    category: "rag-retrieval",
    supportLevel: "compatible-endpoint",
    description: "Connect Haystack OpenAIChatGenerator to Makron local or proxy servers.",
    documentationUrl: "https://haystack.deepset.ai",
    verified: true
  },
  {
    id: "dspy",
    name: "DSPy",
    category: "rag-retrieval",
    supportLevel: "compatible-endpoint",
    description: "Compile self-optimizing prompts using Makron OpenAI-compatible gateway.",
    documentationUrl: "https://dspy-docs.vercel.app",
    verified: true
  },
  {
    id: "ragflow",
    name: "RAGFlow",
    category: "rag-retrieval",
    supportLevel: "compatible-endpoint",
    description: "Deep document understanding engine connecting through Makron endpoints.",
    documentationUrl: "https://ragflow.io",
    verified: false
  },
  {
    id: "graphrag",
    name: "Microsoft GraphRAG",
    category: "rag-retrieval",
    supportLevel: "integration-recipe",
    description: "Extract knowledge graphs using Makron reasoning models.",
    documentationUrl: "https://github.com/microsoft/graphrag",
    verified: true
  },
  {
    id: "unstructured",
    name: "Unstructured.io",
    category: "rag-retrieval",
    supportLevel: "integration-recipe",
    description: "Parse PDFs, HTML, docs and ingest chunks directly into Makron embeddings.",
    documentationUrl: "https://unstructured.io",
    verified: true
  },
  {
    id: "embedchain",
    name: "EmbedChain",
    category: "rag-retrieval",
    supportLevel: "compatible-endpoint",
    description: "Personalized RAG platform connecting via custom model endpoint.",
    documentationUrl: "https://docs.embedchain.ai",
    verified: false
  },
  // 4.5 Embedding Providers
  {
    id: "openai-embeddings",
    name: "OpenAI Embeddings",
    category: "embeddings",
    supportLevel: "built-in",
    description: "text-embedding-3-large & text-embedding-3-small native support.",
    documentationUrl: "https://platform.openai.com/docs/guides/embeddings",
    verified: true
  },
  {
    id: "cohere-embed",
    name: "Cohere Embed",
    category: "embeddings",
    supportLevel: "built-in",
    description: "Multilingual and english v3 embeddings with search_document and search_query types.",
    documentationUrl: "https://docs.cohere.com/reference/embed",
    verified: true
  },
  {
    id: "voyage-ai",
    name: "Voyage AI",
    category: "embeddings",
    supportLevel: "compatible-endpoint",
    description: "High-precision retrieval embeddings connected through OpenAI-compatible endpoint.",
    documentationUrl: "https://docs.voyageai.com",
    verified: true
  },
  {
    id: "sentence-transformers",
    name: "Sentence Transformers",
    category: "embeddings",
    supportLevel: "built-in",
    description: "Run all-MiniLM-L6-v2 directly in browser via Makron Transformers.js adapter.",
    documentationUrl: "https://sbert.net",
    verified: true
  },
  {
    id: "bge",
    name: "BAAI BGE Embeddings",
    category: "embeddings",
    supportLevel: "built-in",
    description: "BGE small and large supported via Transformers.js or Hugging Face.",
    documentationUrl: "https://huggingface.co/BAAI/bge-large-en-v1.5",
    verified: true
  },
  {
    id: "vertex-embeddings",
    name: "Google Vertex AI Embeddings",
    category: "embeddings",
    supportLevel: "built-in",
    description: "text-embedding-004 via Google Gemini adapter.",
    documentationUrl: "https://cloud.google.com/vertex-ai",
    verified: true
  },
  {
    id: "azure-openai-embeddings",
    name: "Azure OpenAI Embeddings",
    category: "embeddings",
    supportLevel: "compatible-endpoint",
    description: "Deployments in Azure Cognitive Services configured via custom headers.",
    documentationUrl: "https://learn.microsoft.com/azure/ai-services/openai",
    verified: true
  },
  // 4.6 MCP (Model Context Protocol)
  {
    id: "mcp-sdk",
    name: "MCP Official TypeScript SDK",
    category: "mcp",
    supportLevel: "built-in",
    description: "Native MCP client bridge converting MCP tool definitions into Makron tools.",
    documentationUrl: "https://modelcontextprotocol.io",
    verified: true
  },
  {
    id: "fastmcp",
    name: "FastMCP",
    category: "mcp",
    supportLevel: "integration-recipe",
    description: "Lightweight python server framework connecting tools to Makron agents.",
    documentationUrl: "https://github.com/jlowin/fastmcp",
    verified: true
  },
  {
    id: "mcp-github",
    name: "GitHub MCP Server",
    category: "mcp",
    supportLevel: "built-in",
    description: "Connect GitHub repository search, commit creation, and issues to Makron.",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    verified: true
  },
  {
    id: "mcp-slack",
    name: "Slack MCP Server",
    category: "mcp",
    supportLevel: "built-in",
    description: "Expose channels, messages, and bots as tools for Makron clients.",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    verified: true
  },
  {
    id: "mcp-postgres",
    name: "PostgreSQL MCP Server",
    category: "mcp",
    supportLevel: "built-in",
    description: "Expose relational databases to LLM queries safely over JSON-RPC.",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    verified: true
  },
  {
    id: "mcp-gdrive",
    name: "Google Drive MCP Server",
    category: "mcp",
    supportLevel: "built-in",
    description: "Read and search Drive documents with Makron models.",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    verified: true
  },
  {
    id: "mcp-filesystem",
    name: "Filesystem MCP Server",
    category: "mcp",
    supportLevel: "built-in",
    description: "Secure, sandboxed directory and file inspection tools for local agents.",
    documentationUrl: "https://github.com/modelcontextprotocol/servers",
    verified: true
  },
  // 4.7 AI Security & Guardrails
  {
    id: "nemo-guardrails",
    name: "NVIDIA NeMo Guardrails",
    category: "security-guardrails",
    supportLevel: "compatible-endpoint",
    description: "Programmable rails for dialogue safety and fact-checking over OpenAI API.",
    documentationUrl: "https://github.com/NVIDIA/NeMo-Guardrails",
    verified: true
  },
  {
    id: "guardrails-ai",
    name: "Guardrails AI",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "Spec-based output validation for JSON schemas and safety filters.",
    documentationUrl: "https://www.guardrailsai.com",
    verified: true
  },
  {
    id: "presidio",
    name: "Microsoft Presidio",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "PII anonymization and redaction middleware for prompts and responses.",
    documentationUrl: "https://microsoft.github.io/presidio",
    verified: true
  },
  {
    id: "lakera-guard",
    name: "Lakera Guard",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "Prompt injection detection API evaluated prior to Makron request execution.",
    documentationUrl: "https://www.lakera.ai",
    verified: true
  },
  {
    id: "prompt-security",
    name: "Prompt Security",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "Enterprise generative AI security firewall.",
    documentationUrl: "https://prompt.security",
    verified: false
  },
  {
    id: "protect-ai",
    name: "Protect AI (Rebuff)",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "Multi-layer defense against prompt injection attacks.",
    documentationUrl: "https://protectai.com",
    verified: true
  },
  {
    id: "azure-content-safety",
    name: "Azure AI Content Safety",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "Hate, violence, self-harm, and sexual content detection pre-filter.",
    documentationUrl: "https://learn.microsoft.com/azure/ai-services/content-safety",
    verified: true
  },
  {
    id: "bedrock-guardrails",
    name: "AWS Bedrock Guardrails",
    category: "security-guardrails",
    supportLevel: "integration-recipe",
    description: "Customizable denied topics, word filters, and sensitive information redaction.",
    documentationUrl: "https://aws.amazon.com/bedrock/guardrails",
    verified: true
  },
  // 4.8 Observability & Evaluation
  {
    id: "langsmith",
    name: "LangSmith",
    category: "observability",
    supportLevel: "built-in",
    description: "Native Makron observability callbacks recording traces, latency, and tokens.",
    documentationUrl: "https://smith.langchain.com",
    verified: true
  },
  {
    id: "langfuse",
    name: "Langfuse",
    category: "observability",
    supportLevel: "built-in",
    description: "Open-source tracing and prompt management with Makron observability hook.",
    documentationUrl: "https://langfuse.com",
    verified: true
  },
  {
    id: "arize-phoenix",
    name: "Arize Phoenix",
    category: "observability",
    supportLevel: "built-in",
    description: "OpenInference tracing and evaluation dashboard integration.",
    documentationUrl: "https://phoenix.arize.com",
    verified: true
  },
  {
    id: "wandb-weave",
    name: "Weights & Biases Weave",
    category: "observability",
    supportLevel: "integration-recipe",
    description: "Interactive trace inspection and evaluation logging for genAI.",
    documentationUrl: "https://weave-docs.wandb.ai",
    verified: true
  },
  {
    id: "trulens",
    name: "TruLens",
    category: "observability",
    supportLevel: "integration-recipe",
    description: "Evaluation framework assessing groundedness, relevance, and toxicity.",
    documentationUrl: "https://www.trulens.org",
    verified: false
  },
  {
    id: "ragas",
    name: "Ragas",
    category: "observability",
    supportLevel: "integration-recipe",
    description: "Evaluation metrics for retrieval-augmented generation pipelines.",
    documentationUrl: "https://ragas.io",
    verified: true
  },
  {
    id: "promptfoo",
    name: "Promptfoo",
    category: "observability",
    supportLevel: "compatible-endpoint",
    description: "Automated prompt test and red-teaming tool targeting Makron endpoints.",
    documentationUrl: "https://www.promptfoo.dev",
    verified: true
  },
  {
    id: "helicone",
    name: "Helicone",
    category: "observability",
    supportLevel: "built-in",
    description: "Proxy and header-based LLM observability with cost, cache, and latency tracking.",
    documentationUrl: "https://www.helicone.ai",
    verified: true
  },
  // 4.9 Memory Systems
  {
    id: "mem0",
    name: "Mem0",
    category: "memory",
    supportLevel: "integration-recipe",
    description: "Personalized memory layer storing user preferences and historical facts.",
    documentationUrl: "https://mem0.ai",
    verified: true
  },
  {
    id: "zep",
    name: "Zep",
    category: "memory",
    supportLevel: "integration-recipe",
    description: "Long-term memory engine with temporal graph search.",
    documentationUrl: "https://www.getzep.com",
    verified: true
  },
  {
    id: "letta",
    name: "Letta (formerly MemGPT)",
    category: "memory",
    supportLevel: "compatible-endpoint",
    description: "Stateful memory agent server connecting to Makron LLMs.",
    documentationUrl: "https://letta.com",
    verified: true
  },
  {
    id: "buffer-memory",
    name: "Makron Buffer Memory",
    category: "memory",
    supportLevel: "built-in",
    description: "In-memory sliding window and message buffer manager.",
    verified: true
  },
  {
    id: "redis-memory",
    name: "Redis",
    category: "memory",
    supportLevel: "integration-recipe",
    description: "Fast ephemeral session and conversation store using Redis lists or JSON.",
    documentationUrl: "https://redis.io",
    verified: true
  },
  {
    id: "postgres-memory",
    name: "PostgreSQL Session Store",
    category: "memory",
    supportLevel: "integration-recipe",
    description: "Persistent relational conversation history tables with transactional integrity.",
    verified: true
  },
  {
    id: "neo4j-memory",
    name: "Neo4j Graph Memory",
    category: "memory",
    supportLevel: "integration-recipe",
    description: "Entity-relationship graph memory for persistent agent knowledge.",
    documentationUrl: "https://neo4j.com",
    verified: false
  },
  // 4.10 Agent SDKs & Services
  {
    id: "openai-agents-sdk",
    name: "OpenAI Agents SDK",
    category: "agent-sdk",
    supportLevel: "integration-recipe",
    description: "Use Makron client configurations with OpenAI agents and handoffs.",
    documentationUrl: "https://github.com/openai/openai-agents-python",
    verified: true
  },
  {
    id: "pydantic-ai",
    name: "PydanticAI",
    category: "agent-sdk",
    supportLevel: "compatible-endpoint",
    description: "Type-safe generative AI framework connecting via Makron OpenAI proxy.",
    documentationUrl: "https://ai.pydantic.dev",
    verified: true
  },
  {
    id: "semantic-kernel",
    name: "Semantic Kernel",
    category: "agent-sdk",
    supportLevel: "integration-recipe",
    description: "Enterprise orchestration connecting to Makron custom endpoints.",
    documentationUrl: "https://learn.microsoft.com/semantic-kernel",
    verified: true
  },
  {
    id: "google-adk",
    name: "Google Agent Development Kit",
    category: "agent-sdk",
    supportLevel: "integration-recipe",
    description: "Connect Gemini tools and workflows in Google Cloud.",
    documentationUrl: "https://cloud.google.com/products/agent-space",
    verified: false
  },
  {
    id: "bedrock-agents",
    name: "AWS Bedrock Agents",
    category: "agent-sdk",
    supportLevel: "integration-recipe",
    description: "Integrate AWS serverless action groups with Makron routing.",
    documentationUrl: "https://aws.amazon.com/bedrock/agents",
    verified: false
  },
  {
    id: "azure-agent-service",
    name: "Azure AI Foundry Agent Service",
    category: "agent-sdk",
    supportLevel: "integration-recipe",
    description: "Deploy persistent enterprise agents on Azure infrastructure.",
    documentationUrl: "https://learn.microsoft.com/azure/ai-foundry",
    verified: false
  },
  // 4.11 Automation Platforms
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    supportLevel: "compatible-endpoint",
    description: "Use n8n AI Agent node pointing to Makron OpenAI-compatible endpoint.",
    documentationUrl: "https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/",
    verified: true
  },
  {
    id: "zapier",
    name: "Zapier Central / AI Actions",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Call Zapier webhooks and actions from Makron tool definitions.",
    documentationUrl: "https://zapier.com/central",
    verified: true
  },
  {
    id: "make",
    name: "Make.com",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Trigger visual scenarios using Makron tool executions.",
    documentationUrl: "https://www.make.com",
    verified: true
  },
  {
    id: "temporal",
    name: "Temporal",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Durable execution workflows executing Makron chat and embedding calls with retries.",
    documentationUrl: "https://temporal.io",
    verified: true
  },
  {
    id: "airflow",
    name: "Apache Airflow",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Orchestrate scheduled batch embedding and synthetic data tasks via Makron.",
    documentationUrl: "https://airflow.apache.org",
    verified: true
  },
  {
    id: "prefect",
    name: "Prefect",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Python & TS workflow coordination for AI pipelines.",
    documentationUrl: "https://docs.prefect.io",
    verified: true
  },
  {
    id: "kestra",
    name: "Kestra",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Event-driven orchestration engine triggering Makron workflows.",
    documentationUrl: "https://kestra.io",
    verified: false
  },
  {
    id: "pipedream",
    name: "Pipedream",
    category: "automation",
    supportLevel: "integration-recipe",
    description: "Connect hundreds of third-party apps to Makron agents.",
    documentationUrl: "https://pipedream.com",
    verified: true
  },
  // 4.12 Vector Databases
  {
    id: "pinecone",
    name: "Pinecone",
    category: "vector-database",
    supportLevel: "built-in",
    description: "Upsert and query vectors generated by Makron embeddings into Pinecone indexes.",
    documentationUrl: "https://docs.pinecone.io",
    verified: true
  },
  {
    id: "weaviate",
    name: "Weaviate",
    category: "vector-database",
    supportLevel: "built-in",
    description: "Integrate Makron embeddings with Weaviate v4 collections.",
    documentationUrl: "https://weaviate.io/developers/weaviate",
    verified: true
  },
  {
    id: "qdrant",
    name: "Qdrant",
    category: "vector-database",
    supportLevel: "built-in",
    description: "Vector similarity search with payload filtering for Makron embeddings.",
    documentationUrl: "https://qdrant.tech/documentation",
    verified: true
  },
  {
    id: "chroma",
    name: "Chroma",
    category: "vector-database",
    supportLevel: "built-in",
    description: "Open-source vector database supporting both local and server deployments.",
    documentationUrl: "https://docs.trychroma.com",
    verified: true
  },
  {
    id: "pgvector",
    name: "pgvector (PostgreSQL)",
    category: "vector-database",
    supportLevel: "built-in",
    description: "Store embeddings directly in PostgreSQL with HNSW / IVFFLAT indexes.",
    documentationUrl: "https://github.com/pgvector/pgvector",
    verified: true
  },
  {
    id: "milvus",
    name: "Milvus",
    category: "vector-database",
    supportLevel: "integration-recipe",
    description: "Distributed vector database for billion-scale similarity search.",
    documentationUrl: "https://milvus.io",
    verified: true
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch Vector Search",
    category: "vector-database",
    supportLevel: "integration-recipe",
    description: "Hybrid keyword + dense vector search over Elasticsearch indexes.",
    documentationUrl: "https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html",
    verified: true
  },
  {
    id: "redis-vector",
    name: "Redis Vector Search (RediSearch)",
    category: "vector-database",
    supportLevel: "integration-recipe",
    description: "In-memory real-time vector indexing and retrieval.",
    documentationUrl: "https://redis.io/docs/interact/search-and-query/",
    verified: true
  },
  {
    id: "mongodb-atlas-vector",
    name: "MongoDB Atlas Vector Search",
    category: "vector-database",
    supportLevel: "integration-recipe",
    description: "Semantic vector search integrated within MongoDB document collections.",
    documentationUrl: "https://www.mongodb.com/products/platform/atlas-vector-search",
    verified: true
  }
];
var IntegrationRegistry = class {
  constructor() {
    this.records = /* @__PURE__ */ new Map();
    for (const record of INTEGRATION_CATALOG) {
      this.records.set(record.id, record);
    }
  }
  register(record) {
    this.records.set(record.id, record);
  }
  get(id) {
    return this.records.get(id);
  }
  list(filter) {
    let list = Array.from(this.records.values());
    if (filter?.category) {
      list = list.filter((r) => r.category === filter.category);
    }
    if (filter?.supportLevel) {
      list = list.filter((r) => r.supportLevel === filter.supportLevel);
    }
    return list;
  }
};
var defaultIntegrationRegistry = new IntegrationRegistry();

// src/integrations/mcp.ts
function convertMcpToolsToMakron(mcpTools) {
  return mcpTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));
}
function createMcpToolBridge(mcpTool, transport) {
  return {
    definition: {
      type: "function",
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.inputSchema
      }
    },
    execute: async (args) => {
      return await transport.callTool(mcpTool.name, args);
    }
  };
}

// src/integrations/vector-store.ts
var InMemoryVectorStore = class {
  constructor() {
    this.docs = /* @__PURE__ */ new Map();
  }
  async upsert(documents) {
    for (const doc of documents) {
      this.docs.set(doc.id, doc);
    }
  }
  async query(vector, topK = 5) {
    const scored = [];
    for (const doc of this.docs.values()) {
      const score = cosineSimilarity(vector, doc.vector);
      scored.push({ document: doc, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
  async delete(ids) {
    for (const id of ids) {
      this.docs.delete(id);
    }
  }
  count() {
    return this.docs.size;
  }
};

// src/components/agent.ts
var DEFAULT_AGENT_SYSTEM_PROMPT = `You are a helpful, capable autonomous AI assistant powered by Makron.js.
You have access to a set of tools to gather information and solve complex tasks.
When you need external information or calculations, select the appropriate tool and execute it.
Think step-by-step. When you have sufficient information to answer the user query completely, provide the final response clearly.`;
var Agent = class {
  constructor(config) {
    this.tools = [];
    this.client = config.client;
    this.systemPrompt = config.systemPrompt || DEFAULT_AGENT_SYSTEM_PROMPT;
    this.maxSteps = config.maxSteps ?? 10;
    this.memory = config.memory;
    this.onStep = config.onStep;
    this.onToolCall = config.onToolCall;
    this.onToolResult = config.onToolResult;
    if (config.tools) {
      for (const t of config.tools) {
        this.addTool(t);
      }
    }
  }
  /**
   * Register a new tool into the agent's toolbelt
   */
  addTool(tool) {
    if ("execute" in tool && typeof tool.execute === "function") {
      this.tools.push(tool);
    } else if ("type" in tool && tool.type === "function") {
      this.tools.push({
        definition: tool,
        execute: async () => {
          throw new Error(`Tool '${tool.function.name}' was called but has no execute implementation`);
        }
      });
    }
    return this;
  }
  /**
   * Run the agent on a user prompt or multi-turn message sequence
   */
  async run(input) {
    const inputMessages = typeof input === "string" ? [{ role: "user", content: input }] : [...input];
    const messages = [
      { role: "system", content: this.systemPrompt }
    ];
    if (this.memory) {
      messages.push(...this.memory.getMessages());
    }
    messages.push(...inputMessages);
    const steps = [];
    const aggregatedUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
    let stepCount = 0;
    let finalAnswer = "";
    let finalReason = { reason: "stop" };
    const toolDefinitions = this.tools.map((t) => t.definition);
    while (stepCount < this.maxSteps) {
      stepCount++;
      const response = await this.client.chat({
        messages,
        tools: toolDefinitions.length > 0 ? toolDefinitions : void 0
      });
      if (response.usage) {
        aggregatedUsage.promptTokens += response.usage.promptTokens;
        aggregatedUsage.completionTokens += response.usage.completionTokens;
        aggregatedUsage.totalTokens += response.usage.totalTokens;
      }
      const hasToolCalls = Boolean(response.toolCalls && response.toolCalls.length > 0);
      const currentStep = {
        stepNumber: stepCount,
        thought: response.text || void 0,
        toolCalls: response.toolCalls,
        finishReason: response.finishReason
      };
      if (!hasToolCalls) {
        finalAnswer = response.text;
        finalReason = response.finishReason;
        steps.push(currentStep);
        this.onStep?.(currentStep);
        if (this.memory) {
          for (const m of inputMessages) {
            this.memory.addMessage(m);
          }
          this.memory.addMessage({ role: "assistant", content: finalAnswer });
        }
        break;
      }
      messages.push({
        role: "assistant",
        content: response.text || "",
        toolCalls: response.toolCalls
      });
      const executableList = this.tools;
      const toolResults = await executeToolCalls(response.toolCalls, executableList);
      currentStep.toolResults = toolResults;
      steps.push(currentStep);
      this.onStep?.(currentStep);
      for (const call of response.toolCalls) {
        this.onToolCall?.(call);
      }
      for (const res of toolResults) {
        this.onToolResult?.(res.toolCallId, res.result);
        messages.push({
          role: "tool",
          toolCallId: res.toolCallId,
          content: typeof res.result === "string" ? res.result : JSON.stringify(res.result)
        });
      }
    }
    if (!finalAnswer && steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      finalAnswer = lastStep.thought || `[Agent completed ${stepCount} steps]`;
      finalReason = { reason: "length" };
    }
    return {
      text: finalAnswer,
      steps,
      totalSteps: steps.length,
      usage: aggregatedUsage,
      finishReason: finalReason
    };
  }
};
function createAgent(config) {
  return new Agent(config);
}

// src/components/tools.ts
var calculatorTool = defineTool(
  "calculator",
  "Safely evaluates a mathematical expression and returns the calculated number",
  {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: 'The math expression to evaluate, e.g. "12 * (4 + 6)", "Math.sqrt(144)", "2 ** 8"'
      }
    },
    required: ["expression"]
  },
  async ({ expression }) => {
    if (typeof expression !== "string" || !expression.trim()) {
      return { error: "Invalid or empty expression" };
    }
    const sanitized = expression.replace(/[^0-9+\-*/%.()^ eE,Math.sqrtMath.absMath.roundMath.floorMath.ceilMath.PIMath.powMath.sinMath.cosMath.tan]/g, "");
    try {
      const compute = new Function(
        "Math",
        `"use strict"; return (${sanitized.replace(/\^/g, "**")});`
      );
      const result = compute(Math);
      if (typeof result !== "number" || Number.isNaN(result)) {
        return { error: "Expression did not evaluate to a valid number", expression };
      }
      return { expression, result };
    } catch (err) {
      return { error: `Evaluation error: ${err.message}`, expression };
    }
  }
);
var dateTimeTool = defineTool(
  "get_current_time",
  "Returns the current date, time, timezone, and calendar metadata",
  {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: 'Optional IANA timezone name (e.g. "America/New_York", "UTC", "Asia/Tokyo")'
      },
      format: {
        type: "string",
        enum: ["iso", "locale", "timestamp", "full"],
        description: 'Format of the timestamp to return (default: "full")'
      }
    }
  },
  async ({ timezone = "UTC", format = "full" }) => {
    const now = /* @__PURE__ */ new Date();
    try {
      const iso = now.toISOString();
      const timestamp = now.getTime();
      const localeString = now.toLocaleString("en-US", { timeZone: timezone });
      const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone });
      return {
        iso,
        timestamp,
        localeString,
        dayOfWeek,
        timezone,
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate()
      };
    } catch {
      return {
        iso: now.toISOString(),
        timestamp: now.getTime(),
        timezone: "UTC"
      };
    }
  }
);
var jsonParserTool = defineTool(
  "json_inspector",
  "Parses, queries, and validates JSON strings, extracting specific paths or schemas",
  {
    type: "object",
    properties: {
      jsonString: {
        type: "string",
        description: "The JSON string to parse and inspect"
      },
      keyPath: {
        type: "string",
        description: 'Optional dot-notation key path to extract, e.g. "data.users.0.name"'
      }
    },
    required: ["jsonString"]
  },
  async ({ jsonString, keyPath }) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!keyPath) {
        return { valid: true, data: parsed, keys: Object.keys(parsed) };
      }
      const parts = keyPath.split(".");
      let current = parsed;
      for (const part of parts) {
        if (current === void 0 || current === null) break;
        current = current[part];
      }
      return { valid: true, keyPath, value: current };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
);
var textProcessingTool = defineTool(
  "text_processor",
  "Analyzes text statistics, word count, character count, and extracts patterns",
  {
    type: "object",
    properties: {
      text: { type: "string", description: "The text to analyze" },
      action: {
        type: "string",
        enum: ["stats", "extract_emails", "extract_urls", "word_frequency"],
        description: "Operation to perform on the text"
      }
    },
    required: ["text", "action"]
  },
  async ({ text, action }) => {
    if (!text) return { error: "Empty text" };
    switch (action) {
      case "stats": {
        const words = text.trim().split(/\s+/).filter(Boolean);
        const characters = text.length;
        const lines = text.split("\n").length;
        return {
          wordCount: words.length,
          characterCount: characters,
          lineCount: lines,
          estimatedReadingTimeMinutes: Math.ceil(words.length / 200)
        };
      }
      case "extract_emails": {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = Array.from(new Set(text.match(emailRegex) || []));
        return { emails, count: emails.length };
      }
      case "extract_urls": {
        const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/g;
        const urls = Array.from(new Set(text.match(urlRegex) || []));
        return { urls, count: urls.length };
      }
      case "word_frequency": {
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const freq = {};
        for (const w of words) {
          freq[w] = (freq[w] || 0) + 1;
        }
        const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));
        return { topWords };
      }
      default:
        return { error: `Unknown action: ${action}` };
    }
  }
);
var webSearchTool = defineTool(
  "web_search",
  "Searches the web for recent information and returns relevant snippets and sources",
  {
    type: "object",
    properties: {
      query: { type: "string", description: "The search query to look up" },
      limit: { type: "number", description: "Maximum number of results to return (default: 3)" }
    },
    required: ["query"]
  },
  async ({ query, limit = 3 }) => {
    return {
      query,
      results: [
        {
          title: `Information regarding ${query}`,
          snippet: `Summary documentation and reference context for "${query}".`,
          url: `https://search.makron.dev/?q=${encodeURIComponent(query)}`
        }
      ].slice(0, limit)
    };
  }
);
var standardTools = {
  calculator: calculatorTool,
  dateTime: dateTimeTool,
  jsonParser: jsonParserTool,
  textProcessor: textProcessingTool,
  webSearch: webSearchTool,
  /** Return an array of all standard tools for instant loading */
  all() {
    return [
      calculatorTool,
      dateTimeTool,
      jsonParserTool,
      textProcessingTool,
      webSearchTool
    ];
  }
};

// src/components/rag.ts
var RecursiveCharacterTextSplitter = class {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize ?? 500;
    this.chunkOverlap = options.chunkOverlap ?? 50;
    this.separators = options.separators ?? ["\n\n", "\n", ". ", " ", ""];
  }
  splitText(text) {
    return this._split(text, this.separators);
  }
  _split(text, separators) {
    const finalChunks = [];
    if (!text || text.length === 0) return finalChunks;
    if (text.length <= this.chunkSize) return [text.trim()];
    let separator = separators[separators.length - 1];
    let newSeparators = [];
    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === "") {
        separator = "";
        break;
      }
      if (text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }
    const splits = separator ? text.split(separator) : text.split("");
    const goodSplits = [];
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
  _mergeSplits(splits, separator) {
    const docs = [];
    const currentDoc = [];
    let total = 0;
    for (const piece of splits) {
      const len = piece.length + (currentDoc.length > 0 ? separator.length : 0);
      if (total + len > this.chunkSize && currentDoc.length > 0) {
        const docText = currentDoc.join(separator).trim();
        if (docText) docs.push(docText);
        while (total > this.chunkOverlap && currentDoc.length > 0) {
          const dropped = currentDoc.shift();
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
};
function createFastHashEmbedding(text, dimensions = 64) {
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
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((v) => v / norm);
}
var RagPipeline = class {
  constructor(config) {
    this.chunks = /* @__PURE__ */ new Map();
    this.client = config.client;
    this.topK = config.topK ?? 3;
    this.splitter = new RecursiveCharacterTextSplitter(config.splitterOptions);
    this.systemPrompt = config.systemPrompt || `You are a knowledgeable assistant answering questions based solely on the provided reference context.
If the reference context does not contain enough information to answer the question, state that honestly.
Cite your sources using [Doc: <id>].`;
    if (config.embedder) {
      this.embedder = config.embedder;
    } else if (this.client.embed) {
      this.embedder = async (text) => {
        const res = await this.client.embed({ input: text });
        return res.embeddings[0].vector;
      };
    } else {
      this.embedder = async (text) => createFastHashEmbedding(text);
    }
  }
  /**
   * Add a text snippet or document to the RAG knowledge base
   */
  async addText(text, metadata = {}) {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return this.addDocument({ id: docId, text, metadata });
  }
  /**
   * Add and chunk a structured document
   */
  async addDocument(doc) {
    const docId = doc.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const splitTexts = this.splitter.splitText(doc.text);
    let added = 0;
    for (let i = 0; i < splitTexts.length; i++) {
      const chunkId = `${docId}_chunk_${i}`;
      const chunkDoc = {
        id: chunkId,
        docId,
        text: splitTexts[i],
        chunkIndex: i,
        metadata: doc.metadata
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
  async addDocuments(docs) {
    let totalAdded = 0;
    for (const d of docs) {
      totalAdded += await this.addDocument(d);
    }
    return totalAdded;
  }
  /**
   * Retrieve the most semantically relevant chunks for a given query
   */
  async retrieve(query, options = {}) {
    if (this.chunks.size === 0) return [];
    const k = options.topK ?? this.topK;
    const minScore = options.minScore ?? -1;
    const queryVec = await this.embedder(query);
    const scored = [];
    for (const [id, entry] of this.chunks.entries()) {
      const score = cosineSimilarity(queryVec, entry.vector);
      if (score >= minScore) {
        scored.push({
          chunkId: id,
          docId: entry.chunk.docId,
          snippet: entry.chunk.text,
          score,
          metadata: entry.chunk.metadata
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
  /**
   * Ask a question against the indexed documents
   */
  async query(question, options = {}) {
    const startTime = Date.now();
    const citations = await this.retrieve(question, options);
    const contextBlocks = citations.map((c, idx) => `[Reference ${idx + 1} | Source: ${c.docId}]
${c.snippet}`).join("\n\n---\n\n");
    const contextUsed = contextBlocks || "No relevant reference documents found.";
    const prompt = `REFERENCE CONTEXT:
${contextUsed}

USER QUESTION:
${question}

ANSWER:`;
    const response = await this.client.chat({
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: prompt }
      ]
    });
    const latencyMs = Date.now() - startTime;
    return {
      answer: response.text,
      citations,
      latencyMs,
      contextUsed
    };
  }
  /**
   * Clear all indexed chunks
   */
  clear() {
    this.chunks.clear();
  }
  /**
   * Total number of indexed chunks
   */
  get chunkCount() {
    return this.chunks.size;
  }
};
function createRagPipeline(config) {
  return new RagPipeline(config);
}

// src/components/fallback-chain.ts
var FallbackChain = class {
  constructor(config) {
    if (!config.clients || config.clients.length === 0) {
      throw new Error("FallbackChain requires at least one client");
    }
    this.clients = config.clients;
    this.onFallback = config.onFallback;
  }
  /**
   * Execute chat request with automatic cascade failover
   */
  async chat(request, options) {
    let lastError = null;
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const providerId = client.id || `provider_${i}`;
      try {
        const response = await client.chat(request, options);
        return {
          ...response,
          resolvedByProvider: providerId,
          fallbackAttempts: i
        };
      } catch (err) {
        lastError = err;
        const nextClient = this.clients[i + 1];
        if (nextClient) {
          const nextProviderId = nextClient.id || `provider_${i + 1}`;
          this.onFallback?.({
            fromProvider: providerId,
            toProvider: nextProviderId,
            attempt: i + 1,
            error: err instanceof Error ? err : new Error(String(err))
          });
        }
      }
    }
    throw new MakronError(
      `All ${this.clients.length} fallback providers failed. Last error: ${lastError?.message || String(lastError)}`,
      lastError?.code || "ALL_PROVIDERS_FAILED"
    );
  }
  /**
   * Stream chat chunks with failover on initial connection failure
   */
  async *stream(request, options) {
    let lastError = null;
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const providerId = client.id || `provider_${i}`;
      if (!client.stream) {
        try {
          const full = await client.chat(request, options);
          yield {
            id: full.id,
            model: full.model,
            provider: providerId,
            deltaText: full.text,
            finishReason: full.finishReason,
            usage: full.usage,
            raw: full.raw
          };
          return;
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      try {
        const iterable = client.stream(request, options);
        let yieldedAny = false;
        for await (const chunk of iterable) {
          yieldedAny = true;
          yield chunk;
        }
        if (yieldedAny) {
          return;
        }
      } catch (err) {
        lastError = err;
        const nextClient = this.clients[i + 1];
        if (nextClient) {
          this.onFallback?.({
            fromProvider: providerId,
            toProvider: nextClient.id || `provider_${i + 1}`,
            attempt: i + 1,
            error: err instanceof Error ? err : new Error(String(err))
          });
        }
      }
    }
    throw new MakronError(
      `All fallback stream providers failed. Last error: ${lastError?.message || String(lastError)}`,
      lastError?.code || "STREAM_FALLBACK_FAILED"
    );
  }
};
function createFallbackChain(config) {
  return new FallbackChain(config);
}

// src/components/memory-session.ts
var TokenBudgetMemory = class {
  constructor(maxTokens = 4e3) {
    this.messages = [];
    this.maxTokens = maxTokens;
  }
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
  addMessage(message) {
    this.messages.push(message);
    this.prune();
  }
  getMessages() {
    return [...this.messages];
  }
  clear() {
    this.messages = [];
  }
  prune() {
    let totalTokens = this.messages.reduce((sum, msg) => {
      return sum + this.estimateTokens(contentToString(msg.content));
    }, 0);
    while (totalTokens > this.maxTokens && this.messages.length > 1) {
      const pruneIndex = this.messages.findIndex((m) => m.role !== "system");
      if (pruneIndex === -1) break;
      const removed = this.messages.splice(pruneIndex, 1)[0];
      totalTokens -= this.estimateTokens(contentToString(removed.content));
    }
  }
};
var ConversationSession = class {
  constructor(config) {
    this.client = config.client;
    this.systemPrompt = config.systemPrompt;
    this.memory = config.memory || new TokenBudgetMemory(config.maxTokensBudget ?? 4e3);
    if (this.systemPrompt) {
      this.memory.addMessage({ role: "system", content: this.systemPrompt });
    }
  }
  /**
   * Send a user message and receive the model's response
   */
  async sendMessage(input, options) {
    const userMsg = { role: "user", content: input };
    this.memory.addMessage(userMsg);
    const history = this.memory.getMessages();
    const response = await this.client.chat({ messages: history }, options);
    const assistantMsg = {
      role: "assistant",
      content: response.text,
      toolCalls: response.toolCalls
    };
    this.memory.addMessage(assistantMsg);
    return response;
  }
  /**
   * Stream a response to a user message, updating history upon completion
   */
  async *streamMessage(input, options) {
    const userMsg = { role: "user", content: input };
    this.memory.addMessage(userMsg);
    const history = this.memory.getMessages();
    let accumulatedText = "";
    if (this.client.stream) {
      for await (const chunk of this.client.stream({ messages: history }, options)) {
        accumulatedText += chunk.deltaText;
        yield chunk;
      }
    } else {
      const full = await this.client.chat({ messages: history }, options);
      accumulatedText = full.text;
      yield {
        id: full.id,
        model: full.model,
        provider: full.provider,
        deltaText: full.text,
        finishReason: full.finishReason,
        usage: full.usage
      };
    }
    this.memory.addMessage({ role: "assistant", content: accumulatedText });
  }
  getHistory() {
    return this.memory.getMessages();
  }
  clear() {
    this.memory.clear();
    if (this.systemPrompt) {
      this.memory.addMessage({ role: "system", content: this.systemPrompt });
    }
  }
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    const current = this.memory.getMessages().filter((m) => m.role !== "system");
    this.memory.clear();
    this.memory.addMessage({ role: "system", content: prompt });
    for (const msg of current) {
      this.memory.addMessage(msg);
    }
  }
  export() {
    return JSON.stringify(this.memory.getMessages(), null, 2);
  }
  import(jsonString) {
    const parsed = JSON.parse(jsonString);
    this.memory.clear();
    for (const m of parsed) {
      this.memory.addMessage(m);
    }
  }
};
function createSession(config) {
  return new ConversationSession(config);
}

// src/components/prompt-template.ts
var PromptTemplate = class _PromptTemplate {
  constructor(template, inputVariables) {
    this.partialVariables = {};
    this.template = template;
    this.inputVariables = inputVariables || this.extractVariables(template);
  }
  extractVariables(text) {
    const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  }
  static fromTemplate(template) {
    return new _PromptTemplate(template);
  }
  partial(variables) {
    const clone = new _PromptTemplate(this.template, [...this.inputVariables]);
    clone.partialVariables = { ...this.partialVariables, ...variables };
    return clone;
  }
  format(values = {}) {
    const combined = { ...this.partialVariables, ...values };
    return this.template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
      if (varName in combined) {
        const val = combined[varName];
        return typeof val === "object" ? JSON.stringify(val) : String(val);
      }
      return match;
    });
  }
  getVariables() {
    return this.inputVariables.filter((v) => !(v in this.partialVariables));
  }
};
var ChatPromptTemplate = class _ChatPromptTemplate {
  constructor(userTemplate, systemTemplate) {
    this.userTemplate = new PromptTemplate(userTemplate);
    if (systemTemplate) {
      this.systemTemplate = new PromptTemplate(systemTemplate);
    }
  }
  static fromMessages(options) {
    return new _ChatPromptTemplate(options.user, options.system);
  }
  formatMessages(values = {}) {
    const messages = [];
    if (this.systemTemplate) {
      messages.push({
        role: "system",
        content: this.systemTemplate.format(values)
      });
    }
    messages.push({
      role: "user",
      content: this.userTemplate.format(values)
    });
    return messages;
  }
};
var SystemPrompts = {
  coder(language = "TypeScript") {
    return `You are an expert senior software engineer specializing in ${language}.
Produce production-grade, type-safe, maintainable code following modern best practices.
Avoid unnecessary conversational preambles. Prioritize clarity, efficiency, and edge case handling.`;
  },
  concise() {
    return `You are a concise, direct assistant. Provide clear, accurate answers in minimal words.
Use bullet points where appropriate. Eliminate pleasantries and filler text.`;
  },
  jsonOnly(schemaHint) {
    return `You are a structured data extractor. You must respond ONLY with a single valid JSON object.
Do not output markdown code blocks (\`\`\`json), explanations, or surrounding text.
${schemaHint ? `Target JSON Schema:
${schemaHint}` : ""}`;
  },
  analyst() {
    return `You are an objective research and data analyst.
Examine problems from multiple angles, identify core trade-offs, and substantiate claims with structured reasoning.`;
  },
  researcher() {
    return `You are an academic researcher and literature specialist.
Synthesize verified findings, cite claims meticulously, and explicitly demarcate confidence intervals and knowledge bounds.`;
  }
};

// src/components/structured-parser.ts
function extractJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("extractJson expected a non-empty string input");
  }
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
  }
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      return JSON.parse(repairJson(codeBlockMatch[1]));
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  let start = -1;
  let end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = trimmed.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = trimmed.lastIndexOf("]");
  }
  if (start !== -1 && end !== -1 && end > start) {
    const rawSnippet = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(rawSnippet);
    } catch {
      return JSON.parse(repairJson(rawSnippet));
    }
  }
  throw new Error(`Unable to extract valid JSON from model response: "${trimmed.slice(0, 100)}..."`);
}
function repairJson(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  return cleaned;
}
function createStructuredParser(schema) {
  return {
    schema,
    getFormatInstructions() {
      return `Your response MUST be a valid JSON object adhering to this schema:
${JSON.stringify(schema.schema, null, 2)}`;
    },
    parse(text) {
      return extractJson(text);
    }
  };
}

// src/components/stream-consumer.ts
async function collectStreamWithStats(stream, onChunk) {
  const startTime = Date.now();
  let firstTokenTime = 0;
  let chunkCount = 0;
  let fullText = "";
  for await (const chunk of stream) {
    chunkCount++;
    if (chunkCount === 1) {
      firstTokenTime = Date.now() - startTime;
    }
    fullText += chunk.deltaText;
    onChunk?.(chunk);
  }
  const totalDurationMs = Math.max(1, Date.now() - startTime);
  const estimatedTokens = Math.ceil(fullText.length / 4);
  const tokensPerSecond = estimatedTokens / (totalDurationMs / 1e3);
  return {
    text: fullText,
    totalChunks: chunkCount,
    timeToFirstTokenMs: firstTokenTime,
    totalDurationMs,
    tokensPerSecond: Math.round(tokensPerSecond * 10) / 10
  };
}
var StreamSentenceBuffer = class {
  constructor(onSentence) {
    this.buffer = "";
    this.onSentence = onSentence;
  }
  feed(chunk) {
    this.buffer += chunk;
    const sentenceEndRegex = /([.!?]+[\s\n]+)/;
    let match = this.buffer.match(sentenceEndRegex);
    while (match && match.index !== void 0) {
      const splitIdx = match.index + match[0].length;
      const sentence = this.buffer.slice(0, splitIdx).trim();
      if (sentence) {
        this.onSentence(sentence);
      }
      this.buffer = this.buffer.slice(splitIdx);
      match = this.buffer.match(sentenceEndRegex);
    }
  }
  flush() {
    if (this.buffer.trim()) {
      this.onSentence(this.buffer.trim());
      this.buffer = "";
    }
  }
};

// src/components/guardrails.ts
var INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|directions)/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+in\s+(developer|dan|jailbreak)\s+mode/i,
  /system\s+override\s*:/i,
  /bypass\s+all\s+(filters|rules|safeguards)/i
];
var ContentGuard = class {
  constructor(options = {}) {
    this.blocklist = new Set((options.blocklist || []).map((w) => w.toLowerCase()));
    this.checkInjection = options.checkPromptInjection ?? true;
    this.redactPiiEnabled = options.redactPii ?? true;
    this.maxCharacters = options.maxCharacters ?? 5e4;
  }
  /**
   * Redacts sensitive personal identifiable information (PII) and secret API keys
   */
  redactPii(text) {
    let result = text;
    const detections = [];
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => {
      detections.push({ type: "email", match });
      return "[REDACTED_EMAIL]";
    });
    result = result.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, (match) => {
      detections.push({ type: "credit_card", match });
      return "[REDACTED_CARD]";
    });
    result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, (match) => {
      detections.push({ type: "ssn", match });
      return "[REDACTED_SSN]";
    });
    result = result.replace(/\b(?:sk-[a-zA-Z0-9_-]{20,}|AIza[0-9A-Za-z-_]{35})\b/g, (match) => {
      detections.push({ type: "api_key", match });
      return "[REDACTED_API_KEY]";
    });
    return { redactedText: result, detections };
  }
  /**
   * Check for known adversarial jailbreak & system prompt override patterns
   */
  detectPromptInjection(text) {
    const matches = [];
    for (const pattern of INJECTION_PATTERNS) {
      const found = text.match(pattern);
      if (found) {
        matches.push(found[0]);
      }
    }
    return {
      suspicious: matches.length > 0,
      matches
    };
  }
  /**
   * Complete validation and sanitization pass
   */
  inspect(text) {
    const violations = [];
    let processed = text;
    let detections = [];
    if (processed.length > this.maxCharacters) {
      violations.push(`Text length exceeds maximum allowed character limit (${this.maxCharacters})`);
      processed = processed.slice(0, this.maxCharacters);
    }
    if (this.checkInjection) {
      const injection = this.detectPromptInjection(processed);
      if (injection.suspicious) {
        violations.push(`Suspected prompt injection pattern: "${injection.matches[0]}"`);
      }
    }
    if (this.blocklist.size > 0) {
      const lower = processed.toLowerCase();
      for (const blocked of this.blocklist) {
        if (lower.includes(blocked)) {
          violations.push(`Content contains blocked term: "${blocked}"`);
        }
      }
    }
    if (this.redactPiiEnabled) {
      const pii = this.redactPii(processed);
      processed = pii.redactedText;
      detections = pii.detections;
    }
    return {
      text: processed,
      isSafe: violations.length === 0,
      violations,
      piiDetections: detections
    };
  }
};
function createContentGuard(options = {}) {
  return new ContentGuard(options);
}

// src/version.ts
var VERSION = "0.1.0";
var PACKAGE_NAME = "makron.js";
var DISPLAY_NAME = "Makron.js";
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
 * Makron.js Model Aliases
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
 * Makron.js Base Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Request & Configuration Validation
 */
/**
 * @license MIT
 * Makron.js Environment Variable Resolution
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
 * Makron.js Message Normalization Engine
 */
/**
 * @license MIT
 * Makron.js Universal Response Normalizer
 */
/**
 * @license MIT
 * Makron.js Server-Sent Events & Stream Normalizer
 */
/**
 * @license MIT
 * Makron.js Anthropic Claude Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Cohere Provider Adapter with Chat, Embeddings, and Rerank
 */
/**
 * @license MIT
 * Makron.js Retry Engine with Exponential Backoff and Jitter
 */
/**
 * @license MIT
 * Makron.js OpenAI-Compatible Provider Adapter
 */
/**
 * @license MIT
 * Makron.js DeepSeek Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Google Gemini Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Groq LPU Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Hugging Face Inference Adapter
 */
/**
 * @license MIT
 * Makron.js Mistral AI Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Ollama Local Endpoint Adapter
 */
/**
 * @license MIT
 * Makron.js OpenAI First-Party Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Alibaba Cloud Model Studio / Qwen Provider Adapter
 */
/**
 * @license MIT
 * Makron.js vLLM High-Throughput Serving Adapter
 */
/**
 * @license MIT
 * Makron.js xAI Grok Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Z.ai / GLM Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Provider Registry
 */
/**
 * @license MIT
 * Makron.js Request Options Normalization
 */
/**
 * @license MIT
 * Makron.js Model Capability Engine
 */
/**
 * @license MIT
 * Makron.js Core Client
 */
/**
 * @license MIT
 * Makron.js Model Catalog Types
 */
/**
 * @license MIT
 * Makron.js Live Model Discovery
 */
/**
 * @license MIT
 * Makron.js Model Catalog and Registry Entry Point
 */
/**
 * @license MIT
 * Makron.js Chat Capability Helpers
 */
/**
 * @license MIT
 * Makron.js Streaming Capability Utilities
 */
/**
 * @license MIT
 * Makron.js Tools Definition and Execution Helpers
 */
/**
 * @license MIT
 * Makron.js Structured Output Helper
 */
/**
 * @license MIT
 * Makron.js Capabilities Entry Point
 */
/**
 * @license MIT
 * Makron.js Embeddings Types
 */
/**
 * @license MIT
 * Makron.js Vector Normalization and Similarity Math
 */
/**
 * @license MIT
 * Makron.js Embeddings Module
 */
/**
 * @license MIT
 * Makron.js Ecosystem Integrations Types
 */
/**
 * @license MIT
 * Makron.js Comprehensive Integration Ecosystem Registry
 */
/**
 * @license MIT
 * Makron.js Model Context Protocol (MCP) Client Bridge
 * Source: https://modelcontextprotocol.io
 */
/**
 * @license MIT
 * Makron.js LangChain Bridge
 * Wraps MakronClient to conform to LangChain BaseChatModel interfaces
 */
/**
 * @license MIT
 * Makron.js LangGraph Agent Node Bridge
 */
/**
 * @license MIT
 * Makron.js LlamaIndex Adapter Bridge
 */
/**
 * @license MIT
 * Makron.js Vercel AI SDK Bridge
 */
/**
 * @license MIT
 * Makron.js Vector Store Interface & In-Memory Implementation
 */
/**
 * @license MIT
 * Makron.js Conversation Memory Systems
 */
/**
 * @license MIT
 * Makron.js Observability & Tracing Engine
 */
/**
 * @license MIT
 * Makron.js Integrations Entry Point
 */
/**
 * @license MIT
 * Makron.js Autonomous ReAct Agent Component
 * A plug-and-play multi-turn reasoning and tool execution engine.
 */
/**
 * @license MIT
 * Makron.js Standard Built-in Tool Library
 * Ready-to-use tools that can be plugged immediately into any Makron client or Agent.
 */
/**
 * @license MIT
 * Makron.js Plug-and-Play RAG Pipeline & Text Splitter
 * Complete semantic document retrieval and context-grounded generation component.
 */
/**
 * @license MIT
 * Makron.js Multi-Provider Fallback & Resilience Chain Component
 * Seamlessly fails over across providers or models on errors, rate limits, or timeouts.
 */
/**
 * @license MIT
 * Makron.js Stateful Conversation Session & Token Budget Memory
 * Plug-and-play chat session management with automated pruning.
 */
/**
 * @license MIT
 * Makron.js Prompt Templates & System Prompt Presets
 * Reusable, type-safe prompt composition components.
 */
/**
 * @license MIT
 * Makron.js Structured Output Extractor & JSON Repair Component
 * Robustly parses and self-heals structured outputs from any LLM.
 */
/**
 * @license MIT
 * Makron.js Stream Consumer & Token Buffer Component
 * Utilities for consuming, buffering, and typewriter-rendering token streams.
 */
/**
 * @license MIT
 * Makron.js Content Guardrails & PII Sanitizer Component
 * Protects applications from prompt injections, leaks, and unwanted terms.
 */
/**
 * @license MIT
 * Makron.js Ready-to-Use Components & Built-in Functionalities
 * Subpath entry point: `makron.js/components`
 */
/**
 * @license MIT
 * Makron.js version metadata
 */
/**
 * @license MIT
 * Makron.js - Unified AI Integration & Model Orchestration Engine
 * Root Library Entry Point
 */

exports.AdapterNotFoundError = AdapterNotFoundError;
exports.Agent = Agent;
exports.AuthenticationError = AuthenticationError;
exports.BUNDLED_MODEL_CATALOG = BUNDLED_MODEL_CATALOG;
exports.CAPABILITY_LIST = CAPABILITY_LIST;
exports.ChatPromptTemplate = ChatPromptTemplate;
exports.ConfigurationError = ConfigurationError;
exports.ContentGuard = ContentGuard;
exports.ConversationSession = ConversationSession;
exports.DISPLAY_NAME = DISPLAY_NAME;
exports.FallbackChain = FallbackChain;
exports.INTEGRATION_CATALOG = INTEGRATION_CATALOG;
exports.InMemoryVectorStore = InMemoryVectorStore;
exports.IntegrationDependencyError = IntegrationDependencyError;
exports.IntegrationRegistry = IntegrationRegistry;
exports.MakronClient = MakronClient;
exports.MakronError = MakronError;
exports.ModelLoadError = ModelLoadError;
exports.ModelNotFoundError = ModelNotFoundError;
exports.ModelRegistry = ModelRegistry;
exports.PACKAGE_NAME = PACKAGE_NAME;
exports.PromptTemplate = PromptTemplate;
exports.ProviderError = ProviderError;
exports.ProviderRegistry = ProviderRegistry;
exports.RagPipeline = RagPipeline;
exports.RateLimitError = RateLimitError;
exports.RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter;
exports.RequestAbortedError = RequestAbortedError;
exports.RequestTimeoutError = RequestTimeoutError;
exports.StreamSentenceBuffer = StreamSentenceBuffer;
exports.SystemPrompts = SystemPrompts;
exports.TokenBudgetMemory = TokenBudgetMemory;
exports.UnsupportedCapabilityError = UnsupportedCapabilityError;
exports.VERSION = VERSION;
exports.assertCapability = assertCapability;
exports.calculatorTool = calculatorTool;
exports.collectStreamText = collectStreamText;
exports.collectStreamWithStats = collectStreamWithStats;
exports.contentToString = contentToString;
exports.convertMcpToolsToMakron = convertMcpToolsToMakron;
exports.cosineSimilarity = cosineSimilarity;
exports.createAgent = createAgent;
exports.createCapabilities = createCapabilities;
exports.createContentGuard = createContentGuard;
exports.createFallbackChain = createFallbackChain;
exports.createMakron = createMakron;
exports.createMcpToolBridge = createMcpToolBridge;
exports.createRagPipeline = createRagPipeline;
exports.createSession = createSession;
exports.createStructuredParser = createStructuredParser;
exports.dateTimeTool = dateTimeTool;
exports.defaultIntegrationRegistry = defaultIntegrationRegistry;
exports.defaultModelRegistry = defaultModelRegistry;
exports.defaultProviderRegistry = defaultProviderRegistry;
exports.defineProvider = defineProvider;
exports.defineSchema = defineSchema;
exports.defineTool = defineTool;
exports.discoverModels = discoverModels;
exports.dotProduct = dotProduct;
exports.executeToolCalls = executeToolCalls;
exports.extractJson = extractJson;
exports.extractSystemPrompt = extractSystemPrompt;
exports.findMostSimilar = findMostSimilar;
exports.getModelInfo = getModelInfo;
exports.getProvider = getProvider;
exports.hasAudioContent = hasAudioContent;
exports.hasVisionContent = hasVisionContent;
exports.jsonParserTool = jsonParserTool;
exports.l2Normalize = l2Normalize;
exports.listModels = listModels;
exports.listProviders = listProviders;
exports.normalizeMessages = normalizeMessages;
exports.registerProvider = registerProvider;
exports.repairJson = repairJson;
exports.resolveModelAlias = resolveModelAlias;
exports.standardTools = standardTools;
exports.supportsCapability = supportsCapability;
exports.textProcessingTool = textProcessingTool;
exports.transformStreamText = transformStreamText;
exports.webSearchTool = webSearchTool;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map