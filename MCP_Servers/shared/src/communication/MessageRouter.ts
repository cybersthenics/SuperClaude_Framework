/**
 * Message Router Implementation
 * Core routing engine for inter-server communication
 */

import { EventEmitter } from 'events';
import {
  BaseMessage,
  MessageType,
  MessagePriority,
  ServerIdentifier,
  RoutingResult,
  BroadcastResult,
  InterServerCommunicationConfig,
  RoutingHint,
  PerformanceHint
} from './types.js';

export interface Route {
  targetServer: ServerIdentifier;
  path: ServerIdentifier[];
  estimatedLatency: number;
  reliability: number;
  cost: number;
}

export interface RoutingTableEntry {
  serverId: ServerIdentifier;
  endpoints: string[];
  capabilities: string[];
  health: HealthStatus;
  load: number;
  lastUpdate: Date;
  performance: PerformanceMetrics;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface PerformanceMetrics {
  averageLatency: number;
  throughput: number;
  errorRate: number;
  successRate: number;
  lastMeasurement: Date;
}

export interface SelectionCriteria {
  operation: string;
  requiredCapabilities: string[];
  prioritizeLatency: boolean;
  prioritizeReliability: boolean;
  excludeServers?: ServerIdentifier[];
}

export interface RoutingTableUpdate {
  serverId: ServerIdentifier;
  updateType: 'add' | 'update' | 'remove';
  data?: Partial<RoutingTableEntry>;
}

export interface LoadBalancingResult {
  selectedServer: ServerIdentifier;
  loadDistribution: Record<ServerIdentifier, number>;
  balancingStrategy: string;
}

export interface FailoverResult {
  success: boolean;
  newTarget?: ServerIdentifier;
  failedServer: ServerIdentifier;
  failoverTime: number;
}

export interface RoutingOptimization {
  optimizationsApplied: string[];
  performanceImprovement: number;
  latencyReduction: number;
  throughputIncrease: number;
}

export interface RoutingMetrics {
  totalMessages: number;
  routingLatency: number;
  successRate: number;
  failoverCount: number;
  loadBalance: Record<ServerIdentifier, number>;
}

export interface MessageRouter {
  routeMessage(message: BaseMessage): Promise<RoutingResult>;
  broadcastMessage(message: BaseMessage, targets?: ServerIdentifier[]): Promise<BroadcastResult>;
  calculateOptimalRoute(message: BaseMessage): Promise<Route>;
  updateRoutingTable(updates: RoutingTableUpdate[]): Promise<void>;
  selectTargetServer(criteria: SelectionCriteria): Promise<ServerIdentifier>;
  balanceLoad(message: BaseMessage): Promise<LoadBalancingResult>;
  checkServerHealth(serverId: ServerIdentifier): Promise<HealthStatus>;
  handleServerFailure(serverId: ServerIdentifier): Promise<FailoverResult>;
  optimizeRouting(): Promise<RoutingOptimization>;
  getRoutingMetrics(): Promise<RoutingMetrics>;
}

export class MessageRouterImpl extends EventEmitter implements MessageRouter {
  private routingTable: Map<ServerIdentifier, RoutingTableEntry> = new Map();
  private messageQueue: Map<MessagePriority, BaseMessage[]> = new Map();
  private performanceCache: Map<string, PerformanceMetrics> = new Map();
  private circuitBreakers: Map<ServerIdentifier, CircuitBreakerState> = new Map();
  private routingMetrics: RoutingMetrics;
  private config: InterServerCommunicationConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: InterServerCommunicationConfig) {
    super();
    this.config = config;
    this.routingMetrics = {
      totalMessages: 0,
      routingLatency: 0,
      successRate: 100,
      failoverCount: 0,
      loadBalance: {}
    };

    // Initialize message queues
    Object.values(MessagePriority).forEach(priority => {
      if (typeof priority === 'number') {
        this.messageQueue.set(priority, []);
      }
    });

    this.startHealthChecking();
  }

