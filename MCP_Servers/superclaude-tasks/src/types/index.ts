// SuperClaude Tasks Server - Comprehensive Type System
// Work Management Engine with Semantic Persistence

import { z } from 'zod';

// ================================
// Core Task Types
// ================================

export type TaskType = 'feature' | 'bug' | 'improvement' | 'research' | 'documentation' | 'maintenance' | 'test';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled' | 'decomposed';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very_complex';

export interface EffortEstimate {
  hours: number;
  complexity: ComplexityLevel;
  confidence: number; // 0-1 scale
  factors: string[];
}

export interface EffortActual {
  hours: number;
  startTime: Date;
  endTime: Date;
  timeLog: TimeLogEntry[];
  efficiency: number; // actual vs estimated
}

export interface TimeLogEntry {
  startTime: Date;
  endTime: Date;
  description: string;
  assignedTo?: string;
}

export interface TaskDependency {
  dependentTaskId: string;
  dependencyTaskId: string;
  type: DependencyType;
  constraint: DependencyConstraint;
  metadata: DependencyMetadata;
}

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
export type DependencyConstraint = 'hard' | 'soft' | 'preferred';

export interface DependencyMetadata {
  createdAt: Date;
  createdBy: string;
  reason?: string;
  estimatedDelay?: number;
}

// ================================
// Task Management System
// ================================

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  complexity: ComplexityLevel;
  estimatedEffort: EffortEstimate;
  actualEffort?: EffortActual;
  parentId?: string;
  childrenIds: string[];
  dependencies: TaskDependency[];
  assignedTo?: AgentId;
  progress: number; // 0-100
  metadata: TaskMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskMetadata {
  projectId: string;
  sessionId: string;
  createdBy: string;
  tags: string[];
  semanticContext?: SemanticTaskContext;
  performanceMetrics?: TaskPerformanceMetrics;
  qualityMetrics?: TaskQualityMetrics;
  customFields?: Record<string, unknown>;
}

export interface SemanticTaskContext {
  relatedSymbols: SymbolReference[];
  affectedFiles: string[];
  semanticDependencies: SemanticDependency[];
  analysisState?: AnalysisState;
  contextSnapshot?: ContextSnapshot;
}

export interface SymbolReference {
  name: string;
  type: string;
  location: string;
  references: string[];
}

export interface SemanticDependency {
  type: 'imports' | 'extends' | 'implements' | 'calls' | 'references';
  source: string;
  target: string;
  strength: number; // 0-1 scale
}

export interface AnalysisState {
  completedSteps: string[];
  currentStep: string;
  nextSteps: string[];
  findings: Record<string, unknown>;
}

export interface ContextSnapshot {
  timestamp: Date;
  context: Record<string, unknown>;
  version: string;
  size: number;
}

// ================================
// Performance & Quality Metrics
// ================================

export interface TaskPerformanceMetrics {
  estimationAccuracy: number;
  completionTime: number;
  resourceUtilization: number;
  blockerCount: number;
  reworkCount: number;
}

export interface TaskQualityMetrics {
  testCoverage?: number;
  codeQuality?: number;
  documentationScore?: number;
  reviewScore?: number;
  defectCount?: number;
}

// ================================
// Project Memory System
// ================================

export interface ProjectMemoryState {
  projectId: string;
  lastUpdated: Date;
  version: string;
  semanticCache: SemanticCache;
  symbolIndex: SymbolIndex;
  analysisHistory: AnalysisRecord[];
  taskHistory: TaskRecord[];
  performanceBaseline: PerformanceBaseline;
  contextSnapshots: ContextSnapshot[];
}

export interface SemanticCache {
  symbols: Map<string, SymbolInfo>;
  dependencies: Map<string, DependencyInfo>;
  patterns: Map<string, PatternInfo>;
  lastUpdated: Date;
}

export interface SymbolInfo {
  name: string;
  type: string;
  location: string;
  references: string[];
  lastModified: Date;
  usageCount: number;
}

export interface DependencyInfo {
  source: string;
  target: string;
  type: string;
  strength: number;
  lastUpdated: Date;
}

export interface PatternInfo {
  name: string;
  description: string;
  occurrences: string[];
  confidence: number;
  lastDetected: Date;
}

export interface SymbolIndex {
  files: Map<string, FileInfo>;
  symbols: Map<string, SymbolInfo>;
  lastUpdated: Date;
  version: string;
}

export interface FileInfo {
  path: string;
  lastModified: Date;
  symbols: string[];
  dependencies: string[];
  size: number;
}

