/**
 * Concurrency Controller - Manages concurrent sub-agent execution with resource limits
 */
import { SubAgentTask, SubAgentResult } from '../types/index.js';
export declare class ConcurrencyController {
    private maxConcurrent;
    private adaptiveScaling;
    private activeExecutions;
    private executionQueue;
    private resourceMonitor;
    constructor(maxConcurrent?: number);
    /**
     * Execute sub-agent tasks with concurrency control
     */
    executeWithConcurrency(tasks: SubAgentTask[], maxConcurrency?: number): Promise<SubAgentResult[]>;
    /**
     * Update concurrency configuration
     */
    updateConfiguration(config: ConcurrencyConfig): void;
    /**
     * Get current concurrency status
     */
    getCurrentStatus(): ConcurrencyStatus;
    /**
     * Get active execution count
     */
    getCurrentActive(): number;
    /**
     * Get queue length
     */
    getQueueLength(): number;
    private executeSubAgentTask;
    private simulateSubAgentExecution;
    private generateSimulatedOutput;
    private generateSimulatedFindings;
    private generateSimulatedRecommendations;
    private generateSpecializedMetrics;
    private calculateAverageSeverity;
    private getPriorityMultiplier;
}
interface ConcurrencyConfig {
    maxConcurrent: number;
    adaptiveScaling?: boolean;
}
interface ConcurrencyStatus {
    maxConcurrent: number;
    currentActive: number;
    queueLength: number;
    adaptiveScaling: boolean;
    resourceUtilization: number;
}
export {};
//# sourceMappingURL=ConcurrencyController.d.ts.map