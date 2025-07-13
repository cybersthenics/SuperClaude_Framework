/**
 * Enhanced caching manager for SuperClaude MCP
 * Implements multi-tier caching with intelligent eviction
 */

import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '@superclaude/shared';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
  tags: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
}

interface CacheConfig {
  maxSize: number;  // Max cache size in bytes
  maxEntries: number;
  defaultTTL: number;  // Default TTL in seconds
  checkInterval: number;  // Cleanup interval in seconds
  compressionThreshold: number;  // Compress entries larger than this
}

export class CacheManager extends EventEmitter {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entries: 0,
  };
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timer;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    
    this.config = {
      maxSize: 100 * 1024 * 1024,  // 100MB
      maxEntries: 10000,
      defaultTTL: 300,  // 5 minutes
      checkInterval: 60,  // 1 minute
      compressionThreshold: 1024,  // 1KB
      ...config,
    };

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.checkInterval * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.emit('miss', key);
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.emit('miss', key);
      return null;
    }

    // Update hit count and stats
    entry.hits++;
    this.stats.hits++;
    this.emit('hit', key);

    return entry.value;
  }

  /**
   * Set value in cache with options
   */
  set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
      compress?: boolean;
    } = {}
  ): boolean {
    const ttl = options.ttl || this.config.defaultTTL;
    const tags = options.tags || [];
    const size = this.estimateSize(value);

    // Check if we need to make room
    if (this.wouldExceedLimits(size)) {
      this.evictLRU(size);
    }

    // Still not enough space?
    if (this.wouldExceedLimits(size)) {
      logger.warn('Cache: Unable to store entry, size too large', { key, size });
      return false;
    }

    // Create entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000,  // Convert to ms
      hits: 0,
      size,
      tags,
    };

    // Store entry
    this.cache.set(key, entry);
    this.stats.size += size;
    this.stats.entries++;

    this.emit('set', key, size);
    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.size -= entry.size;
    this.stats.entries--;
    this.emit('delete', key);

    return true;
  }

  /**
   * Clear all entries with matching tags
   */
  clearByTags(tags: string[]): number {
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        this.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Get detailed cache info
   */
  getInfo(): any {
    const stats = this.getStats();
    const topEntries = this.getTopEntries(10);

    return {
      stats,
      config: this.config,
      topEntries,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Warmup cache with predefined entries
   */
  async warmup(entries: Array<{ key: string; loader: () => Promise<any>; ttl?: number }>) {
    const results = await Promise.allSettled(
      entries.map(async ({ key, loader, ttl }) => {
        try {
          const value = await loader();
          this.set(key, value, { ttl });
          return { key, success: true };
        } catch (error) {
          logger.error('Cache warmup failed', { key, error });
          return { key, success: false, error };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    logger.info(`Cache warmup completed: ${successful}/${entries.length} entries loaded`);
  }

  /**
   * Create cache key from parameters
   */
  static createKey(prefix: string, params: any): string {
    const hash = createHash('md5')
      .update(JSON.stringify(params, Object.keys(params).sort()))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Decorator for caching method results
   */
  static cached(options: { prefix: string; ttl?: number; tags?: string[] }) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const cache = (target.cache as CacheManager) || new CacheManager();

      descriptor.value = async function (...args: any[]) {
        const key = CacheManager.createKey(`${options.prefix}:${propertyKey}`, args);
        
        // Try cache first
        const cached = cache.get(key);
        if (cached !== null) {
          return cached;
        }

        // Execute method
        const result = await originalMethod.apply(this, args);
        
        // Cache result
        cache.set(key, result, {
          ttl: options.ttl,
          tags: options.tags,
        });

        return result;
      };

      return descriptor;
    };
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private wouldExceedLimits(size: number): boolean {
    return (
      this.stats.size + size > this.config.maxSize ||
      this.stats.entries + 1 > this.config.maxEntries
    );
  }

  private evictLRU(requiredSize: number): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry, score: this.calculateEvictionScore(entry) }))
      .sort((a, b) => a.score - b.score);

    let freedSize = 0;
    for (const { key } of entries) {
      if (freedSize >= requiredSize) break;
      
      const entry = this.cache.get(key);
      if (entry) {
        freedSize += entry.size;
        this.delete(key);
        this.stats.evictions++;
      }
    }
  }

  private calculateEvictionScore(entry: CacheEntry<any>): number {
    // Lower score = more likely to evict
    const age = Date.now() - entry.timestamp;
    const maxAge = entry.ttl;
    const ageRatio = age / maxAge;
    
    // Consider: age, hits, size
    const hitScore = Math.log(entry.hits + 1);
    const ageScore = 1 - ageRatio;
    const sizeScore = 1 / Math.log(entry.size + 1);

    return hitScore * 0.5 + ageScore * 0.3 + sizeScore * 0.2;
  }

  private cleanup(): void {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  private getTopEntries(limit: number): any[] {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        hits: entry.hits,
        size: entry.size,
        age: Date.now() - entry.timestamp,
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  private estimateSize(value: any): number {
    // Simple size estimation
    const str = JSON.stringify(value);
    return str.length * 2; // Rough estimate for UTF-16
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.cache.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const globalCache = new CacheManager({
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '104857600'), // 100MB
  defaultTTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
});

// Warmup cache on startup
globalCache.warmup([
  {
    key: 'mcp:server-config',
    loader: async () => {
      // Load MCP server configuration
      return require('../../mcp-servers.json');
    },
    ttl: 3600, // 1 hour
  },
  {
    key: 'routing:fallback-map',
    loader: async () => {
      // Load fallback routing map
      return {
        'Read': 'superclaude-code',
        'Write': 'superclaude-code',
        'Analyze': 'superclaude-intelligence',
        'Build': 'superclaude-ui',
        // ... more mappings
      };
    },
    ttl: 3600,
  },
]).catch(error => {
  logger.error('Cache warmup failed', error);
});