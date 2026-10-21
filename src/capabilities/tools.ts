/**
 * @license MIT
 * Makron.js Tools Definition and Execution Helpers
 */

import { ToolCall, ToolDefinition, ToolResult } from '../core/types';
import { safeJsonParse } from '../utils/json';

export type ToolHandler = (args: Record<string, any>) => Promise<unknown> | unknown;

export interface ExecutableTool {
  definition: ToolDefinition;
  execute: ToolHandler;
}

export function defineTool(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  execute?: ToolHandler
): ExecutableTool {
  return {
    definition: {
      type: 'function',
      function: {
        name,
        description,
        parameters,
      },
    },
    execute: execute || (() => {}),
  };
}

export async function executeToolCalls(
  toolCalls: ToolCall[],
  tools: ExecutableTool[]
): Promise<ToolResult[]> {
  const toolMap = new Map<string, ExecutableTool>();
  for (const t of tools) {
    toolMap.set(t.definition.function.name, t);
  }

  const results: ToolResult[] = [];
  for (const call of toolCalls) {
    const matched = toolMap.get(call.name);
    if (!matched) {
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: `Error: Tool '${call.name}' not found`,
        isError: true,
      });
      continue;
    }

    let parsedArgs: Record<string, any> = {};
    if (typeof call.arguments === 'string') {
      parsedArgs = safeJsonParse(call.arguments, {}) || {};
    } else if (typeof call.arguments === 'object' && call.arguments !== null) {
      parsedArgs = call.arguments as Record<string, any>;
    }

    try {
      const output = await matched.execute(parsedArgs);
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: output,
        isError: false,
      });
    } catch (err: any) {
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: `Tool execution failed: ${err.message || String(err)}`,
        isError: true,
      });
    }
  }

  return results;
}
