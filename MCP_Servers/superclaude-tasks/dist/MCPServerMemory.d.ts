#!/usr/bin/env node
export declare class SuperClaudeTasksServerMemory {
    private server;
    private taskManager;
    private memoryManager;
    private contextPreserver;
    constructor();
    private setupHandlers;
    private handleCreateTask;
    private handleGetTask;
    private handleUpdateTask;
    private handleDeleteTask;
    private handleUpdateTaskStatus;
    private handleSearchTasks;
    private handleGetTaskStats;
    private handleCreateProjectMemory;
    private handleSaveProjectMemory;
    private handleLoadProjectMemory;
    private handleAddSymbolInfo;
    private handleSearchSymbols;
    private handleSearchPatterns;
    private handleCreateContextSnapshot;
    private handleLoadContextSnapshot;
    private handleListContextSnapshots;
    private handleGetSnapshotStatistics;
    private handleGetTaskTemplates;
    private handleGetTaskAnalytics;
    private handleGetProjectState;
    private handleGetSymbolIndex;
    private handleGetPerformanceBaseline;
    run(): Promise<void>;
}
//# sourceMappingURL=MCPServerMemory.d.ts.map