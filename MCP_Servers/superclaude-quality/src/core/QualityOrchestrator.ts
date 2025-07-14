/**
 * SuperClaude Quality Orchestrator
 * Coordinates the entire 11-step quality validation pipeline
 */

import {
  QualityValidationContext,
  QualityValidationResult,
  QualityGate,
  GateResult,
  QualityMetrics,
  ValidationStatus,
  HookContext,
  QualityRecommendation,
  ValidationPerformance,
  QualityIssue
} from '../types/index.js';

import { ValidationExecutionEngine } from './ValidationExecutionEngine.js';
import { HookIntegrator } from '../hooks/HookIntegrator.js';
import { MetricsCollector } from '../utils/MetricsCollector.js';
import { QualityGateRegistry } from './QualityGateRegistry.js';
import { Logger } from '../utils/Logger.js';

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

export class QualityOrchestrator {
  private gateRegistry: QualityGateRegistry;
  private executionEngine: ValidationExecutionEngine;
  private hookIntegrator: HookIntegrator;
  private metricsCollector: MetricsCollector;
  private logger: Logger;

  constructor() {
    this.gateRegistry = new QualityGateRegistry();
    this.executionEngine = new ValidationExecutionEngine();
    this.hookIntegrator = new HookIntegrator();
    this.metricsCollector = new MetricsCollector();
    this.logger = new Logger('QualityOrchestrator');
  }

  /**
   * Execute the complete 11-step quality validation pipeline
   */
  async executeQualityPipeline(context: QualityValidationContext): Promise<QualityValidationResult> {
    const startTime = Date.now();
    this.logger.info('Starting quality validation pipeline', { 
      target: context.target.uri,
      gates: context.gates.map(g => g.name)
    });

    try {
      // Build validation plan
      const validationPlan = await this.buildValidationPlan(context);
      
      // Optimize gate execution order
      const optimizedPlan = await this.optimizeGateExecution(validationPlan.gates);
      
      // Execute validation plan
      const executionResult = await this.executionEngine.executeValidationPlan({
        ...validationPlan,
        ...optimizedPlan
      });
      
      // Aggregate results
      const aggregatedResult = await this.aggregateResults(executionResult.gateResults);
      
      // Update quality trends
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

    } catch (error) {
      this.logger.error('Quality validation pipeline failed', { error });
      throw error;
    }
  }

