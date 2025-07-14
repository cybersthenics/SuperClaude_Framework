import winston from 'winston';
export class Logger {
    winston;
    constructor(serviceName = 'superclaude-tasks') {
        this.winston = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            defaultMeta: { service: serviceName },
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
                })
            ]
        });
    }
    info(message, meta) {
        this.winston.info(message, meta);
    }
    warn(message, meta) {
        this.winston.warn(message, meta);
    }
    error(message, meta) {
        this.winston.error(message, meta);
    }
    debug(message, meta) {
        this.winston.debug(message, meta);
    }
}
//# sourceMappingURL=Logger.js.map