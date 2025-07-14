// SuperClaude Personas - PerformanceMonitor
// Performance monitoring and metrics collection

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

export class PerformanceMonitor {
  private logger: Logger;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private startTime: Date = new Date();
  private activationCount: number = 0;
  private collaborationCount: number = 0;
  private chainExecutions: number = 0;
  private errorCount: number = 0;
  private totalOperations: number = 0;

  // Performance targets from plan
  private targets = {
    personaActivation: 50, // ms
    recommendationGeneration: 100, // ms
    behaviorApplication: 30, // ms
    collaborationCoordination: 200, // ms
    chainModeHandoff: 75, // ms
    priorityResolution: 10, // ms
    contextPreservation: 0.95, // ratio
    autoActivationAccuracy: 0.95, // ratio
    memoryUsage: 200 * 1024 * 1024, // 200MB
    cpuUsage: 0.5 // 50%
  };

  constructor(logger: Logger) {
    this.logger = logger.createChildLogger('PerformanceMonitor');
    
    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 1000 entries per metric
    if (metricHistory.length > 1000) {
      metricHistory.splice(0, metricHistory.length - 1000);
    }

    // Check against targets
    this.checkPerformanceTarget(name, value);

    // Log significant metrics
    if (this.isSignificantMetric(name)) {
      this.logger.logPerformance(name, value, { unit, tags });
    }
  }

  /**
   * Record persona activation metrics
   */
  recordPersonaActivation(
    persona: string,
    activationTime: number,
    confidence: number,
    success: boolean
  ): void {
    this.activationCount++;
    this.totalOperations++;
    
    if (!success) {
      this.errorCount++;
    }

    this.recordMetric('persona_activation_time', activationTime, 'ms', { persona });
    this.recordMetric('persona_activation_confidence', confidence, 'ratio', { persona });
    this.recordMetric('persona_activation_success', success ? 1 : 0, 'boolean', { persona });

    // Check activation time target
    if (activationTime > this.targets.personaActivation) {
      this.logger.warn(`Persona activation time exceeded target`, {
        persona,
        activationTime,
        target: this.targets.personaActivation,
        overage: activationTime - this.targets.personaActivation
      });
    }
  }

  /**
   * Record collaboration metrics
   */
  recordCollaboration(
    personas: string[],
    mode: string,
    executionTime: number,
    conflicts: number,
    success: boolean
  ): void {
    this.collaborationCount++;
    this.totalOperations++;
    
    if (!success) {
      this.errorCount++;
    }

    this.recordMetric('collaboration_time', executionTime, 'ms', { 
      mode, 
      personas: personas.join(','),
      persona_count: personas.length.toString()
    });
    this.recordMetric('collaboration_conflicts', conflicts, 'count', { mode });
    this.recordMetric('collaboration_success', success ? 1 : 0, 'boolean', { mode });

    // Check collaboration time target
    if (executionTime > this.targets.collaborationCoordination) {
      this.logger.warn(`Collaboration time exceeded target`, {
        personas,
        mode,
        executionTime,
        target: this.targets.collaborationCoordination,
        overage: executionTime - this.targets.collaborationCoordination
      });
    }
  }

  /**
   * Record chain execution metrics
   */
  recordChainExecution(
    chainId: string,
    steps: number,
    executionTime: number,
    preservationScore: number,
    success: boolean
  ): void {
    this.chainExecutions++;
    this.totalOperations++;
    
    if (!success) {
      this.errorCount++;
    }

    this.recordMetric('chain_execution_time', executionTime, 'ms', { 
      chainId,
      steps: steps.toString()
    });
    this.recordMetric('chain_preservation_score', preservationScore, 'ratio', { chainId });
    this.recordMetric('chain_execution_success', success ? 1 : 0, 'boolean', { chainId });

    // Check preservation score target
    if (preservationScore < this.targets.contextPreservation) {
      this.logger.warn(`Context preservation below target`, {
        chainId,
        preservationScore,
        target: this.targets.contextPreservation,
        shortfall: this.targets.contextPreservation - preservationScore
      });
    }
  }

  /**
   * Record auto-activation accuracy
   */
  recordAutoActivationAccuracy(
    persona: string,
    confidence: number,
    correct: boolean
  ): void {
    this.recordMetric('auto_activation_accuracy', correct ? 1 : 0, 'boolean', { persona });
    this.recordMetric('auto_activation_confidence', confidence, 'ratio', { persona });
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    
    this.recordMetric('memory_heap_used', memoryUsage.heapUsed, 'bytes');
    this.recordMetric('memory_heap_total', memoryUsage.heapTotal, 'bytes');
    this.recordMetric('memory_external', memoryUsage.external, 'bytes');
    this.recordMetric('memory_rss', memoryUsage.rss, 'bytes');

    // Check memory usage target
    if (memoryUsage.heapUsed > this.targets.memoryUsage) {
      this.logger.warn(`Memory usage exceeded target`, {
        heapUsed: memoryUsage.heapUsed,
        target: this.targets.memoryUsage,
        overage: memoryUsage.heapUsed - this.targets.memoryUsage
      });
    }
  }

  /**
   * Record CPU usage
   */
  recordCPUUsage(): void {
    const cpuUsage = process.cpuUsage();
    const totalCPU = cpuUsage.user + cpuUsage.system;
    
    this.recordMetric('cpu_user', cpuUsage.user, 'microseconds');
    this.recordMetric('cpu_system', cpuUsage.system, 'microseconds');
    this.recordMetric('cpu_total', totalCPU, 'microseconds');
  }

