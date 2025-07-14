export declare class PerformanceMonitor {
    private logger;
    private metrics;
    private startTimes;
    constructor();
    recordMetric(operation: string, duration: number, metadata?: any): Promise<void>;
    startTimer(operation: string): void;
    endTimer(operation: string, metadata?: any): void;
    getMetrics(operation?: string): Promise<PerformanceMetrics>;
    private calculateMetrics;
    private calculatePercentile;
    getHealthStatus(): Promise<HealthStatus>;
    clearMetrics(operation?: string): Promise<void>;
    exportMetrics(): Promise<string>;
}
interface OperationMetrics {
    operation: string;
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    lastExecution: Date;
    percentiles: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
}
interface PerformanceMetrics {
    operations: Record<string, OperationMetrics>;
    totalOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    lastUpdated: Date;
}
interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: PerformanceMetrics;
    checkedAt: Date;
}
export {};
//# sourceMappingURL=PerformanceMonitor.d.ts.map