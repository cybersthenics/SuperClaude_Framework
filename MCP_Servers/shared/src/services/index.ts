/**
 * Shared Services Infrastructure - Main Exports
 * Core infrastructure services for SuperClaude MCP ecosystem
 */

// Core Services (Phase 1)
export { ServiceRegistry } from './ServiceRegistry.js';
export { CacheManager } from './CacheManager.js';
export { ResourceManager } from './ResourceManager.js';
export { ValidationFramework } from './ValidationFramework.js';

// Phase 2 Services
export { ContextManager } from './ContextManager.js';

// Phase 3 Services
export { HookCoordinator } from './HookCoordinator.js';
export { LSPCoordinator } from './LSPCoordinator.js';

// Re-export existing performance monitor from communication
export { PerformanceMonitor } from '../communication/PerformanceMonitor.js';

// Service Registry Types
export type {
  ServiceDefinition,
  ServiceInstance,
  ServiceStatus,
  HealthStatus,
  ServiceMetadata,
  HealthChecker,
  FailoverStrategy,
  ServiceRegistryHealth,
  HealthCheckConfig,
  FailoverConfig
} from './ServiceRegistry.js';

// Cache Manager Types
export type {
  CacheOptions,
  CacheEntry,
  CacheMetrics,
  CacheConfig,
  CacheLevel,
  CachePriority,
  EvictionPolicy,
  SemanticAnalysisResult,
  SemanticCacheConfig,
  LSPCacheConfig,
  CacheStats
} from './CacheManager.js';

// Resource Manager Types
export type {
  TokenAllocation,
  MemoryAllocation,
  ConcurrencySlot,
  TokenBudget,
  MemoryUsage,
  ConcurrencyStatus,
  ResourcePrediction,
  OptimizationResult,
  QuotaEnforcement,
  ResourceThreshold,
  ResourceMetrics,
  TokenUsageMetrics,
  MemoryUsageMetrics,
  CPUUsageMetrics,
  ConcurrencyMetrics,
  OperationContext,
  ResourceHealthStatus
} from './ResourceManager.js';

// Validation Framework Types
export type {
  ValidationSchema,
  ValidationRule,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationMetadata,
  QualityGate,
  QualityGateResult,
  QualityGateStatus,
  ValidationPipeline,
  PipelineResult,
  ValidationMetrics,
  ValidationReport,
  TypeDefinition,
  InterfaceDefinition
} from './ValidationFramework.js';

// Context Manager Types
export type {
  SuperClaudeContext,
  ContextSnapshot,
  ContextMergeResult,
  ContextOptimization,
  ContextMetrics,
  ContextQuery,
  ContextValidation,
  MergeStrategy,
  ContextConfig,
  ContextStorage
} from './ContextManager.js';

// Hook Coordinator Types
export type {
  HookDefinition,
  HookContext,
  HookResult,
  HookChainResult,
  HookMetrics,
  HookPerformanceMetrics,
  OptimizationResult,
  BridgeOperation,
  BridgeResult,
  BridgeServiceStatus,
  HookType,
  HookHandler
} from './HookCoordinator.js';

// LSP Coordinator Types
export type {
  LSPConnection,
  LSPCapabilities,
  LSPRequest,
  LSPResult,
  LSPBatchResult,
  LSPConnectionPool,
  LSPMetrics,
  LSPServerStatus,
  DocumentChange,
  LanguageMetrics
} from './LSPCoordinator.js';

/**
 * Shared Services Factory
 * Creates and configures all core services with optimal defaults
 */
export class SharedServicesFactory {
  static createServiceRegistry(): ServiceRegistry {
    return new ServiceRegistry();
  }

  static createCacheManager(config?: Partial<import('./CacheManager.js').CacheConfig>): import('./CacheManager.js').CacheManager {
    const defaultConfig: import('./CacheManager.js').CacheConfig = {
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      defaultTTL: 3600000, // 1 hour
      maxEntries: 10000,
      evictionPolicy: 'LRU',
      enableCompression: true,
      enableSemanticCache: true,
      enableLSPCache: true,
      compressionThreshold: 1024, // 1KB
      semanticCache: {
        maxEntries: 1000,
        defaultTTL: 3600000,
        invalidationPatterns: ['*.ts', '*.js', '*.py']
      },
      lspCache: {
        maxEntries: 5000,
        defaultTTL: 1800000, // 30 minutes
        enableSymbolCache: true,
        enableTypeCache: true
      }
    };

    const { CacheManager } = require('./CacheManager.js');
    return new CacheManager({ ...defaultConfig, ...config });
  }

