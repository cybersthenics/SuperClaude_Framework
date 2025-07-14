import { BaseHook } from '../core/BaseHook.js';
import { HookContext, HookResult } from '../types/index.js';
export declare class PreCompactHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private analyzeCompressionOpportunities;
    private optimizeContextPreservation;
    private prepareIntelligenceOptimization;
    private setupSemanticPreservation;
    private analyzeDataTypes;
    private calculateCompressionTTL;
}
export declare class StopHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private performSessionCleanup;
    private aggregateSessionMetrics;
    private prepareFinalResultPackaging;
    private updateOrchestratorState;
    private generateSessionSummary;
    private calculateOverallRating;
}
export declare class SubagentStopHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private aggregateSubagentResults;
    private consolidateResults;
    private updateParentTaskCoordination;
    private performSubagentCleanup;
    private generateSubagentSummary;
}
//# sourceMappingURL=CompactAndStopHooks.d.ts.map