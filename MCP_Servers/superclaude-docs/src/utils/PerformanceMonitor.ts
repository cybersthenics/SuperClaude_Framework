import { Logger } from './Logger.js';

export class PerformanceMonitor {
  private logger: Logger;
  private metrics: Map<string, PerformanceMetric[]>;
  private startTimes: Map<string, number>;

  constructor() {
    this.logger = new Logger('PerformanceMonitor');
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  async recordMetric(operation: string, duration: number, metadata?: any): Promise<void> {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata: metadata || {}
    };

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    this.metrics.get(operation)!.push(metric);
    
    // Keep only last 1000 metrics per operation
    const operationMetrics = this.metrics.get(operation)!;
    if (operationMetrics.length > 1000) {
      operationMetrics.shift();
    }

    this.logger.debug('Performance metric recorded', {
      operation,
      duration,
      metadata
    });
  }

  startTimer(operation: string): void {
    this.startTimes.set(operation, Date.now());
  }

  endTimer(operation: string, metadata?: any): void {
    const startTime = this.startTimes.get(operation);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, metadata);
      this.startTimes.delete(operation);
    }
  }

  async getMetrics(operation?: string): Promise<PerformanceMetrics> {
    if (operation) {
      const operationMetrics = this.metrics.get(operation) || [];
      return this.calculateMetrics(operation, operationMetrics);
    }

    const allMetrics: PerformanceMetrics = {
      operations: {},
      totalOperations: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      lastUpdated: new Date()
    };

    for (const [op, metrics] of this.metrics.entries()) {
      allMetrics.operations[op] = this.calculateMetrics(op, metrics);
      allMetrics.totalOperations += metrics.length;
    }

    if (allMetrics.totalOperations > 0) {
      let totalDuration = 0;
      let minDuration = Infinity;
      let maxDuration = 0;

      for (const metrics of this.metrics.values()) {
        for (const metric of metrics) {
          totalDuration += metric.duration;
          minDuration = Math.min(minDuration, metric.duration);
          maxDuration = Math.max(maxDuration, metric.duration);
        }
      }

      allMetrics.averageDuration = totalDuration / allMetrics.totalOperations;
      allMetrics.minDuration = minDuration === Infinity ? 0 : minDuration;
      allMetrics.maxDuration = maxDuration;
    }

    return allMetrics;
  }

  private calculateMetrics(operation: string, metrics: PerformanceMetric[]): OperationMetrics {
    if (metrics.length === 0) {
      return {
        operation,
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        lastExecution: new Date(),
        percentiles: {
          p50: 0,
          p90: 0,
          p95: 0,
          p99: 0
        }
      };
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = metrics.length;
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / count;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    const lastExecution = metrics[metrics.length - 1].timestamp;

    const percentiles = {
      p50: this.calculatePercentile(durations, 50),
      p90: this.calculatePercentile(durations, 90),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99)
    };

    return {
      operation,
      count,
      averageDuration,
      minDuration,
      maxDuration,
      lastExecution,
      percentiles
    };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const metrics = await this.getMetrics();
    const now = Date.now();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];

    // Check for performance degradation
    for (const [operation, operationMetrics] of Object.entries(metrics.operations)) {
      if (operationMetrics.averageDuration > 5000) { // 5 seconds threshold
        status = 'degraded';
        issues.push(`${operation} average duration is ${operationMetrics.averageDuration}ms`);
      }

      if (operationMetrics.averageDuration > 10000) { // 10 seconds threshold
        status = 'unhealthy';
        issues.push(`${operation} average duration is critically high: ${operationMetrics.averageDuration}ms`);
      }

      // Check for recent activity
      const timeSinceLastExecution = now - operationMetrics.lastExecution.getTime();
      if (timeSinceLastExecution > 300000) { // 5 minutes
        issues.push(`${operation} has not been executed in ${Math.round(timeSinceLastExecution / 1000)}s`);
      }
    }

    return {
      status,
      issues,
      metrics,
      checkedAt: new Date()
    };
  }

  async clearMetrics(operation?: string): Promise<void> {
    if (operation) {
      this.metrics.delete(operation);
      this.logger.info('Performance metrics cleared', { operation });
    } else {
      this.metrics.clear();
      this.logger.info('All performance metrics cleared');
    }
  }

  async exportMetrics(): Promise<string> {
    const metrics = await this.getMetrics();
    return JSON.stringify(metrics, null, 2);
  }
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata: any;
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