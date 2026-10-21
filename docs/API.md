# Makron.js Developer API Reference

## Client Creation

```ts
import { createMakron } from 'makron.js';

const ai = createMakron({
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'deepseek' | 'ollama' | 'vllm' | 'cohere' | 'mistral' | 'qwen' | 'zai' | 'openai-compatible',
  apiKey?: string,
  baseURL?: string,
  model?: string,
  timeoutMs?: number,
  retries?: number,
  headers?: Record<string, string>,
});
```

## `ai.chat(request, options?)`

Performs chat completion.

```ts
const response = await ai.chat({
  messages: [
    { role: 'system', content: 'You are an AI code reviewer.' },
    { role: 'user', content: 'Review this TypeScript function...' },
  ],
  temperature?: number,
  maxTokens?: number,
  tools?: ToolDefinition[],
  toolChoice?: 'auto' | 'none' | 'required',
  responseFormat?: 'text' | 'json_object' | StructuredOutputSchema,
}, {
  signal?: AbortSignal,
  timeoutMs?: number,
});

console.log(response.text);
console.log(response.toolCalls);
console.log(response.usage.totalTokens);
```

## `ai.stream(request, options?)`

Streams response tokens as an async iterable of `ChatChunk`.

```ts
for await (const chunk of ai.stream({
  messages: [{ role: 'user', content: 'Explain recursion.' }],
})) {
  process.stdout.write(chunk.deltaText);
}
```

## `ai.embed(request, options?)`

Generates dense vector embeddings.

```ts
const embedRes = await ai.embed({
  model: 'text-embedding-3-large',
  input: ['What is semantic search?', 'How do vector databases work?'],
  dimensions?: 1536,
});

for (const vec of embedRes.embeddings) {
  console.log(`Vector ${vec.index}: length ${vec.vector.length}`);
}
```

## `ai.rerank(request, options?)`

Reranks candidate documents semantically (Cohere and compatible rerankers).

```ts
const rerankRes = await ai.rerank({
  model: 'rerank-v3.5',
  query: 'How to deploy Next.js to Cloud Run?',
  documents: [
    'Guide to Docker containers on Google Cloud Run',
    'Cooking recipes for Italian pasta',
    'Next.js production deployment checklist',
  ],
  topN: 2,
});
```

## Tool Calling

```ts
import { defineTool, executeToolCalls } from 'makron.js';

const calculatorTool = defineTool(
  'calculate',
  'Performs basic math calculations',
  {
    type: 'object',
    properties: {
      expression: { type: 'string' },
    },
    required: ['expression'],
  },
  async ({ expression }) => {
    return { result: eval(expression) };
  }
);

const res = await ai.chat({
  messages: [{ role: 'user', content: 'What is 42 * 17?' }],
  tools: [calculatorTool.definition],
});

if (res.toolCalls) {
  const toolResults = await executeToolCalls(res.toolCalls, [calculatorTool]);
}
```
