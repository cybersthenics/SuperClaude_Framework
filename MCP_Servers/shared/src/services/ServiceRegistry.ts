/**
 * Service Registry for Shared Services Infrastructure
 * Implements service registration, discovery, health checking, and failover
 */

import { EventEmitter } from 'events';

export interface ServiceDefinition {
  name: string;
  type: 'mcp-server' | 'shared-service' | 'external-service';
  version: string;
  config: any;
  healthCheck: HealthCheckConfig;
  failover?: FailoverConfig;
  capabilities?: string[];
  dependencies?: string[];
}

export interface HealthCheckConfig {
  endpoint?: string;
  interval: number;
  timeout?: number;
  retries?: number;
  customChecker?: () => Promise<boolean>;
}

export interface FailoverConfig {
  strategy: 'none' | 'restart' | 'replace' | 'circuit-breaker';
  maxRetries: number;
  backoffMultiplier: number;
  circuitBreakerThreshold?: number;
  fallbackService?: string;
}

export interface ServiceInstance {
  definition: ServiceDefinition;
  instance: any;
  status: ServiceStatus;
  healthStatus: HealthStatus;
  lastHealthCheck: Date;
  startTime: Date;
  failureCount: number;
  metadata: ServiceMetadata;
}

export interface ServiceStatus {
  state: 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';
  uptime: number;
  requests: number;
  errors: number;
  lastError?: Error;
}

export interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  responseTime: number;
  consecutiveFailures: number;
  details?: any;
}

export interface ServiceMetadata {
  tags: string[];
  priority: number;
  load: number;
  region?: string;
  zone?: string;
}

export interface HealthChecker {
  check(): Promise<boolean>;
  getDetails(): Promise<any>;
}

export interface FailoverStrategy {
  handleFailure(service: ServiceInstance): Promise<boolean>;
  shouldTrigger(service: ServiceInstance): boolean;
}

export interface ServiceRegistryHealth {
  overall: boolean;
  services: Record<string, boolean>;
  timestamp: Date;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
  };
}

export class ServiceRegistry extends EventEmitter {
  private services: Map<string, ServiceInstance> = new Map();
  private healthCheckers: Map<string, HealthChecker> = new Map();
  private failoverStrategies: Map<string, FailoverStrategy> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isShuttingDown = false;

  constructor() {
    super();
    this.setupDefaultFailoverStrategies();
  }

  async registerService(definition: ServiceDefinition): Promise<void> {
    try {
      // Validate service definition
      this.validateServiceDefinition(definition);

      // Check for dependencies
      await this.validateDependencies(definition.dependencies || []);

      // Instantiate service
      const instance = await this.instantiateService(definition);

      // Create service instance record
      const serviceInstance: ServiceInstance = {
        definition,
        instance,
        status: {
          state: 'starting',
          uptime: 0,
          requests: 0,
          errors: 0
        },
        healthStatus: {
          healthy: false,
          lastCheck: new Date(),
          responseTime: 0,
          consecutiveFailures: 0
        },
        lastHealthCheck: new Date(),
        startTime: new Date(),
        failureCount: 0,
        metadata: {
          tags: definition.capabilities || [],
          priority: 1,
          load: 0
        }
      };

      // Register service
      this.services.set(definition.name, serviceInstance);

      // Setup health checking
      await this.setupHealthCheck(definition.name, definition.healthCheck);

      // Configure failover if specified
      if (definition.failover) {
        await this.configureFailover(definition.name, definition.failover);
      }

      // Update service status
      serviceInstance.status.state = 'running';

      this.emit('serviceRegistered', {
        serviceName: definition.name,
        serviceType: definition.type,
        capabilities: definition.capabilities
      });

      console.log(`Service registered: ${definition.name} (${definition.type})`);
    } catch (error) {
      console.error(`Failed to register service ${definition.name}:`, error);
      throw error;
    }
  }

