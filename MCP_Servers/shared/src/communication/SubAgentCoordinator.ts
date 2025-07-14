/**
 * Sub-Agent Coordinator Implementation
 * Parallel task distribution and result aggregation across multiple agents
 */

import { EventEmitter } from 'events';
import {
  BaseMessage,
  MessageType,
  MessagePriority,
  ServerIdentifier,
  SuperClaudeContext
} from './types.js';
import { MessageRouter } from './MessageRouter.js';

export interface SubAgentTask {
  taskId: string;
  agentId: string;
  operation: string;
  input: any;
  priority: TaskPriority;
  timeout: number;
  dependencies: string[];
  expectedOutput?: any;
  retries: number;
  maxRetries: number;
}

export enum TaskPriority {
  Critical = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Background = 4
}

export enum TaskStatus {
  Pending = 'pending',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Timeout = 'timeout'
}

export enum AgentStatus {
  Available = 'available',
  Busy = 'busy',
  Overloaded = 'overloaded',
  Offline = 'offline',
  Error = 'error'
}

export interface SubAgent {
  agentId: string;
  serverId: ServerIdentifier;
  capabilities: string[];
  status: AgentStatus;
  currentTasks: string[];
  maxConcurrentTasks: number;
  performance: AgentPerformance;
  specializations: string[];
  lastHeartbeat: Date;
}

export interface AgentPerformance {
  averageExecutionTime: number;
  successRate: number;
  throughput: number; // tasks per hour
  errorRate: number;
  reliability: number;
  efficiency: number;
  qualityScore: number;
}

export interface TaskExecution {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  progress?: number;
  metrics?: TaskMetrics;
}

export interface TaskMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkIO: number;
  qualityScore: number;
  accuracy: number;
  completeness: number;
}

export interface DelegationRequest {
  delegationId: string;
  tasks: SubAgentTask[];
  strategy: DelegationStrategy;
  aggregationRules: AggregationRules;
  context: SuperClaudeContext;
  timeout: number;
}

export interface DelegationStrategy {
  type: 'parallel' | 'sequential' | 'pipeline' | 'adaptive';
  loadBalancing: 'round_robin' | 'least_loaded' | 'capability_match' | 'performance_based';
  failureHandling: 'retry' | 'reassign' | 'skip' | 'abort';
  scalingPolicy: 'fixed' | 'elastic' | 'demand_based';
  optimization: 'speed' | 'quality' | 'cost' | 'balanced';
}

export interface AggregationRules {
  method: 'merge' | 'select_best' | 'vote' | 'weighted_average' | 'custom';
  conflictResolution: 'majority' | 'highest_confidence' | 'expert_preference' | 'manual';
  qualityThreshold: number;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches';
  value: any;
  weight: number;
}

export interface DelegationResult {
  delegationId: string;
  success: boolean;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  aggregatedResult: any;
  duration: number;
  taskResults: TaskExecution[];
  metrics: DelegationMetrics;
}

export interface DelegationMetrics {
  totalExecutionTime: number;
  averageTaskTime: number;
  parallelEfficiency: number;
  resourceUtilization: ResourceUtilization;
  qualityMetrics: QualityMetrics;
  agentUtilization: Record<string, number>;
}

