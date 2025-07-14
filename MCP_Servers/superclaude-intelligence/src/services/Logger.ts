/**
 * Simple Logger Service for SuperClaude Intelligence Server
 */

export interface LogLevel {
  level: string;
  priority: number;
}

export const LOG_LEVELS: Record<string, LogLevel> = {
  error: { level: 'error', priority: 0 },
  warn: { level: 'warn', priority: 1 },
  info: { level: 'info', priority: 2 },
  debug: { level: 'debug', priority: 3 }
};

export class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return level.priority <= this.level.priority;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${base} ${JSON.stringify(data)}`;
    }
    
    return base;
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.error)) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.warn)) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.info)) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.debug)) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();
export default logger;