  /**
   * Execute a single quality gate
   */
  async executeQualityGate(gate: QualityGate, context: QualityValidationContext): Promise<GateResult> {
    const startTime = Date.now();
    this.logger.debug('Executing quality gate', { gate: gate.name, type: gate.type });

    try {
      const result = await gate.validator.validate(context);
      const processingTime = Date.now() - startTime;

      const gateResult: GateResult = {
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

    } catch (error) {
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

  /**
   * Validate in real-time based on hook context
   */
  async validateRealTime(hookContext: HookContext): Promise<RealTimeValidationResult> {
    const startTime = Date.now();
    this.logger.debug('Starting real-time validation', { hookType: hookContext.hookType });

    try {
      // Determine which gates to run based on hook context
      const relevantGates = await this.selectRelevantGates(hookContext);
      
      // Create lightweight validation context
      const context: QualityValidationContext = {
        target: {
          type: 'file',
          uri: hookContext.files[0] || '',
          files: hookContext.files,
          excludePatterns: []
        },
        scope: { depth: 'file' },
        gates: relevantGates,
        requirements: {},
        constraints: { timeout: 5000 }, // 5 second timeout for real-time
        hookContext
      };

      // Execute fast validation
      const results = await Promise.all(
        relevantGates.map(gate => this.executeQualityGate(gate, context))
      );

      const issues = results.flatMap(r => r.issues);
      const overallStatus = this.determineOverallStatus(results);
      const recommendations = await this.generateQuickRecommendations(issues);

      return {
        status: overallStatus,
        issues,
        performance: Date.now() - startTime,
        recommendations
      };

    } catch (error) {
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

  /**
   * Generate comprehensive quality report
   */
  async generateQualityReport(results: QualityValidationResult[]): Promise<QualityReport> {
    this.logger.debug('Generating quality report', { resultsCount: results.length });

    const aggregatedMetrics = await this.metricsCollector.aggregateMetrics(
      results.map(r => r.metrics)
    );

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

  /**
   * Get current quality metrics for a target
   */
  async getQualityMetrics(target: string): Promise<QualityMetrics> {
    return await this.metricsCollector.getMetrics(target);
  }

  /**
   * Build validation plan based on context
   */
  private async buildValidationPlan(context: QualityValidationContext): Promise<ValidationPlan> {
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

  /**
   * Optimize gate execution order for performance
   */
  private async optimizeGateExecution(gates: QualityGate[]): Promise<OptimizedExecutionPlan> {
    const optimizations: string[] = [];
    let expectedPerformance = 0;

    // Sort by priority and estimated execution time
    const optimizedGates = [...gates].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timeout - b.timeout;
    });

    optimizations.push('Priority-based ordering');

    // Identify fast gates that can run early
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

  /**
   * Aggregate results from multiple gate executions
   */
  private async aggregateResults(gateResults: GateResult[]): Promise<QualityValidationResult> {
    const allIssues = gateResults.flatMap(r => r.issues);
    const overallStatus = this.determineOverallStatus(gateResults);
    
    const metrics = await this.calculateQualityMetrics(gateResults);
    const recommendations = await this.generateRecommendations(allIssues, metrics);
    
    const performance: ValidationPerformance = {
      totalTime: Math.max(...gateResults.map(r => r.processingTime)),
      gateExecutionTimes: Object.fromEntries(
        gateResults.map(r => [r.gate, r.processingTime])
      ),
      cacheHitRate: this.calculateCacheHitRate(gateResults),
      resourceUsage: {
        memory: 0, // Would be calculated from actual measurements
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

  /**
   * Update quality trend metrics
   */
  private async updateQualityTrends(metrics: QualityMetrics): Promise<void> {
    await this.metricsCollector.updateTrends(metrics);
  }

  /**
   * Helper methods
   */
  private analyzeDependencies(gates: QualityGate[]): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {};
    gates.forEach(gate => {
      dependencies[gate.name] = gate.dependencies;
    });
    return dependencies;
  }

  private calculateExecutionOrder(gates: QualityGate[], dependencies: Record<string, string[]>): string[] {
    // Topological sort based on dependencies
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (gateName: string) => {
      if (visited.has(gateName)) return;
      visited.add(gateName);

      const deps = dependencies[gateName] || [];
      deps.forEach(dep => visit(dep));
      order.push(gateName);
    };

    gates.forEach(gate => visit(gate.name));
    return order;
  }

  private identifyParallelGroups(gates: QualityGate[], dependencies: Record<string, string[]>): string[][] {
    // Group gates that can run in parallel (no dependencies between them)
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const gate of gates) {
      if (processed.has(gate.name)) continue;

      const group = [gate.name];
      processed.add(gate.name);

      // Find other gates that can run in parallel
      for (const otherGate of gates) {
        if (processed.has(otherGate.name)) continue;
        
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

  private estimateExecutionTime(gates: QualityGate[]): number {
    return gates.reduce((total, gate) => total + gate.timeout, 0);
  }

  private async selectRelevantGates(hookContext: HookContext): Promise<QualityGate[]> {
    // Select gates based on hook type and operation
    const allGates = await this.gateRegistry.getAllGates();
    
    switch (hookContext.hookType) {
      case 'pre':
        return allGates.filter(g => ['syntax', 'semantic'].includes(g.type));
      case 'post':
        return allGates.filter(g => ['lint', 'security'].includes(g.type));
      case 'stop':
        return allGates; // Full validation at session end
      default:
        return allGates.filter(g => g.priority === 'critical');
    }
  }

  private determineOverallStatus(results: GateResult[]): ValidationStatus {
    if (results.some(r => r.status === 'failed')) return 'failed';
    if (results.some(r => r.status === 'warning')) return 'warning';
    return 'passed';
  }

  private async generateQuickRecommendations(issues: QualityIssue[]): Promise<QualityRecommendation[]> {
    // Generate immediate recommendations for real-time validation
    return issues
      .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
      .slice(0, 3) // Limit for real-time performance
      .map(issue => ({
        type: 'fix' as const,
        priority: issue.severity as any,
        description: issue.suggestion,
        actionable: issue.autoFixable,
        estimatedEffort: 'low' as const,
        categories: [issue.category]
      }));
  }

  private async calculateQualityMetrics(gateResults: GateResult[]): Promise<QualityMetrics> {
    const scoresByType = Object.fromEntries(
      gateResults.map(r => [r.type, r.score])
    );

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

  private async generateRecommendations(issues: QualityIssue[], metrics: QualityMetrics): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = [];

    // Generate recommendations based on issues and metrics
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

    // Low scores recommendations
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

  private calculateCacheHitRate(gateResults: GateResult[]): number {
    const cacheHits = gateResults.filter(r => r.metadata.cacheHit).length;
    return gateResults.length > 0 ? (cacheHits / gateResults.length) * 100 : 0;
  }

  private mergeExecutionTimes(executionTimes: Record<string, number>[]): Record<string, number> {
    const merged: Record<string, number> = {};
    executionTimes.forEach(times => {
      Object.entries(times).forEach(([gate, time]) => {
        merged[gate] = (merged[gate] || 0) + time;
      });
    });
    return merged;
  }

  private calculateAverageCacheHitRate(rates: number[]): number {
    return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  }

  private aggregateResourceUsage(usages: any[]): any {
    if (usages.length === 0) return { memory: 0, cpu: 0, diskIO: 0 };
    
    return {
      memory: Math.max(...usages.map(u => u.memory)),
      cpu: Math.max(...usages.map(u => u.cpu)),
      diskIO: usages.reduce((sum, u) => sum + u.diskIO, 0)
    };
  }
}