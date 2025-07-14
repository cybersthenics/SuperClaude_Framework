export interface HealthCheckResult {
    component: string;
    healthy: boolean;
    responseTime: number;
    timestamp: Date;
    details: Record<string, any>;
    error?: string;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        load: number[];
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        connectionsActive: number;
    };
    timestamp: Date;
}
export interface HealthCheckConfig {
    interval: number;
    timeout: number;
    retries: number;
    unhealthyThreshold: number;
    healthyThreshold: number;
}
export interface AlertRule {
    id: string;
    name: string;
    condition: (metrics: SystemMetrics) => boolean;
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
    cooldownMs: number;
    lastTriggered?: Date;
}
export interface Alert {
    id: string;
    ruleId: string;
    message: string;
    severity: string;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    resolved: boolean;
    resolvedAt?: Date;
}
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    component: string;
    metadata?: Record<string, any>;
    correlationId?: string;
}
export declare class HealthMonitor {
    private logger;
    private healthChecks;
    private systemMetrics;
    private alertRules;
    private alerts;
    private logEntries;
    private healthCheckConfig;
    private monitoringInterval;
    private metricsInterval;
    constructor(config?: Partial<HealthCheckConfig>);
    private initializeAlertRules;
    private startMonitoring;
    private runHealthChecks;
    private performHealthCheck;
    private checkComponentHealth;
    private checkTaskManagerHealth;
    private checkMemoryManagerHealth;
    private checkContextPreserverHealth;
    private checkSubAgentCoordinatorHealth;
    private checkWorkflowOrchestratorHealth;
    private checkIntegrationLayerHealth;
    private checkPerformanceOptimizerHealth;
    private checkErrorRecoveryHealth;
    private getComponentChecks;
    private collectSystemMetrics;
    private checkAlertRules;
    private triggerAlert;
    log(level: LogEntry['level'], message: string, component: string, metadata?: Record<string, any>, correlationId?: string): void;
    private delay;
    private generateAlertId;
    private generateLogId;
    getSystemHealth(): {
        healthy: boolean;
        components: HealthCheckResult[];
        metrics: SystemMetrics | null;
        unhealthyComponents: string[];
    };
    getHealthChecks(): HealthCheckResult[];
    getHealthCheck(component: string): HealthCheckResult | undefined;
    getSystemMetrics(): SystemMetrics | null;
    getAlerts(limit?: number): Alert[];
    getUnacknowledgedAlerts(): Alert[];
    acknowledgeAlert(alertId: string, acknowledgedBy: string): void;
    resolveAlert(alertId: string): void;
    getLogs(limit?: number, level?: LogEntry['level'], component?: string): LogEntry[];
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): void;
    setAlertRuleEnabled(ruleId: string, enabled: boolean): void;
    getMonitoringStatistics(): {
        totalHealthChecks: number;
        healthyComponents: number;
        unhealthyComponents: number;
        totalAlerts: number;
        unacknowledgedAlerts: number;
        criticalAlerts: number;
        totalLogs: number;
        logsByLevel: Record<string, number>;
    };
    generateMonitoringReport(): {
        timestamp: Date;
        systemHealth: any;
        statistics: any;
        recentAlerts: Alert[];
        recentLogs: LogEntry[];
    };
    shutdown(): Promise<void>;
}
//# sourceMappingURL=HealthMonitor.d.ts.map