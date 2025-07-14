/**
 * SuperClaude Quality - Core Types and Interfaces
 * 11-step quality validation pipeline with semantic checks
 */

export type ValidationStatus = 'passed' | 'failed' | 'warning' | 'skipped';
export type QualityGateType = 'syntax' | 'semantic' | 'type' | 'import' | 'lint' | 'security' | 'test' | 'semanticCoverage' | 'performance' | 'documentation' | 'integration';
export type QualityCategory = 'syntax' | 'semantic' | 'security' | 'performance' | 'test' | 'documentation' | 'style' | 'maintainability';
export type ValidationScope = 'file' | 'module' | 'project' | 'codebase';

export interface QualityValidationContext {
  target: ValidationTarget;
  scope: ValidationScopeConfig;
  gates: QualityGate[];
  requirements: QualityRequirements;
  constraints: ValidationConstraints;
  hookContext?: HookContext;
}

export interface ValidationTarget {
  type: 'file' | 'directory' | 'project' | 'codebase';
  uri: string;
  language?: string;
  framework?: string;
  files: string[];
  excludePatterns: string[];
}

export interface ValidationScopeConfig {
  depth: ValidationScope;
  includeExternal?: boolean;
  crossFileAnalysis?: boolean;
}

export interface QualityGate {
  name: string;
  type: QualityGateType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  validator: QualityValidator;
  timeout: number;
  dependencies: string[];
  configuration: GateConfiguration;
  enabled: boolean;
}

export interface GateConfiguration {
  [key: string]: any;
}

export interface QualityRequirements {
  securityFrameworks?: string[];
  minSeverity?: string;
  compliance?: boolean;
  semanticChecks?: string[];
  coverageThreshold?: number;
  performanceThresholds?: PerformanceThresholds;
}

export interface PerformanceThresholds {
  executionTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface ValidationConstraints {
  timeout: number;
  maxFileSize?: number;
  maxFiles?: number;
  resourceLimits?: ResourceLimits;
}

export interface ResourceLimits {
  memory: number;
  cpu: number;
  disk: number;
}

export interface HookContext {
  hookType: 'pre' | 'post' | 'stop';
  operation: string;
  files: string[];
  metadata: Record<string, any>;
}

export interface QualityValidator {
  validate(context: QualityValidationContext): Promise<ValidationResult>;
  getName(): string;
  getType(): QualityGateType;
  isEnabled(): boolean;
}

export interface ValidationResult {
  status: ValidationStatus;
  valid: boolean;
  score: number;
  issues: QualityIssue[];
  metadata: ValidationMetadata;
  processingTime: number;
}

export interface QualityValidationResult {
  overallResult: ValidationStatus;
  gateResults: GateResult[];
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  performance: ValidationPerformance;
}

export interface GateResult {
  gate: string;
  type: QualityGateType;
  status: ValidationStatus;
  score: number;
  issues: QualityIssue[];
  processingTime: number;
  metadata: ValidationMetadata;
}

export interface QualityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: QualityCategory;
  message: string;
  location: Location;
  suggestion: string;
  autoFixable: boolean;
  ruleId: string;
  file?: string;
}

