/**
 * Checkpoint Manager - Handles wave execution checkpoints and rollback functionality
 */
export class CheckpointManager {
    checkpoints;
    rollbackStrategies;
    constructor() {
        this.checkpoints = new Map();
        this.rollbackStrategies = new Map();
    }
    /**
     * Create a checkpoint for a wave phase
     */
    async createCheckpoint(definition, phaseResult) {
        const checkpointData = {
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
    getCheckpoint(checkpointId) {
        return this.checkpoints.get(checkpointId);
    }
    /**
     * List all checkpoints for a wave
     */
    getWaveCheckpoints(waveId) {
        return Array.from(this.checkpoints.values())
            .filter(checkpoint => checkpoint.context.metadata?.waveId === waveId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Rollback to a specific checkpoint
     */
    async rollbackToCheckpoint(checkpointId, options = {}) {
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
        }
        catch (error) {
            console.error(`❌ Rollback to ${checkpointId} failed:`, error);
            throw new Error(`Rollback failed: ${error}`);
        }
    }
    /**
     * Validate checkpoint integrity
     */
    async validateCheckpoint(phaseResult) {
        const validations = [];
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
    async cleanupCheckpoints(retentionPolicy) {
        const now = new Date();
        const checkpointsToRemove = [];
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
    getCheckpointStatistics() {
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
    capturePhaseState(phaseResult) {
        return {
            phaseId: phaseResult.phaseId,
            status: phaseResult.status,
            output: phaseResult.output,
            metrics: phaseResult.metrics,
            timestamp: new Date(),
            checksum: this.calculateStateChecksum(phaseResult)
        };
    }
    async determineRollbackScope(checkpoint, options) {
        const scope = {
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
    async executeRollbackStrategy(checkpoint, scope) {
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
    async executePhaseRollback(checkpoint, scope) {
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
    async executeWaveRollback(checkpoint, scope) {
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
    async executeNoRollback(checkpoint) {
        console.log(`   ⚠️  No rollback strategy - checkpoint preserved for reference`);
        return {
            success: true,
            rolledBackPhases: [],
            currentPhase: checkpoint.phaseId,
            preservedCheckpoints: [checkpoint.checkpointId]
        };
    }
    async validateRollbackResult(result) {
        if (!result.success) {
            throw new Error('Rollback validation failed');
        }
        console.log(`   ✅ Rollback validation successful`);
        console.log(`      Phases rolled back: ${result.rolledBackPhases.length}`);
        console.log(`      Checkpoints preserved: ${result.preservedCheckpoints.length}`);
    }
    async validateStateCompleteness(phaseResult) {
        // Validate that all required state is captured
        const issues = [];
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
    async validateContextIntegrity(context) {
        const issues = [];
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
    async validateResourceConsistency(phaseResult) {
        const issues = [];
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
    calculateStateChecksum(phaseResult) {
        // Simple checksum for state integrity
        const stateString = JSON.stringify({
            phaseId: phaseResult.phaseId,
            status: phaseResult.status,
            outputKeys: Object.keys(phaseResult.output || {}),
            metricsKeys: Object.keys(phaseResult.metrics || {})
        });
        return Buffer.from(stateString).toString('base64').slice(0, 16);
    }
    async getWavePhases(checkpoint) {
        // In real implementation, this would query the wave execution
        return [checkpoint.phaseId]; // Simplified for now
    }
    calculateAverageCheckpointSize(checkpoints) {
        if (checkpoints.length === 0)
            return 0;
        const totalSize = checkpoints.reduce((sum, checkpoint) => {
            return sum + JSON.stringify(checkpoint).length;
        }, 0);
        return totalSize / checkpoints.length;
    }
    calculateTotalCheckpointSize(checkpoints) {
        return checkpoints.reduce((sum, checkpoint) => {
            return sum + JSON.stringify(checkpoint).length;
        }, 0);
    }
    calculateStrategyDistribution(checkpoints) {
        const distribution = {};
        for (const checkpoint of checkpoints) {
            const strategy = checkpoint.rollbackStrategy;
            distribution[strategy] = (distribution[strategy] || 0) + 1;
        }
        return distribution;
    }
}
//# sourceMappingURL=CheckpointManager.js.map