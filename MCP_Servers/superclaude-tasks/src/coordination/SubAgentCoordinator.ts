// SuperClaude Tasks Server - Sub-Agent Coordinator
// Task distribution and parallel execution coordination

import {
  AgentId,
  SubAgentInfo,
  AgentPerformanceMetrics,
  DistributionStrategy,
  DistributionPlan,
  SubTaskDistribution,
  ResourceAllocation,
  FallbackPlan,
  FallbackAction,
  WorkflowExecution,
  WorkflowResult,
  WorkflowError,
  CoordinationMetrics,
  DistributeToSubAgentsRequest,
  DistributeToSubAgentsResult,
  Task,
  ValidationError
} from '../types/working.js';
import { SimpleLogger } from '../core/SimpleStubs.js';
import { v4 as uuid } from 'uuid';

export class SubAgentCoordinator {
  private logger: SimpleLogger;
  private agents: Map<AgentId, SubAgentInfo> = new Map();
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();
  private coordinationMetrics: CoordinationMetrics;
  private maxConcurrency: number;
  private heartbeatInterval: number;

  constructor(maxConcurrency: number = 10, heartbeatInterval: number = 30000) {
    this.logger = new SimpleLogger();
    this.maxConcurrency = maxConcurrency;
    this.heartbeatInterval = heartbeatInterval;
    this.coordinationMetrics = this.initializeMetrics();
    this.startHeartbeatMonitor();
  }

  // Register a new sub-agent
  async registerAgent(agentInfo: Omit<SubAgentInfo, 'lastHeartbeat'>): Promise<void> {
    try {
      const agent: SubAgentInfo = {
        ...agentInfo,
        lastHeartbeat: new Date()
      };

      this.agents.set(agent.id, agent);
      this.logger.info(`Registered sub-agent: ${agent.name} (${agent.id})`);
    } catch (error) {
      this.logger.error(`Failed to register agent ${agentInfo.id}:`, error);
      throw new ValidationError(`Failed to register agent: ${(error as Error).message}`);
    }
  }