  async routeMessage(message: BaseMessage): Promise<RoutingResult> {
    const startTime = performance.now();
    
    try {
      // Update metrics
      this.routingMetrics.totalMessages++;

      // Calculate optimal route
      const route = await this.calculateOptimalRoute(message);
      
      // Check circuit breaker
      const circuitBreakerState = this.circuitBreakers.get(route.targetServer);
      if (circuitBreakerState?.state === 'open') {
        // Try failover
        const failoverResult = await this.handleServerFailure(route.targetServer);
        if (failoverResult.success && failoverResult.newTarget) {
          route.targetServer = failoverResult.newTarget;
        } else {
          throw new Error(`Circuit breaker open for ${route.targetServer} and no failover available`);
        }
      }

      // Route the message
      const routingResult = await this.executeRouting(message, route);
      
      // Update performance metrics
      const latency = performance.now() - startTime;
      this.updatePerformanceMetrics(route.targetServer, latency, routingResult.success);
      
      // Update routing metrics
      this.routingMetrics.routingLatency = 
        (this.routingMetrics.routingLatency + latency) / 2;

      if (routingResult.success) {
        this.updateCircuitBreaker(route.targetServer, true);
      } else {
        this.updateCircuitBreaker(route.targetServer, false);
        this.routingMetrics.successRate = 
          (this.routingMetrics.successRate * (this.routingMetrics.totalMessages - 1) + 0) / 
          this.routingMetrics.totalMessages;
      }

      return {
        ...routingResult,
        latency
      };

    } catch (error) {
      const latency = performance.now() - startTime;
      this.routingMetrics.routingLatency = 
        (this.routingMetrics.routingLatency + latency) / 2;
      this.routingMetrics.successRate = 
        (this.routingMetrics.successRate * (this.routingMetrics.totalMessages - 1) + 0) / 
        this.routingMetrics.totalMessages;

      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async broadcastMessage(message: BaseMessage, targets?: ServerIdentifier[]): Promise<BroadcastResult> {
    const startTime = performance.now();
    const targetServers = targets || Array.from(this.routingTable.keys());
    
    const deliveryPromises = targetServers.map(async (target) => {
      try {
        const targetMessage: BaseMessage = {
          ...message,
          header: {
            ...message.header,
            target
          }
        };
        
        const result = await this.routeMessage(targetMessage);
        return { target, success: result.success };
      } catch (error) {
        return { target, success: false };
      }
    });

    const results = await Promise.allSettled(deliveryPromises);
    const deliveredCount = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failedTargets = results
      .filter(result => result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success))
      .map(result => result.status === 'fulfilled' ? result.value.target : 'unknown');

    const totalLatency = performance.now() - startTime;
    const averageLatency = totalLatency / targetServers.length;

    return {
      success: deliveredCount > 0,
      deliveredCount,
      failedTargets,
      averageLatency
    };
  }

  async calculateOptimalRoute(message: BaseMessage): Promise<Route> {
    const target = Array.isArray(message.header.target) 
      ? message.header.target[0] 
      : message.header.target;

    // Get routing entry
    const routingEntry = this.routingTable.get(target);
    if (!routingEntry) {
      throw new Error(`No routing entry found for server: ${target}`);
    }

    // Check server health
    if (routingEntry.health.status === 'unhealthy') {
      // Try to find alternative
      const alternative = await this.findAlternativeServer(message, target);
      if (alternative) {
        return this.calculateOptimalRoute({
          ...message,
          header: { ...message.header, target: alternative }
        });
      }
      throw new Error(`Target server ${target} is unhealthy and no alternative found`);
    }

    // Calculate route metrics
    const estimatedLatency = this.estimateLatency(target, message);
    const reliability = this.calculateReliability(target);
    const cost = this.calculateRoutingCost(target, message);

    return {
      targetServer: target,
      path: [target], // Direct routing for now
      estimatedLatency,
      reliability,
      cost
    };
  }

  async updateRoutingTable(updates: RoutingTableUpdate[]): Promise<void> {
    for (const update of updates) {
      switch (update.updateType) {
        case 'add':
        case 'update':
          if (update.data) {
            const existing = this.routingTable.get(update.serverId);
            const updated = existing ? { ...existing, ...update.data } : update.data as RoutingTableEntry;
            this.routingTable.set(update.serverId, updated);
          }
          break;
        case 'remove':
          this.routingTable.delete(update.serverId);
          break;
      }
    }

    this.emit('routingTableUpdated', updates);
  }

  async selectTargetServer(criteria: SelectionCriteria): Promise<ServerIdentifier> {
    const availableServers = Array.from(this.routingTable.entries())
      .filter(([serverId, entry]) => {
        // Exclude unhealthy servers
        if (entry.health.status === 'unhealthy') return false;
        
        // Exclude specified servers
        if (criteria.excludeServers?.includes(serverId)) return false;
        
        // Check capabilities
        return criteria.requiredCapabilities.every(cap => 
          entry.capabilities.includes(cap)
        );
      });

    if (availableServers.length === 0) {
      throw new Error('No available servers match the criteria');
    }

    // Apply selection strategy
    if (criteria.prioritizeLatency) {
      return availableServers.reduce((best, current) => 
        current[1].performance.averageLatency < best[1].performance.averageLatency ? current : best
      )[0];
    }

    if (criteria.prioritizeReliability) {
      return availableServers.reduce((best, current) => 
        current[1].performance.successRate > best[1].performance.successRate ? current : best
      )[0];
    }

    // Default: load balancing
    return availableServers.reduce((best, current) => 
      current[1].load < best[1].load ? current : best
    )[0];
  }

  async balanceLoad(message: BaseMessage): Promise<LoadBalancingResult> {
    const strategy = this.config.routing.routingStrategy;
    const availableServers = Array.from(this.routingTable.entries())
      .filter(([_, entry]) => entry.health.status !== 'unhealthy');

    let selectedServer: ServerIdentifier;

    switch (strategy) {
      case 'round-robin':
        selectedServer = this.selectRoundRobin(availableServers);
        break;
      case 'least-connections':
        selectedServer = this.selectLeastConnections(availableServers);
        break;
      case 'performance':
      default:
        selectedServer = this.selectByPerformance(availableServers);
        break;
    }

    const loadDistribution: Record<ServerIdentifier, number> = {};
    availableServers.forEach(([serverId, entry]) => {
      loadDistribution[serverId] = entry.load;
    });

    return {
      selectedServer,
      loadDistribution,
      balancingStrategy: strategy
    };
  }

  async checkServerHealth(serverId: ServerIdentifier): Promise<HealthStatus> {
    const entry = this.routingTable.get(serverId);
    if (!entry) {
      throw new Error(`Server ${serverId} not found in routing table`);
    }

    // Perform health check (placeholder implementation)
    const startTime = performance.now();
    
    try {
      // TODO: Implement actual health check logic
      const responseTime = performance.now() - startTime;
      
      const healthStatus: HealthStatus = {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        responseTime,
        errorRate: entry.performance.errorRate,
        uptime: 99.5 // Placeholder
      };

      // Update routing table
      await this.updateRoutingTable([{
        serverId,
        updateType: 'update',
        data: { health: healthStatus }
      }]);

      return healthStatus;
    } catch (error) {
      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: performance.now() - startTime,
        errorRate: 100,
        uptime: 0
      };

      await this.updateRoutingTable([{
        serverId,
        updateType: 'update', 
        data: { health: healthStatus }
      }]);

      return healthStatus;
    }
  }

