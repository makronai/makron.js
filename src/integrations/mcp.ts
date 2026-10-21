/**
 * @license MIT
 * Makron.js Model Context Protocol (MCP) Client Bridge
 * Source: https://modelcontextprotocol.io
 */

import { ExecutableTool } from '../capabilities/tools';
import { ToolDefinition } from '../core/types';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface McpClientTransport {
  callTool: (name: string, args: Record<string, unknown>) => Promise<any>;
  listTools?: () => Promise<McpTool[]>;
}

/**
 * Converts MCP tools into native Makron ToolDefinitions
 */
export function convertMcpToolsToMakron(mcpTools: McpTool[]): ToolDefinition[] {
  return mcpTools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

/**
 * Creates an ExecutableTool for Makron that delegates execution to an MCP transport
 */
export function createMcpToolBridge(
  mcpTool: McpTool,
  transport: McpClientTransport
): ExecutableTool {
  return {
    definition: {
      type: 'function',
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.inputSchema,
      },
    },
    execute: async (args: Record<string, any>) => {
      return await transport.callTool(mcpTool.name, args);
    },
  };
}
