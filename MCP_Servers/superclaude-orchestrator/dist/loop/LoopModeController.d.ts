/**
 * Loop Mode Controller - Iterative refinement and progressive enhancement
 * Supports convergence detection, quality gates, and adaptive iteration strategies
 */
import { LoopConfiguration, LoopExecution, LoopIteration, LoopResult, QualityGate, ExecutionContext } from '../types/index.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';
import { ContextPreserver } from '../shared/ContextPreserver.js';
export declare class LoopModeController {
    private performanceTracker;
    private contextPreserver;
    private activeLoops;
    private convergenceThresholds;
    private qualityGates;
    constructor(performanceTracker: PerformanceTracker, contextPreserver: ContextPreserver);
    /**
     * Start a new loop execution with specified configuration
     */
    startLoop(configuration: LoopConfiguration, initialContext: ExecutionContext): Promise<string>;
    /**
     * Execute the next iteration in a loop
     */
    executeIteration(loopId: string, iterationInput?: any): Promise<LoopIteration>;
    /**
     * Get current loop status and progress
     */
    getLoopStatus(loopId: string): LoopExecution | null;
    /**
     * Complete a loop execution
     */
    completeLoop(execution: LoopExecution): Promise<LoopResult>;
    /**
     * Cancel a running loop
     */
    cancelLoop(loopId: string): Promise<void>;
    /**
     * Configure convergence detection parameters
     */
    configureConvergence(metric: string, threshold: number, strategy: 'improvement_rate' | 'quality_plateau' | 'custom'): void;
    /**
     * Add custom quality gate
     */
    addQualityGate(gate: QualityGate): void;
    /**
     * Get loop execution statistics
     */
    getLoopStatistics(): LoopStatistics;
    private initializeDefaultConfiguration;
    private executeIterationByMode;
    private executePolishIteration;
    private executeRefineIteration;
    private executeEnhanceIteration;
    private executeConvergeIteration;
    private runQualityGates;
    private evaluateQualityGate;
    private updateConvergenceMetrics;
    private evaluateContinuation;
    private initializeConvergenceMetrics;
    private getPreviousQualityScore;
    private calculateStability;
    private calculateTrend;
    private calculateVariance;
    private calculateConvergenceConfidence;
    private hasConverged;
    private hasReachedQualityPlateau;
    private hasStagnated;
    private calculateFinalQualityScore;
    private calculateTotalImprovement;
    private calculateAverageIterationTime;
    private calculateAverageQualityImprovement;
    private simulateIterationWork;
    private generateLoopId;
}
interface LoopStatistics {
    activeLoops: number;
    completedLoops: number;
    cancelledLoops: number;
    failedLoops: number;
    averageIterations: number;
    averageQualityImprovement: number;
    convergenceRate: number;
}
export {};
//# sourceMappingURL=LoopModeController.d.ts.map