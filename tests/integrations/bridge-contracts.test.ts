import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertMcpToolsToMakron,
  createMcpToolBridge,
  InMemoryVectorStore,
  defineTool,
  executeToolCalls,
  cosineSimilarity,
  l2Normalize,
} from '../../src/index';

test('MCP tool bridge converts MCP tool schemas and invokes transport', async () => {
  const mcpTools = [
    {
      name: 'search_database',
      description: 'Search relational database',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  ];

  const makronTools = convertMcpToolsToMakron(mcpTools);
  assert.equal(makronTools.length, 1);
  assert.equal(makronTools[0].function.name, 'search_database');

  let calledWith: any = null;
  const mockTransport = {
    callTool: async (name: string, args: any) => {
      calledWith = { name, args };
      return { rows: [{ id: 1, name: 'Alice' }] };
    },
  };

  const executable = createMcpToolBridge(mcpTools[0], mockTransport);
  const result = await executable.execute({ query: 'SELECT * FROM users' });

  assert.deepEqual(calledWith, { name: 'search_database', args: { query: 'SELECT * FROM users' } });
  assert.deepEqual(result, { rows: [{ id: 1, name: 'Alice' }] });
});

test('defineTool and executeToolCalls runner parses arguments and runs handler', async () => {
  const weatherTool = defineTool(
    'get_weather',
    'Get current weather in city',
    {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    },
    async (args) => {
      return { temp: 22, unit: 'C', location: args.city };
    }
  );

  const results = await executeToolCalls(
    [
      {
        id: 'call_1',
        name: 'get_weather',
        arguments: JSON.stringify({ city: 'Tokyo' }),
      },
    ],
    [weatherTool]
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].toolCallId, 'call_1');
  assert.equal(results[0].isError, false);
  assert.deepEqual(results[0].result, { temp: 22, unit: 'C', location: 'Tokyo' });
});

test('InMemoryVectorStore stores embeddings and queries by cosine similarity', async () => {
  const store = new InMemoryVectorStore();
  await store.upsert([
    { id: '1', vector: [1, 0, 0], content: 'Document on machine learning' },
    { id: '2', vector: [0, 1, 0], content: 'Document on astronomy' },
  ]);

  const queryVector = [0.95, 0.05, 0];
  const results = await store.query(queryVector, 1);

  assert.equal(results.length, 1);
  assert.equal(results[0].document.id, '1');
  assert.ok(results[0].score > 0.9);
});

test('Vector math functions compute cosine similarity and L2 normalization accurately', () => {
  const v1 = [1, 2, 3];
  const normalized = l2Normalize(v1);
  assert.equal(normalized.length, 3);

  const sim = cosineSimilarity([1, 0], [1, 0]);
  assert.equal(Math.round(sim), 1);

  const ortho = cosineSimilarity([1, 0], [0, 1]);
  assert.equal(ortho, 0);
});