  async unregisterService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    try {
      // Stop health checking
      const interval = this.healthCheckIntervals.get(serviceName);
      if (interval) {
        clearInterval(interval);
        this.healthCheckIntervals.delete(serviceName);
      }

      // Update status
      service.status.state = 'stopping';

      // Graceful shutdown if possible
      if (service.instance && typeof service.instance.shutdown === 'function') {
        await service.instance.shutdown();
      }

      // Remove from registry
      this.services.delete(serviceName);
      this.healthCheckers.delete(serviceName);
      this.failoverStrategies.delete(serviceName);

      this.emit('serviceUnregistered', { serviceName });
      console.log(`Service unregistered: ${serviceName}`);
    } catch (error) {
      console.error(`Failed to unregister service ${serviceName}:`, error);
      throw error;
    }
  }

  async getService<T>(serviceName: string): Promise<T> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    // Check if service is healthy
    if (!await this.isHealthy(serviceName)) {
      return await this.handleFailover(serviceName);
    }

    // Update request count
    service.status.requests++;

    return service.instance as T;
  }

  async getServiceByCapability(capability: string): Promise<ServiceInstance[]> {
    const matchingServices: ServiceInstance[] = [];

    for (const [name, service] of this.services) {
      if (service.definition.capabilities?.includes(capability) && 
          await this.isHealthy(name)) {
        matchingServices.push(service);
      }
    }

    // Sort by load and priority
    return matchingServices.sort((a, b) => {
      if (a.metadata.priority !== b.metadata.priority) {
        return a.metadata.priority - b.metadata.priority;
      }
      return a.metadata.load - b.metadata.load;
    });
  }

  async isHealthy(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }

    // Check if recent health check is available
    const maxAge = service.definition.healthCheck.interval * 2;
    const timeSinceCheck = Date.now() - service.healthStatus.lastCheck.getTime();
    
    if (timeSinceCheck < maxAge) {
      return service.healthStatus.healthy;
    }

    // Perform immediate health check
    return await this.performHealthCheck(serviceName);
  }

  async healthCheck(): Promise<ServiceRegistryHealth> {
    const results: [string, boolean][] = [];
    const timestamp = new Date();

    for (const [name] of this.services) {
      const healthy = await this.isHealthy(name);
      results.push([name, healthy]);
    }

    const summary = {
      total: results.length,
      healthy: results.filter(([, healthy]) => healthy).length,
      unhealthy: results.filter(([, healthy]) => !healthy).length,
      unknown: 0
    };

    return {
      overall: summary.unhealthy === 0,
      services: Object.fromEntries(results),
      timestamp,
      summary
    };
  }

  async getServiceInfo(serviceName: string): Promise<ServiceInstance | null> {
    return this.services.get(serviceName) || null;
  }

  async listServices(): Promise<ServiceInstance[]> {
    return Array.from(this.services.values());
  }

  async getServiceStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [name, service] of this.services) {
      stats[name] = {
        status: service.status.state,
        healthy: service.healthStatus.healthy,
        uptime: Date.now() - service.startTime.getTime(),
        requests: service.status.requests,
        errors: service.status.errors,
        load: service.metadata.load,
        lastHealthCheck: service.healthStatus.lastCheck
      };
    }

    return stats;
  }

  private async instantiateService(definition: ServiceDefinition): Promise<any> {
    // This would be customized based on service type
    // For now, return a mock instance
    return {
      name: definition.name,
      type: definition.type,
      config: definition.config,
      shutdown: async () => {
        console.log(`Shutting down service: ${definition.name}`);
      }
    };
  }

  private validateServiceDefinition(definition: ServiceDefinition): void {
    if (!definition.name) {
      throw new Error('Service name is required');
    }
    if (!definition.type) {
      throw new Error('Service type is required');
    }
    if (!definition.version) {
      throw new Error('Service version is required');
    }
    if (!definition.healthCheck) {
      throw new Error('Health check configuration is required');
    }
  }

  private async validateDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.services.has(dep)) {
        throw new Error(`Dependency not found: ${dep}`);
      }
      if (!await this.isHealthy(dep)) {
        throw new Error(`Dependency unhealthy: ${dep}`);
      }
    }
  }

  private async setupHealthCheck(serviceName: string, config: HealthCheckConfig): Promise<void> {
    const healthChecker: HealthChecker = {
      check: async (): Promise<boolean> => {
        if (config.customChecker) {
          return await config.customChecker();
        }

        if (config.endpoint) {
          try {
            // Mock HTTP health check
            await new Promise(resolve => setTimeout(resolve, 10));
            return true;
          } catch {
            return false;
          }
        }

        return true;
      },

      getDetails: async (): Promise<any> => {
        return {
          endpoint: config.endpoint,
          lastCheck: new Date(),
          status: 'healthy'
        };
      }
    };

    this.healthCheckers.set(serviceName, healthChecker);

    // Start periodic health checking
    const interval = setInterval(async () => {
      if (!this.isShuttingDown) {
        await this.performHealthCheck(serviceName);
      }
    }, config.interval);

    this.healthCheckIntervals.set(serviceName, interval);
  }

  private async performHealthCheck(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    const checker = this.healthCheckers.get(serviceName);

    if (!service || !checker) {
      return false;
    }

    const startTime = Date.now();
    
    try {
      const healthy = await checker.check();
      const responseTime = Date.now() - startTime;

      service.healthStatus = {
        healthy,
        lastCheck: new Date(),
        responseTime,
        consecutiveFailures: healthy ? 0 : service.healthStatus.consecutiveFailures + 1
      };

      if (!healthy) {
        service.status.errors++;
        this.emit('serviceUnhealthy', { serviceName, consecutiveFailures: service.healthStatus.consecutiveFailures });

        // Check if failover should be triggered
        const failoverStrategy = this.failoverStrategies.get(serviceName);
        if (failoverStrategy && failoverStrategy.shouldTrigger(service)) {
          await failoverStrategy.handleFailure(service);
        }
      } else {
        this.emit('serviceHealthy', { serviceName });
      }

      return healthy;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      service.healthStatus = {
        healthy: false,
        lastCheck: new Date(),
        responseTime,
        consecutiveFailures: service.healthStatus.consecutiveFailures + 1
      };

      service.status.errors++;
      service.status.lastError = error as Error;

      this.emit('healthCheckError', { serviceName, error });
      return false;
    }
  }

  private async configureFailover(serviceName: string, config: FailoverConfig): Promise<void> {
    const strategy = this.createFailoverStrategy(config);
    this.failoverStrategies.set(serviceName, strategy);
  }

  private createFailoverStrategy(config: FailoverConfig): FailoverStrategy {
    return {
      shouldTrigger: (service: ServiceInstance): boolean => {
        switch (config.strategy) {
          case 'circuit-breaker':
            return service.healthStatus.consecutiveFailures >= (config.circuitBreakerThreshold || 3);
          case 'restart':
          case 'replace':
            return service.healthStatus.consecutiveFailures >= config.maxRetries;
          default:
            return false;
        }
      },

      handleFailure: async (service: ServiceInstance): Promise<boolean> => {
        console.log(`Handling failure for service: ${service.definition.name} (strategy: ${config.strategy})`);
        
        switch (config.strategy) {
          case 'restart':
            return await this.restartService(service);
          case 'replace':
            return await this.replaceService(service, config.fallbackService);
          case 'circuit-breaker':
            return await this.openCircuitBreaker(service);
          default:
            return false;
        }
      }
    };
  }

  private async restartService(service: ServiceInstance): Promise<boolean> {
    try {
      console.log(`Restarting service: ${service.definition.name}`);
      
      // Shutdown current instance
      if (service.instance && typeof service.instance.shutdown === 'function') {
        await service.instance.shutdown();
      }

      // Wait a bit before restart
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reinstantiate
      service.instance = await this.instantiateService(service.definition);
      service.status.state = 'running';
      service.failureCount++;

      this.emit('serviceRestarted', { serviceName: service.definition.name });
      return true;
    } catch (error) {
      console.error(`Failed to restart service ${service.definition.name}:`, error);
      return false;
    }
  }

  private async replaceService(service: ServiceInstance, fallbackName?: string): Promise<boolean> {
    if (!fallbackName) {
      return false;
    }

    const fallbackService = this.services.get(fallbackName);
    if (!fallbackService || !await this.isHealthy(fallbackName)) {
      return false;
    }

    console.log(`Replacing service ${service.definition.name} with ${fallbackName}`);
    this.emit('serviceReplaced', { 
      originalService: service.definition.name,
      replacementService: fallbackName 
    });

    return true;
  }

  private async openCircuitBreaker(service: ServiceInstance): Promise<boolean> {
    console.log(`Opening circuit breaker for service: ${service.definition.name}`);
    service.status.state = 'failed';
    
    this.emit('circuitBreakerOpened', { serviceName: service.definition.name });
    
    // Schedule circuit breaker reset
    setTimeout(async () => {
      if (await this.performHealthCheck(service.definition.name)) {
        service.status.state = 'running';
        this.emit('circuitBreakerClosed', { serviceName: service.definition.name });
      }
    }, 60000); // Reset after 1 minute

    return true;
  }

  private async handleFailover<T>(serviceName: string): Promise<T> {
    const strategy = this.failoverStrategies.get(serviceName);
    if (!strategy) {
      throw new Error(`Service ${serviceName} is unhealthy and no failover strategy configured`);
    }

    // Try to handle the failure
    const service = this.services.get(serviceName)!;
    const handled = await strategy.handleFailure(service);
    
    if (!handled) {
      throw new Error(`Failover failed for service: ${serviceName}`);
    }

    // Return the service instance after failover handling
    return service.instance as T;
  }

  private setupDefaultFailoverStrategies(): void {
    // Default strategies can be added here
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    console.log('Shutting down Service Registry...');

    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }

    // Shutdown all services
    for (const [name, service] of this.services) {
      try {
        if (service.instance && typeof service.instance.shutdown === 'function') {
          await service.instance.shutdown();
        }
      } catch (error) {
        console.error(`Error shutting down service ${name}:`, error);
      }
    }

    this.services.clear();
    this.healthCheckers.clear();
    this.failoverStrategies.clear();
    this.healthCheckIntervals.clear();

    this.removeAllListeners();
    console.log('Service Registry shutdown complete');
  }
}