  async handleServerFailure(serverId: ServerIdentifier): Promise<FailoverResult> {
    const startTime = performance.now();
    this.routingMetrics.failoverCount++;

    try {
      // Find alternative server
      const alternative = await this.findFailoverTarget(serverId);
      
      if (alternative) {
        // Update circuit breaker
        this.updateCircuitBreaker(serverId, false);
        
        return {
          success: true,
          newTarget: alternative,
          failedServer: serverId,
          failoverTime: performance.now() - startTime
        };
      }

      return {
        success: false,
        failedServer: serverId,
        failoverTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        failedServer: serverId,
        failoverTime: performance.now() - startTime
      };
    }
  }

  async optimizeRouting(): Promise<RoutingOptimization> {
    const optimizations: string[] = [];
    let performanceImprovement = 0;
    let latencyReduction = 0;
    let throughputIncrease = 0;

    // Optimize routing table
    const tableOptimization = await this.optimizeRoutingTable();
    optimizations.push('routing_table_optimization');
    performanceImprovement += tableOptimization.improvement;

    // Optimize load balancing
    const loadOptimization = await this.optimizeLoadBalancing();
    optimizations.push('load_balancing_optimization');
    latencyReduction += loadOptimization.latencyReduction;

    // Optimize circuit breakers
    const circuitOptimization = await this.optimizeCircuitBreakers();
    optimizations.push('circuit_breaker_optimization');
    throughputIncrease += circuitOptimization.throughputIncrease;

    return {
      optimizationsApplied: optimizations,
      performanceImprovement,
      latencyReduction,
      throughputIncrease
    };
  }

