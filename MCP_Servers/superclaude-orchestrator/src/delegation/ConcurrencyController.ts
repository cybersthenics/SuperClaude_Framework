/**
 * Concurrency Controller - Manages concurrent sub-agent execution with resource limits
 */

import { 
  SubAgentTask,
  SubAgentResult,
  SubAgentMetrics,
  ResourceUsage 
} from '../types/index.js';

export class ConcurrencyController {
  private maxConcurrent: number;
  private adaptiveScaling: boolean;
  private activeExecutions: Map<string, TaskExecution>;
  private executionQueue: SubAgentTask[];
  private resourceMonitor: ResourceMonitor;

  constructor(maxConcurrent: number = 7) {
    this.maxConcurrent = maxConcurrent;
    this.adaptiveScaling = false;
    this.activeExecutions = new Map();
    this.executionQueue = [];
    this.resourceMonitor = new ResourceMonitor();
  }

  /**
   * Execute sub-agent tasks with concurrency control
   */
  async executeWithConcurrency(
    tasks: SubAgentTask[],
    maxConcurrency?: number
  ): Promise<SubAgentResult[]> {
    const concurrencyLimit = maxConcurrency || this.maxConcurrent;
    console.log(`🔄 Executing ${tasks.length} tasks with max concurrency: ${concurrencyLimit}`);

    const results: SubAgentResult[] = [];
    const inProgress = new Set<Promise<SubAgentResult>>();
    let taskIndex = 0;

    while (taskIndex < tasks.length || inProgress.size > 0) {
      // Start new tasks up to concurrency limit
      while (taskIndex < tasks.length && inProgress.size < concurrencyLimit) {
        const task = tasks[taskIndex++];
        if (!task) continue;
        const execution = this.executeSubAgentTask(task);
        inProgress.add(execution);
      }

      // Wait for at least one task to complete
      const completedResult = await Promise.race(inProgress);
      results.push(completedResult);
      
      // Find and remove the completed promise
      for (const promise of inProgress) {
        try {
          const result = await Promise.race([promise, Promise.resolve(completedResult)]);
          if (result === completedResult) {
            inProgress.delete(promise);
            break;
          }
        } catch (error) {
          inProgress.delete(promise);
          break;
        }
      }
    }

    console.log(`✅ Completed ${results.length} tasks`);
    return results;
  }

  /**
   * Update concurrency configuration
   */
  updateConfiguration(config: ConcurrencyConfig): void {
    this.maxConcurrent = config.maxConcurrent;
    this.adaptiveScaling = config.adaptiveScaling || false;
    
    console.log(`⚙️  Updated concurrency: max ${this.maxConcurrent}, adaptive: ${this.adaptiveScaling}`);
  }

  /**
   * Get current concurrency status
   */
  getCurrentStatus(): ConcurrencyStatus {
    return {
      maxConcurrent: this.maxConcurrent,
      currentActive: this.activeExecutions.size,
      queueLength: this.executionQueue.length,
      adaptiveScaling: this.adaptiveScaling,
      resourceUtilization: this.resourceMonitor.getCurrentUtilization()
    };
  }

  /**
   * Get active execution count
   */
  getCurrentActive(): number {
    return this.activeExecutions.size;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.executionQueue.length;
  }

  // Private helper methods

  private async executeSubAgentTask(task: SubAgentTask): Promise<SubAgentResult> {
    const startTime = Date.now();
    const execution: TaskExecution = {
      taskId: task.taskId,
      startTime: new Date(),
      priority: task.priority
    };

    this.activeExecutions.set(task.taskId, execution);
    
    try {
      // Start resource monitoring
      const resourceStart = this.resourceMonitor.startMonitoring(task.taskId);
      
      // Simulate sub-agent task execution
      const output = await this.simulateSubAgentExecution(task);
      
      // Stop resource monitoring
      const resourceUsage = this.resourceMonitor.stopMonitoring(task.taskId, resourceStart);
      
      const executionTime = Date.now() - startTime;
      
      const metrics: SubAgentMetrics = {
        executionTime,
        resourceUsage,
        specializedMetrics: this.generateSpecializedMetrics(task, output)
      };

      const result: SubAgentResult = {
        taskId: task.taskId,
        agentId: task.agentId,
        output,
        metrics,
        status: 'completed'
      };

      console.log(`✅ Task completed: ${task.taskId} (${executionTime}ms)`);
      
      return result;

    } catch (error) {
      console.error(`❌ Task failed: ${task.taskId}`, error);
      
      const result: SubAgentResult = {
        taskId: task.taskId,
        agentId: task.agentId,
        output: { error: error instanceof Error ? error.message : String(error) },
        metrics: {
          executionTime: Date.now() - startTime,
          resourceUsage: { memory: 0, cpu: 0, io: 0 },
          specializedMetrics: {}
        },
        status: 'failed'
      };
      
      return result;
      
    } finally {
      this.activeExecutions.delete(task.taskId);
    }
  }

