import { TaskDecompositionEngine } from './TaskDecompositionEngine.js';
import { v4 as uuid } from 'uuid';
export class TaskManager {
    taskStore;
    dependencyTracker;
    progressMonitor;
    estimationEngine;
    decompositionEngine;
    logger;
    constructor(taskStore, dependencyTracker, progressMonitor, estimationEngine, logger) {
        this.taskStore = taskStore;
        this.dependencyTracker = dependencyTracker;
        this.progressMonitor = progressMonitor;
        this.estimationEngine = estimationEngine;
        this.decompositionEngine = new TaskDecompositionEngine(estimationEngine, logger);
        this.logger = logger;
    }
    async createTask(request) {
        const startTime = Date.now();
        try {
            this.logger.info('Creating new task', { title: request.title, type: request.type });
            const taskId = uuid();
            const estimatedEffort = request.estimatedEffort ||
                await this.estimationEngine.estimateTaskEffort({
                    title: request.title,
                    description: request.description,
                    type: request.type
                });
            const task = {
                id: taskId,
                title: request.title,
                description: request.description,
                type: request.type,
                status: 'pending',
                priority: request.priority || 'medium',
                complexity: estimatedEffort.complexity,
                estimatedEffort,
                parentId: request.parentId,
                childrenIds: [],
                dependencies: request.dependencies?.map(depId => ({
                    dependentTaskId: taskId,
                    dependencyTaskId: depId,
                    type: 'finish_to_start',
                    constraint: 'hard',
                    metadata: {
                        createdAt: new Date(),
                        createdBy: 'system'
                    }
                })) || [],
                assignedTo: undefined,
                progress: 0,
                metadata: {
                    projectId: request.metadata?.projectId || await this.detectProjectId(),
                    sessionId: this.getCurrentSessionId(),
                    createdBy: 'system',
                    tags: request.metadata?.tags || [],
                    semanticContext: request.metadata?.semanticContext
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const validation = await this.validateTask(task);
            if (!validation.isValid) {
                throw new ValidationError(`Invalid task: ${validation.errors.join(', ')}`);
            }
            await this.taskStore.saveTask(task);
            if (request.parentId) {
                await this.updateParentTask(request.parentId, taskId);
            }
            if (request.dependencies && request.dependencies.length > 0) {
                await this.establishTaskDependencies(taskId, request.dependencies);
            }
            await this.progressMonitor.initializeTracking(taskId);
            const estimationDetails = await this.estimationEngine.estimateTaskEffort(task);
            const dependencyValidation = await this.validateDependencies(task.dependencies);
            this.logger.info('Task created successfully', {
                taskId,
                processingTime: Date.now() - startTime
            });
            return {
                task,
                estimationDetails,
                dependencyValidation,
                metadata: {
                    createdAt: task.createdAt,
                    estimationAccuracy: await this.getEstimationAccuracy(task.type),
                    suggestedDecomposition: await this.shouldSuggestDecomposition(task)
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to create task', { error: error.message, request });
            throw error;
        }
    }
    async getTask(taskId) {
        try {
            return await this.taskStore.getTask(taskId);
        }
        catch (error) {
            this.logger.error('Failed to get task', { taskId, error: error.message });
            throw error;
        }
    }
    async updateTask(taskId, updates) {
        try {
            const existingTask = await this.taskStore.getTask(taskId);
            if (!existingTask) {
                throw new Error(`Task not found: ${taskId}`);
            }
            const updatedTask = {
                ...existingTask,
                ...updates,
                updatedAt: new Date()
            };
            const validation = await this.validateTask(updatedTask);
            if (!validation.isValid) {
                throw new ValidationError(`Invalid task update: ${validation.errors.join(', ')}`);
            }
            await this.taskStore.updateTask(taskId, updatedTask);
            this.logger.info('Task updated successfully', { taskId });
            return updatedTask;
        }
        catch (error) {
            this.logger.error('Failed to update task', { taskId, error: error.message });
            throw error;
        }
    }
    async deleteTask(taskId) {
        try {
            const task = await this.taskStore.getTask(taskId);
            if (!task) {
                throw new Error(`Task not found: ${taskId}`);
            }
            if (task.childrenIds.length > 0) {
                throw new Error(`Cannot delete task with children: ${taskId}`);
            }
            if (task.parentId) {
                await this.removeFromParentChildren(task.parentId, taskId);
            }
            await this.dependencyTracker.removeDependencies(taskId);
            await this.progressMonitor.removeTracking(taskId);
            await this.taskStore.deleteTask(taskId);
            this.logger.info('Task deleted successfully', { taskId });
        }
        catch (error) {
            this.logger.error('Failed to delete task', { taskId, error: error.message });
            throw error;
        }
    }
    async decomposeTask(request) {
        const startTime = Date.now();
        try {
            this.logger.info('Starting task decomposition', {
                taskId: request.taskId,
                strategy: request.strategy.type
            });
            const parentTask = await this.taskStore.getTask(request.taskId);
            if (!parentTask) {
                throw new Error(`Task not found: ${request.taskId}`);
            }
            const eligibility = await this.validateDecompositionEligibility(parentTask, request.strategy);
            if (!eligibility.isEligible) {
                throw new ValidationError(`Task cannot be decomposed: ${eligibility.reason}`);
            }
            const subtasks = await this.decompositionEngine.decomposeTask(parentTask, request.strategy);
            const createdSubtasks = [];
            for (const subtask of subtasks) {
                const createdSubtask = await this.createTask({
                    title: subtask.title,
                    description: subtask.description,
                    type: subtask.type,
                    priority: subtask.priority,
                    parentId: parentTask.id,
                    metadata: {
                        projectId: parentTask.metadata.projectId,
                        tags: [...parentTask.metadata.tags, 'decomposed']
                    }
                });
                createdSubtasks.push(createdSubtask.task);
            }
            if (!request.options?.preserveOriginalTask) {
                await this.updateTask(request.taskId, {
                    status: 'decomposed',
                    childrenIds: createdSubtasks.map(st => st.id)
                });
            }
            const executionPlan = await this.generateExecutionPlan(createdSubtasks);
            const decompositionSummary = {
                strategy: request.strategy.type,
                subtaskCount: createdSubtasks.length,
                totalEstimatedEffort: createdSubtasks.reduce((sum, st) => sum + (st.estimatedEffort?.hours || 0), 0),
                maxDepth: this.calculateMaxDepth(createdSubtasks),
                dependencies: createdSubtasks.reduce((sum, st) => sum + st.dependencies.length, 0)
            };
            this.logger.info('Task decomposition completed', {
                taskId: request.taskId,
                subtaskCount: createdSubtasks.length,
                processingTime: Date.now() - startTime
            });
            return {
                parentTask,
                subtasks: createdSubtasks,
                decompositionSummary,
                executionPlan,
                metadata: {
                    decomposedAt: new Date(),
                    analysisComplexity: parentTask.complexity,
                    decompositionTime: Date.now() - startTime
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to decompose task', {
                taskId: request.taskId,
                error: error.message
            });
            throw error;
        }
    }
    async updateTaskStatus(taskId, status, progress) {
        try {
            const task = await this.taskStore.getTask(taskId);
            if (!task) {
                throw new Error(`Task not found: ${taskId}`);
            }
            const updates = {
                status,
                updatedAt: new Date()
            };
            if (progress !== undefined) {
                updates.progress = Math.max(0, Math.min(100, progress));
            }
            if (status === 'completed') {
                updates.completedAt = new Date();
                updates.progress = 100;
            }
            await this.updateTask(taskId, updates);
            await this.progressMonitor.updateTaskProgress(taskId, updates.progress || task.progress);
            if (task.parentId) {
                await this.updateParentProgress(task.parentId);
            }
            this.logger.info('Task status updated', { taskId, status, progress });
        }
        catch (error) {
            this.logger.error('Failed to update task status', { taskId, error: error.message });
            throw error;
        }
    }
    async manageDependencies(taskId, dependencies) {
        try {
            const task = await this.taskStore.getTask(taskId);
            if (!task) {
                throw new Error(`Task not found: ${taskId}`);
            }
            const validation = await this.validateDependencies(dependencies);
            if (!validation.isValid) {
                throw new ValidationError(`Invalid dependencies: ${validation.errors.join(', ')}`);
            }
            await this.updateTask(taskId, { dependencies });
            await this.dependencyTracker.updateDependencies(taskId, dependencies);
            this.logger.info('Task dependencies updated', { taskId, count: dependencies.length });
        }
        catch (error) {
            this.logger.error('Failed to manage dependencies', { taskId, error: error.message });
            throw error;
        }
    }
    async getTaskProgress(taskId) {
        try {
            return await this.progressMonitor.getProgressReport(taskId);
        }
        catch (error) {
            this.logger.error('Failed to get task progress', { taskId, error: error.message });
            throw error;
        }
    }
    async getTaskTree(rootTaskId) {
        try {
            const rootTask = await this.taskStore.getTask(rootTaskId);
            if (!rootTask) {
                throw new Error(`Root task not found: ${rootTaskId}`);
            }
            const tree = {
                task: rootTask,
                children: []
            };
            if (rootTask.childrenIds.length > 0) {
                for (const childId of rootTask.childrenIds) {
                    const childTree = await this.getTaskTree(childId);
                    tree.children.push(childTree);
                }
            }
            return tree;
        }
        catch (error) {
            this.logger.error('Failed to get task tree', { rootTaskId, error: error.message });
            throw error;
        }
    }
    async estimateEffort(task) {
        try {
            return await this.estimationEngine.estimateTaskEffort(task);
        }
        catch (error) {
            this.logger.error('Failed to estimate effort', { taskId: task.id, error: error.message });
            throw error;
        }
    }
    async validateTask(task) {
        const errors = [];
        const warnings = [];
        if (!task.title || task.title.length === 0) {
            errors.push('Task title is required');
        }
        if (!task.description || task.description.length === 0) {
            errors.push('Task description is required');
        }
        if (task.progress < 0 || task.progress > 100) {
            errors.push('Task progress must be between 0 and 100');
        }
        if (task.parentId) {
            const parent = await this.taskStore.getTask(task.parentId);
            if (!parent) {
                errors.push(`Parent task not found: ${task.parentId}`);
            }
            else if (parent.id === task.id) {
                errors.push('Task cannot be its own parent');
            }
        }
        for (const childId of task.childrenIds) {
            const child = await this.taskStore.getTask(childId);
            if (!child) {
                warnings.push(`Child task not found: ${childId}`);
            }
            else if (child.parentId !== task.id) {
                errors.push(`Child task ${childId} does not reference this task as parent`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions: []
        };
    }
    async validateDependencies(dependencies) {
        const errors = [];
        const warnings = [];
        for (const dep of dependencies) {
            const depTask = await this.taskStore.getTask(dep.dependencyTaskId);
            if (!depTask) {
                errors.push(`Dependency task not found: ${dep.dependencyTaskId}`);
            }
            const dependentTask = await this.taskStore.getTask(dep.dependentTaskId);
            if (!dependentTask) {
                errors.push(`Dependent task not found: ${dep.dependentTaskId}`);
            }
            if (dep.dependencyTaskId === dep.dependentTaskId) {
                errors.push('Task cannot depend on itself');
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions: []
        };
    }
    async validateDecompositionEligibility(task, strategy) {
        if (task.status === 'decomposed') {
            return { isEligible: false, reason: 'Task is already decomposed' };
        }
        if (task.childrenIds.length > 0) {
            return { isEligible: false, reason: 'Task already has children' };
        }
        if (task.status === 'completed') {
            return { isEligible: false, reason: 'Cannot decompose completed task' };
        }
        if (task.complexity === 'simple' && strategy.type !== 'temporal') {
            return { isEligible: false, reason: 'Simple tasks do not require decomposition' };
        }
        return { isEligible: true };
    }
    async detectProjectId() {
        return 'default-project';
    }
    getCurrentSessionId() {
        return 'default-session';
    }
    async updateParentTask(parentId, childId) {
        const parent = await this.taskStore.getTask(parentId);
        if (parent) {
            const updatedChildren = [...parent.childrenIds, childId];
            await this.updateTask(parentId, { childrenIds: updatedChildren });
        }
    }
    async removeFromParentChildren(parentId, childId) {
        const parent = await this.taskStore.getTask(parentId);
        if (parent) {
            const updatedChildren = parent.childrenIds.filter(id => id !== childId);
            await this.updateTask(parentId, { childrenIds: updatedChildren });
        }
    }
    async establishTaskDependencies(taskId, dependencies) {
        const taskDeps = dependencies.map(depId => ({
            dependentTaskId: taskId,
            dependencyTaskId: depId,
            type: 'finish_to_start',
            constraint: 'hard',
            metadata: {
                createdAt: new Date(),
                createdBy: 'system'
            }
        }));
        await this.dependencyTracker.updateDependencies(taskId, taskDeps);
    }
    async updateParentProgress(parentId) {
        const parent = await this.taskStore.getTask(parentId);
        if (!parent || parent.childrenIds.length === 0) {
            return;
        }
        const children = await Promise.all(parent.childrenIds.map(childId => this.taskStore.getTask(childId)));
        const validChildren = children.filter(child => child !== null);
        if (validChildren.length === 0) {
            return;
        }
        const totalWeight = validChildren.reduce((sum, child) => sum + (child.estimatedEffort?.hours || 1), 0);
        const weightedProgress = validChildren.reduce((sum, child) => {
            const weight = child.estimatedEffort?.hours || 1;
            return sum + (child.progress * weight);
        }, 0);
        const newProgress = Math.round(weightedProgress / totalWeight);
        await this.updateTask(parentId, { progress: newProgress });
    }
    calculateMaxDepth(tasks) {
        return tasks.reduce((maxDepth, task) => {
            const depth = task.childrenIds.length > 0 ? 1 : 0;
            return Math.max(maxDepth, depth);
        }, 0);
    }
    async generateExecutionPlan(tasks) {
        const taskIds = tasks.map(t => t.id);
        const dependencies = tasks.flatMap(t => t.dependencies);
        const criticalPath = await this.calculateCriticalPath(tasks);
        const executionOrder = await this.calculateExecutionOrder(tasks, dependencies);
        const parallelGroups = await this.identifyParallelGroups(tasks, dependencies);
        return {
            taskId: tasks[0]?.parentId || 'root',
            executionOrder,
            parallelGroups,
            criticalPath,
            estimatedDuration: tasks.reduce((sum, t) => sum + (t.estimatedEffort?.hours || 0), 0),
            resourceRequirements: []
        };
    }
    async calculateCriticalPath(tasks) {
        return tasks
            .filter(t => t.priority === 'critical' || t.priority === 'high')
            .map(t => t.id);
    }
    async calculateExecutionOrder(tasks, dependencies) {
        const visited = new Set();
        const order = [];
        const visit = (taskId) => {
            if (visited.has(taskId))
                return;
            visited.add(taskId);
            const taskDeps = dependencies.filter(d => d.dependentTaskId === taskId);
            for (const dep of taskDeps) {
                visit(dep.dependencyTaskId);
            }
            order.push(taskId);
        };
        for (const task of tasks) {
            visit(task.id);
        }
        return order;
    }
    async identifyParallelGroups(tasks, dependencies) {
        const groups = [];
        const processed = new Set();
        for (const task of tasks) {
            if (processed.has(task.id))
                continue;
            const group = [task.id];
            processed.add(task.id);
            for (const otherTask of tasks) {
                if (processed.has(otherTask.id))
                    continue;
                const hasDirectDependency = dependencies.some(d => (d.dependentTaskId === task.id && d.dependencyTaskId === otherTask.id) ||
                    (d.dependentTaskId === otherTask.id && d.dependencyTaskId === task.id));
                if (!hasDirectDependency) {
                    group.push(otherTask.id);
                    processed.add(otherTask.id);
                }
            }
            groups.push(group);
        }
        return groups;
    }
    async getEstimationAccuracy(taskType) {
        return 0.85;
    }
    async shouldSuggestDecomposition(task) {
        return task.complexity === 'complex' || task.complexity === 'very_complex';
    }
}
//# sourceMappingURL=TaskManager.js.map