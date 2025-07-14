/**
 * Checkpoint Manager - Handles wave execution checkpoints and rollback functionality
 */
import { CheckpointDefinition, PhaseResult, ExecutionContext, ValidationResult, RollbackResult } from '../types/index.js';
export declare class CheckpointManager {
    private checkpoints;
    private rollbackStrategies;
    constructor();
    /**
     * Create a checkpoint for a wave phase
     */
    createCheckpoint(definition: CheckpointDefinition, phaseResult: PhaseResult): Promise<string>;
    /**
     * Get checkpoint data by ID
     */
    getCheckpoint(checkpointId: string): CheckpointData | undefined;
    /**
     * List all checkpoints for a wave
     */
    getWaveCheckpoints(waveId: string): CheckpointData[];
    /**
     * Rollback to a specific checkpoint
     */
    rollbackToCheckpoint(checkpointId: string, options?: RollbackOptions): Promise<RollbackResult>;
    /**
     * Validate checkpoint integrity
     */
    validateCheckpoint(phaseResult: PhaseResult): Promise<ValidationResult[]>;
    /**
     * Clean up old checkpoints based on retention policy
     */
    cleanupCheckpoints(retentionPolicy: CheckpointRetentionPolicy): Promise<void>;
    /**
     * Get checkpoint statistics
     */
    getCheckpointStatistics(): CheckpointStatistics;
    private capturePhaseState;
    private determineRollbackScope;
    private executeRollbackStrategy;
    private executePhaseRollback;
    private executeWaveRollback;
    private executeNoRollback;
    private validateRollbackResult;
    private validateStateCompleteness;
    private validateContextIntegrity;
    private validateResourceConsistency;
    private calculateStateChecksum;
    private getWavePhases;
    private calculateAverageCheckpointSize;
    private calculateTotalCheckpointSize;
    private calculateStrategyDistribution;
}
interface CheckpointData {
    checkpointId: string;
    phaseId: string;
    timestamp: Date;
    state: any;
    context: ExecutionContext;
    validationResults: ValidationResult[];
    rollbackStrategy: 'phase' | 'wave' | 'none';
    description: string;
}
interface RollbackOptions {
    preserveData?: boolean;
    preserveCheckpoints?: boolean;
    force?: boolean;
}
interface CheckpointRetentionPolicy {
    maxAgeMs?: number;
    minCheckpoints?: number;
    maxCheckpoints?: number;
}
interface CheckpointStatistics {
    totalCheckpoints: number;
    oldestCheckpoint: Date | null;
    newestCheckpoint: Date | null;
    averageSize: number;
    totalSize: number;
    strategyCounts: Record<string, number>;
}
export {};
//# sourceMappingURL=CheckpointManager.d.ts.map