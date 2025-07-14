import { 
  HookType, 
  HookContext, 
  HookResult, 
  PerformanceBudget, 
  ValidationResult,
  OptimizationResult,
  PROVEN_PERFORMANCE_TARGETS 
} from '../types/index.js';

export abstract class BaseHook {
  public readonly type: HookType;
  public readonly targetServer: string;
  public readonly performanceBudget: PerformanceBudget;

  constructor(type: HookType) {
    this.type = type;
    const target = PROVEN_PERFORMANCE_TARGETS[type];
    this.targetServer = target.targetServer;
    this.performanceBudget = {
      maxExecutionTime: target.maxExecutionTime,
      maxMemoryUsage: 100, // MB default
      maxCPUUsage: 50, // % default
      cacheHitRateTarget: 80, // % default
      optimizationFactor: target.optimizationFactor
    };
  }

  abstract execute(context: HookContext): Promise<HookResult>;

  async validateInput(context: HookContext): Promise<ValidationResult> {
    try {
      // Basic validation - subclasses can override for specific validation
      if (!context.sessionId) {
        return { success: false, issues: ['Missing sessionId'] };
      }
      
      if (!context.operation) {
        return { success: false, issues: ['Missing operation'] };
      }

      if (!context.metadata?.correlationId) {
        return { success: false, issues: ['Missing correlationId'] };
      }

      // Validate performance budget
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
    } catch (error) {
      return { 
        success: false, 
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  async optimizeExecution(context: HookContext): Promise<OptimizationResult> {
    const optimizations: string[] = [];
    let factor = 1.0;

    // Check for fast-path opportunities
    if (this.canUseFastPath(context)) {
      optimizations.push('fast-path');
      factor *= 1.5;
    }

    // Check for cache opportunities
    if (this.shouldCache(context)) {
      optimizations.push('caching');
      factor *= 1.2;
    }

    // Check for compression opportunities
    if (this.shouldCompress(context)) {
      optimizations.push('compression');
      factor *= 1.1;
    }

    return {
      applied: optimizations.length > 0,
      factor,
      techniques: optimizations,
      resourcesSaved: {
        estimatedTimeReduction: Math.max(0, this.performanceBudget.maxExecutionTime * (1 - 1/factor)),
        memoryOptimization: optimizations.includes('compression') ? 0.3 : 0
      }
    };
  }

  async cacheResult(context: HookContext, result: HookResult): Promise<void> {
    if (!result.cacheInfo.cacheable) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(context);
      const ttl = result.cacheInfo.ttl || context.cache?.ttl || 3600;
      
      // Cache implementation would go here
      // For now, just log the caching intent
      console.log(`Caching result for hook ${this.type} with key: ${cacheKey}, TTL: ${ttl}s`);
    } catch (error) {
      console.warn(`Failed to cache result for hook ${this.type}:`, error);
    }
  }

  async getCachedResult(context: HookContext): Promise<HookResult | null> {
    if (!context.cache?.enabled) {
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(context);
      
      // Cache lookup implementation would go here
      // For now, simulate cache miss
      console.log(`Cache lookup for hook ${this.type} with key: ${cacheKey}`);
      return null;
    } catch (error) {
      console.warn(`Failed to get cached result for hook ${this.type}:`, error);
      return null;
    }
  }

  protected canUseFastPath(context: HookContext): boolean {
    // Default fast-path detection - subclasses can override
    const complexity = this.calculateComplexity(context);
    return complexity < 0.3 && context.parameters && Object.keys(context.parameters).length < 5;
  }

  protected shouldCache(context: HookContext): boolean {
    // Default caching decision - subclasses can override
    return context.cache?.enabled === true && 
           context.operation.includes('read') || 
           context.operation.includes('get') ||
           context.operation.includes('analyze');
  }

  protected shouldCompress(context: HookContext): boolean {
    // Default compression decision - subclasses can override
    const dataSize = JSON.stringify(context.parameters || {}).length;
    return dataSize > 1024; // Compress if data > 1KB
  }

  protected calculateComplexity(context: HookContext): number {
    // Simple complexity calculation based on context
    let complexity = 0.0;
    
    // Parameter complexity
    const paramCount = context.parameters ? Object.keys(context.parameters).length : 0;
    complexity += Math.min(paramCount / 10, 0.5);
    
    // Operation complexity
    const operationComplexity = this.getOperationComplexity(context.operation);
    complexity += operationComplexity;
    
    // Data size complexity
    const dataSize = JSON.stringify(context).length;
    complexity += Math.min(dataSize / 10000, 0.3);
    
    return Math.min(complexity, 1.0);
  }

  private getOperationComplexity(operation: string): number {
    const complexOperations = ['analyze', 'optimize', 'refactor', 'transform'];
    const moderateOperations = ['validate', 'process', 'enhance'];
    
    if (complexOperations.some(op => operation.includes(op))) {
      return 0.7;
    } else if (moderateOperations.some(op => operation.includes(op))) {
      return 0.4;
    }
    return 0.1;
  }

  protected generateCacheKey(context: HookContext): string {
    // Generate deterministic cache key based on context
    const keyComponents = [
      this.type,
      context.operation,
      context.sessionId,
      JSON.stringify(context.parameters || {})
    ];
    
    // Simple hash function (in production, use crypto.createHash)
    return keyComponents.join('|').replace(/[^a-zA-Z0-9]/g, '_');
  }

  protected createSuccessResult(data: any, performance: any, cacheInfo: any): HookResult {
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

  protected createErrorResult(error: Error, executionTime: number): HookResult {
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