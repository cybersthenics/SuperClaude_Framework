/**
 * SuperClaude Orchestrator Server - Main MCP server implementation
 */
export declare class OrchestratorServer {
    private server;
    private waveEngine;
    private delegationEngine;
    private loopController;
    private chainManager;
    private subAgentManager;
    private concurrencyController;
    private resourceManager;
    private contextPreserver;
    private performanceTracker;
    constructor();
    private setupHandlers;
    private handleCreateWavePlan;
    private handleExecuteWave;
    private handleDelegateToSubAgents;
    private handleStartLoop;
    private handleExecuteLoopIteration;
    private handleStartChain;
    private handleExecuteChain;
    run(): Promise<void>;
}
//# sourceMappingURL=OrchestratorServer.d.ts.map