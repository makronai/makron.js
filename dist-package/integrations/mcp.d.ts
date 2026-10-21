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
export declare function convertMcpToolsToMakron(mcpTools: McpTool[]): ToolDefinition[];
/**
 * Creates an ExecutableTool for Makron that delegates execution to an MCP transport
 */
export declare function createMcpToolBridge(mcpTool: McpTool, transport: McpClientTransport): ExecutableTool;
