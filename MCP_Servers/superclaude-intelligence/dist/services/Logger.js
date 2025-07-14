/**
 * Simple Logger Service for SuperClaude Intelligence Server
 */
export const LOG_LEVELS = {
    error: { level: 'error', priority: 0 },
    warn: { level: 'warn', priority: 1 },
    info: { level: 'info', priority: 2 },
    debug: { level: 'debug', priority: 3 }
};
export class Logger {
    level;
    constructor(level = 'info') {
        this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
    }
    shouldLog(level) {
        return level.priority <= this.level.priority;
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (data) {
            return `${base} ${JSON.stringify(data)}`;
        }
        return base;
    }
    error(message, data) {
        if (this.shouldLog(LOG_LEVELS.error)) {
            console.error(this.formatMessage('error', message, data));
        }
    }
    warn(message, data) {
        if (this.shouldLog(LOG_LEVELS.warn)) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }
    info(message, data) {
        if (this.shouldLog(LOG_LEVELS.info)) {
            console.info(this.formatMessage('info', message, data));
        }
    }
    debug(message, data) {
        if (this.shouldLog(LOG_LEVELS.debug)) {
            console.debug(this.formatMessage('debug', message, data));
        }
    }
}
export const logger = new Logger();
export default logger;
