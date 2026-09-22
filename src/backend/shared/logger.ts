import { env } from "../config/env.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

export class Logger {
  private readonly minSeverity: number;

  constructor(private readonly serviceName: string = "FoundryOS") {
    this.minSeverity = LOG_SEVERITY[env.LOG_LEVEL as LogLevel] ?? LOG_SEVERITY.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_SEVERITY[level] >= this.minSeverity;
  }

  private formatError(error: unknown): Record<string, unknown> | undefined {
    if (!error) {
      return undefined;
    }
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    return { raw: String(error) };
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = { service: this.serviceName, ...context };
    } else {
      entry.context = { service: this.serviceName };
    }

    const formattedError = this.formatError(error);
    if (formattedError) {
      entry.error = formattedError;
    }

    const serialized = JSON.stringify(entry);

    if (level === "error") {
      process.stderr.write(serialized + "\n");
    } else {
      process.stdout.write(serialized + "\n");
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.write("debug", message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.write("warn", message, context);
  }

  public error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.write("error", message, context, error);
  }
}

export const logger = new Logger();