  private async simulateSubAgentExecution(task: SubAgentTask): Promise<any> {
    // Simulate different execution times based on task characteristics
    const baseTime = 1000; // 1 second base
    const complexityMultiplier = task.scope.length * 200; // 200ms per scope item
    const priorityMultiplier = this.getPriorityMultiplier(task.priority);
    
    const executionTime = baseTime + complexityMultiplier * priorityMultiplier;
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, Math.min(executionTime, 5000)));
    
    // Generate simulated output based on task operation
    return this.generateSimulatedOutput(task);
  }

  private generateSimulatedOutput(task: SubAgentTask): any {
    const output = {
      operation: task.operation,
      scope: task.scope,
      priority: task.priority,
      findings: this.generateSimulatedFindings(task),
      recommendations: this.generateSimulatedRecommendations(task),
      metrics: {
        itemsAnalyzed: task.scope.length,
        issuesFound: Math.floor(Math.random() * 5),
        confidence: 0.8 + Math.random() * 0.2
      }
    };

    return output;
  }

  private generateSimulatedFindings(task: SubAgentTask): any[] {
    const findingTypes = ['code_smell', 'performance_issue', 'security_concern', 'maintainability'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const findings = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 findings
    
    for (let i = 0; i < count; i++) {
      findings.push({
        type: findingTypes[Math.floor(Math.random() * findingTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        file: task.scope[Math.floor(Math.random() * task.scope.length)],
        line: Math.floor(Math.random() * 100) + 1,
        message: `Simulated finding #${i + 1} for ${task.operation}`,
        recommendation: `Address ${findingTypes[Math.floor(Math.random() * findingTypes.length)]}`
      });
    }
    
    return findings;
  }

  private generateSimulatedRecommendations(task: SubAgentTask): string[] {
    const recommendations = [
      'Consider refactoring for better maintainability',
      'Add unit tests to improve coverage',
      'Optimize performance-critical sections',
      'Review security implications',
      'Update documentation',
      'Consider using design patterns'
    ];
    
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 recommendations
    return recommendations.slice(0, count);
  }

  private generateSpecializedMetrics(task: SubAgentTask, output: any): Record<string, any> {
    return {
      findingsPerFile: output.findings.length / task.scope.length,
      averageSeverity: this.calculateAverageSeverity(output.findings),
      completionRate: 1.0,
      accuracyScore: 0.8 + Math.random() * 0.2
    };
  }

  private calculateAverageSeverity(findings: any[]): number {
    if (findings.length === 0) return 0;
    
    const severityValues = { low: 1, medium: 2, high: 3, critical: 4 };
    const total = findings.reduce((sum, finding) => {
      return sum + (severityValues[finding.severity as keyof typeof severityValues] || 1);
    }, 0);
    
    return total / findings.length;
  }

  private getPriorityMultiplier(priority: string): number {
    const multipliers = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
      critical: 1.5
    };
    
    return multipliers[priority as keyof typeof multipliers] || 1.0;
  }
}

// Resource Monitor Implementation
class ResourceMonitor {
  private baselineUsage: ResourceUsage;
  private activeMonitoring: Map<string, ResourceMonitorSession>;

  constructor() {
    this.baselineUsage = {
      memory: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpu: 0,
      io: 0
    };
    this.activeMonitoring = new Map();
  }

  startMonitoring(taskId: string): ResourceMonitorSession {
    const session: ResourceMonitorSession = {
      taskId,
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed,
      startCpu: process.cpuUsage().user
    };

    this.activeMonitoring.set(taskId, session);
    return session;
  }

  stopMonitoring(taskId: string, session: ResourceMonitorSession): ResourceUsage {
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    const endCpu = process.cpuUsage().user;

    const memoryUsed = Math.max(0, (endMemory - session.startMemory) / 1024 / 1024); // MB
    const cpuUsed = (endCpu - session.startCpu) / 1000000; // Convert to seconds
    const ioOperations = Math.random() * 50 + 10; // Simulated I/O

    this.activeMonitoring.delete(taskId);

    return {
      memory: memoryUsed,
      cpu: cpuUsed,
      io: ioOperations
    };
  }

  getCurrentUtilization(): number {
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryIncrease = currentMemory - this.baselineUsage.memory;
    
    // Normalize to 0-1 scale (assuming 1GB as 100% utilization)
    return Math.min(memoryIncrease / 1024, 1.0);
  }
}

// Supporting interfaces
interface TaskExecution {
  taskId: string;
  startTime: Date;
  priority: string;
}

interface ConcurrencyConfig {
  maxConcurrent: number;
  adaptiveScaling?: boolean;
}

interface ConcurrencyStatus {
  maxConcurrent: number;
  currentActive: number;
  queueLength: number;
  adaptiveScaling: boolean;
  resourceUtilization: number;
}

interface ResourceMonitorSession {
  taskId: string;
  startTime: number;
  startMemory: number;
  startCpu: number;
}