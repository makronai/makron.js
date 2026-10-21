/**
 * @license MIT
 * Makron.js Safe Logger with Secret Redaction
 */

import { redactObject, redactString } from './redact';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'warn') {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(targetLevel: LogLevel): boolean {
    return LOG_LEVELS[this.level] >= LOG_LEVELS[targetLevel];
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      const sanitized = args.map((a) => (typeof a === 'object' ? redactObject(a) : redactString(String(a))));
      console.debug(`[Makron:DEBUG] ${redactString(message)}`, ...sanitized);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      const sanitized = args.map((a) => (typeof a === 'object' ? redactObject(a) : redactString(String(a))));
      console.info(`[Makron:INFO] ${redactString(message)}`, ...sanitized);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      const sanitized = args.map((a) => (typeof a === 'object' ? redactObject(a) : redactString(String(a))));
      console.warn(`[Makron:WARN] ${redactString(message)}`, ...sanitized);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      const sanitized = args.map((a) => (typeof a === 'object' ? redactObject(a) : redactString(String(a))));
      console.error(`[Makron:ERROR] ${redactString(message)}`, ...sanitized);
    }
  }
}

export const defaultLogger = new Logger('warn');
