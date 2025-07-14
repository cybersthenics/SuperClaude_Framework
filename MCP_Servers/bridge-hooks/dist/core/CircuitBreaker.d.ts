import { CircuitBreakerState } from '../types/index.js';
export declare class CircuitBreakerStateImpl implements CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime?: number;
    private readonly failureThreshold;
    private readonly recoveryTimeout;
    constructor(failureThreshold?: number, recoveryTimeout?: number);
    isOpen(): boolean;
    shouldAttemptReset(): boolean;
    halfOpen(): void;
    recordSuccess(): void;
    recordFailure(): void;
    open(): void;
}
export declare class HookCircuitBreaker {
    private breakerStates;
    private readonly failureThreshold;
    private readonly recoveryTimeout;
    constructor(failureThreshold?: number, recoveryTimeout?: number);
    executeWithCircuitBreaker<T>(operation: string, executor: () => Promise<T>): Promise<T>;
    getCircuitBreakerState(operation: string): CircuitBreakerStateImpl;
    resetCircuitBreaker(operation: string): Promise<void>;
    getAllCircuitBreakerStates(): Record<string, {
        state: string;
        failureCount: number;
        lastFailureTime?: number;
    }>;
    getCircuitBreakerMetrics(): {
        totalOperations: number;
        openCircuits: number;
        halfOpenCircuits: number;
        closedCircuits: number;
        totalFailures: number;
    };
    private notifyCircuitBreakerOpen;
}
export declare class SemanticCacheManager {
    private cache;
    private lspCache;
    private readonly maxCacheSize;
    private readonly defaultTTL;
    constructor(maxCacheSize?: number, defaultTTL?: number);
    setSemanticCache(key: string, data: any, ttl?: number): Promise<void>;
    getSemanticCache(key: string): Promise<any | null>;
    setLSPCache(key: string, data: any, ttl?: number): Promise<void>;
    getLSPCache(key: string): Promise<any | null>;
    invalidateSemanticCache(pattern?: string): Promise<void>;
    invalidateLSPCache(pattern?: string): Promise<void>;
    getCacheStatistics(): {
        semantic: {
            size: number;
            hitRate: number;
            entries: number;
        };
        lsp: {
            size: number;
            hitRate: number;
            entries: number;
        };
    };
    coordinateIntelligenceCache(semanticKey: string, lspKey: string, data: any): Promise<void>;
    private evictOldestEntries;
    private startCleanupSchedule;
    private cleanupExpiredEntries;
}
//# sourceMappingURL=CircuitBreaker.d.ts.map