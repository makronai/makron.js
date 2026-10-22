/**
 * @license MIT
 * Makron.js Prompt Templates & System Prompt Presets
 * Reusable, type-safe prompt composition components.
 */

import { Message } from '../core/types';

export class PromptTemplate {
  private template: string;
  private inputVariables: string[];
  private partialVariables: Record<string, string> = {};

  constructor(template: string, inputVariables?: string[]) {
    this.template = template;
    this.inputVariables = inputVariables || this.extractVariables(template);
  }

  private extractVariables(text: string): string[] {
    const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  }

  public static fromTemplate(template: string): PromptTemplate {
    return new PromptTemplate(template);
  }

  public partial(variables: Record<string, string>): PromptTemplate {
    const clone = new PromptTemplate(this.template, [...this.inputVariables]);
    clone.partialVariables = { ...this.partialVariables, ...variables };
    return clone;
  }

  public format(values: Record<string, unknown> = {}): string {
    const combined = { ...this.partialVariables, ...values };

    return this.template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
      if (varName in combined) {
        const val = combined[varName];
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
      return match;
    });
  }

  public getVariables(): string[] {
    return this.inputVariables.filter((v) => !(v in this.partialVariables));
  }
}

export class ChatPromptTemplate {
  private systemTemplate?: PromptTemplate;
  private userTemplate: PromptTemplate;

  constructor(userTemplate: string, systemTemplate?: string) {
    this.userTemplate = new PromptTemplate(userTemplate);
    if (systemTemplate) {
      this.systemTemplate = new PromptTemplate(systemTemplate);
    }
  }

  public static fromMessages(options: { system?: string; user: string }): ChatPromptTemplate {
    return new ChatPromptTemplate(options.user, options.system);
  }

  public formatMessages(values: Record<string, unknown> = {}): Message[] {
    const messages: Message[] = [];
    if (this.systemTemplate) {
      messages.push({
        role: 'system',
        content: this.systemTemplate.format(values),
      });
    }
    messages.push({
      role: 'user',
      content: this.userTemplate.format(values),
    });
    return messages;
  }
}

/**
 * Built-in System Prompt Presets
 */
export const SystemPrompts = {
  coder(language: string = 'TypeScript'): string {
    return `You are an expert senior software engineer specializing in ${language}.
Produce production-grade, type-safe, maintainable code following modern best practices.
Avoid unnecessary conversational preambles. Prioritize clarity, efficiency, and edge case handling.`;
  },

  concise(): string {
    return `You are a concise, direct assistant. Provide clear, accurate answers in minimal words.
Use bullet points where appropriate. Eliminate pleasantries and filler text.`;
  },

  jsonOnly(schemaHint?: string): string {
    return `You are a structured data extractor. You must respond ONLY with a single valid JSON object.
Do not output markdown code blocks (\`\`\`json), explanations, or surrounding text.
${schemaHint ? `Target JSON Schema:\n${schemaHint}` : ''}`;
  },

  analyst(): string {
    return `You are an objective research and data analyst.
Examine problems from multiple angles, identify core trade-offs, and substantiate claims with structured reasoning.`;
  },

  researcher(): string {
    return `You are an academic researcher and literature specialist.
Synthesize verified findings, cite claims meticulously, and explicitly demarcate confidence intervals and knowledge bounds.`;
  },
};