export interface ResourceUtilization {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

export interface QualityMetrics {
  accuracy: number;
  completeness: number;
  consistency: number;
  relevance: number;
  confidence: number;
}

export interface LoadBalancingResult {
  selectedAgent: string;
  loadDistribution: Record<string, number>;
  balancingReason: string;
  alternatives: string[];
}

export interface AgentHealthStatus {
  agentId: string;
  status: AgentStatus;
  currentLoad: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  issues: string[];
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  targetAgents: number;
  reason: string;
  estimatedImpact: number;
  confidence: number;
}

export interface OptimizationSuggestion {
  type: 'task_distribution' | 'agent_allocation' | 'workflow_optimization' | 'resource_tuning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedBenefit: number;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

export interface SubAgentCoordinator {
  delegateTasks(request: DelegationRequest): Promise<DelegationResult>;
  assignTask(task: SubAgentTask): Promise<TaskExecution>;
  monitorTaskProgress(taskId: string): Promise<TaskExecution>;
  aggregateResults(taskResults: TaskExecution[], rules: AggregationRules): Promise<any>;
  registerAgent(agent: SubAgent): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  balanceLoad(tasks: SubAgentTask[]): Promise<LoadBalancingResult[]>;
  scaleAgents(demand: number): Promise<ScalingDecision>;
  optimizePerformance(): Promise<OptimizationSuggestion[]>;
  getAgentHealth(agentId?: string): Promise<AgentHealthStatus[]>;
}

export class SubAgentCoordinatorImpl extends EventEmitter implements SubAgentCoordinator {
  private agents: Map<string, SubAgent> = new Map();
  private activeTasks: Map<string, TaskExecution> = new Map();
  private activeDelegations: Map<string, DelegationExecution> = new Map();
  private messageRouter: MessageRouter;
  private maxConcurrentTasks: number = 1000;
  private healthCheckInterval: number = 30000; // 30 seconds
  private taskTimeout: number = 300000; // 5 minutes
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(messageRouter: MessageRouter, options?: {
    maxConcurrentTasks?: number;
    healthCheckInterval?: number;
    taskTimeout?: number;
  }) {
    super();
    this.messageRouter = messageRouter;
    
    if (options) {
      this.maxConcurrentTasks = options.maxConcurrentTasks ?? this.maxConcurrentTasks;
      this.healthCheckInterval = options.healthCheckInterval ?? this.healthCheckInterval;
      this.taskTimeout = options.taskTimeout ?? this.taskTimeout;
    }

    this.startHealthChecking();
  }

