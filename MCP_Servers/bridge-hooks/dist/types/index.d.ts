export declare enum HookType {
    PreToolUse = "preToolUse",
    PostToolUse = "postToolUse",
    PrePrompt = "prePrompt",
    PostPrompt = "postPrompt",
    PreCompact = "preCompact",
    Stop = "stop",
    SubagentStop = "subagentStop"
}
export interface PerformanceBudget {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxCPUUsage: number;
    cacheHitRateTarget: number;
    optimizationFactor: number;
}
export interface HookContext {
    sessionId: string;
    operation: string;
    parameters: Record<string, any>;
    metadata: HookMetadata;
    performance: PerformanceContext;
    cache: CacheContext;
    semantic?: SemanticContext;
    data?: any;
    user?: string;
}
export interface HookMetadata {
    timestamp: number;
    correlationId: string;
    timeout?: number;
    compressed?: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface PerformanceContext {
    startTime?: number;
    budget: PerformanceBudget;
    trackingEnabled: boolean;
}
export interface CacheContext {
    enabled: boolean;
    strategy: CacheStrategy;
    key?: string;
    ttl?: number;
}
export interface SemanticContext {
    enabled: boolean;
    projectContext: string;
    semanticKey: string;
    lspEnabled: boolean;
}
export interface HookResult {
    success: boolean;
    data?: any;
    error?: Error;
    performance: PerformanceMetrics;
    cacheInfo: CacheInfo;
    recommendations?: OptimizationRecommendation[];
}
export interface PerformanceMetrics {
    executionTime: number;
    cacheHit?: boolean;
    optimizationFactor: number;
    validationTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    requestsPerSecond?: number;
    errorRate?: number;
    averageExecutionTime?: number;
}
export interface CacheInfo {
    cacheable: boolean;
    ttl?: number;
    hitRate?: number;
    size?: number;
}
export interface OptimizationRecommendation {
    type: 'cache' | 'performance' | 'resource' | 'routing';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedImprovement: number;
}
export interface CacheStrategy {
    useSemanticCache: boolean;
    useLSPCache: boolean;
    cacheHookResult: boolean;
    ttl: number;
    semanticCacheHit?: boolean;
    optimizationFactor?: number;
}
export interface BridgeServiceConfig {
    port: number;
    protocol: 'HTTP' | 'WebSocket';
    authentication: string;
    maxConnections: number;
    keepAliveTimeout: number;
    compressionEnabled: boolean;
}
export interface BridgeServiceStatus {
    status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
    uptime: number;
    connections: number;
    performance: BridgePerformanceMetrics;
}
export interface BridgePerformanceMetrics {
    averageResponseTime: number;
    requestsPerSecond: number;
    activeConnections: number;
    errorRate: number;
    optimizationFactor: number;
    cacheHitRate: number;
}
export interface HookServerMapping {
    hookType: HookType;
    serverName: string;
    endpoint: string;
    performanceBudget: PerformanceBudget;
    cacheStrategy: CacheStrategy;
}
export interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime?: number;
    isOpen(): boolean;
    shouldAttemptReset(): boolean;
    halfOpen(): void;
    recordSuccess(): void;
    recordFailure(): void;
    open(): void;
}
export declare class CircuitBreakerOpenError extends Error {
    constructor(message: string);
}
export interface PerformanceTracker {
    startTimer(operation: string): string;
    endTimer(timerId: string): Promise<PerformanceMetrics>;
    getMetrics(operation?: string): Promise<PerformanceMetrics>;
    getOptimizationFactor(): Promise<number>;
}
export interface ValidationResult {
    success: boolean;
    details?: any[];
    executionTime?: number;
    issues?: string[];
}
export interface SecurityValidationResult {
    valid: boolean;
    permissions?: string[];
    resourceAllocation?: any;
}
export interface InputValidationResult {
    safe: boolean;
    issues: string[];
    sanitizedData: any;
}
export interface HookRequest {
    id: string;
    hookType: HookType;
    context: HookContext;
    metadata: RequestMetadata;
    timestamp: number;
}
export interface HookResponse {
    id: string;
    success: boolean;
    result?: HookResult;
    error?: ErrorDetails;
    performance: PerformanceMetrics;
    timestamp: number;
}
export interface RequestMetadata {
    timeout?: number;
    compressed?: boolean;
    retryCount?: number;
}
export interface ErrorDetails {
    code: string;
    message: string;
    stack?: string;
    context?: any;
}
export interface RoutingOptimization {
    strategy: 'fast-path' | 'standard' | 'comprehensive';
    targetServer: string;
    optimizationFactor: number;
    skipValidation?: boolean;
    enableAllValidation?: boolean;
    enableSmartValidation?: boolean;
}
export interface FastPathResult {
    enabled: boolean;
    reason: string;
    optimizationFactor: number;
}
export interface OptimizationResult {
    applied: boolean;
    factor: number;
    techniques: string[];
    resourcesSaved: any;
}
export interface HealthCheckResult {
    healthy: boolean;
    status: string;
    checks: HealthCheck[];
    uptime: number;
    performance: PerformanceMetrics;
}
export interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration: number;
}
export declare const PROVEN_PERFORMANCE_TARGETS: {
    readonly preToolUse: {
        readonly maxExecutionTime: 74;
        readonly optimizationFactor: 2.02;
        readonly targetServer: "superclaude-router";
    };
    readonly postToolUse: {
        readonly maxExecutionTime: 71;
        readonly optimizationFactor: 1.41;
        readonly targetServer: "superclaude-quality";
    };
    readonly prePrompt: {
        readonly maxExecutionTime: 25;
        readonly optimizationFactor: 4.66;
        readonly targetServer: "superclaude-personas";
    };
    readonly postPrompt: {
        readonly maxExecutionTime: 27;
        readonly optimizationFactor: 4.66;
        readonly targetServer: "superclaude-personas";
    };
    readonly preCompact: {
        readonly maxExecutionTime: 72;
        readonly optimizationFactor: 4.18;
        readonly targetServer: "superclaude-intelligence";
    };
    readonly stop: {
        readonly maxExecutionTime: 77;
        readonly optimizationFactor: 2.06;
        readonly targetServer: "superclaude-orchestrator";
    };
    readonly subagentStop: {
        readonly maxExecutionTime: 85;
        readonly optimizationFactor: 2.58;
        readonly targetServer: "superclaude-orchestrator";
    };
};
export declare const SYSTEM_PERFORMANCE_TARGETS: {
    readonly OVERALL_AVERAGE_TIME: 62;
    readonly OVERALL_OPTIMIZATION_FACTOR: 2.84;
    readonly CACHE_HIT_RATE_MINIMUM: 0.8;
    readonly RELIABILITY_TARGET: 1;
    readonly HOOK_OVERHEAD_MAX: 10;
    readonly BRIDGE_OVERHEAD_MAX: 5;
    readonly CIRCUIT_BREAKER_THRESHOLD: 5;
    readonly CONCURRENT_OPERATIONS_TARGET: 500;
    readonly THROUGHPUT_TARGET: 5000;
};
//# sourceMappingURL=index.d.ts.map