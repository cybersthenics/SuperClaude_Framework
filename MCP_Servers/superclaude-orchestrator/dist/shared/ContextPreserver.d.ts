/**
 * Context Preserver - Maintains execution context across wave phases and pattern transitions
 */
import { ExecutionContext } from '../types/index.js';
export declare class ContextPreserver {
    private contextHistory;
    private mergeStrategies;
    private maxHistoryLength;
    constructor();
    /**
     * Preserve context at a specific point in execution
     */
    preserveContext(executionId: string, context: ExecutionContext, metadata?: Record<string, any>): Promise<string>;
    /**
     * Merge contexts from multiple sources
     */
    mergeContexts(contexts: ExecutionContext[], strategy?: 'sequential' | 'cumulative' | 'selective'): Promise<ExecutionContext>;
    /**
     * Restore context from a specific snapshot
     */
    restoreContext(snapshotId: string): Promise<ExecutionContext | null>;
    /**
     * Get context evolution for an execution
     */
    getContextEvolution(executionId: string): ContextEvolution | null;
    /**
     * Clean up old context snapshots
     */
    cleanupOldContexts(retentionPolicy: ContextRetentionPolicy): Promise<void>;
    /**
     * Get context preservation statistics
     */
    getContextStatistics(): ContextStatistics;
    private initializeDefaultStrategies;
    private deepCloneContext;
    private calculateContextSize;
    private analyzeKeyChanges;
}
interface ContextSnapshot {
    snapshotId: string;
    executionId: string;
    context: ExecutionContext;
    metadata: Record<string, any>;
    timestamp: Date;
    size: number;
}
interface ContextEvolution {
    executionId: string;
    snapshotCount: number;
    firstSnapshot: ContextSnapshot;
    lastSnapshot: ContextSnapshot;
    sizeEvolution: {
        timestamp: Date;
        size: number;
    }[];
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
export {};
//# sourceMappingURL=ContextPreserver.d.ts.map