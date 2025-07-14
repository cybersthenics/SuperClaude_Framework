import { Logger } from './Logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CacheManager {
  private logger: Logger;
  private cache: Map<string, CacheEntry>;
  private ttl: number;
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;
  private hitCount: number;
  private missCount: number;

  constructor(ttl: number = 3600, maxSize: number = 10000) {
    this.logger = new Logger('CacheManager');
    this.cache = new Map();
    this.ttl = ttl * 1000; // Convert to milliseconds
    this.maxSize = maxSize;
    this.hitCount = 0;
    this.missCount = 0;

    // Start cleanup process
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute

    this.logger.info('CacheManager initialized', { ttl, maxSize });
  }

  async get<T>(key: string): Promise<T | null> {
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
    return entry.value as T;
  }

  async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
    const ttl = customTtl ? customTtl * 1000 : this.ttl;
    const now = Date.now();
    
    const entry: CacheEntry = {
      key,
      value,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + ttl,
      size: this.calculateSize(value)
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      await this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
    this.logger.debug('Cache set', { key, ttl, size: entry.size });
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.logger.info('Cache cleared');
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async keys(): Promise<string[]> {
    const validKeys: string[] = [];
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }

  async size(): Promise<number> {
    await this.cleanup();
    return this.cache.size;
  }

  async getStats(): Promise<CacheStats> {
    await this.cleanup();
    
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    
    let totalSize = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;
    
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

  async getHitRate(): Promise<number> {
    const stats = await this.getStats();
    return stats.hitRate;
  }

  async invalidate(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
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

  async warmUp(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    this.logger.info('Warming up cache', { entryCount: entries.length });
    
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
    
    this.logger.info('Cache warm-up completed');
  }

  async export(): Promise<CacheExport> {
    const entries: CacheExportEntry[] = [];
    
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

  async import(cacheExport: CacheExport): Promise<void> {
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

  async persist(filePath: string): Promise<void> {
    try {
      const cacheExport = await this.export();
      await fs.writeFile(filePath, JSON.stringify(cacheExport, null, 2));
      this.logger.info('Cache persisted to file', { filePath });
    } catch (error) {
      this.logger.error('Failed to persist cache', { error, filePath });
      throw error;
    }
  }

  async restore(filePath: string): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const cacheExport: CacheExport = JSON.parse(fileContent);
      await this.import(cacheExport);
      this.logger.info('Cache restored from file', { filePath });
    } catch (error) {
      this.logger.error('Failed to restore cache', { error, filePath });
      throw error;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
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

  private async evictLeastRecentlyUsed(): Promise<void> {
    let lruKey: string | null = null;
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

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    await this.clear();
    this.logger.info('CacheManager shutdown completed');
  }
}

interface CacheEntry {
  key: string;
  value: any;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number;
  size: number;
}

interface CacheStats {
  size: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalSize: number;
  averageSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  ttl: number;
  maxSize: number;
}

interface CacheExportEntry {
  key: string;
  value: any;
  createdAt: number;
  expiresAt: number;
  size: number;
}

interface CacheExport {
  entries: CacheExportEntry[];
  exportedAt: number;
  stats: CacheStats;
}