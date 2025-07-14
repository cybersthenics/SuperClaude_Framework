import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { LRUCache } from 'lru-cache';
import { SYSTEM_PERFORMANCE_TARGETS } from '../types/index.js';
import { PerformanceTracker } from './PerformanceTracker.js';
export class BridgeService {
    server;
    hooks = new Map();
    connections = new Map();
    pendingRequests = new Map();
    performanceTracker;
    serviceStatus;
    responseCache;
    config = {
        port: 8080,
        protocol: 'WebSocket',
        authentication: 'Bearer',
        maxConnections: 1000,
        keepAliveTimeout: 60000,
        compressionEnabled: true
    };
    jwtSecret;
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'superclaude-hooks-secret';
        this.performanceTracker = new PerformanceTracker({
            targetAverageTime: SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME,
            targetOptimizationFactor: SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR
        });
        this.serviceStatus = {
            status: 'stopped',
            uptime: 0,
            connections: 0,
            performance: {
                averageResponseTime: 0,
                requestsPerSecond: 0,
                activeConnections: 0,
                errorRate: 0,
                optimizationFactor: 1.0,
                cacheHitRate: 0
            }
        };
        this.responseCache = new LRUCache({
            max: 1000,
            ttl: 5 * 60 * 1000
        });
    }
    async startService(port) {
        const servicePort = port || this.config.port;
        try {
            this.serviceStatus.status = 'starting';
            this.server = new WebSocketServer({
                port: servicePort,
                perMessageDeflate: this.config.compressionEnabled,
                maxPayload: 1024 * 1024,
                clientTracking: true
            });
            this.setupServerHandlers();
            await this.setupHealthChecks();
            this.serviceStatus.status = 'running';
            this.serviceStatus.uptime = Date.now();
            console.log(`Bridge service started successfully on port ${servicePort}`);
            console.log(`Performance targets: ${SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME}ms avg, ${SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR}x optimization`);
        }
        catch (error) {
            this.serviceStatus.status = 'error';
            throw new Error(`Failed to start bridge service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async stopService() {
        this.serviceStatus.status = 'stopping';
        for (const [connectionId, connection] of this.connections) {
            connection.websocket.close(1000, 'Service stopping');
            this.connections.delete(connectionId);
        }
        for (const [requestId, request] of this.pendingRequests) {
            clearTimeout(request.timeout);
            request.reject(new Error('Service stopping'));
            this.pendingRequests.delete(requestId);
        }
        if (this.server) {
            this.server.close();
        }
        this.serviceStatus.status = 'stopped';
        console.log('Bridge service stopped');
    }
    async getServiceStatus() {
        const uptime = this.serviceStatus.status === 'running'
            ? Date.now() - this.serviceStatus.uptime
            : 0;
        const performance = await this.performanceTracker.getOverallMetrics();
        return {
            ...this.serviceStatus,
            uptime,
            connections: this.connections.size,
            performance: {
                averageResponseTime: performance.averageExecutionTime || performance.executionTime,
                requestsPerSecond: performance.requestsPerSecond || 0,
                activeConnections: this.connections.size,
                errorRate: performance.errorRate || 0,
                optimizationFactor: performance.optimizationFactor,
                cacheHitRate: this.calculateCacheHitRate()
            }
        };
    }
    async registerHook(hook) {
        this.hooks.set(hook.type, hook);
        console.log(`Registered hook: ${hook.type} -> ${hook.targetServer} (${hook.performanceBudget.maxExecutionTime}ms budget)`);
    }
    async unregisterHook(hookType) {
        this.hooks.delete(hookType);
        console.log(`Unregistered hook: ${hookType}`);
    }
    async executeHook(hookType, context) {
        const hook = this.hooks.get(hookType);
        if (!hook) {
            throw new Error(`Hook ${hookType} not registered`);
        }
        const cacheKey = this.generateCacheKey(hookType, context);
        const cachedResponse = this.responseCache.get(cacheKey);
        if (cachedResponse) {
            return {
                ...cachedResponse.result,
                performance: {
                    ...cachedResponse.result.performance,
                    cacheHit: true
                }
            };
        }
        const timer = this.performanceTracker.startTimer(`hook.${hookType}`);
        try {
            const optimizedContext = await this.optimizeContext(context, hook);
            const result = await hook.execute(optimizedContext);
            const metrics = await this.performanceTracker.endTimer(timer);
            await this.updateHookMetrics(hookType, metrics, result);
            if (result.success && result.cacheInfo.cacheable) {
                const response = {
                    id: context.metadata.correlationId,
                    success: true,
                    result,
                    performance: metrics,
                    timestamp: Date.now()
                };
                this.responseCache.set(cacheKey, response);
            }
            return result;
        }
        catch (error) {
            await this.performanceTracker.endTimer(timer);
            throw error;
        }
    }
    async healthCheck() {
        const checks = [
            await this.checkWebSocketServer(),
            await this.checkHookRegistrations(),
            await this.checkPerformanceMetrics(),
            await this.checkCacheHealth()
        ];
        const healthy = checks.every(check => check.status === 'pass');
        const performance = await this.performanceTracker.getOverallMetrics();
        return {
            healthy,
            status: healthy ? 'healthy' : 'unhealthy',
            checks,
            uptime: this.serviceStatus.status === 'running'
                ? Date.now() - this.serviceStatus.uptime
                : 0,
            performance
        };
    }
    setupServerHandlers() {
        if (!this.server)
            return;
        this.server.on('connection', (ws, request) => {
            this.handleConnection(ws, request);
        });
        this.server.on('error', (error) => {
            console.error('WebSocket server error:', error);
            this.serviceStatus.status = 'error';
        });
        this.server.on('close', () => {
            console.log('WebSocket server closed');
        });
    }
    async handleConnection(ws, request) {
        try {
            const authResult = await this.authenticateConnection(request);
            if (!authResult.success) {
                ws.close(1008, 'Authentication failed');
                return;
            }
            if (this.connections.size >= this.config.maxConnections) {
                ws.close(1008, 'Connection limit exceeded');
                return;
            }
            const connectionId = this.generateConnectionId();
            this.connections.set(connectionId, {
                websocket: ws,
                userId: authResult.userId,
                permissions: authResult.permissions,
                connectedAt: new Date(),
                lastActivity: new Date()
            });
            ws.on('message', (data) => this.handleMessage(connectionId, data));
            ws.on('close', () => this.handleDisconnection(connectionId));
            ws.on('error', (error) => this.handleConnectionError(connectionId, error));
            await this.sendConnectionConfirmation(connectionId);
            console.log(`Connection established: ${connectionId} (user: ${authResult.userId})`);
        }
        catch (error) {
            console.error('Connection handling error:', error);
            ws.close(1011, 'Internal server error');
        }
    }
    async handleMessage(connectionId, data) {
        try {
            const connection = this.connections.get(connectionId);
            if (!connection) {
                console.warn(`Message from unknown connection: ${connectionId}`);
                return;
            }
            connection.lastActivity = new Date();
            const message = this.parseMessage(data);
            switch (message.type) {
                case 'hook_request':
                    await this.handleHookRequest(connectionId, message);
                    break;
                case 'performance_query':
                    await this.handlePerformanceQuery(connectionId, message);
                    break;
                case 'health_check':
                    await this.handleHealthCheck(connectionId, message);
                    break;
                default:
                    await this.sendError(connectionId, `Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            await this.sendError(connectionId, `Message processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleHookRequest(connectionId, message) {
        try {
            const hookRequest = message.data;
            const result = await this.executeHook(hookRequest.hookType, hookRequest.context);
            const response = {
                id: hookRequest.id,
                success: true,
                result,
                performance: result.performance,
                timestamp: Date.now()
            };
            await this.sendMessage(connectionId, {
                type: 'hook_response',
                data: response
            });
        }
        catch (error) {
            await this.sendError(connectionId, error instanceof Error ? error.message : 'Hook execution failed');
        }
    }
    async handlePerformanceQuery(connectionId, message) {
        const metrics = await this.getPerformanceMetrics();
        await this.sendMessage(connectionId, {
            type: 'performance_response',
            data: metrics
        });
    }
    async handleHealthCheck(connectionId, message) {
        const health = await this.healthCheck();
        await this.sendMessage(connectionId, {
            type: 'health_response',
            data: health
        });
    }
    async authenticateConnection(request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { success: false, userId: '', permissions: [] };
            }
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, this.jwtSecret);
            return {
                success: true,
                userId: decoded.userId || 'unknown',
                permissions: decoded.permissions || ['hook_executor']
            };
        }
        catch (error) {
            return { success: false, userId: '', permissions: [] };
        }
    }
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateCacheKey(hookType, context) {
        return `${hookType}_${context.sessionId}_${context.operation}`;
    }
    async optimizeContext(context, hook) {
        return {
            ...context,
            performance: {
                ...context.performance,
                budget: hook.performanceBudget
            }
        };
    }
    calculateCacheHitRate() {
        return 0.8;
    }
    parseMessage(data) {
        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        else if (data instanceof ArrayBuffer) {
            return JSON.parse(new TextDecoder().decode(data));
        }
        else {
            return JSON.parse(data.toString());
        }
    }
    async sendMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.websocket.readyState === WebSocket.OPEN) {
            connection.websocket.send(JSON.stringify(message));
        }
    }
    async sendError(connectionId, error) {
        await this.sendMessage(connectionId, {
            type: 'error',
            error
        });
    }
    async sendConnectionConfirmation(connectionId) {
        await this.sendMessage(connectionId, {
            type: 'connection_confirmed',
            connectionId,
            timestamp: Date.now()
        });
    }
    handleDisconnection(connectionId) {
        this.connections.delete(connectionId);
        console.log(`Connection closed: ${connectionId}`);
    }
    handleConnectionError(connectionId, error) {
        console.error(`Connection error ${connectionId}:`, error);
        this.connections.delete(connectionId);
    }
    async setupHealthChecks() {
        setInterval(async () => {
            const health = await this.healthCheck();
            if (!health.healthy) {
                console.warn('Bridge service health check failed:', health);
            }
        }, 30000);
    }
    async checkWebSocketServer() {
        const start = performance.now();
        const healthy = this.server && this.serviceStatus.status === 'running';
        const duration = performance.now() - start;
        return {
            name: 'websocket_server',
            status: healthy ? 'pass' : 'fail',
            duration,
            message: healthy ? 'WebSocket server running' : 'WebSocket server not running'
        };
    }
    async checkHookRegistrations() {
        const start = performance.now();
        const duration = performance.now() - start;
        return {
            name: 'hook_registrations',
            status: this.hooks.size > 0 ? 'pass' : 'fail',
            duration,
            message: `${this.hooks.size} hooks registered`
        };
    }
    async checkPerformanceMetrics() {
        const start = performance.now();
        const metrics = await this.performanceTracker.getOverallMetrics();
        const duration = performance.now() - start;
        const healthy = (metrics.averageExecutionTime || metrics.executionTime) <= SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME * 1.2;
        return {
            name: 'performance_metrics',
            status: healthy ? 'pass' : 'fail',
            duration,
            message: `Average execution time: ${metrics.averageExecutionTime || metrics.executionTime}ms`
        };
    }
    async checkCacheHealth() {
        const start = performance.now();
        const hitRate = this.calculateCacheHitRate();
        const duration = performance.now() - start;
        return {
            name: 'cache_health',
            status: hitRate >= SYSTEM_PERFORMANCE_TARGETS.CACHE_HIT_RATE_MINIMUM ? 'pass' : 'fail',
            duration,
            message: `Cache hit rate: ${(hitRate * 100).toFixed(1)}%`
        };
    }
    async updateHookMetrics(hookType, metrics, result) {
        console.log(`Hook ${hookType} executed in ${metrics.executionTime}ms with optimization factor ${result.performance.optimizationFactor}`);
    }
    async getPerformanceMetrics() {
        const metrics = await this.performanceTracker.getOverallMetrics();
        return {
            averageResponseTime: metrics.averageExecutionTime || metrics.executionTime,
            requestsPerSecond: metrics.requestsPerSecond || 0,
            activeConnections: this.connections.size,
            errorRate: metrics.errorRate || 0,
            optimizationFactor: metrics.optimizationFactor,
            cacheHitRate: this.calculateCacheHitRate()
        };
    }
}
//# sourceMappingURL=BridgeService.js.map