export interface Location {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface QualityRecommendation {
  type: 'fix' | 'improvement' | 'optimization' | 'security' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  actionable: boolean;
  estimatedEffort: 'low' | 'medium' | 'high';
  categories: QualityCategory[];
}

export interface QualityMetrics {
  syntaxScore: number;
  semanticScore: number;
  typeScore: number;
  securityScore: number;
  performanceScore: number;
  testCoverage: number;
  documentationScore: number;
  overallScore: number;
  trend: QualityTrend;
}

export interface QualityTrend {
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  historicalAverage: number;
}

export interface ValidationMetadata {
  filesAnalyzed: number;
  linesAnalyzed?: number;
  symbolsAnalyzed?: number;
  rulesApplied?: number;
  gateDuration: number;
  cacheHit?: boolean;
  languageSupport?: Record<string, boolean>;
  error?: string;
}

export interface ValidationPerformance {
  totalTime: number;
  gateExecutionTimes: Record<string, number>;
  parallelExecutionTime?: number;
  cacheHitRate: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  diskIO: number;
  networkIO?: number;
}

// Semantic Validation Types
export interface SemanticValidationResult extends ValidationResult {
  typeConsistency: TypeConsistencyResult;
  symbolUsage: SymbolUsageResult;
  references: ReferenceValidationResult;
  apiContracts: ApiValidationResult;
  unusedSymbols: UnusedSymbol[];
}

export interface TypeConsistencyResult {
  valid: boolean;
  issues: TypeIssue[];
  score: number;
}

export interface TypeIssue {
  type: 'type_mismatch' | 'missing_type' | 'invalid_type';
  message: string;
  location: Location;
  expected?: string;
  actual?: string;
}

export interface SymbolUsageResult {
  totalSymbols: number;
  usedSymbols: number;
  unusedSymbols: number;
  score: number;
}

export interface ReferenceValidationResult {
  valid: boolean;
  brokenReferences: BrokenReference[];
  circularDependencies: CircularDependency[];
}

export interface BrokenReference {
  symbol: string;
  location: Location;
  targetFile: string;
  issue: string;
}

export interface CircularDependency {
  files: string[];
  symbols: string[];
  severity: 'warning' | 'error';
}

export interface ApiValidationResult {
  valid: boolean;
  contracts: ApiContract[];
  breakingChanges: BreakingChange[];
}

export interface ApiContract {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type';
  signature: string;
  location: Location;
  valid: boolean;
}

export interface BreakingChange {
  type: 'signature_change' | 'removed_member' | 'type_change';
  description: string;
  location: Location;
  severity: 'major' | 'minor' | 'patch';
}

export interface UnusedSymbol {
  name: string;
  type: 'function' | 'variable' | 'class' | 'interface' | 'import';
  location: Location;
  exported: boolean;
}

// Security Validation Types
export interface SecurityValidationResult extends ValidationResult {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  complianceStatus: ComplianceStatus;
  recommendations: SecurityRecommendation[];
}

export interface Vulnerability {
  id: string;
  type: 'xss' | 'sql_injection' | 'csrf' | 'auth_bypass' | 'data_exposure' | 'code_injection';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: Location;
  cwe?: string;
  owasp?: string;
  remediation: string;
}

export interface ComplianceStatus {
  framework: string;
  score: number;
  compliant: boolean;
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  locations: Location[];
}

export interface SecurityRecommendation extends QualityRecommendation {
  securityImpact: 'critical' | 'high' | 'medium' | 'low';
  compliance: string[];
}

// Performance Validation Types
export interface PerformanceValidationResult extends ValidationResult {
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
  benchmarks: BenchmarkResult[];
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput?: number;
  latency?: number;
}

export interface PerformanceIssue extends QualityIssue {
  type: 'slow_function' | 'memory_leak' | 'cpu_intensive' | 'inefficient_algorithm';
  impact: string;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  averageTime: number;
  medianTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
}

// Test Validation Types
export interface TestValidationResult extends ValidationResult {
  testResults: TestResult[];
  coverage: CoverageResult;
  summary: TestSummary;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  location: Location;
}

export interface CoverageResult {
  percentage: number;
  lines: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
  statements: CoverageData;
}

export interface CoverageData {
  total: number;
  covered: number;
  percentage: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

// Tool Input Types
export interface ExecuteQualityGatesArgs {
  target: {
    type: 'file' | 'directory' | 'project';
    path: string;
    excludePatterns?: string[];
  };
  gates?: QualityGateType[];
  options?: {
    parallelExecution?: boolean;
    earlyTermination?: boolean;
    generateReport?: boolean;
    includeRecommendations?: boolean;
  };
}

export interface ValidateSemanticArgs {
  target: {
    files: string[];
    language?: string;
  };
  checks?: string[];
  options?: {
    includeUnused?: boolean;
    validateContracts?: boolean;
    checkCrossFile?: boolean;
  };
}

export interface ScanSecurityArgs {
  target: {
    path: string;
    type: 'file' | 'directory' | 'project';
    includeDependencies?: boolean;
  };
  frameworks?: string[];
  severity?: string;
  options?: {
    includeCompliance?: boolean;
    scanDependencies?: boolean;
    generateReport?: boolean;
  };
}

// Configuration Types
export interface QualityServerConfig {
  serverName: 'superclaude-quality';
  capabilities: ['tools', 'resources', 'prompts'];
  validationPipeline: {
    enableFullPipeline: boolean;
    enableParallelValidation: boolean;
    enableProgressiveValidation: boolean;
    maxValidationTime: number;
    enableEarlyTermination: boolean;
  };
  qualityGates: Record<QualityGateType, QualityGateConfig>;
  hookIntegration: {
    enablePreToolUseValidation: boolean;
    enablePostToolUseValidation: boolean;
    enableStopHookReporting: boolean;
    enableRealTimeMonitoring: boolean;
  };
  securityScanning: {
    enableOWASPValidation: boolean;
    enableVulnerabilityScanning: boolean;
    enableComplianceChecking: boolean;
    enableDependencyScanning: boolean;
    securityThreshold: string;
  };
  performance: {
    enableCaching: boolean;
    cacheTTL: number;
    enableBatchValidation: boolean;
    maxConcurrentValidations: number;
    enableProgressiveResults: boolean;
  };
}

export interface QualityGateConfig {
  enabled: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
}