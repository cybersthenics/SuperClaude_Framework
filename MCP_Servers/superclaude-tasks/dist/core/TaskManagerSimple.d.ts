import { Task, CreateTaskRequest, CreateTaskResult } from '../types/working.js';
export declare class TaskManagerSimple {
    private tasks;
    createTask(request: CreateTaskRequest): Promise<CreateTaskResult>;
    getTask(taskId: string): Promise<Task | null>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
    deleteTask(taskId: string): Promise<void>;
    updateTaskStatus(taskId: string, status: Task['status'], progress?: number): Promise<void>;
    searchTasks(query: string, filters?: {
        status?: Task['status'][];
        type?: Task['type'][];
        priority?: Task['priority'][];
        projectId?: string;
    }): Promise<Task[]>;
    getTaskStats(): Promise<{
        total: number;
        byStatus: Record<Task['status'], number>;
        byType: Record<Task['type'], number>;
        byPriority: Record<Task['priority'], number>;
    }>;
    private getBaseHours;
}
//# sourceMappingURL=TaskManagerSimple.d.ts.map