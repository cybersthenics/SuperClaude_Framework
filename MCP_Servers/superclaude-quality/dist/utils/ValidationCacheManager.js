import { Logger } from './Logger.js';
export class ValidationCacheManager {
    cache = new Map();
    logger;
    defaultTTL = 300000;
    maxEntries = 1000;
    stats;
    constructor(defaultTTL, maxEntries) {
        this.logger = new Logger('ValidationCacheManager');
        this.defaultTTL = defaultTTL || this.defaultTTL;
        this.maxEntries = maxEntries || this.maxEntries;
        this.stats = this.initializeStats();
        this.startCleanupInterval();
    }
    async getCachedResult(key) {
        const startTime = Date.now();
        try {
            const entry = this.cache.get(key);
            if (!entry) {
                this.recordMiss();
                return null;
            }
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                this.recordMiss();
                return null;
            }
            entry.accessCount++;
            entry.lastAccessed = new Date();
            this.recordHit();
            this.updateAccessTime(Date.now() - startTime);
            this.logger.debug('Cache hit', { key, accessCount: entry.accessCount });
            return entry.result;
        }
        catch (error) {
            this.logger.error('Cache retrieval error', { key, error });
            this.recordMiss();
            return null;
        }
    }
    async cacheResult(key, result, ttl) {
        try {
            if (this.cache.size >= this.maxEntries) {
                await this.evictLeastRecentlyUsed();
            }
            const entry = {
                key,
                result: this.cloneResult(result),
                timestamp: new Date(),
                ttl: ttl || this.defaultTTL,
                accessCount: 0,
                lastAccessed: new Date()
            };
            this.cache.set(key, entry);
            this.logger.debug('Cached result', {
                key,
                gate: result.gate,
                ttl: entry.ttl,
                cacheSize: this.cache.size
            });
        }
        catch (error) {
            this.logger.error('Cache storage error', { key, error });
        }
    }
    async getCacheHitProbability(gateType) {
        const entries = Array.from(this.cache.values()).filter(entry => entry.result.type === gateType);
        if (entries.length === 0)
            return 0;
        const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
        const avgAccesses = totalAccesses / entries.length;
        return Math.min(1, avgAccesses / 10);
    }
    async invalidatePattern(pattern) {
        let invalidatedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                invalidatedCount++;
            }
        }
        this.logger.info('Invalidated cache entries', { pattern, count: invalidatedCount });
        return invalidatedCount;
    }
    async clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.stats = this.initializeStats();
        this.logger.info('Cache cleared', { entriesRemoved: size });
    }
    async getStats() {
        return {
            ...this.stats,
            totalEntries: this.cache.size
        };
    }
    async getCacheSummary() {
        const entriesByGate = {};
        const entriesByAge = {
            fresh: 0,
            recent: 0,
            old: 0
        };
        const now = Date.now();
        for (const entry of this.cache.values()) {
            const gateType = entry.result.type;
            entriesByGate[gateType] = (entriesByGate[gateType] || 0) + 1;
            const ageMs = now - entry.timestamp.getTime();
            if (ageMs < 60000) {
                entriesByAge.fresh++;
            }
            else if (ageMs < 300000) {
                entriesByAge.recent++;
            }
            else {
                entriesByAge.old++;
            }
        }
        return {
            totalEntries: this.cache.size,
            entriesByGate,
            entriesByAge,
            stats: await this.getStats()
        };
    }
    async optimizeCache() {
        const startTime = Date.now();
        const expiredCount = await this.removeExpiredEntries();
        if (this.cache.size > this.maxEntries * 0.8) {
            const evictedCount = await this.evictLeastRecentlyUsed(this.cache.size - Math.floor(this.maxEntries * 0.7));
            this.logger.info('Cache optimized', {
                expiredRemoved: expiredCount,
                evicted: evictedCount,
                finalSize: this.cache.size,
                optimizationTime: Date.now() - startTime
            });
        }
    }
    isExpired(entry) {
        const now = Date.now();
        const age = now - entry.timestamp.getTime();
        return age > entry.ttl;
    }
    cloneResult(result) {
        return JSON.parse(JSON.stringify(result));
    }
    async removeExpiredEntries() {
        let removedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                removedCount++;
            }
        }
        return removedCount;
    }
    async evictLeastRecentlyUsed(count) {
        const toEvict = count || Math.floor(this.cache.size * 0.1);
        const entries = Array.from(this.cache.entries());
        entries.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
        let evictedCount = 0;
        for (let i = 0; i < Math.min(toEvict, entries.length); i++) {
            this.cache.delete(entries[i][0]);
            evictedCount++;
        }
        return evictedCount;
    }
    startCleanupInterval() {
        setInterval(async () => {
            try {
                await this.optimizeCache();
            }
            catch (error) {
                this.logger.error('Cache cleanup error', { error });
            }
        }, 60000);
    }
    initializeStats() {
        return {
            totalEntries: 0,
            hitRate: 0,
            missRate: 0,
            totalHits: 0,
            totalMisses: 0,
            avgAccessTime: 0
        };
    }
    recordHit() {
        this.stats.totalHits++;
        this.updateHitRate();
    }
    recordMiss() {
        this.stats.totalMisses++;
        this.updateHitRate();
    }
    updateHitRate() {
        const total = this.stats.totalHits + this.stats.totalMisses;
        if (total > 0) {
            this.stats.hitRate = (this.stats.totalHits / total) * 100;
            this.stats.missRate = (this.stats.totalMisses / total) * 100;
        }
    }
    updateAccessTime(time) {
        const total = this.stats.totalHits;
        if (total === 1) {
            this.stats.avgAccessTime = time;
        }
        else {
            this.stats.avgAccessTime = (this.stats.avgAccessTime * (total - 1) + time) / total;
        }
    }
}
//# sourceMappingURL=ValidationCacheManager.js.map