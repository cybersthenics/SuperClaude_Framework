/**
 * Inter-Server Communication Types
 * Core message types and interfaces for SuperClaude MCP communication
 */

export enum MessageType {
  Command = "command",
  Event = "event", 
  Request = "request",
  Response = "response",
  Broadcast = "broadcast",
  WaveCoordination = "wave_coordination",
  PersonaChain = "persona_chain",
  QualityGate = "quality_gate",
  SubAgentDelegation = "sub_agent_delegation"
}

export enum MessagePriority {
  Critical = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Background = 4
}

export type ServerIdentifier = string;

export interface MessageHeader {
  messageId: string;
  correlationId: string;
  source: ServerIdentifier;
  target: ServerIdentifier | ServerIdentifier[];
  operation: string;
  messageType: MessageType;
  priority: MessagePriority;
  context: SuperClaudeContext;
}

export interface MessagePayload {
  data: any;
  schema?: string;
  encoding?: string;
  compression?: string;
  checksum?: string;
}

export interface RoutingHint {
  hint: string;
  value: string;
}

export interface PerformanceHint {
  hint: string;
  value: string;
}

export interface SecurityContext {
  authentication?: string;
  authorization?: string[];
  encryption?: boolean;
  signature?: string;
}

export interface MessageMetadata {
  timestamp: Date;
  ttl: number;
  retryCount: number;
  routingHints: RoutingHint[];
  performanceHints: PerformanceHint[];
  securityContext: SecurityContext;
}

export interface BaseMessage {
  header: MessageHeader;
  payload: MessagePayload;
  metadata: MessageMetadata;
}

export interface SuperClaudeContext {
  sessionId?: string;
  userId?: string;
  command?: string;
  flags?: string[];
  personas?: string[];
  complexity?: number;
  scope?: string;
  priority?: number;
}

// Wave Coordination Types
export interface WaveStrategy {
  type: "progressive" | "systematic" | "adaptive" | "enterprise";
  maxPhases: number;
  parallelExecution: boolean;
  failureHandling: "abort" | "continue" | "retry";
  validationRequired: boolean;
}

export interface WaveDependency {
  dependsOn: string;
  type: "sequential" | "resource" | "data";
  required: boolean;
}

export interface SuccessCriteria {
  metrics: string[];
  thresholds: Record<string, number>;
  validationRules: string[];
}

export interface RollbackStrategy {
  enabled: boolean;
  checkpoints: string[];
  rollbackConditions: string[];
}

export interface WavePhase {
  name: string;
  description: string;
  participants: ServerIdentifier[];
  dependencies: string[];
  timeout: number;
  successCriteria: SuccessCriteria;
  rollbackStrategy: RollbackStrategy;
}

export interface ResourceRequirements {
  cpu: number;
  memory: number;
  bandwidth: number;
  storage: number;
}

export interface QualityGate {
  id: string;
  name: string;
  criteria: Record<string, any>;
  timeout: number;
}

export interface PersonaRequirements {
  persona: string;
  capabilities: string[];
  priority: number;
}

export interface WaveContext {
  operation: string;
  scope: string;
  complexity: number;
  resources: ResourceRequirements;
  qualityGates: QualityGate[];
  personas: PersonaRequirements[];
  correlationId: string;
  waveId: string;
  strategy: WaveStrategy;
  superClaudeContext: SuperClaudeContext;
  securityContext: SecurityContext;
}

export interface WaveCoordinationPayload {
  waveId: string;
  phaseId: string;
  strategy: WaveStrategy;
  phase: WavePhase;
  participants: ServerIdentifier[];
  dependencies: WaveDependency[];
  context: WaveContext;
}

export interface WaveCoordinationMessage extends BaseMessage {
  payload: WaveCoordinationPayload;
}

// Persona Chain Types
export interface PersonaStep {
  persona: string;
  operation: string;
  input: any;
  output?: any;
  status: "pending" | "in_progress" | "completed" | "failed";
  executionTime?: number;
  confidence?: number;
}

export interface PersonaInsight {
  persona: string;
  insight: string;
  confidence: number;
  supportingEvidence: string[];
}

export interface PersonaDecision {
  persona: string;
  decision: string;
  rationale: string;
  impact: string;
}

