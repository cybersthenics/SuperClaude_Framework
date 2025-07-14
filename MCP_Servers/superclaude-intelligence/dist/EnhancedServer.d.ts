#!/usr/bin/env node
export declare class EnhancedIntelligenceServer {
    private server;
    private languageServers;
    private requestId;
    private responseHandlers;
    constructor();
    private setupHandlers;
    private startPythonLanguageServer;
    private initializeLSP;
    private sendLSPMessage;
    private handleLSPMessage;
    private getNextRequestId;
    private analyzePythonFile;
    private findPythonDefinition;
    private getPythonCompletions;
    private validatePythonSyntax;
    private getServerStatus;
    private openDocument;
    private getDocumentSymbols;
    private getDiagnostics;
    private getLSPStatus;
    private getPythonCapabilities;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=EnhancedServer.d.ts.map