  static createResourceManager(): import('./ResourceManager.js').ResourceManager {
    const { ResourceManager } = require('./ResourceManager.js');
    return new ResourceManager();
  }

  static createValidationFramework(): import('./ValidationFramework.js').ValidationFramework {
    const { ValidationFramework } = require('./ValidationFramework.js');
    return new ValidationFramework();
  }

  static createPerformanceMonitor(config?: Partial<import('../communication/PerformanceMonitor.js').PerformanceThresholds>): import('../communication/PerformanceMonitor.js').PerformanceMonitor {
    const { PerformanceMonitor } = require('../communication/PerformanceMonitor.js');
    return new PerformanceMonitor(config);
  }

  static createContextManager(config?: Partial<import('./ContextManager.js').ContextConfig>): import('./ContextManager.js').ContextManager {
    const { ContextManager } = require('./ContextManager.js');
    return new ContextManager(undefined, config);
  }

  static createHookCoordinator(config?: any): import('./HookCoordinator.js').HookCoordinator {
    const { HookCoordinator } = require('./HookCoordinator.js');
    return new HookCoordinator(config);
  }

  static createLSPCoordinator(config?: any): import('./LSPCoordinator.js').LSPCoordinator {
    const { LSPCoordinator } = require('./LSPCoordinator.js');
    return new LSPCoordinator(config);
  }

  /**
   * Creates a complete shared services suite with all components configured
   */
  static async createCompleteSuite(config?: {
    cache?: Partial<import('./CacheManager.js').CacheConfig>;
    performance?: Partial<import('../communication/PerformanceMonitor.js').PerformanceThresholds>;
    context?: Partial<import('./ContextManager.js').ContextConfig>;
    hooks?: any;
    lsp?: any;
  }) {
    const serviceRegistry = this.createServiceRegistry();
    const cacheManager = this.createCacheManager(config?.cache);
    const resourceManager = this.createResourceManager();
    const validationFramework = this.createValidationFramework();
    const performanceMonitor = this.createPerformanceMonitor(config?.performance);
    const contextManager = this.createContextManager(config?.context);
    const hookCoordinator = this.createHookCoordinator(config?.hooks);
    const lspCoordinator = this.createLSPCoordinator(config?.lsp);

    // Register core services with the registry
    await serviceRegistry.registerService({
      name: 'cache-manager',
      type: 'shared-service',
      version: '1.0.0',
      config: config?.cache || {},
      capabilities: ['caching', 'memory-management', 'semantic-cache', 'lsp-cache'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const metrics = await cacheManager.getMetrics();
          return metrics.hitRate > 0; // Basic health check
        }
      }
    });

