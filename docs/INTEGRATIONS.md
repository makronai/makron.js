# Makron.js Ecosystem Integrations Matrix

This matrix documents the integration level, dependency requirements, and setup instructions for all supported AI frameworks, infrastructure, and tool ecosystems.

## Support Level Definitions

- **Built-in**: Included, fully implemented, and unit tested directly within Makron.js.
- **Optional adapter**: Implemented in an independently importable subpath with optional peer dependencies.
- **Compatible endpoint**: Connectable via standard OpenAI-compatible HTTP/SSE protocols.
- **Integration recipe**: Practical, verified code recipe using the vendor's official interface.
- **Community**: Community-contributed or untested extension.
- **Planned**: Documented target for a future release; not presented as functional today.

---

## 1. LLMs & Foundational Providers

| Provider | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **OpenAI GPT** | LLM | Built-in | `OPENAI_API_KEY` | `createMakron({ provider: 'openai', model: 'gpt-5-mini' })` |
| **Anthropic Claude** | LLM | Built-in | `ANTHROPIC_API_KEY` | `createMakron({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' })` |
| **Google Gemini** | LLM | Built-in | `GEMINI_API_KEY` | `createMakron({ provider: 'gemini', model: 'gemini-3.8-flash' })` |
| **xAI Grok** | LLM | Built-in | `XAI_API_KEY` | `createMakron({ provider: 'xai', model: 'grok-4.7' })` |
| **Groq LPU** | LLM | Built-in | `GROQ_API_KEY` | `createMakron({ provider: 'groq', model: 'openai/gpt-oss-120b' })` |
| **DeepSeek** | LLM | Built-in | `DEEPSEEK_API_KEY` | `createMakron({ provider: 'deepseek', model: 'deepseek-flash' })` |
| **Alibaba Qwen** | LLM | Built-in | `QWEN_API_KEY` | `createMakron({ provider: 'qwen', model: 'qwen3.8-max' })` |
| **Z.ai GLM** | LLM | Built-in | `ZAI_API_KEY` | `createMakron({ provider: 'zai', model: 'glm-5.3' })` |
| **Mistral AI** | LLM | Built-in | `MISTRAL_API_KEY` | `createMakron({ provider: 'mistral', model: 'mistral-large-2411' })` |
| **Cohere** | LLM | Built-in | `COHERE_API_KEY` | `createMakron({ provider: 'cohere', model: 'command-r-plus-08-2024' })` |
| **Meta Llama** | LLM | Compatible endpoint | Local or hosted deployment | `createMakron({ provider: 'openai-compatible', baseURL: '...' })` |

---

## 2. LLM Serving Platforms

| Platform | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **Ollama** | Serving | Built-in | Running `ollama serve` | `createMakron({ provider: 'ollama', baseURL: 'http://localhost:11434/v1' })` |
| **vLLM** | Serving | Built-in | Running vLLM endpoint | `createMakron({ provider: 'vllm', baseURL: 'http://localhost:8000/v1' })` |
| **Hugging Face Inference** | Serving | Built-in | `HF_TOKEN` | `createMakron({ provider: 'huggingface' })` |

---

## 3. Agentic AI & Workflow Frameworks

| Framework | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **LangGraph** | Agent | Optional adapter | `@langchain/langgraph` | `import { createMakronNode } from 'makron.js/integrations'` |
| **CrewAI** | Agent | Integration recipe | CrewAI Python/TS | Configure CrewAI `llm` with Makron base URL |
| **Microsoft AutoGen** | Agent | Integration recipe | AutoGen | Configure `config_list` pointing to Makron OpenAI proxy |
| **LlamaIndex Workflows** | Agent | Optional adapter | `llamaindex` | `import { MakronLlamaIndexLLM } from 'makron.js/integrations'` |
| **Agno (Phidata)** | Agent | Integration recipe | Agno | Pass Makron OpenAI compatible endpoint |
| **AWS Strands** | Agent | Integration recipe | AWS SDK | Route Bedrock agents via Makron proxy |
| **CAMEL** | Agent | Integration recipe | CAMEL | Open-weight communicative agents |

---

## 4. RAG & Retrieval Frameworks

