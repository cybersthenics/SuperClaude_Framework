export declare class CacheManager {
    private config;
    private cache;
    constructor(config: {
        maxSize: number;
        ttl: number;
    });
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    clear(): void;
    getStats(): any;
}
export declare class PerformanceMonitor {
    private operations;
    startOperation(name: string): void;
    endOperation(name: string, duration: number): void;
    recordError(name: string, error: any): void;
    getMetrics(): any;
}
export declare class DatabaseService {
    query(sql: string, params?: any[]): Promise<any>;
}
export declare class ConfigurationService {
    get(key: string): any;
}
export declare class PerformanceMetricsStorage {
    store(metrics: any): Promise<void>;
}
export declare class TextProcessingService {
    process(text: string): Promise<any>;
}
export declare class UnifiedValidationService {
    validate(data: any): Promise<boolean>;
}
export declare class ComplexityAnalysisService {
    analyze(code: string): Promise<any>;
}
//# sourceMappingURL=SharedStubs.d.ts.map