import { Logger } from './Logger';
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags?: Record<string, string>;
}
export interface PerformanceSnapshot {
    timestamp: Date;
    metrics: PerformanceMetric[];
    summary: {
        totalActivations: number;
        averageActivationTime: number;
        collaborationCount: number;
        chainExecutions: number;
        errorRate: number;
        memoryUsage: number;
        cpuUsage: number;
    };
}
export declare class PerformanceMonitor {
    private logger;
    private metrics;
    private startTime;
    private activationCount;
    private collaborationCount;
    private chainExecutions;
    private errorCount;
    private totalOperations;
    private targets;
    constructor(logger: Logger);
    recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void;
    recordPersonaActivation(persona: string, activationTime: number, confidence: number, success: boolean): void;
    recordCollaboration(personas: string[], mode: string, executionTime: number, conflicts: number, success: boolean): void;
    recordChainExecution(chainId: string, steps: number, executionTime: number, preservationScore: number, success: boolean): void;
    recordAutoActivationAccuracy(persona: string, confidence: number, correct: boolean): void;
    recordMemoryUsage(): void;
    recordCPUUsage(): void;
    getPerformanceSnapshot(): PerformanceSnapshot;
    getMetricStats(metricName: string): {
        count: number;
        average: number;
        min: number;
        max: number;
        latest: number;
    } | null;
    isPerformingWithinTargets(): {
        overall: boolean;
        details: Record<string, {
            value: number;
            target: number;
            within: boolean;
        }>;
    };
    getUptime(): number;
    resetMetrics(): void;
    exportMetrics(): Record<string, any>;
    private startPeriodicMonitoring;
    private checkPerformanceTarget;
    private isSignificantMetric;
    private getMetricValues;
    private getLatestMetricValue;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map