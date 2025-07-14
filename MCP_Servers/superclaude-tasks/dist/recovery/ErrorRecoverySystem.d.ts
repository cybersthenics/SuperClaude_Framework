export interface ErrorContext {
    operation: string;
    component: string;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata: Record<string, any>;
}
export interface ErrorRecord {
    id: string;
    error: Error;
    context: ErrorContext;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'validation' | 'network' | 'database' | 'business' | 'system' | 'integration';
    recoverable: boolean;
    retryCount: number;
    maxRetries: number;
    resolved: boolean;
    resolvedAt?: Date;
    resolution?: string;
}
export interface RecoveryStrategy {
    id: string;
    name: string;
    errorCategories: string[];
    condition: (error: ErrorRecord) => boolean;
    action: (error: ErrorRecord) => Promise<boolean>;
    priority: number;
    enabled: boolean;
    maxRetries: number;
    backoffMultiplier: number;
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    timeoutMs: number;
    resetTimeoutMs: number;
    monitoringPeriodMs: number;
}
export interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    successCount: number;
    lastFailureTime: Date;
    lastSuccessTime: Date;
    nextRetryTime: Date;
}
export declare class ErrorRecoverySystem {
    private logger;
    private errorHistory;
    private recoveryStrategies;
    private circuitBreakers;
    private circuitBreakerConfig;
    private errorPatterns;
    private monitoringInterval;
    constructor(circuitBreakerConfig?: CircuitBreakerConfig);
    private initializeRecoveryStrategies;
    handleError(error: Error, context: ErrorContext, severity?: ErrorRecord['severity'], category?: ErrorRecord['category']): Promise<boolean>;
    private attemptRecovery;
    private getApplicableStrategies;
    private checkCircuitBreaker;
    private applyIntegrationFallback;
    private applyGracefulDegradation;
    private fallbackToBasicCodeAnalysis;
    private fallbackToBasicDecisionMaking;
    private fallbackToBasicPerformanceMonitoring;
    private enableEmergencyMode;
    private enableReducedFunctionality;
    private generateErrorId;
    private isRecoverable;
    private getMaxRetries;
    private updateErrorPatterns;
    private delay;
    private startMonitoring;
    private analyzeErrorPatterns;
    private cleanupOldErrors;
    getErrorHistory(limit?: number): ErrorRecord[];
    getErrorStatistics(): {
        totalErrors: number;
        errorsBySeverity: Record<string, number>;
        errorsByCategory: Record<string, number>;
        recoveryRate: number;
        topErrorPatterns: Array<{
            pattern: string;
            count: number;
        }>;
    };
    getCircuitBreakerStates(): Map<string, CircuitBreakerState>;
    addRecoveryStrategy(strategy: RecoveryStrategy): void;
    removeRecoveryStrategy(strategyId: string): void;
    setRecoveryStrategyEnabled(strategyId: string, enabled: boolean): void;
    resetCircuitBreaker(component: string): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ErrorRecoverySystem.d.ts.map