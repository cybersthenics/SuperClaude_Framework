import { BaseHook } from '../core/BaseHook.js';
import { HookContext, HookResult } from '../types/index.js';
export declare class PostToolUseHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private validateMCPResult;
    private validateResultStructure;
    private validateResultContent;
    private validatePerformanceMetrics;
    private validateSemanticConsistency;
    private requiresQualityGates;
    private triggerQualityGates;
    private updatePerformanceMetrics;
    private cacheValidatedResult;
    private reportValidationError;
    private containsHarmfulContent;
    private calculateSemanticConsistency;
    private calculateValidationScore;
    protected shouldCache(context: HookContext): boolean;
    private isStableCacheCandidate;
}
//# sourceMappingURL=PostToolUseHook.d.ts.map