    await serviceRegistry.registerService({
      name: 'resource-manager',
      type: 'shared-service',
      version: '1.0.0',
      config: {},
      capabilities: ['token-allocation', 'memory-allocation', 'concurrency-control', 'resource-optimization'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const health = await resourceManager.checkResourceHealth();
          return health.overall !== 'critical';
        }
      }
    });

    await serviceRegistry.registerService({
      name: 'validation-framework',
      type: 'shared-service',
      version: '1.0.0',
      config: {},
      capabilities: ['schema-validation', 'type-checking', 'quality-gates', 'validation-pipelines'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const metrics = await validationFramework.getValidationMetrics();
          return metrics.successRate > 50; // Basic health check
        }
      }
    });

    await serviceRegistry.registerService({
      name: 'performance-monitor',
      type: 'shared-service',
      version: '1.0.0',
      config: config?.performance || {},
      capabilities: ['metrics-collection', 'performance-budgets', 'alerting', 'optimization-suggestions'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const report = performanceMonitor.generatePerformanceReport();
          return report.summary.overallHealth !== 'poor';
        }
      }
    });

    await serviceRegistry.registerService({
      name: 'context-manager',
      type: 'shared-service',
      version: '1.0.0',
      config: config?.context || {},
      capabilities: ['context-preservation', 'context-optimization', 'context-merging', 'superclaude-integration'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const metrics = await contextManager.getContextMetrics();
          return metrics.preservationRate > 90;
        }
      }
    });

    await serviceRegistry.registerService({
      name: 'hook-coordinator',
      type: 'shared-service',
      version: '1.0.0',
      config: config?.hooks || {},
      capabilities: ['hook-management', 'performance-optimization', 'bridge-coordination', 'superclaude-hooks'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const bridgeStatus = await hookCoordinator.getBridgeServiceStatus();
          return bridgeStatus.healthy;
        }
      }
    });

    await serviceRegistry.registerService({
      name: 'lsp-coordinator',
      type: 'shared-service',
      version: '1.0.0',
      config: config?.lsp || {},
      capabilities: ['lsp-management', 'connection-pooling', 'request-batching', 'semantic-caching'],
      healthCheck: {
        interval: 30000,
        customChecker: async () => {
          const metrics = await lspCoordinator.getLSPMetrics();
          return metrics.successRate > 90;
        }
      }
    });

    return {
      serviceRegistry,
      cacheManager,
      resourceManager,
      validationFramework,
      performanceMonitor,
      contextManager,
      hookCoordinator,
      lspCoordinator,
      
      // Convenience method to shutdown all services
      async shutdown() {
        await Promise.all([
          serviceRegistry.shutdown(),
          cacheManager.shutdown(),
          resourceManager.shutdown(),
          validationFramework.shutdown(),
          performanceMonitor.destroy(),
          contextManager.shutdown(),
          hookCoordinator.shutdown(),
          lspCoordinator.shutdown()
        ]);
      }
    };
  }
}

/**
 * Service Health Checker
 * Utility for monitoring health of all shared services
 */
export class SharedServicesHealthChecker {
  constructor(private services: Awaited<ReturnType<typeof SharedServicesFactory.createCompleteSuite>>) {}

  async checkOverallHealth() {
    const registryHealth = await this.services.serviceRegistry.healthCheck();
    const cacheMetrics = await this.services.cacheManager.getMetrics();
    const resourceHealth = await this.services.resourceManager.checkResourceHealth();
    const validationMetrics = await this.services.validationFramework.getValidationMetrics();
    const performanceReport = this.services.performanceMonitor.generatePerformanceReport();

    return {
      overall: registryHealth.overall && 
               cacheMetrics.hitRate > 0 && 
               resourceHealth.overall !== 'critical' &&
               validationMetrics.successRate > 50 &&
               performanceReport.summary.overallHealth !== 'poor',
      details: {
        serviceRegistry: registryHealth.overall,
        cacheManager: cacheMetrics.hitRate > 0,
        resourceManager: resourceHealth.overall !== 'critical',
        validationFramework: validationMetrics.successRate > 50,
        performanceMonitor: performanceReport.summary.overallHealth !== 'poor'
      },
      metrics: {
        cacheHitRate: cacheMetrics.hitRate,
        resourceHealthScore: resourceHealth.overall === 'healthy' ? 100 : 
                            resourceHealth.overall === 'warning' ? 70 : 30,
        validationSuccessRate: validationMetrics.successRate,
        performanceScore: performanceReport.summary.score
      }
    };
  }

  async generateHealthReport() {
    const health = await this.checkOverallHealth();
    const timestamp = new Date();

    return {
      timestamp,
      overall: health.overall ? 'healthy' : 'degraded',
      summary: `Shared Services Health Report - ${health.overall ? 'All Systems Operational' : 'Issues Detected'}`,
      details: health.details,
      metrics: health.metrics,
      recommendations: this.generateRecommendations(health)
    };
  }

  private generateRecommendations(health: any): string[] {
    const recommendations: string[] = [];

    if (!health.details.cacheManager) {
      recommendations.push('Cache hit rate is low - consider warming cache or adjusting TTL settings');
    }

    if (!health.details.resourceManager) {
      recommendations.push('Resource usage is critical - review allocations and optimize usage patterns');
    }

    if (!health.details.validationFramework) {
      recommendations.push('Validation success rate is low - review validation rules and data quality');
    }

    if (!health.details.performanceMonitor) {
      recommendations.push('Performance is degraded - investigate bottlenecks and optimize operations');
    }

    return recommendations;
  }
}

// Default export for convenience
export default SharedServicesFactory;