  async delegateTasks(request: DelegationRequest): Promise<DelegationResult> {
    const startTime = performance.now();
    
    try {
      // Validate delegation request
      const validation = await this.validateDelegationRequest(request);
      if (!validation.valid) {
        throw new Error(`Delegation validation failed: ${validation.reason}`);
      }

      // Create delegation execution context
      const delegationExecution: DelegationExecution = {
        delegationId: request.delegationId,
        tasks: request.tasks,
        strategy: request.strategy,
        aggregationRules: request.aggregationRules,
        status: 'in_progress',
        startTime: new Date(),
        taskExecutions: new Map(),
        completedTasks: 0,
        failedTasks: 0
      };

      this.activeDelegations.set(request.delegationId, delegationExecution);

      // Execute delegation strategy
      const taskResults = await this.executeDelegationStrategy(delegationExecution);

      // Aggregate results
      const aggregatedResult = await this.aggregateResults(taskResults, request.aggregationRules);

      // Calculate metrics
      const duration = performance.now() - startTime;
      const metrics = await this.calculateDelegationMetrics(taskResults, duration);

      // Clean up
      this.activeDelegations.delete(request.delegationId);

      this.emit('delegationCompleted', {
        delegationId: request.delegationId,
        totalTasks: request.tasks.length,
        duration,
        success: true
      });

      return {
        delegationId: request.delegationId,
        success: true,
        totalTasks: request.tasks.length,
        completedTasks: taskResults.filter(t => t.status === TaskStatus.Completed).length,
        failedTasks: taskResults.filter(t => t.status === TaskStatus.Failed).length,
        aggregatedResult,
        duration,
        taskResults,
        metrics
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.emit('delegationFailed', {
        delegationId: request.delegationId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      return {
        delegationId: request.delegationId,
        success: false,
        totalTasks: request.tasks.length,
        completedTasks: 0,
        failedTasks: request.tasks.length,
        aggregatedResult: null,
        duration,
        taskResults: [],
        metrics: this.createEmptyMetrics()
      };
    }
  }

  async assignTask(task: SubAgentTask): Promise<TaskExecution> {
    try {
      // Find suitable agent
      const selectedAgent = await this.selectAgentForTask(task);
      if (!selectedAgent) {
        throw new Error(`No suitable agent found for task ${task.taskId}`);
      }

      // Create task execution
      const taskExecution: TaskExecution = {
        taskId: task.taskId,
        agentId: selectedAgent.agentId,
        status: TaskStatus.Assigned,
        startTime: new Date()
      };

      this.activeTasks.set(task.taskId, taskExecution);

      // Update agent status
      selectedAgent.currentTasks.push(task.taskId);
      if (selectedAgent.currentTasks.length >= selectedAgent.maxConcurrentTasks) {
        selectedAgent.status = AgentStatus.Busy;
      }

      // Send task to agent
      await this.sendTaskToAgent(task, selectedAgent);

      // Update task status
      taskExecution.status = TaskStatus.InProgress;

      this.emit('taskAssigned', {
        taskId: task.taskId,
        agentId: selectedAgent.agentId
      });

      return taskExecution;
    } catch (error) {
      const taskExecution: TaskExecution = {
        taskId: task.taskId,
        agentId: '',
        status: TaskStatus.Failed,
        error: error instanceof Error ? error.message : String(error)
      };

      this.activeTasks.set(task.taskId, taskExecution);
      return taskExecution;
    }
  }

  async monitorTaskProgress(taskId: string): Promise<TaskExecution> {
    const taskExecution = this.activeTasks.get(taskId);
    if (!taskExecution) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check if task has timed out
    if (taskExecution.startTime) {
      const elapsed = Date.now() - taskExecution.startTime.getTime();
      if (elapsed > this.taskTimeout && taskExecution.status === TaskStatus.InProgress) {
        taskExecution.status = TaskStatus.Timeout;
        taskExecution.endTime = new Date();
        taskExecution.error = 'Task timeout';
        
        // Clean up agent assignment
        await this.cleanupTaskAssignment(taskId, taskExecution.agentId);
      }
    }

    return taskExecution;
  }

  async aggregateResults(taskResults: TaskExecution[], rules: AggregationRules): Promise<any> {
    const successfulResults = taskResults.filter(
      result => result.status === TaskStatus.Completed && result.result
    );

    if (successfulResults.length === 0) {
      throw new Error('No successful task results to aggregate');
    }

    switch (rules.method) {
      case 'merge':
        return this.mergeResults(successfulResults.map(r => r.result));
        
      case 'select_best':
        return this.selectBestResult(successfulResults, rules);
        
      case 'vote':
        return this.voteOnResults(successfulResults, rules);
        
      case 'weighted_average':
        return this.weightedAverageResults(successfulResults, rules);
        
      case 'custom':
        return this.customAggregation(successfulResults, rules);
        
      default:
        return this.mergeResults(successfulResults.map(r => r.result));
    }
  }

  async registerAgent(agent: SubAgent): Promise<void> {
    // Validate agent
    const validation = await this.validateAgent(agent);
    if (!validation.valid) {
      throw new Error(`Agent validation failed: ${validation.reason}`);
    }

    // Register agent
    this.agents.set(agent.agentId, {
      ...agent,
      status: AgentStatus.Available,
      currentTasks: [],
      lastHeartbeat: new Date()
    });

    this.emit('agentRegistered', {
      agentId: agent.agentId,
      capabilities: agent.capabilities,
      maxConcurrentTasks: agent.maxConcurrentTasks
    });
  }

  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Reassign active tasks
    for (const taskId of agent.currentTasks) {
      await this.reassignTask(taskId);
    }

    // Remove agent
    this.agents.delete(agentId);

    this.emit('agentUnregistered', { agentId });
  }

  async balanceLoad(tasks: SubAgentTask[]): Promise<LoadBalancingResult[]> {
    const results: LoadBalancingResult[] = [];
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status !== AgentStatus.Offline);

    for (const task of tasks) {
      const balancingResult = await this.balanceTaskLoad(task, availableAgents);
      results.push(balancingResult);
    }

    return results;
  }

  async scaleAgents(demand: number): Promise<ScalingDecision> {
    const currentAgents = this.agents.size;
    const activeTasks = this.activeTasks.size;
    const avgTasksPerAgent = activeTasks / Math.max(currentAgents, 1);
    
    // Calculate scaling need
    const utilizationRate = activeTasks / (currentAgents * 10); // Assume 10 tasks per agent capacity
    
    if (utilizationRate > 0.8) {
      const targetAgents = Math.ceil(demand / 8); // Target 80% utilization
      return {
        action: 'scale_up',
        targetAgents,
        reason: 'High utilization detected',
        estimatedImpact: 25,
        confidence: 85
      };
    } else if (utilizationRate < 0.3 && currentAgents > 1) {
      const targetAgents = Math.max(1, Math.floor(demand / 3));
      return {
        action: 'scale_down',
        targetAgents,
        reason: 'Low utilization detected',
        estimatedImpact: 15,
        confidence: 75
      };
    }

    return {
      action: 'maintain',
      targetAgents: currentAgents,
      reason: 'Optimal utilization',
      estimatedImpact: 0,
      confidence: 90
    };
  }

  async optimizePerformance(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze task distribution patterns
    const distributionAnalysis = await this.analyzeTaskDistribution();
    if (distributionAnalysis.imbalance > 0.3) {
      suggestions.push({
        type: 'task_distribution',
        priority: 'high',
        description: 'Implement better load balancing to reduce task distribution imbalance',
        expectedBenefit: 25,
        implementation: 'Adjust load balancing algorithm weights',
        effort: 'medium'
      });
    }

    // Analyze agent performance
    const performanceAnalysis = await this.analyzeAgentPerformance();
    if (performanceAnalysis.underperformingAgents.length > 0) {
      suggestions.push({
        type: 'agent_allocation',
        priority: 'medium',
        description: 'Optimize agent allocation based on performance metrics',
        expectedBenefit: 20,
        implementation: 'Reassign tasks from underperforming agents',
        effort: 'low'
      });
    }

    // Analyze workflow efficiency
    const workflowAnalysis = await this.analyzeWorkflowEfficiency();
    if (workflowAnalysis.bottlenecks.length > 0) {
      suggestions.push({
        type: 'workflow_optimization',
        priority: 'high',
        description: 'Address workflow bottlenecks to improve overall efficiency',
        expectedBenefit: 35,
        implementation: 'Optimize task dependencies and parallelization',
        effort: 'high'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async getAgentHealth(agentId?: string): Promise<AgentHealthStatus[]> {
    const agents = agentId 
      ? [this.agents.get(agentId)].filter(Boolean) as SubAgent[]
      : Array.from(this.agents.values());

    const healthStatuses: AgentHealthStatus[] = [];

    for (const agent of agents) {
      const health = await this.checkAgentHealth(agent);
      healthStatuses.push(health);
    }

    return healthStatuses;
  }

  private async validateDelegationRequest(request: DelegationRequest): Promise<{ valid: boolean; reason?: string }> {
    if (!request.delegationId) {
      return { valid: false, reason: 'Missing delegation ID' };
    }

    if (!request.tasks || request.tasks.length === 0) {
      return { valid: false, reason: 'No tasks specified' };
    }

    if (request.tasks.length > this.maxConcurrentTasks) {
      return { valid: false, reason: 'Too many tasks for current capacity' };
    }

    return { valid: true };
  }

  private async executeDelegationStrategy(delegation: DelegationExecution): Promise<TaskExecution[]> {
    const { strategy, tasks } = delegation;

    switch (strategy.type) {
      case 'parallel':
        return await this.executeParallelTasks(tasks);
        
      case 'sequential':
        return await this.executeSequentialTasks(tasks);
        
      case 'pipeline':
        return await this.executePipelineTasks(tasks);
        
      case 'adaptive':
        return await this.executeAdaptiveTasks(tasks);
        
      default:
        return await this.executeParallelTasks(tasks);
    }
  }

  private async executeParallelTasks(tasks: SubAgentTask[]): Promise<TaskExecution[]> {
    const taskPromises = tasks.map(task => this.assignTask(task));
    const taskExecutions = await Promise.all(taskPromises);

    // Wait for all tasks to complete
    while (taskExecutions.some(te => te.status === TaskStatus.InProgress || te.status === TaskStatus.Assigned)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update task statuses
      for (const taskExecution of taskExecutions) {
        if (taskExecution.status === TaskStatus.InProgress || taskExecution.status === TaskStatus.Assigned) {
          const updated = await this.monitorTaskProgress(taskExecution.taskId);
          Object.assign(taskExecution, updated);
        }
      }
    }

    return taskExecutions;
  }

  private async executeSequentialTasks(tasks: SubAgentTask[]): Promise<TaskExecution[]> {
    const results: TaskExecution[] = [];

    for (const task of tasks) {
      const execution = await this.assignTask(task);
      
      // Wait for task completion
      while (execution.status === TaskStatus.InProgress || execution.status === TaskStatus.Assigned) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updated = await this.monitorTaskProgress(execution.taskId);
        Object.assign(execution, updated);
      }

      results.push(execution);

      // Stop if task failed and strategy requires it
      if (execution.status === TaskStatus.Failed) {
        // Handle based on failure handling strategy
        break;
      }
    }

    return results;
  }

  private async executePipelineTasks(tasks: SubAgentTask[]): Promise<TaskExecution[]> {
    // Implement pipeline execution where output of one task becomes input of next
    const results: TaskExecution[] = [];
    let pipelineData: any = null;

    for (const task of tasks) {
      // Modify task input with pipeline data
      if (pipelineData) {
        task.input = { ...task.input, pipelineInput: pipelineData };
      }

      const execution = await this.assignTask(task);
      
      // Wait for completion
      while (execution.status === TaskStatus.InProgress || execution.status === TaskStatus.Assigned) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updated = await this.monitorTaskProgress(execution.taskId);
        Object.assign(execution, updated);
      }

      results.push(execution);

      if (execution.status === TaskStatus.Completed && execution.result) {
        pipelineData = execution.result;
      } else {
        break; // Pipeline broken
      }
    }

    return results;
  }

  private async executeAdaptiveTasks(tasks: SubAgentTask[]): Promise<TaskExecution[]> {
    // Adaptive execution based on current system state
    const systemLoad = this.calculateSystemLoad();
    
    if (systemLoad > 0.8) {
      // High load - use sequential execution
      return await this.executeSequentialTasks(tasks);
    } else {
      // Normal load - use parallel execution
      return await this.executeParallelTasks(tasks);
    }
  }

  private calculateSystemLoad(): number {
    const totalTasks = this.activeTasks.size;
    const totalCapacity = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.maxConcurrentTasks, 0);
    
    return totalCapacity > 0 ? totalTasks / totalCapacity : 0;
  }

  private async selectAgentForTask(task: SubAgentTask): Promise<SubAgent | null> {
    const availableAgents = Array.from(this.agents.values()).filter(agent => 
      agent.status === AgentStatus.Available || 
      (agent.status === AgentStatus.Busy && agent.currentTasks.length < agent.maxConcurrentTasks)
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Filter by capabilities
    const capableAgents = availableAgents.filter(agent =>
      task.operation in agent.capabilities || agent.capabilities.includes('*')
    );

    if (capableAgents.length === 0) {
      return null;
    }

    // Select based on performance and load
    return capableAgents.reduce((best, current) => {
      const bestScore = this.calculateAgentScore(best, task);
      const currentScore = this.calculateAgentScore(current, task);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateAgentScore(agent: SubAgent, task: SubAgentTask): number {
    const loadFactor = 1 - (agent.currentTasks.length / agent.maxConcurrentTasks);
    const performanceFactor = agent.performance.efficiency / 100;
    const capabilityMatch = agent.specializations.includes(task.operation) ? 1.2 : 1.0;
    
    return loadFactor * performanceFactor * capabilityMatch;
  }

  private async sendTaskToAgent(task: SubAgentTask, agent: SubAgent): Promise<void> {
    const message: BaseMessage = {
      header: {
        messageId: this.generateMessageId(),
        correlationId: task.taskId,
        source: 'sub_agent_coordinator',
        target: agent.serverId,
        operation: 'execute_task',
        messageType: MessageType.SubAgentDelegation,
        priority: this.mapTaskPriorityToMessagePriority(task.priority),
        context: {} as SuperClaudeContext
      },
      payload: {
        data: {
          taskId: task.taskId,
          agentId: agent.agentId,
          operation: task.operation,
          input: task.input,
          timeout: task.timeout,
          expectedOutput: task.expectedOutput
        }
      },
      metadata: {
        timestamp: new Date(),
        ttl: task.timeout,
        retryCount: 0,
        routingHints: [{ hint: 'sub_agent_task', value: agent.agentId }],
        performanceHints: [{ hint: 'priority', value: task.priority.toString() }],
        securityContext: {}
      }
    };

    await this.messageRouter.routeMessage(message);
  }

  private mapTaskPriorityToMessagePriority(taskPriority: TaskPriority): MessagePriority {
    switch (taskPriority) {
      case TaskPriority.Critical: return MessagePriority.Critical;
      case TaskPriority.High: return MessagePriority.High;
      case TaskPriority.Normal: return MessagePriority.Normal;
      case TaskPriority.Low: return MessagePriority.Low;
      case TaskPriority.Background: return MessagePriority.Background;
      default: return MessagePriority.Normal;
    }
  }

  private async cleanupTaskAssignment(taskId: string, agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      const taskIndex = agent.currentTasks.indexOf(taskId);
      if (taskIndex > -1) {
        agent.currentTasks.splice(taskIndex, 1);
      }
      
      // Update agent status
      if (agent.currentTasks.length === 0) {
        agent.status = AgentStatus.Available;
      }
    }
  }

  private async reassignTask(taskId: string): Promise<void> {
    const taskExecution = this.activeTasks.get(taskId);
    if (!taskExecution) return;

    // Create new task from execution
    const task: SubAgentTask = {
      taskId,
      agentId: '',
      operation: 'reassigned_task',
      input: {},
      priority: TaskPriority.High,
      timeout: this.taskTimeout,
      dependencies: [],
      retries: 0,
      maxRetries: 3
    };

    await this.assignTask(task);
  }

  private async balanceTaskLoad(task: SubAgentTask, availableAgents: SubAgent[]): Promise<LoadBalancingResult> {
    if (availableAgents.length === 0) {
      throw new Error('No available agents for load balancing');
    }

    // Calculate load for each agent
    const agentLoads = availableAgents.map(agent => ({
      agentId: agent.agentId,
      load: agent.currentTasks.length / agent.maxConcurrentTasks
    }));

    // Select least loaded agent
    const selectedAgent = agentLoads.reduce((best, current) => 
      current.load < best.load ? current : best
    );

    const loadDistribution: Record<string, number> = {};
    agentLoads.forEach(({ agentId, load }) => {
      loadDistribution[agentId] = load;
    });

    return {
      selectedAgent: selectedAgent.agentId,
      loadDistribution,
      balancingReason: 'least_loaded',
      alternatives: agentLoads
        .filter(agent => agent.agentId !== selectedAgent.agentId)
        .sort((a, b) => a.load - b.load)
        .slice(0, 3)
        .map(agent => agent.agentId)
    };
  }

  private mergeResults(results: any[]): any {
    // Simple merge strategy
    return results.reduce((merged, result) => {
      if (typeof result === 'object' && result !== null) {
        return { ...merged, ...result };
      }
      return merged;
    }, {});
  }

  private selectBestResult(results: TaskExecution[], rules: AggregationRules): any {
    // Select result with highest quality score
    const bestResult = results.reduce((best, current) => {
      const bestScore = best.metrics?.qualityScore || 0;
      const currentScore = current.metrics?.qualityScore || 0;
      return currentScore > bestScore ? current : best;
    });

    return bestResult.result;
  }

  private voteOnResults(results: TaskExecution[], rules: AggregationRules): any {
    // Implement voting mechanism
    const votes: Map<string, number> = new Map();
    
    results.forEach(result => {
      const key = JSON.stringify(result.result);
      votes.set(key, (votes.get(key) || 0) + 1);
    });

    const winner = Array.from(votes.entries())
      .reduce((best, current) => current[1] > best[1] ? current : best);

    return JSON.parse(winner[0]);
  }

  private weightedAverageResults(results: TaskExecution[], rules: AggregationRules): any {
    // Implement weighted average based on quality scores
    let totalWeight = 0;
    const weightedSum: any = {};

    results.forEach(result => {
      const weight = result.metrics?.qualityScore || 1;
      totalWeight += weight;
      
      // Add weighted values
      if (typeof result.result === 'object') {
        Object.entries(result.result).forEach(([key, value]) => {
          if (typeof value === 'number') {
            weightedSum[key] = (weightedSum[key] || 0) + (value * weight);
          }
        });
      }
    });

    // Calculate averages
    const averagedResult: any = {};
    Object.entries(weightedSum).forEach(([key, sum]) => {
      averagedResult[key] = (sum as number) / totalWeight;
    });

    return averagedResult;
  }

  private customAggregation(results: TaskExecution[], rules: AggregationRules): any {
    // Implement custom aggregation logic based on rules
    return this.mergeResults(results.map(r => r.result));
  }

  private async calculateDelegationMetrics(taskResults: TaskExecution[], duration: number): Promise<DelegationMetrics> {
    const completedTasks = taskResults.filter(t => t.status === TaskStatus.Completed);
    const totalExecutionTime = completedTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    const averageTaskTime = completedTasks.length > 0 ? totalExecutionTime / completedTasks.length : 0;

    const agentUtilization: Record<string, number> = {};
    taskResults.forEach(task => {
      if (task.agentId) {
        agentUtilization[task.agentId] = (agentUtilization[task.agentId] || 0) + 1;
      }
    });

    return {
      totalExecutionTime,
      averageTaskTime,
      parallelEfficiency: this.calculateParallelEfficiency(taskResults, duration),
      resourceUtilization: await this.calculateResourceUtilization(),
      qualityMetrics: await this.calculateQualityMetrics(taskResults),
      agentUtilization
    };
  }

  private calculateParallelEfficiency(taskResults: TaskExecution[], totalDuration: number): number {
    const serialTime = taskResults.reduce((sum, task) => sum + (task.duration || 0), 0);
    return totalDuration > 0 ? Math.min(100, (serialTime / totalDuration) * 100) : 0;
  }

  private async calculateResourceUtilization(): Promise<ResourceUtilization> {
    // Placeholder implementation
    return {
      cpu: 65,
      memory: 70,
      network: 45,
      storage: 30
    };
  }

  private async calculateQualityMetrics(taskResults: TaskExecution[]): Promise<QualityMetrics> {
    const completedTasks = taskResults.filter(t => t.status === TaskStatus.Completed);
    
    if (completedTasks.length === 0) {
      return {
        accuracy: 0,
        completeness: 0,
        consistency: 0,
        relevance: 0,
        confidence: 0
      };
    }

    const avgAccuracy = completedTasks.reduce((sum, task) => 
      sum + (task.metrics?.accuracy || 0), 0) / completedTasks.length;
    
    const avgCompleteness = completedTasks.reduce((sum, task) => 
      sum + (task.metrics?.completeness || 0), 0) / completedTasks.length;

    return {
      accuracy: avgAccuracy,
      completeness: avgCompleteness,
      consistency: 85, // Placeholder
      relevance: 90, // Placeholder  
      confidence: 80 // Placeholder
    };
  }

  private createEmptyMetrics(): DelegationMetrics {
    return {
      totalExecutionTime: 0,
      averageTaskTime: 0,
      parallelEfficiency: 0,
      resourceUtilization: { cpu: 0, memory: 0, network: 0, storage: 0 },
      qualityMetrics: { accuracy: 0, completeness: 0, consistency: 0, relevance: 0, confidence: 0 },
      agentUtilization: {}
    };
  }

  private async validateAgent(agent: SubAgent): Promise<{ valid: boolean; reason?: string }> {
    if (!agent.agentId) {
      return { valid: false, reason: 'Missing agent ID' };
    }

    if (!agent.serverId) {
      return { valid: false, reason: 'Missing server ID' };
    }

    if (!agent.capabilities || agent.capabilities.length === 0) {
      return { valid: false, reason: 'No capabilities specified' };
    }

    return { valid: true };
  }

  private async analyzeTaskDistribution(): Promise<{ imbalance: number }> {
    const agentLoads = Array.from(this.agents.values()).map(agent => 
      agent.currentTasks.length / agent.maxConcurrentTasks
    );

    if (agentLoads.length === 0) return { imbalance: 0 };

    const avg = agentLoads.reduce((sum, load) => sum + load, 0) / agentLoads.length;
    const variance = agentLoads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / agentLoads.length;
    
    return { imbalance: Math.sqrt(variance) };
  }

  private async analyzeAgentPerformance(): Promise<{ underperformingAgents: string[] }> {
    const underperforming: string[] = [];
    
    for (const agent of this.agents.values()) {
      if (agent.performance.efficiency < 70 || agent.performance.errorRate > 0.1) {
        underperforming.push(agent.agentId);
      }
    }

    return { underperformingAgents: underperforming };
  }

  private async analyzeWorkflowEfficiency(): Promise<{ bottlenecks: string[] }> {
    // Analyze workflow patterns to identify bottlenecks
    return { bottlenecks: [] };
  }

  private async checkAgentHealth(agent: SubAgent): Promise<AgentHealthStatus> {
    const currentLoad = agent.currentTasks.length / agent.maxConcurrentTasks;
    const issues: string[] = [];

    if (currentLoad > 0.9) {
      issues.push('High load');
    }

    if (agent.performance.errorRate > 0.1) {
      issues.push('High error rate');
    }

    const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
    if (timeSinceHeartbeat > this.healthCheckInterval * 2) {
      issues.push('Missed heartbeat');
    }

    return {
      agentId: agent.agentId,
      status: agent.status,
      currentLoad,
      responseTime: agent.performance.averageExecutionTime,
      errorRate: agent.performance.errorRate,
      lastCheck: new Date(),
      issues
    };
  }

  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(async () => {
      for (const agent of this.agents.values()) {
        try {
          const health = await this.checkAgentHealth(agent);
          if (health.issues.length > 0) {
            this.emit('agentHealthIssue', health);
          }
        } catch (error) {
          console.error(`Health check failed for agent ${agent.agentId}:`, error);
        }
      }
    }, this.healthCheckInterval);
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    this.agents.clear();
    this.activeTasks.clear();
    this.activeDelegations.clear();
    this.removeAllListeners();
  }
}

interface DelegationExecution {
  delegationId: string;
  tasks: SubAgentTask[];
  strategy: DelegationStrategy;
  aggregationRules: AggregationRules;
  status: 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  taskExecutions: Map<string, TaskExecution>;
  completedTasks: number;
  failedTasks: number;
}