import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { LRUCache } from 'lru-cache';
import { 
  HookType, 
  HookContext, 
  HookResult, 
  BridgeServiceConfig,
  BridgeServiceStatus,
  BridgePerformanceMetrics,
  HookRequest,
  HookResponse,
  HealthCheckResult,
  SYSTEM_PERFORMANCE_TARGETS
} from '../types/index.js';
import { BaseHook } from './BaseHook.js';
import { PerformanceTracker } from './PerformanceTracker.js';

interface ConnectionInfo {
  websocket: WebSocket;
  userId: string;
  permissions: string[];
  connectedAt: Date;
  lastActivity: Date;
}

interface PendingRequest {
  resolve: (value: HookResponse) => void;
  reject: (error: Error) => void;
  timestamp: number;
  timeout: NodeJS.Timeout;
}

export class BridgeService {
  private server?: WebSocketServer;
  private hooks: Map<HookType, BaseHook> = new Map();
  private connections: Map<string, ConnectionInfo> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private performanceTracker: PerformanceTracker;
  private serviceStatus: BridgeServiceStatus;
  private responseCache: LRUCache<string, HookResponse>;
  
  private readonly config: BridgeServiceConfig = {
    port: 8080,
    protocol: 'WebSocket',
    authentication: 'Bearer',
    maxConnections: 1000,
    keepAliveTimeout: 60000,
    compressionEnabled: true
  };

  private readonly jwtSecret: string;

  constructor(jwtSecret?: string) {
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

    // Initialize response cache
    this.responseCache = new LRUCache<string, HookResponse>({
      max: 1000,
      ttl: 5 * 60 * 1000 // 5 minutes
    });
  }