export interface AnalysisRecord {
  id: string;
  type: string;
  timestamp: Date;
  findings: Record<string, unknown>;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface TaskRecord {
  taskId: string;
  action: string;
  timestamp: Date;
  details: Record<string, unknown>;
  userId?: string;
}

export interface PerformanceBaseline {
  averageTaskTime: number;
  estimationAccuracy: number;
  resourceUtilization: number;
  throughput: number;
  lastUpdated: Date;
}

// ================================
// Sub-Agent Coordination
// ================================

export type AgentId = string;
export type SubAgentTaskStatus = 'assigned' | 'in_progress' | 'completed' | 'failed' | 'timeout';

export interface SubAgentTask {
  taskId: string;
  agentId: AgentId;
  assignedAt: Date;
  status: SubAgentTaskStatus;
  progress: number;
  results?: TaskResult;
  errors?: TaskError[];
  metrics: SubAgentMetrics;
  timeout?: Date;
}

export interface TaskResult {
  success: boolean;
  data?: Record<string, unknown>;
  findings?: Record<string, unknown>;
  recommendations?: string[];
  quality: number; // 0-1 scale
  processingTime: number;
}

export interface TaskError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface SubAgentMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  successRate: number;
  averageQuality: number;
}

export interface AgentCapabilities {
  agentId: AgentId;
  specializations: string[];
  maxConcurrency: number;
  averageResponseTime: number;
  successRate: number;
  qualityScore: number;
  availability: boolean;
}

// ================================
// Task Estimation System
// ================================

export interface TaskEstimation {
  effort: EffortEstimate;
  confidence: number;
  factors: EstimationFactor[];
  historicalBasis: HistoricalData[];
  complexityAnalysis: ComplexityAnalysis;
  riskAssessment: RiskAssessment;
}

export interface EstimationFactor {
  name: string;
  impact: number; // multiplier
  confidence: number;
  description: string;
}

export interface HistoricalData {
  taskId: string;
  similarityScore: number;
  actualEffort: number;
  estimatedEffort: number;
  accuracy: number;
  context: Record<string, unknown>;
}

export interface ComplexityAnalysis {
  overall: ComplexityLevel;
  technical: number;
  business: number;
  integration: number;
  testing: number;
  factors: string[];
}

export interface RiskAssessment {
  overall: number; // 0-1 scale
  technical: number;
  resource: number;
  timeline: number;
  dependency: number;
  risks: Risk[];
}

export interface Risk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  mitigation?: string;
  category: 'technical' | 'resource' | 'timeline' | 'dependency' | 'business';
}

// ================================
// Task Decomposition
// ================================

export interface TaskDecompositionStrategy {
  type: 'functional' | 'temporal' | 'complexity' | 'dependency' | 'hybrid';
  maxDepth: number;
  minTaskSize: EffortEstimate;
  decompositionRules: DecompositionRule[];
}

export interface DecompositionRule {
  condition: string;
  action: string;
  priority: number;
  metadata: Record<string, unknown>;
}

export interface DecompositionApproach {
  strategy: string;
  steps: DecompositionStep[];
  estimatedSubtasks: number;
  complexity: ComplexityLevel;
}

export interface DecompositionStep {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  estimatedEffort: number;
}

// ================================
// Task Execution & Workflow
// ================================

export interface TaskExecutionPlan {
  taskId: string;
  executionOrder: string[];
  parallelGroups: string[][];
  criticalPath: string[];
  estimatedDuration: number;
  resourceRequirements: ResourceRequirement[];
}

export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'storage' | 'network' | 'agent';
  amount: number;
  unit: string;
  priority: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  strategy: WorkflowStrategy;
  status: WorkflowStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStrategy {
  type: 'sequential' | 'parallel' | 'hybrid';
  maxConcurrency: number;
  failureStrategy: 'stop' | 'continue' | 'retry';
  retryCount: number;
}

export type WorkflowStatus = 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

// ================================
// Progress Tracking
// ================================

export interface ProgressTracker {
  taskId: string;
  overallProgress: number;
  phaseProgress: PhaseProgress[];
  milestones: Milestone[];
  timeTracking: TimeTracking;
  blockers: Blocker[];
}

export interface PhaseProgress {
  phase: string;
  progress: number;
  startTime: Date;
  estimatedEndTime: Date;
  actualEndTime?: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'pending' | 'completed' | 'missed';
  criticalPath: boolean;
}

export interface TimeTracking {
  totalTime: number;
  activeTime: number;
  idleTime: number;
  sessions: TimeSession[];
}

