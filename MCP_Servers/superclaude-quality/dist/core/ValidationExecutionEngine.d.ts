import { QualityValidationContext, QualityGate, GateResult, ValidationStatus } from '../types/index.js';
import { ValidationPlan, OptimizedExecutionPlan } from './QualityOrchestrator.js';
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
export declare class ValidationExecutionEngine {
    private parallelExecutor;
    private cacheManager;
    private progressTracker;
    private logger;
    private maxConcurrency;
    constructor();
    executeValidationPlan(plan: ValidationPlan & OptimizedExecutionPlan): Promise<ExecutionResult>;
    executeGateParallel(gates: QualityGate[], context: QualityValidationContext): Promise<GateResult[]>;
    executeGateSequential(gates: QualityGate[], context: QualityValidationContext): Promise<GateResult[]>;
    handleGateFailure(gate: QualityGate, error: Error, context: QualityValidationContext): Promise<FailureResult>;
    optimizeExecution(plan: ValidationPlan): Promise<ValidationPlan>;
    private executeGateWithTimeout;
    private checkGateDependencies;
    private applyCaching;
    private generateCacheKey;
    private hashObject;
    private trackProgress;
    private handleTimeout;
    private shouldRetryGate;
    private determineOverallStatus;
    private getSystemLoad;
    private reorderGatesByCache;
    private createMockContext;
}
//# sourceMappingURL=ValidationExecutionEngine.d.ts.map