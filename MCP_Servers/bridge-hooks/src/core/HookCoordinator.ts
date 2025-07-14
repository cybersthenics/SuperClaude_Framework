import { BaseHook } from './BaseHook.js';
import { HookType, HookServerMapping, HookContext, HookResult, SYSTEM_PERFORMANCE_TARGETS } from '../types/index.js';
import { PreToolUseHook } from '../hooks/PreToolUseHook.js';
import { PostToolUseHook } from '../hooks/PostToolUseHook.js';
import { PrePromptHook, PostPromptHook } from '../hooks/PromptHooks.js';
import { PreCompactHook, StopHook, SubagentStopHook } from '../hooks/CompactAndStopHooks.js';
import { PerformanceTracker } from './PerformanceTracker.js';

export class HookCoordinator {
  private hooks: Map<HookType, BaseHook> = new Map();
  private serverMappings: Map<HookType, string> = new Map();
  private performanceTracker: PerformanceTracker;
  private executionCount: number = 0;

  constructor() {
    this.performanceTracker = new PerformanceTracker({
      targetAverageTime: SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME,
      targetOptimizationFactor: SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR
    });

    this.initializeDefaultHooks();
    this.setupPerformanceMonitoring();
  }

  private initializeDefaultHooks(): void {
    // Register all default hook implementations
    this.registerHook(new PreToolUseHook());
    this.registerHook(new PostToolUseHook());
    this.registerHook(new PrePromptHook());
    this.registerHook(new PostPromptHook());
    this.registerHook(new PreCompactHook());
    this.registerHook(new StopHook());
    this.registerHook(new SubagentStopHook());

    console.log(`Initialized ${this.hooks.size} default hooks with proven performance targets`);
  }

  registerHook(hook: BaseHook): void {
    this.hooks.set(hook.type, hook);
    this.serverMappings.set(hook.type, hook.targetServer);
    
    console.log(`Registered hook: ${hook.type} -> ${hook.targetServer} (${hook.performanceBudget.maxExecutionTime}ms budget, ${hook.performanceBudget.optimizationFactor}x optimization)`);
  }

  async registerHookMapping(mapping: HookServerMapping): Promise<void> {
    // Register custom hook-to-server mapping
    this.serverMappings.set(mapping.hookType, mapping.serverName);
    
    // Update hook performance budget if needed
    const hook = this.hooks.get(mapping.hookType);
    if (hook) {
      hook.performanceBudget.maxExecutionTime = mapping.performanceBudget.maxExecutionTime;
      hook.performanceBudget.optimizationFactor = mapping.performanceBudget.optimizationFactor ?? hook.performanceBudget.optimizationFactor;
    }

    console.log(`Updated hook mapping: ${mapping.hookType} -> ${mapping.serverName}`);
  }

  unregisterHook(hookType: HookType): void {
    this.hooks.delete(hookType);
    this.serverMappings.delete(hookType);
    console.log(`Unregistered hook: ${hookType}`);
  }

  async executeHook(hookType: HookType, context: HookContext): Promise<HookResult> {
    const hook = this.hooks.get(hookType);
    if (!hook) {
      throw new Error(`Hook ${hookType} not registered`);
    }

    // Validate hook context
    const validation = await hook.validateInput(context);
    if (!validation.success) {
      throw new Error(`Hook validation failed: ${validation.issues?.join(', ')}`);
    }

    // Start performance tracking
    const timer = this.performanceTracker.startTimer(`coord.${hookType}`);
    this.executionCount++;

    try {
      // Execute the hook
      const result = await hook.execute(context);
      
      // End performance tracking
      const metrics = await this.performanceTracker.endTimer(timer);
      
      // Validate performance against budget
      await this.validatePerformanceBudget(hook, metrics);
      
      // Update coordination metrics
      await this.updateCoordinationMetrics(hookType, result, metrics);
      
      return result;
    } catch (error) {
      await this.performanceTracker.endTimer(timer);
      throw error;
    }
  }

  async executeHookChain(hookTypes: HookType[], context: HookContext): Promise<HookResult[]> {
    // Execute multiple hooks in sequence with coordination
    const results: HookResult[] = [];
    let updatedContext = { ...context };

    for (const hookType of hookTypes) {
      try {
        const result = await this.executeHook(hookType, updatedContext);
        results.push(result);
        
        // Update context with result data for next hook
        if (result.success && result.data) {
          updatedContext = {
            ...updatedContext,
            data: { ...updatedContext.data, ...result.data }
          };
        }
      } catch (error) {
        // Add error result and continue or stop based on hook type
        results.push({
          success: false,
          error: error as Error,
          performance: { executionTime: 0, optimizationFactor: 1.0 },
          cacheInfo: { cacheable: false }
        });

        // Stop chain execution for critical hooks
        if (this.isCriticalHook(hookType)) {
          break;
        }
      }
    }

    return results;
  }

  async getHookMetrics(hookType?: HookType): Promise<any> {
    if (hookType) {
      return await this.performanceTracker.getMetrics(`coord.${hookType}`);
    }
    return await this.performanceTracker.getOverallMetrics();
  }