export interface TimeSession {
  startTime: Date;
  endTime: Date;
  duration: number;
  activity: string;
  productivity: number;
}

export interface Blocker {
  id: string;
  description: string;
  type: 'technical' | 'resource' | 'dependency' | 'approval';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolvedAt?: Date;
  impact: number;
}

// ================================
// Distribution & Coordination
// ================================

export interface DistributionStrategy {
  type: 'files' | 'folders' | 'tasks' | 'capabilities' | 'auto';
  maxConcurrency: number;
  loadBalancing: boolean;
  specialization: string[];
  timeout: number;
}

export interface DistributionPlan {
  taskId: string;
  subTasks: SubTaskDistribution[];
  estimatedCompletion: Date;
  resourceAllocation: ResourceAllocation[];
  fallbackPlan: FallbackPlan;
}

export interface SubTaskDistribution {
  subTaskId: string;
  agentId: AgentId;
  estimatedEffort: number;
  priority: number;
  dependencies: string[];
}

export interface ResourceAllocation {
  agentId: AgentId;
  allocation: number; // 0-1 scale
  capabilities: string[];
  availability: Date;
}

export interface FallbackPlan {
  triggers: string[];
  actions: FallbackAction[];
  escalation: EscalationPlan;
}

export interface FallbackAction {
  condition: string;
  action: string;
  priority: number;
  timeout: number;
}

export interface EscalationPlan {
  levels: EscalationLevel[];
  timeouts: number[];
  contacts: string[];
}

export interface EscalationLevel {
  level: number;
  description: string;
  actions: string[];
  approvers: string[];
}

// ================================
// Result Aggregation
// ================================

export interface AggregationStrategy {
  type: 'merge' | 'synthesize' | 'validate' | 'prioritize';
  conflictResolution: 'first_wins' | 'last_wins' | 'merge' | 'manual';
  qualityThreshold: number;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  condition: string;
  action: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface AggregatedResult {
  taskId: string;
  success: boolean;
  results: TaskResult[];
  synthesis: ResultSynthesis;
  qualityScore: number;
  conflictsResolved: number;
  processingTime: number;
}

export interface ResultSynthesis {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  confidence: number;
  evidence: Evidence[];
}

export interface Evidence {
  type: 'data' | 'analysis' | 'measurement' | 'observation';
  source: string;
  description: string;
  confidence: number;
  timestamp: Date;
}

// ================================
// Project Insights
// ================================

export interface ProjectInsights {
  patterns?: PatternInsights;
  performance?: PerformanceInsights;
  quality?: QualityInsights;
  complexity?: ComplexityInsights;
  trends?: TrendInsights;
}

export interface PatternInsights {
  codePatterns: CodePattern[];
  workflowPatterns: WorkflowPattern[];
  issuePatterns: IssuePattern[];
  recommendations: string[];
}

export interface CodePattern {
  name: string;
  description: string;
  occurrences: number;
  files: string[];
  complexity: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface WorkflowPattern {
  name: string;
  description: string;
  frequency: number;
  efficiency: number;
  duration: number;
  steps: string[];
}

export interface IssuePattern {
  name: string;
  description: string;
  frequency: number;
  severity: number;
  categories: string[];
  resolution: string;
}

export interface PerformanceInsights {
  throughput: ThroughputMetrics;
  efficiency: EfficiencyMetrics;
  bottlenecks: BottleneckAnalysis[];
  trends: PerformanceTrend[];
}

export interface ThroughputMetrics {
  tasksPerDay: number;
  completionRate: number;
  velocityTrend: number;
  capacity: number;
}

export interface EfficiencyMetrics {
  estimationAccuracy: number;
  reworkRate: number;
  blockerRate: number;
  resourceUtilization: number;
}

export interface BottleneckAnalysis {
  type: 'resource' | 'process' | 'dependency' | 'skill';
  location: string;
  impact: number;
  frequency: number;
  suggestions: string[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  rate: number;
  significance: number;
  timeframe: string;
}

export interface QualityInsights {
  codeQuality: QualityMetrics;
  testCoverage: CoverageMetrics;
  defectDensity: DefectMetrics;
  maintainability: MaintainabilityMetrics;
}

export interface QualityMetrics {
  overall: number;
  components: ComponentQuality[];
  trends: QualityTrend[];
  issues: QualityIssue[];
}

export interface ComponentQuality {
  name: string;
  score: number;
  metrics: Record<string, number>;
  issues: string[];
}

export interface QualityTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  rate: number;
  timeframe: string;
}

export interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  locations: string[];
  impact: number;
}

export interface CoverageMetrics {
  overall: number;
  unit: number;
  integration: number;
  e2e: number;
  uncoveredLines: number;
}

export interface DefectMetrics {
  density: number;
  severity: DefectSeverity;
  categories: DefectCategory[];
  trend: number;
}

export interface DefectSeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DefectCategory {
  name: string;
  count: number;
  percentage: number;
  trend: number;
}

export interface MaintainabilityMetrics {
  index: number;
  complexity: number;
  coupling: number;
  cohesion: number;
  documentation: number;
}

export interface ComplexityInsights {
  overall: ComplexityLevel;
  components: ComponentComplexity[];
  evolution: ComplexityEvolution[];
  hotspots: ComplexityHotspot[];
}

export interface ComponentComplexity {
  name: string;
  complexity: ComplexityLevel;
  metrics: ComplexityMetrics;
  risks: string[];
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  structural: number;
  logical: number;
}

export interface ComplexityEvolution {
  timestamp: Date;
  overall: number;
  components: Record<string, number>;
  events: ComplexityEvent[];
}

export interface ComplexityEvent {
  type: 'increase' | 'decrease' | 'refactor' | 'addition';
  component: string;
  impact: number;
  reason: string;
}

export interface ComplexityHotspot {
  location: string;
  complexity: number;
  impact: number;
  frequency: number;
  suggestions: string[];
}

export interface TrendInsights {
  productivity: ProductivityTrend[];
  quality: QualityTrend[];
  velocity: VelocityTrend[];
  predictions: TrendPrediction[];
}

export interface ProductivityTrend {
  metric: string;
  values: number[];
  timestamps: Date[];
  direction: 'up' | 'down' | 'stable';
  significance: number;
}

export interface VelocityTrend {
  period: string;
  velocity: number;
  capacity: number;
  utilization: number;
  trend: number;
}

export interface TrendPrediction {
  metric: string;
  forecast: number[];
  confidence: number;
  timeframe: string;
  factors: string[];
}

// ================================
// Validation & Error Handling
// ================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationError extends Error {
  code: string;
  details: Record<string, unknown>;
  suggestions: string[];
}

