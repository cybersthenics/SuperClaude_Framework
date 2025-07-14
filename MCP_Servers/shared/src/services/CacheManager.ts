/**
 * Cache Manager for Shared Services Infrastructure
 * Multi-level caching with LRU eviction, TTL, and semantic cache coordination
 */

import { EventEmitter } from 'events';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  level?: CacheLevel;
  priority?: CachePriority;
}

export type CacheLevel = 'memory' | 'semantic' | 'lsp' | 'persistent';
export type CachePriority = 'low' | 'medium' | 'high' | 'critical';
export type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'RANDOM';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
  accessCount: number;
  lastAccess: Date;
  tags: string[];
  size: number;
  level: CacheLevel;
  priority: CachePriority;
  compressed?: boolean;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  totalRequests: number;
  averageLatency: number;
  entriesCount: number;
  totalSize: number;
  hitsByLevel: Record<CacheLevel, number>;
  missByLevel: Record<CacheLevel, number>;
}

export interface SemanticAnalysisResult {
  symbols: any[];
  types: any[];
  references: any[];
  dependencies: string[];
  metadata: any;
}

export interface CacheConfig {
  maxMemoryUsage: number;
  defaultTTL: number;
  maxEntries: number;
  evictionPolicy: EvictionPolicy;
  enableCompression: boolean;
  enableSemanticCache: boolean;
  enableLSPCache: boolean;
  compressionThreshold: number;
  semanticCache?: SemanticCacheConfig;
  lspCache?: LSPCacheConfig;
}

export interface SemanticCacheConfig {
  maxEntries: number;
  defaultTTL: number;
  invalidationPatterns: string[];
}

export interface LSPCacheConfig {
  maxEntries: number;
  defaultTTL: number;
  enableSymbolCache: boolean;
  enableTypeCache: boolean;
}

export interface CacheStats {
  level: CacheLevel;
  entries: number;
  size: number;
  hitRate: number;
  missRate: number;
  averageAccessTime: number;
  evictions: number;
}

interface LRUNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev?: LRUNode<T>;
  next?: LRUNode<T>;
}

class LRUCache<T> {
  private maxSize: number;
  private cache = new Map<string, LRUNode<T>>();
  private head?: LRUNode<T>;
  private tail?: LRUNode<T>;
  private currentSize = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry<T> | null {
    const node = this.cache.get(key);
    if (!node) return null;

    // Move to front (most recently used)
    this.moveToFront(node);
    node.entry.lastAccess = new Date();
    node.entry.accessCount++;

    return node.entry;
  }

  set(key: string, entry: CacheEntry<T>): void {
    const existingNode = this.cache.get(key);
    
    if (existingNode) {
      // Update existing entry
      existingNode.entry = entry;
      this.moveToFront(existingNode);
      return;
    }

    // Create new node
    const newNode: LRUNode<T> = { key, entry };
    
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add to cache and front of list
    this.cache.set(key, newNode);
    this.addToFront(newNode);
    this.currentSize += entry.size;
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.cache.delete(key);
    this.removeFromList(node);
    this.currentSize -= node.entry.size;
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = undefined;
    this.tail = undefined;
    this.currentSize = 0;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): CacheEntry<T>[] {
    return Array.from(this.cache.values()).map(node => node.entry);
  }

  size(): number {
    return this.cache.size;
  }

  getCurrentSize(): number {
    return this.currentSize;
  }

  private evictLRU(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.cache.delete(key);
    this.currentSize -= this.tail.entry.size;
    
    if (this.tail.prev) {
      this.tail.prev.next = undefined;
      this.tail = this.tail.prev;
    } else {
      this.head = undefined;
      this.tail = undefined;
    }
  }

  private moveToFront(node: LRUNode<T>): void {
    if (node === this.head) return;

    this.removeFromList(node);
    this.addToFront(node);
  }

  private addToFront(node: LRUNode<T>): void {
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  private removeFromList(node: LRUNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = undefined;
    node.next = undefined;
  }
}

class SemanticCache {
  private cache = new Map<string, SemanticAnalysisResult>();
  private config: SemanticCacheConfig;
  private lastCleanup = Date.now();

  constructor(config: SemanticCacheConfig) {
    this.config = config;
  }

  async get(key: string): Promise<SemanticAnalysisResult | null> {
    this.cleanup();
    return this.cache.get(key) || null;
  }

