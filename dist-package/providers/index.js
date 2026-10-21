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

// src/utils/env.ts
function getEnv(key) {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key] !== void 0 && process.env[key] !== "") {
      return process.env[key];
    }
  }
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const metaEnv = import.meta.env;
    if (metaEnv[key]) return metaEnv[key];
    if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
  }
  if (typeof window !== "undefined" && window.__MAKRON_ENV__) {
    return window.__MAKRON_ENV__[key];
  }
  return void 0;
}

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
 * Makron.js JSON Parsing Utilities
 */
/**
 * @license MIT
 * Makron.js Universal Fetch & Transport
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
 * Makron.js Retry Engine with Exponential Backoff and Jitter
 */
/**
 * @license MIT
 * Makron.js OpenAI-Compatible Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Environment Variable Resolution
 */
/**
 * @license MIT
 * Makron.js OpenAI First-Party Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Message Normalization Engine
 */
/**
 * @license MIT
 * Makron.js Anthropic Claude Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Google Gemini Provider Adapter
 */
/**
 * @license MIT
 * Makron.js xAI Grok Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Groq LPU Provider Adapter
 */
/**
 * @license MIT
 * Makron.js DeepSeek Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Alibaba Cloud Model Studio / Qwen Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Z.ai / GLM Provider Adapter
 */
/**
 * @license MIT
 * Makron.js Ollama Local Endpoint Adapter
 */
/**
 * @license MIT
 * Makron.js vLLM High-Throughput Serving Adapter
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
 * Makron.js Cohere Provider Adapter with Chat, Embeddings, and Rerank
 */
/**
 * @license MIT
 * Makron.js Provider Registry
 */
/**
 * @license MIT
 * Makron.js Provider Adapters Entry Point
 */

export { AnthropicAdapter, BaseProviderAdapter, CohereAdapter, DeepSeekAdapter, GeminiAdapter, GroqAdapter, HuggingFaceAdapter, MistralAdapter, OllamaAdapter, OpenAIAdapter, OpenAICompatibleAdapter, ProviderRegistry, QwenAdapter, VLLMAdapter, XAIAdapter, ZaiAdapter, defaultProviderRegistry, defineProvider, getProvider, listProviders, registerProvider };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map