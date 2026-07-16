/**
 * Base structured logging, per docs/backend-architecture.md's
 * "Observability" section: "Every critical operation should produce
 * structured logs... This area will be expanded during production
 * readiness."
 *
 * Deliberately minimal: this is a structured (JSON-line) console logger,
 * not a full observability stack. Adopting a specific logging vendor
 * (pino, winston, a hosted platform) is a Core Infrastructure detail, not
 * an architecture decision -- but committing to one prematurely here
 * would be scope creep beyond what this step calls for. This logger is
 * intentionally swappable behind the same three-function interface.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
};
