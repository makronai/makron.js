/**
 * @license MIT
 * Makron.js Tools Definition and Execution Helpers
 */
import { ToolCall, ToolDefinition, ToolResult } from '../core/types';
export type ToolHandler = (args: Record<string, any>) => Promise<unknown> | unknown;
export interface ExecutableTool {
    definition: ToolDefinition;
    execute: ToolHandler;
}
export declare function defineTool(name: string, description: string, parameters: Record<string, unknown>, execute?: ToolHandler): ExecutableTool;
export declare function executeToolCalls(toolCalls: ToolCall[], tools: ExecutableTool[]): Promise<ToolResult[]>;
