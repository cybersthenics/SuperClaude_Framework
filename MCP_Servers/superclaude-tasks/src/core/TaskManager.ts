// SuperClaude Tasks Server - TaskManager Core Implementation
// Central coordination for all task management operations

import { 
  Task, 
  TaskType, 
  TaskStatus, 
  TaskPriority, 
  ComplexityLevel,
  CreateTaskRequest,
  CreateTaskResult,
  DecomposeTaskRequest,
  DecomposeTaskResult,
  TaskDecompositionStrategy,
  TaskExecutionPlan,
  TaskEstimation,
  TaskDependency,
  ProgressReport,
  TaskTree,
  TaskSchedule,
  ValidationResult,
  ValidationError
} from '../types/index.js';
import { TaskStore } from '../storage/TaskStore.js';
import { DependencyTracker } from './DependencyTracker.js';
import { ProgressMonitor } from './ProgressMonitor.js';
import { EstimationEngine } from './EstimationEngine.js';
import { TaskDecompositionEngine } from './TaskDecompositionEngine.js';
import { v4 as uuid } from 'uuid';
import { Logger } from '../utils/Logger.js';

export class TaskManager {
  private taskStore: TaskStore;
  private dependencyTracker: DependencyTracker;
  private progressMonitor: ProgressMonitor;
  private estimationEngine: EstimationEngine;
  private decompositionEngine: TaskDecompositionEngine;
  private logger: Logger;

  constructor(
    taskStore: TaskStore,
    dependencyTracker: DependencyTracker,
    progressMonitor: ProgressMonitor,
    estimationEngine: EstimationEngine,
    logger: Logger
  ) {
    this.taskStore = taskStore;
    this.dependencyTracker = dependencyTracker;
    this.progressMonitor = progressMonitor;
    this.estimationEngine = estimationEngine;
    this.decompositionEngine = new TaskDecompositionEngine(estimationEngine, logger);
    this.logger = logger;
  }

  // ================================
  // Core Task Operations
  // ================================

  async createTask(request: CreateTaskRequest): Promise<CreateTaskResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating new task', { title: request.title, type: request.type });

      // Generate unique task ID
      const taskId = uuid();

      // Estimate effort if not provided
      const estimatedEffort = request.estimatedEffort || 
        await this.estimationEngine.estimateTaskEffort({
          title: request.title,
          description: request.description,
          type: request.type
        });

