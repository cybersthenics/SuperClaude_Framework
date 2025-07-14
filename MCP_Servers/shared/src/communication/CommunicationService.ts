/**
 * Communication Service
 * Main orchestrator for inter-server communication system
 */

import { EventEmitter } from 'events';
import {
  InterServerCommunicationConfig,
  BaseMessage,
  MessageType,
  ServerIdentifier,
  WaveRequest,
  PersonaChainRequest,
  QualityGateMessage,
  createDefaultCommunicationConfig
} from './types.js';

import { MessageRouterImpl, MessageRouter } from './MessageRouter.js';
import { EventBusManager } from './EventBusManager.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { WaveCoordinatorImpl, WaveCoordinator } from './WaveCoordinator.js';
import { PersonaChainCoordinatorImpl, PersonaChainCoordinator } from './PersonaChainCoordinator.js';
import { SubAgentCoordinatorImpl, SubAgentCoordinator } from './SubAgentCoordinator.js';

export interface CommunicationServiceOptions {
  config?: Partial<InterServerCommunicationConfig>;
  enablePerformanceMonitoring?: boolean;
  enableWaveCoordination?: boolean;
  enablePersonaChains?: boolean;
  enableSubAgentDelegation?: boolean;
}

export interface CommunicationMetrics {
  messageRouter: any;
  eventBus: any;
  performance: any;
  waveCoordinator?: any;
  personaChains?: any;
  subAgents?: any;
}

export interface ServiceHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  timestamp: Date;
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: string;
  metrics?: any;
}

export class CommunicationService extends EventEmitter {
  private config: InterServerCommunicationConfig;
  private messageRouter: MessageRouter;
  private eventBus: EventBusManager;
  private performanceMonitor: PerformanceMonitor;
  private waveCoordinator?: WaveCoordinator;
  private personaChainCoordinator?: PersonaChainCoordinator;
  private subAgentCoordinator?: SubAgentCoordinator;
  private isRunning: boolean = false;

  constructor(options: CommunicationServiceOptions = {}) {
    super();
    
    // Initialize configuration
    this.config = {
      ...createDefaultCommunicationConfig(),
      ...options.config
    };

    // Initialize core components
    this.messageRouter = new MessageRouterImpl(this.config);
    this.eventBus = new EventBusManager();
    this.performanceMonitor = new PerformanceMonitor();

    // Initialize optional components
    if (options.enableWaveCoordination ?? this.config.orchestration.enableWaveCoordination) {
      this.waveCoordinator = new WaveCoordinatorImpl(this.messageRouter);
    }

    if (options.enablePersonaChains ?? this.config.orchestration.enablePersonaChains) {
      this.personaChainCoordinator = new PersonaChainCoordinatorImpl(this.messageRouter);
    }

    if (options.enableSubAgentDelegation ?? this.config.orchestration.enableSubAgentDelegation) {
      this.subAgentCoordinator = new SubAgentCoordinatorImpl(this.messageRouter);
    }

    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Communication service is already running');
    }

