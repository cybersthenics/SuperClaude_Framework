export interface LogLevel {
    level: string;
    priority: number;
}
export declare const LOG_LEVELS: Record<string, LogLevel>;
export declare class Logger {
    private level;
    constructor(level?: string);
    private shouldLog;
    private formatMessage;
    error(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    info(message: string, data?: any): void;
    debug(message: string, data?: any): void;
}
export declare const logger: Logger;
export default logger;
//# sourceMappingURL=Logger.d.ts.map