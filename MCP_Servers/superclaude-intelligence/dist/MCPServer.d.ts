export declare class IntelligenceServer {
    private server;
    private lspManager;
    private semanticAnalyzer;
    private symbolIndexer;
    private knowledgeGraphBuilder;
    private projectMemoryManager;
    private reasoningEngine;
    private performanceMonitor;
    private cacheManager;
    private config;
    constructor();
    private initializeConfiguration;
    private initializeComponents;
    private setupHandlers;
    private handleFindSymbolDefinition;
    private handleFindAllReferences;
    private handleGetSymbolTypeInfo;
    private handleGetHoverInfo;
    private handleGetCodeCompletions;
    private handleAnalyzeCodeStructure;
    private handleBuildKnowledgeGraph;
    private handleSaveProjectContext;
    private handleLoadProjectContext;
    private getProjectAnalysisState;
    private getSymbolIndex;
    private getKnowledgeGraph;
    private getPerformanceMetrics;
    private getLanguageForUri;
    private getProjectRoot;
    private readFileContent;
    private groupReferencesByFile;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=MCPServer.d.ts.map