/**
 * Performance Tracker - Monitors and records performance metrics across orchestration patterns
 */
import { ResourceUsage } from '../types/index.js';
export declare class PerformanceTracker {
    private waveMetrics;
    private delegationMetrics;
    private loopMetrics;
    private chainMetrics;
    private systemMetrics;
    private performanceThresholds;
    constructor();
    /**
     * Record wave orchestration performance
     */
    recordWaveCoordination(waveId: string, coordinationTime: number): void;
    /**
     * Record delegation performance
     */
    recordDelegationPerformance(delegationId: string, subAgentCount: number, executionTime: number, efficiency: number): void;
    /**
     * Record loop iteration performance
     */
    recordLoopIteration(loopId: string, iteration: number, coordinationTime: number, convergenceProgress: number): void;
    /**
     * Record chain handoff performance
     */
    recordChainHandoff(chainId: string, step: number, handoffTime: number, contextSize: number, fidelity: number): void;
    /**
     * Record loop completion performance
     */
    recordLoopCompletion(loopId: string, iterations: number, totalTime: number, finalQuality: number): void;
    /**
     * Record chain completion performance
     */
    recordChainCompletion(chainId: string, linkCount: number, totalTime: number, finalQuality: number): void;
    /**
     * Record system-wide performance metrics
     */
    recordSystemMetrics(resourceUsage: ResourceUsage, activeExecutions: number): void;
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport(): PerformanceReport;
    /**
     * Get performance trends over time
     */
    getPerformanceTrends(timeWindow?: number): PerformanceTrends;
    /**
     * Check if performance targets are being met
     */
    checkPerformanceTargets(): PerformanceTargetStatus;
    private calculateOverallPressure;
    private analyzeWaveMetrics;
    private analyzeDelegationMetrics;
    private analyzeLoopMetrics;
    private analyzeChainMetrics;
    private analyzeSystemMetrics;
    private calculateOverallScore;
    private generateRecommendations;
    private calculateTrend;
}
interface PerformanceReport {
    timestamp: Date;
    waveMetrics: WaveMetricsAnalysis;
    delegationMetrics: DelegationMetricsAnalysis;
    loopMetrics: LoopMetricsAnalysis;
    chainMetrics: ChainMetricsAnalysis;
    systemMetrics: SystemMetricsAnalysis;
    overallScore: number;
    recommendations: string[];
}
interface WaveMetricsAnalysis {
    totalWaves: number;
    averageCoordinationTime: number;
    thresholdExceededCount: number;
    thresholdExceededRate: number;
}
interface DelegationMetricsAnalysis {
    totalDelegations: number;
    averageEfficiency: number;
    averageSubAgentCount: number;
    timeSavingsAchievedRate: number;
}
interface LoopMetricsAnalysis {
    totalLoops: number;
    averageIterations: number;
    averageCoordinationTime: number;
    averageConvergenceRate: number;
}
interface ChainMetricsAnalysis {
    totalChains: number;
    averageSteps: number;
    averageHandoffTime: number;
    averageContextFidelity: number;
}
interface SystemMetricsAnalysis {
    sampleCount: number;
    averageMemoryPressure: number;
    averageCpuPressure: number;
    averageOverallPressure: number;
    peakOverallPressure: number;
}
interface PerformanceTrends {
    timeWindow: number;
    sampleCount: number;
    memoryTrend: 'improving' | 'stable' | 'degrading';
    cpuTrend: 'improving' | 'stable' | 'degrading';
    waveCoordinationTrend: 'improving' | 'stable' | 'degrading';
    delegationEfficiencyTrend: 'improving' | 'stable' | 'degrading';
    overallTrend: 'improving' | 'stable' | 'degrading';
}
interface PerformanceTargetStatus {
    allTargetsMet: boolean;
    waveCoordinationTarget: boolean;
    delegationEfficiencyTarget: boolean;
    systemResourceTarget: boolean;
    details: {
        waveAvgCoordination: number;
        delegationAvgEfficiency: number;
        systemAvgPressure: number;
    };
}
export {};
//# sourceMappingURL=PerformanceTracker.d.ts.map