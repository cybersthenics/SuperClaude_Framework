// SuperClaude Personas - Core Types and Interfaces
// Behavioral Intelligence Engine for MCP ecosystem

export interface PersonaDefinition {
  name: string;
  identity: string;
  priorityHierarchy: string[];
  coreStrategies: PersonaStrategy[];
  mcpPreferences: MCPServerPreference[];
  autoActivationTriggers: ActivationTrigger[];
  qualityStandards: QualityStandard[];
  collaborationPatterns: CollaborationPattern[];
}

export interface PersonaStrategy {
  domain: string;
  approach: string;
  decisionFramework: DecisionCriterion[];
  performanceMetrics: PerformanceTarget[];
  riskToleranceLevel: "low" | "medium" | "high";
  optimizationFocus: string[];
}

export interface MCPServerPreference {
  serverName: string;
  preference: "primary" | "secondary" | "avoided";
  useCases: string[];
  integrationPatterns: string[];
}

export interface ActivationTrigger {
  triggerType: "keyword" | "context" | "domain" | "complexity";
  patterns: string[];
  confidenceThreshold: number;
  combinationRules: TriggerCombination[];
}

export interface TriggerCombination {
  rule: string;
  personas: string[];
  conditions: string[];
  weight: number;
}

export interface CollaborationPattern {
  name: string;
  personas: string[];
  sequenceType: "parallel" | "sequential" | "hierarchical";
  handoffCriteria: HandoffCriterion[];
  contextMergeStrategy: "accumulate" | "synthesize" | "prioritize";
}

export interface HandoffCriterion {
  trigger: string;
  fromPersona: string;
  toPersona: string;
  contextRequirements: string[];
  validationRules: string[];
}

export interface QualityStandard {
  category: string;
  metric: string;
  threshold: number;
  measurement: string;
  validationMethod: string;
}

export interface DecisionCriterion {
  factor: string;
  weight: number;
  evaluationMethod: string;
  priorityLevel: number;
}

export interface PerformanceTarget {
  metric: string;
  target: number;
  unit: string;
  measurement: string;
}

// Persona State Management
export interface PersonaState {
  activePersona: string | null;
  personaStack: PersonaStackEntry[];
  collaborationContext: CollaborationContext;
  decisionHistory: PersonaDecision[];
  performanceMetrics: PersonaMetrics;
}

export interface PersonaStackEntry {
  persona: string;
  activatedAt: Date;
  context: PersonaContext;
  expertise: ExpertiseContribution[];
  handoffPreparation: HandoffPackage | null;
}

export interface PersonaContext {
  domain: string;
  complexity: number;
  userIntent: string;
  projectContext: ProjectContext;
  sessionHistory: SessionEvent[];
  qualityRequirements: QualityRequirement[];
}

export interface ProjectContext {
  projectType: string;
  framework: string;
  language: string;
  environment: string;
  phase: string;
  constraints: string[];
}

export interface SessionEvent {
  timestamp: Date;
  eventType: string;
  data: any;
  persona: string | null;
}

export interface QualityRequirement {
  category: string;
  requirement: string;
  priority: number;
  validationMethod: string;
}

export interface CollaborationContext {
  activeCollaboration: string | null;
  participants: string[];
  mode: "parallel" | "sequential" | "hierarchical";
  sharedExpertise: ExpertiseContribution[];
  conflictResolutions: ConflictResolution[];
}

export interface ExpertiseContribution {
  fromPersona: string;
  domain: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
  timestamp: Date;
}

export interface ConflictResolution {
  conflictType: string;
  participantPersonas: string[];
  resolution: string;
  reasoning: string;
  timestamp: Date;
}

