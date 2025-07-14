/**
 * Inter-Server Communication Module
 * Core messaging infrastructure for SuperClaude MCP ecosystem
 */

// Core types and interfaces
export * from './types.js';

// Message routing
export { 
  MessageRouterImpl,
  type MessageRouter,
  type Route,
  type RoutingTableEntry,
  type HealthStatus,
  type PerformanceMetrics as RouterPerformanceMetrics,
  type SelectionCriteria,
  type RoutingTableUpdate,
  type LoadBalancingResult,
  type FailoverResult,
  type RoutingOptimization,
  type RoutingMetrics
} from './MessageRouter.js';

// Event bus
export {
  EventBusManager,
  PriorityQueue,
  EventMetricsCollectorImpl,
  EventPriority,
  type SystemEvent,
  type EventSubscriber,
  type EventFilter,
  type QueuedEvent,
  type PublishResult,
  type SubscriptionResult,
  type EventValidationResult,
  type EventMetrics,
  type EventMetricsCollector
} from './EventBusManager.js';

// Performance monitoring
export {
  PerformanceMonitor,
  type PerformanceMetrics,
  type ResourceUtilization,
  type LatencyMetrics,
  type ThroughputMetrics,
  type ErrorMetrics,
  type ErrorEvent,
  type ConnectionMetrics,
  type QueueMetrics,
  type PerformanceThresholds,
  type PerformanceAlert,
  type OptimizationSuggestion,
  type PerformanceReport,
  type PerformanceSummary,
  type DetailedMetrics,
  type PerformanceTrends
} from './PerformanceMonitor.js';

// Wave coordination
export {
  WaveCoordinatorImpl,
  WaveStatus,
  WaveEvent,
  type WaveCoordinator,
  type WaveExecution,
  type WavePhaseResult,
  type WaveMetrics,
  type WaveInitiationResult,
  type PhaseCoordinationResult,
  type WaveFinalizeResult,
  type WaveProgressStatus,
  type WaveError,
  type WaveRecoveryResult,
  type WaveOptimization,
  type WavePerformanceAnalysis
} from './WaveCoordinator.js';

// Persona chain coordination
export {
  PersonaChainCoordinatorImpl,
  ChainStatus,
  type PersonaChainCoordinator,
  type PersonaChainExecution,
  type ChainMetrics,
  type ChainInitiationResult,
  type StepExecutionResult,
  type ChainFinalizeResult,
  type PersonaTransition,
  type TransitionResult,
  type ContextPreservationResult,
  type ChainError,
  type ChainRecoveryResult,
  type SequenceOptimization,
  type ChainEffectivenessAnalysis
} from './PersonaChainCoordinator.js';

// Sub-agent coordination
export {
  SubAgentCoordinatorImpl,
  TaskPriority,
  TaskStatus,
  AgentStatus,
  type SubAgentCoordinator,
  type SubAgentTask,
  type SubAgent,
  type TaskExecution,
  type DelegationRequest,
  type DelegationResult,
  type LoadBalancingResult as AgentLoadBalancingResult,
  type AgentHealthStatus,
  type ScalingDecision,
  type OptimizationSuggestion as AgentOptimizationSuggestion
} from './SubAgentCoordinator.js';

// Security management
export {
  SecurityManager,
  TrustStatus,
  type SecuredMessage,
  type MessageSecurity,
  type AuthenticationResult,
  type AuthorizationResult,
  type Certificate,
  type TrustRelationship,
  type SecurityAuditEntry,
  type SecurityMetrics,
  type TrustEstablishmentResult,
  type TrustValidationResult,
  type SecurityConfig
} from './SecurityManager.js';

// Main communication service
export {
  CommunicationService,
  type CommunicationServiceOptions,
  type CommunicationMetrics,
  type ServiceHealth,
  type ComponentHealth
} from './CommunicationService.js';

// Testing framework
export {
  CommunicationTestSuite,
  type TestResult,
  type TestSuiteResults,
  type TestCategoryResults,
  type LoadTestConfig,
  type LoadTestResults
} from './tests/CommunicationTestSuite.js';

// Utility function to create default configuration
export function createDefaultCommunicationConfig(): import('./types.js').InterServerCommunicationConfig {
  return {
    protocol: {
      type: "event-driven-request-response",
      transport: "WebSocket",
      serialization: "MessagePack",
      compression: "gzip",
      enableBatching: true,
      batchSize: 100,
      batchTimeout: 10
    },
    performance: {
      maxLatency: 50,
      throughputTarget: 10000,
      deliveryReliability: 99.9,
      concurrentConnections: 100,
      messageTimeoutDefault: 5000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    routing: {
      enableIntelligentRouting: true,
      enableLoadBalancing: true,
      enableFailover: true,
      routingStrategy: "performance",
      healthCheckInterval: 30000,
      routingTableUpdateInterval: 10000
    },
    orchestration: {
      enableWaveCoordination: true,
      enablePersonaChains: true,
      enableSubAgentDelegation: true,
      enableQualityGateCoordination: true,
      maxWavePhases: 10,
      maxPersonaChainLength: 8,
      maxConcurrentSubAgents: 15
    }
  };
}

// Utility function to create message ID
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function to create correlation ID
export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Version information
export const COMMUNICATION_VERSION = '1.0.0';
export const SUPPORTED_PROTOCOL_VERSIONS = ['1.0'];

// Message validation utility
export function validateMessage(message: import('./types.js').BaseMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!message.header) {
    errors.push('Missing message header');
  } else {
    if (!message.header.messageId) errors.push('Missing message ID');
    if (!message.header.correlationId) errors.push('Missing correlation ID');
    if (!message.header.source) errors.push('Missing source server');
    if (!message.header.target) errors.push('Missing target server');
    if (!message.header.operation) errors.push('Missing operation');
    if (!message.header.messageType) errors.push('Missing message type');
  }

  if (!message.payload) {
    errors.push('Missing message payload');
  }

  if (!message.metadata) {
    errors.push('Missing message metadata');
  } else {
    if (!message.metadata.timestamp) errors.push('Missing timestamp');
    if (typeof message.metadata.ttl !== 'number') errors.push('Missing or invalid TTL');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Factory function to create a complete communication service
export function createCommunicationService(options?: CommunicationServiceOptions): CommunicationService {
  return new CommunicationService(options);
}

// Factory function to create a test suite
export function createTestSuite(config?: Partial<import('./types.js').InterServerCommunicationConfig>): CommunicationTestSuite {
  return new CommunicationTestSuite(config);
}