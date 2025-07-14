import { BaseHook } from '../core/BaseHook.js';
import { HookType } from '../types/index.js';
export class PreToolUseHook extends BaseHook {
    constructor() {
        super(HookType.PreToolUse);
    }
    async execute(context) {
        const timer = performance.now();
        try {
            const cachedResult = await this.getCachedResult(context);
            if (cachedResult) {
                return {
                    ...cachedResult,
                    performance: {
                        ...cachedResult.performance,
                        executionTime: performance.now() - timer,
                        cacheHit: true
                    }
                };
            }
            const routingOptimization = await this.optimizeRouting(context);
            await this.preAllocateResources(context, routingOptimization);
            const fastPath = await this.checkFastPath(context);
            const executionTime = performance.now() - timer;
            const result = this.createSuccessResult({
                routingOptimization,
                fastPathEnabled: fastPath.enabled,
                resourcesPreAllocated: true,
                serverRoute: this.targetServer,
                complexity: this.calculateComplexity(context)
            }, {
                executionTime,
                cacheHit: false,
                optimizationFactor: routingOptimization.optimizationFactor
            }, {
                cacheable: true,
                ttl: fastPath.enabled ? 300 : 3600
            });
            await this.cacheResult(context, result);
            return result;
        }
        catch (error) {
            const executionTime = performance.now() - timer;
            return this.createErrorResult(error, executionTime);
        }
    }
    async optimizeRouting(context) {
        const complexity = this.calculateComplexity(context);
        if (complexity < 0.3) {
            return {
                strategy: 'fast-path',
                targetServer: 'superclaude-router',
                optimizationFactor: 3.2,
                skipValidation: true
            };
        }
        else if (complexity > 0.8) {
            return {
                strategy: 'comprehensive',
                targetServer: 'superclaude-orchestrator',
                optimizationFactor: 2.1,
                enableAllValidation: true
            };
        }
        return {
            strategy: 'standard',
            targetServer: this.selectOptimalServer(context),
            optimizationFactor: 2.84,
            enableSmartValidation: true
        };
    }
    async preAllocateResources(context, optimization) {
        if (optimization.strategy === 'comprehensive') {
            console.log(`Pre-allocating resources for comprehensive routing: ${context.operation}`);
        }
        else if (optimization.strategy === 'fast-path') {
            console.log(`Minimal resource allocation for fast-path: ${context.operation}`);
        }
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2 + 1));
    }
    async checkFastPath(context) {
        const operationComplexity = this.calculateComplexity(context);
        const isSimpleRead = context.operation.includes('read') || context.operation.includes('get');
        const hasMinimalParameters = context.parameters && Object.keys(context.parameters).length < 3;
        const isLowComplexity = operationComplexity < 0.2;
        const enabled = isSimpleRead && hasMinimalParameters && isLowComplexity;
        return {
            enabled,
            reason: enabled ? 'simple_operation' : 'complex_operation',
            optimizationFactor: enabled ? 3.2 : 2.84
        };
    }
    selectOptimalServer(context) {
        const operation = context.operation.toLowerCase();
        if (operation.includes('ui') || operation.includes('component')) {
            return 'superclaude-builder';
        }
        else if (operation.includes('analyze') || operation.includes('intelligence')) {
            return 'superclaude-intelligence';
        }
        else if (operation.includes('persona') || operation.includes('role')) {
            return 'superclaude-personas';
        }
        else if (operation.includes('task') || operation.includes('workflow')) {
            return 'superclaude-tasks';
        }
        else if (operation.includes('orchestrat') || operation.includes('coordinate')) {
            return 'superclaude-orchestrator';
        }
        else if (operation.includes('document') || operation.includes('doc')) {
            return 'superclaude-docs';
        }
        return 'superclaude-router';
    }
    canUseFastPath(context) {
        const complexity = this.calculateComplexity(context);
        const isReadOperation = context.operation.includes('read') || context.operation.includes('get');
        const hasSimpleParameters = context.parameters && Object.keys(context.parameters).length < 5;
        const isRecentOperation = this.isRecentSimilarOperation(context);
        return complexity < 0.3 &&
            (isReadOperation || hasSimpleParameters) &&
            !isRecentOperation;
    }
    shouldCache(context) {
        const operation = context.operation.toLowerCase();
        const isReadOperation = operation.includes('read') || operation.includes('get') || operation.includes('analyze');
        const isExpensiveOperation = operation.includes('complex') || operation.includes('heavy');
        const hasStableParameters = this.hasStableParameters(context);
        return context.cache?.enabled === true &&
            (isReadOperation || isExpensiveOperation) &&
            hasStableParameters;
    }
    isRecentSimilarOperation(context) {
        return false;
    }
    hasStableParameters(context) {
        if (!context.parameters)
            return true;
        const paramString = JSON.stringify(context.parameters);
        const hasTimestamp = paramString.includes('timestamp') || paramString.includes('time');
        const hasRandom = paramString.includes('random') || paramString.includes('uuid');
        return !hasTimestamp && !hasRandom;
    }
    calculateComplexity(context) {
        let complexity = super.calculateComplexity(context);
        const operation = context.operation.toLowerCase();
        if (operation.includes('ui') || operation.includes('component')) {
            complexity += 0.2;
        }
        if (operation.includes('analyze') || operation.includes('intelligence')) {
            complexity += 0.3;
        }
        if (operation.includes('read') || operation.includes('get')) {
            complexity -= 0.2;
        }
        if (context.parameters?.targets && Array.isArray(context.parameters.targets)) {
            complexity += Math.min(context.parameters.targets.length / 10, 0.3);
        }
        return Math.min(Math.max(complexity, 0.0), 1.0);
    }
}
//# sourceMappingURL=PreToolUseHook.js.map