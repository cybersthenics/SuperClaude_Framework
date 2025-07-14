/**
 * Core type definitions for SuperClaude Orchestrator
 * Advanced Workflow Engine with Wave, Delegation, Loop, and Chain patterns
 */

// Core Configuration Types
export interface OrchestratorServerConfig {
  serverName: "superclaude-orchestrator";
  capabilities: ["tools", "resources", "prompts"];
  
  waveOrchestration: {
    enableWaveMode: boolean;
    defaultStrategy: WaveStrategy;
    maxWavesPerOperation: number;
    checkpointInterval: number; // milliseconds
    enableRollback: boolean;
  };
  
  delegation: {
    enableSubAgentDelegation: boolean;
    maxConcurrency: number;
    defaultStrategy: DelegationStrategy;
    resourceDistribution: "dynamic" | "equal" | "weighted";
    resultAggregationTimeout: number; // milliseconds
  };
  
  loopMode: {
    enableIterativeRefinement: boolean;
    maxIterations: number;
    convergenceThreshold: number;
    enableInteractiveMode: boolean;
    qualityValidationBetweenIterations: boolean;
  };
  
  chainMode: {
    enablePersonaChains: boolean;
    maxChainLength: number;
    contextPreservation: "minimal" | "essential" | "full";
    expertiseHandoffProtocol: "sequential" | "cumulative" | "selective";
  };
  
  performance: {
    coordinationOverhead: number; // milliseconds
    checkpointCreationTime: number; // milliseconds
    resultAggregationTime: number; // milliseconds
  };
}

// Wave Orchestration Types
export type WaveStrategy = 'progressive' | 'systematic' | 'adaptive' | 'enterprise';

export interface OrchestrationRequest {
  type: string;
  complexity: number;
  fileCount: number;
  domains: string[];
  operationTypes: string[];
  metadata?: Record<string, any>;
}

export interface WavePlan {
  waveId: string;
  strategy: WaveStrategy;
  phases: WavePhase[];
  totalEstimatedTime: number;
  resourceRequirements: ResourceRequirements;
  checkpoints: CheckpointDefinition[];
}

export interface WavePhase {
  phaseId: string;
  name: string;
  servers: string[];
  personas: string[];
  dependencies: string[];
  parallel: boolean;
  timeout: number;
  validationCriteria: ValidationCriteria;
}

export interface WaveResult {
  waveId: string;
  status: 'initialized' | 'running' | 'completed' | 'failed' | 'rolled_back';
  completedPhases: PhaseResult[];
  currentPhase: string | null;
  results: any[];
  performanceMetrics: WavePerformanceMetrics;
}

export interface WaveStatus {
  waveId: string;
  status: string;
  currentPhase: string | null;
  progress: number; // 0-1
  estimatedCompletion: Date;
  intermediateResults?: any[];
}

export interface PhaseResult {
  phaseId: string;
  status: 'completed' | 'failed' | 'skipped';
  output: any;
  context: ExecutionContext;
  metrics: PhaseMetrics;
  checkpoint?: CheckpointData;
}

export interface CheckpointDefinition {
  checkpointId: string;
  phaseId: string;
  description: string;
  rollbackStrategy: 'phase' | 'wave' | 'none';
}

export interface CheckpointData {
  checkpointId: string;
  timestamp: Date;
  state: any;
  context: ExecutionContext;
  validationResults: ValidationResult[];
}

export interface RollbackResult {
  success: boolean;
  rolledBackPhases: string[];
  currentPhase: string;
  preservedCheckpoints: string[];
}

// Sub-Agent Delegation Types
export type DelegationStrategy = 'files' | 'folders' | 'auto';
export type SubAgentSpecialization = 'quality' | 'security' | 'performance' | 'architecture';

export interface DelegationTask {
  type: string;
  scope: string[];
  requirements: string[];
  context: ExecutionContext;
}

export interface DelegationStrategyConfig {
  type: DelegationStrategy;
  concurrency: number;
  specialization?: SubAgentSpecialization;
  resourceAllocation: 'equal' | 'weighted' | 'dynamic';
}

export interface DelegationResult {
  delegationId: string;
  subAgentsCreated: number;
  strategy: DelegationStrategyConfig;
  estimatedCompletionTime: number;
  status: 'initialized' | 'running' | 'completed' | 'failed';
}

