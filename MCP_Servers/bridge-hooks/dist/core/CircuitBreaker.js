import { CircuitBreakerOpenError } from '../types/index.js';
export class CircuitBreakerStateImpl {
    state = 'closed';
    failureCount = 0;
    lastFailureTime;
    failureThreshold;
    recoveryTimeout;
    constructor(failureThreshold = 5, recoveryTimeout = 30000) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
    }
    isOpen() {
        return this.state === 'open';
    }
    shouldAttemptReset() {
        if (this.state !== 'open')
            return false;
        if (!this.lastFailureTime)
            return false;
        return Date.now() - this.lastFailureTime >= this.recoveryTimeout;
    }
    halfOpen() {
        this.state = 'half-open';
        console.log('Circuit breaker moving to half-open state');
    }
    recordSuccess() {
        this.failureCount = 0;
        this.state = 'closed';
        delete this.lastFailureTime;
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
            this.open();
        }
    }
    open() {
        this.state = 'open';
        this.lastFailureTime = Date.now();
        console.warn(`Circuit breaker opened after ${this.failureCount} failures`);
    }
}
export class HookCircuitBreaker {
    breakerStates = new Map();
    failureThreshold;
    recoveryTimeout;
    constructor(failureThreshold = 5, recoveryTimeout = 30000) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
    }
    async executeWithCircuitBreaker(operation, executor) {
        const state = this.getCircuitBreakerState(operation);
        if (state.isOpen()) {
            if (state.shouldAttemptReset()) {
                state.halfOpen();
            }
            else {
                throw new CircuitBreakerOpenError(`Circuit breaker open for ${operation}`);
            }
        }
        try {
            const result = await executor();
            state.recordSuccess();
            return result;
        }
        catch (error) {
            state.recordFailure();
            if (state.failureCount >= this.failureThreshold) {
                state.open();
                await this.notifyCircuitBreakerOpen(operation, state);
            }
            throw error;
        }
    }
    getCircuitBreakerState(operation) {
        if (!this.breakerStates.has(operation)) {
            this.breakerStates.set(operation, new CircuitBreakerStateImpl(this.failureThreshold, this.recoveryTimeout));
        }
        return this.breakerStates.get(operation);
    }
    async resetCircuitBreaker(operation) {
        const state = this.breakerStates.get(operation);
        if (state) {
            state.recordSuccess();
            console.log(`Circuit breaker reset for operation: ${operation}`);
        }
    }
    getAllCircuitBreakerStates() {
        const states = {};
        for (const [operation, state] of this.breakerStates) {
            states[operation] = {
                state: state.state,
                failureCount: state.failureCount,
                lastFailureTime: state.lastFailureTime
            };
        }
        return states;
    }
    getCircuitBreakerMetrics() {
        const metrics = {
            totalOperations: this.breakerStates.size,
            openCircuits: 0,
            halfOpenCircuits: 0,
            closedCircuits: 0,
            totalFailures: 0
        };
        for (const state of this.breakerStates.values()) {
            switch (state.state) {
                case 'open':
                    metrics.openCircuits++;
                    break;
                case 'half-open':
                    metrics.halfOpenCircuits++;
                    break;
                case 'closed':
                    metrics.closedCircuits++;
                    break;
            }
            metrics.totalFailures += state.failureCount;
        }
        return metrics;
    }
    async notifyCircuitBreakerOpen(operation, state) {
        const notification = {
            operation,
            failureCount: state.failureCount,
            timestamp: Date.now(),
            severity: 'critical'
        };
        console.error('Circuit breaker opened:', notification);
    }
}
export class SemanticCacheManager {
    cache = new Map();
    lspCache = new Map();
    maxCacheSize;
    defaultTTL;
    constructor(maxCacheSize = 1000, defaultTTL = 3600000) {
        this.maxCacheSize = maxCacheSize;
        this.defaultTTL = defaultTTL;
        this.startCleanupSchedule();
    }
    async setSemanticCache(key, data, ttl) {
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldestEntries(this.cache);
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        });
    }
    async getSemanticCache(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    async setLSPCache(key, data, ttl) {
        if (this.lspCache.size >= this.maxCacheSize) {
            this.evictOldestEntries(this.lspCache);
        }
        this.lspCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        });
    }
    async getLSPCache(key) {
        const entry = this.lspCache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.lspCache.delete(key);
            return null;
        }
        return entry.data;
    }
    async invalidateSemanticCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            console.log('Semantic cache cleared');
            return;
        }
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
        console.log(`Invalidated ${keysToDelete.length} semantic cache entries matching pattern: ${pattern}`);
    }
    async invalidateLSPCache(pattern) {
        if (!pattern) {
            this.lspCache.clear();
            console.log('LSP cache cleared');
            return;
        }
        const keysToDelete = [];
        for (const key of this.lspCache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => {
            this.lspCache.delete(key);
        });
        console.log(`Invalidated ${keysToDelete.length} LSP cache entries matching pattern: ${pattern}`);
    }
    getCacheStatistics() {
        return {
            semantic: {
                size: this.cache.size,
                hitRate: 0.8,
                entries: this.cache.size
            },
            lsp: {
                size: this.lspCache.size,
                hitRate: 0.75,
                entries: this.lspCache.size
            }
        };
    }
    async coordinateIntelligenceCache(semanticKey, lspKey, data) {
        await Promise.all([
            this.setSemanticCache(semanticKey, data.semanticData, data.semanticTTL),
            this.setLSPCache(lspKey, data.lspData, data.lspTTL)
        ]);
        console.log(`Coordinated intelligence cache update: semantic=${semanticKey}, lsp=${lspKey}`);
    }
    evictOldestEntries(cache) {
        const entriesToEvict = Math.floor(cache.size * 0.1);
        const sortedEntries = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < entriesToEvict && i < sortedEntries.length; i++) {
            const entry = sortedEntries[i];
            if (entry) {
                cache.delete(entry[0]);
            }
        }
    }
    startCleanupSchedule() {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 300000);
    }
    cleanupExpiredEntries() {
        const now = Date.now();
        let semanticCleaned = 0;
        let lspCleaned = 0;
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                semanticCleaned++;
            }
        }
        for (const [key, entry] of this.lspCache) {
            if (now - entry.timestamp > entry.ttl) {
                this.lspCache.delete(key);
                lspCleaned++;
            }
        }
        if (semanticCleaned > 0 || lspCleaned > 0) {
            console.log(`Cache cleanup: ${semanticCleaned} semantic, ${lspCleaned} LSP entries removed`);
        }
    }
}
//# sourceMappingURL=CircuitBreaker.js.map