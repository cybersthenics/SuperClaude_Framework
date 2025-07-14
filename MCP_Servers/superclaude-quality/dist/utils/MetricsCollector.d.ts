import { QualityMetrics, QualityTrend } from '../types/index.js';
export interface MetricsStorage {
    storeMetrics(target: string, metrics: QualityMetrics): Promise<void>;
    getHistoricalMetrics(target: string, days?: number): Promise<QualityMetrics[]>;
    getLatestMetrics(target: string): Promise<QualityMetrics | null>;
}
export interface TrendCalculation {
    calculateTrend(current: QualityMetrics, historical: QualityMetrics[]): QualityTrend;
    detectAnomalies(metrics: QualityMetrics, baseline: QualityMetrics): boolean;
    predictNextScore(historical: QualityMetrics[]): number;
}
export declare class MetricsCollector {
    private storage;
    private trendCalculator;
    private logger;
    constructor();
    aggregateMetrics(metricsList: QualityMetrics[]): Promise<QualityMetrics>;
    getMetrics(target: string): Promise<QualityMetrics>;
    updateTrends(metrics: QualityMetrics): Promise<void>;
    getImprovementSuggestions(metrics: QualityMetrics): Promise<string[]>;
    generateSummary(metrics: QualityMetrics): Promise<Record<string, any>>;
    private average;
    private calculateOverallScore;
    private calculateAggregateTrend;
    private getDefaultMetrics;
    private scoreToGrade;
}
//# sourceMappingURL=MetricsCollector.d.ts.map