// ================================
// API Request/Response Types
// ================================

export interface CreateTaskRequest {
  title: string;
  description: string;
  type: TaskType;
  priority?: TaskPriority;
  estimatedEffort?: Partial<EffortEstimate>;
  parentId?: string;
  dependencies?: string[];
  metadata?: Partial<TaskMetadata>;
}

export interface CreateTaskResult {
  task: Task;
  estimationDetails: TaskEstimation;
  dependencyValidation: ValidationResult;
  metadata: {
    createdAt: Date;
    estimationAccuracy: number;
    suggestedDecomposition: boolean;
  };
}

export interface DecomposeTaskRequest {
  taskId: string;
  strategy: TaskDecompositionStrategy;
  options?: {
    preserveOriginalTask?: boolean;
    generateDependencies?: boolean;
    estimateSubtasks?: boolean;
  };
}

export interface DecomposeTaskResult {
  parentTask: Task;
  subtasks: Task[];
  decompositionSummary: {
    strategy: string;
    subtaskCount: number;
    totalEstimatedEffort: number;
    maxDepth: number;
    dependencies: number;
  };
  executionPlan: TaskExecutionPlan;
  metadata: {
    decomposedAt: Date;
    analysisComplexity: ComplexityLevel;
    decompositionTime: number;
  };
}

export interface DistributeToSubAgentsRequest {
  taskId: string;
  strategy: DistributionStrategy;
  options?: {
    timeout?: number;
    enableRetry?: boolean;
    qualityValidation?: boolean;
    progressReporting?: boolean;
  };
}

export interface DistributionResult {
  distributionPlan: DistributionPlan;
  subAgentTasks: SubAgentTask[];
  monitoring: {
    trackingEnabled: boolean;
    aggregationConfig: AggregationStrategy;
    timeoutAt: Date;
    qualityValidation: boolean;
  };
  metadata: {
    distributedAt: Date;
    agentsUsed: number;
    estimatedCompletion: Date;
    distributionStrategy: string;
  };
}

export interface AggregateResultsRequest {
  taskId: string;
  subAgentTaskIds: string[];
  aggregationStrategy: AggregationStrategy;
  options?: {
    validateResults?: boolean;
    generateReport?: boolean;
    updateParentTask?: boolean;
  };
}

