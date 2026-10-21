/**
 * Makron.js Model Context Protocol (MCP) Bridge Example
 */
import { createMakron } from '../../src/index';
import { convertMcpToolsToMakron, createMcpToolBridge } from '../../src/integrations/index';

// Simulated MCP server transport (over STDIO or SSE)
const mockMcpTransport = {
  callTool: async (name: string, args: Record<string, unknown>) => {
    if (name === 'query_github_issues') {
      return { issues: [{ id: 101, title: 'Add WebGPU adapter support', author: 'alice' }] };
    }
    throw new Error(`Tool ${name} not found`);
  },
};

const mcpTools = [
  {
    name: 'query_github_issues',
    description: 'Queries repository issues over Model Context Protocol',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
];

async function main() {
  const makronTools = convertMcpToolsToMakron(mcpTools);
  const toolBridge = createMcpToolBridge(mcpTools[0], mockMcpTransport);

  const ai = createMakron({
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  });

  console.log('Converted MCP tools ready for LLM consumption:\n', JSON.stringify(makronTools, null, 2));
}

main().catch(console.error);
