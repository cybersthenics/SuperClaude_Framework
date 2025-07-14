// SuperClaude Tasks Server - Workflow Orchestrator
// Advanced workflow coordination and orchestration strategies
import { ValidationError } from '../types/working.js';
import { SimpleLogger } from '../core/SimpleStubs.js';
import { v4 as uuid } from 'uuid';
export class WorkflowOrchestrator {
    constructor(coordinator) {
        this.activeWorkflows = new Map();
        this.workflowSchedules = new Map();
        this.workflowStrategies = new Map();
        this.logger = new SimpleLogger();
        this.coordinator = coordinator;
    }
    // Create workflow schedule from distribution plan
    async createWorkflowSchedule(plan, strategy) {
        try {
            const workflowId = uuid();
            // Create workflow steps from subtasks
            const steps = this.createWorkflowSteps(plan.subTasks);
            // Create execution order based on strategy
            const { executionOrder, parallelGroups } = this.createExecutionOrder(steps, strategy);
            // Calculate critical path
            const criticalPath = this.calculateCriticalPath(steps);
            // Calculate estimated duration
            const estimatedDuration = this.calculateEstimatedDuration(steps, strategy);
            const schedule = {
                workflowId,
                steps,
                executionOrder,
                parallelGroups,
                criticalPath,
                estimatedDuration
            };
            this.workflowSchedules.set(workflowId, schedule);
            this.workflowStrategies.set(workflowId, strategy);
            this.logger.info(`Created workflow schedule ${workflowId} with ${steps.length} steps`);
            return schedule;
        }
        catch (error) {
            this.logger.error('Failed to create workflow schedule:', error);
            throw new ValidationError(`Failed to create workflow schedule: ${error.message}`);
        }
    }
    // Coordinate workflow execution
    async coordinateWorkflow(request) {
        try {
            const { workflowId, strategy, maxConcurrency, timeout, failureStrategy } = request;
            this.logger.info(`Coordinating workflow ${workflowId} with strategy: ${strategy}`);
            // Get or create workflow strategy
            const workflowStrategy = {
                type: strategy,
                maxConcurrency,
                failureStrategy,
                retryCount: 3,
                timeout
            };
            // Get workflow schedule
            const schedule = this.workflowSchedules.get(workflowId);
            if (!schedule) {
                throw new ValidationError(`Workflow schedule not found: ${workflowId}`);
            }
            // Create workflow execution
            const execution = await this.createWorkflowExecution(schedule, workflowStrategy);
            // Start workflow execution
            const result = await this.executeWorkflow(execution, workflowStrategy);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to coordinate workflow ${request.workflowId}:`, error);
            throw new ValidationError(`Failed to coordinate workflow: ${error.message}`);
        }
    }
    // Create workflow steps from subtasks
    createWorkflowSteps(subTasks) {
        return subTasks.map(subTask => ({
            id: uuid(),
            taskId: subTask.subTaskId,
            agentId: subTask.agentId,
            dependencies: subTask.dependencies,
            estimatedDuration: subTask.estimatedEffort * 60 * 60 * 1000, // Convert hours to milliseconds
            status: 'pending'
        }));
    }
    // Create execution order based on strategy
    createExecutionOrder(steps, strategy) {
        switch (strategy.type) {
            case 'sequential':
                return this.createSequentialOrder(steps);
            case 'parallel':
                return this.createParallelOrder(steps, strategy.maxConcurrency);
            case 'hybrid':
                return this.createHybridOrder(steps, strategy.maxConcurrency);
            default:
                throw new ValidationError(`Unknown workflow strategy: ${strategy.type}`);
        }
    }
    // Create sequential execution order
    createSequentialOrder(steps) {
        const executionOrder = steps.map(step => step.id);
        const parallelGroups = steps.map(step => [step.id]); // Each step is its own group
        return { executionOrder, parallelGroups };
    }
    // Create parallel execution order
    createParallelOrder(steps, maxConcurrency) {
        const executionOrder = steps.map(step => step.id);
        const parallelGroups = [];
        // Group steps by dependencies
        const dependencyGroups = this.groupStepsByDependencies(steps);
        // Create parallel groups respecting dependencies and concurrency
        for (const group of dependencyGroups) {
            const chunks = this.chunkArray(group, maxConcurrency);
            parallelGroups.push(...chunks);
        }
        return { executionOrder, parallelGroups };
    }
    // Create hybrid execution order
    createHybridOrder(steps, maxConcurrency) {
        const executionOrder = steps.map(step => step.id);
        const parallelGroups = [];
        // Identify independent steps that can run in parallel
        const independentSteps = steps.filter(step => step.dependencies.length === 0);
        const dependentSteps = steps.filter(step => step.dependencies.length > 0);
        // Start with independent steps in parallel
        if (independentSteps.length > 0) {
            const chunks = this.chunkArray(independentSteps.map(s => s.id), maxConcurrency);
            parallelGroups.push(...chunks);
        }
        // Add dependent steps in dependency order
        const dependencyGroups = this.groupStepsByDependencies(dependentSteps);
        for (const group of dependencyGroups) {
            const chunks = this.chunkArray(group, maxConcurrency);
            parallelGroups.push(...chunks);
        }
        return { executionOrder, parallelGroups };
    }
    // Group steps by dependencies
    groupStepsByDependencies(steps) {
        const groups = [];
        const processed = new Set();
        const stepMap = new Map(steps.map(step => [step.id, step]));
        // Build dependency graph
        const dependencyGraph = new Map();
        const dependents = new Map();
        steps.forEach(step => {
            dependencyGraph.set(step.id, step.dependencies);
            step.dependencies.forEach(dep => {
                if (!dependents.has(dep)) {
                    dependents.set(dep, []);
                }
                dependents.get(dep).push(step.id);
            });
        });
        // Topological sort to create dependency groups
        const queue = steps.filter(step => step.dependencies.length === 0).map(step => step.id);
        while (queue.length > 0) {
            const currentGroup = [];
            const nextQueue = [];
            // Process all steps in current level
            while (queue.length > 0) {
                const stepId = queue.shift();
                if (!processed.has(stepId)) {
                    currentGroup.push(stepId);
                    processed.add(stepId);
                    // Add dependents to next queue if all their dependencies are processed
                    const stepDependents = dependents.get(stepId) || [];
                    stepDependents.forEach(dependent => {
                        const dependentStep = stepMap.get(dependent);
                        if (dependentStep && dependentStep.dependencies.every(dep => processed.has(dep))) {
                            nextQueue.push(dependent);
                        }
                    });
                }
            }
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
            queue.push(...nextQueue);
        }
        return groups;
    }
    // Chunk array into smaller arrays
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    // Calculate critical path
    calculateCriticalPath(steps) {
        const stepMap = new Map(steps.map(step => [step.id, step]));
        const criticalPath = [];
        // Find the longest path through the workflow
        const visited = new Set();
        const pathLengths = new Map();
        const calculateLength = (stepId) => {
            if (pathLengths.has(stepId)) {
                return pathLengths.get(stepId);
            }
            const step = stepMap.get(stepId);
            if (!step)
                return 0;
            let maxDependencyLength = 0;
            step.dependencies.forEach(dep => {
                const depLength = calculateLength(dep);
                maxDependencyLength = Math.max(maxDependencyLength, depLength);
            });
            const length = maxDependencyLength + step.estimatedDuration;
            pathLengths.set(stepId, length);
            return length;
        };
        // Calculate lengths for all steps
        steps.forEach(step => calculateLength(step.id));
        // Find the step with the longest path
        let longestPath = 0;
        let longestStepId = '';
        pathLengths.forEach((length, stepId) => {
            if (length > longestPath) {
                longestPath = length;
                longestStepId = stepId;
            }
        });
        // Trace back the critical path
        const tracePath = (stepId) => {
            const step = stepMap.get(stepId);
            if (!step)
                return;
            criticalPath.unshift(stepId);
            if (step.dependencies.length > 0) {
                // Find the dependency with the longest path
                let longestDep = '';
                let longestDepLength = 0;
                step.dependencies.forEach(dep => {
                    const depLength = pathLengths.get(dep) || 0;
                    if (depLength > longestDepLength) {
                        longestDepLength = depLength;
                        longestDep = dep;
                    }
                });
                if (longestDep) {
                    tracePath(longestDep);
                }
            }
        };
        if (longestStepId) {
            tracePath(longestStepId);
        }
        return criticalPath;
    }
    // Calculate estimated duration
    calculateEstimatedDuration(steps, strategy) {
        switch (strategy.type) {
            case 'sequential':
                return steps.reduce((total, step) => total + step.estimatedDuration, 0);
            case 'parallel':
                return Math.max(...steps.map(step => step.estimatedDuration));
            case 'hybrid':
                const dependencyGroups = this.groupStepsByDependencies(steps);
                const stepMap = new Map(steps.map(step => [step.id, step]));
                return dependencyGroups.reduce((total, group) => {
                    const groupDuration = Math.max(...group.map(stepId => {
                        const step = stepMap.get(stepId);
                        return step ? step.estimatedDuration : 0;
                    }));
                    return total + groupDuration;
                }, 0);
            default:
                return 0;
        }
    }
    // Create workflow execution
    async createWorkflowExecution(schedule, strategy) {
        const execution = {
            id: uuid(),
            workflowId: schedule.workflowId,
            status: 'pending',
            startTime: new Date(),
            progress: 0,
            results: [],
            errors: []
        };
        this.activeWorkflows.set(execution.id, execution);
        return execution;
    }
    // Execute workflow
    async executeWorkflow(execution, strategy) {
        try {
            execution.status = 'running';
            execution.startTime = new Date();
            const schedule = this.workflowSchedules.get(execution.workflowId);
            if (!schedule) {
                throw new ValidationError(`Workflow schedule not found: ${execution.workflowId}`);
            }
            // Execute workflow based on strategy
            await this.executeWorkflowStrategy(execution, schedule, strategy);
            // Calculate results
            const completedTasks = execution.results.filter(r => r.status === 'success').length;
            const failedTasks = execution.results.filter(r => r.status === 'failure').length;
            const totalDuration = execution.endTime
                ? execution.endTime.getTime() - execution.startTime.getTime()
                : 0;
            // Get resource usage (simplified)
            const resourcesUsed = this.calculateResourceUsage(execution, schedule);
            const result = {
                workflowExecution: execution,
                completedTasks,
                failedTasks,
                totalDuration,
                resourcesUsed
            };
            this.logger.info(`Workflow ${execution.workflowId} completed: ${completedTasks} tasks successful, ${failedTasks} failed`);
            return result;
        }
        catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date();
            execution.errors.push({
                taskId: execution.workflowId,
                agentId: 'orchestrator',
                error: error.message,
                timestamp: new Date(),
                recoverable: false,
                retryCount: 0
            });
            this.logger.error(`Workflow ${execution.workflowId} failed:`, error);
            throw error;
        }
    }
    // Execute workflow strategy
    async executeWorkflowStrategy(execution, schedule, strategy) {
        const stepMap = new Map(schedule.steps.map(step => [step.id, step]));
        switch (strategy.type) {
            case 'sequential':
                await this.executeSequentialStrategy(execution, schedule, stepMap, strategy);
                break;
            case 'parallel':
                await this.executeParallelStrategy(execution, schedule, stepMap, strategy);
                break;
            case 'hybrid':
                await this.executeHybridStrategy(execution, schedule, stepMap, strategy);
                break;
        }
    }
    // Execute sequential strategy
    async executeSequentialStrategy(execution, schedule, stepMap, strategy) {
        for (const stepId of schedule.executionOrder) {
            const step = stepMap.get(stepId);
            if (!step)
                continue;
            await this.executeStep(execution, step, strategy);
            // Update progress
            const completedSteps = execution.results.filter(r => r.status === 'success').length;
            execution.progress = (completedSteps / schedule.steps.length) * 100;
            // Check failure strategy
            if (step.status === 'failed' && strategy.failureStrategy === 'stop') {
                execution.status = 'failed';
                return;
            }
        }
        execution.status = 'completed';
        execution.endTime = new Date();
    }
    // Execute parallel strategy
    async executeParallelStrategy(execution, schedule, stepMap, strategy) {
        const executeGroup = async (group) => {
            const promises = group.map(stepId => {
                const step = stepMap.get(stepId);
                return step ? this.executeStep(execution, step, strategy) : Promise.resolve();
            });
            await Promise.all(promises);
        };
        for (const group of schedule.parallelGroups) {
            await executeGroup(group);
            // Update progress
            const completedSteps = execution.results.filter(r => r.status === 'success').length;
            execution.progress = (completedSteps / schedule.steps.length) * 100;
            // Check failure strategy
            const hasFailures = group.some(stepId => {
                const step = stepMap.get(stepId);
                return step && step.status === 'failed';
            });
            if (hasFailures && strategy.failureStrategy === 'stop') {
                execution.status = 'failed';
                return;
            }
        }
        execution.status = 'completed';
        execution.endTime = new Date();
    }
    // Execute hybrid strategy
    async executeHybridStrategy(execution, schedule, stepMap, strategy) {
        // Hybrid strategy combines sequential and parallel execution
        await this.executeParallelStrategy(execution, schedule, stepMap, strategy);
    }
    // Execute individual step
    async executeStep(execution, step, strategy) {
        try {
            step.status = 'running';
            step.startTime = new Date();
            // Simulate step execution (in real implementation, this would call the actual agent)
            await this.simulateStepExecution(step, strategy);
            step.status = 'completed';
            step.endTime = new Date();
            step.actualDuration = step.endTime.getTime() - step.startTime.getTime();
            // Add result to execution
            execution.results.push({
                taskId: step.taskId,
                agentId: step.agentId,
                status: 'success',
                result: step.result,
                duration: step.actualDuration,
                metadata: {
                    stepId: step.id,
                    estimatedDuration: step.estimatedDuration,
                    actualDuration: step.actualDuration
                }
            });
        }
        catch (error) {
            step.status = 'failed';
            step.endTime = new Date();
            step.error = error.message;
            execution.errors.push({
                taskId: step.taskId,
                agentId: step.agentId,
                error: error.message,
                timestamp: new Date(),
                recoverable: true,
                retryCount: 0
            });
            execution.results.push({
                taskId: step.taskId,
                agentId: step.agentId,
                status: 'failure',
                result: null,
                duration: step.actualDuration || 0,
                metadata: {
                    stepId: step.id,
                    error: step.error
                }
            });
        }
    }
    // Simulate step execution
    async simulateStepExecution(step, strategy) {
        // Simulate execution time (random between 50% and 150% of estimated time)
        const randomFactor = 0.5 + Math.random();
        const executionTime = Math.min(step.estimatedDuration * randomFactor, strategy.timeout);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() < 0.9) {
                    step.result = {
                        stepId: step.id,
                        taskId: step.taskId,
                        agentId: step.agentId,
                        success: true,
                        executionTime
                    };
                    resolve();
                }
                else {
                    reject(new Error(`Simulated failure for step ${step.id}`));
                }
            }, Math.min(executionTime, 1000)); // Cap at 1 second for simulation
        });
    }
    // Calculate resource usage
    calculateResourceUsage(execution, schedule) {
        const resourceUsage = [];
        // Group results by agent
        const agentResults = new Map();
        execution.results.forEach(result => {
            if (!agentResults.has(result.agentId)) {
                agentResults.set(result.agentId, []);
            }
            agentResults.get(result.agentId).push(result);
        });
        // Calculate resource usage for each agent
        agentResults.forEach((results, agentId) => {
            const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
            const avgDuration = totalDuration / results.length;
            // Simulate resource usage based on execution time
            const cpuUsage = Math.min(90, (avgDuration / 60000) * 30); // 30% CPU per minute
            const memoryUsage = Math.min(4, results.length * 0.5); // 0.5GB per task
            resourceUsage.push({
                agentId,
                resourceType: 'cpu',
                allocated: cpuUsage,
                maximum: 100,
                unit: 'percent'
            });
            resourceUsage.push({
                agentId,
                resourceType: 'memory',
                allocated: memoryUsage,
                maximum: 8,
                unit: 'GB'
            });
        });
        return resourceUsage;
    }
    // Get workflow schedule
    getWorkflowSchedule(workflowId) {
        return this.workflowSchedules.get(workflowId);
    }
    // Get workflow execution
    getWorkflowExecution(executionId) {
        return this.activeWorkflows.get(executionId);
    }
    // Get active workflows
    getActiveWorkflows() {
        return Array.from(this.activeWorkflows.values());
    }
    // Cancel workflow
    async cancelWorkflow(executionId) {
        const execution = this.activeWorkflows.get(executionId);
        if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            this.logger.info(`Cancelled workflow execution: ${executionId}`);
        }
    }
    // Shutdown orchestrator
    async shutdown() {
        this.logger.info('Shutting down Workflow Orchestrator');
        // Cancel all active workflows
        for (const [executionId, execution] of this.activeWorkflows) {
            if (execution.status === 'running') {
                execution.status = 'cancelled';
                execution.endTime = new Date();
            }
        }
        this.activeWorkflows.clear();
        this.workflowSchedules.clear();
        this.workflowStrategies.clear();
    }
}
