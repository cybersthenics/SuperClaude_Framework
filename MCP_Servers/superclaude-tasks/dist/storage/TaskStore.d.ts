import { Task, TaskStatus, TaskType, TaskPriority } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class TaskStore {
    private db;
    private logger;
    private initialized;
    constructor(dbPath: string, logger: Logger);
    initialize(): Promise<void>;
    private createTables;
    saveTask(task: Task): Promise<void>;
    getTask(taskId: string): Promise<Task | null>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<void>;
    deleteTask(taskId: string): Promise<void>;
    getTasksByStatus(status: TaskStatus): Promise<Task[]>;
    getTasksByType(type: TaskType): Promise<Task[]>;
    getTasksByPriority(priority: TaskPriority): Promise<Task[]>;
    getTasksByProject(projectId: string): Promise<Task[]>;
    getSubtasks(parentId: string): Promise<Task[]>;
    searchTasks(query: string, filters?: {
        status?: TaskStatus[];
        type?: TaskType[];
        priority?: TaskPriority[];
        projectId?: string;
    }): Promise<Task[]>;
    getTaskStats(): Promise<{
        total: number;
        byStatus: Record<TaskStatus, number>;
        byType: Record<TaskType, number>;
        byPriority: Record<TaskPriority, number>;
    }>;
    private updateTaskDependencies;
    private updateTaskChildren;
    private getTaskDependencies;
    private getTaskChildren;
    private rowToTaskWithRelations;
    private rowToTask;
    close(): Promise<void>;
}
//# sourceMappingURL=TaskStore.d.ts.map