  async getSystemHealth(): Promise<any> {
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

  async optimizeHookChain(hookTypes: HookType[]): Promise<any> {
    // Analyze and optimize hook execution chain
    const optimization = {
      originalChain: hookTypes,
      optimizedChain: [...hookTypes],
      optimizations: [] as string[],
      estimatedImprovement: 0.0
    };

    // Reorder hooks for optimal performance
    const reorderedChain = this.optimizeHookOrder(hookTypes);
    if (JSON.stringify(reorderedChain) !== JSON.stringify(hookTypes)) {
      optimization.optimizedChain = reorderedChain;
      optimization.optimizations.push('reordered_for_performance');
      optimization.estimatedImprovement += 0.15;
    }

    // Identify parallelizable hooks
    const parallelizable = this.identifyParallelizableHooks(hookTypes);
    if (parallelizable.length > 0) {
      optimization.optimizations.push('parallel_execution_opportunities');
      optimization.estimatedImprovement += parallelizable.length * 0.1;
    }

    // Suggest caching optimizations
    const cachingOpportunities = this.identifyCachingOpportunities(hookTypes);
    if (cachingOpportunities.length > 0) {
      optimization.optimizations.push('caching_optimizations');
      optimization.estimatedImprovement += cachingOpportunities.length * 0.05;
    }

    return optimization;
  }

  getRegisteredHooks(): HookType[] {
    return Array.from(this.hooks.keys());
  }

  getServerMapping(hookType: HookType): string | undefined {
    return this.serverMappings.get(hookType);
  }

  async resetMetrics(): Promise<void> {
    this.performanceTracker.resetMetrics();
    this.executionCount = 0;
    console.log('Hook coordinator metrics reset');
  }

  private async validatePerformanceBudget(hook: BaseHook, metrics: any): Promise<void> {
    const budget = hook.performanceBudget;
    
    if (metrics.executionTime > budget.maxExecutionTime * 1.5) {
      console.warn(`Hook ${hook.type} exceeded performance budget: ${metrics.executionTime}ms > ${budget.maxExecutionTime}ms`);
    }
    
    if (metrics.optimizationFactor && metrics.optimizationFactor < (budget.optimizationFactor || 1.0) * 0.5) {
      console.warn(`Hook ${hook.type} underperforming optimization target: ${metrics.optimizationFactor} < ${budget.optimizationFactor}`);
    }
  }

  private async updateCoordinationMetrics(hookType: HookType, result: HookResult, metrics: any): Promise<void> {
    // Update coordination-specific metrics
    const coordinationMetrics = {
      hookType,
      success: result.success,
      executionTime: metrics.executionTime,
      optimizationFactor: result.performance.optimizationFactor,
      cacheHit: result.performance.cacheHit || false
    };

    console.log(`Coordination metrics updated for ${hookType}:`, coordinationMetrics);
    // In production, this would update actual metrics storage
  }

  private isCriticalHook(hookType: HookType): boolean {
    // Define which hooks are critical for chain execution
    const criticalHooks = [HookType.PreToolUse, HookType.PostToolUse];
    return criticalHooks.includes(hookType);
  }

  private getHookStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
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

  private optimizeHookOrder(hookTypes: HookType[]): HookType[] {
    // Optimize hook execution order for performance
    const priorityOrder = [
      HookType.PrePrompt,      // Fastest execution
      HookType.PostPrompt,     // Fast execution
      HookType.PreCompact,     // Medium execution
      HookType.PreToolUse,     // Medium execution
      HookType.PostToolUse,    // Medium execution
      HookType.SubagentStop,   // Slower execution
      HookType.Stop            // Slowest execution (cleanup)
    ];

    return hookTypes.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }

  private identifyParallelizableHooks(hookTypes: HookType[]): HookType[] {
    // Identify hooks that can be executed in parallel
    const parallelizable: HookType[] = [];
    
    // Prompt hooks can often be parallelized
    if (hookTypes.includes(HookType.PrePrompt) && hookTypes.includes(HookType.PostPrompt)) {
      parallelizable.push(HookType.PrePrompt, HookType.PostPrompt);
    }
    
    return parallelizable;
  }

  private identifyCachingOpportunities(hookTypes: HookType[]): HookType[] {
    // Identify hooks that would benefit from enhanced caching
    const cachingCandidates: HookType[] = [];
    
    // Analysis-heavy hooks benefit from caching
    const analysisHooks = [HookType.PreCompact, HookType.PreToolUse];
    for (const hookType of analysisHooks) {
      if (hookTypes.includes(hookType)) {
        cachingCandidates.push(hookType);
      }
    }
    
    return cachingCandidates;
  }

  private setupPerformanceMonitoring(): void {
    // Set up periodic performance monitoring
    setInterval(async () => {
      const report = this.performanceTracker.getPerformanceReport();
      
      if (!report.systemHealth.withinBudget) {
        console.warn('Hook coordinator performance degradation detected:', report.systemHealth);
      }
      
      if (!report.systemHealth.optimizationTarget) {
        console.warn('Hook coordinator optimization factor below target:', report.overall.optimizationFactor);
      }
    }, 60000); // Check every minute
  }
}