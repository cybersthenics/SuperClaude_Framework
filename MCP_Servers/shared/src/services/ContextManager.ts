/**
 * Context Manager for Shared Services Infrastructure
 * SuperClaude context preservation and optimization
 */

import { EventEmitter } from 'events';

export interface SuperClaudeContext {
  sessionId: string;
  userId?: string;
  command?: string;
  flags?: string[];
  personas?: string[];
  complexity?: number;
  scope?: string;
  priority?: number;
  timestamp: Date;
  metadata?: any;
}

export interface ContextSnapshot {
  id: string;
  context: SuperClaudeContext;
  timestamp: Date;
  size: number;
  version: number;
  compressed: boolean;
  checksum: string;
}

export interface ContextMergeResult {
  merged: SuperClaudeContext;
  conflicts: ContextConflict[];
  resolutionStrategy: MergeStrategy;
  success: boolean;
}

export interface ContextConflict {
  field: string;
  sourceValue: any;
  targetValue: any;
  severity: 'low' | 'medium' | 'high';
  resolution: 'source' | 'target' | 'merge' | 'manual';
}

export interface ContextOptimization {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  removedFields: string[];
  optimizations: OptimizationAction[];
  preservationScore: number;
}

export interface OptimizationAction {
  type: 'compress' | 'deduplicate' | 'truncate' | 'reference' | 'remove';
  field: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  reversible: boolean;
}

export interface ContextMetrics {
  totalContexts: number;
  averageSize: number;
  compressionRatio: number;
  preservationRate: number;
  mergeSuccessRate: number;
  optimizationSavings: number;
  accessPatterns: AccessPattern[];
}

export interface AccessPattern {
  field: string;
  accessCount: number;
  lastAccess: Date;
  frequency: number;
  importance: number;
}

export interface ContextQuery {
  sessionId?: string;
  userId?: string;
  command?: string;
  flags?: string[];
  personas?: string[];
  complexityRange?: [number, number];
  timeRange?: [Date, Date];
  limit?: number;
  sortBy?: 'timestamp' | 'complexity' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface ContextValidation {
  valid: boolean;
  errors: ContextValidationError[];
  warnings: ContextValidationWarning[];
  score: number;
}

export interface ContextValidationError {
  field: string;
  message: string;
  value: any;
  severity: 'critical' | 'high' | 'medium';
}

export interface ContextValidationWarning {
  field: string;
  message: string;
  value: any;
  suggestion: string;
}

export type MergeStrategy = 'source-priority' | 'target-priority' | 'intelligent' | 'manual';
export type SerializationFormat = 'json' | 'messagepack' | 'protobuf' | 'custom';
export type CompressionMethod = 'gzip' | 'lz4' | 'brotli' | 'none';

export interface ContextConfig {
  maxContextSize: number;
  defaultTTL: number;
  compressionThreshold: number;
  compressionMethod: CompressionMethod;
  serializationFormat: SerializationFormat;
  enableDeduplication: boolean;
  enableAccessTracking: boolean;
  maxHistoryLength: number;
  mergeStrategy: MergeStrategy;
  preservationPriority: string[];
}

export interface ContextStorage {
  store(snapshot: ContextSnapshot): Promise<void>;
  retrieve(id: string): Promise<ContextSnapshot | null>;
  query(query: ContextQuery): Promise<ContextSnapshot[]>;
  delete(id: string): Promise<boolean>;
  cleanup(olderThan: Date): Promise<number>;
  getSize(): Promise<number>;
}

export class MemoryContextStorage implements ContextStorage {
  private storage = new Map<string, ContextSnapshot>();

  async store(snapshot: ContextSnapshot): Promise<void> {
    this.storage.set(snapshot.id, snapshot);
  }

  async retrieve(id: string): Promise<ContextSnapshot | null> {
    return this.storage.get(id) || null;
  }

