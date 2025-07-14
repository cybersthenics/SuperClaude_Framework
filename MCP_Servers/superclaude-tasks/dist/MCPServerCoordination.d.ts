#!/usr/bin/env node
export declare class SuperClaudeTasksServerCoordination {
    private server;
    private taskManager;
    private memoryManager;
    private contextPreserver;
    private subAgentCoordinator;
    private workflowOrchestrator;
    constructor();
    private setupHandlers;
    private handleCreateTask;
    private handleGetTask;
    private handleUpdateTask;
    private handleDeleteTask;
    private handleSearchTasks;
    private handleGetTaskStats;
    private handleCreateProjectMemory;
    private handleLoadProjectMemory;
    private handleCreateContextSnapshot;
    private handleLoadContextSnapshot;
    private handleRegisterAgent;
    private handleGetAvailableAgents;
    private handleDistributeToSubAgents;
    private handleGetCoordinationMetrics;
    private handleCreateWorkflowSchedule;
    private handleCoordinateWorkflow;
    private handleGetWorkflowSchedule;
    private handleGetActiveWorkflows;
    private handleCancelWorkflow;
    private handleGetTaskTemplates;
    private handleGetTaskAnalytics;
    private handleGetAgentRegistry;
    private handleGetWorkflowExecutions;
    run(): Promise<void>;
}
//# sourceMappingURL=MCPServerCoordination.d.ts.map