export interface PersonaDecision {
  persona: string;
  decisionType: string;
  options: DecisionOption[];
  selectedOption: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export interface DecisionOption {
  id: string;
  description: string;
  pros: string[];
  cons: string[];
  riskLevel: number;
  implementationComplexity: number;
}

export interface PersonaMetrics {
  activationCount: number;
  averageActivationTime: number;
  decisionAccuracy: number;
  collaborationSuccess: number;
  performanceScore: number;
  userSatisfaction: number;
}

// Activation Engine Types
export interface RequestContext {
  content: string;
  command: string;
  arguments: string[];
  flags: string[];
  projectContext: ProjectContext;
  userHistory: UserHistory;
  systemState: SystemState;
}

export interface UserHistory {
  recentCommands: string[];
  personaPreferences: PersonaPreference[];
  successfulPatterns: string[];
  feedbackHistory: FeedbackEntry[];
}

export interface PersonaPreference {
  persona: string;
  preference: number;
  context: string;
  timestamp: Date;
}

export interface FeedbackEntry {
  persona: string;
  operation: string;
  rating: number;
  comments: string;
  timestamp: Date;
}

export interface SystemState {
  performance: PerformanceMetrics;
  resourceUsage: ResourceUsage;
  errorRate: number;
  activeConnections: number;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface ActivationAnalysis {
  primaryDomain: string;
  complexity: number;
  userIntent: string;
  collaborationOpportunities: string[];
  recommendedPersonas: string[];
  confidenceScores: PersonaScore[];
}

export interface PersonaScore {
  persona: string;
  totalScore: number;
  confidence: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  keywordScore: number;
  contextScore: number;
  historyScore: number;
  performanceScore: number;
}

// Persona Implementation Interface
export interface PersonaImplementation {
  readonly identity: string;
  readonly priorityHierarchy: string[];
  readonly coreStrategies: PersonaStrategy[];
  readonly mcpPreferences: MCPServerPreference[];
  readonly autoActivationTriggers: ActivationTrigger[];
  readonly qualityStandards: QualityStandard[];
  readonly collaborationPatterns: CollaborationPattern[];

