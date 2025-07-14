/**
 * Checkpoint Manager - Handles wave execution checkpoints and rollback functionality
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  CheckpointDefinition,
  PhaseResult,
  ExecutionContext,
  ValidationResult,
  RollbackResult 
} from '../types/index.js';

export class CheckpointManager {
  private checkpoints: Map<string, CheckpointData>;
  private rollbackStrategies: Map<string, RollbackStrategy>;

  constructor() {
    this.checkpoints = new Map();
    this.rollbackStrategies = new Map();
  }

  /**
   * Create a checkpoint for a wave phase
   */
  async createCheckpoint(
    definition: CheckpointDefinition,
    phaseResult: PhaseResult
  ): Promise<string> {
    const checkpointData: CheckpointData = {
      checkpointId: definition.checkpointId,
      phaseId: definition.phaseId,
      timestamp: new Date(),
      state: this.capturePhaseState(phaseResult),
      context: phaseResult.context,
      validationResults: await this.validateCheckpoint(phaseResult),
      rollbackStrategy: definition.rollbackStrategy,
      description: definition.description
    };

    this.checkpoints.set(definition.checkpointId, checkpointData);
    
    console.log(`💾 Created checkpoint ${definition.checkpointId} for phase ${definition.phaseId}`);
    
    return definition.checkpointId;
  }

  /**
   * Get checkpoint data by ID
   */
  getCheckpoint(checkpointId: string): CheckpointData | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * List all checkpoints for a wave
   */
  getWaveCheckpoints(waveId: string): CheckpointData[] {
    return Array.from(this.checkpoints.values())
      .filter(checkpoint => checkpoint.context.metadata?.waveId === waveId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Rollback to a specific checkpoint
   */
  async rollbackToCheckpoint(
    checkpointId: string,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    console.log(`🔄 Rolling back to checkpoint ${checkpointId}`);

    try {
      // Determine rollback scope
      const rollbackScope = await this.determineRollbackScope(checkpoint, options);
      
      // Execute rollback strategy
      const rollbackResult = await this.executeRollbackStrategy(checkpoint, rollbackScope);
      
      // Validate rollback success
      await this.validateRollbackResult(rollbackResult);
      
      console.log(`✅ Rollback to ${checkpointId} completed successfully`);
      
      return rollbackResult;

    } catch (error) {
      console.error(`❌ Rollback to ${checkpointId} failed:`, error);
      throw new Error(`Rollback failed: ${error}`);
    }
  }

  /**
   * Validate checkpoint integrity
   */
  async validateCheckpoint(phaseResult: PhaseResult): Promise<ValidationResult[]> {
    const validations: ValidationResult[] = [];

    // Validate state completeness
    validations.push(await this.validateStateCompleteness(phaseResult));
    
    // Validate context integrity
    validations.push(await this.validateContextIntegrity(phaseResult.context));
    
    // Validate resource consistency
    validations.push(await this.validateResourceConsistency(phaseResult));

    return validations;
  }

  /**
   * Clean up old checkpoints based on retention policy
   */
  async cleanupCheckpoints(retentionPolicy: CheckpointRetentionPolicy): Promise<void> {
    const now = new Date();
    const checkpointsToRemove: string[] = [];

    for (const [checkpointId, checkpoint] of this.checkpoints) {
      const age = now.getTime() - checkpoint.timestamp.getTime();
      const maxAge = retentionPolicy.maxAgeMs || 24 * 60 * 60 * 1000; // 24 hours default

      if (age > maxAge) {
        checkpointsToRemove.push(checkpointId);
      }
    }

    // Keep minimum number of checkpoints
    const allCheckpoints = Array.from(this.checkpoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const minToKeep = retentionPolicy.minCheckpoints || 5;
    if (allCheckpoints.length > minToKeep) {
      const excess = allCheckpoints.slice(minToKeep);
      checkpointsToRemove.push(...excess.map(c => c.checkpointId));
    }

    // Remove old checkpoints
    for (const checkpointId of checkpointsToRemove) {
      this.checkpoints.delete(checkpointId);
      console.log(`🗑️  Cleaned up checkpoint ${checkpointId}`);
    }

    console.log(`🧹 Cleanup completed: removed ${checkpointsToRemove.length} checkpoints`);
  }

  /**
   * Get checkpoint statistics
   */
  getCheckpointStatistics(): CheckpointStatistics {
    const checkpoints = Array.from(this.checkpoints.values());
    
    return {
      totalCheckpoints: checkpoints.length,
      oldestCheckpoint: checkpoints.length > 0 ? 
        new Date(Math.min(...checkpoints.map(c => c.timestamp.getTime()))) : null,
      newestCheckpoint: checkpoints.length > 0 ? 
        new Date(Math.max(...checkpoints.map(c => c.timestamp.getTime()))) : null,
      averageSize: this.calculateAverageCheckpointSize(checkpoints),
      totalSize: this.calculateTotalCheckpointSize(checkpoints),
      strategyCounts: this.calculateStrategyDistribution(checkpoints)
    };
  }

  // Private helper methods

  private capturePhaseState(phaseResult: PhaseResult): any {
    return {
      phaseId: phaseResult.phaseId,
      status: phaseResult.status,
      output: phaseResult.output,
      metrics: phaseResult.metrics,
      timestamp: new Date(),
      checksum: this.calculateStateChecksum(phaseResult)
    };
  }

  private async determineRollbackScope(
    checkpoint: CheckpointData,
    options: RollbackOptions
  ): Promise<RollbackScope> {
    const scope: RollbackScope = {
      checkpointId: checkpoint.checkpointId,
      strategy: checkpoint.rollbackStrategy,
      preserveData: options.preserveData !== false,
      preserveCheckpoints: options.preserveCheckpoints !== false,
      targetPhase: checkpoint.phaseId,
      affectedPhases: []
    };

    // Determine affected phases based on strategy
    switch (checkpoint.rollbackStrategy) {
      case 'phase':
        scope.affectedPhases = [checkpoint.phaseId];
        break;
      case 'wave':
        scope.affectedPhases = await this.getWavePhases(checkpoint);
        break;
      case 'none':
        scope.affectedPhases = [];
        break;
    }

    return scope;
  }

  private async executeRollbackStrategy(
    checkpoint: CheckpointData,
    scope: RollbackScope
  ): Promise<RollbackResult> {
    console.log(`🎯 Executing ${scope.strategy} rollback strategy`);

    switch (scope.strategy) {
      case 'phase':
        return await this.executePhaseRollback(checkpoint, scope);
      case 'wave':
        return await this.executeWaveRollback(checkpoint, scope);
      case 'none':
        return await this.executeNoRollback(checkpoint);
      default:
        throw new Error(`Unknown rollback strategy: ${scope.strategy}`);
    }
  }

  private async executePhaseRollback(
    checkpoint: CheckpointData,
    scope: RollbackScope
  ): Promise<RollbackResult> {
    // Restore phase state
    console.log(`   📋 Restoring phase ${checkpoint.phaseId} to checkpoint state`);
    
    // Simulate phase state restoration
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      rolledBackPhases: [checkpoint.phaseId],
      currentPhase: checkpoint.phaseId,
      preservedCheckpoints: scope.preserveCheckpoints ? [checkpoint.checkpointId] : []
    };
  }

  private async executeWaveRollback(
    checkpoint: CheckpointData,
    scope: RollbackScope
  ): Promise<RollbackResult> {
    // Restore entire wave state
    console.log(`   🌊 Restoring wave to checkpoint state`);
    
    // Simulate wave state restoration
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      rolledBackPhases: scope.affectedPhases,
      currentPhase: checkpoint.phaseId,
      preservedCheckpoints: scope.preserveCheckpoints ? 
        scope.affectedPhases.map(p => `checkpoint_${p}`) : []
    };
  }

  private async executeNoRollback(checkpoint: CheckpointData): Promise<RollbackResult> {
    console.log(`   ⚠️  No rollback strategy - checkpoint preserved for reference`);
    
    return {
      success: true,
      rolledBackPhases: [],
      currentPhase: checkpoint.phaseId,
      preservedCheckpoints: [checkpoint.checkpointId]
    };
  }

  private async validateRollbackResult(result: RollbackResult): Promise<void> {
    if (!result.success) {
      throw new Error('Rollback validation failed');
    }
    
    console.log(`   ✅ Rollback validation successful`);
    console.log(`      Phases rolled back: ${result.rolledBackPhases.length}`);
    console.log(`      Checkpoints preserved: ${result.preservedCheckpoints.length}`);
  }

  private async validateStateCompleteness(phaseResult: PhaseResult): Promise<ValidationResult> {
    // Validate that all required state is captured
    const issues: any[] = [];
    
    if (!phaseResult.output) {
      issues.push({
        code: 'MISSING_OUTPUT',
        message: 'Phase output is missing',
        severity: 'high'
      });
    }
    
    if (!phaseResult.metrics) {
      issues.push({
        code: 'MISSING_METRICS',
        message: 'Phase metrics are missing',
        severity: 'medium'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      severity: issues.length > 0 ? 'high' : 'low'
    };
  }

  private async validateContextIntegrity(context: ExecutionContext): Promise<ValidationResult> {
    const issues: any[] = [];
    
    if (!context.executionId) {
      issues.push({
        code: 'MISSING_EXECUTION_ID',
        message: 'Execution ID is missing from context',
        severity: 'high'
      });
    }
    
    if (!context.timestamp) {
      issues.push({
        code: 'MISSING_TIMESTAMP',
        message: 'Timestamp is missing from context',
        severity: 'medium'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      severity: issues.length > 0 ? 'medium' : 'low'
    };
  }

  private async validateResourceConsistency(phaseResult: PhaseResult): Promise<ValidationResult> {
    const issues: any[] = [];
    
    if (phaseResult.metrics.resourceUsage.memory < 0) {
      issues.push({
        code: 'INVALID_MEMORY_USAGE',
        message: 'Negative memory usage detected',
        severity: 'medium'
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      severity: issues.length > 0 ? 'medium' : 'low'
    };
  }

  private calculateStateChecksum(phaseResult: PhaseResult): string {
    // Simple checksum for state integrity
    const stateString = JSON.stringify({
      phaseId: phaseResult.phaseId,
      status: phaseResult.status,
      outputKeys: Object.keys(phaseResult.output || {}),
      metricsKeys: Object.keys(phaseResult.metrics || {})
    });
    
    return Buffer.from(stateString).toString('base64').slice(0, 16);
  }

  private async getWavePhases(checkpoint: CheckpointData): Promise<string[]> {
    // In real implementation, this would query the wave execution
    return [checkpoint.phaseId]; // Simplified for now
  }

  private calculateAverageCheckpointSize(checkpoints: CheckpointData[]): number {
    if (checkpoints.length === 0) return 0;
    
    const totalSize = checkpoints.reduce((sum, checkpoint) => {
      return sum + JSON.stringify(checkpoint).length;
    }, 0);
    
    return totalSize / checkpoints.length;
  }

  private calculateTotalCheckpointSize(checkpoints: CheckpointData[]): number {
    return checkpoints.reduce((sum, checkpoint) => {
      return sum + JSON.stringify(checkpoint).length;
    }, 0);
  }

  private calculateStrategyDistribution(checkpoints: CheckpointData[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const checkpoint of checkpoints) {
      const strategy = checkpoint.rollbackStrategy;
      distribution[strategy] = (distribution[strategy] || 0) + 1;
    }
    
    return distribution;
  }
}

// Supporting interfaces for internal use
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

interface RollbackScope {
  checkpointId: string;
  strategy: 'phase' | 'wave' | 'none';
  preserveData: boolean;
  preserveCheckpoints: boolean;
  targetPhase: string;
  affectedPhases: string[];
}

interface RollbackStrategy {
  type: 'phase' | 'wave' | 'none';
  preserveData: boolean;
  backupBeforeRollback: boolean;
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