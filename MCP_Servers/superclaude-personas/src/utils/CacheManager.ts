// SuperClaude Personas - CacheManager
// Intelligent caching system for personas server

import NodeCache from 'node-cache';
import { Logger } from './Logger';

export interface CacheEntry<T> {
  value: T;
  timestamp: Date;
  ttl: number;
  hitCount: number;
  lastAccessed: Date;
}

export interface CacheStats {
  totalKeys: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  topKeys: Array<{ key: string; hits: number; size: number }>;
}

export class CacheManager {
  private cache: NodeCache;
  private logger: Logger;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };

  // Cache configuration
  private readonly defaultTTL: number = 300; // 5 minutes
  private readonly maxKeys: number = 10000;
  private readonly checkPeriod: number = 600; // 10 minutes

  // Cache key prefixes for different data types
  private readonly keyPrefixes = {
    PERSONA_ACTIVATION: 'activation:',
    PERSONA_RECOMMENDATION: 'recommendation:',
    CONTEXT_ANALYSIS: 'analysis:',
    COLLABORATION_RESULT: 'collaboration:',
    CHAIN_CONTEXT: 'chain:',
    EXPERTISE_COMPATIBILITY: 'expertise:',
    PERFORMANCE_METRICS: 'performance:',
    VALIDATION_RESULT: 'validation:'
  };

  constructor(logger: Logger, options?: {
    defaultTTL?: number;
    maxKeys?: number;
    checkPeriod?: number;
  }) {
    this.logger = logger.createChildLogger('CacheManager');
    
    // Initialize cache with options
    this.cache = new NodeCache({
      stdTTL: options?.defaultTTL || this.defaultTTL,
      maxKeys: options?.maxKeys || this.maxKeys,
      checkperiod: options?.checkPeriod || this.checkPeriod,
      useClones: true,
      deleteOnExpire: true
    });

    // Initialize stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Set up cache event handlers
    this.setupEventHandlers();
    
    // Start periodic cache maintenance
    this.startPeriodicMaintenance();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      
      if (value !== undefined) {
        this.stats.hits++;
        this.logger.debug('Cache hit', { key, type: this.getKeyType(key) });
        return value;
      } else {
        this.stats.misses++;
        this.logger.debug('Cache miss', { key, type: this.getKeyType(key) });
        return undefined;
      }
    } catch (error) {
      this.logger.error('Cache get error', error, { key });
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
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
    } catch (error) {
      this.logger.error('Cache set error', error, { key });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    try {
      const success = this.cache.del(key) > 0;
      
      if (success) {
        this.stats.deletes++;
        this.logger.debug('Cache delete', { key, type: this.getKeyType(key) });
      }
      
      return success;
    } catch (error) {
      this.logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get multiple values from cache
   */
  getMultiple<T>(keys: string[]): Record<string, T> {
    const results: Record<string, T> = {};
    
    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== undefined) {
        results[key] = value;
      }
    }
    
    return results;
  }

  /**
   * Set multiple values in cache
   */
  setMultiple<T>(entries: Array<{ key: string; value: T; ttl?: number }>): boolean {
    let allSuccessful = true;
    
    for (const entry of entries) {
      const success = this.set(entry.key, entry.value, entry.ttl);
      allSuccessful = allSuccessful && success;
    }
    
    return allSuccessful;
  }

  /**
   * Get or set pattern - get value, or set if not exists
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get existing value
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Generate new value
    try {
      const value = await factory();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error('Cache factory error', error, { key });
      throw error;
    }
  }

  /**
   * Cache persona activation result
   */
  cachePersonaActivation(
    persona: string,
    contextHash: string,
    result: any,
    ttl?: number
  ): boolean {
    const key = `${this.keyPrefixes.PERSONA_ACTIVATION}${persona}:${contextHash}`;
    return this.set(key, result, ttl);
  }

  /**
   * Get cached persona activation result
   */
  getCachedPersonaActivation(
    persona: string,
    contextHash: string
  ): any | undefined {
    const key = `${this.keyPrefixes.PERSONA_ACTIVATION}${persona}:${contextHash}`;
    return this.get(key);
  }

  /**
   * Cache persona recommendation
   */
  cachePersonaRecommendation(
    contextHash: string,
    recommendations: any[],
    ttl?: number
  ): boolean {
    const key = `${this.keyPrefixes.PERSONA_RECOMMENDATION}${contextHash}`;
    return this.set(key, recommendations, ttl);
  }

  /**
   * Get cached persona recommendation
   */
  getCachedPersonaRecommendation(contextHash: string): any[] | undefined {
    const key = `${this.keyPrefixes.PERSONA_RECOMMENDATION}${contextHash}`;
    return this.get(key);
  }

  /**
   * Cache context analysis result
   */
  cacheContextAnalysis(
    contextHash: string,
    analysis: any,
    ttl?: number
  ): boolean {
    const key = `${this.keyPrefixes.CONTEXT_ANALYSIS}${contextHash}`;
    return this.set(key, analysis, ttl);
  }

  /**
   * Get cached context analysis
   */
  getCachedContextAnalysis(contextHash: string): any | undefined {
    const key = `${this.keyPrefixes.CONTEXT_ANALYSIS}${contextHash}`;
    return this.get(key);
  }

  /**
   * Cache collaboration result
   */
  cacheCollaborationResult(
    personas: string[],
    mode: string,
    operationHash: string,
    result: any,
    ttl?: number
  ): boolean {
    const key = `${this.keyPrefixes.COLLABORATION_RESULT}${personas.join(',')}:${mode}:${operationHash}`;
    return this.set(key, result, ttl);
  }

  /**
   * Get cached collaboration result
   */
  getCachedCollaborationResult(
    personas: string[],
    mode: string,
    operationHash: string
  ): any | undefined {
    const key = `${this.keyPrefixes.COLLABORATION_RESULT}${personas.join(',')}:${mode}:${operationHash}`;
    return this.get(key);
  }

  /**
   * Cache expertise compatibility
   */
  cacheExpertiseCompatibility(
    fromPersona: string,
    toPersona: string,
    expertiseHash: string,
    compatibility: any,
    ttl?: number
  ): boolean {
    const key = `${this.keyPrefixes.EXPERTISE_COMPATIBILITY}${fromPersona}:${toPersona}:${expertiseHash}`;
    return this.set(key, compatibility, ttl);
  }

  /**
   * Get cached expertise compatibility
   */
  getCachedExpertiseCompatibility(
    fromPersona: string,
    toPersona: string,
    expertiseHash: string
  ): any | undefined {
    const key = `${this.keyPrefixes.EXPERTISE_COMPATIBILITY}${fromPersona}:${toPersona}:${expertiseHash}`;
    return this.get(key);
  }

  /**
   * Clear cache by key pattern
   */
  clearByPattern(pattern: string): number {
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

  /**
   * Clear cache by key prefix
   */
  clearByPrefix(prefix: string): number {
    return this.clearByPattern(prefix);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.flushAll();
    this.logger.info('Cache cleared completely');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const keys = this.cache.keys();
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;

    // Calculate memory usage estimation
    let memoryUsage = 0;
    const keyStats: Array<{ key: string; hits: number; size: number }> = [];
    
    for (const key of keys) {
      const value = this.cache.get(key);
      const size = this.estimateSize(value);
      memoryUsage += size;
      
      keyStats.push({
        key,
        hits: 1, // Simplified - could track actual hits per key
        size
      });
    }

    // Sort by size for top keys
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

  /**
   * Get cache health information
   */
  getHealthInfo(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      keyCount: number;
      hitRate: number;
      memoryUsage: number;
      maxKeys: number;
    };
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check key count
    if (stats.totalKeys > this.maxKeys * 0.8) {
      status = 'warning';
      recommendations.push('Cache is approaching maximum key limit');
    }

    // Check hit rate
    if (stats.hitRate < 0.7) {
      status = 'warning';
      recommendations.push('Cache hit rate is below optimal (70%)');
    }

    // Check memory usage
    if (stats.memoryUsage > 100 * 1024 * 1024) { // 100MB
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

  /**
   * Optimize cache by removing low-value entries
   */
  optimize(): {
    removedKeys: number;
    reclaimedMemory: number;
  } {
    const stats = this.getStats();
    const keys = this.cache.keys();
    let removedKeys = 0;
    let reclaimedMemory = 0;

    // Remove entries that are close to expiration
    for (const key of keys) {
      const ttl = this.cache.getTtl(key);
      if (ttl && ttl < Date.now() + 60000) { // Expire in less than 1 minute
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

  /**
   * Close cache and cleanup resources
   */
  close(): void {
    this.cache.close();
    this.logger.info('Cache manager closed');
  }

  // Private methods

  private setupEventHandlers(): void {
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

  private startPeriodicMaintenance(): void {
    // Optimize cache every 10 minutes
    setInterval(() => {
      this.optimize();
    }, 10 * 60 * 1000);

    // Log cache statistics every 5 minutes
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

  private getKeyType(key: string): string {
    for (const [type, prefix] of Object.entries(this.keyPrefixes)) {
      if (key.startsWith(prefix)) {
        return type;
      }
    }
    return 'unknown';
  }

  private estimateSize(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (2 bytes per character)
    } catch {
      return 100; // Default size for non-serializable objects
    }
  }
}