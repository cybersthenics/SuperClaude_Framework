// SuperClaude Tasks Server - Sub-Agent Coordinator
// Task distribution and parallel execution coordination
import { ValidationError } from '../types/working.js';
import { SimpleLogger } from '../core/SimpleStubs.js';
import { v4 as uuid } from 'uuid';
export class SubAgentCoordinator {
    constructor(maxConcurrency = 10, heartbeatInterval = 30000) {
        this.agents = new Map();
        this.activeWorkflows = new Map();
        this.logger = new SimpleLogger();
        this.maxConcurrency = maxConcurrency;
        this.heartbeatInterval = heartbeatInterval;
        this.coordinationMetrics = this.initializeMetrics();
        this.startHeartbeatMonitor();
    }
    // Register a new sub-agent
    async registerAgent(agentInfo) {
        try {
            const agent = {
                ...agentInfo,
                lastHeartbeat: new Date()
            };
            this.agents.set(agent.id, agent);
            this.logger.info(`Registered sub-agent: ${agent.name} (${agent.id})`);
        }
        catch (error) {
            this.logger.error(`Failed to register agent ${agentInfo.id}:`, error);
            throw new ValidationError(`Failed to register agent: ${error.message}`);
        }
    }
    // Unregister a sub-agent
    async unregisterAgent(agentId) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                throw new ValidationError(`Agent not found: ${agentId}`);
            }
            // Cancel any active tasks for this agent
            await this.cancelAgentTasks(agentId);
            this.agents.delete(agentId);
            this.logger.info(`Unregistered sub-agent: ${agentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to unregister agent ${agentId}:`, error);
            throw new ValidationError(`Failed to unregister agent: ${error.message}`);
        }
    }
    // Update agent status
    async updateAgentStatus(agentId, status) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                throw new ValidationError(`Agent not found: ${agentId}`);
            }
            agent.status = status;
            agent.lastHeartbeat = new Date();
            this.agents.set(agentId, agent);
            this.logger.info(`Updated agent ${agentId} status to: ${status}`);
        }
        catch (error) {
            this.logger.error(`Failed to update agent status ${agentId}:`, error);
            throw new ValidationError(`Failed to update agent status: ${error.message}`);
        }
    }
    // Get available agents
    getAvailableAgents() {
        const now = new Date();
        const heartbeatTimeout = this.heartbeatInterval * 2;
        return Array.from(this.agents.values()).filter(agent => {
            const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
            return agent.status === 'idle' && timeSinceHeartbeat < heartbeatTimeout;
        });
    }
    // Get agents by capability
    getAgentsByCapability(capability) {
        return this.getAvailableAgents().filter(agent => agent.capabilities.includes(capability));
    }
    // Distribute task to sub-agents
    async distributeTask(request) {
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
        }
        catch (error) {
            this.logger.error(`Failed to distribute task ${request.taskId}:`, error);
            throw new ValidationError(`Failed to distribute task: ${error.message}`);
        }
    }
    // Create distribution plan
    async createDistributionPlan(request) {
        const { taskId, strategy, agents: requestedAgents, priority = 5, deadline } = request;
        // Select agents based on strategy
        const availableAgents = requestedAgents
            ? this.agents.get(requestedAgents[0]) ? [this.agents.get(requestedAgents[0])] : []
            : this.selectAgentsByStrategy(strategy);
        if (availableAgents.length === 0) {
            throw new ValidationError('No available agents for task distribution');
        }
        // Create subtask distributions
        const subTasks = await this.createSubTaskDistributions(taskId, availableAgents, strategy, priority, deadline);
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
    selectAgentsByStrategy(strategy) {
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
    selectByCapabilities(agents, capabilities, maxAgents) {
        if (capabilities.length === 0) {
            return agents.slice(0, maxAgents);
        }
        const scored = agents.map(agent => ({
            agent,
            score: capabilities.reduce((score, cap) => score + (agent.capabilities.includes(cap) ? 1 : 0), 0)
        })).filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);
        return scored.slice(0, maxAgents).map(item => item.agent);
    }
    // Select agents by load balancing
    selectByLoadBalancing(agents, loadBalancing, maxAgents) {
        if (!loadBalancing) {
            return agents.slice(0, maxAgents);
        }
        // Sort by load (lower is better)
        const sortedByLoad = agents.sort((a, b) => a.performanceMetrics.loadAverage - b.performanceMetrics.loadAverage);
        return sortedByLoad.slice(0, maxAgents);
    }
    // Select agents by auto strategy
    selectByAutoStrategy(agents, strategy, maxAgents) {
        // Auto strategy combines performance and capabilities
        const scored = agents.map(agent => ({
            agent,
            score: this.calculateAgentScore(agent, strategy)
        })).sort((a, b) => b.score - a.score);
        return scored.slice(0, maxAgents).map(item => item.agent);
    }
    // Calculate agent score for auto strategy
    calculateAgentScore(agent, strategy) {
        const performance = agent.performanceMetrics;
        const capabilityScore = strategy.specialization.reduce((score, cap) => score + (agent.capabilities.includes(cap) ? 1 : 0), 0);
        return (performance.successRate * 0.3 +
            (1 - performance.loadAverage) * 0.3 +
            capabilityScore * 0.2 +
            (performance.averageTaskTime > 0 ? (1 / performance.averageTaskTime) * 0.2 : 0));
    }
    // Create subtask distributions
    async createSubTaskDistributions(taskId, agents, strategy, priority, deadline) {
        const subTasks = [];
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
                        dependencies: i > 0 ? [`${taskId}_task_${i - 1}`] : [],
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
    calculateAutoEffort(agent) {
        const base = 4; // 4 hours base
        const performance = agent.performanceMetrics;
        // Adjust based on agent performance
        const multiplier = performance.successRate > 0.8 ? 0.8 : 1.2;
        return Math.max(1, base * multiplier);
    }
    // Create resource allocations
    createResourceAllocations(agents, strategy) {
        const allocations = [];
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
    createFallbackPlan(strategy) {
        const triggers = ['agent_timeout', 'agent_failure', 'resource_exhaustion'];
        const actions = [
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
    calculateEstimatedCompletion(subTasks, deadline) {
        if (deadline) {
            return deadline;
        }
        // Calculate based on estimated effort
        const maxEffort = Math.max(...subTasks.map(st => st.estimatedEffort));
        const estimatedHours = maxEffort * 1.2; // Add 20% buffer
        return new Date(Date.now() + estimatedHours * 60 * 60 * 1000);
    }
    // Create workflow execution
    async createWorkflowExecution(plan) {
        const workflowId = uuid();
        const execution = {
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
    async startWorkflowExecution(execution) {
        try {
            execution.status = 'running';
            execution.startTime = new Date();
            this.logger.info(`Started workflow execution: ${execution.id}`);
            // In a real implementation, this would trigger actual agent execution
            // For now, we'll simulate the execution process
            setTimeout(() => {
                this.simulateWorkflowProgress(execution.id);
            }, 1000);
        }
        catch (error) {
            execution.status = 'failed';
            execution.errors.push({
                taskId: execution.workflowId,
                agentId: 'coordinator',
                error: error.message,
                timestamp: new Date(),
                recoverable: false,
                retryCount: 0
            });
            this.logger.error(`Failed to start workflow execution ${execution.id}:`, error);
        }
    }
    // Simulate workflow progress (for demonstration)
    async simulateWorkflowProgress(workflowId) {
        const execution = this.activeWorkflows.get(workflowId);
        if (!execution)
            return;
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
    async cancelAgentTasks(agentId) {
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
    updateCoordinationMetrics(plan) {
        this.coordinationMetrics.totalTasks += plan.subTasks.length;
        this.updateMetricsTimestamp();
    }
    // Update metrics timestamp
    updateMetricsTimestamp() {
        this.coordinationMetrics.lastUpdated = new Date();
    }
    // Get coordination metrics
    getCoordinationMetrics() {
        return { ...this.coordinationMetrics };
    }
    // Get active workflows
    getActiveWorkflows() {
        return Array.from(this.activeWorkflows.values());
    }
    // Get workflow by ID
    getWorkflowExecution(workflowId) {
        return this.activeWorkflows.get(workflowId);
    }
    // Initialize metrics
    initializeMetrics() {
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
    startHeartbeatMonitor() {
        setInterval(() => {
            this.checkAgentHeartbeats();
        }, this.heartbeatInterval);
    }
    // Check agent heartbeats
    checkAgentHeartbeats() {
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
    async agentHeartbeat(agentId) {
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
    async shutdown() {
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
