import { Task, TaskStatus, CreateTaskRequest, CreateTaskResult, DecomposeTaskRequest, DecomposeTaskResult, TaskEstimation, TaskDependency, ProgressReport, TaskTree } from '../types/index.js';
import { TaskStore } from '../storage/TaskStore.js';
import { DependencyTracker } from './DependencyTracker.js';
import { ProgressMonitor } from './ProgressMonitor.js';
import { EstimationEngine } from './EstimationEngine.js';
import { Logger } from '../utils/Logger.js';
export declare class TaskManager {
    private taskStore;
    private dependencyTracker;
    private progressMonitor;
    private estimationEngine;
    private decompositionEngine;
    private logger;
    constructor(taskStore: TaskStore, dependencyTracker: DependencyTracker, progressMonitor: ProgressMonitor, estimationEngine: EstimationEngine, logger: Logger);
    createTask(request: CreateTaskRequest): Promise<CreateTaskResult>;
    getTask(taskId: string): Promise<Task | null>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
    deleteTask(taskId: string): Promise<void>;
    decomposeTask(request: DecomposeTaskRequest): Promise<DecomposeTaskResult>;
    updateTaskStatus(taskId: string, status: TaskStatus, progress?: number): Promise<void>;
    manageDependencies(taskId: string, dependencies: TaskDependency[]): Promise<void>;
    getTaskProgress(taskId: string): Promise<ProgressReport>;
    getTaskTree(rootTaskId: string): Promise<TaskTree>;
    estimateEffort(task: Task): Promise<TaskEstimation>;
    private validateTask;
    private validateDependencies;
    private validateDecompositionEligibility;
    private detectProjectId;
    private getCurrentSessionId;
    private updateParentTask;
    private removeFromParentChildren;
    private establishTaskDependencies;
    private updateParentProgress;
    private calculateMaxDepth;
    private generateExecutionPlan;
    private calculateCriticalPath;
    private calculateExecutionOrder;
    private identifyParallelGroups;
    private getEstimationAccuracy;
    private shouldSuggestDecomposition;
}
export interface TaskTree {
    task: Task;
    children: TaskTree[];
}
//# sourceMappingURL=TaskManager.d.ts.map