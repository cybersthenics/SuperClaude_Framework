import { Tool, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export declare class QualityTools {
    private orchestrator;
    private logger;
    constructor();
    getTools(): Tool[];
    handleToolCall(request: CallToolRequest): Promise<CallToolResult>;
    private executeQualityGates;
    private validateSemantic;
    private scanSecurity;
    private runTests;
    private measurePerformance;
    private checkDocumentation;
    private buildValidationTarget;
    private resolveTargetFiles;
    private determineValidationScope;
    private loadQualityGates;
    private loadQualityRequirements;
    private getAllGateTypes;
    private formatQualityGatesResult;
    private formatSemanticValidationResult;
    private formatSecurityScanResult;
}
//# sourceMappingURL=QualityTools.d.ts.map