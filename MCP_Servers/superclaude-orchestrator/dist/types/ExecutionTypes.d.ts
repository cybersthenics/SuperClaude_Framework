/**
 * Execution-specific type definitions for SuperClaude Orchestrator
 * Detailed types for execution patterns and coordination
 */
import { ExecutionContext, ResourceRequirements } from './OrchestratorTypes.js';
export interface SecurityValidationResult {
    valid: boolean;
    issues: SecurityIssue[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface SecurityIssue {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    recommendation?: string;
}
export interface ChainSecurityResult {
    secure: boolean;
    warnings: SecurityWarning[];
    restrictions: SecurityRestriction[];
}
export interface SecurityWarning {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
}
export interface SecurityRestriction {
    type: string;
    description: string;
    scope: string[];
}
export interface OrchestratorSecurityEvent {
    timestamp: Date;
    executionId: string;
    executionType: 'wave' | 'delegation' | 'loop' | 'chain';
    eventType: 'execution_start' | 'permission_check' | 'resource_access' | 'security_violation';
    details: {
        pattern?: string;
        servers?: string[];
        personas?: string[];
        securityLevel?: string;
        violations?: string[];
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface QualityGateResult {
    passed: boolean;
    score: number;
    issues: QualityIssue[];
    recommendations: QualityRecommendation[];
}
export interface QualityIssue {
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: number;
}
export interface QualityRecommendation {
    type: string;
    description: string;
    estimatedImpact: number;
    priority: number;
}
export interface LoopQualityAssessment {
    convergenceReliability: number;
    iterationEfficiency: number;
    qualityImprovement: number;
    resourceUtilization: number;
    recommendedOptimizations: string[];
}
export interface ChainQualityAssessment {
    contextFidelity: number;
    personaTransitionQuality: number;
    expertiseUtilization: number;
    cumulativeValue: number;
    handoffEfficiency: number;
}
export interface BenchmarkResult {
    results: {
        waveOrchestration: WaveBenchmarkResult;
        delegation: DelegationBenchmarkResult;
        loopMode: LoopBenchmarkResult;
        chainMode: ChainBenchmarkResult;
        hybridPatterns: HybridBenchmarkResult;
    };
    overall: number;
    performance: boolean;
    recommendations: string[];
}
export interface WaveBenchmarkResult {
    testCases: WaveTestResult[];
    averageCoordinationTime: number;
    efficiencyRange: {
        min: number;
        max: number;
    };
    targetComplianceRate: number;
}
export interface WaveTestResult {
    strategy: string;
    coordinationOverhead: number;
    totalExecutionTime: number;
    efficiency: number;
    targetsMet: boolean;
}
export interface DelegationBenchmarkResult {
    timeSavingsRange: {
        min: number;
        max: number;
    };
    concurrencyEfficiency: number;
    setupOverhead: number;
    aggregationTime: number;
}
export interface LoopBenchmarkResult {
    convergenceRate: number;
    averageIterations: number;
    qualityImprovementRate: number;
    falsePositiveRate: number;
}
export interface ChainBenchmarkResult {
    contextFidelityRate: number;
    handoffEfficiency: number;
    expertiseUtilization: number;
    scalingPerformance: number;
}
export interface HybridBenchmarkResult {
    patternCombinations: PatternCombinationResult[];
    coordinationOverhead: number;
    resourceEfficiency: number;
    complexityHandling: number;
}
export interface PatternCombinationResult {
    patterns: string[];
    successRate: number;
    performanceImpact: number;
    resourceEfficiency: number;
}
export interface OrchestratorMetrics {
    waveCoordination: WaveCoordinationMetric[];
    delegation: DelegationMetric[];
    loopIterations: LoopIterationMetric[];
    chainHandoffs: ChainHandoffMetric[];
}
export interface WaveCoordinationMetric {
    waveId: string;
    phaseTime: number;
    timestamp: number;
}
export interface DelegationMetric {
    delegationId: string;
    subAgentCount: number;
    executionTime: number;
    efficiency: number;
    timestamp: number;
}
export interface LoopIterationMetric {
    loopId: string;
    iteration: number;
    coordinationTime: number;
    timestamp: number;
}
export interface ChainHandoffMetric {
    chainId: string;
    step: number;
    handoffTime: number;
    contextSize: number;
    timestamp: number;
}
export interface OrchestratorPerformanceReport {
    averageWaveCoordination: number;
    delegationEfficiency: number;
    loopConvergenceRate: number;
    chainContextFidelity: number;
    hookOptimizationMaintained: boolean;
    recommendations: string[];
}
export interface PrometheusMetrics {
    waveCoordinationHistogram: any;
    delegationEfficiencyGauge: any;
    loopConvergenceGauge: any;
    chainContextFidelityGauge: any;
    hookOptimizationGauge: any;
}
export interface ComponentHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    metrics?: Record<string, number>;
}
export interface OrchestratorHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    components: {
        waveEngine: ComponentHealth;
        delegationEngine: ComponentHealth;
        loopController: ComponentHealth;
        chainManager: ComponentHealth;
        resourceManager: ComponentHealth;
    };
    metrics: {
        activeWaves: number;
        activeDelegations: number;
        activeLoops: number;
        activeChains: number;
        averageCoordinationTime: number;
        hookOptimizationFactor: number;
    };
}
export interface StopHookContext {
    executionId: string;
    command: string;
    flags: string[];
    timestamp: Date;
}
export interface StopHookResult {
    success: boolean;
    orchestrationsProcessed: number;
    performanceReport: OrchestratorPerformanceReport;
    executionTime: number;
    optimizationFactor: number;
}
export interface SubAgentStopHookContext {
    delegationId: string;
    subAgentIds: string[];
    results: any[];
    timestamp: Date;
}
export interface SubAgentStopHookResult {
    success: boolean;
    delegationsProcessed: number;
    aggregatedResults: any[];
    delegationMetrics: DelegationPerformanceMetrics;
    executionTime: number;
    optimizationFactor: number;
}
export interface ServerCommunicationResult {
    success: boolean;
    response: any;
    executionTime: number;
    retries: number;
}
export interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime?: Date;
    nextAttemptTime?: Date;
}
export interface OrchestrationError {
    code: string;
    message: string;
    phase?: string;
    step?: number;
    iteration?: number;
    details: Record<string, any>;
    timestamp: Date;
    recoverable: boolean;
}
export interface ErrorRecoveryStrategy {
    type: 'retry' | 'rollback' | 'skip' | 'abort';
    maxAttempts?: number;
    backoffMs?: number;
    rollbackTarget?: string;
    skipConditions?: string[];
}
export interface WaveExecution {
    waveId: string;
    phases: WavePhase[];
    resourceAllocation: ResourceAllocation;
    performanceMetrics: WavePerformanceMetrics;
    contextFlow: ExecutionContext[];
}
export interface DelegationExecution {
    delegationId: string;
    subAgents: SubAgent[];
    aggregatedResults: any;
    concurrencyMetrics: ConcurrencyMetrics;
    performanceComparison: PerformanceComparison;
}
export interface ConcurrencyMetrics {
    maxConcurrency: number;
    averageConcurrency: number;
    queueTime: number;
    utilizationRate: number;
}
export interface PerformanceComparison {
    sequentialTime: number;
    parallelTime: number;
    timeSavings: number;
    efficiency: number;
}
export interface ResourceAllocation {
    allocationId: string;
    requirements: ResourceRequirements;
    allocated: ResourcePool;
    timestamp: Date;
    expiresAt: Date;
}
export interface ResourcePool {
    memory: number;
    cpu: number;
    concurrency: number;
    available: boolean;
}
export interface WavePhase {
    phaseId: string;
    name: string;
    servers: string[];
    personas: string[];
    dependencies: string[];
    parallel: boolean;
    timeout: number;
    validationCriteria: ValidationCriteria;
}
export interface SubAgent {
    agentId: string;
    specialization: 'quality' | 'security' | 'performance' | 'architecture';
    persona: string;
    tools: string[];
    focus: string[];
    scope: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
}
export interface ValidationCriteria {
    required: string[];
    optional: string[];
    constraints: Record<string, any>;
}
//# sourceMappingURL=ExecutionTypes.d.ts.map