export interface PersonaRecommendation {
  persona: string;
  recommendation: string;
  priority: number;
  reasoning: string;
}

export interface PersonaArtifact {
  persona: string;
  type: string;
  content: any;
  metadata: Record<string, any>;
}

export interface ExpertiseContribution {
  persona: string;
  domain: string;
  contribution: string;
  confidence: number;
}

export interface AccumulatedContext {
  insights: PersonaInsight[];
  decisions: PersonaDecision[];
  recommendations: PersonaRecommendation[];
  artifacts: PersonaArtifact[];
  expertise: ExpertiseContribution[];
}

export interface ChainProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: PersonaStep[];
  nextStep?: PersonaStep;
  estimatedTimeRemaining: number;
}

export interface PersonaChainPayload {
  chainId: string;
  currentPersona: string;
  nextPersona?: string;
  chain: PersonaStep[];
  accumulatedContext: AccumulatedContext;
  progressStatus: ChainProgress;
}

export interface PersonaChainMessage extends BaseMessage {
  payload: PersonaChainPayload;
}

// Quality Gate Types
export interface ValidationData {
  target: any;
  context: Record<string, any>;
  metadata: Record<string, any>;
}

export interface QualityCriteria {
  rules: Record<string, any>;
  thresholds: Record<string, number>;
  requirements: string[];
}

export interface QualityIssue {
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  recommendation: string;
}

export interface QualityRecommendation {
  action: string;
  priority: number;
  rationale: string;
  estimatedEffort: string;
}

export interface QualityMetrics {
  score: number;
  coverage: number;
  reliability: number;
  performance: number;
}

export interface EvidenceLink {
  type: string;
  reference: string;
  description: string;
}

export interface QualityGateResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  metrics: QualityMetrics;
  evidenceLinks: EvidenceLink[];
}

export interface QualityGatePayload {
  gateId: string;
  step: number;
  totalSteps: number;
  gateName: string;
  validationData: ValidationData;
  criteria: QualityCriteria;
  result?: QualityGateResult;
  nextGate?: string;
}

export interface QualityGateMessage extends BaseMessage {
  payload: QualityGatePayload;
}

// Request/Response Types
export interface WaveRequest {
  waveId: string;
  strategy: WaveStrategy;
  phases: WavePhase[];
  participants: ServerIdentifier[];
  context: WaveContext;
}

export interface PersonaChainRequest {
  chainId: string;
  personas: string[];
  operation: string;
  context: SuperClaudeContext;
}

// Result Types
export interface RoutingResult {
  success: boolean;
  targetServer?: ServerIdentifier;
  routingPath?: ServerIdentifier[];
  latency: number;
  error?: string;
}

export interface BroadcastResult {
  success: boolean;
  deliveredCount: number;
  failedTargets: ServerIdentifier[];
  averageLatency: number;
}

export interface WaveInitiationResult {
  success: boolean;
  waveId: string;
  estimatedDuration: number;
  participantCount: number;
}

export interface ChainInitiationResult {
  success: boolean;
  chainId: string;
  estimatedDuration: number;
  personaCount: number;
}

// Configuration Types
export interface InterServerCommunicationConfig {
  protocol: {
    type: "event-driven-request-response";
    transport: "WebSocket" | "HTTP/2" | "gRPC";
    serialization: "MessagePack" | "JSON" | "Protocol Buffers";
    compression: "gzip" | "lz4" | "snappy";
    enableBatching: boolean;
    batchSize: number;
    batchTimeout: number;
  };
  performance: {
    maxLatency: number;
    throughputTarget: number;
    deliveryReliability: number;
    concurrentConnections: number;
    messageTimeoutDefault: number;
    retryAttempts: number;
    circuitBreakerThreshold: number;
  };
  routing: {
    enableIntelligentRouting: boolean;
    enableLoadBalancing: boolean;
    enableFailover: boolean;
    routingStrategy: "performance" | "round-robin" | "least-connections";
    healthCheckInterval: number;
    routingTableUpdateInterval: number;
  };
  orchestration: {
    enableWaveCoordination: boolean;
    enablePersonaChains: boolean;
    enableSubAgentDelegation: boolean;
    enableQualityGateCoordination: boolean;
    maxWavePhases: number;
    maxPersonaChainLength: number;
    maxConcurrentSubAgents: number;
  };
}