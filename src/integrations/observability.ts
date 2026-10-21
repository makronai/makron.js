/**
 * @license MIT
 * Makron.js Observability & Tracing Engine
 */

import { redactObject } from '../utils/redact';
import { ObservabilityHandler, ObservabilitySpan } from './types';

export class ObservabilityManager {
  private handlers: ObservabilityHandler[] = [];

  addHandler(handler: ObservabilityHandler): void {
    this.handlers.push(handler);
  }

  startSpan(provider: string, model: string, metadata?: Record<string, unknown>): ObservabilitySpan {
    const span: ObservabilitySpan = {
      traceId: `trace_${Math.random().toString(36).substring(2, 11)}`,
      spanId: `span_${Math.random().toString(36).substring(2, 9)}`,
      provider,
      model,
      startTime: Date.now(),
      metadata: metadata ? redactObject(metadata) : undefined,
    };

    for (const handler of this.handlers) {
      try {
        handler.onSpanStart?.(span);
      } catch (err) {
        console.error('[Makron:Observability] Error in onSpanStart handler:', err);
      }
    }

    return span;
  }

  endSpan(
    span: ObservabilitySpan,
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number },
    error?: Error
  ): void {
    span.endTime = Date.now();
    span.latencyMs = span.endTime - span.startTime;
    if (usage) {
      span.promptTokens = usage.promptTokens;
      span.completionTokens = usage.completionTokens;
      span.totalTokens = usage.totalTokens;
    }
    if (error) {
      span.error = error.message;
    }

    for (const handler of this.handlers) {
      try {
        if (error) {
          handler.onError?.(span, error);
        } else {
          handler.onSpanEnd?.(span);
        }
      } catch (err) {
        console.error('[Makron:Observability] Error in onSpanEnd handler:', err);
      }
    }
  }
}

export const defaultObservability = new ObservabilityManager();
