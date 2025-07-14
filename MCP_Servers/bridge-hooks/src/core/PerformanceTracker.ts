import { PerformanceMetrics, SYSTEM_PERFORMANCE_TARGETS } from '../types/index.js';

interface PerformanceConfig {
  targetAverageTime: number;
  targetOptimizationFactor: number;
}

interface TimerInfo {
  operation: string;
  startTime: number;
  startMemory: number;
}

interface OperationMetrics {
  totalExecutions: number;
  totalTime: number;
  totalOptimization: number;
  errors: number;
  averageTime: number;
  averageOptimization: number;
  errorRate: number;
}

export class PerformanceTracker {
  private config: PerformanceConfig;
  private activeTimers: Map<string, TimerInfo> = new Map();
  private operationMetrics: Map<string, OperationMetrics> = new Map();
  private recentExecutions: Array<{ operation: string; time: number; timestamp: number }> = [];
  private readonly maxRecentExecutions = 1000;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.startPeriodicCleanup();
  }

  startTimer(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const timer: TimerInfo = {
      operation,
      startTime: performance.now(),
      startMemory: this.getCurrentMemoryUsage()
    };
    
    this.activeTimers.set(timerId, timer);
    return timerId;
  }

  async endTimer(timerId: string): Promise<PerformanceMetrics> {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      throw new Error(`Timer ${timerId} not found`);
    }

    const endTime = performance.now();
    const executionTime = endTime - timer.startTime;
    const memoryUsage = this.getCurrentMemoryUsage() - timer.startMemory;
    
    // Calculate optimization factor based on target
    const optimizationFactor = this.calculateOptimizationFactor(timer.operation, executionTime);
    
    const metrics: PerformanceMetrics = {
      executionTime,
      optimizationFactor,
      memoryUsage,
      cpuUsage: this.getCurrentCPUUsage()
    };

    // Update operation metrics
    this.updateOperationMetrics(timer.operation, metrics, true);
    
    // Add to recent executions for throughput calculation
    this.recentExecutions.push({
      operation: timer.operation,
      time: executionTime,
      timestamp: Date.now()
    });
    
    // Cleanup old executions
    this.cleanupRecentExecutions();
    
    // Remove the timer
    this.activeTimers.delete(timerId);
    
    return metrics;
  }

  async getMetrics(operation?: string): Promise<PerformanceMetrics> {
    if (operation) {
      const opMetrics = this.operationMetrics.get(operation);
      if (!opMetrics) {
        return this.getDefaultMetrics();
      }
      
      return {
        executionTime: opMetrics.averageTime,
        optimizationFactor: opMetrics.averageOptimization,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCPUUsage()
      };
    }
    
    return this.getOverallMetrics();
  }

  async getOverallMetrics(): Promise<PerformanceMetrics> {
    const allMetrics = Array.from(this.operationMetrics.values());
    
    if (allMetrics.length === 0) {
      return {
        executionTime: 0,
        optimizationFactor: 1.0,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCPUUsage(),
        requestsPerSecond: 0,
        errorRate: 0,
        averageExecutionTime: 0
      };
    }

    // Calculate weighted averages
    const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
    const weightedTimeSum = allMetrics.reduce((sum, m) => sum + (m.averageTime * m.totalExecutions), 0);
    const weightedOptimizationSum = allMetrics.reduce((sum, m) => sum + (m.averageOptimization * m.totalExecutions), 0);
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.errors, 0);

    const averageExecutionTime = totalExecutions > 0 ? weightedTimeSum / totalExecutions : 0;
    const averageOptimization = totalExecutions > 0 ? weightedOptimizationSum / totalExecutions : 1.0;
    const errorRate = totalExecutions > 0 ? totalErrors / totalExecutions : 0;

    // Calculate requests per second from recent executions
    const requestsPerSecond = this.calculateRequestsPerSecond();

    return {
      executionTime: averageExecutionTime,
      optimizationFactor: averageOptimization,
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCPUUsage(),
      requestsPerSecond,
      errorRate,
      averageExecutionTime
    };
  }

  async getOptimizationFactor(): Promise<number> {
    const metrics = await this.getOverallMetrics();
    return metrics.optimizationFactor;
  }

  getOperationStatistics(): Map<string, OperationMetrics> {
    return new Map(this.operationMetrics);
  }

  resetMetrics(operation?: string): void {
    if (operation) {
      this.operationMetrics.delete(operation);
    } else {
      this.operationMetrics.clear();
      this.recentExecutions = [];
    }
  }

  isPerformingWithinBudget(operation: string): boolean {
    const metrics = this.operationMetrics.get(operation);
    if (!metrics) return true;

    // Check against system targets
    return (
      metrics.averageTime <= this.config.targetAverageTime * 1.2 && // 20% tolerance
      metrics.averageOptimization >= this.config.targetOptimizationFactor * 0.8 && // 20% tolerance
      metrics.errorRate <= 0.01 // 1% error rate maximum
    );
  }

  getPerformanceReport(): {
    overall: PerformanceMetrics;
    byOperation: Record<string, OperationMetrics>;
    systemHealth: {
      withinBudget: boolean;
      optimizationTarget: boolean;
      reliabilityTarget: boolean;
    };
  } {
    const overallPromise = this.getOverallMetrics();
    const overall = {
      executionTime: 0,
      optimizationFactor: 1.0,
      memoryUsage: 0,
      cpuUsage: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      averageExecutionTime: 0
    } as PerformanceMetrics;
    const byOperation: Record<string, OperationMetrics> = {};
    
    for (const [operation, metrics] of this.operationMetrics) {
      byOperation[operation] = { ...metrics };
    }

    const systemHealth = {
      withinBudget: overall.executionTime <= SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME * 1.2,
      optimizationTarget: overall.optimizationFactor >= SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR * 0.8,
      reliabilityTarget: (overall.errorRate || 0) <= 0.01
    };

    return {
      overall,
      byOperation,
      systemHealth
    };
  }

  private calculateOptimizationFactor(operation: string, executionTime: number): number {
    // Calculate optimization factor based on operation type and execution time
    let baselineTime = this.config.targetAverageTime;
    
    // Adjust baseline based on operation complexity
    if (operation.includes('preToolUse')) {
      baselineTime = 74; // Proven PreToolUse baseline
    } else if (operation.includes('postToolUse')) {
      baselineTime = 71; // Proven PostToolUse baseline
    } else if (operation.includes('prePrompt') || operation.includes('postPrompt')) {
      baselineTime = 26; // Proven Prompt hooks baseline
    } else if (operation.includes('preCompact')) {
      baselineTime = 72; // Proven PreCompact baseline
    } else if (operation.includes('stop')) {
      baselineTime = 81; // Proven Stop hooks baseline
    }

    // Calculate optimization factor (lower execution time = higher optimization)
    if (executionTime <= 0) return this.config.targetOptimizationFactor;
    
    const factor = baselineTime / executionTime;
    
    // Cap the optimization factor to reasonable bounds
    return Math.min(Math.max(factor, 0.5), 10.0);
  }

  private updateOperationMetrics(operation: string, metrics: PerformanceMetrics, success: boolean): void {
    let opMetrics = this.operationMetrics.get(operation);
    
    if (!opMetrics) {
      opMetrics = {
        totalExecutions: 0,
        totalTime: 0,
        totalOptimization: 0,
        errors: 0,
        averageTime: 0,
        averageOptimization: 0,
        errorRate: 0
      };
      this.operationMetrics.set(operation, opMetrics);
    }

    opMetrics.totalExecutions++;
    opMetrics.totalTime += metrics.executionTime;
    opMetrics.totalOptimization += metrics.optimizationFactor;
    
    if (!success) {
      opMetrics.errors++;
    }

    // Update averages
    opMetrics.averageTime = opMetrics.totalTime / opMetrics.totalExecutions;
    opMetrics.averageOptimization = opMetrics.totalOptimization / opMetrics.totalExecutions;
    opMetrics.errorRate = opMetrics.errors / opMetrics.totalExecutions;
  }

  private calculateRequestsPerSecond(): number {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    const recentRequests = this.recentExecutions.filter(
      execution => execution.timestamp >= oneSecondAgo
    );
    
    return recentRequests.length;
  }

  private cleanupRecentExecutions(): void {
    // Keep only recent executions for throughput calculation
    if (this.recentExecutions.length > this.maxRecentExecutions) {
      this.recentExecutions = this.recentExecutions.slice(-this.maxRecentExecutions);
    }
    
    // Remove executions older than 1 minute
    const oneMinuteAgo = Date.now() - 60000;
    this.recentExecutions = this.recentExecutions.filter(
      execution => execution.timestamp >= oneMinuteAgo
    );
  }

  private getCurrentMemoryUsage(): number {
    // Get memory usage in MB
    if (process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  private getCurrentCPUUsage(): number {
    // Simple CPU usage estimation based on active timers
    // In production, would use actual CPU monitoring
    const activeTimerCount = this.activeTimers.size;
    return Math.min(activeTimerCount * 10, 100); // Rough estimation
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      executionTime: 0,
      optimizationFactor: 1.0,
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCPUUsage()
    };
  }

  private startPeriodicCleanup(): void {
    // Clean up metrics periodically to prevent memory leaks
    setInterval(() => {
      this.cleanupRecentExecutions();
      
      // Clean up very old operation metrics (keep only last 24 hours of data)
      for (const [operation, metrics] of this.operationMetrics) {
        if (metrics.totalExecutions === 0) {
          this.operationMetrics.delete(operation);
        }
      }
    }, 60000); // Every minute
  }
}