// SuperClaude Personas - PersonaManager
// Central coordination for all persona operations

import { 
  PersonaImplementation, 
  PersonaContext, 
  PersonaState, 
  PersonaStackEntry,
  ActivationResult,
  PersonaRecommendation,
  CoordinationResult,
  ChainStepResult,
  PersonaName,
  PERSONA_NAMES,
  RequestContext,
  Operation,
  ChainStep,
  ChainContext,
  CollaborationContext,
  PersonaMetrics,
  PersonaDecision,
  ExpertiseContribution,
  HandoffPackage
} from '../types';

import { ActivationEngine } from './ActivationEngine';
import { CollaborationCoordinator } from './CollaborationCoordinator';
import { ChainModeHandler } from './ChainModeHandler';
import { Logger } from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { CacheManager } from '../utils/CacheManager';

export class PersonaManager {
  private personas: Map<PersonaName, PersonaImplementation> = new Map();
  private activationEngine: ActivationEngine;
  private collaborationCoordinator: CollaborationCoordinator;
  private chainModeHandler: ChainModeHandler;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private cache: CacheManager;

  private personaState: PersonaState = {
    activePersona: null,
    personaStack: [],
    collaborationContext: {
      activeCollaboration: null,
      participants: [],
      mode: "parallel",
      sharedExpertise: [],
      conflictResolutions: []
    },
    decisionHistory: [],
    performanceMetrics: {
      activationCount: 0,
      averageActivationTime: 0,
      decisionAccuracy: 0,
      collaborationSuccess: 0,
      performanceScore: 0,
      userSatisfaction: 0
    }
  };

  constructor(
    personas: Map<PersonaName, PersonaImplementation>,
    activationEngine: ActivationEngine,
    collaborationCoordinator: CollaborationCoordinator,
    chainModeHandler: ChainModeHandler,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    cache: CacheManager
  ) {
    this.personas = personas;
    this.activationEngine = activationEngine;
    this.collaborationCoordinator = collaborationCoordinator;
    this.chainModeHandler = chainModeHandler;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.cache = cache;

    this.logger.info('PersonaManager initialized with personas:', Array.from(personas.keys()));
  }

  /**
   * Activate a specific persona with context
   */
  async activatePersona(
    persona: PersonaName,
    context: PersonaContext,
    options: {
      forceActivation?: boolean;
      preserveStack?: boolean;
      collaborationMode?: "single" | "parallel" | "chain";
    } = {}
  ): Promise<ActivationResult> {
    const startTime = Date.now();
    
    try {
      // Validate persona exists
      const personaImpl = this.personas.get(persona);
      if (!personaImpl) {
        throw new Error(`Unknown persona: ${persona}`);
      }

      this.logger.debug(`Activating persona: ${persona}`, { context, options });

      // Check if persona is already active
      if (this.personaState.activePersona === persona && !options.forceActivation) {
        this.logger.debug(`Persona ${persona} already active, returning cached result`);
        return await this.getCachedActivationResult(persona, context);
      }

      // Apply persona behavior to context
      const behaviorResult = await personaImpl.applyBehavior(context);

      // Update persona state
      if (!options.preserveStack) {
        this.personaState.personaStack = [];
      }

      const stackEntry: PersonaStackEntry = {
        persona,
        activatedAt: new Date(),
        context,
        expertise: [],
        handoffPreparation: null
      };

      this.personaState.activePersona = persona;
      this.personaState.personaStack.push(stackEntry);

      // Update performance metrics
      const activationTime = Date.now() - startTime;
      this.updatePerformanceMetrics(activationTime);

      // Cache the result
      const result: ActivationResult = {
        success: true,
        persona,
        behaviorTransformations: behaviorResult.transformations,
        mcpPreferences: personaImpl.mcpPreferences,
        qualityStandards: personaImpl.qualityStandards,
        metadata: {
          activationTime,
          confidenceScore: behaviorResult.confidence
        }
      };

      this.cache.set(`activation:${persona}:${this.hashContext(context)}`, result, 300); // 5 minutes

      this.logger.info(`Persona ${persona} activated successfully`, { 
        activationTime, 
        confidence: behaviorResult.confidence 
      });

      return result;

    } catch (error) {
      this.logger.error(`Failed to activate persona ${persona}:`, error);
      throw error;
    }
  }

