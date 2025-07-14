/**
 * Context Preserver - Maintains execution context across wave phases and pattern transitions
 */

import { ExecutionContext } from '../types/index.js';

export class ContextPreserver {
  private contextHistory: Map<string, ContextSnapshot[]>;
  private mergeStrategies: Map<string, ContextMergeStrategy>;
  private maxHistoryLength: number;

  constructor() {
    this.contextHistory = new Map();
    this.mergeStrategies = new Map();
    this.maxHistoryLength = 100;
    
    this.initializeDefaultStrategies();
  }

  /**
   * Preserve context at a specific point in execution
   */
  async preserveContext(
    executionId: string,
    context: ExecutionContext,
    metadata?: Record<string, any>
  ): Promise<string> {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const snapshot: ContextSnapshot = {
      snapshotId,
      executionId,
      context: this.deepCloneContext(context),
      metadata: metadata || {},
      timestamp: new Date(),
      size: this.calculateContextSize(context)
    };

    // Store snapshot
    if (!this.contextHistory.has(executionId)) {
      this.contextHistory.set(executionId, []);
    }
    
    const history = this.contextHistory.get(executionId)!;
    history.push(snapshot);
    
    // Maintain history size
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }

    console.log(`💾 Context preserved: ${snapshotId} (${snapshot.size} bytes)`);
    
