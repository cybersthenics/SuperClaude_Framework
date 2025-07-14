import { CircuitBreakerState, CircuitBreakerOpenError } from '../types/index.js';

export class CircuitBreakerStateImpl implements CircuitBreakerState {
  public state: 'closed' | 'open' | 'half-open' = 'closed';
  public failureCount: number = 0;
  public lastFailureTime?: number;
  
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;

  constructor(failureThreshold: number = 5, recoveryTimeout: number = 30000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
  }

  isOpen(): boolean {
    return this.state === 'open';
  }

  shouldAttemptReset(): boolean {
    if (this.state !== 'open') return false;
    if (!this.lastFailureTime) return false;
    
    return Date.now() - this.lastFailureTime >= this.recoveryTimeout;
  }

  halfOpen(): void {
    this.state = 'half-open';
    console.log('Circuit breaker moving to half-open state');
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
    delete this.lastFailureTime;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }

  open(): void {
    this.state = 'open';
    this.lastFailureTime = Date.now();
    console.warn(`Circuit breaker opened after ${this.failureCount} failures`);
  }
}

export class HookCircuitBreaker {
  private breakerStates: Map<string, CircuitBreakerStateImpl> = new Map();
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;

  constructor(failureThreshold: number = 5, recoveryTimeout: number = 30000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
  }

  async executeWithCircuitBreaker<T>(
    operation: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const state = this.getCircuitBreakerState(operation);
    
    if (state.isOpen()) {
      if (state.shouldAttemptReset()) {
        state.halfOpen();
      } else {
        throw new CircuitBreakerOpenError(`Circuit breaker open for ${operation}`);
      }
    }

    try {
      const result = await executor();
      state.recordSuccess();
      return result;
    } catch (error) {
      state.recordFailure();
      
      if (state.failureCount >= this.failureThreshold) {
        state.open();
        await this.notifyCircuitBreakerOpen(operation, state);
      }
      
      throw error;
    }
  }

  getCircuitBreakerState(operation: string): CircuitBreakerStateImpl {
    if (!this.breakerStates.has(operation)) {
      this.breakerStates.set(operation, new CircuitBreakerStateImpl(this.failureThreshold, this.recoveryTimeout));
    }
    return this.breakerStates.get(operation)!;
  }

  async resetCircuitBreaker(operation: string): Promise<void> {
    const state = this.breakerStates.get(operation);
    if (state) {
      state.recordSuccess();
      console.log(`Circuit breaker reset for operation: ${operation}`);
    }
  }

  getAllCircuitBreakerStates(): Record<string, { state: string; failureCount: number; lastFailureTime?: number }> {
    const states: Record<string, any> = {};
    
    for (const [operation, state] of this.breakerStates) {
      states[operation] = {
        state: state.state,
        failureCount: state.failureCount,
        lastFailureTime: state.lastFailureTime
      };
    }
    
    return states;
  }

  getCircuitBreakerMetrics(): {
    totalOperations: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    totalFailures: number;
  } {
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

  private async notifyCircuitBreakerOpen(operation: string, state: CircuitBreakerStateImpl): Promise<void> {
    // Notify monitoring systems about circuit breaker opening
    const notification = {
      operation,
      failureCount: state.failureCount,
      timestamp: Date.now(),
      severity: 'critical'
    };

    console.error('Circuit breaker opened:', notification);
    // In production, this would send alerts to monitoring systems
  }
}

export class SemanticCacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private lspCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly maxCacheSize: number;
  private readonly defaultTTL: number;

  constructor(maxCacheSize: number = 1000, defaultTTL: number = 3600000) { // 1 hour default TTL
    this.maxCacheSize = maxCacheSize;
    this.defaultTTL = defaultTTL;
    this.startCleanupSchedule();
  }

  async setSemanticCache(key: string, data: any, ttl?: number): Promise<void> {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries(this.cache);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  async getSemanticCache(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async setLSPCache(key: string, data: any, ttl?: number): Promise<void> {
    // Evict oldest entries if cache is full
    if (this.lspCache.size >= this.maxCacheSize) {
      this.evictOldestEntries(this.lspCache);
    }

    this.lspCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  async getLSPCache(key: string): Promise<any | null> {
    const entry = this.lspCache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.lspCache.delete(key);
      return null;
    }

    return entry.data;
  }

  async invalidateSemanticCache(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      console.log('Semantic cache cleared');
      return;
    }

    const keysToDelete: string[] = [];
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

  async invalidateLSPCache(pattern?: string): Promise<void> {
    if (!pattern) {
      this.lspCache.clear();
      console.log('LSP cache cleared');
      return;
    }

    const keysToDelete: string[] = [];
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

  getCacheStatistics(): {
    semantic: { size: number; hitRate: number; entries: number };
    lsp: { size: number; hitRate: number; entries: number };
  } {
    // In production, would track actual hit rates
    return {
      semantic: {
        size: this.cache.size,
        hitRate: 0.8, // Placeholder
        entries: this.cache.size
      },
      lsp: {
        size: this.lspCache.size,
        hitRate: 0.75, // Placeholder
        entries: this.lspCache.size
      }
    };
  }

  async coordinateIntelligenceCache(semanticKey: string, lspKey: string, data: any): Promise<void> {
    // Coordinate caching between semantic and LSP caches for intelligence operations
    await Promise.all([
      this.setSemanticCache(semanticKey, data.semanticData, data.semanticTTL),
      this.setLSPCache(lspKey, data.lspData, data.lspTTL)
    ]);

    console.log(`Coordinated intelligence cache update: semantic=${semanticKey}, lsp=${lspKey}`);
  }

  private evictOldestEntries(cache: Map<string, { data: any; timestamp: number; ttl: number }>): void {
    // Evict oldest 10% of entries
    const entriesToEvict = Math.floor(cache.size * 0.1);
    const sortedEntries = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    for (let i = 0; i < entriesToEvict && i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (entry) {
        cache.delete(entry[0]);
      }
    }
  }

  private startCleanupSchedule(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let semanticCleaned = 0;
    let lspCleaned = 0;

    // Clean semantic cache
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        semanticCleaned++;
      }
    }

    // Clean LSP cache
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