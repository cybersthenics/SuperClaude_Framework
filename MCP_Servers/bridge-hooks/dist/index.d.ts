#!/usr/bin/env node
declare class SuperClaudeHooksIntegration {
    private bridgeService;
    private hookCoordinator;
    private isRunning;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private registerHooksWithBridge;
    private getHookPerformanceBudget;
    private validateSystemHealth;
    private startHealthMonitoring;
    private setupSignalHandlers;
}
export { SuperClaudeHooksIntegration };
export * from './types/index.js';
export * from './core/BridgeService.js';
export * from './core/HookCoordinator.js';
export * from './core/BaseHook.js';
export { PerformanceTracker } from './core/PerformanceTracker.js';
//# sourceMappingURL=index.d.ts.map