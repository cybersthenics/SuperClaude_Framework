import { PROVEN_PERFORMANCE_TARGETS } from '../types/index.js';
export class BaseHook {
    type;
    targetServer;
    performanceBudget;
    constructor(type) {
        this.type = type;
        const target = PROVEN_PERFORMANCE_TARGETS[type];
        this.targetServer = target.targetServer;
        this.performanceBudget = {
            maxExecutionTime: target.maxExecutionTime,
            maxMemoryUsage: 100,
            maxCPUUsage: 50,
            cacheHitRateTarget: 80,
            optimizationFactor: target.optimizationFactor
        };
    }
    async validateInput(context) {
        try {
            if (!context.sessionId) {
                return { success: false, issues: ['Missing sessionId'] };
            }
            if (!context.operation) {
                return { success: false, issues: ['Missing operation'] };
            }
            if (!context.metadata?.correlationId) {
                return { success: false, issues: ['Missing correlationId'] };
            }
            if (context.performance?.budget) {
                const budget = context.performance.budget;
                if (budget.maxExecutionTime > this.performanceBudget.maxExecutionTime * 1.5) {
                    return {
                        success: false,
                        issues: [`Budget exceeds limit: ${budget.maxExecutionTime}ms > ${this.performanceBudget.maxExecutionTime * 1.5}ms`]
                    };
                }
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async optimizeExecution(context) {
        const optimizations = [];
        let factor = 1.0;
        if (this.canUseFastPath(context)) {
            optimizations.push('fast-path');
            factor *= 1.5;
        }
        if (this.shouldCache(context)) {
            optimizations.push('caching');
            factor *= 1.2;
        }
        if (this.shouldCompress(context)) {
            optimizations.push('compression');
            factor *= 1.1;
        }
        return {
            applied: optimizations.length > 0,
            factor,
            techniques: optimizations,
            resourcesSaved: {
                estimatedTimeReduction: Math.max(0, this.performanceBudget.maxExecutionTime * (1 - 1 / factor)),
                memoryOptimization: optimizations.includes('compression') ? 0.3 : 0
            }
        };
    }
    async cacheResult(context, result) {
        if (!result.cacheInfo.cacheable) {
            return;
        }
        try {
            const cacheKey = this.generateCacheKey(context);
            const ttl = result.cacheInfo.ttl || context.cache?.ttl || 3600;
            console.log(`Caching result for hook ${this.type} with key: ${cacheKey}, TTL: ${ttl}s`);
        }
        catch (error) {
            console.warn(`Failed to cache result for hook ${this.type}:`, error);
        }
    }
    async getCachedResult(context) {
        if (!context.cache?.enabled) {
            return null;
        }
        try {
            const cacheKey = this.generateCacheKey(context);
            console.log(`Cache lookup for hook ${this.type} with key: ${cacheKey}`);
            return null;
        }
        catch (error) {
            console.warn(`Failed to get cached result for hook ${this.type}:`, error);
            return null;
        }
    }
    canUseFastPath(context) {
        const complexity = this.calculateComplexity(context);
        return complexity < 0.3 && context.parameters && Object.keys(context.parameters).length < 5;
    }
    shouldCache(context) {
        return context.cache?.enabled === true &&
            context.operation.includes('read') ||
            context.operation.includes('get') ||
            context.operation.includes('analyze');
    }
    shouldCompress(context) {
        const dataSize = JSON.stringify(context.parameters || {}).length;
        return dataSize > 1024;
    }
    calculateComplexity(context) {
        let complexity = 0.0;
        const paramCount = context.parameters ? Object.keys(context.parameters).length : 0;
        complexity += Math.min(paramCount / 10, 0.5);
        const operationComplexity = this.getOperationComplexity(context.operation);
        complexity += operationComplexity;
        const dataSize = JSON.stringify(context).length;
        complexity += Math.min(dataSize / 10000, 0.3);
        return Math.min(complexity, 1.0);
    }
    getOperationComplexity(operation) {
        const complexOperations = ['analyze', 'optimize', 'refactor', 'transform'];
        const moderateOperations = ['validate', 'process', 'enhance'];
        if (complexOperations.some(op => operation.includes(op))) {
            return 0.7;
        }
        else if (moderateOperations.some(op => operation.includes(op))) {
            return 0.4;
        }
        return 0.1;
    }
    generateCacheKey(context) {
        const keyComponents = [
            this.type,
            context.operation,
            context.sessionId,
            JSON.stringify(context.parameters || {})
        ];
        return keyComponents.join('|').replace(/[^a-zA-Z0-9]/g, '_');
    }
    createSuccessResult(data, performance, cacheInfo) {
        return {
            success: true,
            data,
            performance: {
                executionTime: performance.executionTime || 0,
                optimizationFactor: this.performanceBudget.optimizationFactor ?? 1.0,
                ...performance
            },
            cacheInfo: {
                cacheable: true,
                ttl: 3600,
                ...cacheInfo
            }
        };
    }
    createErrorResult(error, executionTime) {
        return {
            success: false,
            error,
            performance: {
                executionTime,
                optimizationFactor: 1.0
            },
            cacheInfo: {
                cacheable: false
            }
        };
    }
}
//# sourceMappingURL=BaseHook.js.map