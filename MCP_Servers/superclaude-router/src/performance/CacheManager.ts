import { 
  CacheManagerInterface, 
  CacheStats 
} from '../types/index.js';

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

export class CacheManager implements CacheManagerInterface {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 300000; // 5 minutes
  private maxSize: number = 1000;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanupInterval();
  }

  get(key: string): any {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.value;
  }

  set(key: string, value: any, ttl?: number): void {
    const actualTTL = ttl || this.defaultTTL;
    
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: actualTTL,
      hits: 0
    };

    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  getStats(): CacheStats {
    const { hits, misses, totalRequests } = this.stats;
    
    return {
      hitRate: totalRequests > 0 ? hits / totalRequests : 0,
      missRate: totalRequests > 0 ? misses / totalRequests : 0,
      totalRequests,
      totalHits: hits,
      totalMisses: misses
    };
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): any[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  entries(): [string, any][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    while (this.cache.size > this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  cleanup(): number {
    const initialSize = this.cache.size;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
      }
    }
    
    return initialSize - this.cache.size;
  }

  getMemoryUsage(): {
    estimatedBytes: number;
    entryCount: number;
    averageEntrySize: number;
  } {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += this.estimateEntrySize(key, entry);
    }
    
    const entryCount = this.cache.size;
    
    return {
      estimatedBytes: totalSize,
      entryCount,
      averageEntrySize: entryCount > 0 ? totalSize / entryCount : 0
    };
  }

  private isExpired(entry: CacheEntry, currentTime?: number): boolean {
    const now = currentTime || Date.now();
    return (now - entry.timestamp) > entry.ttl;
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;
    let lruHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const score = entry.timestamp + (entry.hits * 1000);
      if (score < lruTime) {
        lruTime = score;
        lruHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  private estimateEntrySize(key: string, entry: CacheEntry): number {
    const keySize = key.length * 2; // Rough estimate for UTF-16
    const valueSize = this.estimateObjectSize(entry.value);
    const metadataSize = 32; // Rough estimate for timestamp, ttl, hits
    
    return keySize + valueSize + metadataSize;
  }

  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    if (typeof obj === 'string') {
      return obj.length * 2;
    }
    
    if (typeof obj === 'number') {
      return 8;
    }
    
    if (typeof obj === 'boolean') {
      return 4;
    }
    
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.estimateObjectSize(item), 0);
    }
    
    if (typeof obj === 'object') {
      let size = 0;
      for (const [key, value] of Object.entries(obj)) {
        size += key.length * 2; // Key size
        size += this.estimateObjectSize(value); // Value size
      }
      return size;
    }
    
    return 0;
  }
}

export class RoutingCacheManager extends CacheManager {
  constructor() {
    super(1000, 300000); // 1000 entries, 5 minute TTL
  }

  cacheRoutingDecision(
    command: string, 
    context: string, 
    decision: any
  ): void {
    const key = this.generateRoutingCacheKey(command, context);
    this.set(key, decision, 300000); // 5 minute TTL
  }

  getCachedRoutingDecision(
    command: string, 
    context: string
  ): any {
    const key = this.generateRoutingCacheKey(command, context);
    return this.get(key);
  }

  private generateRoutingCacheKey(command: string, context: string): string {
    const contextHash = this.hashString(context);
    return `routing:${command}:${contextHash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export class CommandCacheManager extends CacheManager {
  constructor() {
    super(500, 600000); // 500 entries, 10 minute TTL
  }

  cacheCommandParsing(
    input: string, 
    parsedCommand: any
  ): void {
    const key = `command:${this.hashString(input)}`;
    this.set(key, parsedCommand, 600000); // 10 minute TTL
  }

  getCachedCommandParsing(input: string): any {
    const key = `command:${this.hashString(input)}`;
    return this.get(key);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}