export declare class SimpleLogger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export declare class SimpleCache {
    private cache;
    get(key: string): any;
    set(key: string, value: any): void;
    delete(key: string): void;
    clear(): void;
}
//# sourceMappingURL=SimpleStubs.d.ts.map