  async set(key: string, result: SemanticAnalysisResult): Promise<void> {
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }
    this.cache.set(key, result);
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > 60000) { // Cleanup every minute
      // Remove expired entries (if TTL was implemented)
      this.lastCleanup = now;
    }
  }

  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }
}

class LSPCache {
  private symbolCache = new Map<string, any>();
  private typeCache = new Map<string, any>();
  private config: LSPCacheConfig;

  constructor(config: LSPCacheConfig) {
    this.config = config;
  }

  async get(key: string): Promise<any | null> {
    if (key.includes('symbol:')) {
      return this.symbolCache.get(key) || null;
    }
    if (key.includes('type:')) {
      return this.typeCache.get(key) || null;
    }
    return null;
  }

  async set(key: string, value: any): Promise<void> {
    if (key.includes('symbol:') && this.config.enableSymbolCache) {
      if (this.symbolCache.size >= this.config.maxEntries) {
        const firstKey = this.symbolCache.keys().next().value;
        if (firstKey) this.symbolCache.delete(firstKey);
      }
      this.symbolCache.set(key, value);
    }
    
    if (key.includes('type:') && this.config.enableTypeCache) {
      if (this.typeCache.size >= this.config.maxEntries) {
        const firstKey = this.typeCache.keys().next().value;
        if (firstKey) this.typeCache.delete(firstKey);
      }
      this.typeCache.set(key, value);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    // Invalidate symbol cache
    const symbolKeysToDelete: string[] = [];
    for (const key of this.symbolCache.keys()) {
      if (regex.test(key)) {
        symbolKeysToDelete.push(key);
      }
    }
    symbolKeysToDelete.forEach(key => this.symbolCache.delete(key));

    // Invalidate type cache
    const typeKeysToDelete: string[] = [];
    for (const key of this.typeCache.keys()) {
      if (regex.test(key)) {
        typeKeysToDelete.push(key);
      }
    }
    typeKeysToDelete.forEach(key => this.typeCache.delete(key));
  }

  async clear(): Promise<void> {
    this.symbolCache.clear();
    this.typeCache.clear();
  }

  size(): number {
    return this.symbolCache.size + this.typeCache.size;
  }
}

export class CacheManager extends EventEmitter {
  private memoryCache: LRUCache<any>;
  private semanticCache: SemanticCache;
  private lspCache: LSPCache;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private startTime = Date.now();

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    
    this.memoryCache = new LRUCache(config.maxEntries);
    this.semanticCache = new SemanticCache(config.semanticCache || {
      maxEntries: 1000,
      defaultTTL: 3600000,
      invalidationPatterns: []
    });
    this.lspCache = new LSPCache(config.lspCache || {
      maxEntries: 5000,
      defaultTTL: 1800000,
      enableSymbolCache: true,
      enableTypeCache: true
    });

    this.metrics = this.initializeMetrics();
    this.startMetricsCollection();
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      let result: T | null = null;
      let hitLevel: CacheLevel | null = null;

      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        result = memoryEntry.value;
        hitLevel = 'memory';
      }

      // Try semantic cache for semantic keys
      if (!result && key.startsWith('semantic:') && this.config.enableSemanticCache) {
        const semanticResult = await this.semanticCache.get(key);
        if (semanticResult) {
          result = semanticResult as T;
          hitLevel = 'semantic';
          // Promote to memory cache
          this.setInMemoryCache(key, result, options);
        }
      }

      // Try LSP cache for LSP keys
      if (!result && key.startsWith('lsp:') && this.config.enableLSPCache) {
        const lspResult = await this.lspCache.get(key);
        if (lspResult) {
          result = lspResult as T;
          hitLevel = 'lsp';
          // Promote to memory cache
          this.setInMemoryCache(key, result, options);
        }
      }

      const latency = performance.now() - startTime;
      
      if (result) {
        this.recordHit(hitLevel!, latency);
      } else {
        this.recordMiss(latency);
      }