  /**
   * Get persona recommendation for a given context
   */
  async getPersonaRecommendation(
    context: RequestContext,
    options: {
      includeConfidenceBreakdown?: boolean;
      maxRecommendations?: number;
      excludePersonas?: PersonaName[];
    } = {}
  ): Promise<PersonaRecommendation[]> {
    try {
      this.logger.debug('Getting persona recommendation', { context, options });

      // Check cache first
      const cacheKey = `recommendation:${this.hashContext(context)}`;
      const cached = this.cache.get<PersonaRecommendation[]>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached recommendation');
        return cached;
      }

      // Analyze context and calculate scores
      const analysis = await this.activationEngine.analyzeContext(context);
      const scores = await this.activationEngine.calculatePersonaScores(context);

      // Filter and sort recommendations
      const recommendations = scores
        .filter(score => !options.excludePersonas?.includes(score.persona))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, options.maxRecommendations || 3)
        .map(score => ({
          persona: score.persona,
          confidence: score.confidence,
          reasoning: this.generateRecommendationReasoning(score, analysis),
          expectedBehaviors: this.getExpectedBehaviors(score.persona),
          breakdown: options.includeConfidenceBreakdown ? score.breakdown : undefined
        }));

      // Cache the result
      this.cache.set(cacheKey, recommendations, 180); // 3 minutes

      this.logger.info('Generated persona recommendations', { 
        count: recommendations.length, 
        topPersona: recommendations[0]?.persona 
      });