export interface SubAgent {
  agentId: string;
  specialization: SubAgentSpecialization;
  persona: string;
  tools: string[];
  focus: string[];
  scope: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface SubAgentTask {
  taskId: string;
  agentId: string;
  operation: string;
  scope: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SubAgentResult {
  taskId: string;
  agentId: string;
  output: any;
  metrics: SubAgentMetrics;
  status: 'completed' | 'failed' | 'timeout';
}

export interface SubAgentResults {
  delegationId: string;
  individual: SubAgentResult[];
  aggregated: any;
  status: 'completed' | 'partial' | 'failed';
  performance: DelegationPerformanceMetrics;
}

// Removed old loop types - using new loop types defined below

export interface LoopProgress {
  loopId: string;
  currentIteration: number;
  totalIterations: number;
  status: string;
  overallImprovement: number;
}

// Chain Mode Types
export interface ChainTask {
  type: string;
  target: string;
  operation: string;
  context: ExecutionContext;
}

export interface PersonaChainDefinition {
  chainId: string;
  steps: ChainStep[];
  contextPreservation: 'minimal' | 'essential' | 'full';
  handoffProtocol: 'sequential' | 'cumulative' | 'selective';
}

export interface ChainStep {
  stepId: string;
  persona: string;
  operation: string;
  inputRequirements: string[];
  outputExpectations: string[];
  dependencies: string[];
}

export interface PersonaChain {
  chainId: string;
  task: ChainTask;
  definition: PersonaChainDefinition;
  currentStep: number;
  accumulatedContext: AccumulatedContext;
  stepResults: ChainStepResult[];
  status: 'initialized' | 'running' | 'completed' | 'failed';
}

export interface ChainStepResult {
  stepId: string;
  persona: string;
  operation: string;
  output: any;
  contextUpdate: any;
  handoffData: any;
  metrics: ChainStepMetrics;
}

export interface AccumulatedContext {
  [key: string]: any;
}

export type ContextPreservationType = 'minimal' | 'essential' | 'full';
export type HandoffProtocol = 'sequential' | 'cumulative' | 'selective';

// Hybrid Orchestration Types
export interface HybridExecutionPlan {
  executionId: string;
  patterns: {
    waveOrchestration?: {
      enabled: boolean;
      strategy: WaveStrategy;
      phases: WavePhase[];
    };
    delegation?: {
      enabled: boolean;
      strategy: DelegationStrategy;
      concurrency: number;
    };
    loopMode?: {
      enabled: boolean;
      iterations: number;
      convergenceThreshold: number;
    };
    chainMode?: {
      enabled: boolean;
      steps: string[];
      handoff: HandoffProtocol;
    };
  };
  resourceAllocation: ResourceAllocationPlan;
  checkpoints: CheckpointPlan[];
}

// Resource Management Types
export interface ResourceRequirements {
  memory: number;
  cpu: number;
  concurrency: number;
  timeout: number;
  storage?: number;
}

export interface ResourceAllocation {
  allocationId: string;
  requirements: ResourceRequirements;
  allocated: ResourcePool;
  timestamp: Date;
  expiresAt: Date;
}

export interface ResourcePool {
  memory: number;
  cpu: number;
  concurrency: number;
  available: boolean;
}

export interface ResourceAllocationPlan {
  totalResources: ResourceRequirements;
  patternAllocations: Map<string, ResourceRequirements>;
  contingencyReserve: number;
}

export interface CheckpointPlan {
  phases: string[];
  frequency: number;
  retention: number;
}

// Execution Context Types
export interface ExecutionContext {
  executionId: string;
  command: string;
  flags: string[];
  scope: string[];
  metadata: Record<string, any>;
  timestamp: Date;
}

// Loop Mode Types
export type LoopMode = 'polish' | 'refine' | 'enhance' | 'converge';

export interface LoopConfiguration {
  mode: LoopMode;
  maxIterations: number;
  convergenceThreshold?: number;
  targetQuality?: number;
  enableInteractiveMode: boolean;
  qualityGates: string[];
}

export interface LoopExecution {
  loopId: string;
  configuration: LoopConfiguration;
  iterations: LoopIteration[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  convergenceMetrics: ConvergenceMetrics;
  currentIteration: number;
  context: ExecutionContext;
  initialContextSnapshot?: string;
}

export interface LoopIteration {
  iterationId: string;
  iterationNumber: number;
  startTime: Date;
  endTime?: Date;
  input: any;
  output: any;
  metrics: {
    executionTime: number;
    qualityScore: number;
    improvementScore: number;
    convergenceIndicators: Record<string, any>;
  };
  status: 'running' | 'completed' | 'failed';
  qualityGateResults: any[];
  error?: any;
}

export interface LoopResult {
  loopId: string;
  totalIterations: number;
  finalQualityScore: number;
  totalImprovementScore: number;
  convergenceAchieved: boolean;
  performance: {
    totalExecutionTime: number;
    averageIterationTime: number;
    qualityProgression: number[];
    improvementProgression: number[];
  };
  finalContext: ExecutionContext;
}

export interface ConvergenceMetrics {
  qualityProgression: number[];
  improvementRates: number[];
  stabilityIndicator: number;
  convergenceConfidence: number;
}

export interface QualityGate {
  name: string;
  type: 'threshold' | 'improvement' | 'custom';
  threshold: number;
  description: string;
}

// Chain Mode Types
export type PersonaSpecialization = 
  | 'analyzer' | 'architect' | 'frontend' | 'backend' | 'security' 
  | 'performance' | 'qa' | 'devops' | 'mentor' | 'refactorer' | 'scribe';

export type ChainStrategy = 'sequential' | 'adaptive' | 'focused' | 'comprehensive';

export interface ChainConfiguration {
  chainId?: string;
  personas: PersonaSpecialization[];
  strategy: ChainStrategy;
  handoffStrategy?: string;
  contextPreservation: 'minimal' | 'essential' | 'full';
  enableValidation: boolean;
}

export interface ChainExecution {
  chainId: string;
  configuration: ChainConfiguration;
  chainLinks: ChainLink[];
  currentLinkIndex: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  context: ExecutionContext;
  handoffHistory: ContextHandoff[];
  results: ChainLink[];
  initialContextSnapshot?: string;
}

export interface ChainLink {
  linkId: string;
  persona: PersonaSpecialization;
  order: number;
  input: any;
  output: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  metrics?: {
    executionTime: number;
    qualityScore: number;
    handoffTime: number;
  };
  contextSnapshot: string | null;
  error?: any;
}

export interface ChainResult {
  chainId: string;
  totalLinks: number;
  completedLinks: number;
  finalOutput: any;
  performance: {
    totalExecutionTime: number;
    linkExecutionTimes: number[];
    averageLinkTime: number;
    handoffOverhead: number;
  };
  handoffHistory: ContextHandoff[];
  finalContext: ExecutionContext;
}

export interface ContextHandoff {
  handoffId: string;
  fromPersona: PersonaSpecialization;
  toPersona: PersonaSpecialization;
  contextTransformation: 'sequential' | 'cumulative' | 'focused';
  preservedElements: string[];
  transformedElements: string[];
  timestamp: Date;
}

// Hybrid Orchestration Types
export interface HybridConfiguration {
  patterns: OrchestrationPattern[];
  globalContext?: Record<string, any>;
  enableSequentialExecution: boolean;
  enableResultMerging: boolean;
}

export interface OrchestrationPattern {
  type: 'wave' | 'delegation' | 'loop' | 'chain';
  config?: Record<string, any>;
  dependencies?: string[];
}

export interface HybridResult {
  hybridId: string;
  patterns: OrchestrationPattern[];
  results: any[];
  overallQuality: number;
  executionTime: number;
}

// Validation Types
export interface ValidationCriteria {
  required: string[];
  optional: string[];
  constraints: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
}

// Performance Metrics Types
export interface WavePerformanceMetrics {
  coordinationTime: number;
  totalExecutionTime: number;
  phaseTimings: Record<string, number>;
  resourceUtilization: number;
  checkpointOverhead: number;
}

export interface DelegationPerformanceMetrics {
  setupTime: number;
  executionTime: number;
  aggregationTime: number;
  efficiency: number;
  timeSavings: number;
}

export interface PhaseMetrics {
  executionTime: number;
  resourceUsage: ResourceUsage;
  validationTime: number;
  checkpointTime?: number;
}

export interface SubAgentMetrics {
  executionTime: number;
  resourceUsage: ResourceUsage;
  specializedMetrics: Record<string, any>;
}

export interface ChainStepMetrics {
  executionTime: number;
  contextHandoffTime: number;
  resourceUsage: ResourceUsage;
  personaActivationTime: number;
}

export interface QualityMetrics {
  score: number;
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  securityScore?: number;
  performanceScore?: number;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  io: number;
  network?: number;
}

// Communication Types
export interface OrchestrationMessage {
  type: 'wave_coordination' | 'delegation_request' | 'loop_iteration' | 'chain_step';
  orchestrationId: string;
  phase?: string;
  iteration?: number;
  step?: number;
  payload: any;
  metadata: {
    correlationId: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    executionPattern: string;
  };
}

export interface OrchestrationResponse {
  success: boolean;
  result: any;
  error?: string;
  metadata: {
    executionTime: number;
    resourceUsage: ResourceUsage;
    correlationId: string;
  };
}

// Concurrency Types
export interface ConcurrencyResult {
  executed: number;
  queued: number;
  averageWaitTime: number;
  throughput: number;
}

export interface ExecutionQueue {
  size: number;
  pending: PendingExecution[];
  active: ActiveExecution[];
}

export interface PendingExecution {
  executionId: string;
  priority: number;
  queuedAt: Date;
  estimatedDuration: number;
}

export interface ActiveExecution {
  executionId: string;
  startedAt: Date;
  estimatedCompletion: Date;
  resourceUsage: ResourceUsage;
}

// Optimization Types
export interface OptimizationResult {
  applied: boolean;
  strategy: string;
  improvements: string[];
  estimatedBenefit: number;
}

export interface OptimizationOpportunity {
  type: string;
  description: string;
  estimatedBenefit: number;
  cost: number;
  priority: number;
}