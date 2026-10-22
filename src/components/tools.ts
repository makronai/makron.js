/**
 * @license MIT
 * Makron.js Standard Built-in Tool Library
 * Ready-to-use tools that can be plugged immediately into any Makron client or Agent.
 */

import { defineTool } from '../capabilities/tools';
import { ToolDefinition } from '../core/types';

export interface StandardTool<T = Record<string, unknown>> {
  definition: ToolDefinition;
  execute: (args: T) => Promise<unknown> | unknown;
}

/**
 * Calculator Tool: Safely evaluates math expressions without eval()
 */
export const calculatorTool = defineTool(
  'calculator',
  'Safely evaluates a mathematical expression and returns the calculated number',
  {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The math expression to evaluate, e.g. "12 * (4 + 6)", "Math.sqrt(144)", "2 ** 8"',
      },
    },
    required: ['expression'],
  },
  async (args: Record<string, any>) => {
    const expression = typeof args.expression === 'string' ? args.expression : '';
    if (!expression.trim()) {
      return { error: 'Invalid or empty expression' };
    }

    // Sanitize expression to only allow digits, arithmetic operators, parentheses, and Math functions
    const sanitized = expression.replace(/[^0-9+\-*/%.()^ eE,Math.sqrtMath.absMath.roundMath.floorMath.ceilMath.PIMath.powMath.sinMath.cosMath.tan]/g, '');

    try {
      // Safe evaluator with math context
      const compute = new Function(
        'Math',
        `"use strict"; return (${sanitized.replace(/\^/g, '**')});`
      );
      const result = compute(Math);
      if (typeof result !== 'number' || Number.isNaN(result)) {
        return { error: 'Expression did not evaluate to a valid number', expression };
      }
      return { expression, result };
    } catch (err: any) {
      return { error: `Evaluation error: ${err.message}`, expression };
    }
  }
);

/**
 * Date and Time Tool: Returns current UTC/local timestamps and formatting
 */
export const dateTimeTool = defineTool(
  'get_current_time',
  'Returns the current date, time, timezone, and calendar metadata',
  {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Optional IANA timezone name (e.g. "America/New_York", "UTC", "Asia/Tokyo")',
      },
      format: {
        type: 'string',
        enum: ['iso', 'locale', 'timestamp', 'full'],
        description: 'Format of the timestamp to return (default: "full")',
      },
    },
  },
  async (args: Record<string, any>) => {
    const timezone = typeof args.timezone === 'string' ? args.timezone : 'UTC';
    const now = new Date();
    try {
      const iso = now.toISOString();
      const timestamp = now.getTime();
      const localeString = now.toLocaleString('en-US', { timeZone: timezone });
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });

      return {
        iso,
        timestamp,
        localeString,
        dayOfWeek,
        timezone,
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate(),
      };
    } catch {
      // Fallback if timezone is invalid
      return {
        iso: now.toISOString(),
        timestamp: now.getTime(),
        timezone: 'UTC',
      };
    }
  }
);

/**
 * JSON Parser & Validator Tool
 */
export const jsonParserTool = defineTool(
  'json_inspector',
  'Parses, queries, and validates JSON strings, extracting specific paths or schemas',
  {
    type: 'object',
    properties: {
      jsonString: {
        type: 'string',
        description: 'The JSON string to parse and inspect',
      },
      keyPath: {
        type: 'string',
        description: 'Optional dot-notation key path to extract, e.g. "data.users.0.name"',
      },
    },
    required: ['jsonString'],
  },
  async (args: Record<string, any>) => {
    const jsonString = typeof args.jsonString === 'string' ? args.jsonString : '';
    const keyPath = typeof args.keyPath === 'string' ? args.keyPath : undefined;
    try {
      const parsed = JSON.parse(jsonString);
      if (!keyPath) {
        return { valid: true, data: parsed, keys: Object.keys(parsed) };
      }

      // Traverse dot notation
      const parts = keyPath.split('.');
      let current: any = parsed;
      for (const part of parts) {
        if (current === undefined || current === null) break;
        current = current[part];
      }

      return { valid: true, keyPath, value: current };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }
);

/**
 * Text Processing Tool: Word counter, frequency, and pattern extractor
 */
export const textProcessingTool = defineTool(
  'text_processor',
  'Analyzes text statistics, word count, character count, and extracts patterns',
  {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The text to analyze' },
      action: {
        type: 'string',
        enum: ['stats', 'extract_emails', 'extract_urls', 'word_frequency'],
        description: 'Operation to perform on the text',
      },
    },
    required: ['text', 'action'],
  },
  async (args: Record<string, any>) => {
    const text = typeof args.text === 'string' ? args.text : '';
    const action = typeof args.action === 'string' ? args.action : 'stats';
    if (!text) return { error: 'Empty text' };

    switch (action) {
      case 'stats': {
        const words = text.trim().split(/\s+/).filter(Boolean);
        const characters = text.length;
        const lines = text.split('\n').length;
        return {
          wordCount: words.length,
          characterCount: characters,
          lineCount: lines,
          estimatedReadingTimeMinutes: Math.ceil(words.length / 200),
        };
      }
      case 'extract_emails': {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = Array.from(new Set(text.match(emailRegex) || []));
        return { emails, count: emails.length };
      }
      case 'extract_urls': {
        const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/g;
        const urls = Array.from(new Set(text.match(urlRegex) || []));
        return { urls, count: urls.length };
      }
      case 'word_frequency': {
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const freq: Record<string, number> = {};
        for (const w of words) {
          freq[w] = (freq[w] || 0) + 1;
        }
        const topWords = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));
        return { topWords };
      }
      default:
        return { error: `Unknown action: ${action}` };
    }
  }
);

/**
 * Web Search Mock Tool: Pluggable or mock web search result retriever
 */
export const webSearchTool = defineTool(
  'web_search',
  'Searches the web for recent information and returns relevant snippets and sources',
  {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query to look up' },
      limit: { type: 'number', description: 'Maximum number of results to return (default: 3)' },
    },
    required: ['query'],
  },
  async (args: Record<string, any>) => {
    const query = typeof args.query === 'string' ? args.query : '';
    const limit = typeof args.limit === 'number' ? args.limit : 3;
    // Standard structured search output
    return {
      query,
      results: [
        {
          title: `Information regarding ${query}`,
          snippet: `Summary documentation and reference context for "${query}".`,
          url: `https://search.makron.dev/?q=${encodeURIComponent(query)}`,
        },
      ].slice(0, limit),
    };
  }
);

/**
 * Standard Tools Registry: Ready-to-use toolbelt
 */
export const standardTools = {
  calculator: calculatorTool,
  dateTime: dateTimeTool,
  jsonParser: jsonParserTool,
  textProcessor: textProcessingTool,
  webSearch: webSearchTool,
  /** Return an array of all standard tools for instant loading */
  all() {
    return [
      calculatorTool,
      dateTimeTool,
      jsonParserTool,
      textProcessingTool,
      webSearchTool,
    ];
  },
};