  /**
   * Get performance snapshot
   */
  getPerformanceSnapshot(): PerformanceSnapshot {
    const currentTime = new Date();
    const allMetrics: PerformanceMetric[] = [];
    
    // Collect all metrics
    for (const metricHistory of this.metrics.values()) {
      allMetrics.push(...metricHistory);
    }

    // Calculate averages
    const activationTimes = this.getMetricValues('persona_activation_time');
    const averageActivationTime = activationTimes.length > 0 
      ? activationTimes.reduce((sum, val) => sum + val, 0) / activationTimes.length 
      : 0;

    const memoryUsage = this.getLatestMetricValue('memory_heap_used') || 0;
    const cpuUsage = this.getLatestMetricValue('cpu_total') || 0;

    return {
      timestamp: currentTime,
      metrics: allMetrics.slice(-100), // Last 100 metrics
      summary: {
        totalActivations: this.activationCount,
        averageActivationTime,
        collaborationCount: this.collaborationCount,
        chainExecutions: this.chainExecutions,
        errorRate: this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0,
        memoryUsage,
        cpuUsage
      }
    };
  }

  /**
   * Get metric statistics
   */
  getMetricStats(metricName: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }

  /**
   * Check if system is performing within targets
   */
  isPerformingWithinTargets(): {
    overall: boolean;
    details: Record<string, { value: number; target: number; within: boolean }>;
  } {
    const details: Record<string, { value: number; target: number; within: boolean }> = {};
    let allWithinTargets = true;

    // Check activation time
    const avgActivationTime = this.getMetricStats('persona_activation_time')?.average || 0;
    details.activationTime = {
      value: avgActivationTime,
      target: this.targets.personaActivation,
      within: avgActivationTime <= this.targets.personaActivation
    };
    allWithinTargets = allWithinTargets && details.activationTime.within;

    // Check collaboration time
    const avgCollaborationTime = this.getMetricStats('collaboration_time')?.average || 0;
    details.collaborationTime = {
      value: avgCollaborationTime,
      target: this.targets.collaborationCoordination,
      within: avgCollaborationTime <= this.targets.collaborationCoordination
    };
    allWithinTargets = allWithinTargets && details.collaborationTime.within;

    // Check memory usage
    const currentMemory = this.getLatestMetricValue('memory_heap_used') || 0;
    details.memoryUsage = {
      value: currentMemory,
      target: this.targets.memoryUsage,
      within: currentMemory <= this.targets.memoryUsage
    };
    allWithinTargets = allWithinTargets && details.memoryUsage.within;

    // Check context preservation
    const avgPreservation = this.getMetricStats('chain_preservation_score')?.average || 1;
    details.contextPreservation = {
      value: avgPreservation,
      target: this.targets.contextPreservation,
      within: avgPreservation >= this.targets.contextPreservation
    };
    allWithinTargets = allWithinTargets && details.contextPreservation.within;

    return { overall: allWithinTargets, details };
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return (Date.now() - this.startTime.getTime()) / 1000;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.activationCount = 0;
    this.collaborationCount = 0;
    this.chainExecutions = 0;
    this.errorCount = 0;
    this.totalOperations = 0;
    this.startTime = new Date();
    
    this.logger.info('Performance metrics reset');
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): Record<string, any> {
    const snapshot = this.getPerformanceSnapshot();
    const performance = this.isPerformingWithinTargets();
    
    return {
      timestamp: snapshot.timestamp,
      uptime: this.getUptime(),
      summary: snapshot.summary,
      performance: performance.overall,
      targets: this.targets,
      details: performance.details
    };
  }

  // Private methods

  private startPeriodicMonitoring(): void {
    // Monitor system resources every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage();
      this.recordCPUUsage();
    }, 30000);

    // Log performance summary every 5 minutes
    setInterval(() => {
      const snapshot = this.getPerformanceSnapshot();
      this.logger.logSystemHealth('PersonasServer', 'monitoring', snapshot.summary);
    }, 300000);
  }

  private checkPerformanceTarget(metricName: string, value: number): void {
    const targetMap: Record<string, number> = {
      'persona_activation_time': this.targets.personaActivation,
      'collaboration_time': this.targets.collaborationCoordination,
      'chain_execution_time': this.targets.chainModeHandoff,
      'memory_heap_used': this.targets.memoryUsage,
      'chain_preservation_score': this.targets.contextPreservation
    };

    const target = targetMap[metricName];
    if (target !== undefined) {
      const exceedsTarget = metricName === 'chain_preservation_score' 
        ? value < target  // Preservation score should be above target
        : value > target; // Other metrics should be below target

      if (exceedsTarget) {
        this.logger.warn(`Performance target exceeded`, {
          metric: metricName,
          value,
          target,
          difference: Math.abs(value - target)
        });
      }
    }
  }

  private isSignificantMetric(metricName: string): boolean {
    const significantMetrics = [
      'persona_activation_time',
      'collaboration_time',
      'chain_execution_time',
      'chain_preservation_score',
      'memory_heap_used'
    ];
    
    return significantMetrics.includes(metricName);
  }

  private getMetricValues(metricName: string): number[] {
    const metrics = this.metrics.get(metricName);
    return metrics ? metrics.map(m => m.value) : [];
  }

  private getLatestMetricValue(metricName: string): number | null {
    const metrics = this.metrics.get(metricName);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1].value : null;
  }
}