  async query(query: ContextQuery): Promise<ContextSnapshot[]> {
    let results = Array.from(this.storage.values());

    // Apply filters
    if (query.sessionId) {
      results = results.filter(s => s.context.sessionId === query.sessionId);
    }
    if (query.userId) {
      results = results.filter(s => s.context.userId === query.userId);
    }
    if (query.command) {
      results = results.filter(s => s.context.command === query.command);
    }
    if (query.flags && query.flags.length > 0) {
      results = results.filter(s => 
        query.flags!.some(flag => s.context.flags?.includes(flag))
      );
    }
    if (query.personas && query.personas.length > 0) {
      results = results.filter(s => 
        query.personas!.some(persona => s.context.personas?.includes(persona))
      );
    }
    if (query.complexityRange) {
      const [min, max] = query.complexityRange;
      results = results.filter(s => 
        s.context.complexity !== undefined && 
        s.context.complexity >= min && 
        s.context.complexity <= max
      );
    }
    if (query.timeRange) {
      const [start, end] = query.timeRange;
      results = results.filter(s => s.timestamp >= start && s.timestamp <= end);
    }

    // Sort results
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'complexity':
          comparison = (a.context.complexity || 0) - (b.context.complexity || 0);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async cleanup(olderThan: Date): Promise<number> {
    let deletedCount = 0;
    
    for (const [id, snapshot] of this.storage) {
      if (snapshot.timestamp < olderThan) {
        this.storage.delete(id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async getSize(): Promise<number> {
    return this.storage.size;
  }
}

export class ContextManager extends EventEmitter {
  private storage: ContextStorage;
  private config: ContextConfig;
  private accessPatterns = new Map<string, AccessPattern>();
  private metrics: ContextMetrics;
  private cleanupInterval: NodeJS.Timeout;

  constructor(storage?: ContextStorage, config?: Partial<ContextConfig>) {
    super();
    
    this.storage = storage || new MemoryContextStorage();
    this.config = {
      maxContextSize: 1024 * 1024, // 1MB
      defaultTTL: 3600000, // 1 hour
      compressionThreshold: 1024, // 1KB
      compressionMethod: 'gzip',
      serializationFormat: 'json',
      enableDeduplication: true,
      enableAccessTracking: true,
      maxHistoryLength: 1000,
      mergeStrategy: 'intelligent',
      preservationPriority: [
        'sessionId', 'userId', 'command', 'flags', 
        'personas', 'complexity', 'scope', 'priority'
      ],
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startCleanupInterval();
  }

  async preserveContext(context: SuperClaudeContext): Promise<string> {
    try {
      // Validate context
      const validation = this.validateContext(context);
      if (!validation.valid && validation.errors.some(e => e.severity === 'critical')) {
        throw new Error(`Context validation failed: ${validation.errors[0].message}`);
      }

      // Optimize context if needed
      const optimization = await this.optimizeContext(context);
      const optimizedContext = optimization.preservationScore > 90 ? 
        this.applyOptimizations(context, optimization) : context;

      // Create snapshot
      const snapshot = await this.createSnapshot(optimizedContext);
      
      // Store snapshot
      await this.storage.store(snapshot);

      // Update metrics
      this.updateMetrics(snapshot, optimization);

      // Track access pattern
      if (this.config.enableAccessTracking) {
        this.updateAccessPatterns(optimizedContext);
      }

      this.emit('contextPreserved', {
        id: snapshot.id,
        size: snapshot.size,
        compressed: snapshot.compressed,
        optimizationScore: optimization.preservationScore
      });

      return snapshot.id;
    } catch (error) {
      this.emit('contextPreservationError', { context, error });
      throw error;
    }
  }

  async retrieveContext(id: string): Promise<SuperClaudeContext | null> {
    try {
      const snapshot = await this.storage.retrieve(id);
      if (!snapshot) {
        return null;
      }

      // Decompress and deserialize if needed
      const context = await this.restoreFromSnapshot(snapshot);

      // Update access tracking
      if (this.config.enableAccessTracking) {
        this.updateAccessPatterns(context);
      }

      this.emit('contextRetrieved', { id, size: snapshot.size });
      return context;
    } catch (error) {
      this.emit('contextRetrievalError', { id, error });
      return null;
    }
  }

  async mergeContexts(
    source: SuperClaudeContext, 
    target: SuperClaudeContext, 
    strategy?: MergeStrategy
  ): Promise<ContextMergeResult> {
    try {
      const mergeStrategy = strategy || this.config.mergeStrategy;
      const conflicts: ContextConflict[] = [];
      const merged: SuperClaudeContext = { ...target };

      // Identify conflicts
      for (const field of Object.keys(source)) {
        if (target.hasOwnProperty(field) && source[field] !== target[field]) {
          const conflict: ContextConflict = {
            field,
            sourceValue: source[field],
            targetValue: target[field],
            severity: this.assessConflictSeverity(field, source[field], target[field]),
            resolution: this.resolveConflict(field, source[field], target[field], mergeStrategy)
          };
          conflicts.push(conflict);
        }
      }

      // Apply conflict resolutions
      for (const conflict of conflicts) {
        switch (conflict.resolution) {
          case 'source':
            merged[conflict.field] = conflict.sourceValue;
            break;
          case 'target':
            // Already in merged (target is base)
            break;
          case 'merge':
            merged[conflict.field] = this.mergeValues(conflict.sourceValue, conflict.targetValue);
            break;
          case 'manual':
            // Leave as target value, require manual resolution
            break;
        }
      }

      // Merge non-conflicting fields
      for (const [field, value] of Object.entries(source)) {
        if (!merged.hasOwnProperty(field)) {
          merged[field] = value;
        }
      }

      // Update timestamp
      merged.timestamp = new Date();

      const result: ContextMergeResult = {
        merged,
        conflicts,
        resolutionStrategy: mergeStrategy,
        success: conflicts.filter(c => c.resolution === 'manual').length === 0
      };

      this.emit('contextsMerged', {
        sourceId: source.sessionId,
        targetId: target.sessionId,
        conflicts: conflicts.length,
        success: result.success
      });

      return result;
    } catch (error) {
      this.emit('contextMergeError', { source, target, error });
      throw error;
    }
  }

  async optimizeContext(context: SuperClaudeContext): Promise<ContextOptimization> {
    const originalSize = this.calculateContextSize(context);
    const optimizations: OptimizationAction[] = [];
    let preservationScore = 100;

    // Analyze for optimization opportunities
    
    // 1. Remove non-essential metadata
    if (context.metadata && Object.keys(context.metadata).length > 10) {
      optimizations.push({
        type: 'truncate',
        field: 'metadata',
        description: 'Truncate excessive metadata to essential fields only',
        impact: 'low',
        reversible: false
      });
      preservationScore -= 5;
    }

    // 2. Compress large arrays
    if (context.flags && context.flags.length > 20) {
      optimizations.push({
        type: 'compress',
        field: 'flags',
        description: 'Compress flag array using efficient encoding',
        impact: 'low',
        reversible: true
      });
      preservationScore -= 2;
    }

    // 3. Deduplicate personas
    if (context.personas && new Set(context.personas).size < context.personas.length) {
      optimizations.push({
        type: 'deduplicate',
        field: 'personas',
        description: 'Remove duplicate personas',
        impact: 'low',
        reversible: true
      });
      preservationScore -= 1;
    }

    // 4. Reference frequently used strings
    const frequentStrings = this.findFrequentStrings(context);
    if (frequentStrings.length > 0) {
      optimizations.push({
        type: 'reference',
        field: 'strings',
        description: 'Replace frequent strings with references',
        impact: 'medium',
        reversible: true
      });
      preservationScore -= 3;
    }

    const optimizedSize = this.estimateOptimizedSize(originalSize, optimizations);
    const compressionRatio = optimizedSize / originalSize;

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      removedFields: optimizations.filter(o => o.type === 'remove').map(o => o.field),
      optimizations,
      preservationScore: Math.max(0, preservationScore)
    };
  }

  async queryContexts(query: ContextQuery): Promise<ContextSnapshot[]> {
    try {
      const results = await this.storage.query(query);
      
      this.emit('contextsQueried', {
        query,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      this.emit('contextQueryError', { query, error });
      throw error;
    }
  }

  async invalidateContext(id: string): Promise<boolean> {
    try {
      const deleted = await this.storage.delete(id);
      
      if (deleted) {
        this.emit('contextInvalidated', { id });
      }

      return deleted;
    } catch (error) {
      this.emit('contextInvalidationError', { id, error });
      return false;
    }
  }

  async invalidateContextsByPattern(pattern: {
    sessionId?: string;
    userId?: string;
    command?: string;
    olderThan?: Date;
  }): Promise<number> {
    try {
      const query: ContextQuery = {};
      
      if (pattern.sessionId) query.sessionId = pattern.sessionId;
      if (pattern.userId) query.userId = pattern.userId;
      if (pattern.command) query.command = pattern.command;
      if (pattern.olderThan) query.timeRange = [new Date(0), pattern.olderThan];

      const snapshots = await this.storage.query(query);
      let deletedCount = 0;

      for (const snapshot of snapshots) {
        if (await this.storage.delete(snapshot.id)) {
          deletedCount++;
        }
      }

      this.emit('contextsBatchInvalidated', {
        pattern,
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      this.emit('contextBatchInvalidationError', { pattern, error });
      return 0;
    }
  }

  async getContextMetrics(): Promise<ContextMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  private validateContext(context: SuperClaudeContext): ContextValidation {
    const errors: ContextValidationError[] = [];
    const warnings: ContextValidationWarning[] = [];
    let score = 100;

    // Required fields
    if (!context.sessionId) {
      errors.push({
        field: 'sessionId',
        message: 'Session ID is required',
        value: context.sessionId,
        severity: 'critical'
      });
      score -= 50;
    }

    if (!context.timestamp) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp is required',
        value: context.timestamp,
        severity: 'high'
      });
      score -= 20;
    }

    // Validate complexity
    if (context.complexity !== undefined && (context.complexity < 0 || context.complexity > 1)) {
      warnings.push({
        field: 'complexity',
        message: 'Complexity should be between 0 and 1',
        value: context.complexity,
        suggestion: 'Normalize complexity to range [0, 1]'
      });
      score -= 5;
    }

    // Validate priority
    if (context.priority !== undefined && (context.priority < 0 || context.priority > 10)) {
      warnings.push({
        field: 'priority',
        message: 'Priority should be between 0 and 10',
        value: context.priority,
        suggestion: 'Use standard priority scale [0-10]'
      });
      score -= 5;
    }

    // Check size limits
    const size = this.calculateContextSize(context);
    if (size > this.config.maxContextSize) {
      errors.push({
        field: 'size',
        message: `Context size ${size} exceeds maximum ${this.config.maxContextSize}`,
        value: size,
        severity: 'high'
      });
      score -= 30;
    }

    return {
      valid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  private async createSnapshot(context: SuperClaudeContext): Promise<ContextSnapshot> {
    const id = this.generateSnapshotId(context);
    const serialized = this.serialize(context);
    const compressed = serialized.length > this.config.compressionThreshold;
    const data = compressed ? this.compress(serialized) : serialized;
    const checksum = this.calculateChecksum(data);

    return {
      id,
      context,
      timestamp: new Date(),
      size: data.length,
      version: 1,
      compressed,
      checksum
    };
  }

  private async restoreFromSnapshot(snapshot: ContextSnapshot): Promise<SuperClaudeContext> {
    // This would implement decompression and deserialization
    // For now, return the stored context directly
    return snapshot.context;
  }

  private applyOptimizations(
    context: SuperClaudeContext, 
    optimization: ContextOptimization
  ): SuperClaudeContext {
    const optimized = { ...context };

    for (const action of optimization.optimizations) {
      switch (action.type) {
        case 'deduplicate':
          if (action.field === 'personas' && optimized.personas) {
            optimized.personas = [...new Set(optimized.personas)];
          }
          break;
        case 'truncate':
          if (action.field === 'metadata' && optimized.metadata) {
            // Keep only essential metadata fields
            const essential = ['version', 'source', 'type'];
            const truncated: any = {};
            for (const key of essential) {
              if (optimized.metadata[key]) {
                truncated[key] = optimized.metadata[key];
              }
            }
            optimized.metadata = truncated;
          }
          break;
        // Other optimization types would be implemented here
      }
    }

    return optimized;
  }

  private calculateContextSize(context: SuperClaudeContext): number {
    return new Blob([JSON.stringify(context)]).size;
  }

  private estimateOptimizedSize(originalSize: number, optimizations: OptimizationAction[]): number {
    let estimatedSize = originalSize;
    
    for (const optimization of optimizations) {
      switch (optimization.impact) {
        case 'low':
          estimatedSize *= 0.95; // 5% reduction
          break;
        case 'medium':
          estimatedSize *= 0.85; // 15% reduction
          break;
        case 'high':
          estimatedSize *= 0.7; // 30% reduction
          break;
      }
    }

    return Math.round(estimatedSize);
  }

  private findFrequentStrings(context: SuperClaudeContext): string[] {
    // Simplified implementation - would analyze string frequency
    return [];
  }

  private assessConflictSeverity(field: string, sourceValue: any, targetValue: any): 'low' | 'medium' | 'high' {
    const criticalFields = ['sessionId', 'userId'];
    const importantFields = ['command', 'complexity', 'priority'];

    if (criticalFields.includes(field)) {
      return 'high';
    }
    if (importantFields.includes(field)) {
      return 'medium';
    }
    return 'low';
  }

  private resolveConflict(
    field: string, 
    sourceValue: any, 
    targetValue: any, 
    strategy: MergeStrategy
  ): 'source' | 'target' | 'merge' | 'manual' {
    switch (strategy) {
      case 'source-priority':
        return 'source';
      case 'target-priority':
        return 'target';
      case 'intelligent':
        return this.intelligentConflictResolution(field, sourceValue, targetValue);
      case 'manual':
        return 'manual';
      default:
        return 'target';
    }
  }

  private intelligentConflictResolution(
    field: string, 
    sourceValue: any, 
    targetValue: any
  ): 'source' | 'target' | 'merge' {
    // Implement intelligent conflict resolution logic
    if (field === 'timestamp') {
      // Use more recent timestamp
      return new Date(sourceValue) > new Date(targetValue) ? 'source' : 'target';
    }
    
    if (field === 'complexity') {
      // Use higher complexity
      return sourceValue > targetValue ? 'source' : 'target';
    }

    if (field === 'flags' || field === 'personas') {
      // Merge arrays
      return 'merge';
    }

    // Default to target for other fields
    return 'target';
  }

  private mergeValues(sourceValue: any, targetValue: any): any {
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      return [...new Set([...targetValue, ...sourceValue])];
    }
    
    if (typeof sourceValue === 'object' && typeof targetValue === 'object') {
      return { ...targetValue, ...sourceValue };
    }

    // For primitive values, prefer source
    return sourceValue;
  }

  private updateAccessPatterns(context: SuperClaudeContext): void {
    const fields = Object.keys(context);
    const now = new Date();

    for (const field of fields) {
      const pattern = this.accessPatterns.get(field) || {
        field,
        accessCount: 0,
        lastAccess: now,
        frequency: 0,
        importance: 0
      };

      pattern.accessCount++;
      pattern.lastAccess = now;
      pattern.frequency = this.calculateFrequency(pattern);
      pattern.importance = this.calculateImportance(field, pattern);

      this.accessPatterns.set(field, pattern);
    }
  }

  private calculateFrequency(pattern: AccessPattern): number {
    const hoursSinceLastAccess = (Date.now() - pattern.lastAccess.getTime()) / (1000 * 60 * 60);
    return pattern.accessCount / (hoursSinceLastAccess + 1);
  }

  private calculateImportance(field: string, pattern: AccessPattern): number {
    const baseImportance = this.config.preservationPriority.indexOf(field);
    const frequencyBonus = Math.min(pattern.frequency * 10, 50);
    return Math.max(0, 100 - baseImportance * 10) + frequencyBonus;
  }

  private serialize(context: SuperClaudeContext): string {
    switch (this.config.serializationFormat) {
      case 'json':
        return JSON.stringify(context);
      case 'messagepack':
        // Would use MessagePack library
        return JSON.stringify(context);
      case 'protobuf':
        // Would use Protocol Buffers
        return JSON.stringify(context);
      default:
        return JSON.stringify(context);
    }
  }

  private compress(data: string): string {
    // Would implement actual compression
    return data;
  }

  private calculateChecksum(data: string): string {
    // Simple hash implementation - would use proper crypto hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private generateSnapshotId(context: SuperClaudeContext): string {
    const timestamp = Date.now();
    const sessionHash = this.calculateChecksum(context.sessionId);
    return `ctx_${timestamp}_${sessionHash}`;
  }

  private initializeMetrics(): ContextMetrics {
    return {
      totalContexts: 0,
      averageSize: 0,
      compressionRatio: 1.0,
      preservationRate: 100,
      mergeSuccessRate: 100,
      optimizationSavings: 0,
      accessPatterns: []
    };
  }

  private async updateMetrics(): Promise<void> {
    this.metrics.totalContexts = await this.storage.getSize();
    this.metrics.accessPatterns = Array.from(this.accessPatterns.values());
    
    this.emit('metricsUpdated', this.metrics);
  }

  private updateMetrics(snapshot: ContextSnapshot, optimization: ContextOptimization): void {
    this.metrics.totalContexts++;
    this.metrics.averageSize = (this.metrics.averageSize * (this.metrics.totalContexts - 1) + snapshot.size) / this.metrics.totalContexts;
    this.metrics.compressionRatio = (this.metrics.compressionRatio + optimization.compressionRatio) / 2;
    this.metrics.optimizationSavings += optimization.originalSize - optimization.optimizedSize;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      const cutoff = new Date(Date.now() - this.config.defaultTTL);
      const deletedCount = await this.storage.cleanup(cutoff);
      
      if (deletedCount > 0) {
        this.emit('contextsCleaned', { deletedCount, cutoff });
      }
    }, 60000); // Run cleanup every minute
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Context Manager...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.accessPatterns.clear();
    this.removeAllListeners();
    
    console.log('Context Manager shutdown complete');
  }
}