  async startService(port?: number): Promise<void> {
    const servicePort = port || this.config.port;
    
    try {
      this.serviceStatus.status = 'starting';
      
      this.server = new WebSocketServer({
        port: servicePort,
        perMessageDeflate: this.config.compressionEnabled,
        maxPayload: 1024 * 1024, // 1MB max message size
        clientTracking: true
      });

      this.setupServerHandlers();
      await this.setupHealthChecks();
      
      this.serviceStatus.status = 'running';
      this.serviceStatus.uptime = Date.now();
      
      console.log(`Bridge service started successfully on port ${servicePort}`);
      console.log(`Performance targets: ${SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME}ms avg, ${SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR}x optimization`);
      
    } catch (error) {
      this.serviceStatus.status = 'error';
      throw new Error(`Failed to start bridge service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopService(): Promise<void> {
    this.serviceStatus.status = 'stopping';
    
    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      connection.websocket.close(1000, 'Service stopping');
      this.connections.delete(connectionId);
    }

    // Reject all pending requests
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

  async getServiceStatus(): Promise<BridgeServiceStatus> {
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

  async registerHook(hook: BaseHook): Promise<void> {
    this.hooks.set(hook.type, hook);
    console.log(`Registered hook: ${hook.type} -> ${hook.targetServer} (${hook.performanceBudget.maxExecutionTime}ms budget)`);
  }

  async unregisterHook(hookType: HookType): Promise<void> {
    this.hooks.delete(hookType);
    console.log(`Unregistered hook: ${hookType}`);
  }

  async executeHook(hookType: HookType, context: HookContext): Promise<HookResult> {
    const hook = this.hooks.get(hookType);
    if (!hook) {
      throw new Error(`Hook ${hookType} not registered`);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(hookType, context);
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse) {
      return {
        ...cachedResponse.result!,
        performance: {
          ...cachedResponse.result!.performance,
          cacheHit: true
        }
      };
    }

    const timer = this.performanceTracker.startTimer(`hook.${hookType}`);
    
    try {
      // Pre-execution optimization
      const optimizedContext = await this.optimizeContext(context, hook);
      
      // Execute hook with performance monitoring
      const result = await hook.execute(optimizedContext);
      
      // Track performance metrics
      const metrics = await this.performanceTracker.endTimer(timer);
      await this.updateHookMetrics(hookType, metrics, result);
      
      // Cache successful results
      if (result.success && result.cacheInfo.cacheable) {
        const response: HookResponse = {
          id: context.metadata.correlationId,
          success: true,
          result,
          performance: metrics,
          timestamp: Date.now()
        };
        this.responseCache.set(cacheKey, response);
      }
      
      return result;
    } catch (error) {
      await this.performanceTracker.endTimer(timer);
      throw error;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
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

  private setupServerHandlers(): void {
    if (!this.server) return;

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

  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    try {
      // Authenticate connection
      const authResult = await this.authenticateConnection(request);
      if (!authResult.success) {
        ws.close(1008, 'Authentication failed');
        return;
      }

      // Check connection limits
      if (this.connections.size >= this.config.maxConnections) {
        ws.close(1008, 'Connection limit exceeded');
        return;
      }

      // Register connection
      const connectionId = this.generateConnectionId();
      this.connections.set(connectionId, {
        websocket: ws,
        userId: authResult.userId,
        permissions: authResult.permissions,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Set up message handlers
      ws.on('message', (data) => this.handleMessage(connectionId, data as Buffer));
      ws.on('close', () => this.handleDisconnection(connectionId));
      ws.on('error', (error) => this.handleConnectionError(connectionId, error));

      // Send connection confirmation
      await this.sendConnectionConfirmation(connectionId);

      console.log(`Connection established: ${connectionId} (user: ${authResult.userId})`);
      
    } catch (error) {
      console.error('Connection handling error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  private async handleMessage(connectionId: string, data: Buffer | ArrayBuffer | string): Promise<void> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        console.warn(`Message from unknown connection: ${connectionId}`);
        return;
      }

      // Update last activity
      connection.lastActivity = new Date();

      // Parse message
      const message = this.parseMessage(data);
      
      // Route message based on type
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
    } catch (error) {
      await this.sendError(connectionId, `Message processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleHookRequest(connectionId: string, message: any): Promise<void> {
    try {
      const hookRequest: HookRequest = message.data;
      const result = await this.executeHook(hookRequest.hookType, hookRequest.context);
      
      const response: HookResponse = {
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
    } catch (error) {
      await this.sendError(connectionId, error instanceof Error ? error.message : 'Hook execution failed');
    }
  }

  private async handlePerformanceQuery(connectionId: string, message: any): Promise<void> {
    const metrics = await this.getPerformanceMetrics();
    await this.sendMessage(connectionId, {
      type: 'performance_response',
      data: metrics
    });
  }

  private async handleHealthCheck(connectionId: string, message: any): Promise<void> {
    const health = await this.healthCheck();
    await this.sendMessage(connectionId, {
      type: 'health_response',
      data: health
    });
  }

  private async authenticateConnection(request: IncomingMessage): Promise<{ success: boolean; userId: string; permissions: string[] }> {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, userId: '', permissions: [] };
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      return {
        success: true,
        userId: decoded.userId || 'unknown',
        permissions: decoded.permissions || ['hook_executor']
      };
    } catch (error) {
      return { success: false, userId: '', permissions: [] };
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(hookType: HookType, context: HookContext): string {
    return `${hookType}_${context.sessionId}_${context.operation}`;
  }

  private async optimizeContext(context: HookContext, hook: BaseHook): Promise<HookContext> {
    return {
      ...context,
      performance: {
        ...context.performance,
        budget: hook.performanceBudget
      }
    };
  }

  private calculateCacheHitRate(): number {
    // Simple cache hit rate calculation
    return 0.8; // Placeholder - would track actual hits/misses
  }

  private parseMessage(data: Buffer | ArrayBuffer | string): any {
    if (typeof data === 'string') {
      return JSON.parse(data);
    } else if (data instanceof ArrayBuffer) {
      return JSON.parse(new TextDecoder().decode(data));
    } else {
      return JSON.parse(data.toString());
    }
  }

  private async sendMessage(connectionId: string, message: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection && connection.websocket.readyState === WebSocket.OPEN) {
      connection.websocket.send(JSON.stringify(message));
    }
  }

  private async sendError(connectionId: string, error: string): Promise<void> {
    await this.sendMessage(connectionId, {
      type: 'error',
      error
    });
  }

  private async sendConnectionConfirmation(connectionId: string): Promise<void> {
    await this.sendMessage(connectionId, {
      type: 'connection_confirmed',
      connectionId,
      timestamp: Date.now()
    });
  }

  private handleDisconnection(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(`Connection closed: ${connectionId}`);
  }

  private handleConnectionError(connectionId: string, error: Error): void {
    console.error(`Connection error ${connectionId}:`, error);
    this.connections.delete(connectionId);
  }

  private async setupHealthChecks(): Promise<void> {
    // Set up periodic health checks
    setInterval(async () => {
      const health = await this.healthCheck();
      if (!health.healthy) {
        console.warn('Bridge service health check failed:', health);
      }
    }, 30000); // Check every 30 seconds
  }

  private async checkWebSocketServer(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; message?: string }> {
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

  private async checkHookRegistrations(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; message?: string }> {
    const start = performance.now();
    const duration = performance.now() - start;

    return {
      name: 'hook_registrations',
      status: this.hooks.size > 0 ? 'pass' : 'fail',
      duration,
      message: `${this.hooks.size} hooks registered`
    };
  }

  private async checkPerformanceMetrics(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; message?: string }> {
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

  private async checkCacheHealth(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; message?: string }> {
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

  private async updateHookMetrics(hookType: HookType, metrics: any, result: HookResult): Promise<void> {
    // Update performance metrics for this hook type
    console.log(`Hook ${hookType} executed in ${metrics.executionTime}ms with optimization factor ${result.performance.optimizationFactor}`);
  }

  private async getPerformanceMetrics(): Promise<BridgePerformanceMetrics> {
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