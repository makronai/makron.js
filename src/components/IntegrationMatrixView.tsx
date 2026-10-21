import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Copy, Check, ExternalLink, Code2, ShieldAlert, Cpu } from 'lucide-react';
import { INTEGRATION_CATALOG } from '../integrations/registry';
import { IntegrationCategory, IntegrationSupportLevel } from '../integrations/types';

export const IntegrationMatrixView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Domains' },
    { id: 'mcp', label: 'Model Context Protocol (MCP)' },
    { id: 'agent-framework', label: 'Agent Frameworks' },
    { id: 'rag-retrieval', label: 'RAG & Retrieval' },
    { id: 'vector-database', label: 'Vector Databases' },
    { id: 'observability', label: 'Observability & Tracing' },
    { id: 'security-guardrails', label: 'Security & Guardrails' },
    { id: 'memory', label: 'Memory Systems' },
    { id: 'automation', label: 'Automation & Workflows' },
  ];

  const filtered = INTEGRATION_CATALOG.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedLevel !== 'all' && item.supportLevel !== selectedLevel) return false;
    return true;
  });

  const getCodeSnippet = (id: string): string => {
    switch (id) {
      case 'mcp-sdk':
      case 'mcp-github':
      case 'mcp-postgres':
        return `import { createMakron } from 'makron.js';
import { convertMcpToolsToMakron, createMcpToolBridge } from 'makron.js/integrations';

// Convert official MCP client tools into native Makron tool definitions
const makronTools = convertMcpToolsToMakron(mcpClientTools);
const ai = createMakron({ provider: 'openai', model: 'gpt-5-mini' });
const res = await ai.chat({
  messages: [{ role: 'user', content: 'Search repo issues' }],
  tools: makronTools,
});`;

      case 'langchain':
        return `import { createMakron } from 'makron.js';
import { MakronLangChainChatModel } from 'makron.js/integrations';

const ai = createMakron({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' });
const model = new MakronLangChainChatModel(ai);

// Pass into LangChain agents or prompt chains
const result = await model.invoke('Analyze Q3 financial trends.');`;

      case 'langgraph':
        return `import { createMakron } from 'makron.js';
import { createMakronNode } from 'makron.js/integrations';

const ai = createMakron({ provider: 'groq', model: 'openai/gpt-oss-120b' });
const agentNode = createMakronNode(ai);

// Use in LangGraph StateGraph as an active reasoning node
graph.addNode('reasoning_agent', agentNode);`;

      case 'pinecone':
      case 'qdrant':
      case 'chroma':
      case 'pgvector':
        return `import { createMakron } from 'makron.js';
import { InMemoryVectorStore } from 'makron.js/integrations';

const ai = createMakron({ provider: 'openai' });
const embedRes = await ai.embed({
  model: 'text-embedding-3-large',
  input: ['What is semantic search?'],
});

const store = new InMemoryVectorStore();
await store.upsert([{ id: 'doc_1', vector: embedRes.embeddings[0].vector, content: 'Text...' }]);
const matches = await store.query(queryVector, 5);`;

      case 'langfuse':
      case 'helicone':
      case 'langsmith':
        return `import { defaultObservability } from 'makron.js/integrations';

// Register trace callback handler
defaultObservability.addHandler({
  onSpanEnd: (span) => {
    console.log(\`Trace \${span.traceId}: \${span.latencyMs}ms, \${span.totalTokens} tokens\`);
    // Export to Langfuse or Arize Phoenix
  },
});`;

      default:
        return `import { createMakron } from 'makron.js';

const ai = createMakron({
  provider: 'openai-compatible',
  baseURL: 'https://api.example.com/v1',
  model: 'custom-model',
});
const response = await ai.chat({ messages: [{ role: 'user', content: 'Hello' }] });`;
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(getCodeSnippet(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Honest Ecosystem Integration Matrix
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          A generic HTTP endpoint is not equivalent to a native adapter. Makron.js classifies each integration by its actual support contract and keeps heavy frameworks optional.
        </p>

        {/* Support Level Legend */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Built-in: Tested in Core
          </span>
          <span className="flex items-center gap-1.5 text-purple-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span> Optional adapter: Separate subpath
          </span>
          <span className="flex items-center gap-1.5 text-blue-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Compatible endpoint: Standard protocol
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Integration recipe: Verified code pattern
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{item.name}</h2>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">{item.category}</span>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                    item.supportLevel === 'built-in'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : item.supportLevel === 'optional-adapter'
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : item.supportLevel === 'compatible-endpoint'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {item.supportLevel}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.description}</p>

              {item.peerDependency ? (
                <div className="mt-3 text-xs text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 font-mono">
                  <span className="text-zinc-500">Optional Peer Dep: </span>
                  <span className="text-indigo-400">npm install {item.peerDependency}</span>
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-500 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800/60 font-mono">
                  ✓ Zero extra dependencies required
                </div>
              )}
            </div>

            {/* Code Snippet Box */}
            <div className="relative bg-zinc-950 rounded-lg p-3 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto">
              <button
                onClick={() => handleCopy(item.id)}
                className="absolute right-2 top-2 p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                aria-label={`Copy code snippet for ${item.name}`}
              >
                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="pr-8">{getCodeSnippet(item.id)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
