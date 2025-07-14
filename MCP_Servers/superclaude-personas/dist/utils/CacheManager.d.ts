import { Logger } from './Logger';
export interface CacheEntry<T> {
    value: T;
    timestamp: Date;
    ttl: number;
    hitCount: number;
    lastAccessed: Date;
}
export interface CacheStats {
    totalKeys: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    memoryUsage: number;
    topKeys: Array<{
        key: string;
        hits: number;
        size: number;
    }>;
}
export declare class CacheManager {
    private cache;
    private logger;
    private stats;
    private readonly defaultTTL;
    private readonly maxKeys;
    private readonly checkPeriod;
    private readonly keyPrefixes;
    constructor(logger: Logger, options?: {
        defaultTTL?: number;
        maxKeys?: number;
        checkPeriod?: number;
    });
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): boolean;
    delete(key: string): boolean;
    has(key: string): boolean;
    getMultiple<T>(keys: string[]): Record<string, T>;
    setMultiple<T>(entries: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): boolean;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
    cachePersonaActivation(persona: string, contextHash: string, result: any, ttl?: number): boolean;
    getCachedPersonaActivation(persona: string, contextHash: string): any | undefined;
    cachePersonaRecommendation(contextHash: string, recommendations: any[], ttl?: number): boolean;
    getCachedPersonaRecommendation(contextHash: string): any[] | undefined;
    cacheContextAnalysis(contextHash: string, analysis: any, ttl?: number): boolean;
    getCachedContextAnalysis(contextHash: string): any | undefined;
    cacheCollaborationResult(personas: string[], mode: string, operationHash: string, result: any, ttl?: number): boolean;
    getCachedCollaborationResult(personas: string[], mode: string, operationHash: string): any | undefined;
    cacheExpertiseCompatibility(fromPersona: string, toPersona: string, expertiseHash: string, compatibility: any, ttl?: number): boolean;
    getCachedExpertiseCompatibility(fromPersona: string, toPersona: string, expertiseHash: string): any | undefined;
    clearByPattern(pattern: string): number;
    clearByPrefix(prefix: string): number;
    clearAll(): void;
    getStats(): CacheStats;
    getHealthInfo(): {
        status: 'healthy' | 'warning' | 'critical';
        metrics: {
            keyCount: number;
            hitRate: number;
            memoryUsage: number;
            maxKeys: number;
        };
        recommendations: string[];
    };
    optimize(): {
        removedKeys: number;
        reclaimedMemory: number;
    };
    close(): void;
    private setupEventHandlers;
    private startPeriodicMaintenance;
    private getKeyType;
    private estimateSize;
}
//# sourceMappingURL=CacheManager.d.ts.map