import { BaseHook } from './BaseHook.js';
import { HookType, HookServerMapping, HookContext, HookResult } from '../types/index.js';
export declare class HookCoordinator {
    private hooks;
    private serverMappings;
    private performanceTracker;
    private executionCount;
    constructor();
    private initializeDefaultHooks;
    registerHook(hook: BaseHook): void;
    registerHookMapping(mapping: HookServerMapping): Promise<void>;
    unregisterHook(hookType: HookType): void;
    executeHook(hookType: HookType, context: HookContext): Promise<HookResult>;
    executeHookChain(hookTypes: HookType[], context: HookContext): Promise<HookResult[]>;
    getHookMetrics(hookType?: HookType): Promise<any>;
    getSystemHealth(): Promise<any>;
    optimizeHookChain(hookTypes: HookType[]): Promise<any>;
    getRegisteredHooks(): HookType[];
    getServerMapping(hookType: HookType): string | undefined;
    resetMetrics(): Promise<void>;
    private validatePerformanceBudget;
    private updateCoordinationMetrics;
    private isCriticalHook;
    private getHookStatus;
    private optimizeHookOrder;
    private identifyParallelizableHooks;
    private identifyCachingOpportunities;
    private setupPerformanceMonitoring;
}
//# sourceMappingURL=HookCoordinator.d.ts.map