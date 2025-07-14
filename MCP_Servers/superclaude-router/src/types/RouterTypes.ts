export interface RouterServerConfig {
  serverName: string;
  capabilities: string[];
  
  routing: {
    enableIntelligentRouting: boolean;
    enableLoadBalancing: boolean;
    enableCircuitBreaking: boolean;
    routingTableCacheTTL: number;
    maxConcurrentRoutes: number;
  };
  
  bridgeService: {
    port: number;
    enableHooksCoordination: boolean;
    maxConnections: number;
    keepAliveTimeout: number;
  };
  
  performance: {
    maxRoutingTime: number;
    circuitBreakerThreshold: number;
    cacheConfig: {
      routingCache: { ttl: number; maxSize: number };
      commandCache: { ttl: number; maxSize: number };
    };
  };
  
  security?: {
    authenticationMethod: string;
    enableInputValidation: boolean;
    enableAuditLogging: boolean;
  };
  
  monitoring?: {
    enableMetrics: boolean;
    metricsInterval: number;
    enableHealthChecks: boolean;
  };
}

export interface ParsedCommand {
  command: string;
  arguments: string[];
  flags: string[];
  target?: string;
  scope?: string;
  rawInput: string;
}

export interface FlagSet {
  [key: string]: string | boolean | number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface RoutingDecision {
  targetServer: string;
  confidence: number;
  routingReason: string;
  fallbackServers: string[];
  estimatedLatency: number;
}

export interface ServerMatch {
  serverName: string;
  score: number;
  reason: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  metrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface SuperClaudeContext {
  userId?: string;
  sessionId?: string;
  persona?: string;
  flags?: FlagSet;
  timestamp: Date;
  [key: string]: any;
}

export interface HookRequest {
  hookType: 'PreToolUse' | 'PostToolUse' | 'PrePrompt' | 'PostPrompt';
  tool: string;
  args: any;
  context: SuperClaudeContext;
  metadata: {
    timestamp: Date;
    correlationId: string;
    serverSource?: string;
  };
}

export interface HookResponse {
  success: boolean;
  result?: any;
  error?: string;
  optimizationApplied?: boolean;
  executionTime: number;
}

export interface HookResult {
  success: boolean;
  result?: any;
  error?: string;
  optimizationApplied?: boolean;
  executionTime: number;
}

export interface RouterMessage {
  type: 'route_request' | 'health_check' | 'circuit_breaker_update';
  target: string;
  command?: ParsedCommand;
  context?: SuperClaudeContext;
  metadata: {
    correlationId: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    routingDecision?: RoutingDecision;
  };
}

export interface ServerToRouterMessage {
  type: 'route_response' | 'health_update' | 'performance_metric';
  correlationId: string;
  result?: any;
  error?: ErrorInfo;
  metrics?: PerformanceMetrics;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

export interface RoutingRule {
  command: string;
  primary: string;
  fallback?: string[];
  personas?: string[];
  complexityThreshold?: number;
  flagsRequired?: string[];
  flagsInfluence?: string[];
}

export interface RoutingTable {
  commands: Record<string, RoutingRule>;
  externalMcp: {
    context7Patterns: string[];
    sequentialPatterns: string[];
    magicPatterns: string[];
    playwrightPatterns: string[];
  };
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export interface PerformanceReport {
  averageRoutingLatency: number;
  percentile95Latency: number;
  hookOptimizationFactor: number;
  cacheHitRates: {
    routing: number;
    command: number;
  };
  recommendations: string[];
}

export interface BenchmarkResult {
  results: {
    routingLatency: number;
    hookPerformance: number;
    throughput: number;
    cacheEfficiency: number;
  };
  passed: boolean;
  recommendations: string[];
}