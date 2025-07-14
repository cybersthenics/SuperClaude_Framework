/**
 * SuperClaude Quality Validation Execution Engine
 * Executes quality gates with parallel processing and optimization
 */

import {
  QualityValidationContext,
  QualityGate,
  GateResult,
  ValidationStatus
} from '../types/index.js';

import { ValidationPlan, OptimizedExecutionPlan } from './QualityOrchestrator.js';
import { ValidationCacheManager } from '../utils/ValidationCacheManager.js';
import { ProgressTracker } from '../utils/ProgressTracker.js';
import { Logger } from '../utils/Logger.js';

export interface ExecutionResult {
  gateResults: GateResult[];
  overallStatus: ValidationStatus;
  executionTime: number;
  parallelExecutionTime?: number;
}

export interface ParallelExecutor {
  executeParallel<T>(tasks: (() => Promise<T>)[], maxConcurrency: number): Promise<T[]>;
}

export interface CacheResult {
  hit: boolean;
  result?: GateResult;
  key: string;
}

export interface FailureResult {
  gate: string;
  error: Error;
  shouldRetry: boolean;
  fallbackResult?: GateResult;
}

export interface TimeoutResult {
  gate: string;
  partialResult?: Partial<GateResult>;
  timeoutDuration: number;
}

export class ValidationExecutionEngine {
  private parallelExecutor: ParallelExecutor;
  private cacheManager: ValidationCacheManager;
  private progressTracker: ProgressTracker;
  private logger: Logger;
  private maxConcurrency: number = 5;

  constructor() {
    this.parallelExecutor = new DefaultParallelExecutor();
    this.cacheManager = new ValidationCacheManager();
    this.progressTracker = new ProgressTracker();
    this.logger = new Logger('ValidationExecutionEngine');
  }

  /**
   * Execute a complete validation plan
   */
  async executeValidationPlan(plan: ValidationPlan & OptimizedExecutionPlan): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.logger.info('Executing validation plan', { 
      gatesCount: plan.gates.length,
      estimatedTime: plan.estimatedTime 
    });