  // Unregister a sub-agent
  async unregisterAgent(agentId: AgentId): Promise<void> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new ValidationError(`Agent not found: ${agentId}`);
      }

      // Cancel any active tasks for this agent
      await this.cancelAgentTasks(agentId);
      
      this.agents.delete(agentId);
      this.logger.info(`Unregistered sub-agent: ${agentId}`);
    } catch (error) {
      this.logger.error(`Failed to unregister agent ${agentId}:`, error);
      throw new ValidationError(`Failed to unregister agent: ${(error as Error).message}`);
    }
  }

  // Update agent status
  async updateAgentStatus(agentId: AgentId, status: SubAgentInfo['status']): Promise<void> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new ValidationError(`Agent not found: ${agentId}`);
      }

      agent.status = status;
      agent.lastHeartbeat = new Date();
      this.agents.set(agentId, agent);
      
      this.logger.info(`Updated agent ${agentId} status to: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update agent status ${agentId}:`, error);
      throw new ValidationError(`Failed to update agent status: ${(error as Error).message}`);
    }
  }

  // Get available agents
  getAvailableAgents(): SubAgentInfo[] {
    const now = new Date();
    const heartbeatTimeout = this.heartbeatInterval * 2;

    return Array.from(this.agents.values()).filter(agent => {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
      return agent.status === 'idle' && timeSinceHeartbeat < heartbeatTimeout;
    });
  }

  // Get agents by capability
  getAgentsByCapability(capability: string): SubAgentInfo[] {
    return this.getAvailableAgents().filter(agent => 
      agent.capabilities.includes(capability)
    );
  }

  // Distribute task to sub-agents
  async distributeTask(request: DistributeToSubAgentsRequest): Promise<DistributeToSubAgentsResult> {
    try {
      this.logger.info(`Distributing task ${request.taskId} with strategy: ${request.strategy.type}`);

      // Create distribution plan
      const distributionPlan = await this.createDistributionPlan(request);
      
      // Create workflow execution
      const workflowExecution = await this.createWorkflowExecution(distributionPlan);
      
      // Update coordination metrics
      this.updateCoordinationMetrics(distributionPlan);
      
      // Start workflow execution
      await this.startWorkflowExecution(workflowExecution);

      return {
        distributionPlan,
        workflowExecution,
        coordinationMetrics: { ...this.coordinationMetrics },
        estimatedCompletion: distributionPlan.estimatedCompletion
      };
    } catch (error) {
      this.logger.error(`Failed to distribute task ${request.taskId}:`, error);
      throw new ValidationError(`Failed to distribute task: ${(error as Error).message}`);
    }
  }

  // Create distribution plan
  private async createDistributionPlan(request: DistributeToSubAgentsRequest): Promise<DistributionPlan> {
    const { taskId, strategy, agents: requestedAgents, priority = 5, deadline } = request;
    
    // Select agents based on strategy
    const availableAgents = requestedAgents 
      ? this.agents.get(requestedAgents[0]) ? [this.agents.get(requestedAgents[0])!] : []
      : this.selectAgentsByStrategy(strategy);

    if (availableAgents.length === 0) {
      throw new ValidationError('No available agents for task distribution');
    }

    // Create subtask distributions
    const subTasks = await this.createSubTaskDistributions(
      taskId, 
      availableAgents, 
      strategy, 
      priority, 
      deadline
    );

    // Create resource allocations
    const resourceAllocation = this.createResourceAllocations(availableAgents, strategy);

    // Create fallback plan
    const fallbackPlan = this.createFallbackPlan(strategy);

    // Calculate estimated completion
    const estimatedCompletion = this.calculateEstimatedCompletion(subTasks, deadline);

    return {
      taskId,
      subTasks,
      estimatedCompletion,
      resourceAllocation,
      fallbackPlan
    };
  }

  // Select agents by strategy
  private selectAgentsByStrategy(strategy: DistributionStrategy): SubAgentInfo[] {
    const availableAgents = this.getAvailableAgents();
    const maxAgents = Math.min(strategy.maxConcurrency, availableAgents.length);

    switch (strategy.type) {
      case 'capabilities':
        return this.selectByCapabilities(availableAgents, strategy.specialization, maxAgents);
      case 'files':
      case 'folders':
      case 'tasks':
        return this.selectByLoadBalancing(availableAgents, strategy.loadBalancing, maxAgents);
      case 'auto':
        return this.selectByAutoStrategy(availableAgents, strategy, maxAgents);
      default:
        return availableAgents.slice(0, maxAgents);
    }
  }

  // Select agents by capabilities
  private selectByCapabilities(
    agents: SubAgentInfo[], 
    capabilities: string[], 
    maxAgents: number
  ): SubAgentInfo[] {
    if (capabilities.length === 0) {
      return agents.slice(0, maxAgents);
    }

    const scored = agents.map(agent => ({
      agent,
      score: capabilities.reduce((score, cap) => 
        score + (agent.capabilities.includes(cap) ? 1 : 0), 0)
    })).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, maxAgents).map(item => item.agent);
  }

  // Select agents by load balancing
  private selectByLoadBalancing(
    agents: SubAgentInfo[], 
    loadBalancing: boolean, 
    maxAgents: number
  ): SubAgentInfo[] {
    if (!loadBalancing) {
      return agents.slice(0, maxAgents);
    }

    // Sort by load (lower is better)
    const sortedByLoad = agents.sort((a, b) => 
      a.performanceMetrics.loadAverage - b.performanceMetrics.loadAverage
    );

    return sortedByLoad.slice(0, maxAgents);
  }

  // Select agents by auto strategy
  private selectByAutoStrategy(
    agents: SubAgentInfo[], 
    strategy: DistributionStrategy, 
    maxAgents: number
  ): SubAgentInfo[] {
    // Auto strategy combines performance and capabilities
    const scored = agents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, strategy)
    })).sort((a, b) => b.score - a.score);

    return scored.slice(0, maxAgents).map(item => item.agent);
  }

  // Calculate agent score for auto strategy
  private calculateAgentScore(agent: SubAgentInfo, strategy: DistributionStrategy): number {
    const performance = agent.performanceMetrics;
    const capabilityScore = strategy.specialization.reduce((score, cap) => 
      score + (agent.capabilities.includes(cap) ? 1 : 0), 0);
    
    return (
      performance.successRate * 0.3 +
      (1 - performance.loadAverage) * 0.3 +
      capabilityScore * 0.2 +
      (performance.averageTaskTime > 0 ? (1 / performance.averageTaskTime) * 0.2 : 0)
    );
  }

  // Create subtask distributions
  private async createSubTaskDistributions(
    taskId: string,
    agents: SubAgentInfo[],
    strategy: DistributionStrategy,
    priority: number,
    deadline?: Date
  ): Promise<SubTaskDistribution[]> {
    const subTasks: SubTaskDistribution[] = [];
    
    // Create subtasks based on strategy
    switch (strategy.type) {
      case 'files':
        // Distribute by file analysis
        for (let i = 0; i < agents.length; i++) {
          subTasks.push({
            subTaskId: `${taskId}_file_${i}`,
            agentId: agents[i].id,
            estimatedEffort: 2, // 2 hours default
            priority,
            dependencies: [],
            deadline
          });
        }
        break;
      
      case 'folders':
        // Distribute by folder analysis
        for (let i = 0; i < agents.length; i++) {
          subTasks.push({
            subTaskId: `${taskId}_folder_${i}`,
            agentId: agents[i].id,
            estimatedEffort: 4, // 4 hours default
            priority,
            dependencies: [],
            deadline
          });
        }
        break;
      
      case 'tasks':
        // Distribute by task decomposition
        for (let i = 0; i < agents.length; i++) {
          subTasks.push({
            subTaskId: `${taskId}_task_${i}`,
            agentId: agents[i].id,
            estimatedEffort: 6, // 6 hours default
            priority,
            dependencies: i > 0 ? [`${taskId}_task_${i-1}`] : [],
            deadline
          });
        }
        break;
      
      case 'capabilities':
        // Distribute by capabilities
        for (let i = 0; i < agents.length; i++) {
          subTasks.push({
            subTaskId: `${taskId}_capability_${i}`,
            agentId: agents[i].id,
            estimatedEffort: 3, // 3 hours default
            priority,
            dependencies: [],
            deadline
          });
        }
        break;
      
      case 'auto':
        // Auto distribution based on agent performance
        for (let i = 0; i < agents.length; i++) {
          const estimatedEffort = this.calculateAutoEffort(agents[i]);
          subTasks.push({
            subTaskId: `${taskId}_auto_${i}`,
            agentId: agents[i].id,
            estimatedEffort,
            priority,
            dependencies: [],
            deadline
          });
        }
        break;
    }

    return subTasks;
  }

  // Calculate auto effort based on agent performance
  private calculateAutoEffort(agent: SubAgentInfo): number {
    const base = 4; // 4 hours base
    const performance = agent.performanceMetrics;
    
    // Adjust based on agent performance
    const multiplier = performance.successRate > 0.8 ? 0.8 : 1.2;
    return Math.max(1, base * multiplier);
  }

  // Create resource allocations
  private createResourceAllocations(
    agents: SubAgentInfo[],
    strategy: DistributionStrategy
  ): ResourceAllocation[] {
    const allocations: ResourceAllocation[] = [];
    
    agents.forEach(agent => {
      // CPU allocation
      allocations.push({
        agentId: agent.id,
        resourceType: 'cpu',
        allocated: strategy.maxConcurrency <= 5 ? 80 : 60,
        maximum: 100,
        unit: 'percent'
      });

      // Memory allocation
      allocations.push({
        agentId: agent.id,
        resourceType: 'memory',
        allocated: strategy.maxConcurrency <= 5 ? 4 : 2,
        maximum: 8,
        unit: 'GB'
      });
    });

    return allocations;
  }

  // Create fallback plan
  private createFallbackPlan(strategy: DistributionStrategy): FallbackPlan {
    const triggers = ['agent_timeout', 'agent_failure', 'resource_exhaustion'];
    
    const actions: FallbackAction[] = [
      {
        type: 'redistribute',
        parameters: { 
          redistributionStrategy: strategy.type,
          maxRetries: 2
        },
        condition: 'agent_timeout OR agent_failure'
      },
      {
        type: 'retry',
        parameters: { 
          retryDelay: 5000,
          maxRetries: 3
        },
        condition: 'temporary_failure'
      },
      {
        type: 'escalate',
        parameters: { 
          escalationLevel: 'coordinator',
          notifyTimeout: 60000
        },
        condition: 'max_retries_exceeded'
      }
    ];

    return {
      triggers,
      actions,
      maxRetries: 3,
      timeoutMs: strategy.timeout || 300000 // 5 minutes default
    };
  }

  // Calculate estimated completion time
  private calculateEstimatedCompletion(
    subTasks: SubTaskDistribution[], 
    deadline?: Date
  ): Date {
    if (deadline) {
      return deadline;
    }

    // Calculate based on estimated effort
    const maxEffort = Math.max(...subTasks.map(st => st.estimatedEffort));
    const estimatedHours = maxEffort * 1.2; // Add 20% buffer
    
    return new Date(Date.now() + estimatedHours * 60 * 60 * 1000);
  }

  // Create workflow execution
  private async createWorkflowExecution(plan: DistributionPlan): Promise<WorkflowExecution> {
    const workflowId = uuid();
    
    const execution: WorkflowExecution = {
      id: workflowId,
      workflowId: plan.taskId,
      status: 'pending',
      startTime: new Date(),
      progress: 0,
      results: [],
      errors: []
    };

    this.activeWorkflows.set(workflowId, execution);
    return execution;
  }

  // Start workflow execution
  private async startWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    try {
      execution.status = 'running';
      execution.startTime = new Date();
      
      this.logger.info(`Started workflow execution: ${execution.id}`);
      
      // In a real implementation, this would trigger actual agent execution
      // For now, we'll simulate the execution process
      setTimeout(() => {
        this.simulateWorkflowProgress(execution.id);
      }, 1000);
      
    } catch (error) {
      execution.status = 'failed';
      execution.errors.push({
        taskId: execution.workflowId,
        agentId: 'coordinator',
        error: (error as Error).message,
        timestamp: new Date(),
        recoverable: false,
        retryCount: 0
      });
      
      this.logger.error(`Failed to start workflow execution ${execution.id}:`, error);
    }
  }

  // Simulate workflow progress (for demonstration)
  private async simulateWorkflowProgress(workflowId: string): Promise<void> {
    const execution = this.activeWorkflows.get(workflowId);
    if (!execution) return;

    // Simulate progress updates
    const progressSteps = [25, 50, 75, 100];
    
    for (const progress of progressSteps) {
      setTimeout(() => {
        execution.progress = progress;
        
        if (progress === 100) {
          execution.status = 'completed';
          execution.endTime = new Date();
          this.coordinationMetrics.completedTasks++;
          this.coordinationMetrics.totalTasks++;
          this.updateMetricsTimestamp();
        }
        
        this.logger.info(`Workflow ${workflowId} progress: ${progress}%`);
      }, progress * 50); // Simulate time progression
    }
  }

  // Cancel agent tasks
  private async cancelAgentTasks(agentId: AgentId): Promise<void> {
    for (const [workflowId, execution] of this.activeWorkflows) {
      if (execution.status === 'running') {
        const hasAgentTasks = execution.results.some(result => result.agentId === agentId);
        if (hasAgentTasks) {
          execution.status = 'cancelled';
          execution.endTime = new Date();
          this.logger.info(`Cancelled workflow ${workflowId} due to agent ${agentId} removal`);
        }
      }
    }
  }

  // Update coordination metrics
  private updateCoordinationMetrics(plan: DistributionPlan): void {
    this.coordinationMetrics.totalTasks += plan.subTasks.length;
    this.updateMetricsTimestamp();
  }

  // Update metrics timestamp
  private updateMetricsTimestamp(): void {
    this.coordinationMetrics.lastUpdated = new Date();
  }

  // Get coordination metrics
  getCoordinationMetrics(): CoordinationMetrics {
    return { ...this.coordinationMetrics };
  }

  // Get active workflows
  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values());
  }

  // Get workflow by ID
  getWorkflowExecution(workflowId: string): WorkflowExecution | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  // Initialize metrics
  private initializeMetrics(): CoordinationMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      resourceUtilization: 0,
      agentEfficiency: {},
      throughput: 0,
      lastUpdated: new Date()
    };
  }

  // Start heartbeat monitor
  private startHeartbeatMonitor(): void {
    setInterval(() => {
      this.checkAgentHeartbeats();
    }, this.heartbeatInterval);
  }

  // Check agent heartbeats
  private checkAgentHeartbeats(): void {
    const now = new Date();
    const timeoutThreshold = this.heartbeatInterval * 2;

    for (const [agentId, agent] of this.agents) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > timeoutThreshold && agent.status !== 'offline') {
        agent.status = 'offline';
        this.logger.warn(`Agent ${agentId} marked as offline due to missed heartbeat`);
      }
    }
  }

  // Agent heartbeat
  async agentHeartbeat(agentId: AgentId): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = new Date();
      if (agent.status === 'offline') {
        agent.status = 'idle';
        this.logger.info(`Agent ${agentId} back online`);
      }
    }
  }

  // Shutdown coordinator
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down SubAgent Coordinator');
    
    // Cancel all active workflows
    for (const [workflowId, execution] of this.activeWorkflows) {
      if (execution.status === 'running') {
        execution.status = 'cancelled';
        execution.endTime = new Date();
      }
    }
    
    // Clear agents
    this.agents.clear();
    this.activeWorkflows.clear();
  }
}