| Framework | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **LangChain** | RAG | Optional adapter | `@langchain/core` | `new MakronLangChainChatModel(client)` |
| **LlamaIndex** | RAG | Optional adapter | `llamaindex` | `new MakronLlamaIndexLLM(client)` |
| **Haystack** | RAG | Compatible endpoint | Haystack | Connect `OpenAIChatGenerator` |
| **DSPy** | RAG | Compatible endpoint | DSPy | Point `dspy.LM('openai/custom', api_base=...)` |
| **GraphRAG** | RAG | Integration recipe | GraphRAG | Point entity extractor to Makron reasoning model |
| **Unstructured** | RAG | Integration recipe | Unstructured | Pipe document chunks into Makron `ai.embed()` |

---

## 5. Model Context Protocol (MCP)

| Server / Tool | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **MCP Official SDK** | Protocol | Built-in | `@modelcontextprotocol/sdk` (optional) | `convertMcpToolsToMakron()`, `createMcpToolBridge()` |
| **FastMCP** | Server | Integration recipe | Python FastMCP | JSON-RPC STDIO or SSE endpoint |
| **GitHub MCP Server** | Tools | Built-in | GitHub Token | Inspect repo issues and commits via MCP tool bridge |
| **Slack MCP Server** | Tools | Built-in | Slack Bot Token | Read channels and post via Makron tool execution |
| **PostgreSQL MCP Server**| Tools | Built-in | Postgres DB | Read schemas and query tables via MCP tool bridge |
| **Filesystem MCP Server**| Tools | Built-in | Node.js | Safe directory access tools |

---

## 6. AI Security & Guardrails

| Tool | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **NVIDIA NeMo Guardrails** | Security | Compatible endpoint | NeMo Server | Route prompts through NeMo guardrails proxy |
| **Guardrails AI** | Security | Integration recipe | Guardrails | Validate outputs against schemas using `parseStructuredOutput` |
| **Microsoft Presidio** | Security | Integration recipe | Presidio API | Sanitize PII before passing messages to `ai.chat()` |
| **Lakera Guard** | Security | Integration recipe | Lakera API Key | Evaluate prompt injection before sending to model |
| **Azure Content Safety** | Security | Integration recipe | Azure Key | Pre-flight content safety check |

---

## 7. Observability & Evaluation

| Platform | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **Langfuse** | Tracing | Built-in | `LANGFUSE_PUBLIC_KEY` | `defaultObservability.addHandler(langfuseHandler)` |
| **Helicone** | Tracing | Built-in | `HELICONE_API_KEY` | Pass header `'Helicone-Auth': 'Bearer ...'` |
| **LangSmith** | Tracing | Built-in | `LANGSMITH_API_KEY` | Tracing callback registered in `defaultObservability` |
| **Arize Phoenix** | Tracing | Built-in | Phoenix Server | Send spans to OpenInference endpoint |
| **Ragas** | Eval | Integration recipe | Ragas | Evaluate Makron RAG retrieval context and answer quality |

---

## 8. Memory Systems

| System | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **Makron Buffer Memory**| Memory | Built-in | None | `new BufferWindowMemory(windowSize)` |
| **Mem0** | Memory | Integration recipe | Mem0 API | Retrieve user memories before invoking `ai.chat()` |
| **Zep** | Memory | Integration recipe | Zep Server | Graph memory retrieval injected into prompt |
| **Redis** | Memory | Integration recipe | Redis client | Store session message history |
| **PostgreSQL** | Memory | Integration recipe | pg client | Relational conversation history tables |

---

## 9. Automation Platforms

| Platform | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **n8n** | Automation | Compatible endpoint | n8n | Use AI Agent node pointing to Makron endpoint |
| **Zapier** | Automation | Integration recipe | Zapier Actions | Execute Zapier actions from Makron tool definitions |
| **Temporal** | Automation | Integration recipe | Temporal SDK | Durable activities wrapping Makron requests with retries |
| **Apache Airflow** | Automation | Integration recipe | Airflow | Batch generation DAGs |

---

## 10. Vector Databases

| Database | Category | Support Level | Requirements | Connection Method |
|---|---|---|---|---|
| **InMemoryVectorStore**| Vector DB | Built-in | None | `new InMemoryVectorStore()` |
| **Pinecone** | Vector DB | Built-in | `@pinecone-database/pinecone` | Upsert `ai.embed()` vectors into Pinecone indexes |
| **Qdrant** | Vector DB | Built-in | `@qdrant/js-client-rest` | Store embeddings and metadata payloads |
| **Chroma** | Vector DB | Built-in | `chromadb` | Embeddings and semantic search |
| **Weaviate** | Vector DB | Built-in | `weaviate-client` | Vector search collections |
| **pgvector** | Vector DB | Built-in | PostgreSQL `pgvector` | SQL `SELECT * FROM items ORDER BY embedding <-> $1` |
