import NodeCache from 'node-cache';
export class CacheManager {
    cache;
    logger;
    stats;
    defaultTTL = 300;
    maxKeys = 10000;
    checkPeriod = 600;
    keyPrefixes = {
        PERSONA_ACTIVATION: 'activation:',
        PERSONA_RECOMMENDATION: 'recommendation:',
        CONTEXT_ANALYSIS: 'analysis:',
        COLLABORATION_RESULT: 'collaboration:',
        CHAIN_CONTEXT: 'chain:',
        EXPERTISE_COMPATIBILITY: 'expertise:',
        PERFORMANCE_METRICS: 'performance:',
        VALIDATION_RESULT: 'validation:'
    };
    constructor(logger, options) {
        this.logger = logger.createChildLogger('CacheManager');
        this.cache = new NodeCache({
            stdTTL: options?.defaultTTL || this.defaultTTL,
            maxKeys: options?.maxKeys || this.maxKeys,
            checkperiod: options?.checkPeriod || this.checkPeriod,
            useClones: true,
            deleteOnExpire: true
        });
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
        this.setupEventHandlers();
        this.startPeriodicMaintenance();
    }
    get(key) {
        try {
            const value = this.cache.get(key);
            if (value !== undefined) {
                this.stats.hits++;
                this.logger.debug('Cache hit', { key, type: this.getKeyType(key) });
                return value;
            }
            else {
                this.stats.misses++;
                this.logger.debug('Cache miss', { key, type: this.getKeyType(key) });
                return undefined;
            }
        }
        catch (error) {
            this.logger.error('Cache get error', error, { key });
            return undefined;
        }
    }
    set(key, value, ttl) {
        try {
            const success = this.cache.set(key, value, ttl || this.defaultTTL);
            if (success) {
                this.stats.sets++;
                this.logger.debug('Cache set', {
                    key,
                    type: this.getKeyType(key),
                    ttl: ttl || this.defaultTTL,
                    size: this.estimateSize(value)
                });
            }
            return success;
        }
        catch (error) {
            this.logger.error('Cache set error', error, { key });
            return false;
        }
    }
    delete(key) {
        try {
            const success = this.cache.del(key) > 0;
            if (success) {
                this.stats.deletes++;
                this.logger.debug('Cache delete', { key, type: this.getKeyType(key) });
            }
            return success;
        }
        catch (error) {
            this.logger.error('Cache delete error', error, { key });
            return false;
        }
    }
    has(key) {
        return this.cache.has(key);
    }
    getMultiple(keys) {
        const results = {};
        for (const key of keys) {
            const value = this.get(key);
            if (value !== undefined) {
                results[key] = value;
            }
        }
        return results;
    }
    setMultiple(entries) {
        let allSuccessful = true;
        for (const entry of entries) {
            const success = this.set(entry.key, entry.value, entry.ttl);
            allSuccessful = allSuccessful && success;
        }
        return allSuccessful;
    }
    async getOrSet(key, factory, ttl) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }
        try {
            const value = await factory();
            this.set(key, value, ttl);
            return value;
        }
        catch (error) {
            this.logger.error('Cache factory error', error, { key });
            throw error;
        }
    }
    cachePersonaActivation(persona, contextHash, result, ttl) {
        const key = `${this.keyPrefixes.PERSONA_ACTIVATION}${persona}:${contextHash}`;
        return this.set(key, result, ttl);
    }
    getCachedPersonaActivation(persona, contextHash) {
        const key = `${this.keyPrefixes.PERSONA_ACTIVATION}${persona}:${contextHash}`;
        return this.get(key);
    }
    cachePersonaRecommendation(contextHash, recommendations, ttl) {
        const key = `${this.keyPrefixes.PERSONA_RECOMMENDATION}${contextHash}`;
        return this.set(key, recommendations, ttl);
    }
    getCachedPersonaRecommendation(contextHash) {
        const key = `${this.keyPrefixes.PERSONA_RECOMMENDATION}${contextHash}`;
        return this.get(key);
    }
    cacheContextAnalysis(contextHash, analysis, ttl) {
        const key = `${this.keyPrefixes.CONTEXT_ANALYSIS}${contextHash}`;
        return this.set(key, analysis, ttl);
    }
    getCachedContextAnalysis(contextHash) {
        const key = `${this.keyPrefixes.CONTEXT_ANALYSIS}${contextHash}`;
        return this.get(key);
    }
    cacheCollaborationResult(personas, mode, operationHash, result, ttl) {
        const key = `${this.keyPrefixes.COLLABORATION_RESULT}${personas.join(',')}:${mode}:${operationHash}`;
        return this.set(key, result, ttl);
    }
    getCachedCollaborationResult(personas, mode, operationHash) {
        const key = `${this.keyPrefixes.COLLABORATION_RESULT}${personas.join(',')}:${mode}:${operationHash}`;
        return this.get(key);
    }
    cacheExpertiseCompatibility(fromPersona, toPersona, expertiseHash, compatibility, ttl) {
        const key = `${this.keyPrefixes.EXPERTISE_COMPATIBILITY}${fromPersona}:${toPersona}:${expertiseHash}`;
        return this.set(key, compatibility, ttl);
    }
    getCachedExpertiseCompatibility(fromPersona, toPersona, expertiseHash) {
        const key = `${this.keyPrefixes.EXPERTISE_COMPATIBILITY}${fromPersona}:${toPersona}:${expertiseHash}`;
        return this.get(key);
    }
    clearByPattern(pattern) {
        const keys = this.cache.keys();
        let deleted = 0;
        for (const key of keys) {
            if (key.includes(pattern)) {
                if (this.delete(key)) {
                    deleted++;
                }
            }
        }
        this.logger.info('Cache cleared by pattern', { pattern, deleted });
        return deleted;
    }
    clearByPrefix(prefix) {
        return this.clearByPattern(prefix);
    }
    clearAll() {
        this.cache.flushAll();
        this.logger.info('Cache cleared completely');
    }
    getStats() {
        const keys = this.cache.keys();
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? this.stats.hits / (this.stats.hits + this.stats.misses)
            : 0;
        let memoryUsage = 0;
        const keyStats = [];
        for (const key of keys) {
            const value = this.cache.get(key);
            const size = this.estimateSize(value);
            memoryUsage += size;
            keyStats.push({
                key,
                hits: 1,
                size
            });
        }
        keyStats.sort((a, b) => b.size - a.size);
        return {
            totalKeys: keys.length,
            totalHits: this.stats.hits,
            totalMisses: this.stats.misses,
            hitRate,
            memoryUsage,
            topKeys: keyStats.slice(0, 10)
        };
    }
    getHealthInfo() {
        const stats = this.getStats();
        const recommendations = [];
        let status = 'healthy';
        if (stats.totalKeys > this.maxKeys * 0.8) {
            status = 'warning';
            recommendations.push('Cache is approaching maximum key limit');
        }
        if (stats.hitRate < 0.7) {
            status = 'warning';
            recommendations.push('Cache hit rate is below optimal (70%)');
        }
        if (stats.memoryUsage > 100 * 1024 * 1024) {
            status = 'warning';
            recommendations.push('Cache memory usage is high');
        }
        return {
            status,
            metrics: {
                keyCount: stats.totalKeys,
                hitRate: stats.hitRate,
                memoryUsage: stats.memoryUsage,
                maxKeys: this.maxKeys
            },
            recommendations
        };
    }
    optimize() {
        const stats = this.getStats();
        const keys = this.cache.keys();
        let removedKeys = 0;
        let reclaimedMemory = 0;
        for (const key of keys) {
            const ttl = this.cache.getTtl(key);
            if (ttl && ttl < Date.now() + 60000) {
                const value = this.cache.get(key);
                const size = this.estimateSize(value);
                if (this.delete(key)) {
                    removedKeys++;
                    reclaimedMemory += size;
                }
            }
        }
        this.logger.info('Cache optimization completed', {
            removedKeys,
            reclaimedMemory,
            remainingKeys: keys.length - removedKeys
        });
        return { removedKeys, reclaimedMemory };
    }
    close() {
        this.cache.close();
        this.logger.info('Cache manager closed');
    }
    setupEventHandlers() {
        this.cache.on('expired', (key, value) => {
            this.logger.debug('Cache key expired', { key, type: this.getKeyType(key) });
        });
        this.cache.on('set', (key, value) => {
            this.logger.debug('Cache key set', { key, type: this.getKeyType(key) });
        });
        this.cache.on('del', (key, value) => {
            this.logger.debug('Cache key deleted', { key, type: this.getKeyType(key) });
        });
    }
    startPeriodicMaintenance() {
        setInterval(() => {
            this.optimize();
        }, 10 * 60 * 1000);
        setInterval(() => {
            const stats = this.getStats();
            this.logger.info('Cache statistics', {
                totalKeys: stats.totalKeys,
                hitRate: stats.hitRate,
                memoryUsage: stats.memoryUsage,
                totalHits: stats.totalHits,
                totalMisses: stats.totalMisses
            });
        }, 5 * 60 * 1000);
    }
    getKeyType(key) {
        for (const [type, prefix] of Object.entries(this.keyPrefixes)) {
            if (key.startsWith(prefix)) {
                return type;
            }
        }
        return 'unknown';
    }
    estimateSize(value) {
        if (value === null || value === undefined) {
            return 0;
        }
        try {
            return JSON.stringify(value).length * 2;
        }
        catch {
            return 100;
        }
    }
}
//# sourceMappingURL=CacheManager.js.map