export interface PerformanceMetrics {
    operationCounts: Record<string, number>;
    averageResponseTimes: Record<string, number>;
    cacheHitRates: Record<string, number>;
    memoryUsage: number;
    cpuUsage: number;
    lastUpdated: Date;
}
export interface CacheConfiguration {
    maxSize: number;
    ttl: number;
    compressionEnabled: boolean;
    compressionThreshold: number;
    evictionPolicy: 'lru' | 'lfu' | 'fifo';
}
export interface OptimizationRule {
    id: string;
    name: string;
    condition: (metrics: PerformanceMetrics) => boolean;
    action: (context: any) => Promise<void>;
    priority: number;
    enabled: boolean;
}
export interface PerformanceProfile {
    profileId: string;
    name: string;
    cacheConfig: CacheConfiguration;
    optimizationRules: OptimizationRule[];
    targetMetrics: {
        maxResponseTime: number;
        minCacheHitRate: number;
        maxMemoryUsage: number;
        maxCpuUsage: number;
    };
}
export declare class PerformanceOptimizer {
    private logger;
    private cache;
    private metrics;
    private cacheStats;
    private responseTimeHistory;
    private currentProfile;
    private optimizationRules;
    private metricsUpdateInterval;
    constructor(profile?: PerformanceProfile);
    private initializeMetrics;
    private getDefaultProfile;
    private initializeOptimizationRules;
    cacheOperation<T>(key: string, operation: () => Promise<T>, options?: {
        ttl?: number;
        compress?: boolean;
    }): Promise<T>;
    private extractOperationName;
    private recordCacheHit;
    private recordCacheMiss;
    private recordResponseTime;
    private incrementOperationCount;
    private enableAggressiveCaching;
    private optimizeCacheStrategy;
    private optimizeMemoryUsage;
    private throttleOperations;
    private startMetricsCollection;
    private updateSystemMetrics;
    private checkOptimizationRules;
    getMetrics(): PerformanceMetrics;
    getCacheStats(): Map<string, {
        hits: number;
        misses: number;
        size: number;
    }>;
    getProfile(): PerformanceProfile;
    updateProfile(profile: PerformanceProfile): void;
    enableRule(ruleId: string): void;
    disableRule(ruleId: string): void;
    addOptimizationRule(rule: OptimizationRule): void;
    removeOptimizationRule(ruleId: string): void;
    getOptimizationRecommendations(): string[];
    generatePerformanceReport(): {
        summary: string;
        metrics: PerformanceMetrics;
        cacheStats: Record<string, any>;
        recommendations: string[];
        profile: PerformanceProfile;
    };
    clearAllCaches(): void;
    resetMetrics(): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=PerformanceOptimizer.d.ts.map