    try {
      this.progressTracker.start(plan.gates.length);

      let gateResults: GateResult[] = [];

      if (plan.parallelGroups.length > 1) {
        // Execute in parallel groups
        for (const group of plan.parallelGroups) {
          const groupGates = plan.gates.filter(g => group.includes(g.name));
          const groupResults = await this.executeGateParallel(groupGates, this.createMockContext());
          gateResults.push(...groupResults);
          
          this.progressTracker.updateProgress(gateResults.length);
        }
      } else {
        // Execute sequentially
        gateResults = await this.executeGateSequential(plan.gates, this.createMockContext());
      }

      const executionTime = Date.now() - startTime;
      const overallStatus = this.determineOverallStatus(gateResults);

      this.progressTracker.complete();

      this.logger.info('Validation plan completed', {
        overallStatus,
        executionTime,
        gatesExecuted: gateResults.length
      });

      return {
        gateResults,
        overallStatus,
        executionTime
      };

    } catch (error) {
      this.logger.error('Validation plan execution failed', { error });
      this.progressTracker.fail(error.message);
      throw error;
    }
  }

  /**
   * Execute gates in parallel
   */
  async executeGateParallel(gates: QualityGate[], context: QualityValidationContext): Promise<GateResult[]> {
    this.logger.debug('Executing gates in parallel', { gateCount: gates.length });

    const executionTasks = gates.map(gate => async () => {
      // Check dependencies first
      const dependenciesReady = await this.checkGateDependencies(gate, []);
      if (!dependenciesReady) {
        throw new Error(`Dependencies not met for gate: ${gate.name}`);
      }

      // Check cache
      const cacheResult = await this.applyCaching(gate, context);
      if (cacheResult.hit && cacheResult.result) {
        this.logger.debug('Cache hit for gate', { gate: gate.name });
        return cacheResult.result;
      }

      // Execute gate with timeout
      return await this.executeGateWithTimeout(gate, context);
    });

    try {
      const results = await this.parallelExecutor.executeParallel(executionTasks, this.maxConcurrency);
      return results;
    } catch (error) {
      this.logger.error('Parallel execution failed', { error });
      throw error;
    }
  }

  /**
   * Execute gates sequentially
   */
  async executeGateSequential(gates: QualityGate[], context: QualityValidationContext): Promise<GateResult[]> {
    this.logger.debug('Executing gates sequentially', { gateCount: gates.length });

    const results: GateResult[] = [];
    const completedGates: string[] = [];

    for (const gate of gates) {
      try {
        // Check dependencies
        const dependenciesReady = await this.checkGateDependencies(gate, completedGates);
        if (!dependenciesReady) {
          this.logger.warn('Skipping gate due to unmet dependencies', { 
            gate: gate.name, 
            dependencies: gate.dependencies 
          });
          continue;
        }

        // Check cache
        const cacheResult = await this.applyCaching(gate, context);
        if (cacheResult.hit && cacheResult.result) {
          this.logger.debug('Cache hit for gate', { gate: gate.name });
          results.push(cacheResult.result);
          completedGates.push(gate.name);
          continue;
        }

        // Execute gate
        const result = await this.executeGateWithTimeout(gate, context);
        results.push(result);
        completedGates.push(gate.name);

        // Update progress
        this.progressTracker.updateProgress(results.length);

        // Cache result
        await this.cacheManager.cacheResult(cacheResult.key, result);

      } catch (error) {
        const failureResult = await this.handleGateFailure(gate, error, context);
        if (failureResult.fallbackResult) {
          results.push(failureResult.fallbackResult);
          completedGates.push(gate.name);
        }
      }
    }

    return results;
  }

  /**
   * Handle gate execution failure with retry logic
   */
  async handleGateFailure(gate: QualityGate, error: Error, context: QualityValidationContext): Promise<FailureResult> {
    this.logger.warn('Gate execution failed', { gate: gate.name, error: error.message });

    const shouldRetry = this.shouldRetryGate(gate, error);
    
    if (shouldRetry) {
      this.logger.info('Retrying gate execution', { gate: gate.name });
      try {
        const result = await this.executeGateWithTimeout(gate, context);
        return {
          gate: gate.name,
          error,
          shouldRetry: false,
          fallbackResult: result
        };
      } catch (retryError) {
        this.logger.error('Gate retry failed', { gate: gate.name, retryError });
      }
    }

    // Create fallback result
    const fallbackResult: GateResult = {
      gate: gate.name,
      type: gate.type,
      status: 'failed',
      score: 0,
      issues: [{
        id: `${gate.name}-failure`,
        severity: 'critical',
        category: gate.type,
        message: `Gate execution failed: ${error.message}`,
        location: { file: '', line: 0, column: 0 },
        suggestion: 'Check gate configuration and retry',
        autoFixable: false,
        ruleId: 'gate-execution-failure'
      }],
      processingTime: 0,
      metadata: {
        filesAnalyzed: 0,
        gateDuration: 0,
        error: error.message
      }
    };

    return {
      gate: gate.name,
      error,
      shouldRetry,
      fallbackResult
    };
  }

  /**
   * Optimize execution plan based on current conditions
   */
  async optimizeExecution(plan: ValidationPlan): Promise<ValidationPlan> {
    // Analyze current system resources
    const systemLoad = await this.getSystemLoad();
    
    // Adjust concurrency based on load
    if (systemLoad > 0.8) {
      this.maxConcurrency = Math.max(1, Math.floor(this.maxConcurrency * 0.5));
      this.logger.info('Reduced concurrency due to high system load', { 
        newConcurrency: this.maxConcurrency 
      });
    }

    // Reorder gates based on cache hit probability
    const optimizedGates = await this.reorderGatesByCache(plan.gates);

    return {
      ...plan,
      gates: optimizedGates
    };
  }

  /**
   * Private helper methods
   */
  private async executeGateWithTimeout(gate: QualityGate, context: QualityValidationContext): Promise<GateResult> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Gate execution timeout: ${gate.name} (${gate.timeout}ms)`));
      }, gate.timeout);

      try {
        const startTime = Date.now();
        const result = await gate.validator.validate(context);
        const processingTime = Date.now() - startTime;

        clearTimeout(timeoutId);
        
        resolve({
          gate: gate.name,
          type: gate.type,
          status: result.status,
          score: result.score,
          issues: result.issues,
          processingTime,
          metadata: result.metadata
        });

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private async checkGateDependencies(gate: QualityGate, completedGates: string[]): Promise<boolean> {
    if (!gate.dependencies || gate.dependencies.length === 0) {
      return true;
    }

    return gate.dependencies.every(dep => completedGates.includes(dep));
  }

  private async applyCaching(gate: QualityGate, context: QualityValidationContext): Promise<CacheResult> {
    const cacheKey = this.generateCacheKey(gate, context);
    const cachedResult = await this.cacheManager.getCachedResult(cacheKey);

    return {
      hit: !!cachedResult,
      result: cachedResult,
      key: cacheKey
    };
  }

  private generateCacheKey(gate: QualityGate, context: QualityValidationContext): string {
    const contextHash = this.hashObject({
      target: context.target,
      gateName: gate.name,
      gateConfig: gate.configuration
    });
    return `gate-${gate.name}-${contextHash}`;
  }

  private hashObject(obj: any): string {
    // Simple hash function for cache key generation
    return Buffer.from(JSON.stringify(obj)).toString('base64').slice(0, 16);
  }

  private async trackProgress(gate: QualityGate, progress: number): Promise<void> {
    this.progressTracker.updateGateProgress(gate.name, progress);
  }

  private async handleTimeout(gate: QualityGate): Promise<TimeoutResult> {
    this.logger.warn('Gate execution timeout', { gate: gate.name, timeout: gate.timeout });
    
    return {
      gate: gate.name,
      timeoutDuration: gate.timeout
    };
  }

  private shouldRetryGate(gate: QualityGate, error: Error): boolean {
    // Retry logic based on error type and gate configuration
    const retryableErrors = ['TIMEOUT', 'NETWORK_ERROR', 'TEMPORARY_FAILURE'];
    return retryableErrors.some(errType => error.message.includes(errType));
  }

  private determineOverallStatus(results: GateResult[]): ValidationStatus {
    if (results.some(r => r.status === 'failed')) return 'failed';
    if (results.some(r => r.status === 'warning')) return 'warning';
    return 'passed';
  }

  private async getSystemLoad(): Promise<number> {
    // Mock system load calculation
    return Math.random() * 0.5; // Return low load for now
  }

  private async reorderGatesByCache(gates: QualityGate[]): Promise<QualityGate[]> {
    // Prioritize gates with higher cache hit probability
    const gatesWithCacheProb = await Promise.all(
      gates.map(async gate => ({
        gate,
        cacheHitProb: await this.cacheManager.getCacheHitProbability(gate.name)
      }))
    );

    return gatesWithCacheProb
      .sort((a, b) => b.cacheHitProb - a.cacheHitProb)
      .map(item => item.gate);
  }

  private createMockContext(): QualityValidationContext {
    return {
      target: {
        type: 'project',
        uri: '',
        files: [],
        excludePatterns: []
      },
      scope: { depth: 'project' },
      gates: [],
      requirements: {},
      constraints: { timeout: 60000 }
    };
  }
}

/**
 * Default parallel executor implementation
 */
class DefaultParallelExecutor implements ParallelExecutor {
  async executeParallel<T>(tasks: (() => Promise<T>)[], maxConcurrency: number): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      const promise = task().then(result => {
        results[i] = result;
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }
}