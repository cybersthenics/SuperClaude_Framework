"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
const Logger_js_1 = require("./Logger.js");
const fs = __importStar(require("fs/promises"));
class CacheManager {
    constructor(ttl = 3600, maxSize = 10000) {
        this.logger = new Logger_js_1.Logger('CacheManager');
        this.cache = new Map();
        this.ttl = ttl * 1000;
        this.maxSize = maxSize;
        this.hitCount = 0;
        this.missCount = 0;
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
        this.logger.info('CacheManager initialized', { ttl, maxSize });
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.missCount++;
            this.logger.debug('Cache miss', { key });
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.missCount++;
            this.logger.debug('Cache expired', { key });
            return null;
        }
        this.hitCount++;
        entry.lastAccessed = Date.now();
        this.logger.debug('Cache hit', { key });
        return entry.value;
    }
    async set(key, value, customTtl) {
        const ttl = customTtl ? customTtl * 1000 : this.ttl;
        const now = Date.now();
        const entry = {
            key,
            value,
            createdAt: now,
            lastAccessed: now,
            expiresAt: now + ttl,
            size: this.calculateSize(value)
        };
        if (this.cache.size >= this.maxSize) {
            await this.evictLeastRecentlyUsed();
        }
        this.cache.set(key, entry);
        this.logger.debug('Cache set', { key, ttl, size: entry.size });
    }
    async delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.logger.debug('Cache entry deleted', { key });
        }
        return deleted;
    }
    async clear() {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
        this.logger.info('Cache cleared');
    }
    async has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    async keys() {
        const validKeys = [];
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now <= entry.expiresAt) {
                validKeys.push(key);
            }
        }
        return validKeys;
    }
    async size() {
        await this.cleanup();
        return this.cache.size;
    }
    async getStats() {
        await this.cleanup();
        const totalRequests = this.hitCount + this.missCount;
        const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
        let totalSize = 0;
        let oldestEntry = null;
        let newestEntry = null;
        for (const entry of this.cache.values()) {
            totalSize += entry.size;
            if (!oldestEntry || entry.createdAt < oldestEntry.getTime()) {
                oldestEntry = new Date(entry.createdAt);
            }
            if (!newestEntry || entry.createdAt > newestEntry.getTime()) {
                newestEntry = new Date(entry.createdAt);
            }
        }
        return {
            size: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate,
            totalSize,
            averageSize: this.cache.size > 0 ? totalSize / this.cache.size : 0,
            oldestEntry,
            newestEntry,
            ttl: this.ttl / 1000,
            maxSize: this.maxSize
        };
    }
    async getHitRate() {
        const stats = await this.getStats();
        return stats.hitRate;
    }
    async invalidate(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
        this.logger.info('Cache invalidated', { pattern, deletedCount: keysToDelete.length });
        return keysToDelete.length;
    }
    async warmUp(entries) {
        this.logger.info('Warming up cache', { entryCount: entries.length });
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttl);
        }
        this.logger.info('Cache warm-up completed');
    }
    async export() {
        const entries = [];
        for (const [key, entry] of this.cache.entries()) {
            if (Date.now() <= entry.expiresAt) {
                entries.push({
                    key,
                    value: entry.value,
                    createdAt: entry.createdAt,
                    expiresAt: entry.expiresAt,
                    size: entry.size
                });
            }
        }
        return {
            entries,
            exportedAt: Date.now(),
            stats: await this.getStats()
        };
    }
    async import(cacheExport) {
        const now = Date.now();
        let importedCount = 0;
        for (const entry of cacheExport.entries) {
            if (now <= entry.expiresAt) {
                this.cache.set(entry.key, {
                    key: entry.key,
                    value: entry.value,
                    createdAt: entry.createdAt,
                    lastAccessed: now,
                    expiresAt: entry.expiresAt,
                    size: entry.size
                });
                importedCount++;
            }
        }
        this.logger.info('Cache imported', {
            totalEntries: cacheExport.entries.length,
            importedCount,
            skippedExpired: cacheExport.entries.length - importedCount
        });
    }
    async persist(filePath) {
        try {
            const cacheExport = await this.export();
            await fs.writeFile(filePath, JSON.stringify(cacheExport, null, 2));
            this.logger.info('Cache persisted to file', { filePath });
        }
        catch (error) {
            this.logger.error('Failed to persist cache', { error, filePath });
            throw error;
        }
    }
    async restore(filePath) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const cacheExport = JSON.parse(fileContent);
            await this.import(cacheExport);
            this.logger.info('Cache restored from file', { filePath });
        }
        catch (error) {
            this.logger.error('Failed to restore cache', { error, filePath });
            throw error;
        }
    }
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            this.cache.delete(key);
        }
        if (expiredKeys.length > 0) {
            this.logger.debug('Expired cache entries cleaned up', { count: expiredKeys.length });
        }
    }
    async evictLeastRecentlyUsed() {
        let lruKey = null;
        let lruTime = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < lruTime) {
                lruTime = entry.lastAccessed;
                lruKey = key;
            }
        }
        if (lruKey) {
            this.cache.delete(lruKey);
            this.logger.debug('LRU cache entry evicted', { key: lruKey });
        }
    }
    calculateSize(value) {
        try {
            return JSON.stringify(value).length;
        }
        catch {
            return 0;
        }
    }
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        await this.clear();
        this.logger.info('CacheManager shutdown completed');
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=CacheManager.js.map