  async getRoutingMetrics(): Promise<RoutingMetrics> {
    return { ...this.routingMetrics };
  }

  private async executeRouting(message: BaseMessage, route: Route): Promise<RoutingResult> {
    // Placeholder implementation - actual routing would go through network layer
    return {
      success: true,
      targetServer: route.targetServer,
      routingPath: route.path,
      latency: route.estimatedLatency
    };
  }

  private estimateLatency(serverId: ServerIdentifier, message: BaseMessage): number {
    const entry = this.routingTable.get(serverId);
    if (!entry) return 1000; // Default high latency for unknown servers

    // Base latency from performance metrics
    let estimatedLatency = entry.performance.averageLatency;

    // Adjust for message priority
    if (message.header.priority === MessagePriority.Critical) {
      estimatedLatency *= 0.8; // Priority messages get faster routing
    } else if (message.header.priority === MessagePriority.Background) {
      estimatedLatency *= 1.5; // Background messages may be delayed
    }

    // Adjust for server load
    estimatedLatency *= (1 + entry.load / 100);

    return estimatedLatency;
  }

  private calculateReliability(serverId: ServerIdentifier): number {
    const entry = this.routingTable.get(serverId);
    if (!entry) return 0;

    // Base reliability on success rate and health
    let reliability = entry.performance.successRate / 100;
    
    if (entry.health.status === 'degraded') {
      reliability *= 0.8;
    } else if (entry.health.status === 'unhealthy') {
      reliability = 0;
    }

    return reliability;
  }

  private calculateRoutingCost(serverId: ServerIdentifier, message: BaseMessage): number {
    const entry = this.routingTable.get(serverId);
    if (!entry) return 1000;

    // Cost based on latency, load, and complexity
    const baseCost = entry.performance.averageLatency;
    const loadCost = entry.load * 10;
    const priorityCost = message.header.priority * 5;

    return baseCost + loadCost + priorityCost;
  }

  private async findAlternativeServer(message: BaseMessage, failedServer: ServerIdentifier): Promise<ServerIdentifier | null> {
    const availableServers = Array.from(this.routingTable.keys())
      .filter(serverId => serverId !== failedServer);

    if (availableServers.length === 0) return null;

    // Find server with similar capabilities
    const failedEntry = this.routingTable.get(failedServer);
    if (!failedEntry) return availableServers[0];

    for (const serverId of availableServers) {
      const entry = this.routingTable.get(serverId);
      if (!entry) continue;

      // Check if server has overlapping capabilities
      const hasOverlap = failedEntry.capabilities.some(cap => 
        entry.capabilities.includes(cap)
      );

      if (hasOverlap && entry.health.status === 'healthy') {
        return serverId;
      }
    }

    return availableServers[0];
  }

  private async findFailoverTarget(failedServer: ServerIdentifier): Promise<ServerIdentifier | null> {
    return this.findAlternativeServer({} as BaseMessage, failedServer);
  }

  private selectRoundRobin(servers: [ServerIdentifier, RoutingTableEntry][]): ServerIdentifier {
    // Simple round-robin implementation
    const index = this.routingMetrics.totalMessages % servers.length;
    return servers[index][0];
  }

