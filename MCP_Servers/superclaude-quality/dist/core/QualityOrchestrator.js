import { ValidationExecutionEngine } from './ValidationExecutionEngine.js';
import { HookIntegrator } from '../hooks/HookIntegrator.js';
import { MetricsCollector } from '../utils/MetricsCollector.js';
import { QualityGateRegistry } from './QualityGateRegistry.js';
import { Logger } from '../utils/Logger.js';
export class QualityOrchestrator {
    gateRegistry;
    executionEngine;
    hookIntegrator;
    metricsCollector;
    logger;
    constructor() {
        this.gateRegistry = new QualityGateRegistry();
        this.executionEngine = new ValidationExecutionEngine();
        this.hookIntegrator = new HookIntegrator();
        this.metricsCollector = new MetricsCollector();
        this.logger = new Logger('QualityOrchestrator');
    }
    async executeQualityPipeline(context) {
        const startTime = Date.now();
        this.logger.info('Starting quality validation pipeline', {
            target: context.target.uri,
            gates: context.gates.map(g => g.name)
        });
        try {
            const validationPlan = await this.buildValidationPlan(context);
            const optimizedPlan = await this.optimizeGateExecution(validationPlan.gates);
            const executionResult = await this.executionEngine.executeValidationPlan({
                ...validationPlan,
                ...optimizedPlan
            });
            const aggregatedResult = await this.aggregateResults(executionResult.gateResults);
            await this.updateQualityTrends(aggregatedResult.metrics);
            const totalTime = Date.now() - startTime;
            this.logger.info('Quality validation pipeline completed', {
                overallResult: aggregatedResult.overallResult,
                totalTime,
                gatesExecuted: context.gates.length,
                issuesFound: aggregatedResult.issues.length
            });
            return {
                ...aggregatedResult,
                performance: {
                    ...aggregatedResult.performance,
                    totalTime
                }
            };
        }
        catch (error) {
            this.logger.error('Quality validation pipeline failed', { error });
            throw error;
        }
    }
    async executeQualityGate(gate, context) {
        const startTime = Date.now();
        this.logger.debug('Executing quality gate', { gate: gate.name, type: gate.type });
        try {
            const result = await gate.validator.validate(context);
            const processingTime = Date.now() - startTime;
            const gateResult = {
                gate: gate.name,
                type: gate.type,
                status: result.status,
                score: result.score,
                issues: result.issues,
                processingTime,
                metadata: result.metadata
            };
            this.logger.debug('Quality gate completed', {
                gate: gate.name,
                status: result.status,
                score: result.score,
                processingTime
            });
            return gateResult;
        }
        catch (error) {
            this.logger.error('Quality gate failed', { gate: gate.name, error });
            return {
                gate: gate.name,
                type: gate.type,
                status: 'failed',
                score: 0,
                issues: [{
                        id: `${gate.name}-error`,
                        severity: 'critical',
                        category: 'syntax',
                        message: `Gate execution failed: ${error instanceof Error ? error.message : String(error)}`,
                        location: { file: '', line: 0, column: 0 },
                        suggestion: 'Check gate configuration and dependencies',
                        autoFixable: false,
                        ruleId: 'gate-execution-error'
                    }],
                processingTime: Date.now() - startTime,
                metadata: {
                    filesAnalyzed: 0,
                    gateDuration: Date.now() - startTime,
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    async validateRealTime(hookContext) {
        const startTime = Date.now();
        this.logger.debug('Starting real-time validation', { hookType: hookContext.hookType });
        try {
            const relevantGates = await this.selectRelevantGates(hookContext);
            const context = {
                target: {
                    type: 'file',
                    uri: hookContext.files[0] || '',
                    files: hookContext.files,
                    excludePatterns: []
                },
                scope: { depth: 'file' },
                gates: relevantGates,
                requirements: {},
                constraints: { timeout: 5000 },
                hookContext
            };
            const results = await Promise.all(relevantGates.map(gate => this.executeQualityGate(gate, context)));
            const issues = results.flatMap(r => r.issues);
            const overallStatus = this.determineOverallStatus(results);
            const recommendations = await this.generateQuickRecommendations(issues);
            return {
                status: overallStatus,
                issues,
                performance: Date.now() - startTime,
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Real-time validation failed', { error });
            return {
                status: 'failed',
                issues: [{
                        id: 'realtime-error',
                        severity: 'critical',
                        category: 'syntax',
                        message: `Real-time validation failed: ${error instanceof Error ? error.message : String(error)}`,
                        location: { file: '', line: 0, column: 0 },
                        suggestion: 'Check validation configuration',
                        autoFixable: false,
                        ruleId: 'realtime-validation-error'
                    }],
                performance: Date.now() - startTime,
                recommendations: []
            };
        }
    }
    async generateQualityReport(results) {
        this.logger.debug('Generating quality report', { resultsCount: results.length });
        const aggregatedMetrics = await this.metricsCollector.aggregateMetrics(results.map(r => r.metrics));
        const allIssues = results.flatMap(r => r.issues);
        const allRecommendations = results.flatMap(r => r.recommendations);
        const gateResults = results.flatMap(r => r.gateResults);
        const performanceData = {
            totalTime: Math.max(...results.map(r => r.performance.totalTime)),
            gateExecutionTimes: this.mergeExecutionTimes(results.map(r => r.performance.gateExecutionTimes)),
            cacheHitRate: this.calculateAverageCacheHitRate(results.map(r => r.performance.cacheHitRate)),
            resourceUsage: this.aggregateResourceUsage(results.map(r => r.performance.resourceUsage))
        };
        return {
            summary: aggregatedMetrics,
            gateResults,
            issues: allIssues,
            recommendations: allRecommendations,
            performance: performanceData,
            timestamp: new Date()
        };
    }
    async getQualityMetrics(target) {
        return await this.metricsCollector.getMetrics(target);
    }
    async buildValidationPlan(context) {
        const gates = context.gates.filter(gate => gate.enabled);
        const dependencies = this.analyzeDependencies(gates);
        const executionOrder = this.calculateExecutionOrder(gates, dependencies);
        const parallelGroups = this.identifyParallelGroups(gates, dependencies);
        const estimatedTime = this.estimateExecutionTime(gates);
        return {
            gates,
            executionOrder,
            parallelGroups,
            estimatedTime,
            dependencies
        };
    }
    async optimizeGateExecution(gates) {
        const optimizations = [];
        let expectedPerformance = 0;
        const optimizedGates = [...gates].sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return a.timeout - b.timeout;
        });
        optimizations.push('Priority-based ordering');
        const fastGates = optimizedGates.filter(g => g.timeout < 1000);
        if (fastGates.length > 0) {
            optimizations.push(`Early execution of ${fastGates.length} fast gates`);
        }
        expectedPerformance = this.estimateExecutionTime(optimizedGates);
        return {
            plan: {
                gates: optimizedGates,
                executionOrder: optimizedGates.map(g => g.name),
                parallelGroups: this.identifyParallelGroups(optimizedGates, {}),
                estimatedTime: expectedPerformance,
                dependencies: this.analyzeDependencies(optimizedGates)
            },
            optimizations,
            expectedPerformance
        };
    }
    async aggregateResults(gateResults) {
        const allIssues = gateResults.flatMap(r => r.issues);
        const overallStatus = this.determineOverallStatus(gateResults);
        const metrics = await this.calculateQualityMetrics(gateResults);
        const recommendations = await this.generateRecommendations(allIssues, metrics);
        const performance = {
            totalTime: Math.max(...gateResults.map(r => r.processingTime)),
            gateExecutionTimes: Object.fromEntries(gateResults.map(r => [r.gate, r.processingTime])),
            cacheHitRate: this.calculateCacheHitRate(gateResults),
            resourceUsage: {
                memory: 0,
                cpu: 0,
                diskIO: 0
            }
        };
        return {
            overallResult: overallStatus,
            gateResults,
            metrics,
            issues: allIssues,
            recommendations,
            performance
        };
    }
    async updateQualityTrends(metrics) {
        await this.metricsCollector.updateTrends(metrics);
    }
    analyzeDependencies(gates) {
        const dependencies = {};
        gates.forEach(gate => {
            dependencies[gate.name] = gate.dependencies;
        });
        return dependencies;
    }
    calculateExecutionOrder(gates, dependencies) {
        const visited = new Set();
        const order = [];
        const visit = (gateName) => {
            if (visited.has(gateName))
                return;
            visited.add(gateName);
            const deps = dependencies[gateName] || [];
            deps.forEach(dep => visit(dep));
            order.push(gateName);
        };
        gates.forEach(gate => visit(gate.name));
        return order;
    }
    identifyParallelGroups(gates, dependencies) {
        const groups = [];
        const processed = new Set();
        for (const gate of gates) {
            if (processed.has(gate.name))
                continue;
            const group = [gate.name];
            processed.add(gate.name);
            for (const otherGate of gates) {
                if (processed.has(otherGate.name))
                    continue;
                const hasConflict = dependencies[gate.name]?.includes(otherGate.name) ||
                    dependencies[otherGate.name]?.includes(gate.name);
                if (!hasConflict) {
                    group.push(otherGate.name);
                    processed.add(otherGate.name);
                }
            }
            groups.push(group);
        }
        return groups;
    }
    estimateExecutionTime(gates) {
        return gates.reduce((total, gate) => total + gate.timeout, 0);
    }
    async selectRelevantGates(hookContext) {
        const allGates = await this.gateRegistry.getAllGates();
        switch (hookContext.hookType) {
            case 'pre':
                return allGates.filter(g => ['syntax', 'semantic'].includes(g.type));
            case 'post':
                return allGates.filter(g => ['lint', 'security'].includes(g.type));
            case 'stop':
                return allGates;
            default:
                return allGates.filter(g => g.priority === 'critical');
        }
    }
    determineOverallStatus(results) {
        if (results.some(r => r.status === 'failed'))
            return 'failed';
        if (results.some(r => r.status === 'warning'))
            return 'warning';
        return 'passed';
    }
    async generateQuickRecommendations(issues) {
        return issues
            .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
            .slice(0, 3)
            .map(issue => ({
            type: 'fix',
            priority: issue.severity,
            description: issue.suggestion,
            actionable: issue.autoFixable,
            estimatedEffort: 'low',
            categories: [issue.category]
        }));
    }
    async calculateQualityMetrics(gateResults) {
        const scoresByType = Object.fromEntries(gateResults.map(r => [r.type, r.score]));
        const overallScore = gateResults.reduce((sum, r) => sum + r.score, 0) / gateResults.length;
        return {
            syntaxScore: scoresByType.syntax || 0,
            semanticScore: scoresByType.semantic || 0,
            typeScore: scoresByType.type || 0,
            securityScore: scoresByType.security || 0,
            performanceScore: scoresByType.performance || 0,
            testCoverage: scoresByType.test || 0,
            documentationScore: scoresByType.documentation || 0,
            overallScore,
            trend: {
                direction: 'stable',
                changePercent: 0,
                historicalAverage: overallScore
            }
        };
    }
    async generateRecommendations(issues, metrics) {
        const recommendations = [];
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push({
                type: 'fix',
                priority: 'critical',
                description: `Address ${criticalIssues.length} critical issues immediately`,
                actionable: true,
                estimatedEffort: 'high',
                categories: [...new Set(criticalIssues.map(i => i.category))]
            });
        }
        if (metrics.securityScore < 70) {
            recommendations.push({
                type: 'security',
                priority: 'high',
                description: 'Security score is below acceptable threshold. Review security practices.',
                actionable: true,
                estimatedEffort: 'medium',
                categories: ['security']
            });
        }
        if (metrics.testCoverage < 80) {
            recommendations.push({
                type: 'improvement',
                priority: 'medium',
                description: 'Test coverage is below 80%. Add more comprehensive tests.',
                actionable: true,
                estimatedEffort: 'medium',
                categories: ['test']
            });
        }
        return recommendations;
    }
    calculateCacheHitRate(gateResults) {
        const cacheHits = gateResults.filter(r => r.metadata.cacheHit).length;
        return gateResults.length > 0 ? (cacheHits / gateResults.length) * 100 : 0;
    }
    mergeExecutionTimes(executionTimes) {
        const merged = {};
        executionTimes.forEach(times => {
            Object.entries(times).forEach(([gate, time]) => {
                merged[gate] = (merged[gate] || 0) + time;
            });
        });
        return merged;
    }
    calculateAverageCacheHitRate(rates) {
        return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
    }
    aggregateResourceUsage(usages) {
        if (usages.length === 0)
            return { memory: 0, cpu: 0, diskIO: 0 };
        return {
            memory: Math.max(...usages.map(u => u.memory)),
            cpu: Math.max(...usages.map(u => u.cpu)),
            diskIO: usages.reduce((sum, u) => sum + u.diskIO, 0)
        };
    }
}
//# sourceMappingURL=QualityOrchestrator.js.map