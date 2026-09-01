type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: number;
}

class Logger {
  private context: string;
  private minLevel: LogLevel = 'debug';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(context: string) {
    this.context = context;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      context: this.context,
      message,
      data,
      timestamp: Date.now()
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${this.context}]`;
    const timestamp = new Date(entry.timestamp).toISOString();

    switch (level) {
      case 'debug':
        console.debug(`${timestamp} ${prefix} ${message}`, data ?? '');
        break;
      case 'info':
        console.info(`${timestamp} ${prefix} ${message}`, data ?? '');
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} ${message}`, data ?? '');
        break;
      case 'error':
        console.error(`${timestamp} ${prefix} ${message}`, data ?? '');
        break;
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter((l) => l.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

const loggers: Map<string, Logger> = new Map();

export function getLogger(context: string): Logger {
  if (!loggers.has(context)) {
    loggers.set(context, new Logger(context));
  }
  return loggers.get(context)!;
}

export { Logger };