  applyBehavior(context: PersonaContext): Promise<BehaviorResult>;
  makeDecision(options: DecisionOption[], context: PersonaContext): Promise<DecisionResult>;
  transformOperation(operation: Operation, behaviorResult: BehaviorResult): Promise<Operation>;
  generateOptimizations(operation: Operation): Promise<Optimization[]>;
  receiveExpertise(expertise: ExpertiseContribution, fromPersona: string): Promise<ExpertiseApplicationResult>;
  applyContextToPriorities(priorities: string[], context: DecisionContext): Promise<string[]>;
  validatePerformance?(metrics: any): Promise<ValidationResult>;
  validateReliability?(system: any): Promise<ValidationResult>;
  validateQuality?(metrics: any): Promise<ValidationResult>;
  assessThreat?(threat: any): Promise<any>;
  investigateIssue?(problem: any): Promise<any>;
  createLearningPath?(topic: any, userLevel: any): Promise<any>;
  localizeContent?(content: any, targetLanguage: string): Promise<any>;
}

export interface BehaviorResult {
  transformations: BehaviorTransformation[];
  qualityAdjustments: QualityAdjustment[];
  confidence: number;
  recommendations: string[];
  optimizations: Optimization[];
}

export interface BehaviorTransformation {
  type: string;
  description: string;
  impact: string;
  priority: number;
}

export interface QualityAdjustment {
  metric: string;
  adjustment: number;
  reasoning: string;
}

export interface Optimization {
  type: string;
  description: string;
  impact: string;
  effort: number;
  priority: number;
}

export interface DecisionResult {
  selectedOption: string;
  reasoning: string;
  confidence: number;
  alternativeRecommendations: string[];
}

export interface Operation {
  type: string;
  description: string;
  parameters: any;
  context: any;
  requirements: string[];
}

export interface ExpertiseApplicationResult {
  applied: boolean;
  modifications: string[];
  reasoning: string;
  confidence: number;
}

export interface DecisionContext {
  situation: string;
  constraints: string[];
  objectives: string[];
  stakeholders: string[];
  timeline: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  location: string;
  suggestion: string;
}

// Chain Mode Types
export interface ChainStep {
  stepNumber: number;
  persona: string;
  operation: Operation;
  expectedOutcome: string;
  handoffCriteria: HandoffCriterion[];
}

export interface ChainContext {
  chainId: string;
  totalSteps: number;
  currentStep: number;
  accumulatedContext: any;
  preservedInsights: Insight[];
}

export interface ChainStepResult {
  stepNumber: number;
  persona: string;
  result: any;
  insights: Insight[];
  handoffPackage: HandoffPackage;
  nextStepRecommendations: string[];
}

export interface Insight {
  persona: string;
  type: string;
  content: string;
  confidence: number;
  applicability: string[];
}

export interface HandoffPackage {
  fromPersona: string;
  toPersona: string;
  context: any;
  insights: Insight[];
  recommendations: string[];
  priorities: string[];
  state: any;
}

// Tool Result Types
export interface ActivationResult {
  success: boolean;
  persona: string;
  behaviorTransformations: BehaviorTransformation[];
  mcpPreferences: MCPServerPreference[];
  qualityStandards: QualityStandard[];
  metadata: {
    activationTime: number;
    confidenceScore: number;
  };
}

export interface RecommendationResult {
  recommendations: PersonaRecommendation[];
  analysis: {
    detectedDomain: string;
    complexityLevel: number;
    suggestedCollaboration: string[];
  };
}

export interface PersonaRecommendation {
  persona: string;
  confidence: number;
  reasoning: string;
  expectedBehaviors: string[];
  breakdown?: ScoreBreakdown;
}

export interface CoordinationResult {
  mode: string;
  results: any[];
  expertiseSharing: ExpertiseSharingLog[];
  conflictResolutions: ConflictResolution[];
  synthesis: any;
  metadata: {
    executionTime: number;
    conflictCount: number;
  };
}

export interface ExpertiseSharingLog {
  from: string;
  to: string;
  expertise: ExpertiseContribution;
  timestamp: Date;
  success: boolean;
}

export interface PriorityResult {
  persona: string;
  priorities: string[];
  reasoning?: string;
  comparison?: PersonaPriorityComparison;
  metadata: {
    contextApplied: boolean;
    priorityCount: number;
  };
}

export interface PersonaPriorityComparison {
  comparedPersonas: string[];
  differences: PriorityDifference[];
  similarities: string[];
}

export interface PriorityDifference {
  priority: string;
  persona1Rank: number;
  persona2Rank: number;
  significance: number;
}

// Error Types
export interface PersonaError extends Error {
  code: string;
  persona?: string;
  context?: any;
  timestamp: Date;
}

export interface ActivationError extends PersonaError {
  activationAttempt: any;
}

export interface CollaborationError extends PersonaError {
  participants: string[];
  conflictDetails: any;
}

// Configuration Types
export interface PersonasServerConfig {
  serverName: string;
  capabilities: string[];
  personas: {
    enableAutoActivation: boolean;
    enableMultiPersonaMode: boolean;
    enableChainMode: boolean;
    maxConcurrentPersonas: number;
    contextPreservationThreshold: number;
  };
  collaboration: {
    enableExpertiseSharing: boolean;
    enablePriorityResolution: boolean;
    conflictResolutionStrategy: string;
    handoffProtocol: string;
  };
  performance: {
    maxActivationTime: number;
    cachePersonaDecisions: boolean;
    cacheTTL: number;
    enableBatchActivation: boolean;
  };
  integration: {
    enableHookEnrichment: boolean;
    enableOrchestratorChains: boolean;
    enableRouterFeedback: boolean;
    enableQualityValidation: boolean;
  };
}

// Utility Types
export type PersonaName = 
  | "architect" 
  | "frontend" 
  | "backend" 
  | "security" 
  | "performance" 
  | "analyzer" 
  | "qa" 
  | "refactorer" 
  | "devops" 
  | "mentor" 
  | "scribe";

export const PERSONA_NAMES: PersonaName[] = [
  "architect", "frontend", "backend", "security", "performance",
  "analyzer", "qa", "refactorer", "devops", "mentor", "scribe"
];

export interface PersonaActivationDecision {
  persona: PersonaName;
  confidence: number;
  reasoning: string;
  autoActivated: boolean;
  overrideFlags: string[];
}

export interface PersonaCoordinationMode {
  mode: "single" | "parallel" | "sequential" | "hierarchical";
  participants: PersonaName[];
  strategy: string;
  expectedOutcome: string;
}