export interface AggregationResult {
  aggregatedResult: AggregatedResult;
  summary: {
    parentTaskId: string;
    subAgentTasksProcessed: number;
    aggregationStrategy: string;
    qualityScore: number;
    conflictsResolved: number;
  };
  report?: AggregationReport;
  metadata: {
    aggregatedAt: Date;
    processingTime: number;
    resultSize: number;
  };
}

export interface AggregationReport {
  summary: string;
  details: Record<string, unknown>;
  recommendations: string[];
  quality: number;
  timestamp: Date;
}

export interface SaveProjectMemoryRequest {
  projectId: string;
  context: {
    semanticState?: Record<string, unknown>;
    analysisState?: Record<string, unknown>;
    taskContext?: Record<string, unknown>;
    performanceMetrics?: Record<string, unknown>;
  };
  options?: {
    compressionLevel?: 1 | 2 | 3;
    includeFullHistory?: boolean;
    generateSnapshot?: boolean;
  };
}

export interface SaveMemoryResult {
  success: boolean;
  projectId: string;
  version: string;
  savedSize: number;
  compressionRatio: number;
  metadata: {
    snapshotGenerated: boolean;
    compressionLevel: number;
    contextSize: number;
    processingTime: number;
  };
}

export interface LoadProjectMemoryRequest {
  projectId: string;
  version?: string;
  components?: ('semantic' | 'analysis' | 'tasks' | 'performance' | 'snapshots')[];
  options?: {
    validateIntegrity?: boolean;
    includeHistory?: boolean;
    maxAge?: number;
  };
}

export interface LoadMemoryResult {
  success: boolean;
  projectId: string;
  version?: string;
  restoredContext?: RestoredContext;
  age?: number;
  reason?: string;
  validation?: ValidationResult;
  metadata?: {
    componentsLoaded: number;
    memorySize: number;
    integrityValidated: boolean;
    processingTime: number;
  };
}

export interface RestoredContext {
  semanticState?: Record<string, unknown>;
  analysisState?: Record<string, unknown>;
  taskContext?: Record<string, unknown>;
  performanceMetrics?: Record<string, unknown>;
  snapshots?: ContextSnapshot[];
}

export interface GetProjectInsightsRequest {
  projectId: string;
  insightTypes?: ('patterns' | 'performance' | 'quality' | 'complexity' | 'trends')[];
  timeRange?: {
    start: string;
    end: string;
  };
  options?: {
    includeRecommendations?: boolean;
    aggregationLevel?: 'summary' | 'detailed' | 'comprehensive';
  };
}

export interface ProjectInsightsResult {
  projectId: string;
  insights: ProjectInsights;
  recommendations?: string[];
  summary: string;
  metadata: {
    timeRange?: { start: string; end: string };
    insightTypes: string[];
    dataPoints: number;
    generatedAt: Date;
    processingTime: number;
  };
}

// ================================
// Zod Schemas for Validation
// ================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  type: z.enum(['feature', 'bug', 'improvement', 'research', 'documentation', 'maintenance', 'test']),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled', 'decomposed']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  complexity: z.enum(['simple', 'moderate', 'complex', 'very_complex']),
  progress: z.number().min(0).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional()
});

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  type: z.enum(['feature', 'bug', 'improvement', 'research', 'documentation', 'maintenance', 'test']),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  parentId: z.string().uuid().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  metadata: z.object({
    projectId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    semanticContext: z.record(z.unknown()).optional()
  }).optional()
});

export const DecomposeTaskRequestSchema = z.object({
  taskId: z.string().uuid(),
  strategy: z.object({
    type: z.enum(['functional', 'temporal', 'complexity', 'dependency', 'hybrid']),
    maxDepth: z.number().min(1).max(5).default(3),
    minTaskSize: z.number().min(0.5).default(2)
  }),
  options: z.object({
    preserveOriginalTask: z.boolean().default(true),
    generateDependencies: z.boolean().default(true),
    estimateSubtasks: z.boolean().default(true)
  }).optional()
});

export const DistributeToSubAgentsRequestSchema = z.object({
  taskId: z.string().uuid(),
  strategy: z.object({
    type: z.enum(['files', 'folders', 'tasks', 'capabilities', 'auto']),
    maxConcurrency: z.number().min(1).max(15).default(5),
    loadBalancing: z.boolean().default(true),
    specialization: z.array(z.string()).optional()
  }),
  options: z.object({
    timeout: z.number().default(300000),
    enableRetry: z.boolean().default(true),
    qualityValidation: z.boolean().default(true),
    progressReporting: z.boolean().default(true)
  }).optional()
});

// ================================
// Export all types
// ================================

export * from './index';