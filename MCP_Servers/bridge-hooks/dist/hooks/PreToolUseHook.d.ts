import { BaseHook } from '../core/BaseHook.js';
import { HookContext, HookResult } from '../types/index.js';
export declare class PreToolUseHook extends BaseHook {
    constructor();
    execute(context: HookContext): Promise<HookResult>;
    private optimizeRouting;
    private preAllocateResources;
    private checkFastPath;
    private selectOptimalServer;
    protected canUseFastPath(context: HookContext): boolean;
    protected shouldCache(context: HookContext): boolean;
    private isRecentSimilarOperation;
    private hasStableParameters;
    protected calculateComplexity(context: HookContext): number;
}
//# sourceMappingURL=PreToolUseHook.d.ts.map