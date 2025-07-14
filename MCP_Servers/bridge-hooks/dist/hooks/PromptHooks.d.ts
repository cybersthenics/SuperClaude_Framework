import { BaseHook } from '../core/BaseHook.js';
import { HookContext, HookResult } from '../types/index.js';
export declare class PrePromptHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private analyzePersonaNeeds;
    private enhanceContextForPersona;
    private applyPromptOptimizations;
    private prepareContextPreservation;
    private calculatePromptComplexity;
    private calculateOptimalTTL;
}
export declare class PostPromptHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private analyzeResponseQuality;
    private optimizeResponseForPersona;
    private updatePersonaLearning;
    private prepareCachingStrategy;
    private assessCompleteness;
    private assessRelevance;
    private assessClarity;
    private assessPersonaAlignment;
    private generateResponseCacheKey;
}
//# sourceMappingURL=PromptHooks.d.ts.map