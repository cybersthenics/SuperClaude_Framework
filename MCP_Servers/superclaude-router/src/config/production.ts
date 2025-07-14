import { RouterServerConfig } from '../types/index.js';

export const productionConfig: RouterServerConfig = {
  serverName: "superclaude-router",
  capabilities: ["tools", "resources"],
  
  routing: {
    enableIntelligentRouting: true,
    enableLoadBalancing: true,
    enableCircuitBreaking: true,
    routingTableCacheTTL: 300,
    maxConcurrentRoutes: 100
  },
  
  bridgeService: {
    port: 8080,
    enableHooksCoordination: true,
    maxConnections: 200,
    keepAliveTimeout: 30000
  },
  
  performance: {
    maxRoutingTime: 100,
    circuitBreakerThreshold: 5,
    cacheConfig: {
      routingCache: { ttl: 300, maxSize: 2000 },
      commandCache: { ttl: 600, maxSize: 1000 }
    }
  },
  
  security: {
    authenticationMethod: "bearer",
    enableInputValidation: true,
    enableAuditLogging: true
  },
  
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60000,
    enableHealthChecks: true
  }
};

export const developmentConfig: RouterServerConfig = {
  serverName: "superclaude-router",
  capabilities: ["tools", "resources"],
  
  routing: {
    enableIntelligentRouting: true,
    enableLoadBalancing: false,
    enableCircuitBreaking: false,
    routingTableCacheTTL: 60,
    maxConcurrentRoutes: 10
  },
  
  bridgeService: {
    port: 8080,
    enableHooksCoordination: true,
    maxConnections: 50,
    keepAliveTimeout: 15000
  },
  
  performance: {
    maxRoutingTime: 200,
    circuitBreakerThreshold: 10,
    cacheConfig: {
      routingCache: { ttl: 60, maxSize: 100 },
      commandCache: { ttl: 120, maxSize: 50 }
    }
  },
  
  security: {
    authenticationMethod: "none",
    enableInputValidation: true,
    enableAuditLogging: false
  },
  
  monitoring: {
    enableMetrics: true,
    metricsInterval: 30000,
    enableHealthChecks: true
  }
};

export const testConfig: RouterServerConfig = {
  serverName: "superclaude-router-test",
  capabilities: ["tools", "resources"],
  
  routing: {
    enableIntelligentRouting: true,
    enableLoadBalancing: false,
    enableCircuitBreaking: false,
    routingTableCacheTTL: 10,
    maxConcurrentRoutes: 5
  },
  
  bridgeService: {
    port: 8081,
    enableHooksCoordination: false,
    maxConnections: 10,
    keepAliveTimeout: 5000
  },
  
  performance: {
    maxRoutingTime: 1000,
    circuitBreakerThreshold: 3,
    cacheConfig: {
      routingCache: { ttl: 10, maxSize: 10 },
      commandCache: { ttl: 20, maxSize: 10 }
    }
  },
  
  security: {
    authenticationMethod: "none",
    enableInputValidation: false,
    enableAuditLogging: false
  },
  
  monitoring: {
    enableMetrics: false,
    metricsInterval: 10000,
    enableHealthChecks: false
  }
};