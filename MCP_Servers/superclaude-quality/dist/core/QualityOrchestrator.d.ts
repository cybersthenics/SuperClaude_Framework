import { QualityValidationContext, QualityValidationResult, QualityGate, GateResult, QualityMetrics, ValidationStatus, HookContext, QualityRecommendation, ValidationPerformance, QualityIssue } from '../types/index.js';
export interface ValidationPlan {
    gates: QualityGate[];
    executionOrder: string[];
    parallelGroups: string[][];
    estimatedTime: number;
    dependencies: Record<string, string[]>;
}
export interface OptimizedExecutionPlan {
    plan: ValidationPlan;
    optimizations: string[];
    expectedPerformance: number;
}
export interface QualityReport {
    summary: QualityMetrics;
    gateResults: GateResult[];
    issues: QualityIssue[];
    recommendations: QualityRecommendation[];
    performance: ValidationPerformance;
    timestamp: Date;
}
export interface RealTimeValidationResult {
    status: ValidationStatus;
    issues: QualityIssue[];
    performance: number;
    recommendations: QualityRecommendation[];
}
export declare class QualityOrchestrator {
    private gateRegistry;
    private executionEngine;
    private hookIntegrator;
    private metricsCollector;
    private logger;
    constructor();
    executeQualityPipeline(context: QualityValidationContext): Promise<QualityValidationResult>;
    executeQualityGate(gate: QualityGate, context: QualityValidationContext): Promise<GateResult>;
    validateRealTime(hookContext: HookContext): Promise<RealTimeValidationResult>;
    generateQualityReport(results: QualityValidationResult[]): Promise<QualityReport>;
    getQualityMetrics(target: string): Promise<QualityMetrics>;
    private buildValidationPlan;
    private optimizeGateExecution;
    private aggregateResults;
    private updateQualityTrends;
    private analyzeDependencies;
    private calculateExecutionOrder;
    private identifyParallelGroups;
    private estimateExecutionTime;
    private selectRelevantGates;
    private determineOverallStatus;
    private generateQuickRecommendations;
    private calculateQualityMetrics;
    private generateRecommendations;
    private calculateCacheHitRate;
    private mergeExecutionTimes;
    private calculateAverageCacheHitRate;
    private aggregateResourceUsage;
}
//# sourceMappingURL=QualityOrchestrator.d.ts.map