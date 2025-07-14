/**
 * Performance Monitor for Inter-Server Communication
 * Real-time monitoring and optimization of messaging performance
 */

import { EventEmitter } from 'events';
import { 
  BaseMessage, 
  MessageType, 
  MessagePriority,
  ServerIdentifier,
  PerformanceHint 
} from './types.js';

export interface PerformanceMetrics {
  timestamp: Date;
  messageCount: number;
  averageLatency: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  queueSize: number;
  connectionCount: number;
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

export interface LatencyMetrics {
  min: number;
  max: number;
  average: number;
  p50: number;
  p95: number;
  p99: number;
  samples: number[];
}

export interface ThroughputMetrics {
  messagesPerSecond: number;
  bytesPerSecond: number;
  peakThroughput: number;
  averageThroughput: number;
  measurementWindow: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  errorsByServer: Record<ServerIdentifier, number>;
  recentErrors: ErrorEvent[];
}

export interface ErrorEvent {
  timestamp: Date;
  type: string;
  server: ServerIdentifier;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  connectionsByServer: Record<ServerIdentifier, number>;
  averageConnectionTime: number;
  connectionFailures: number;
}

export interface QueueMetrics {
  totalQueued: number;
  queueSize: number;
  averageWaitTime: number;
  maxQueueSize: number;
  queuesByPriority: Record<MessagePriority, number>;
}

export interface PerformanceThresholds {
  maxLatency: number;
  minThroughput: number;
  maxErrorRate: number;
  maxQueueSize: number;
  maxResourceUtilization: number;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: 'latency' | 'throughput' | 'error_rate' | 'queue_size' | 'resource';
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  server?: ServerIdentifier;
  recommendations: string[];
}

export interface OptimizationSuggestion {
  type: 'routing' | 'queuing' | 'caching' | 'batching' | 'connection_pooling';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedEffort: string;
}

export interface PerformanceReport {
  timestamp: Date;
  duration: number;
  summary: PerformanceSummary;
  detailed: DetailedMetrics;
  alerts: PerformanceAlert[];
  optimizations: OptimizationSuggestion[];
  trends: PerformanceTrends;
}

export interface PerformanceSummary {
  overallHealth: 'excellent' | 'good' | 'degraded' | 'poor';
  score: number;
  keyMetrics: {
    latency: number;
    throughput: number;
    reliability: number;
    efficiency: number;
  };
}

export interface DetailedMetrics {
  latency: LatencyMetrics;
  throughput: ThroughputMetrics;
  errors: ErrorMetrics;
  connections: ConnectionMetrics;
  queues: QueueMetrics;
  resources: ResourceUtilization;
}

export interface PerformanceTrends {
  latencyTrend: 'improving' | 'stable' | 'degrading';
  throughputTrend: 'improving' | 'stable' | 'degrading';
  errorTrend: 'improving' | 'stable' | 'degrading';
  predictionAccuracy: number;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private latencySamples: number[] = [];
  private throughputSamples: number[] = [];
  private errorEvents: ErrorEvent[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds;
  private measurementWindow: number = 60000; // 1 minute
  private maxSamples: number = 1000;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    super();
    
    this.thresholds = {
      maxLatency: 50, // ms
      minThroughput: 1000, // messages/second
      maxErrorRate: 1, // percentage
      maxQueueSize: 10000,
      maxResourceUtilization: 80, // percentage
      ...thresholds
    };

    this.startMonitoring();
  }

  recordMessageLatency(latency: number, message: BaseMessage): void {
    this.latencySamples.push(latency);
    
    // Keep only recent samples
    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift();
    }

    // Check latency threshold
    if (latency > this.thresholds.maxLatency) {
      this.generateAlert('latency', 'warning', 
        `High message latency detected: ${latency.toFixed(2)}ms`,
        latency, this.thresholds.maxLatency,
        message.header.source as ServerIdentifier);
    }

    this.emit('latencyRecorded', { latency, message });
  }

  recordThroughput(messagesPerSecond: number, bytesPerSecond: number): void {
    this.throughputSamples.push(messagesPerSecond);
    
    if (this.throughputSamples.length > this.maxSamples) {
      this.throughputSamples.shift();
    }

    // Check throughput threshold
    if (messagesPerSecond < this.thresholds.minThroughput) {
      this.generateAlert('throughput', 'warning',
        `Low throughput detected: ${messagesPerSecond} messages/second`,
        messagesPerSecond, this.thresholds.minThroughput);
    }

    this.emit('throughputRecorded', { messagesPerSecond, bytesPerSecond });
  }

  recordError(error: ErrorEvent): void {
    this.errorEvents.push(error);
    
    // Keep only recent errors (last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.errorEvents = this.errorEvents.filter(e => e.timestamp > oneHourAgo);

    // Calculate error rate
    const recentErrors = this.errorEvents.filter(
      e => e.timestamp > new Date(Date.now() - this.measurementWindow)
    );
    
    const totalMessages = this.metrics.length > 0 ? 
      this.metrics[this.metrics.length - 1].messageCount : 1;
    const errorRate = (recentErrors.length / totalMessages) * 100;

    if (errorRate > this.thresholds.maxErrorRate) {
      this.generateAlert('error_rate', 'critical',
        `High error rate detected: ${errorRate.toFixed(2)}%`,
        errorRate, this.thresholds.maxErrorRate,
        error.server);
    }

    this.emit('errorRecorded', error);
  }

