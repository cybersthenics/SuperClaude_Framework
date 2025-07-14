import { GateResult } from '../types/index.js';
export interface CacheEntry {
    key: string;
    result: GateResult;
    timestamp: Date;
    ttl: number;
    accessCount: number;
    lastAccessed: Date;
}
export interface CacheStats {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
    avgAccessTime: number;
}
export declare class ValidationCacheManager {
    private cache;
    private logger;
    private defaultTTL;
    private maxEntries;
    private stats;
    constructor(defaultTTL?: number, maxEntries?: number);
    getCachedResult(key: string): Promise<GateResult | null>;
    cacheResult(key: string, result: GateResult, ttl?: number): Promise<void>;
    getCacheHitProbability(gateType: string): Promise<number>;
    invalidatePattern(pattern: string): Promise<number>;
    clearCache(): Promise<void>;
    getStats(): Promise<CacheStats>;
    getCacheSummary(): Promise<Record<string, any>>;
    optimizeCache(): Promise<void>;
    private isExpired;
    private cloneResult;
    private removeExpiredEntries;
    private evictLeastRecentlyUsed;
    private startCleanupInterval;
    private initializeStats;
    private recordHit;
    private recordMiss;
    private updateHitRate;
    private updateAccessTime;
}
//# sourceMappingURL=ValidationCacheManager.d.ts.map