    return snapshotId;
  }

  /**
   * Merge contexts from multiple sources
   */
  async mergeContexts(
    contexts: ExecutionContext[],
    strategy: 'sequential' | 'cumulative' | 'selective' = 'cumulative'
  ): Promise<ExecutionContext> {
    if (contexts.length === 0) {
      throw new Error('Cannot merge empty context array');
    }

    if (contexts.length === 1) {
      const firstContext = contexts[0];
      if (!firstContext) throw new Error('Single context is undefined');
      return this.deepCloneContext(firstContext);
    }

    console.log(`🔄 Merging ${contexts.length} contexts using ${strategy} strategy`);

    const mergeFunction = this.mergeStrategies.get(strategy);
    if (!mergeFunction) {
      throw new Error(`Unknown merge strategy: ${strategy}`);
    }

    const merged = await mergeFunction.merge(contexts);
    
    console.log(`✅ Context merge completed: ${this.calculateContextSize(merged)} bytes`);
    
    return merged;
  }

  /**
   * Restore context from a specific snapshot
   */
  async restoreContext(snapshotId: string): Promise<ExecutionContext | null> {
    for (const [_, history] of this.contextHistory) {
      const snapshot = history.find(s => s.snapshotId === snapshotId);
      if (snapshot && snapshot.context) {
        console.log(`🔄 Restoring context from snapshot: ${snapshotId}`);
        return this.deepCloneContext(snapshot.context);
      }
    }
    
    console.warn(`⚠️  Snapshot not found: ${snapshotId}`);
    return null;
  }

  /**
   * Get context evolution for an execution
   */
  getContextEvolution(executionId: string): ContextEvolution | null {
    const history = this.contextHistory.get(executionId);
    if (!history || history.length === 0) {
      return null;
    }

    const firstSnapshot = history[0];
    const lastSnapshot = history[history.length - 1];
    
    if (!firstSnapshot || !lastSnapshot) {
      return null;
    }

    return {
      executionId,
      snapshotCount: history.length,
      firstSnapshot,
      lastSnapshot,
      sizeEvolution: history.map(s => ({ timestamp: s.timestamp, size: s.size })),
      keyChanges: this.analyzeKeyChanges(history)
    };
  }

  /**
   * Clean up old context snapshots
   */
  async cleanupOldContexts(retentionPolicy: ContextRetentionPolicy): Promise<void> {
    const now = new Date();
    let totalCleaned = 0;

    for (const [executionId, history] of this.contextHistory) {
      const before = history.length;
      
      // Remove old snapshots
      const filtered = history.filter(snapshot => {
        const age = now.getTime() - snapshot.timestamp.getTime();
        return age <= (retentionPolicy.maxAgeMs || 24 * 60 * 60 * 1000); // 24 hours default
      });
      
      // Keep minimum snapshots
      const minToKeep = retentionPolicy.minSnapshots || 5;
      if (filtered.length < minToKeep && history.length >= minToKeep) {
        const toKeep = history.slice(-minToKeep);
        this.contextHistory.set(executionId, toKeep);
      } else {
        this.contextHistory.set(executionId, filtered);
      }
      
      const after = this.contextHistory.get(executionId)!.length;
      totalCleaned += (before - after);
    }

    console.log(`🧹 Context cleanup completed: removed ${totalCleaned} snapshots`);
  }

  /**
   * Get context preservation statistics
   */
  getContextStatistics(): ContextStatistics {
    let totalSnapshots = 0;
    let totalSize = 0;
    const executionCounts: Record<string, number> = {};

    for (const [executionId, history] of this.contextHistory) {
      totalSnapshots += history.length;
      executionCounts[executionId] = history.length;
      
      for (const snapshot of history) {
        totalSize += snapshot.size;
      }
    }

    return {
      totalExecutions: this.contextHistory.size,
      totalSnapshots,
      totalSize,
      averageSnapshotsPerExecution: totalSnapshots / Math.max(this.contextHistory.size, 1),
      averageSnapshotSize: totalSize / Math.max(totalSnapshots, 1),
      executionCounts
    };
  }

  // Private helper methods

  private initializeDefaultStrategies(): void {
    // Sequential merge strategy
    this.mergeStrategies.set('sequential', {
      merge: async (contexts: ExecutionContext[]): Promise<ExecutionContext> => {
        if (!contexts[0]) throw new Error('First context is required');
        const base = this.deepCloneContext(contexts[0]);
        
        for (let i = 1; i < contexts.length; i++) {
          const current = contexts[i];
          if (!current) continue;
          
          // Merge metadata sequentially
          base.metadata = { ...base.metadata, ...current.metadata };
          
          // Concatenate flags and scope
          base.flags = [...new Set([...base.flags, ...current.flags])];
          base.scope = [...new Set([...base.scope, ...current.scope])];
          
          // Use latest timestamp
          if (current.timestamp > base.timestamp) {
            base.timestamp = current.timestamp;
          }
        }
        
        return base;
      }
    });

    // Cumulative merge strategy
    this.mergeStrategies.set('cumulative', {
      merge: async (contexts: ExecutionContext[]): Promise<ExecutionContext> => {
        if (!contexts[0]) throw new Error('First context is required');
        const base = this.deepCloneContext(contexts[0]);
        
        // Accumulate all information
        const allFlags = new Set<string>();
        const allScope = new Set<string>();
        const mergedMetadata: Record<string, any> = {};
        
        for (const context of contexts) {
          if (!context) continue;
          context.flags.forEach(flag => allFlags.add(flag));
          context.scope.forEach(scope => allScope.add(scope));
          Object.assign(mergedMetadata, context.metadata);
        }
        
        base.flags = Array.from(allFlags);
        base.scope = Array.from(allScope);
        base.metadata = mergedMetadata;
        base.timestamp = new Date(); // Current timestamp for merged context
        
        return base;
      }
    });

    // Selective merge strategy
    this.mergeStrategies.set('selective', {
      merge: async (contexts: ExecutionContext[]): Promise<ExecutionContext> => {
        if (!contexts[0]) throw new Error('First context is required');
        const base = this.deepCloneContext(contexts[0]);
        
        // Selectively merge based on priority and relevance
        for (let i = 1; i < contexts.length; i++) {
          const current = contexts[i];
          if (!current) continue;
          
          // Merge only high-priority flags
          const highPriorityFlags = current.flags.filter(flag => 
            flag.includes('critical') || flag.includes('important')
          );
          base.flags = [...new Set([...base.flags, ...highPriorityFlags])];
          
          // Merge relevant metadata only
          const relevantMetadata = Object.fromEntries(
            Object.entries(current.metadata).filter(([key]) => 
              key.includes('result') || key.includes('status') || key.includes('metric')
            )
          );
          base.metadata = { ...base.metadata, ...relevantMetadata };
        }
        
        return base;
      }
    });
  }

  private deepCloneContext(context: ExecutionContext): ExecutionContext {
    return {
      executionId: context.executionId,
      command: context.command,
      flags: [...context.flags],
      scope: [...context.scope],
      metadata: JSON.parse(JSON.stringify(context.metadata)),
      timestamp: new Date(context.timestamp.getTime())
    };
  }

  private calculateContextSize(context: ExecutionContext): number {
    return JSON.stringify(context).length;
  }

  private analyzeKeyChanges(history: ContextSnapshot[]): ContextChange[] {
    const changes: ContextChange[] = [];
    
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      
      if (!prev || !curr) continue;
      
      // Analyze flags changes
      const newFlags = curr.context.flags.filter(flag => !prev.context.flags.includes(flag));
      const removedFlags = prev.context.flags.filter(flag => !curr.context.flags.includes(flag));
      
      if (newFlags.length > 0 || removedFlags.length > 0) {
        changes.push({
          type: 'flags',
          timestamp: curr.timestamp,
          description: `Flags: +${newFlags.length}, -${removedFlags.length}`,
          details: { added: newFlags, removed: removedFlags }
        });
      }
      
      // Analyze scope changes
      const newScope = curr.context.scope.filter(scope => !prev.context.scope.includes(scope));
      const removedScope = prev.context.scope.filter(scope => !curr.context.scope.includes(scope));
      
      if (newScope.length > 0 || removedScope.length > 0) {
        changes.push({
          type: 'scope',
          timestamp: curr.timestamp,
          description: `Scope: +${newScope.length}, -${removedScope.length}`,
          details: { added: newScope, removed: removedScope }
        });
      }
      
      // Analyze metadata changes
      const prevMetadataKeys = Object.keys(prev.context.metadata);
      const currMetadataKeys = Object.keys(curr.context.metadata);
      const newMetadataKeys = currMetadataKeys.filter(key => !prevMetadataKeys.includes(key));
      
      if (newMetadataKeys.length > 0) {
        changes.push({
          type: 'metadata',
          timestamp: curr.timestamp,
          description: `Metadata: +${newMetadataKeys.length} keys`,
          details: { added: newMetadataKeys }
        });
      }
    }
    
    return changes;
  }
}

// Supporting interfaces
interface ContextSnapshot {
  snapshotId: string;
  executionId: string;
  context: ExecutionContext;
  metadata: Record<string, any>;
  timestamp: Date;
  size: number;
}

interface ContextMergeStrategy {
  merge(contexts: ExecutionContext[]): Promise<ExecutionContext>;
}

interface ContextEvolution {
  executionId: string;
  snapshotCount: number;
  firstSnapshot: ContextSnapshot;
  lastSnapshot: ContextSnapshot;
  sizeEvolution: { timestamp: Date; size: number }[];
  keyChanges: ContextChange[];
}

interface ContextChange {
  type: 'flags' | 'scope' | 'metadata';
  timestamp: Date;
  description: string;
  details: Record<string, any>;
}

interface ContextRetentionPolicy {
  maxAgeMs?: number;
  minSnapshots?: number;
  maxSnapshots?: number;
}

interface ContextStatistics {
  totalExecutions: number;
  totalSnapshots: number;
  totalSize: number;
  averageSnapshotsPerExecution: number;
  averageSnapshotSize: number;
  executionCounts: Record<string, number>;
}