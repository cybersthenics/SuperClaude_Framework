import { 
  HookRequest, 
  HookResponse, 
  HookResult, 
  PerformanceMetrics,
  RoutingDecision,
  ServerMatch,
  HealthStatus,
  RoutingRule,
  RoutingTable,
  CircuitBreakerState,
  PerformanceReport,
  ParsedCommand,
  ValidationResult,
  FlagSet,
  SuperClaudeContext
} from './RouterTypes.js';

export interface CommandParserInterface {
  parseCommand(input: string): ParsedCommand;
  validateSyntax(command: ParsedCommand): ValidationResult;
  extractFlags(command: ParsedCommand): FlagSet;
  resolvePersona(command: ParsedCommand, context: SuperClaudeContext): string;
}

export interface FlagProcessorInterface {
  extractFlags(command: ParsedCommand): FlagSet;
  validateFlags(flags: FlagSet): ValidationResult;
  resolvePrecedence(flags: FlagSet): FlagSet;
  checkConflicts(flags: FlagSet): ValidationResult;
}

export interface RoutingEngineInterface {
  determineTargetServer(command: ParsedCommand, context: SuperClaudeContext): Promise<RoutingDecision>;
  evaluateRoutingRules(command: string, flags: string[]): ServerMatch[];
  selectOptimalServer(matches: ServerMatch[], preferredServer?: string): Promise<string>;
  checkServerHealth(serverName: string): Promise<HealthStatus>;
}

export interface BridgeServiceManagerInterface {
  startBridgeService(): Promise<void>;
  stop(): Promise<void>;
  handleHookRequest(request: HookRequest): Promise<HookResponse>;
  coordinateHooks(operation: string, context: any): Promise<HookResult>;
  manageConnections(): void;
  monitorPerformance(): PerformanceMetrics;
}

export interface RoutingTableInterface {
  loadRoutingRules(): void;
  updateRoutingRules(rules: RoutingRule[]): void;
  getConfiguration(): RoutingTable;
  getAllServerNames(): string[];
  validateRules(rules: RoutingRule[]): ValidationResult;
}

export interface ServerHealthInterface {
  checkServerHealth(serverName: string): Promise<HealthStatus>;
  updateHealthStatus(serverName: string, status: HealthStatus): void;
  getHealthStatus(serverName: string): HealthStatus | null;
  isServerHealthy(serverName: string): boolean;
}

export interface CircuitBreakerInterface {
  checkServerAvailability(serverName: string): boolean;
  recordFailure(serverName: string): void;
  recordSuccess(serverName: string): void;
  enable(serverName: string, threshold: number): void;
  disable(serverName: string): void;
  getStatus(serverName: string): CircuitBreakerState;
}

export interface CacheManagerInterface {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  getStats(): CacheStats;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
}

export interface PerformanceMonitorInterface {
  recordRoutingLatency(command: string, latency: number): void;
  recordHookExecution(hookType: string, executionTime: number): void;
  getAverageLatency(): number;
  getPercentileLatency(percentile: number): number;
  generatePerformanceReport(): PerformanceReport;
  getHookMetrics(hookType: string, timeRange: string): any;
}

export interface SecurityValidatorInterface {
  validateCommand(command: string): ValidationResult;
  sanitizeInput(input: string): string;
  checkPermissions(user: string, operation: string): Promise<boolean>;
}

export interface AuditLoggerInterface {
  log(event: SecurityEvent): Promise<void>;
  query(filter: LogFilter): Promise<SecurityEvent[]>;
}

export interface SecurityEvent {
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'validation_failure' | 'suspicious_activity';
  source: string;
  details: {
    command?: string;
    user?: string;
    serverTarget?: string;
    failureReason?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface LogFilter {
  fromDate?: Date;
  toDate?: Date;
  eventType?: string;
  severity?: string;
  source?: string;
}