  recordQueueSize(queueSize: number, queueType?: string): void {
    if (queueSize > this.thresholds.maxQueueSize) {
      this.generateAlert('queue_size', 'warning',
        `Large queue size detected: ${queueSize} messages`,
        queueSize, this.thresholds.maxQueueSize);
    }

    this.emit('queueSizeRecorded', { queueSize, queueType });
  }

  recordResourceUtilization(utilization: ResourceUtilization): void {
    const maxUtilization = Math.max(
      utilization.cpu,
      utilization.memory,
      utilization.network,
      utilization.storage
    );

    if (maxUtilization > this.thresholds.maxResourceUtilization) {
      let resourceType = 'cpu';
      if (utilization.memory === maxUtilization) resourceType = 'memory';
      else if (utilization.network === maxUtilization) resourceType = 'network';
      else if (utilization.storage === maxUtilization) resourceType = 'storage';

      this.generateAlert('resource', 'warning',
        `High ${resourceType} utilization: ${maxUtilization.toFixed(1)}%`,
        maxUtilization, this.thresholds.maxResourceUtilization);
    }

    this.emit('resourceUtilizationRecorded', utilization);
  }

  getLatencyMetrics(): LatencyMetrics {
    if (this.latencySamples.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        samples: []
      };
    }

    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: sum / sorted.length,
      p50: this.getPercentile(sorted, 50),
      p95: this.getPercentile(sorted, 95),
      p99: this.getPercentile(sorted, 99),
      samples: [...this.latencySamples]
    };
  }

  getThroughputMetrics(): ThroughputMetrics {
    if (this.throughputSamples.length === 0) {
      return {
        messagesPerSecond: 0,
        bytesPerSecond: 0,
        peakThroughput: 0,
        averageThroughput: 0,
        measurementWindow: this.measurementWindow
      };
    }

    const sum = this.throughputSamples.reduce((a, b) => a + b, 0);
    const average = sum / this.throughputSamples.length;
    const peak = Math.max(...this.throughputSamples);

    return {
      messagesPerSecond: this.throughputSamples[this.throughputSamples.length - 1] || 0,
      bytesPerSecond: 0, // Would need additional tracking
      peakThroughput: peak,
      averageThroughput: average,
      measurementWindow: this.measurementWindow
    };
  }

  getErrorMetrics(): ErrorMetrics {
    const totalErrors = this.errorEvents.length;
    const totalMessages = this.metrics.length > 0 ? 
      this.metrics[this.metrics.length - 1].messageCount : 1;
    const errorRate = (totalErrors / totalMessages) * 100;

    const errorsByType: Record<string, number> = {};
    const errorsByServer: Record<ServerIdentifier, number> = {};

    this.errorEvents.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsByServer[error.server] = (errorsByServer[error.server] || 0) + 1;
    });

    return {
      totalErrors,
      errorRate,
      errorsByType,
      errorsByServer,
      recentErrors: this.errorEvents.slice(-10) // Last 10 errors
    };
  }

  getActiveAlerts(): PerformanceAlert[] {
    // Return alerts from the last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    return this.alerts.filter(alert => alert.timestamp > oneHourAgo);
  }

  generatePerformanceReport(): PerformanceReport {
    const now = new Date();
    const latencyMetrics = this.getLatencyMetrics();
    const throughputMetrics = this.getThroughputMetrics();
    const errorMetrics = this.getErrorMetrics();
    const activeAlerts = this.getActiveAlerts();

    // Calculate overall health score
    const healthScore = this.calculateHealthScore(latencyMetrics, throughputMetrics, errorMetrics);
    
    return {
      timestamp: now,
      duration: this.measurementWindow,
      summary: {
        overallHealth: this.getHealthStatus(healthScore),
        score: healthScore,
        keyMetrics: {
          latency: latencyMetrics.average,
          throughput: throughputMetrics.averageThroughput,
          reliability: 100 - errorMetrics.errorRate,
          efficiency: this.calculateEfficiencyScore()
        }
      },
      detailed: {
        latency: latencyMetrics,
        throughput: throughputMetrics,
        errors: errorMetrics,
        connections: this.getConnectionMetrics(),
        queues: this.getQueueMetrics(),
        resources: this.getCurrentResourceUtilization()
      },
      alerts: activeAlerts,
      optimizations: this.generateOptimizationSuggestions(),
      trends: this.analyzeTrends()
    };
  }

  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const latencyMetrics = this.getLatencyMetrics();
    const throughputMetrics = this.getThroughputMetrics();
    const errorMetrics = this.getErrorMetrics();

    // High latency suggestions
    if (latencyMetrics.average > this.thresholds.maxLatency) {
      suggestions.push({
        type: 'routing',
        priority: 'high',
        description: 'Optimize message routing to reduce latency',
        expectedImprovement: 25,
        implementationComplexity: 'medium',
        estimatedEffort: '1-2 days'
      });

      suggestions.push({
        type: 'connection_pooling',
        priority: 'medium',
        description: 'Implement connection pooling to reduce connection overhead',
        expectedImprovement: 15,
        implementationComplexity: 'low',
        estimatedEffort: '4-8 hours'
      });
    }

    // Low throughput suggestions
    if (throughputMetrics.averageThroughput < this.thresholds.minThroughput) {
      suggestions.push({
        type: 'batching',
        priority: 'high',
        description: 'Implement message batching to improve throughput',
        expectedImprovement: 40,
        implementationComplexity: 'medium',
        estimatedEffort: '1-2 days'
      });
    }

    // High error rate suggestions
    if (errorMetrics.errorRate > this.thresholds.maxErrorRate) {
      suggestions.push({
        type: 'routing',
        priority: 'critical',
        description: 'Implement better error handling and retry mechanisms',
        expectedImprovement: 50,
        implementationComplexity: 'high',
        estimatedEffort: '3-5 days'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectCurrentMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  private collectCurrentMetrics(): void {
    const now = new Date();
    const latencyMetrics = this.getLatencyMetrics();
    const throughputMetrics = this.getThroughputMetrics();
    const errorMetrics = this.getErrorMetrics();

    const currentMetrics: PerformanceMetrics = {
      timestamp: now,
      messageCount: this.latencySamples.length,
      averageLatency: latencyMetrics.average,
      throughput: throughputMetrics.averageThroughput,
      errorRate: errorMetrics.errorRate,
      successRate: 100 - errorMetrics.errorRate,
      queueSize: 0, // Would be provided by queue manager
      connectionCount: 0, // Would be provided by connection manager
      resourceUtilization: this.getCurrentResourceUtilization()
    };

    this.metrics.push(currentMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxSamples) {
      this.metrics.shift();
    }

    this.emit('metricsCollected', currentMetrics);
  }

  private generateAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    currentValue: number,
    threshold: number,
    server?: ServerIdentifier
  ): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      severity,
      message,
      currentValue,
      threshold,
      server,
      recommendations: this.getRecommendationsForAlert(type, severity)
    };

    this.alerts.push(alert);
    this.emit('alertGenerated', alert);
  }

  private getRecommendationsForAlert(type: string, severity: string): string[] {
    const recommendations: Record<string, string[]> = {
      latency: [
        'Check network connectivity',
        'Optimize message routing',
        'Implement connection pooling',
        'Review server resource utilization'
      ],
      throughput: [
        'Implement message batching',
        'Optimize serialization',
        'Scale horizontally',
        'Implement caching'
      ],
      error_rate: [
        'Implement retry mechanisms',
        'Improve error handling',
        'Check server health',
        'Review message validation'
      ],
      queue_size: [
        'Scale message processing',
        'Implement priority queuing',
        'Optimize batch processing',
        'Add more workers'
      ],
      resource: [
        'Scale server resources',
        'Optimize resource usage',
        'Implement load balancing',
        'Review process efficiency'
      ]
    };

    return recommendations[type] || ['Review system configuration'];
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private calculateHealthScore(
    latency: LatencyMetrics,
    throughput: ThroughputMetrics,
    errors: ErrorMetrics
  ): number {
    let score = 100;

    // Latency penalty
    if (latency.average > this.thresholds.maxLatency) {
      const penalty = Math.min(30, (latency.average / this.thresholds.maxLatency) * 10);
      score -= penalty;
    }

    // Throughput penalty
    if (throughput.averageThroughput < this.thresholds.minThroughput) {
      const penalty = Math.min(25, 
        ((this.thresholds.minThroughput - throughput.averageThroughput) / this.thresholds.minThroughput) * 25
      );
      score -= penalty;
    }

    // Error rate penalty
    score -= Math.min(45, errors.errorRate * 10);

    return Math.max(0, score);
  }

  private getHealthStatus(score: number): PerformanceSummary['overallHealth'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'degraded';
    return 'poor';
  }

  private calculateEfficiencyScore(): number {
    // Placeholder implementation
    return 85;
  }

  private getConnectionMetrics(): ConnectionMetrics {
    // Placeholder implementation
    return {
      totalConnections: 0,
      activeConnections: 0,
      connectionsByServer: {},
      averageConnectionTime: 0,
      connectionFailures: 0
    };
  }

  private getQueueMetrics(): QueueMetrics {
    // Placeholder implementation
    return {
      totalQueued: 0,
      queueSize: 0,
      averageWaitTime: 0,
      maxQueueSize: 0,
      queuesByPriority: {}
    };
  }

  private getCurrentResourceUtilization(): ResourceUtilization {
    // Placeholder implementation - would integrate with system monitoring
    return {
      cpu: 45,
      memory: 60,
      network: 30,
      storage: 25
    };
  }

  private analyzeTrends(): PerformanceTrends {
    // Simplified trend analysis
    return {
      latencyTrend: 'stable',
      throughputTrend: 'stable',
      errorTrend: 'stable',
      predictionAccuracy: 85
    };
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.removeAllListeners();
  }
}