      return result;
    } catch (error) {
      const latency = performance.now() - startTime;
      this.recordMiss(latency);
      this.emit('cacheError', { operation: 'get', key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const startTime = performance.now();
    
    try {
      const entry = this.createCacheEntry(key, value, options);
      
      // Set in appropriate cache level
      const level = options?.level || this.determineCacheLevel(key);
      
      switch (level) {
        case 'memory':
          this.memoryCache.set(key, entry);
          break;
        case 'semantic':
          if (this.config.enableSemanticCache) {
            await this.semanticCache.set(key, value as any);
          }
          break;
        case 'lsp':
          if (this.config.enableLSPCache) {
            await this.lspCache.set(key, value);
          }
          break;
        default:
          this.memoryCache.set(key, entry);
      }

      const latency = performance.now() - startTime;
      this.emit('cacheSet', { key, level, size: entry.size, latency });
    } catch (error) {
      this.emit('cacheError', { operation: 'set', key, error });
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;
      
      // Delete from memory cache
      if (this.memoryCache.delete(key)) {
        deleted = true;
      }

      // Delete from semantic cache if semantic key
      if (key.startsWith('semantic:')) {
        await this.semanticCache.invalidate(key);
        deleted = true;
      }

      // Delete from LSP cache if LSP key
      if (key.startsWith('lsp:')) {
        await this.lspCache.invalidate(key);
        deleted = true;
      }

      if (deleted) {
        this.emit('cacheDelete', { key });
      }

      return deleted;
    } catch (error) {
      this.emit('cacheError', { operation: 'delete', key, error });
      return false;
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        await this.invalidate(pattern);
      } else {
        this.memoryCache.clear();
        await this.semanticCache.clear();
        await this.lspCache.clear();
        this.emit('cacheClear', { pattern: 'all' });
      }
    } catch (error) {
      this.emit('cacheError', { operation: 'clear', pattern, error });
      throw error;
    }
  }

  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  async mget(keys: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get(key);
        if (value !== null) {
          results[key] = value;
        }
      })
    );

    return results;
  }

  async mset(entries: Record<string, any>, options?: CacheOptions): Promise<void> {
    await Promise.all(
      Object.entries(entries).map(([key, value]) => 
        this.set(key, value, options)
      )
    );
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(pattern.replace('*', '.*'));
      
      // Invalidate memory cache
      const keysToDelete = this.memoryCache.keys().filter(key => regex.test(key));
      keysToDelete.forEach(key => this.memoryCache.delete(key));

      // Invalidate semantic cache
      if (pattern.includes('semantic:')) {
        await this.semanticCache.invalidate(pattern);
      }

      // Invalidate LSP cache
      if (pattern.includes('lsp:')) {
        await this.lspCache.invalidate(pattern);
      }

      this.emit('cacheInvalidate', { pattern, keysAffected: keysToDelete.length });
    } catch (error) {
      this.emit('cacheError', { operation: 'invalidate', pattern, error });
      throw error;
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    return { ...this.metrics };
  }

  async configureEviction(policy: EvictionPolicy): Promise<void> {
    this.config.evictionPolicy = policy;
    this.emit('evictionPolicyChanged', { policy });
  }

  async cacheSemanticResult(key: string, result: SemanticAnalysisResult): Promise<void> {
    await this.semanticCache.set(key, result);
  }

  async getSemanticResult(key: string): Promise<SemanticAnalysisResult | null> {
    return await this.semanticCache.get(key);
  }

  async invalidateSemanticCache(filePattern: string): Promise<void> {
    await this.semanticCache.invalidate(filePattern);
  }

  async clearLevel(level: CacheLevel): Promise<void> {
    switch (level) {
      case 'memory':
        this.memoryCache.clear();
        break;
      case 'semantic':
        await this.semanticCache.clear();
        break;
      case 'lsp':
        await this.lspCache.clear();
        break;
    }
    this.emit('cacheLevelCleared', { level });
  }

  async createNamespace(namespace: string): Promise<void> {
    // Create a logical namespace for a service
    this.emit('namespaceCreated', { namespace });
  }

  async prepareCacheForOperation(operation: string): Promise<void> {
    // Optimize cache for specific operation
    this.emit('cacheOptimized', { operation });
  }

  getStats(): Record<CacheLevel, CacheStats> {
    return {
      memory: {
        level: 'memory',
        entries: this.memoryCache.size(),
        size: this.memoryCache.getCurrentSize(),
        hitRate: this.metrics.hitsByLevel.memory / (this.metrics.hitsByLevel.memory + this.metrics.missByLevel.memory) * 100 || 0,
        missRate: this.metrics.missByLevel.memory / (this.metrics.hitsByLevel.memory + this.metrics.missByLevel.memory) * 100 || 0,
        averageAccessTime: this.metrics.averageLatency,
        evictions: this.metrics.evictionCount
      },
      semantic: {
        level: 'semantic',
        entries: this.semanticCache.size(),
        size: 0, // Would need to calculate
        hitRate: this.metrics.hitsByLevel.semantic / (this.metrics.hitsByLevel.semantic + this.metrics.missByLevel.semantic) * 100 || 0,
        missRate: this.metrics.missByLevel.semantic / (this.metrics.hitsByLevel.semantic + this.metrics.missByLevel.semantic) * 100 || 0,
        averageAccessTime: this.metrics.averageLatency,
        evictions: 0
      },
      lsp: {
        level: 'lsp',
        entries: this.lspCache.size(),
        size: 0, // Would need to calculate
        hitRate: this.metrics.hitsByLevel.lsp / (this.metrics.hitsByLevel.lsp + this.metrics.missByLevel.lsp) * 100 || 0,
        missRate: this.metrics.missByLevel.lsp / (this.metrics.hitsByLevel.lsp + this.metrics.missByLevel.lsp) * 100 || 0,
        averageAccessTime: this.metrics.averageLatency,
        evictions: 0
      },
      persistent: {
        level: 'persistent',
        entries: 0,
        size: 0,
        hitRate: 0,
        missRate: 0,
        averageAccessTime: 0,
        evictions: 0
      }
    };
  }

  private createCacheEntry<T>(key: string, value: T, options?: CacheOptions): CacheEntry<T> {
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;
    
    return {
      key,
      value,
      timestamp: new Date(),
      ttl: options?.ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccess: new Date(),
      tags: options?.tags || [],
      size,
      level: options?.level || this.determineCacheLevel(key),
      priority: options?.priority || 'medium',
      compressed: options?.compress && size > this.config.compressionThreshold
    };
  }

  private setInMemoryCache<T>(key: string, value: T, options?: CacheOptions): void {
    const entry = this.createCacheEntry(key, value, options);
    this.memoryCache.set(key, entry);
  }

  private determineCacheLevel(key: string): CacheLevel {
    if (key.startsWith('semantic:')) return 'semantic';
    if (key.startsWith('lsp:')) return 'lsp';
    return 'memory';
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp.getTime();
    return age > entry.ttl;
  }

  private recordHit(level: CacheLevel, latency: number): void {
    this.metrics.hitsByLevel[level]++;
    this.metrics.totalRequests++;
    this.updateAverageLatency(latency);
  }

  private recordMiss(latency: number): void {
    this.metrics.missByLevel.memory++;
    this.metrics.totalRequests++;
    this.updateAverageLatency(latency);
  }

  private updateAverageLatency(latency: number): void {
    const total = this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
    this.metrics.averageLatency = total / this.metrics.totalRequests;
  }

  private initializeMetrics(): CacheMetrics {
    return {
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryUsage: 0,
      totalRequests: 0,
      averageLatency: 0,
      entriesCount: 0,
      totalSize: 0,
      hitsByLevel: { memory: 0, semantic: 0, lsp: 0, persistent: 0 },
      missByLevel: { memory: 0, semantic: 0, lsp: 0, persistent: 0 }
    };
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update metrics every 5 seconds
  }

  private updateMetrics(): void {
    const totalHits = Object.values(this.metrics.hitsByLevel).reduce((a, b) => a + b, 0);
    const totalMisses = Object.values(this.metrics.missByLevel).reduce((a, b) => a + b, 0);
    const totalRequests = totalHits + totalMisses;

    if (totalRequests > 0) {
      this.metrics.hitRate = (totalHits / totalRequests) * 100;
      this.metrics.missRate = (totalMisses / totalRequests) * 100;
    }

    this.metrics.entriesCount = this.memoryCache.size() + this.semanticCache.size() + this.lspCache.size();
    this.metrics.totalSize = this.memoryCache.getCurrentSize();
    this.metrics.memoryUsage = (this.metrics.totalSize / this.config.maxMemoryUsage) * 100;

    this.emit('metricsUpdated', this.metrics);
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Cache Manager...');
    
    this.memoryCache.clear();
    await this.semanticCache.clear();
    await this.lspCache.clear();
    
    this.removeAllListeners();
    console.log('Cache Manager shutdown complete');
  }
}