      // Build task object
      const task: Task = {
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

      // Validate task structure
      const validation = await this.validateTask(task);
      if (!validation.isValid) {
        throw new ValidationError(`Invalid task: ${validation.errors.join(', ')}`);
      }

      // Store task
      await this.taskStore.saveTask(task);

      // Update parent task if specified
      if (request.parentId) {
        await this.updateParentTask(request.parentId, taskId);
      }

      // Establish dependencies
      if (request.dependencies && request.dependencies.length > 0) {
        await this.establishTaskDependencies(taskId, request.dependencies);
      }

      // Initialize progress tracking
      await this.progressMonitor.initializeTracking(taskId);

      // Get estimation details
      const estimationDetails = await this.estimationEngine.estimateTaskEffort(task);

      // Validate dependencies
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

    } catch (error) {
      this.logger.error('Failed to create task', { error: error.message, request });
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      return await this.taskStore.getTask(taskId);
    } catch (error) {
      this.logger.error('Failed to get task', { taskId, error: error.message });
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
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

      // Validate updated task
      const validation = await this.validateTask(updatedTask);
      if (!validation.isValid) {
        throw new ValidationError(`Invalid task update: ${validation.errors.join(', ')}`);
      }

      await this.taskStore.updateTask(taskId, updatedTask);
      
      this.logger.info('Task updated successfully', { taskId });
      return updatedTask;

    } catch (error) {
      this.logger.error('Failed to update task', { taskId, error: error.message });
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const task = await this.taskStore.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Check if task has children
      if (task.childrenIds.length > 0) {
        throw new Error(`Cannot delete task with children: ${taskId}`);
      }

      // Remove from parent's children list
      if (task.parentId) {
        await this.removeFromParentChildren(task.parentId, taskId);
      }

      // Remove dependencies
      await this.dependencyTracker.removeDependencies(taskId);

      // Remove progress tracking
      await this.progressMonitor.removeTracking(taskId);

      // Delete the task
      await this.taskStore.deleteTask(taskId);

      this.logger.info('Task deleted successfully', { taskId });

    } catch (error) {
      this.logger.error('Failed to delete task', { taskId, error: error.message });
      throw error;
    }
  }

  // ================================
  // Task Decomposition
  // ================================

  async decomposeTask(request: DecomposeTaskRequest): Promise<DecomposeTaskResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting task decomposition', { 
        taskId: request.taskId, 
        strategy: request.strategy.type 
      });

      // Get parent task
      const parentTask = await this.taskStore.getTask(request.taskId);
      if (!parentTask) {
        throw new Error(`Task not found: ${request.taskId}`);
      }

      // Validate decomposition eligibility
      const eligibility = await this.validateDecompositionEligibility(parentTask, request.strategy);
      if (!eligibility.isEligible) {
        throw new ValidationError(`Task cannot be decomposed: ${eligibility.reason}`);
      }

      // Decompose the task
      const subtasks = await this.decompositionEngine.decomposeTask(parentTask, request.strategy);

      // Store subtasks
      const createdSubtasks: Task[] = [];
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

      // Update parent task
      if (!request.options?.preserveOriginalTask) {
        await this.updateTask(request.taskId, {
          status: 'decomposed',
          childrenIds: createdSubtasks.map(st => st.id)
        });
      }

      // Generate execution plan
      const executionPlan = await this.generateExecutionPlan(createdSubtasks);

      // Calculate summary
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

    } catch (error) {
      this.logger.error('Failed to decompose task', { 
        taskId: request.taskId, 
        error: error.message 
      });
      throw error;
    }
  }

  // ================================
  // Task Status Management
  // ================================

  async updateTaskStatus(taskId: string, status: TaskStatus, progress?: number): Promise<void> {
    try {
      const task = await this.taskStore.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const updates: Partial<Task> = {
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

      // Update progress tracking
      await this.progressMonitor.updateTaskProgress(taskId, updates.progress || task.progress);

      // Update parent task progress if applicable
      if (task.parentId) {
        await this.updateParentProgress(task.parentId);
      }

      this.logger.info('Task status updated', { taskId, status, progress });

    } catch (error) {
      this.logger.error('Failed to update task status', { taskId, error: error.message });
      throw error;
    }
  }

  // ================================
  // Dependency Management
  // ================================

  async manageDependencies(taskId: string, dependencies: TaskDependency[]): Promise<void> {
    try {
      const task = await this.taskStore.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Validate dependencies
      const validation = await this.validateDependencies(dependencies);
      if (!validation.isValid) {
        throw new ValidationError(`Invalid dependencies: ${validation.errors.join(', ')}`);
      }

      // Update task dependencies
      await this.updateTask(taskId, { dependencies });

      // Update dependency tracker
      await this.dependencyTracker.updateDependencies(taskId, dependencies);

      this.logger.info('Task dependencies updated', { taskId, count: dependencies.length });

    } catch (error) {
      this.logger.error('Failed to manage dependencies', { taskId, error: error.message });
      throw error;
    }
  }

  // ================================
  // Progress Tracking
  // ================================

  async getTaskProgress(taskId: string): Promise<ProgressReport> {
    try {
      return await this.progressMonitor.getProgressReport(taskId);
    } catch (error) {
      this.logger.error('Failed to get task progress', { taskId, error: error.message });
      throw error;
    }
  }

  async getTaskTree(rootTaskId: string): Promise<TaskTree> {
    try {
      const rootTask = await this.taskStore.getTask(rootTaskId);
      if (!rootTask) {
        throw new Error(`Root task not found: ${rootTaskId}`);
      }

      const tree: TaskTree = {
        task: rootTask,
        children: []
      };

      // Recursively build tree
      if (rootTask.childrenIds.length > 0) {
        for (const childId of rootTask.childrenIds) {
          const childTree = await this.getTaskTree(childId);
          tree.children.push(childTree);
        }
      }

      return tree;

    } catch (error) {
      this.logger.error('Failed to get task tree', { rootTaskId, error: error.message });
      throw error;
    }
  }

  // ================================
  // Estimation
  // ================================

  async estimateEffort(task: Task): Promise<TaskEstimation> {
    try {
      return await this.estimationEngine.estimateTaskEffort(task);
    } catch (error) {
      this.logger.error('Failed to estimate effort', { taskId: task.id, error: error.message });
      throw error;
    }
  }

  // ================================
  // Private Helper Methods
  // ================================

  private async validateTask(task: Task): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!task.title || task.title.length === 0) {
      errors.push('Task title is required');
    }

    if (!task.description || task.description.length === 0) {
      errors.push('Task description is required');
    }

    if (task.progress < 0 || task.progress > 100) {
      errors.push('Task progress must be between 0 and 100');
    }

    // Validate parent relationship
    if (task.parentId) {
      const parent = await this.taskStore.getTask(task.parentId);
      if (!parent) {
        errors.push(`Parent task not found: ${task.parentId}`);
      } else if (parent.id === task.id) {
        errors.push('Task cannot be its own parent');
      }
    }

    // Validate children relationships
    for (const childId of task.childrenIds) {
      const child = await this.taskStore.getTask(childId);
      if (!child) {
        warnings.push(`Child task not found: ${childId}`);
      } else if (child.parentId !== task.id) {
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

  private async validateDependencies(dependencies: TaskDependency[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const dep of dependencies) {
      // Check if dependency task exists
      const depTask = await this.taskStore.getTask(dep.dependencyTaskId);
      if (!depTask) {
        errors.push(`Dependency task not found: ${dep.dependencyTaskId}`);
      }

      // Check if dependent task exists
      const dependentTask = await this.taskStore.getTask(dep.dependentTaskId);
      if (!dependentTask) {
        errors.push(`Dependent task not found: ${dep.dependentTaskId}`);
      }

      // Check for circular dependencies
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

  private async validateDecompositionEligibility(
    task: Task, 
    strategy: TaskDecompositionStrategy
  ): Promise<{ isEligible: boolean; reason?: string }> {
    // Check if task is already decomposed
    if (task.status === 'decomposed') {
      return { isEligible: false, reason: 'Task is already decomposed' };
    }

    // Check if task has children
    if (task.childrenIds.length > 0) {
      return { isEligible: false, reason: 'Task already has children' };
    }

    // Check if task is completed
    if (task.status === 'completed') {
      return { isEligible: false, reason: 'Cannot decompose completed task' };
    }

    // Check complexity threshold
    if (task.complexity === 'simple' && strategy.type !== 'temporal') {
      return { isEligible: false, reason: 'Simple tasks do not require decomposition' };
    }

    return { isEligible: true };
  }

  private async detectProjectId(): Promise<string> {
    // Implementation would detect project ID from context
    // For now, return a default value
    return 'default-project';
  }

  private getCurrentSessionId(): string {
    // Implementation would get current session ID
    // For now, return a default value
    return 'default-session';
  }

  private async updateParentTask(parentId: string, childId: string): Promise<void> {
    const parent = await this.taskStore.getTask(parentId);
    if (parent) {
      const updatedChildren = [...parent.childrenIds, childId];
      await this.updateTask(parentId, { childrenIds: updatedChildren });
    }
  }

  private async removeFromParentChildren(parentId: string, childId: string): Promise<void> {
    const parent = await this.taskStore.getTask(parentId);
    if (parent) {
      const updatedChildren = parent.childrenIds.filter(id => id !== childId);
      await this.updateTask(parentId, { childrenIds: updatedChildren });
    }
  }

  private async establishTaskDependencies(taskId: string, dependencies: string[]): Promise<void> {
    const taskDeps: TaskDependency[] = dependencies.map(depId => ({
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

  private async updateParentProgress(parentId: string): Promise<void> {
    const parent = await this.taskStore.getTask(parentId);
    if (!parent || parent.childrenIds.length === 0) {
      return;
    }

    const children = await Promise.all(
      parent.childrenIds.map(childId => this.taskStore.getTask(childId))
    );

    const validChildren = children.filter(child => child !== null) as Task[];
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

  private calculateMaxDepth(tasks: Task[]): number {
    // Calculate maximum depth of task hierarchy
    return tasks.reduce((maxDepth, task) => {
      const depth = task.childrenIds.length > 0 ? 1 : 0;
      return Math.max(maxDepth, depth);
    }, 0);
  }

  private async generateExecutionPlan(tasks: Task[]): Promise<TaskExecutionPlan> {
    // Generate execution plan based on dependencies
    const taskIds = tasks.map(t => t.id);
    const dependencies = tasks.flatMap(t => t.dependencies);
    
    // Calculate critical path
    const criticalPath = await this.calculateCriticalPath(tasks);
    
    // Determine execution order
    const executionOrder = await this.calculateExecutionOrder(tasks, dependencies);
    
    // Group parallel tasks
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

  private async calculateCriticalPath(tasks: Task[]): Promise<string[]> {
    // Simplified critical path calculation
    return tasks
      .filter(t => t.priority === 'critical' || t.priority === 'high')
      .map(t => t.id);
  }

  private async calculateExecutionOrder(tasks: Task[], dependencies: TaskDependency[]): Promise<string[]> {
    // Topological sort based on dependencies
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      
      visited.add(taskId);
      
      // Visit dependencies first
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

  private async identifyParallelGroups(tasks: Task[], dependencies: TaskDependency[]): Promise<string[][]> {
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    for (const task of tasks) {
      if (processed.has(task.id)) continue;
      
      const group = [task.id];
      processed.add(task.id);
      
      // Find tasks that can run in parallel
      for (const otherTask of tasks) {
        if (processed.has(otherTask.id)) continue;
        
        const hasDirectDependency = dependencies.some(d => 
          (d.dependentTaskId === task.id && d.dependencyTaskId === otherTask.id) ||
          (d.dependentTaskId === otherTask.id && d.dependencyTaskId === task.id)
        );
        
        if (!hasDirectDependency) {
          group.push(otherTask.id);
          processed.add(otherTask.id);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  private async getEstimationAccuracy(taskType: TaskType): Promise<number> {
    // Get historical estimation accuracy for task type
    // For now, return a default value
    return 0.85;
  }

  private async shouldSuggestDecomposition(task: Task): Promise<boolean> {
    // Check if task should be suggested for decomposition
    return task.complexity === 'complex' || task.complexity === 'very_complex';
  }
}

// Helper interface for task tree
export interface TaskTree {
  task: Task;
  children: TaskTree[];
}