      return recommendations;

    } catch (error) {
      this.logger.error('Failed to generate persona recommendation:', error);
      throw error;
    }
  }

  /**
   * Coordinate multiple personas for an operation
   */
  async coordinateMultiPersona(
    personas: PersonaName[],
    operation: Operation,
    coordinationMode: "parallel" | "sequential" | "hierarchical" = "parallel"
  ): Promise<CoordinationResult> {
    try {
      this.logger.info(`Coordinating ${personas.length} personas in ${coordinationMode} mode`);

      // Update collaboration context
      this.personaState.collaborationContext = {
        activeCollaboration: `coordination-${Date.now()}`,
        participants: personas,
        mode: coordinationMode,
        sharedExpertise: [],
        conflictResolutions: []
      };

      // Delegate to collaboration coordinator
      const result = await this.collaborationCoordinator.coordinatePersonas(
        personas,
        operation,
        coordinationMode
      );

      this.logger.info('Multi-persona coordination completed', { 
        mode: coordinationMode, 
        conflicts: result.conflictResolutions.length 
      });

      return result;

    } catch (error) {
      this.logger.error('Multi-persona coordination failed:', error);
      throw error;
    }
  }

  /**
   * Execute chain mode with sequential persona handoffs
   */
  async executeChainMode(
    steps: ChainStep[],
    context: ChainContext
  ): Promise<ChainStepResult[]> {
    try {
      this.logger.info(`Executing chain mode with ${steps.length} steps`);

      // Update collaboration context for chain mode
      this.personaState.collaborationContext = {
        activeCollaboration: context.chainId,
        participants: steps.map(step => step.persona),
        mode: "sequential",
        sharedExpertise: [],
        conflictResolutions: []
      };

      // Delegate to chain mode handler
      const results = await this.chainModeHandler.executeChain(steps, context);

      this.logger.info('Chain mode execution completed', { 
        chainId: context.chainId, 
        steps: steps.length 
      });

      return results;

    } catch (error) {
      this.logger.error('Chain mode execution failed:', error);
      throw error;
    }
  }

  /**
   * Get current persona state
   */
  getPersonaState(): PersonaState {
    return { ...this.personaState };
  }

  /**
   * Get active persona
   */
  getActivePersona(): PersonaName | null {
    return this.personaState.activePersona;
  }

  /**
   * Get persona stack
   */
  getPersonaStack(): PersonaStackEntry[] {
    return [...this.personaState.personaStack];
  }

  /**
   * Clear persona stack
   */
  clearPersonaStack(): void {
    this.personaState.personaStack = [];
    this.personaState.activePersona = null;
    this.logger.debug('Persona stack cleared');
  }

  /**
   * Get persona by name
   */
  getPersona(name: PersonaName): PersonaImplementation | undefined {
    return this.personas.get(name);
  }

  /**
   * Get all available personas
   */
  getAllPersonas(): PersonaName[] {
    return Array.from(this.personas.keys());
  }

  /**
   * Share expertise between personas
   */
  async shareExpertise(
    fromPersona: PersonaName,
    toPersona: PersonaName,
    expertise: ExpertiseContribution
  ): Promise<boolean> {
    try {
      // Delegate to collaboration coordinator
      const result = await this.collaborationCoordinator.shareExpertise(
        fromPersona,
        toPersona,
        expertise
      );

      // Update collaboration context
      this.personaState.collaborationContext.sharedExpertise.push(expertise);

      this.logger.info(`Expertise shared from ${fromPersona} to ${toPersona}`);
      return result.success;

    } catch (error) {
      this.logger.error('Expertise sharing failed:', error);
      return false;
    }
  }

  /**
   * Get persona priorities
   */
  async getPersonaPriorities(
    persona: PersonaName,
    context?: any
  ): Promise<string[]> {
    const personaImpl = this.personas.get(persona);
    if (!personaImpl) {
      throw new Error(`Unknown persona: ${persona}`);
    }

    const priorities = personaImpl.priorityHierarchy;
    
    // Apply context if provided and persona supports it
    if (context && personaImpl.applyContextToPriorities) {
      return await personaImpl.applyContextToPriorities(priorities, context);
    }

    return priorities;
  }

  /**
   * Record persona decision
   */
  recordDecision(decision: PersonaDecision): void {
    this.personaState.decisionHistory.push(decision);
    
    // Keep only last 100 decisions
    if (this.personaState.decisionHistory.length > 100) {
      this.personaState.decisionHistory = this.personaState.decisionHistory.slice(-100);
    }

    this.logger.debug('Persona decision recorded', { 
      persona: decision.persona, 
      type: decision.decisionType 
    });
  }

  /**
   * Get decision history
   */
  getDecisionHistory(persona?: PersonaName): PersonaDecision[] {
    if (persona) {
      return this.personaState.decisionHistory.filter(d => d.persona === persona);
    }
    return [...this.personaState.decisionHistory];
  }

  // Private helper methods

  private async getCachedActivationResult(
    persona: PersonaName,
    context: PersonaContext
  ): Promise<ActivationResult> {
    const cacheKey = `activation:${persona}:${this.hashContext(context)}`;
    const cached = this.cache.get<ActivationResult>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // If not cached, perform activation
    const personaImpl = this.personas.get(persona)!;
    const behaviorResult = await personaImpl.applyBehavior(context);
    
    return {
      success: true,
      persona,
      behaviorTransformations: behaviorResult.transformations,
      mcpPreferences: personaImpl.mcpPreferences,
      qualityStandards: personaImpl.qualityStandards,
      metadata: {
        activationTime: 0,
        confidenceScore: behaviorResult.confidence
      }
    };
  }

  private updatePerformanceMetrics(activationTime: number): void {
    const metrics = this.personaState.performanceMetrics;
    metrics.activationCount++;
    metrics.averageActivationTime = 
      (metrics.averageActivationTime * (metrics.activationCount - 1) + activationTime) / 
      metrics.activationCount;
    
    this.performanceMonitor.recordMetric('persona_activation_time', activationTime);
  }

  private generateRecommendationReasoning(score: any, analysis: any): string {
    return `Recommended based on ${(score.confidence * 100).toFixed(1)}% confidence. ` +
           `Strong match for ${analysis.primaryDomain} domain with complexity ${analysis.complexity}.`;
  }

  private getExpectedBehaviors(persona: PersonaName): string[] {
    const personaImpl = this.personas.get(persona);
    if (!personaImpl) return [];

    return personaImpl.coreStrategies.map(strategy => 
      `${strategy.domain}: ${strategy.approach}`
    );
  }

  private hashContext(context: any): string {
    return Buffer.from(JSON.stringify(context)).toString('base64').substring(0, 16);
  }
}