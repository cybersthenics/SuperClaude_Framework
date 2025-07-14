/**
 * Phase Manager - Handles individual wave phase execution with monitoring and validation
 */
import { WavePhase, PhaseResult, ResourceUsage } from '../types/index.js';
export declare class PhaseManager {
    private activePhases;
    private phaseMetrics;
    constructor();
    /**
     * Execute a single wave phase with comprehensive monitoring
     */
    executePhase(phase: WavePhase): Promise<PhaseResult>;
    /**
     * Get status of all active phases
     */
    getActivePhases(): PhaseExecution[];
    /**
     * Get metrics for a specific phase
     */
    getPhaseMetrics(phaseId: string): PhaseMetrics | undefined;
    private validatePhaseRequirements;
    private executePhaseWithMonitoring;
    private executeParallelPhase;
    private executeSequentialPhase;
    private executeServerOperation;
    private executePersonaOperation;
    private createPhaseCheckpoint;
    private startResourceMonitoring;
    private stopResourceMonitoring;
    private checkServerAvailability;
    private checkPersonaAvailability;
    private checkDependencySatisfied;
    private calculateMaxSeverity;
    private calculateParallelEfficiency;
    private calculateCoordinationOverhead;
    private getPersonaSpecialization;
}
interface PhaseExecution {
    phaseId: string;
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    servers: string[];
    personas: string[];
    error?: any;
}
interface PhaseMetrics {
    executionTime: number;
    resourceUsage: ResourceUsage;
    validationTime: number;
    checkpointTime: number;
    parallelEfficiency?: number;
}
export {};
//# sourceMappingURL=PhaseManager.d.ts.map