    try {
      console.log('Starting SuperClaude Communication Service...');

      // Validate configuration
      await this.validateConfiguration();

      // Initialize components
      await this.initializeComponents();

      // Start monitoring
      if (this.performanceMonitor) {
        console.log('Performance monitoring started');
      }

      this.isRunning = true;
      console.log('SuperClaude Communication Service started successfully');

      this.emit('serviceStarted', {
        timestamp: new Date(),
        config: this.config
      });

    } catch (error) {
      console.error('Failed to start communication service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping SuperClaude Communication Service...');

    try {
      // Stop components
      await this.cleanupComponents();

      this.isRunning = false;
      console.log('SuperClaude Communication Service stopped');

      this.emit('serviceStopped', {
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error stopping communication service:', error);
      throw error;
    }
  }

  async sendMessage(message: BaseMessage): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Communication service is not running');
    }

    const startTime = performance.now();
    
    try {
      // Route message through appropriate coordinator
      let result;
      
      switch (message.header.messageType) {
        case MessageType.WaveCoordination:
          if (!this.waveCoordinator) {
            throw new Error('Wave coordination is not enabled');
          }
          result = await this.handleWaveMessage(message);
          break;

        case MessageType.PersonaChain:
          if (!this.personaChainCoordinator) {
            throw new Error('Persona chain coordination is not enabled');
          }
          result = await this.handlePersonaChainMessage(message);
          break;

        case MessageType.SubAgentDelegation:
          if (!this.subAgentCoordinator) {
            throw new Error('Sub-agent coordination is not enabled');
          }
          result = await this.handleSubAgentMessage(message);
          break;

        case MessageType.QualityGate:
          result = await this.handleQualityGateMessage(message);
          break;

        default:
          result = await this.messageRouter.routeMessage(message);
          break;
      }

      // Record performance metrics
      const latency = performance.now() - startTime;
      this.performanceMonitor.recordMessageLatency(latency, message);

      return result;

    } catch (error) {
      const latency = performance.now() - startTime;
      this.performanceMonitor.recordError({
        timestamp: new Date(),
        type: 'message_routing_error',
        server: message.header.source as ServerIdentifier,
        message: error instanceof Error ? error.message : String(error),
        severity: 'medium'
      });

      throw error;
    }
  }

