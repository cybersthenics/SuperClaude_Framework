export declare class CacheManager {
    private logger;
    private cache;
    private ttl;
    private maxSize;
    private cleanupInterval;
    private hitCount;
    private missCount;
    constructor(ttl?: number, maxSize?: number);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, customTtl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    getStats(): Promise<CacheStats>;
    getHitRate(): Promise<number>;
    invalidate(pattern: string): Promise<number>;
    warmUp(entries: Array<{
        key: string;
        value: any;
        ttl?: number;
    }>): Promise<void>;
    export(): Promise<CacheExport>;
    import(cacheExport: CacheExport): Promise<void>;
    persist(filePath: string): Promise<void>;
    restore(filePath: string): Promise<void>;
    private cleanup;
    private evictLeastRecentlyUsed;
    private calculateSize;
    shutdown(): Promise<void>;
}
interface CacheStats {
    size: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    totalSize: number;
    averageSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    ttl: number;
    maxSize: number;
}
interface CacheExportEntry {
    key: string;
    value: any;
    createdAt: number;
    expiresAt: number;
    size: number;
}
interface CacheExport {
    entries: CacheExportEntry[];
    exportedAt: number;
    stats: CacheStats;
}
export {};
//# sourceMappingURL=CacheManager.d.ts.map