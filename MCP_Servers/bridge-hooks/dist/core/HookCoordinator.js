import { HookType, SYSTEM_PERFORMANCE_TARGETS } from '../types/index.js';
import { PreToolUseHook } from '../hooks/PreToolUseHook.js';
import { PostToolUseHook } from '../hooks/PostToolUseHook.js';
import { PrePromptHook, PostPromptHook } from '../hooks/PromptHooks.js';
import { PreCompactHook, StopHook, SubagentStopHook } from '../hooks/CompactAndStopHooks.js';
import { PerformanceTracker } from './PerformanceTracker.js';
export class HookCoordinator {
    hooks = new Map();
    serverMappings = new Map();
    performanceTracker;
    executionCount = 0;
    constructor() {
        this.performanceTracker = new PerformanceTracker({
            targetAverageTime: SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME,
            targetOptimizationFactor: SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR
        });
        this.initializeDefaultHooks();
        this.setupPerformanceMonitoring();
    }
    initializeDefaultHooks() {
        this.registerHook(new PreToolUseHook());
        this.registerHook(new PostToolUseHook());
        this.registerHook(new PrePromptHook());
        this.registerHook(new PostPromptHook());
        this.registerHook(new PreCompactHook());
        this.registerHook(new StopHook());
        this.registerHook(new SubagentStopHook());
        console.log(`Initialized ${this.hooks.size} default hooks with proven performance targets`);
    }
    registerHook(hook) {
        this.hooks.set(hook.type, hook);
        this.serverMappings.set(hook.type, hook.targetServer);
        console.log(`Registered hook: ${hook.type} -> ${hook.targetServer} (${hook.performanceBudget.maxExecutionTime}ms budget, ${hook.performanceBudget.optimizationFactor}x optimization)`);
    }
    async registerHookMapping(mapping) {
        this.serverMappings.set(mapping.hookType, mapping.serverName);
        const hook = this.hooks.get(mapping.hookType);
        if (hook) {
            hook.performanceBudget.maxExecutionTime = mapping.performanceBudget.maxExecutionTime;
            hook.performanceBudget.optimizationFactor = mapping.performanceBudget.optimizationFactor ?? hook.performanceBudget.optimizationFactor;
        }
        console.log(`Updated hook mapping: ${mapping.hookType} -> ${mapping.serverName}`);
    }
    unregisterHook(hookType) {
        this.hooks.delete(hookType);
        this.serverMappings.delete(hookType);
        console.log(`Unregistered hook: ${hookType}`);
    }
    async executeHook(hookType, context) {
        const hook = this.hooks.get(hookType);
        if (!hook) {
            throw new Error(`Hook ${hookType} not registered`);
        }
        const validation = await hook.validateInput(context);
        if (!validation.success) {
            throw new Error(`Hook validation failed: ${validation.issues?.join(', ')}`);
        }
        const timer = this.performanceTracker.startTimer(`coord.${hookType}`);
        this.executionCount++;
        try {
            const result = await hook.execute(context);
            const metrics = await this.performanceTracker.endTimer(timer);
            await this.validatePerformanceBudget(hook, metrics);
            await this.updateCoordinationMetrics(hookType, result, metrics);
            return result;
        }
        catch (error) {
            await this.performanceTracker.endTimer(timer);
            throw error;
        }
    }
    async executeHookChain(hookTypes, context) {
        const results = [];
        let updatedContext = { ...context };
        for (const hookType of hookTypes) {
            try {
                const result = await this.executeHook(hookType, updatedContext);
                results.push(result);
                if (result.success && result.data) {
                    updatedContext = {
                        ...updatedContext,
                        data: { ...updatedContext.data, ...result.data }
                    };
                }
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error,
                    performance: { executionTime: 0, optimizationFactor: 1.0 },
                    cacheInfo: { cacheable: false }
                });
                if (this.isCriticalHook(hookType)) {
                    break;
                }
            }
        }
        return results;
    }
    async getHookMetrics(hookType) {
        if (hookType) {
            return await this.performanceTracker.getMetrics(`coord.${hookType}`);
        }
        return await this.performanceTracker.getOverallMetrics();
    }
    async getSystemHealth() {
        const metrics = await this.performanceTracker.getOverallMetrics();
        const report = this.performanceTracker.getPerformanceReport();
        return {
            registeredHooks: this.hooks.size,
            totalExecutions: this.executionCount,
            performance: metrics,
            systemHealth: report.systemHealth,
            hookStatus: this.getHookStatus()
        };
    }
    async optimizeHookChain(hookTypes) {
        const optimization = {
            originalChain: hookTypes,
            optimizedChain: [...hookTypes],
            optimizations: [],
            estimatedImprovement: 0.0
        };
        const reorderedChain = this.optimizeHookOrder(hookTypes);
        if (JSON.stringify(reorderedChain) !== JSON.stringify(hookTypes)) {
            optimization.optimizedChain = reorderedChain;
            optimization.optimizations.push('reordered_for_performance');
            optimization.estimatedImprovement += 0.15;
        }
        const parallelizable = this.identifyParallelizableHooks(hookTypes);
        if (parallelizable.length > 0) {
            optimization.optimizations.push('parallel_execution_opportunities');
            optimization.estimatedImprovement += parallelizable.length * 0.1;
        }
        const cachingOpportunities = this.identifyCachingOpportunities(hookTypes);
        if (cachingOpportunities.length > 0) {
            optimization.optimizations.push('caching_optimizations');
            optimization.estimatedImprovement += cachingOpportunities.length * 0.05;
        }
        return optimization;
    }
    getRegisteredHooks() {
        return Array.from(this.hooks.keys());
    }
    getServerMapping(hookType) {
        return this.serverMappings.get(hookType);
    }
    async resetMetrics() {
        this.performanceTracker.resetMetrics();
        this.executionCount = 0;
        console.log('Hook coordinator metrics reset');
    }
    async validatePerformanceBudget(hook, metrics) {
        const budget = hook.performanceBudget;
        if (metrics.executionTime > budget.maxExecutionTime * 1.5) {
            console.warn(`Hook ${hook.type} exceeded performance budget: ${metrics.executionTime}ms > ${budget.maxExecutionTime}ms`);
        }
        if (metrics.optimizationFactor && metrics.optimizationFactor < (budget.optimizationFactor || 1.0) * 0.5) {
            console.warn(`Hook ${hook.type} underperforming optimization target: ${metrics.optimizationFactor} < ${budget.optimizationFactor}`);
        }
    }
    async updateCoordinationMetrics(hookType, result, metrics) {
        const coordinationMetrics = {
            hookType,
            success: result.success,
            executionTime: metrics.executionTime,
            optimizationFactor: result.performance.optimizationFactor,
            cacheHit: result.performance.cacheHit || false
        };
        console.log(`Coordination metrics updated for ${hookType}:`, coordinationMetrics);
    }
    isCriticalHook(hookType) {
        const criticalHooks = [HookType.PreToolUse, HookType.PostToolUse];
        return criticalHooks.includes(hookType);
    }
    getHookStatus() {
        const status = {};
        for (const [hookType, hook] of this.hooks) {
            const serverMapping = this.serverMappings.get(hookType);
            const isPerforming = this.performanceTracker.isPerformingWithinBudget(`coord.${hookType}`);
            status[hookType] = {
                registered: true,
                targetServer: serverMapping,
                performanceBudget: hook.performanceBudget,
                withinBudget: isPerforming
            };
        }
        return status;
    }
    optimizeHookOrder(hookTypes) {
        const priorityOrder = [
            HookType.PrePrompt,
            HookType.PostPrompt,
            HookType.PreCompact,
            HookType.PreToolUse,
            HookType.PostToolUse,
            HookType.SubagentStop,
            HookType.Stop
        ];
        return hookTypes.sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a);
            const bIndex = priorityOrder.indexOf(b);
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
    }
    identifyParallelizableHooks(hookTypes) {
        const parallelizable = [];
        if (hookTypes.includes(HookType.PrePrompt) && hookTypes.includes(HookType.PostPrompt)) {
            parallelizable.push(HookType.PrePrompt, HookType.PostPrompt);
        }
        return parallelizable;
    }
    identifyCachingOpportunities(hookTypes) {
        const cachingCandidates = [];
        const analysisHooks = [HookType.PreCompact, HookType.PreToolUse];
        for (const hookType of analysisHooks) {
            if (hookTypes.includes(hookType)) {
                cachingCandidates.push(hookType);
            }
        }
        return cachingCandidates;
    }
    setupPerformanceMonitoring() {
        setInterval(async () => {
            const report = this.performanceTracker.getPerformanceReport();
            if (!report.systemHealth.withinBudget) {
                console.warn('Hook coordinator performance degradation detected:', report.systemHealth);
            }
            if (!report.systemHealth.optimizationTarget) {
                console.warn('Hook coordinator optimization factor below target:', report.overall.optimizationFactor);
            }
        }, 60000);
    }
}
//# sourceMappingURL=HookCoordinator.js.map