export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel || (LogLevel = {}));
export class Logger {
    component;
    minLevel;
    constructor(component, minLevel = LogLevel.INFO) {
        this.component = component;
        this.minLevel = minLevel;
    }
    debug(message, metadata) {
        this.log(LogLevel.DEBUG, message, metadata);
    }
    info(message, metadata) {
        this.log(LogLevel.INFO, message, metadata);
    }
    warn(message, metadata) {
        this.log(LogLevel.WARN, message, metadata);
    }
    error(message, metadata) {
        this.log(LogLevel.ERROR, message, metadata);
    }
    fatal(message, metadata) {
        this.log(LogLevel.FATAL, message, metadata);
    }
    log(level, message, metadata) {
        if (level < this.minLevel)
            return;
        const entry = {
            timestamp: new Date(),
            level,
            component: this.component,
            message,
            metadata
        };
        this.output(entry);
    }
    output(entry) {
        const timestamp = entry.timestamp.toISOString();
        const levelName = LogLevel[entry.level];
        const metadataStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
        const logLine = `[${timestamp}] ${levelName} [${entry.component}] ${entry.message}${metadataStr}`;
        switch (entry.level) {
            case LogLevel.DEBUG:
            case LogLevel.INFO:
                console.log(logLine);
                break;
            case LogLevel.WARN:
                console.warn(logLine);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(logLine);
                break;
        }
    }
}
//# sourceMappingURL=Logger.js.map