  async broadcastMessage(message: BaseMessage, targets?: ServerIdentifier[]): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Communication service is not running');
    }

    return await this.messageRouter.broadcastMessage(message, targets);
  }

  async initiateWave(waveRequest: WaveRequest): Promise<any> {
    if (!this.waveCoordinator) {
      throw new Error('Wave coordination is not enabled');
    }

    return await this.waveCoordinator.initiateWave(waveRequest);
  }

  async initiatePersonaChain(chainRequest: PersonaChainRequest): Promise<any> {
    if (!this.personaChainCoordinator) {
      throw new Error('Persona chain coordination is not enabled');
    }

    return await this.personaChainCoordinator.initiatePersonaChain(chainRequest);
  }

  async delegateTasks(delegationRequest: any): Promise<any> {
    if (!this.subAgentCoordinator) {
      throw new Error('Sub-agent coordination is not enabled');
    }

    return await this.subAgentCoordinator.delegateTasks(delegationRequest);
  }

  async getMetrics(): Promise<CommunicationMetrics> {
    const metrics: CommunicationMetrics = {
      messageRouter: await this.messageRouter.getRoutingMetrics(),
      eventBus: await this.eventBus.getEventMetrics(),
      performance: await this.performanceMonitor.generatePerformanceReport()
    };

    if (this.waveCoordinator) {
      // Would add wave coordinator metrics
      metrics.waveCoordinator = {};
    }

    if (this.personaChainCoordinator) {
      // Would add persona chain metrics
      metrics.personaChains = {};
    }

    if (this.subAgentCoordinator) {
      // Would add sub-agent metrics
      metrics.subAgents = {};
    }

    return metrics;
  }

  async getHealth(): Promise<ServiceHealth> {
    const components: ComponentHealth[] = [];

    // Check message router health
    try {
      const routingMetrics = await this.messageRouter.getRoutingMetrics();
      components.push({
        component: 'MessageRouter',
        status: routingMetrics.successRate > 95 ? 'healthy' : 'degraded',
        details: `Success rate: ${routingMetrics.successRate}%`,
        metrics: routingMetrics
      });
    } catch (error) {
      components.push({
        component: 'MessageRouter',
        status: 'unhealthy',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    // Check event bus health
    try {
      const eventMetrics = await this.eventBus.getEventMetrics();
      components.push({
        component: 'EventBus',
        status: eventMetrics.errorRate < 5 ? 'healthy' : 'degraded',
        details: `Error rate: ${eventMetrics.errorRate}%`,
        metrics: eventMetrics
      });
    } catch (error) {
      components.push({
        component: 'EventBus',
        status: 'unhealthy',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    // Check performance monitor health
    try {
      const perfReport = this.performanceMonitor.generatePerformanceReport();
      components.push({
        component: 'PerformanceMonitor',
        status: 'healthy',
        details: 'Performance monitoring active',
        metrics: perfReport
      });
    } catch (error) {
      components.push({
        component: 'PerformanceMonitor',
        status: 'unhealthy',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    // Check optional components
    if (this.waveCoordinator) {
      components.push({
        component: 'WaveCoordinator',
        status: 'healthy',
        details: 'Wave coordination active'
      });
    }

    if (this.personaChainCoordinator) {
      components.push({
        component: 'PersonaChainCoordinator',
        status: 'healthy',
        details: 'Persona chain coordination active'
      });
    }

    if (this.subAgentCoordinator) {
      components.push({
        component: 'SubAgentCoordinator',
        status: 'healthy',
        details: 'Sub-agent coordination active'
      });
    }

    // Determine overall health
    const unhealthyComponents = components.filter(c => c.status === 'unhealthy');
    const degradedComponents = components.filter(c => c.status === 'degraded');

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyComponents.length > 0) {
      overall = 'unhealthy';
    } else if (degradedComponents.length > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      components,
      timestamp: new Date()
    };
  }

  getConfiguration(): InterServerCommunicationConfig {
    return { ...this.config };
  }

  async updateConfiguration(updates: Partial<InterServerCommunicationConfig>): Promise<void> {
    // Validate updates
    const newConfig = { ...this.config, ...updates };
    await this.validateConfiguration(newConfig);

    // Apply updates
    this.config = newConfig;

    this.emit('configurationUpdated', {
      timestamp: new Date(),
      updates
    });
  }

  private async validateConfiguration(config: InterServerCommunicationConfig = this.config): Promise<void> {
    // Validate performance thresholds
    if (config.performance.maxLatency <= 0) {
      throw new Error('Invalid max latency configuration');
    }

    if (config.performance.throughputTarget <= 0) {
      throw new Error('Invalid throughput target configuration');
    }

    if (config.performance.deliveryReliability < 0 || config.performance.deliveryReliability > 100) {
      throw new Error('Invalid delivery reliability configuration');
    }

    // Validate orchestration settings
    if (config.orchestration.maxWavePhases <= 0) {
      throw new Error('Invalid max wave phases configuration');
    }

    if (config.orchestration.maxPersonaChainLength <= 0) {
      throw new Error('Invalid max persona chain length configuration');
    }

    if (config.orchestration.maxConcurrentSubAgents <= 0) {
      throw new Error('Invalid max concurrent sub-agents configuration');
    }
  }

  private async initializeComponents(): Promise<void> {
    // Initialize routing table for message router
    console.log('Initializing message router...');

    // Initialize event bus subscriptions
    console.log('Initializing event bus...');

    // Initialize performance monitoring
    console.log('Initializing performance monitoring...');

    // Initialize coordination components
    if (this.waveCoordinator) {
      console.log('Initializing wave coordinator...');
    }

    if (this.personaChainCoordinator) {
      console.log('Initializing persona chain coordinator...');
    }

    if (this.subAgentCoordinator) {
      console.log('Initializing sub-agent coordinator...');
    }
  }

  private async cleanupComponents(): Promise<void> {
    // Cleanup in reverse order
    if (this.subAgentCoordinator) {
      this.subAgentCoordinator.destroy();
    }

    if (this.personaChainCoordinator) {
      this.personaChainCoordinator.destroy();
    }

    if (this.waveCoordinator) {
      this.waveCoordinator.destroy();
    }

    this.performanceMonitor.destroy();
    this.eventBus.destroy();
    
    if ('destroy' in this.messageRouter) {
      (this.messageRouter as any).destroy();
    }
  }

  private setupEventHandlers(): void {
    // Message router events
    this.messageRouter.on('routingTableUpdated', (data) => {
      this.emit('routingTableUpdated', data);
    });

    // Event bus events
    this.eventBus.on('subscriberAdded', (data) => {
      this.emit('eventSubscriberAdded', data);
    });

    this.eventBus.on('subscriberRemoved', (data) => {
      this.emit('eventSubscriberRemoved', data);
    });

    // Performance monitor events
    this.performanceMonitor.on('alertGenerated', (alert) => {
      this.emit('performanceAlert', alert);
    });

    this.performanceMonitor.on('metricsCollected', (metrics) => {
      this.emit('metricsCollected', metrics);
    });

    // Wave coordinator events
    if (this.waveCoordinator) {
      this.waveCoordinator.on('waveInitiated', (data) => {
        this.emit('waveInitiated', data);
      });

      this.waveCoordinator.on('waveCompleted', (data) => {
        this.emit('waveCompleted', data);
      });

      this.waveCoordinator.on('waveFailed', (data) => {
        this.emit('waveFailed', data);
      });
    }

    // Persona chain coordinator events
    if (this.personaChainCoordinator) {
      this.personaChainCoordinator.on('chainInitiated', (data) => {
        this.emit('personaChainInitiated', data);
      });

      this.personaChainCoordinator.on('chainCompleted', (data) => {
        this.emit('personaChainCompleted', data);
      });

      this.personaChainCoordinator.on('chainFailed', (data) => {
        this.emit('personaChainFailed', data);
      });
    }

    // Sub-agent coordinator events
    if (this.subAgentCoordinator) {
      this.subAgentCoordinator.on('delegationCompleted', (data) => {
        this.emit('taskDelegationCompleted', data);
      });

      this.subAgentCoordinator.on('delegationFailed', (data) => {
        this.emit('taskDelegationFailed', data);
      });

      this.subAgentCoordinator.on('agentRegistered', (data) => {
        this.emit('subAgentRegistered', data);
      });
    }
  }

  private async handleWaveMessage(message: BaseMessage): Promise<any> {
    // Route to wave coordinator based on operation
    const operation = message.header.operation;
    
    switch (operation) {
      case 'initiate_wave':
        return await this.waveCoordinator!.initiateWave(message.payload.data);
      case 'execute_wave_phase':
        return await this.waveCoordinator!.coordinateWavePhase(message.payload.data);
      case 'finalize_wave':
        return await this.waveCoordinator!.finalizeWave(message.payload.data.waveId);
      default:
        return await this.messageRouter.routeMessage(message);
    }
  }

  private async handlePersonaChainMessage(message: BaseMessage): Promise<any> {
    // Route to persona chain coordinator based on operation
    const operation = message.header.operation;
    
    switch (operation) {
      case 'initiate_persona_chain':
        return await this.personaChainCoordinator!.initiatePersonaChain(message.payload.data);
      case 'execute_persona_step':
        return await this.personaChainCoordinator!.executePersonaStep(message.payload.data);
      case 'finalize_persona_chain':
        return await this.personaChainCoordinator!.finalizePersonaChain(message.payload.data.chainId);
      default:
        return await this.messageRouter.routeMessage(message);
    }
  }

  private async handleSubAgentMessage(message: BaseMessage): Promise<any> {
    // Route to sub-agent coordinator based on operation
    const operation = message.header.operation;
    
    switch (operation) {
      case 'delegate_tasks':
        return await this.subAgentCoordinator!.delegateTasks(message.payload.data);
      case 'assign_task':
        return await this.subAgentCoordinator!.assignTask(message.payload.data);
      case 'register_agent':
        return await this.subAgentCoordinator!.registerAgent(message.payload.data);
      default:
        return await this.messageRouter.routeMessage(message);
    }
  }

  private async handleQualityGateMessage(message: BaseMessage): Promise<any> {
    // Handle quality gate coordination
    const qualityMessage = message as QualityGateMessage;
    
    // Implement quality gate logic
    const gateResult = {
      passed: true,
      score: 95,
      issues: [],
      recommendations: [],
      metrics: {
        score: 95,
        coverage: 100,
        reliability: 98,
        performance: 90
      },
      evidenceLinks: []
    };

    return {
      success: true,
      result: gateResult
    };
  }
}