export declare class SuperClaudeTasksServer {
    private server;
    private taskManager;
    private taskStore;
    private logger;
    constructor();
    private setupHandlers;
    private handleCreateTask;
    private handleGetTask;
    private handleUpdateTask;
    private handleDeleteTask;
    private handleDecomposeTask;
    private handleUpdateTaskStatus;
    private handleGetTaskProgress;
    private handleGetTaskTree;
    private handleEstimateTaskEffort;
    private handleSearchTasks;
    private handleGetTaskStats;
    private handleGetTaskTemplates;
    private handleGetTaskAnalytics;
    initialize(): Promise<void>;
    run(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=MCPServer.d.ts.map