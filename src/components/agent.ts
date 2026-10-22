/**
 * @license MIT
 * Makron.js Autonomous ReAct Agent Component
 * A plug-and-play multi-turn reasoning and tool execution engine.
 */

import {
  ChatRequest,
  FinishReason,
  Message,
  TokenUsage,
  ToolCall,
  ToolDefinition,
  ToolResult,
} from '../core/types';
import { executeToolCalls } from '../capabilities/tools';
import { ConversationMemory } from '../integrations/memory';

export interface ExecutableTool {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

export type AgentTool = ToolDefinition | ExecutableTool;

export interface AgentStep {
  stepNumber: number;
  thought?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  finishReason?: FinishReason;
}

export interface AgentRunResult {
  text: string;
  steps: AgentStep[];
  totalSteps: number;
  usage: TokenUsage;
  finishReason: FinishReason;
}

export interface AgentClient {
  chat(request: ChatRequest): Promise<{
    text: string;
    toolCalls?: ToolCall[];
    finishReason: FinishReason;
    usage?: TokenUsage;
  }>;
}

export interface AgentConfig {
  /** The Makron client or adapter to run model inference */
  client: AgentClient;
  /** Array of tool definitions or executable tools */
  tools?: AgentTool[];
  /** Custom system prompt defining agent persona and behavioral instructions */
  systemPrompt?: string;
  /** Maximum reasoning/acting iterations before forcing termination (default: 10) */
  maxSteps?: number;
  /** Optional conversation memory instance for stateful context */
  memory?: ConversationMemory;
  /** Callback fired after each reasoning step */
  onStep?: (step: AgentStep) => void;
  /** Callback fired whenever the agent invokes a tool */
  onToolCall?: (call: ToolCall) => void;
  /** Callback fired when a tool returns an observation */
  onToolResult?: (name: string, result: unknown) => void;
}

const DEFAULT_AGENT_SYSTEM_PROMPT = `You are a helpful, capable autonomous AI assistant powered by Makron.js.
You have access to a set of tools to gather information and solve complex tasks.
When you need external information or calculations, select the appropriate tool and execute it.
Think step-by-step. When you have sufficient information to answer the user query completely, provide the final response clearly.`;

export class Agent {
  private client: AgentClient;
  private tools: ExecutableTool[] = [];
  private systemPrompt: string;
  private maxSteps: number;
  private memory?: ConversationMemory;
  private onStep?: (step: AgentStep) => void;
  private onToolCall?: (call: ToolCall) => void;
  private onToolResult?: (name: string, result: unknown) => void;

  constructor(config: AgentConfig) {
    this.client = config.client;
    this.systemPrompt = config.systemPrompt || DEFAULT_AGENT_SYSTEM_PROMPT;
    this.maxSteps = config.maxSteps ?? 10;
    this.memory = config.memory;
    this.onStep = config.onStep;
    this.onToolCall = config.onToolCall;
    this.onToolResult = config.onToolResult;

    if (config.tools) {
      for (const t of config.tools) {
        this.addTool(t);
      }
    }
  }

  /**
   * Register a new tool into the agent's toolbelt
   */
  public addTool(tool: AgentTool): this {
    if ('execute' in tool && typeof tool.execute === 'function') {
      this.tools.push(tool);
    } else if ('type' in tool && tool.type === 'function') {
      // Tool definition without attached execute handler
      this.tools.push({
        definition: tool,
        execute: async () => {
          throw new Error(`Tool '${tool.function.name}' was called but has no execute implementation`);
        },
      });
    }
    return this;
  }

  /**
   * Run the agent on a user prompt or multi-turn message sequence
   */
  public async run(input: string | Message[]): Promise<AgentRunResult> {
    const inputMessages: Message[] = typeof input === 'string'
      ? [{ role: 'user', content: input }]
      : [...input];

    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    if (this.memory) {
      messages.push(...this.memory.getMessages());
    }

    messages.push(...inputMessages);

    const steps: AgentStep[] = [];
    const aggregatedUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    let stepCount = 0;
    let finalAnswer = '';
    let finalReason: FinishReason = { reason: 'stop' };

    const toolDefinitions = this.tools.map((t) => t.definition);

    while (stepCount < this.maxSteps) {
      stepCount++;

      const response = await this.client.chat({
        messages,
        tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      });

      if (response.usage) {
        aggregatedUsage.promptTokens += response.usage.promptTokens;
        aggregatedUsage.completionTokens += response.usage.completionTokens;
        aggregatedUsage.totalTokens += response.usage.totalTokens;
      }

      const hasToolCalls = Boolean(response.toolCalls && response.toolCalls.length > 0);

      // Record step
      const currentStep: AgentStep = {
        stepNumber: stepCount,
        thought: response.text || undefined,
        toolCalls: response.toolCalls,
        finishReason: response.finishReason,
      };

      if (!hasToolCalls) {
        // Model provided final answer without calling additional tools
        finalAnswer = response.text;
        finalReason = response.finishReason;
        steps.push(currentStep);
        this.onStep?.(currentStep);

        // Record in memory if configured
        if (this.memory) {
          for (const m of inputMessages) {
            this.memory.addMessage(m);
          }
          this.memory.addMessage({ role: 'assistant', content: finalAnswer });
        }

        break;
      }

      // Model requested tool calls
      messages.push({
        role: 'assistant',
        content: response.text || '',
        toolCalls: response.toolCalls,
      });

      // Execute tool calls
      const executableList = this.tools;
      const toolResults = await executeToolCalls(response.toolCalls!, executableList);

      currentStep.toolResults = toolResults;
      steps.push(currentStep);
      this.onStep?.(currentStep);

      for (const call of response.toolCalls!) {
        this.onToolCall?.(call);
      }

      // Add tool results to conversation and trigger callbacks
      for (const res of toolResults) {
        this.onToolResult?.(res.toolCallId, res.result);
        messages.push({
          role: 'tool',
          toolCallId: res.toolCallId,
          content: typeof res.result === 'string' ? res.result : JSON.stringify(res.result),
        });
      }

      // If finish reason was stop and model produced text along with tool call,
      // it might already be the final answer if no more tools are called next turn.
    }

    if (!finalAnswer && steps.length > 0) {
      // Fallback: take last step's thought or inform max steps reached
      const lastStep = steps[steps.length - 1];
      finalAnswer = lastStep.thought || `[Agent completed ${stepCount} steps]`;
      finalReason = { reason: 'length' };
    }

    return {
      text: finalAnswer,
      steps,
      totalSteps: steps.length,
      usage: aggregatedUsage,
      finishReason: finalReason,
    };
  }
}

/**
 * Factory to create an autonomous ReAct Agent
 */
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
