/**
 * Wave Orchestrator Engine - Core orchestration system for complex multi-phase operations
 * Supports Progressive, Systematic, Adaptive, and Enterprise strategies
 */
import { OrchestrationRequest, WavePlan, WaveStrategy, WaveResult, WaveStatus, RollbackResult } from '../types/index.js';
import { ResourceManager } from '../shared/ResourceManager.js';
import { ContextPreserver } from '../shared/ContextPreserver.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';
export declare class WaveOrchestratorEngine {
    private resourceManager;
    private contextPreserver;
    private performanceTracker;
    private activeWaves;
    private checkpoints;
    constructor(resourceManager: ResourceManager, contextPreserver: ContextPreserver, performanceTracker: PerformanceTracker);
    /**
     * Create a comprehensive wave plan based on operation complexity and strategy
     */
    createWavePlan(operation: OrchestrationRequest, strategy?: WaveStrategy): Promise<WavePlan>;
    /**
     * Execute a wave plan with proper coordination and monitoring
     */
    executeWave(plan: WavePlan, options?: {
        monitorProgress?: boolean;
        enableRollback?: boolean;
    }): Promise<WaveResult>;
    /**
     * Get current status of a wave execution
     */
    getWaveStatus(waveId: string): Promise<WaveStatus>;
    /**
     * Rollback to a previous wave phase
     */
    rollbackWavePhase(waveId: string, targetPhase: string, options?: {
        preserveCheckpoints?: boolean;
    }): Promise<RollbackResult>;
    private analyzeComplexity;
    private selectStrategy;
    private createPhases;
    private createProgressivePhases;
    private createSystematicPhases;
    private createAdaptivePhases;
    private createEnterprisePhases;
    private estimateResources;
    private calculateTotalTime;
    private createCheckpoints;
    private generateWaveId;
    private executePhases;
    private executePhase;
    private createPhaseCheckpoint;
    private calculatePhaseTimings;
    private calculateResourceUtilization;
    private calculateCheckpointOverhead;
    private handleWaveFailure;
    private preserveCheckpoints;
}
//# sourceMappingURL=WaveOrchestratorEngine.d.ts.map