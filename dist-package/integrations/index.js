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

// src/integrations/langchain.ts
var MakronLangChainChatModel = class {
  constructor(client) {
    this.client = client;
    this.modelName = client.model || "gpt-5-mini";
  }
  async invoke(input) {
    let messages;
    if (typeof input === "string") {
      messages = [{ role: "user", content: input }];
    } else {
      messages = input.map((m) => {
        if (m._getType) {
          const type = m._getType();
          const role = type === "human" ? "user" : type === "ai" ? "assistant" : type === "system" ? "system" : "user";
          return { role, content: m.content || m.text || "" };
        }
        return m;
      });
    }
    const res = await this.client.chat({ messages });
    return {
      content: res.text,
      response_metadata: {
        id: res.id,
        model: res.model,
        provider: res.provider,
        usage: res.usage,
        finish_reason: res.finishReason.reason
      }
    };
  }
};

// src/integrations/langgraph.ts
function createMakronNode(client) {
  return async (state) => {
    const res = await client.chat({
      messages: state.messages
    });
    const newMessages = [
      ...state.messages,
      {
        role: "assistant",
        content: res.text,
        toolCalls: res.toolCalls
      }
    ];
    return {
      messages: newMessages,
      lastResponse: res
    };
  };
}

// src/integrations/llamaindex.ts
var MakronLlamaIndexLLM = class {
  constructor(client) {
    this.client = client;
  }
  async complete(prompt) {
    const res = await this.client.chat({
      messages: [{ role: "user", content: prompt }]
    });
    return { text: res.text };
  }
  async *streamComplete(prompt) {
    let accumulated = "";
    for await (const chunk of this.client.stream({
      messages: [{ role: "user", content: prompt }]
    })) {
      accumulated += chunk.deltaText;
      yield {
        text: accumulated,
        delta: chunk.deltaText
      };
    }
  }
};

// src/integrations/vercel-ai.ts
function toTextStream(stream) {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.deltaText) {
            controller.enqueue(chunk.deltaText);
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
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

// src/integrations/memory.ts
var BufferWindowMemory = class {
  constructor(windowSize = 10) {
    this.messages = [];
    this.windowSize = windowSize;
  }
  addMessage(message) {
    this.messages.push(message);
    if (this.messages.length > this.windowSize) {
      this.messages.shift();
    }
  }
  getMessages() {
    return [...this.messages];
  }
  clear() {
    this.messages = [];
  }
};

// src/utils/redact.ts
var SENSITIVE_KEY_PATTERNS = [
  /api[-_]?key/i,
  /auth[-_]?token/i,
  /bearer/i,
  /secret/i,
  /password/i,
  /private[-_]?key/i,
  /access[-_]?token/i
];
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
function redactObject(obj) {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      return redactString(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item));
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitiveKey) {
      if (typeof value === "string" && value.length > 0) {
        result[key] = `${value.slice(0, 3)}...[REDACTED]`;
      } else {
        result[key] = "[REDACTED]";
      }
    } else {
      result[key] = redactObject(value);
    }
  }
  return result;
}

// src/integrations/observability.ts
var ObservabilityManager = class {
  constructor() {
    this.handlers = [];
  }
  addHandler(handler) {
    this.handlers.push(handler);
  }
  startSpan(provider, model, metadata) {
    const span = {
      traceId: `trace_${Math.random().toString(36).substring(2, 11)}`,
      spanId: `span_${Math.random().toString(36).substring(2, 9)}`,
      provider,
      model,
      startTime: Date.now(),
      metadata: metadata ? redactObject(metadata) : void 0
    };
    for (const handler of this.handlers) {
      try {
        handler.onSpanStart?.(span);
      } catch (err) {
        console.error("[Makron:Observability] Error in onSpanStart handler:", err);
      }
    }
    return span;
  }
  endSpan(span, usage, error) {
    span.endTime = Date.now();
    span.latencyMs = span.endTime - span.startTime;
    if (usage) {
      span.promptTokens = usage.promptTokens;
      span.completionTokens = usage.completionTokens;
      span.totalTokens = usage.totalTokens;
    }
    if (error) {
      span.error = error.message;
    }
    for (const handler of this.handlers) {
      try {
        if (error) {
          handler.onError?.(span, error);
        } else {
          handler.onSpanEnd?.(span);
        }
      } catch (err) {
        console.error("[Makron:Observability] Error in onSpanEnd handler:", err);
      }
    }
  }
};
var defaultObservability = new ObservabilityManager();
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
 * Makron.js Vector Normalization and Similarity Math
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
 * Makron.js Secret and Token Redaction Utilities
 */
/**
 * @license MIT
 * Makron.js Observability & Tracing Engine
 */
/**
 * @license MIT
 * Makron.js Integrations Entry Point
 */

export { BufferWindowMemory, INTEGRATION_CATALOG, InMemoryVectorStore, IntegrationRegistry, MakronLangChainChatModel, MakronLlamaIndexLLM, ObservabilityManager, convertMcpToolsToMakron, createMakronNode, createMcpToolBridge, defaultIntegrationRegistry, defaultObservability, toTextStream };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map