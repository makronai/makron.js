/**
 * @license MIT
 * Makron.js Autonomous ReAct Agent Component
 * A plug-and-play multi-turn reasoning and tool execution engine.
 */
import { ChatRequest, FinishReason, Message, TokenUsage, ToolCall, ToolDefinition, ToolResult } from '../core/types';
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
export declare class Agent {
    private client;
    private tools;
    private systemPrompt;
    private maxSteps;
    private memory?;
    private onStep?;
    private onToolCall?;
    private onToolResult?;
    constructor(config: AgentConfig);
    /**
     * Register a new tool into the agent's toolbelt
     */
    addTool(tool: AgentTool): this;
    /**
     * Run the agent on a user prompt or multi-turn message sequence
     */
    run(input: string | Message[]): Promise<AgentRunResult>;
}
/**
 * Factory to create an autonomous ReAct Agent
 */
export declare function createAgent(config: AgentConfig): Agent;
