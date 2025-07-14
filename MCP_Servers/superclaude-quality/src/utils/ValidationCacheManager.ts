/**
 * SuperClaude Quality Validation Cache Manager
 * Manages caching of validation results for performance optimization
 */

import { GateResult } from '../types/index.js';
import { Logger } from './Logger.js';

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

export class ValidationCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private logger: Logger;
  private defaultTTL: number = 300000; // 5 minutes
  private maxEntries: number = 1000;
  private stats: CacheStats;

  constructor(defaultTTL?: number, maxEntries?: number) {
    this.logger = new Logger('ValidationCacheManager');
    this.defaultTTL = defaultTTL || this.defaultTTL;
    this.maxEntries = maxEntries || this.maxEntries;
    this.stats = this.initializeStats();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get cached validation result
   */
  async getCachedResult(key: string): Promise<GateResult | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // Check if entry has expired
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.recordMiss();
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = new Date();
      
      this.recordHit();
      this.updateAccessTime(Date.now() - startTime);
      
      this.logger.debug('Cache hit', { key, accessCount: entry.accessCount });
      return entry.result;

    } catch (error) {
      this.logger.error('Cache retrieval error', { key, error });
      this.recordMiss();
      return null;
    }
  }

  /**
   * Cache validation result
   */
  async cacheResult(key: string, result: GateResult, ttl?: number): Promise<void> {
    try {
      // Enforce cache size limit
      if (this.cache.size >= this.maxEntries) {
        await this.evictLeastRecentlyUsed();
      }

      const entry: CacheEntry = {
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

    } catch (error) {
      this.logger.error('Cache storage error', { key, error });
    }
  }

  /**
   * Get cache hit probability for a gate type
   */
  async getCacheHitProbability(gateType: string): Promise<number> {
    const entries = Array.from(this.cache.values()).filter(
      entry => entry.result.type === gateType
    );

    if (entries.length === 0) return 0;

    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const avgAccesses = totalAccesses / entries.length;

    // Higher access count indicates higher probability of future hits
    // Normalize to 0-1 range
    return Math.min(1, avgAccesses / 10);
  }

  /**
   * Invalidate cache entries for specific patterns
   */
  async invalidatePattern(pattern: string): Promise<number> {
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

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats = this.initializeStats();
    
    this.logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return {
      ...this.stats,
      totalEntries: this.cache.size
    };
  }

  /**
   * Get cache entries summary
   */
  async getCacheSummary(): Promise<Record<string, any>> {
    const entriesByGate: Record<string, number> = {};
    const entriesByAge: Record<string, number> = {
      fresh: 0,    // < 1 minute
      recent: 0,   // 1-5 minutes
      old: 0       // > 5 minutes
    };

    const now = Date.now();

    for (const entry of this.cache.values()) {
      // Count by gate type
      const gateType = entry.result.type;
      entriesByGate[gateType] = (entriesByGate[gateType] || 0) + 1;

      // Count by age
      const ageMs = now - entry.timestamp.getTime();
      if (ageMs < 60000) {
        entriesByAge.fresh++;
      } else if (ageMs < 300000) {
        entriesByAge.recent++;
      } else {
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

  /**
   * Optimize cache performance
   */
  async optimizeCache(): Promise<void> {
    const startTime = Date.now();
    
    // Remove expired entries
    const expiredCount = await this.removeExpiredEntries();
    
    // If still over limit, remove least recently used
    if (this.cache.size > this.maxEntries * 0.8) {
      const evictedCount = await this.evictLeastRecentlyUsed(
        this.cache.size - Math.floor(this.maxEntries * 0.7)
      );
      
      this.logger.info('Cache optimized', {
        expiredRemoved: expiredCount,
        evicted: evictedCount,
        finalSize: this.cache.size,
        optimizationTime: Date.now() - startTime
      });
    }
  }

  /**
   * Private helper methods
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp.getTime();
    return age > entry.ttl;
  }

  private cloneResult(result: GateResult): GateResult {
    return JSON.parse(JSON.stringify(result));
  }

  private async removeExpiredEntries(): Promise<number> {
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  private async evictLeastRecentlyUsed(count?: number): Promise<number> {
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

  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        await this.optimizeCache();
      } catch (error) {
        this.logger.error('Cache cleanup error', { error });
      }
    }, 60000); // Run every minute
  }

  private initializeStats(): CacheStats {
    return {
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      avgAccessTime: 0
    };
  }

  private recordHit(): void {
    this.stats.totalHits++;
    this.updateHitRate();
  }

  private recordMiss(): void {
    this.stats.totalMisses++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    if (total > 0) {
      this.stats.hitRate = (this.stats.totalHits / total) * 100;
      this.stats.missRate = (this.stats.totalMisses / total) * 100;
    }
  }

  private updateAccessTime(time: number): void {
    const total = this.stats.totalHits;
    if (total === 1) {
      this.stats.avgAccessTime = time;
    } else {
      this.stats.avgAccessTime = (this.stats.avgAccessTime * (total - 1) + time) / total;
    }
  }
}