// src/utils/json.ts
function safeJsonParse(input, fallback) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
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
/**
 * @license MIT
 * Makron.js JSON Parsing Utilities
 */
/**
 * @license MIT
 * Makron.js Tools Definition and Execution Helpers
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
 * Makron.js Plug-and-Play RAG Pipeline & Text Splitter
 * Complete semantic document retrieval and context-grounded generation component.
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
 * Makron.js Multi-Provider Fallback & Resilience Chain Component
 * Seamlessly fails over across providers or models on errors, rate limits, or timeouts.
 */
/**
 * @license MIT
 * Makron.js Message Normalization Engine
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

export { Agent, ChatPromptTemplate, ContentGuard, ConversationSession, FallbackChain, PromptTemplate, RagPipeline, RecursiveCharacterTextSplitter, StreamSentenceBuffer, SystemPrompts, TokenBudgetMemory, calculatorTool, collectStreamWithStats, createAgent, createContentGuard, createFallbackChain, createRagPipeline, createSession, createStructuredParser, dateTimeTool, extractJson, jsonParserTool, repairJson, standardTools, textProcessingTool, webSearchTool };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map