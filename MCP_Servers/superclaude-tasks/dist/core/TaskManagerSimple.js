// SuperClaude Tasks Server - Simple TaskManager Implementation
// Core task management functionality that compiles and works
import { ValidationError } from '../types/working.js';
import { v4 as uuid } from 'uuid';
export class TaskManagerSimple {
    constructor() {
        this.tasks = new Map();
    }
    async createTask(request) {
        try {
            // Generate unique task ID
            const taskId = uuid();
            // Create basic estimated effort
            const estimatedEffort = request.estimatedEffort ? {
                hours: request.estimatedEffort.hours || this.getBaseHours(request.type),
                complexity: request.estimatedEffort.complexity || 'moderate',
                confidence: request.estimatedEffort.confidence || 0.7,
                factors: request.estimatedEffort.factors || ['base_estimate']
            } : {
                hours: this.getBaseHours(request.type),
                complexity: 'moderate',
                confidence: 0.7,
                factors: ['base_estimate']
            };
            // Build task object
            const task = {
                id: taskId,
                title: request.title,
                description: request.description,
                type: request.type,
                status: 'pending',
                priority: request.priority || 'medium',
                complexity: estimatedEffort.complexity,
                progress: 0,
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
                metadata: {
                    projectId: request.metadata?.projectId || 'default-project',
                    sessionId: 'default-session',
                    createdBy: 'system',
                    tags: request.metadata?.tags || [],
                    semanticContext: request.metadata?.semanticContext
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Store task
            this.tasks.set(taskId, task);
            // Create estimation details
            const estimationDetails = {
                effort: estimatedEffort,
                confidence: 0.7,
                factors: [
                    {
                        name: 'task_type',
                        impact: 1.0,
                        confidence: 0.9,
                        description: `Base estimate for ${request.type} tasks`
                    }
                ],
                historicalBasis: [],
                complexityAnalysis: {
                    overall: estimatedEffort.complexity,
                    technical: 1.0,
                    business: 1.0,
                    integration: 1.0,
                    testing: 1.0,
                    factors: ['base_complexity']
                },
                riskAssessment: {
                    overall: 0.3,
                    technical: 0.2,
                    resource: 0.3,
                    timeline: 0.2,
                    dependency: 0.1,
                    risks: []
                }
            };
            // Validation result
            const dependencyValidation = {
                isValid: true,
                errors: [],
                warnings: [],
                suggestions: []
            };
            return {
                task,
                estimationDetails,
                dependencyValidation,
                metadata: {
                    createdAt: task.createdAt,
                    estimationAccuracy: 0.85,
                    suggestedDecomposition: task.complexity === 'complex' || task.complexity === 'very_complex'
                }
            };
        }
        catch (error) {
            throw new ValidationError(`Failed to create task: ${error.message}`);
        }
    }
    async getTask(taskId) {
        return this.tasks.get(taskId) || null;
    }
    async updateTask(taskId, updates) {
        const existingTask = this.tasks.get(taskId);
        if (!existingTask) {
            throw new ValidationError(`Task not found: ${taskId}`);
        }
        const updatedTask = {
            ...existingTask,
            ...updates,
            updatedAt: new Date()
        };
        this.tasks.set(taskId, updatedTask);
        return updatedTask;
    }
    async deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new ValidationError(`Task not found: ${taskId}`);
        }
        // Check if task has children
        if (task.childrenIds.length > 0) {
            throw new ValidationError(`Cannot delete task with children: ${taskId}`);
        }
        this.tasks.delete(taskId);
    }
    async updateTaskStatus(taskId, status, progress) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new ValidationError(`Task not found: ${taskId}`);
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
    }
    async searchTasks(query, filters) {
        let tasks = Array.from(this.tasks.values());
        // Apply text search
        if (query) {
            tasks = tasks.filter(task => task.title.toLowerCase().includes(query.toLowerCase()) ||
                task.description.toLowerCase().includes(query.toLowerCase()));
        }
        // Apply filters
        if (filters?.status && filters.status.length > 0) {
            tasks = tasks.filter(task => filters.status.includes(task.status));
        }
        if (filters?.type && filters.type.length > 0) {
            tasks = tasks.filter(task => filters.type.includes(task.type));
        }
        if (filters?.priority && filters.priority.length > 0) {
            tasks = tasks.filter(task => filters.priority.includes(task.priority));
        }
        if (filters?.projectId) {
            tasks = tasks.filter(task => task.metadata.projectId === filters.projectId);
        }
        return tasks;
    }
    async getTaskStats() {
        const tasks = Array.from(this.tasks.values());
        const byStatus = {};
        const byType = {};
        const byPriority = {};
        tasks.forEach(task => {
            byStatus[task.status] = (byStatus[task.status] || 0) + 1;
            byType[task.type] = (byType[task.type] || 0) + 1;
            byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
        });
        return {
            total: tasks.length,
            byStatus,
            byType,
            byPriority
        };
    }
    getBaseHours(type) {
        const baseHours = {
            'feature': 8,
            'bug': 4,
            'improvement': 6,
            'research': 12,
            'documentation': 3,
            'maintenance': 2,
            'test': 4
        };
        return baseHours[type] || 8;
    }
}