  private selectLeastConnections(servers: [ServerIdentifier, RoutingTableEntry][]): ServerIdentifier {
    return servers.reduce((best, current) => 
      current[1].load < best[1].load ? current : best
    )[0];
  }

  private selectByPerformance(servers: [ServerIdentifier, RoutingTableEntry][]): ServerIdentifier {
    return servers.reduce((best, current) => {
      const currentScore = this.calculatePerformanceScore(current[1]);
      const bestScore = this.calculatePerformanceScore(best[1]);
      return currentScore > bestScore ? current : best;
    })[0];
  }

  private calculatePerformanceScore(entry: RoutingTableEntry): number {
    const latencyScore = 1000 / Math.max(entry.performance.averageLatency, 1);
    const successScore = entry.performance.successRate;
    const loadScore = 100 - entry.load;
    const healthScore = entry.health.status === 'healthy' ? 100 : 
                       entry.health.status === 'degraded' ? 50 : 0;

    return (latencyScore + successScore + loadScore + healthScore) / 4;
  }

  private updatePerformanceMetrics(serverId: ServerIdentifier, latency: number, success: boolean): void {
    const entry = this.routingTable.get(serverId);
    if (!entry) return;

    // Update metrics with exponential moving average
    const alpha = 0.1; // Smoothing factor
    
    entry.performance.averageLatency = 
      alpha * latency + (1 - alpha) * entry.performance.averageLatency;
    
    entry.performance.successRate = 
      alpha * (success ? 100 : 0) + (1 - alpha) * entry.performance.successRate;
    
    entry.performance.lastMeasurement = new Date();
  }

  private updateCircuitBreaker(serverId: ServerIdentifier, success: boolean): void {
    let state = this.circuitBreakers.get(serverId);
    if (!state) {
      state = { state: 'closed', failureCount: 0, lastFailure: null };
      this.circuitBreakers.set(serverId, state);
    }

    if (success) {
      state.failureCount = 0;
      if (state.state === 'half-open') {
        state.state = 'closed';
      }
    } else {
      state.failureCount++;
      state.lastFailure = new Date();

      if (state.failureCount >= this.config.performance.circuitBreakerThreshold) {
        state.state = 'open';
        
        // Set timeout to move to half-open
        setTimeout(() => {
          if (state) state.state = 'half-open';
        }, 30000); // 30 seconds
      }
    }
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      const servers = Array.from(this.routingTable.keys());
      for (const serverId of servers) {
        try {
          await this.checkServerHealth(serverId);
        } catch (error) {
          console.error(`Health check failed for server ${serverId}:`, error);
        }
      }
    }, this.config.routing.healthCheckInterval);
  }

  private async optimizeRoutingTable(): Promise<{ improvement: number }> {
    // Clean up stale entries
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [serverId, entry] of this.routingTable.entries()) {
      if (now.getTime() - entry.lastUpdate.getTime() > staleThreshold) {
        await this.checkServerHealth(serverId);
      }
    }

    return { improvement: 5 }; // Placeholder
  }

  private async optimizeLoadBalancing(): Promise<{ latencyReduction: number }> {
    // Rebalance load across servers
    const servers = Array.from(this.routingTable.values());
    const averageLoad = servers.reduce((sum, entry) => sum + entry.load, 0) / servers.length;
    
    // Identify overloaded servers
    const overloaded = servers.filter(entry => entry.load > averageLoad * 1.5);
    
    return { latencyReduction: overloaded.length * 10 }; // Placeholder
  }

  private async optimizeCircuitBreakers(): Promise<{ throughputIncrease: number }> {
    // Review circuit breaker states and optimize thresholds
    let optimizations = 0;
    
    for (const [serverId, state] of this.circuitBreakers.entries()) {
      if (state.state === 'open' && state.lastFailure) {
        const timeSinceFailure = Date.now() - state.lastFailure.getTime();
        if (timeSinceFailure > 60000) { // 1 minute
          state.state = 'half-open';
          optimizations++;
        }
      }
    }

    return { throughputIncrease: optimizations * 5 }; // Placeholder
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure: Date | null;
}