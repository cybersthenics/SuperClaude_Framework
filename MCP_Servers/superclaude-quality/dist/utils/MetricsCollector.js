import { Logger } from './Logger.js';
export class MetricsCollector {
    storage;
    trendCalculator;
    logger;
    constructor() {
        this.storage = new InMemoryMetricsStorage();
        this.trendCalculator = new SimpleTrendCalculator();
        this.logger = new Logger('MetricsCollector');
    }
    async aggregateMetrics(metricsList) {
        if (metricsList.length === 0) {
            return this.getDefaultMetrics();
        }
        if (metricsList.length === 1) {
            return metricsList[0];
        }
        const aggregated = {
            syntaxScore: this.average(metricsList.map(m => m.syntaxScore)),
            semanticScore: this.average(metricsList.map(m => m.semanticScore)),
            typeScore: this.average(metricsList.map(m => m.typeScore)),
            securityScore: this.average(metricsList.map(m => m.securityScore)),
            performanceScore: this.average(metricsList.map(m => m.performanceScore)),
            testCoverage: this.average(metricsList.map(m => m.testCoverage)),
            documentationScore: this.average(metricsList.map(m => m.documentationScore)),
            overallScore: 0,
            trend: {
                direction: 'stable',
                changePercent: 0,
                historicalAverage: 0
            }
        };
        aggregated.overallScore = this.calculateOverallScore(aggregated);
        aggregated.trend = this.calculateAggregateTrend(metricsList);
        return aggregated;
    }
    async getMetrics(target) {
        const latest = await this.storage.getLatestMetrics(target);
        if (latest) {
            return latest;
        }
        this.logger.warn('No metrics found for target, returning defaults', { target });
        return this.getDefaultMetrics();
    }
    async updateTrends(metrics) {
        const target = 'current-session';
        const historical = await this.storage.getHistoricalMetrics(target, 30);
        const trend = this.trendCalculator.calculateTrend(metrics, historical);
        const updatedMetrics = { ...metrics, trend };
        await this.storage.storeMetrics(target, updatedMetrics);
        this.logger.debug('Updated trends', {
            target,
            overallScore: metrics.overallScore,
            trendDirection: trend.direction,
            changePercent: trend.changePercent
        });
    }
    async getImprovementSuggestions(metrics) {
        const suggestions = [];
        if (metrics.syntaxScore < 90) {
            suggestions.push('Review code syntax and fix parsing errors');
        }
        if (metrics.semanticScore < 80) {
            suggestions.push('Improve semantic consistency and type usage');
        }
        if (metrics.securityScore < 70) {
            suggestions.push('Address security vulnerabilities and implement best practices');
        }
        if (metrics.testCoverage < 80) {
            suggestions.push('Increase test coverage to at least 80%');
        }
        if (metrics.performanceScore < 70) {
            suggestions.push('Optimize performance bottlenecks');
        }
        if (metrics.documentationScore < 60) {
            suggestions.push('Improve code documentation and comments');
        }
        if (metrics.trend.direction === 'declining') {
            suggestions.push('Quality is declining - review recent changes');
        }
        return suggestions;
    }
    async generateSummary(metrics) {
        const target = 'current-session';
        const historical = await this.storage.getHistoricalMetrics(target, 7);
        return {
            current: {
                overallScore: metrics.overallScore,
                grade: this.scoreToGrade(metrics.overallScore),
                trend: metrics.trend.direction
            },
            breakdown: {
                syntax: metrics.syntaxScore,
                semantic: metrics.semanticScore,
                type: metrics.typeScore,
                security: metrics.securityScore,
                performance: metrics.performanceScore,
                testing: metrics.testCoverage,
                documentation: metrics.documentationScore
            },
            trends: {
                weeklyAverage: historical.length > 0
                    ? this.average(historical.map(h => h.overallScore))
                    : metrics.overallScore,
                changeFromAverage: metrics.trend.changePercent,
                direction: metrics.trend.direction
            },
            recommendations: await this.getImprovementSuggestions(metrics)
        };
    }
    average(numbers) {
        if (numbers.length === 0)
            return 0;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    }
    calculateOverallScore(metrics) {
        const weights = {
            syntax: 0.15,
            semantic: 0.15,
            type: 0.10,
            security: 0.20,
            performance: 0.15,
            testing: 0.15,
            documentation: 0.10
        };
        return (metrics.syntaxScore * weights.syntax +
            metrics.semanticScore * weights.semantic +
            metrics.typeScore * weights.type +
            metrics.securityScore * weights.security +
            metrics.performanceScore * weights.performance +
            metrics.testCoverage * weights.testing +
            metrics.documentationScore * weights.documentation);
    }
    calculateAggregateTrend(metricsList) {
        if (metricsList.length < 2) {
            return {
                direction: 'stable',
                changePercent: 0,
                historicalAverage: metricsList[0]?.overallScore || 0
            };
        }
        const scores = metricsList.map(m => m.overallScore);
        const latest = scores[scores.length - 1];
        const previous = scores[scores.length - 2];
        const average = this.average(scores);
        const changePercent = ((latest - previous) / previous) * 100;
        let direction = 'stable';
        if (Math.abs(changePercent) > 5) {
            direction = changePercent > 0 ? 'improving' : 'declining';
        }
        return {
            direction,
            changePercent,
            historicalAverage: average
        };
    }
    getDefaultMetrics() {
        return {
            syntaxScore: 100,
            semanticScore: 100,
            typeScore: 100,
            securityScore: 100,
            performanceScore: 100,
            testCoverage: 0,
            documentationScore: 50,
            overallScore: 85,
            trend: {
                direction: 'stable',
                changePercent: 0,
                historicalAverage: 85
            }
        };
    }
    scoreToGrade(score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        return 'F';
    }
}
class InMemoryMetricsStorage {
    metrics = new Map();
    async storeMetrics(target, metrics) {
        const existing = this.metrics.get(target) || [];
        existing.push(metrics);
        if (existing.length > 100) {
            existing.splice(0, existing.length - 100);
        }
        this.metrics.set(target, existing);
    }
    async getHistoricalMetrics(target, days = 30) {
        const existing = this.metrics.get(target) || [];
        return existing.slice(-days);
    }
    async getLatestMetrics(target) {
        const existing = this.metrics.get(target) || [];
        return existing.length > 0 ? existing[existing.length - 1] : null;
    }
}
class SimpleTrendCalculator {
    calculateTrend(current, historical) {
        if (historical.length === 0) {
            return {
                direction: 'stable',
                changePercent: 0,
                historicalAverage: current.overallScore
            };
        }
        const historicalAverage = historical.reduce((sum, m) => sum + m.overallScore, 0) / historical.length;
        const changePercent = ((current.overallScore - historicalAverage) / historicalAverage) * 100;
        let direction = 'stable';
        if (Math.abs(changePercent) > 5) {
            direction = changePercent > 0 ? 'improving' : 'declining';
        }
        return {
            direction,
            changePercent,
            historicalAverage
        };
    }
    detectAnomalies(metrics, baseline) {
        const threshold = 20;
        const deviations = [
            Math.abs(metrics.syntaxScore - baseline.syntaxScore),
            Math.abs(metrics.semanticScore - baseline.semanticScore),
            Math.abs(metrics.securityScore - baseline.securityScore),
            Math.abs(metrics.performanceScore - baseline.performanceScore)
        ];
        return deviations.some(deviation => deviation > threshold);
    }
    predictNextScore(historical) {
        if (historical.length < 3) {
            return historical[historical.length - 1]?.overallScore || 0;
        }
        const scores = historical.map(m => m.overallScore);
        const n = scores.length;
        const recent = scores.slice(-3);
        const trend = (recent[2] - recent[0]) / 2;
        return Math.max(0, Math.min(100, scores[n - 1] + trend));
    }
}
//# sourceMappingURL=MetricsCollector.js.map