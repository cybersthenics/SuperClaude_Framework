export interface SuperClaudeServer {
    id: string;
    name: string;
    version: string;
    capabilities: string[];
    endpoint: string;
    status: 'online' | 'offline' | 'error';
    lastHeartbeat: Date;
    responseTime: number;
    errorCount: number;
}
export interface CrossServerRequest {
    sourceServer: string;
    targetServer: string;
    operation: string;
    data: any;
    timeout: number;
    retries: number;
}
export interface CrossServerResponse {
    success: boolean;
    data: any;
    error?: string;
    responseTime: number;
    timestamp: Date;
}
export interface ServerHealthCheck {
    serverId: string;
    healthy: boolean;
    responseTime: number;
    errorRate: number;
    lastCheck: Date;
    details: Record<string, any>;
}
export declare class SuperClaudeIntegration {
    private logger;
    private servers;
    private healthChecks;
    private crossServerCache;
    private heartbeatInterval;
    private healthCheckInterval;
    constructor();
    private initializeKnownServers;
    registerServer(server: Omit<SuperClaudeServer, 'status' | 'lastHeartbeat' | 'responseTime' | 'errorCount'>): Promise<void>;
    getServer(serverId: string): SuperClaudeServer | undefined;
    getAllServers(): SuperClaudeServer[];
    getOnlineServers(): SuperClaudeServer[];
    getServersByCapability(capability: string): SuperClaudeServer[];
    makeRequest(request: CrossServerRequest): Promise<CrossServerResponse>;
    private simulateCrossServerRequest;
    broadcastRequest(serverIds: string[], operation: string, data: any, timeout?: number): Promise<Map<string, CrossServerResponse>>;
    performHealthCheck(serverId: string): Promise<ServerHealthCheck>;
    getHealthChecks(): ServerHealthCheck[];
    getHealthCheck(serverId: string): ServerHealthCheck | undefined;
    private startHealthMonitoring;
    private sendHeartbeats;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        hitRate: number;
        totalRequests: number;
        cacheHits: number;
    };
    getIntegrationMetrics(): {
        totalServers: number;
        onlineServers: number;
        offlineServers: number;
        errorServers: number;
        averageResponseTime: number;
        totalRequests: number;
        successRate: number;
    };
    shutdown(): Promise<void>;
}
//# sourceMappingURL=SuperClaudeIntegration.d.ts.map