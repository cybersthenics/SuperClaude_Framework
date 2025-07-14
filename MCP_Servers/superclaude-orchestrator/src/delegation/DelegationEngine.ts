/**
 * Delegation Engine - Intelligent task distribution across specialized sub-agents
 * Supports file-based, folder-based, and auto delegation strategies
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DelegationTask,
  DelegationResult,
  DelegationStrategy,
  DelegationStrategyConfig,
  SubAgentResults,
  SubAgent,
  SubAgentSpecialization,
  SubAgentTask,
  SubAgentResult 
} from '../types/index.js';
import { SubAgentManager } from './SubAgentManager.js';
import { ConcurrencyController } from './ConcurrencyController.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';

export class DelegationEngine {
  private subAgentManager: SubAgentManager;
  private concurrencyController: ConcurrencyController;
  private performanceTracker: PerformanceTracker;
  private activeDelegations: Map<string, DelegationExecution>;
  private strategyConfigurations: Map<string, DelegationStrategyConfig>;

  constructor(
    subAgentManager: SubAgentManager,
    concurrencyController: ConcurrencyController,
    performanceTracker: PerformanceTracker
  ) {
    this.subAgentManager = subAgentManager;
    this.concurrencyController = concurrencyController;
    this.performanceTracker = performanceTracker;
    this.activeDelegations = new Map();
    this.strategyConfigurations = new Map();
    
    this.initializeDefaultStrategies();
  }

  /**
   * Delegate task to specialized sub-agents
   */
  async delegateToSubAgents(
    task: DelegationTask,
    strategy: DelegationStrategyConfig
  ): Promise<DelegationResult> {
    const startTime = Date.now();
    const delegationId = this.generateDelegationId();

    console.log(`🎯 Starting delegation: ${delegationId} (${strategy.type} strategy)`);

    try {
      // Create delegation plan
      const delegationPlan = await this.createDelegationPlan(task, strategy);
      
      // Create and configure sub-agents
      const subAgents = await this.createSubAgents(delegationPlan);
      
      // Execute delegation with monitoring
      const executionResult = await this.executeDelegation(delegationPlan, subAgents);
      
      // Calculate performance metrics
      const setupTime = Date.now() - startTime;
      this.performanceTracker.recordDelegationPerformance(
        delegationId,
        subAgents.length,
        executionResult.executionTime,
        executionResult.efficiency
      );

      const result: DelegationResult = {
        delegationId,
        subAgentsCreated: subAgents.length,
        strategy,
        estimatedCompletionTime: executionResult.executionTime,
        status: 'completed'
      };

      console.log(`✅ Delegation completed: ${delegationId} (${subAgents.length} agents, ${executionResult.efficiency.toFixed(2)} efficiency)`);
      
      return result;

    } catch (error) {
      console.error(`❌ Delegation failed: ${delegationId}`, error);
      throw new Error(`Delegation failed: ${error}`);
    }
  }

  /**
   * Configure delegation strategy parameters
   */
  configureDelegationStrategy(strategy: DelegationStrategy, configuration: any): void {
    const strategyConfig: DelegationStrategyConfig = {
      type: strategy,
      concurrency: configuration.concurrency || 7,
      specialization: configuration.specialization,
      resourceAllocation: configuration.resourceAllocation || 'dynamic'
    };

    this.strategyConfigurations.set(strategy, strategyConfig);
    
    console.log(`⚙️  Configured ${strategy} strategy:`, strategyConfig);
  }

  /**
   * Get aggregated results from sub-agents
   */
  async getSubAgentResults(delegationId: string): Promise<SubAgentResults> {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    // Wait for all sub-agents to complete if still running
    if (delegation.status === 'running') {
      await this.waitForDelegationCompletion(delegationId);
    }

    const results = await this.aggregateSubAgentResults(delegation);
    
    console.log(`📊 Results aggregated for delegation: ${delegationId}`);
    
    return results;
  }

  /**
   * Manage concurrent sub-agent execution
   */
  manageConcurrency(maxConcurrent: number): void {
    this.concurrencyController.updateConfiguration({
      maxConcurrent,
      adaptiveScaling: true
    });
    
    console.log(`🔧 Concurrency updated: max ${maxConcurrent} concurrent sub-agents`);
  }

  /**
   * Get delegation statistics
   */
  getDelegationStatistics(): DelegationStatistics {
    const activeDelegations = Array.from(this.activeDelegations.values());
    const completedDelegations = activeDelegations.filter(d => d.status === 'completed');
    
    return {
      activeDelegations: activeDelegations.length,
      completedDelegations: completedDelegations.length,
      averageSubAgentCount: completedDelegations.length > 0 ? 
        completedDelegations.reduce((sum, d) => sum + d.subAgents.length, 0) / completedDelegations.length : 0,
      averageEfficiency: completedDelegations.length > 0 ? 
        completedDelegations.reduce((sum, d) => sum + (d.results?.efficiency || 0), 0) / completedDelegations.length : 0,
      strategyDistribution: this.calculateStrategyDistribution(activeDelegations)
    };
  }

  // Private helper methods

  private initializeDefaultStrategies(): void {
    this.configureDelegationStrategy('files', {
      concurrency: 5,
      specialization: 'quality',
      resourceAllocation: 'equal'
    });

    this.configureDelegationStrategy('folders', {
      concurrency: 8,
      specialization: 'architecture',
      resourceAllocation: 'weighted'
    });

    this.configureDelegationStrategy('auto', {
      concurrency: 7,
      resourceAllocation: 'dynamic'
    });
  }

  private async createDelegationPlan(
    task: DelegationTask,
    strategy: DelegationStrategyConfig
  ): Promise<DelegationPlan> {
    const plan: DelegationPlan = {
      delegationId: this.generateDelegationId(),
      task,
      strategy,
      subTasks: [],
      estimatedDuration: 0,
      resourceRequirements: {
        memory: 0,
        cpu: 0,
        concurrency: strategy.concurrency,
        timeout: 300000 // 5 minutes default
      }
    };

    // Break down task based on strategy
    switch (strategy.type) {
      case 'files':
        plan.subTasks = await this.createFileBasedSubTasks(task, strategy);
        break;
      case 'folders':
        plan.subTasks = await this.createFolderBasedSubTasks(task, strategy);
        break;
      case 'auto':
        plan.subTasks = await this.createAutoSubTasks(task, strategy);
        break;
      default:
        throw new Error(`Unknown delegation strategy: ${strategy.type}`);
    }

    // Calculate resource requirements
    plan.resourceRequirements.memory = plan.subTasks.length * 256; // 256MB per sub-task
    plan.resourceRequirements.cpu = plan.subTasks.length * 0.5; // 0.5 CPU per sub-task
    plan.estimatedDuration = this.estimateDuration(plan.subTasks, strategy);

    return plan;
  }

  private async createFileBasedSubTasks(
    task: DelegationTask,
    strategy: DelegationStrategyConfig
  ): Promise<SubAgentTask[]> {
    const subTasks: SubAgentTask[] = [];
    
    // Create one sub-task per file
    for (const file of task.scope) {
      if (this.isFile(file)) {
        subTasks.push({
          taskId: uuidv4(),
          agentId: '', // Will be assigned later
          operation: task.type,
          scope: [file],
          priority: this.calculateFilePriority(file)
        });
      }
    }

    console.log(`📄 Created ${subTasks.length} file-based sub-tasks`);
    return subTasks;
  }

  private async createFolderBasedSubTasks(
    task: DelegationTask,
    strategy: DelegationStrategyConfig
  ): Promise<SubAgentTask[]> {
    const subTasks: SubAgentTask[] = [];
    const folderGroups = this.groupFilesByFolder(task.scope);
    
    // Create one sub-task per folder
    for (const [folder, files] of folderGroups) {
      subTasks.push({
        taskId: uuidv4(),
        agentId: '', // Will be assigned later
        operation: task.type,
        scope: files,
        priority: this.calculateFolderPriority(folder, files.length)
      });
    }

    console.log(`📁 Created ${subTasks.length} folder-based sub-tasks`);
    return subTasks;
  }

  private async createAutoSubTasks(
    task: DelegationTask,
    strategy: DelegationStrategyConfig
  ): Promise<SubAgentTask[]> {
    // Intelligent sub-task creation based on task characteristics
    const complexity = this.analyzeTaskComplexity(task);
    
    if (complexity.fileCount > 50) {
      return this.createFolderBasedSubTasks(task, strategy);
    } else if (complexity.averageFileSize < 1000) {
      return this.createFileBasedSubTasks(task, strategy);
    } else {
      // Mixed strategy based on file types and sizes
      return this.createMixedSubTasks(task, strategy);
    }
  }

  private async createMixedSubTasks(
    task: DelegationTask,
    strategy: DelegationStrategyConfig
  ): Promise<SubAgentTask[]> {
    const subTasks: SubAgentTask[] = [];
    const fileTypes = this.categorizeFilesByType(task.scope);
    
    // Group similar file types together
    for (const [fileType, files] of fileTypes) {
      const chunkSize = this.calculateOptimalChunkSize(files.length);
      
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        subTasks.push({
          taskId: uuidv4(),
          agentId: '',
          operation: task.type,
          scope: chunk,
          priority: this.calculateTypePriority(fileType)
        });
      }
    }

    console.log(`🔄 Created ${subTasks.length} mixed sub-tasks`);
    return subTasks;
  }

  private async createSubAgents(plan: DelegationPlan): Promise<SubAgent[]> {
    const subAgents: SubAgent[] = [];
    
    for (const subTask of plan.subTasks) {
      const specialization = plan.strategy.specialization || this.determineOptimalSpecialization(subTask);
      const agent = this.subAgentManager.createSpecializedAgent(specialization, subTask.scope);
      
      // Assign agent to task
      subTask.agentId = agent.agentId;
      subAgents.push(agent);
    }

    console.log(`🤖 Created ${subAgents.length} specialized sub-agents`);
    return subAgents;
  }

  private async executeDelegation(
    plan: DelegationPlan,
    subAgents: SubAgent[]
  ): Promise<DelegationExecutionResult> {
    const startTime = Date.now();
    
    const execution: DelegationExecution = {
      delegationId: plan.delegationId,
      plan,
      subAgents,
      status: 'running',
      startTime: new Date(),
      results: null
    };

    this.activeDelegations.set(plan.delegationId, execution);

    try {
      // Execute sub-tasks with concurrency control
      const subAgentResults = await this.concurrencyController.executeWithConcurrency(
        plan.subTasks,
        plan.strategy.concurrency
      );

      // Calculate execution metrics
      const executionTime = Date.now() - startTime;
      const efficiency = this.calculateDelegationEfficiency(subAgentResults, executionTime);
      
      execution.status = 'completed';
      execution.results = {
        subAgentResults,
        aggregatedResults: await this.aggregateResults(subAgentResults),
        efficiency,
        executionTime
      };

      return {
        executionTime,
        efficiency,
        subAgentResults
      };

    } catch (error) {
      execution.status = 'failed';
      execution.error = error;
      throw error;
    }
  }

  private async waitForDelegationCompletion(delegationId: string): Promise<void> {
    const delegation = this.activeDelegations.get(delegationId);
    if (!delegation) return;

    // Poll for completion (in real implementation, this would use events)
    while (delegation.status === 'running') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async aggregateSubAgentResults(delegation: DelegationExecution): Promise<SubAgentResults> {
    if (!delegation.results) {
      throw new Error('Delegation results not available');
    }

    return {
      delegationId: delegation.delegationId,
      individual: delegation.results.subAgentResults,
      aggregated: delegation.results.aggregatedResults,
      status: 'completed',
      performance: {
        setupTime: 0, // Would be tracked in real implementation
        executionTime: delegation.results.executionTime,
        aggregationTime: 0, // Would be tracked in real implementation
        efficiency: delegation.results.efficiency,
        timeSavings: Math.max(0, 1 - delegation.results.efficiency) // Simplified calculation
      }
    };
  }

  private async aggregateResults(subAgentResults: SubAgentResult[]): Promise<any> {
    const aggregated = {
      totalSubAgents: subAgentResults.length,
      completedTasks: subAgentResults.filter(r => r.status === 'completed').length,
      failedTasks: subAgentResults.filter(r => r.status === 'failed').length,
      averageExecutionTime: subAgentResults.reduce((sum, r) => sum + (r.metrics?.executionTime || 0), 0) / subAgentResults.length,
      findings: this.mergeFindingsFromResults(subAgentResults),
      recommendations: this.generateAggregatedRecommendations(subAgentResults)
    };

    return aggregated;
  }

  private calculateDelegationEfficiency(results: SubAgentResult[], executionTime: number): number {
    const successfulResults = results.filter(r => r.status === 'completed');
    const successRate = successfulResults.length / results.length;
    
    // Efficiency is based on success rate and time savings
    const baseEfficiency = successRate;
    const timeEfficiency = Math.min(1.0, 60000 / executionTime); // Normalize to 1 minute baseline
    
    return (baseEfficiency + timeEfficiency) / 2;
  }

  private mergeFindingsFromResults(results: SubAgentResult[]): any[] {
    const allFindings: any[] = [];
    
    for (const result of results) {
      if (result.output && result.output.findings) {
        allFindings.push(...result.output.findings);
      }
    }

    // Remove duplicates and sort by severity
    return this.deduplicateAndSortFindings(allFindings);
  }

  private generateAggregatedRecommendations(results: SubAgentResult[]): string[] {
    const recommendations = new Set<string>();
    
    for (const result of results) {
      if (result.output && result.output.recommendations) {
        result.output.recommendations.forEach((rec: string) => recommendations.add(rec));
      }
    }

    return Array.from(recommendations);
  }

  private deduplicateAndSortFindings(findings: any[]): any[] {
    const unique = findings.reduce((acc, finding) => {
      const key = `${finding.type}_${finding.file}_${finding.line}`;
      if (!acc.has(key)) {
        acc.set(key, finding);
      }
      return acc;
    }, new Map());

    return Array.from(unique.values()).sort((a: any, b: any) => {
      const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  // Helper methods for task analysis and creation

  private isFile(path: string): boolean {
    return path.includes('.') && !path.endsWith('/');
  }

  private groupFilesByFolder(files: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    for (const file of files) {
      const folder = file.substring(0, file.lastIndexOf('/')) || 'root';
      if (!groups.has(folder)) {
        groups.set(folder, []);
      }
      groups.get(folder)!.push(file);
    }
    
    return groups;
  }

  private categorizeFilesByType(files: string[]): Map<string, string[]> {
    const types = new Map<string, string[]>();
    
    for (const file of files) {
      const extension = file.substring(file.lastIndexOf('.') + 1);
      const type = this.getFileTypeCategory(extension);
      
      if (!types.has(type)) {
        types.set(type, []);
      }
      types.get(type)!.push(file);
    }
    
    return types;
  }

  private getFileTypeCategory(extension: string): string {
    const categories: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'h': 'cpp',
      'css': 'stylesheet',
      'scss': 'stylesheet',
      'html': 'markup',
      'md': 'documentation',
      'json': 'config',
      'yaml': 'config',
      'yml': 'config'
    };
    
    return categories[extension.toLowerCase()] || 'other';
  }

  private analyzeTaskComplexity(task: DelegationTask): TaskComplexity {
    return {
      fileCount: task.scope.length,
      averageFileSize: 1000, // Simplified - would analyze actual files
      typeVariety: new Set(task.scope.map(f => this.getFileTypeCategory(f.split('.').pop() || ''))).size,
      estimatedComplexity: Math.min(task.scope.length / 20, 1.0)
    };
  }

  private calculateOptimalChunkSize(fileCount: number): number {
    if (fileCount <= 5) return fileCount;
    if (fileCount <= 20) return Math.ceil(fileCount / 3);
    return Math.ceil(fileCount / 5);
  }

  private calculateFilePriority(file: string): 'low' | 'medium' | 'high' | 'critical' {
    if (file.includes('test') || file.includes('spec')) return 'medium';
    if (file.includes('index') || file.includes('main')) return 'high';
    if (file.includes('config') || file.includes('setup')) return 'critical';
    return 'low';
  }

  private calculateFolderPriority(folder: string, fileCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (folder.includes('core') || folder.includes('src')) return 'high';
    if (folder.includes('test') || folder.includes('spec')) return 'medium';
    if (fileCount > 10) return 'high';
    return 'low';
  }

  private calculateTypePriority(fileType: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorities: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'typescript': 'high',
      'javascript': 'high',
      'python': 'high',
      'config': 'critical',
      'documentation': 'medium',
      'stylesheet': 'low'
    };
    
    return priorities[fileType] || 'low';
  }

  private determineOptimalSpecialization(task: SubAgentTask): SubAgentSpecialization {
    const operation = task.operation.toLowerCase();
    
    if (operation.includes('security') || operation.includes('vulnerability')) return 'security';
    if (operation.includes('performance') || operation.includes('optimize')) return 'performance';
    if (operation.includes('quality') || operation.includes('review')) return 'quality';
    if (operation.includes('architecture') || operation.includes('design')) return 'architecture';
    
    return 'quality'; // Default specialization
  }

  private estimateDuration(subTasks: SubAgentTask[], strategy: DelegationStrategyConfig): number {
    const baseTimePerTask = 30000; // 30 seconds per task
    const totalTasks = subTasks.length;
    const concurrency = strategy.concurrency;
    
    return Math.ceil(totalTasks / concurrency) * baseTimePerTask;
  }

  private calculateStrategyDistribution(delegations: DelegationExecution[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const delegation of delegations) {
      const strategy = delegation.plan.strategy.type;
      distribution[strategy] = (distribution[strategy] || 0) + 1;
    }
    
    return distribution;
  }

  private generateDelegationId(): string {
    return `delegation_${uuidv4()}`;
  }
}

// Supporting interfaces for internal use
interface DelegationPlan {
  delegationId: string;
  task: DelegationTask;
  strategy: DelegationStrategyConfig;
  subTasks: SubAgentTask[];
  estimatedDuration: number;
  resourceRequirements: {
    memory: number;
    cpu: number;
    concurrency: number;
    timeout: number;
  };
}

interface DelegationExecution {
  delegationId: string;
  plan: DelegationPlan;
  subAgents: SubAgent[];
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  results: DelegationExecutionResults | null;
  error?: any;
}

interface DelegationExecutionResults {
  subAgentResults: SubAgentResult[];
  aggregatedResults: any;
  efficiency: number;
  executionTime: number;
}

interface DelegationExecutionResult {
  executionTime: number;
  efficiency: number;
  subAgentResults: SubAgentResult[];
}

interface TaskComplexity {
  fileCount: number;
  averageFileSize: number;
  typeVariety: number;
  estimatedComplexity: number;
}

interface DelegationStatistics {
  activeDelegations: number;
  completedDelegations: number;
  averageSubAgentCount: number;
  averageEfficiency: number;
  strategyDistribution: Record<string, number>;
}