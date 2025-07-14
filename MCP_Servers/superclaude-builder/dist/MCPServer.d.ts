export declare class BuilderMCPServer {
    private server;
    private symbolEditor;
    private refactoringEngine;
    private codeGenerator;
    private patternApplicator;
    private frameworkIntegrator;
    private buildOrchestrator;
    constructor();
    private initializeComponents;
    private setupToolHandlers;
    private handleRenameSymbol;
    private handleExtractMethod;
    private handleExtractFunction;
    private handleGenerateCode;
    private handleGenerateUIComponent;
    private handleApplyDesignPattern;
    private handleBuildProject;
    private handleCleanupProject;
    private handleAutoImport;
    private handleImplementInterface;
    private setupErrorHandling;
    run(): Promise<void>;
}
//# sourceMappingURL=MCPServer.d.ts.map