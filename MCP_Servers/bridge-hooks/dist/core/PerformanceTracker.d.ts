import { PerformanceMetrics } from '../types/index.js';
interface PerformanceConfig {
    targetAverageTime: number;
    targetOptimizationFactor: number;
}
interface OperationMetrics {
    totalExecutions: number;
    totalTime: number;
    totalOptimization: number;
    errors: number;
    averageTime: number;
    averageOptimization: number;
    errorRate: number;
}
export declare class PerformanceTracker {
    private config;
    private activeTimers;
    private operationMetrics;
    private recentExecutions;
    private readonly maxRecentExecutions;
    constructor(config: PerformanceConfig);
    startTimer(operation: string): string;
    endTimer(timerId: string): Promise<PerformanceMetrics>;
    getMetrics(operation?: string): Promise<PerformanceMetrics>;
    getOverallMetrics(): Promise<PerformanceMetrics>;
    getOptimizationFactor(): Promise<number>;
    getOperationStatistics(): Map<string, OperationMetrics>;
    resetMetrics(operation?: string): void;
    isPerformingWithinBudget(operation: string): boolean;
    getPerformanceReport(): {
        overall: PerformanceMetrics;
        byOperation: Record<string, OperationMetrics>;
        systemHealth: {
            withinBudget: boolean;
            optimizationTarget: boolean;
            reliabilityTarget: boolean;
        };
    };
    private calculateOptimizationFactor;
    private updateOperationMetrics;
    private calculateRequestsPerSecond;
    private cleanupRecentExecutions;
    private getCurrentMemoryUsage;
    private getCurrentCPUUsage;
    private getDefaultMetrics;
    private startPeriodicCleanup;
}
export {};
//# sourceMappingURL=PerformanceTracker.d.ts.map