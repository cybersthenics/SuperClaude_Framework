import { HookType, HookContext, HookResult, PerformanceBudget, ValidationResult, OptimizationResult } from '../types/index.js';
export declare abstract class BaseHook {
    readonly type: HookType;
    readonly targetServer: string;
    readonly performanceBudget: PerformanceBudget;
    constructor(type: HookType);
    abstract execute(context: HookContext): Promise<HookResult>;
    validateInput(context: HookContext): Promise<ValidationResult>;
    optimizeExecution(context: HookContext): Promise<OptimizationResult>;
    cacheResult(context: HookContext, result: HookResult): Promise<void>;
    getCachedResult(context: HookContext): Promise<HookResult | null>;
    protected canUseFastPath(context: HookContext): boolean;
    protected shouldCache(context: HookContext): boolean;
    protected shouldCompress(context: HookContext): boolean;
    protected calculateComplexity(context: HookContext): number;
    private getOperationComplexity;
    protected generateCacheKey(context: HookContext): string;
    protected createSuccessResult(data: any, performance: any, cacheInfo: any): HookResult;
    protected createErrorResult(error: Error, executionTime: number): HookResult;
}
//# sourceMappingURL=BaseHook.d.ts.map