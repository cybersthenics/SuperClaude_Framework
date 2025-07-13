/**
 * MCP Server Router
 * Intelligent routing engine for dispatching requests to appropriate MCP servers
 */

import { EventEmitter } from 'events';
import { logger, CrossServerCoordinationService } from '@superclaude/shared';
import { 
  MCPServerType, 
  MCPRoutingDecision, 
  BridgeHookContext, 
  BridgeHookResult,
  PerformanceThresholds,
  PerformanceAlert
} from '../types.js';
import { ExternalServerManager, ExternalServerConfig } from './ExternalServerManager.js';

export interface MCPServerCapability {
  name: string;
  description: string;
  toolPatterns: string[];
  domainHints: string[];
  complexityRange: { min: number; max: number };
  averageExecutionTime: number;
  successRate: number;
}

export interface MCPServerHealth {
  serverId: MCPServerType;
  status: 'online' | 'offline' | 'degraded' | 'overloaded';
  lastHealthCheck: Date;
  responseTime: number;
  successRate: number;
  currentLoad: number;
  errorCount: number;
  capabilities: MCPServerCapability[];
}

/**
 * Intelligent MCP server routing engine with sub-100ms performance
 */
export class MCPServerRouter extends EventEmitter {
  private serverHealth: Map<MCPServerType, MCPServerHealth> = new Map();
  private routingCache: Map<string, MCPRoutingDecision> = new Map();
  private performanceThresholds: PerformanceThresholds;
  private coordinationService: CrossServerCoordinationService;
  private externalServerManager: ExternalServerManager;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    thresholds?: Partial<PerformanceThresholds>,
    externalServerConfig?: ExternalServerConfig
  ) {
    super();
    
    this.performanceThresholds = {
      executionTime: { target: 50, warning: 80, critical: 100 },
      tokenUsage: { target: 1000, warning: 5000, critical: 10000 },
      memoryUsage: { target: 100, warning: 500, critical: 1000 },
      ...thresholds
    };

    this.coordinationService = new CrossServerCoordinationService();
    this.externalServerManager = new ExternalServerManager(externalServerConfig);
    this.initializeServerCapabilities();
    this.startHealthMonitoring();

    // Listen for external server events
    this.externalServerManager.on('circuit_breaker_open', (serverId) => {
      this.updateServerAvailability(serverId, false);
    });

    this.externalServerManager.on('server_connected', (serverId) => {
      this.updateServerAvailability(serverId, true);
    });

    this.externalServerManager.on('server_disconnected', (serverId) => {
      this.updateServerAvailability(serverId, false);
    });

    logger.info('MCP Server Router initialized with sub-100ms performance target');
  }

  /**
   * Route request to appropriate MCP servers with intelligent load balancing
   */
  async routeRequest(context: BridgeHookContext): Promise<MCPRoutingDecision> {
    const startTime = performance.now();
    
    try {
      // Check cache first for performance
      const cacheKey = this.generateCacheKey(context);
      const cachedDecision = this.routingCache.get(cacheKey);
      
      if (cachedDecision && this.isCacheValid(cachedDecision)) {
        const duration = performance.now() - startTime;
        this.emitPerformanceMetric('route_cache_hit', duration);
        return cachedDecision;
      }

      // Analyze request requirements
      const requirements = this.analyzeRequestRequirements(context);
      
      // Select servers based on capabilities and health
      const candidateServers = this.selectCandidateServers(requirements);
      
      // Apply load balancing and health filtering
      const selectedServers = this.applyLoadBalancing(candidateServers, requirements);
      
      // Determine execution strategy
      const strategy = this.determineExecutionStrategy(selectedServers, requirements);
      
      // Create routing decision
      const decision: MCPRoutingDecision = {
        targetServers: selectedServers,
        strategy,
        timeout: this.calculateTimeout(requirements, selectedServers),
        priority: requirements.priority,
        fallbackServers: this.selectFallbackServers(selectedServers, requirements),
      };

      // Cache the decision
      this.routingCache.set(cacheKey, decision);
      
      const duration = performance.now() - startTime;
      this.emitPerformanceMetric('route_decision', duration);
      
      // Alert if exceeding performance target
      if (duration > this.performanceThresholds.executionTime.target) {
        this.emitPerformanceAlert('executionTime', duration, context);
      }

      logger.debug('MCP routing decision', {
        targetServers: selectedServers,
        strategy,
        duration,
        cached: false,
      });

      return decision;

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('MCP routing failed', {
        error: errorMessage,
        duration,
        operation: context.operation,
      });

      // Return fallback routing decision
      return this.createFallbackDecision(context);
    }
  }

  /**
   * Execute request across selected MCP servers
   */
  async executeRequest(
    decision: MCPRoutingDecision, 
    context: BridgeHookContext
  ): Promise<BridgeHookResult> {
    const startTime = performance.now();

    try {
      // Execute based on strategy
      let result: BridgeHookResult;

      switch (decision.strategy) {
        case 'parallel':
          result = await this.executeParallel(decision.targetServers, context);
          break;
        case 'sequential':
          result = await this.executeSequential(decision.targetServers, context);
          break;
        case 'primary-fallback':
          result = await this.executePrimaryFallback(decision.targetServers, context);
          break;
        case 'consensus':
          result = await this.executeConsensus(decision.targetServers, context);
          break;
        default:
          throw new Error(`Unknown execution strategy: ${decision.strategy}`);
      }

      const duration = performance.now() - startTime;
      
      // Update server health based on results
      this.updateServerHealthFromResults(decision.targetServers, result, duration);
      
      // Add routing metadata to result
      result.metadata = {
        ...result.metadata,
        routing: {
          strategy: decision.strategy,
          serversUsed: decision.targetServers,
          executionTime: duration,
        },
      };

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('MCP request execution failed', {
        error: errorMessage,
        duration,
        strategy: decision.strategy,
        servers: decision.targetServers,
      });

      // Try fallback servers if available
      if (decision.fallbackServers && decision.fallbackServers.length > 0) {
        logger.info('Attempting fallback server execution');
        return this.executePrimaryFallback(decision.fallbackServers, context);
      }

      return {
        success: false,
        error: errorMessage,
        performance: { duration },
      };
    }
  }

  /**
   * Get current server health status
   */
  getServerHealth(): Map<MCPServerType, MCPServerHealth> {
    return new Map(this.serverHealth);
  }

  /**
   * Get routing performance metrics
   */
  getPerformanceMetrics(): Record<string, any> {
    const healthData = Array.from(this.serverHealth.values());
    
    return {
      totalServers: healthData.length,
      onlineServers: healthData.filter(h => h.status === 'online').length,
      averageResponseTime: healthData.reduce((sum, h) => sum + h.responseTime, 0) / healthData.length,
      cacheSize: this.routingCache.size,
      performanceThresholds: this.performanceThresholds,
      serverHealth: Object.fromEntries(
        healthData.map(h => [h.serverId, {
          status: h.status,
          responseTime: h.responseTime,
          successRate: h.successRate,
          currentLoad: h.currentLoad,
        }])
      ),
    };
  }

  /**
   * Update server availability
   */
  updateServerAvailability(serverId: MCPServerType, available: boolean): void {
    const health = this.serverHealth.get(serverId);
    if (health) {
      health.status = available ? 'online' : 'offline';
      health.lastHealthCheck = new Date();
      
      logger.info(`Server ${serverId} availability updated`, { available });
      this.emit('server_availability_changed', serverId, available);
    }
  }

  // ===================== PRIVATE IMPLEMENTATION =====================

  private initializeServerCapabilities(): void {
    // Define server capabilities and characteristics
    const serverConfigs: Array<{ id: MCPServerType; config: Partial<MCPServerHealth> }> = [
      {
        id: 'superclaude-code',
        config: {
          status: 'online',
          responseTime: 50,
          successRate: 0.95,
          currentLoad: 0.3,
          capabilities: [
            {
              name: 'code_analysis',
              description: 'Code parsing and semantic analysis',
              toolPatterns: ['Read', 'Edit', 'MultiEdit', 'Grep'],
              domainHints: ['development', 'analysis'],
              complexityRange: { min: 0.2, max: 0.8 },
              averageExecutionTime: 200,
              successRate: 0.95,
            },
          ],
        },
      },
      {
        id: 'superclaude-intelligence',
        config: {
          status: 'online',
          responseTime: 120,
          successRate: 0.92,
          currentLoad: 0.5,
          capabilities: [
            {
              name: 'complex_reasoning',
              description: 'Advanced reasoning and decision making',
              toolPatterns: ['mcp__sequential-thinking'],
              domainHints: ['analysis', 'planning', 'reasoning'],
              complexityRange: { min: 0.6, max: 1.0 },
              averageExecutionTime: 800,
              successRate: 0.92,
            },
          ],
        },
      },
      {
        id: 'superclaude-ui',
        config: {
          status: 'online',
          responseTime: 80,
          successRate: 0.94,
          currentLoad: 0.2,
          capabilities: [
            {
              name: 'ui_generation',
              description: 'UI component generation and design',
              toolPatterns: ['mcp__magic'],
              domainHints: ['frontend', 'design', 'ui'],
              complexityRange: { min: 0.3, max: 0.7 },
              averageExecutionTime: 400,
              successRate: 0.94,
            },
          ],
        },
      },
      {
        id: 'superclaude-performance',
        config: {
          status: 'online',
          responseTime: 30,
          successRate: 0.98,
          currentLoad: 0.1,
          capabilities: [
            {
              name: 'performance_monitoring',
              description: 'Performance monitoring and optimization',
              toolPatterns: ['*'],
              domainHints: ['performance', 'monitoring'],
              complexityRange: { min: 0.0, max: 1.0 },
              averageExecutionTime: 50,
              successRate: 0.98,
            },
          ],
        },
      },
      {
        id: 'context7',
        config: {
          status: 'online',
          responseTime: 200,
          successRate: 0.90,
          currentLoad: 0.4,
          capabilities: [
            {
              name: 'documentation_lookup',
              description: 'Library documentation and code examples',
              toolPatterns: ['mcp__context7'],
              domainHints: ['documentation', 'libraries', 'framework'],
              complexityRange: { min: 0.2, max: 0.6 },
              averageExecutionTime: 500,
              successRate: 0.90,
            },
          ],
        },
      },
      {
        id: 'sequential',
        config: {
          status: 'online',
          responseTime: 300,
          successRate: 0.88,
          currentLoad: 0.5,
          capabilities: [
            {
              name: 'sequential_thinking',
              description: 'Multi-step reasoning and complex problem solving',
              toolPatterns: ['mcp__sequential-thinking'],
              domainHints: ['analysis', 'reasoning', 'planning', 'complex'],
              complexityRange: { min: 0.5, max: 1.0 },
              averageExecutionTime: 1000,
              successRate: 0.88,
            },
          ],
        },
      },
      {
        id: 'magic',
        config: {
          status: 'online',
          responseTime: 250,
          successRate: 0.92,
          currentLoad: 0.3,
          capabilities: [
            {
              name: 'ui_component_generation',
              description: 'Modern UI component generation from 21st.dev',
              toolPatterns: ['mcp__magic'],
              domainHints: ['ui', 'component', 'frontend', 'design'],
              complexityRange: { min: 0.3, max: 0.8 },
              averageExecutionTime: 600,
              successRate: 0.92,
            },
          ],
        },
      },
      {
        id: 'playwright',
        config: {
          status: 'online',
          responseTime: 400,
          successRate: 0.85,
          currentLoad: 0.2,
          capabilities: [
            {
              name: 'browser_automation',
              description: 'Browser automation and E2E testing',
              toolPatterns: ['mcp__playwright'],
              domainHints: ['testing', 'e2e', 'browser', 'automation'],
              complexityRange: { min: 0.4, max: 0.9 },
              averageExecutionTime: 2000,
              successRate: 0.85,
            },
          ],
        },
      },
    ];

    // Initialize server health status
    for (const { id, config } of serverConfigs) {
      const health: MCPServerHealth = {
        serverId: id,
        status: 'online',
        lastHealthCheck: new Date(),
        responseTime: 100,
        successRate: 0.95,
        currentLoad: 0.0,
        errorCount: 0,
        capabilities: [],
        ...config,
      };

      this.serverHealth.set(id, health);
      
      // Register with coordination service
      this.coordinationService.registerServer({
        id,
        name: id,
        version: '1.0.0',
        description: `SuperClaude ${id} server`,
        capabilities: health.capabilities.map(c => c.name),
      });
    }
  }

  private analyzeRequestRequirements(context: BridgeHookContext): any {
    const toolName = context.operation.toLowerCase();
    const complexity = context.complexity || 'moderate';
    
    return {
      toolPatterns: [toolName],
      domainHints: this.extractDomainHints(context),
      complexity,
      priority: context.performanceBudget?.priority || 'medium',
      maxExecutionTime: context.performanceBudget?.maxExecutionTime || 5000,
      requiresParallel: this.requiresParallelExecution(context),
      requiresConsensus: this.requiresConsensus(context),
    };
  }

  private extractDomainHints(context: BridgeHookContext): string[] {
    const hints: string[] = [];
    const toolName = context.operation.toLowerCase();
    const argsString = JSON.stringify(context.args).toLowerCase();

    // Tool-based hints
    if (toolName.includes('magic') || argsString.includes('component')) {
      hints.push('frontend', 'ui');
    }
    if (toolName.includes('sequential') || argsString.includes('analyze')) {
      hints.push('analysis', 'reasoning');
    }
    if (toolName.includes('playwright') || argsString.includes('test')) {
      hints.push('testing', 'qa');
    }
    if (argsString.includes('performance') || argsString.includes('optimize')) {
      hints.push('performance');
    }

    return hints;
  }

  private selectCandidateServers(requirements: any): MCPServerType[] {
    const candidates: MCPServerType[] = [];

    for (const [serverId, health] of this.serverHealth.entries()) {
      if (health.status !== 'online') continue;

      // Check if server has matching capabilities
      const hasMatchingCapability = health.capabilities.some(cap => {
        // Check tool patterns
        const toolMatch = cap.toolPatterns.some(pattern => 
          pattern === '*' || requirements.toolPatterns.some((reqPattern: string) => 
            reqPattern.includes(pattern) || pattern.includes(reqPattern)
          )
        );

        // Check domain hints
        const domainMatch = cap.domainHints.some(hint => 
          requirements.domainHints.includes(hint)
        );

        // Check complexity range
        const complexityScore = this.getComplexityScore(requirements.complexity);
        const complexityMatch = complexityScore >= cap.complexityRange.min && 
                               complexityScore <= cap.complexityRange.max;

        return toolMatch || domainMatch || complexityMatch;
      });

      if (hasMatchingCapability) {
        candidates.push(serverId);
      }
    }

    // Always include performance monitoring for high-priority requests
    if (requirements.priority === 'high' || requirements.priority === 'critical') {
      if (!candidates.includes('superclaude-performance')) {
        candidates.push('superclaude-performance');
      }
    }

    // Fallback to orchestrator if no specific matches
    if (candidates.length === 0) {
      candidates.push('superclaude-orchestrator');
    }

    return candidates;
  }

  private applyLoadBalancing(candidates: MCPServerType[], requirements: any): MCPServerType[] {
    // Sort by current load and response time
    const sorted = candidates.sort((a, b) => {
      const healthA = this.serverHealth.get(a)!;
      const healthB = this.serverHealth.get(b)!;
      
      // Primary sort: load
      if (healthA.currentLoad !== healthB.currentLoad) {
        return healthA.currentLoad - healthB.currentLoad;
      }
      
      // Secondary sort: response time
      return healthA.responseTime - healthB.responseTime;
    });

    // Select based on requirements
    if (requirements.requiresParallel) {
      return sorted.slice(0, Math.min(3, sorted.length)); // Max 3 for parallel
    } else {
      return sorted.slice(0, 1); // Single server for sequential
    }
  }

  private determineExecutionStrategy(
    servers: MCPServerType[], 
    requirements: any
  ): MCPRoutingDecision['strategy'] {
    if (requirements.requiresConsensus && servers.length > 1) {
      return 'consensus';
    }
    if (requirements.requiresParallel && servers.length > 1) {
      return 'parallel';
    }
    if (servers.length > 1) {
      return 'primary-fallback';
    }
    return 'sequential';
  }

  private selectFallbackServers(
    primaryServers: MCPServerType[], 
    requirements: any
  ): MCPServerType[] {
    const fallbacks: MCPServerType[] = [];
    
    // Always include orchestrator as fallback
    if (!primaryServers.includes('superclaude-orchestrator')) {
      fallbacks.push('superclaude-orchestrator');
    }
    
    // Include performance monitoring if not already selected
    if (!primaryServers.includes('superclaude-performance')) {
      fallbacks.push('superclaude-performance');
    }

    return fallbacks;
  }

  private calculateTimeout(requirements: any, servers: MCPServerType[]): number {
    // Base timeout from requirements
    let timeout = requirements.maxExecutionTime || 5000;
    
    // Adjust based on server characteristics
    const avgResponseTime = servers.reduce((sum, serverId) => {
      const health = this.serverHealth.get(serverId);
      return sum + (health?.responseTime || 100);
    }, 0) / servers.length;
    
    // Add buffer for network and processing
    timeout = Math.max(timeout, avgResponseTime * 2 + 1000);
    
    return Math.min(timeout, 30000); // Max 30 seconds
  }

  private requiresParallelExecution(context: BridgeHookContext): boolean {
    return (
      context.flags.includes('--delegate') ||
      context.complexity === 'complex' ||
      context.complexity === 'critical' ||
      context.performanceBudget?.priority === 'critical'
    );
  }

  private requiresConsensus(context: BridgeHookContext): boolean {
    return (
      context.performanceBudget?.priority === 'critical' &&
      (context.complexity === 'complex' || context.complexity === 'critical')
    );
  }

  private getComplexityScore(complexity: string): number {
    const scores = { simple: 0.2, moderate: 0.5, complex: 0.8, critical: 1.0 };
    return scores[complexity as keyof typeof scores] || 0.5;
  }

  private generateCacheKey(context: BridgeHookContext): string {
    return `${context.operation}_${context.complexity}_${context.persona}_${context.flags.join(',')}`;
  }

  private isCacheValid(decision: MCPRoutingDecision): boolean {
    // Simple cache validation - in production, consider TTL and server health changes
    return decision.targetServers.every(serverId => {
      const health = this.serverHealth.get(serverId);
      return health?.status === 'online';
    });
  }

  private createFallbackDecision(context: BridgeHookContext): MCPRoutingDecision {
    return {
      targetServers: ['superclaude-orchestrator'],
      strategy: 'sequential',
      timeout: 10000,
      priority: 'medium',
      fallbackServers: ['superclaude-performance'],
    };
  }

  // Execution strategy implementations
  private async executeParallel(servers: MCPServerType[], context: BridgeHookContext): Promise<BridgeHookResult> {
    const externalServers = ['context7', 'sequential', 'magic', 'playwright'] as MCPServerType[];
    const internalServers = servers.filter(s => !externalServers.includes(s));
    const external = servers.filter(s => externalServers.includes(s));

    const promises: Promise<any>[] = [];

    // Execute internal servers through coordination service
    if (internalServers.length > 0) {
      promises.push(
        this.coordinationService.executeTask(
          'processing',
          { context },
          { targetServers: internalServers, strategy: 'parallel' }
        )
      );
    }

    // Execute external servers through external manager
    for (const serverId of external) {
      promises.push(
        this.executeExternalServer(serverId, context)
          .catch(error => ({
            success: false,
            error: error.message,
            serverId
          }))
      );
    }

    const results = await Promise.all(promises);
    
    // Merge results
    const mcpResults: Record<string, any> = {};
    let overallSuccess = true;
    let totalDuration = 0;

    for (const result of results) {
      if (result.results) {
        // Internal server results
        Object.assign(mcpResults, result.results);
      } else if (result.serverId) {
        // External server result
        mcpResults[result.serverId] = result;
      }
      
      if (!result.success) {
        overallSuccess = false;
      }
      
      totalDuration = Math.max(totalDuration, result.executionTime || result.duration || 0);
    }

    return {
      success: overallSuccess,
      data: mcpResults,
      mcpResults,
      performance: {
        duration: totalDuration,
      },
    };
  }

  private async executeSequential(servers: MCPServerType[], context: BridgeHookContext): Promise<BridgeHookResult> {
    const results = await this.coordinationService.executeTask(
      'processing',
      { context },
      { targetServers: servers, strategy: 'sequential' }
    );

    return {
      success: results.success,
      data: results.results,
      mcpResults: Object.fromEntries(results.results),
      performance: {
        duration: results.executionTime,
      },
    };
  }

  private async executePrimaryFallback(servers: MCPServerType[], context: BridgeHookContext): Promise<BridgeHookResult> {
    for (const server of servers) {
      try {
        const results = await this.coordinationService.executeTask(
          'processing',
          { context },
          { targetServers: [server] }
        );

        if (results.success) {
          return {
            success: true,
            data: results.results,
            mcpResults: Object.fromEntries(results.results),
            performance: {
              duration: results.executionTime,
            },
          };
        }
      } catch (error) {
        logger.warn(`Primary server ${server} failed, trying next`, { error });
      }
    }

    return {
      success: false,
      error: 'All servers in fallback chain failed',
    };
  }

  private async executeConsensus(servers: MCPServerType[], context: BridgeHookContext): Promise<BridgeHookResult> {
    const results = await this.coordinationService.executeTask(
      'validation',
      { context },
      { targetServers: servers, strategy: 'consensus' }
    );

    return {
      success: results.success,
      data: results.results,
      mcpResults: Object.fromEntries(results.results),
      performance: {
        duration: results.executionTime,
      },
    };
  }

  private updateServerHealthFromResults(servers: MCPServerType[], result: BridgeHookResult, duration: number): void {
    for (const serverId of servers) {
      const health = this.serverHealth.get(serverId);
      if (health) {
        // Update response time (weighted average)
        health.responseTime = (health.responseTime * 0.8) + (duration * 0.2);
        
        // Update success rate
        const wasSuccessful = result.success ? 1 : 0;
        health.successRate = (health.successRate * 0.9) + (wasSuccessful * 0.1);
        
        // Update error count
        if (!result.success) {
          health.errorCount += 1;
        }
        
        health.lastHealthCheck = new Date();
      }
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthResults = await this.coordinationService.performHealthCheck();
        
        for (const [serverId, isHealthy] of healthResults.entries()) {
          const health = this.serverHealth.get(serverId as MCPServerType);
          if (health) {
            health.status = isHealthy ? 'online' : 'offline';
            health.lastHealthCheck = new Date();
          }
        }
      } catch (error) {
        logger.error('Health check failed', { error });
      }
    }, 30000); // Every 30 seconds
  }

  private emitPerformanceMetric(operation: string, duration: number): void {
    this.emit('performance_metric', { operation, duration });
  }

  private emitPerformanceAlert(metric: string, value: number, context: BridgeHookContext): void {
    const alert: PerformanceAlert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity: value > this.performanceThresholds.executionTime.critical ? 'critical' : 'warning',
      metric: metric as any,
      value,
      threshold: this.performanceThresholds.executionTime.target,
      context,
      recommendation: this.generatePerformanceRecommendation(metric, value),
    };

    this.emit('performance_alert', alert);
    logger.warn('Performance threshold exceeded', alert);
  }

  private generatePerformanceRecommendation(metric: string, value: number): string {
    if (metric === 'executionTime') {
      if (value > 100) {
        return 'Consider enabling caching or reducing complexity';
      }
      return 'Monitor for consistent high execution times';
    }
    return 'Review performance optimization opportunities';
  }

  /**
   * Execute request on external server
   */
  private async executeExternalServer(
    serverId: MCPServerType,
    context: BridgeHookContext
  ): Promise<any> {
    const startTime = performance.now();

    try {
      // Map context to external server operation
      const operation = this.mapContextToOperation(serverId, context);
      const params = this.mapContextToParams(serverId, context);

      const result = await this.externalServerManager.executeRequest(
        serverId,
        operation,
        params
      );

      const duration = performance.now() - startTime;

      return {
        success: true,
        serverId,
        data: result,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`External server ${serverId} execution failed`, {
        error: errorMessage,
        duration,
      });

      return {
        success: false,
        serverId,
        error: errorMessage,
        duration,
      };
    }
  }

  private mapContextToOperation(serverId: MCPServerType, context: BridgeHookContext): string {
    // Map based on tool name and server capabilities
    const toolName = context.operation.toLowerCase();

    switch (serverId) {
      case 'context7':
        if (toolName.includes('resolve')) return 'resolve-library-id';
        if (toolName.includes('docs')) return 'get-library-docs';
        return 'get-library-docs';

      case 'sequential':
        return 'sequential-thinking';

      case 'magic':
        if (toolName.includes('logo')) return 'logo-search';
        if (toolName.includes('inspiration')) return 'component-inspiration';
        return 'component-builder';

      case 'playwright':
        if (toolName.includes('screenshot')) return 'screenshot';
        if (toolName.includes('navigate')) return 'navigate';
        return 'execute';

      default:
        return 'default';
    }
  }

  private mapContextToParams(serverId: MCPServerType, context: BridgeHookContext): any {
    const args = context.args;

    switch (serverId) {
      case 'context7':
        return {
          libraryName: args.libraryName || args.library || args.name,
          libraryId: args.libraryId || args.id,
          tokens: args.tokens || 10000,
          topic: args.topic,
        };

      case 'sequential':
        return {
          thought: args.thought || args.question || args.query,
          context: args.context || context.sessionState,
        };

      case 'magic':
        return {
          searchQuery: args.searchQuery || args.query || args.component,
          message: args.message || args.description,
          standaloneRequestQuery: args.standaloneRequestQuery,
          queries: args.queries || [args.query],
          format: args.format || 'TSX',
          absolutePathToCurrentFile: args.filePath,
          absolutePathToProjectDirectory: args.projectPath,
        };

      case 'playwright':
        return {
          url: args.url,
          selector: args.selector,
          action: args.action,
          options: args.options,
        };

      default:
        return args;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.coordinationService.cleanup();
    this.externalServerManager.cleanup();
    this.routingCache.clear();
    this.serverHealth.clear();
    logger.info('MCP Server Router cleanup completed');
  }
}