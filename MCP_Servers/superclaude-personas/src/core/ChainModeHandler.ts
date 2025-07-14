// SuperClaude Personas - ChainModeHandler
// Support orchestrator chain mode execution with context preservation

import {
  PersonaName,
  PersonaImplementation,
  ChainStep,
  ChainContext,
  ChainStepResult,
  Insight,
  HandoffPackage,
  PersonaContext,
  Operation,
  ExpertiseContribution
} from '../types';

import { Logger } from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { CollaborationCoordinator } from './CollaborationCoordinator';

export interface ChainExecution {
  chainId: string;
  steps: ChainStep[];
  currentStep: number;
  results: ChainStepResult[];
  accumulatedInsights: Insight[];
  contextPreservation: any;
  startTime: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ContextPreservation {
  chainId: string;
  stepContexts: Map<number, any>;
  sharedState: any;
  preservedInsights: Insight[];
  handoffPackages: HandoffPackage[];
  preservationScore: number;
}

export interface InsightAggregation {
  chainId: string;
  aggregatedInsights: Insight[];
  confidenceScore: number;
  synthesizedRecommendations: string[];
  qualityMetrics: any;
}

export class ChainModeHandler {
  private personas: Map<PersonaName, PersonaImplementation>;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private collaborationCoordinator: CollaborationCoordinator;
  
  // Active chain executions
  private activeChains: Map<string, ChainExecution> = new Map();
  
  // Context preservation storage
  private contextPreservation: Map<string, ContextPreservation> = new Map();
  
  // Target preservation threshold
  private preservationThreshold = 0.95;

  constructor(
    personas: Map<PersonaName, PersonaImplementation>,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    collaborationCoordinator: CollaborationCoordinator
  ) {
    this.personas = personas;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.collaborationCoordinator = collaborationCoordinator;
  }

  /**
   * Execute a complete chain of persona steps
   */
  async executeChain(
    steps: ChainStep[],
    context: ChainContext
  ): Promise<ChainStepResult[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Starting chain execution: ${context.chainId}`, {
        totalSteps: steps.length,
        personas: steps.map(s => s.persona)
      });

      // Initialize chain execution
      const chainExecution = this.initializeChainExecution(steps, context);
      this.activeChains.set(context.chainId, chainExecution);

      // Initialize context preservation
      this.initializeContextPreservation(context.chainId);

      const results: ChainStepResult[] = [];
      
      // Execute each step sequentially
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepResult = await this.executeChainStep(step, context, results);
        
        results.push(stepResult);
        chainExecution.results.push(stepResult);
        chainExecution.currentStep = i + 1;
        
        // Update context preservation
        await this.updateContextPreservation(context.chainId, stepResult);
        
        // Prepare handoff for next step
        if (i < steps.length - 1) {
          await this.prepareHandoffForNextStep(steps[i + 1], stepResult, context);
        }
      }

      // Finalize chain execution
      chainExecution.status = 'completed';
      
      // Calculate final metrics
      const executionTime = Date.now() - startTime;
      const preservation = this.contextPreservation.get(context.chainId);
      
      this.logger.info(`Chain execution completed: ${context.chainId}`, {
        executionTime,
        steps: results.length,
        preservationScore: preservation?.preservationScore || 0
      });

      // Record performance metrics
      this.performanceMonitor.recordMetric('chain_execution_time', executionTime);
      this.performanceMonitor.recordMetric('chain_preservation_score', preservation?.preservationScore || 0);

      return results;

    } catch (error) {
      this.logger.error(`Chain execution failed: ${context.chainId}`, error);
      
      // Update chain status
      const chainExecution = this.activeChains.get(context.chainId);
      if (chainExecution) {
        chainExecution.status = 'failed';
      }
      
      throw error;
    } finally {
      // Cleanup
      this.cleanupChainExecution(context.chainId);
    }
  }

  /**
   * Execute a single step in the chain
   */
  async executeChainStep(
    step: ChainStep,
    context: ChainContext,
    previousResults: ChainStepResult[]
  ): Promise<ChainStepResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Executing chain step ${step.stepNumber}: ${step.persona}`);

      // Get persona implementation
      const personaImpl = this.personas.get(step.persona);
      if (!personaImpl) {
        throw new Error(`Persona ${step.persona} not found`);
      }

      // Build context for this step
      const stepContext = await this.buildStepContext(step, context, previousResults);
      
      // Execute persona behavior
      const behaviorResult = await personaImpl.applyBehavior(stepContext);
      
      // Generate insights from behavior result
      const insights = this.generateInsightsFromBehavior(step.persona, behaviorResult);
      
      // Prepare handoff package for next step
      const handoffPackage = await this.prepareHandoffPackage(
        step.persona,
        stepContext,
        insights,
        previousResults
      );
      
      // Generate recommendations for next step
      const nextStepRecommendations = await this.generateNextStepRecommendations(
        step,
        behaviorResult,
        context
      );

      const executionTime = Date.now() - startTime;
      
      const stepResult: ChainStepResult = {
        stepNumber: step.stepNumber,
        persona: step.persona,
        result: behaviorResult,
        insights,
        handoffPackage,
        nextStepRecommendations
      };

      // Update accumulated context
      context.accumulatedContext = this.updateAccumulatedContext(
        context.accumulatedContext,
        stepResult
      );
      
      context.preservedInsights.push(...insights);

      this.logger.info(`Chain step completed: ${step.stepNumber} (${step.persona})`, {
        executionTime,
        insightCount: insights.length,
        confidence: behaviorResult.confidence
      });

      return stepResult;

    } catch (error) {
      this.logger.error(`Chain step failed: ${step.stepNumber} (${step.persona})`, error);
      throw error;
    }
  }

  /**
   * Preserve context across chain transitions
   */
  async preserveContextAcrossTransitions(
    fromStep: ChainStepResult,
    toStep: ChainStep,
    context: ChainContext
  ): Promise<{ preservationScore: number; preservedElements: string[] }> {
    try {
      this.logger.debug(`Preserving context from ${fromStep.persona} to ${toStep.persona}`);

      const preservation = this.contextPreservation.get(context.chainId);
      if (!preservation) {
        throw new Error(`Context preservation not initialized for chain ${context.chainId}`);
      }

      // Preserve key context elements
      const preservedElements: string[] = [];
      
      // Preserve insights
      if (fromStep.insights && fromStep.insights.length > 0) {
        preservation.preservedInsights.push(...fromStep.insights);
        preservedElements.push('insights');
      }
      
      // Preserve handoff package
      if (fromStep.handoffPackage) {
        preservation.handoffPackages.push(fromStep.handoffPackage);
        preservedElements.push('handoff_package');
      }
      
      // Preserve step context
      preservation.stepContexts.set(fromStep.stepNumber, {
        persona: fromStep.persona,
        result: fromStep.result,
        timestamp: new Date()
      });
      preservedElements.push('step_context');
      
      // Update shared state
      preservation.sharedState = {
        ...preservation.sharedState,
        [`step_${fromStep.stepNumber}`]: {
          persona: fromStep.persona,
          key_insights: fromStep.insights.map(i => i.content),
          confidence: fromStep.result.confidence,
          recommendations: fromStep.nextStepRecommendations
        }
      };
      preservedElements.push('shared_state');

      // Calculate preservation score
      const preservationScore = this.calculatePreservationScore(preservation);
      preservation.preservationScore = preservationScore;

      this.logger.info(`Context preservation completed`, {
        preservationScore,
        preservedElements: preservedElements.length,
        chainId: context.chainId
      });

      return { preservationScore, preservedElements };

    } catch (error) {
      this.logger.error('Context preservation failed:', error);
      throw error;
    }
  }

  /**
   * Aggregate insights from chain execution
   */
  async aggregateInsights(
    insights: Insight[],
    chainId: string
  ): Promise<InsightAggregation> {
    try {
      this.logger.debug(`Aggregating ${insights.length} insights for chain ${chainId}`);

      // Group insights by type and persona
      const insightsByType = this.groupInsightsByType(insights);
      const insightsByPersona = this.groupInsightsByPersona(insights);

      // Synthesize insights
      const synthesizedInsights = await this.synthesizeInsights(insights);
      
      // Calculate confidence score
      const confidenceScore = insights.length > 0 
        ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length 
        : 0;

      // Generate recommendations
      const synthesizedRecommendations = this.generateSynthesizedRecommendations(
        synthesizedInsights,
        insightsByPersona
      );

      // Calculate quality metrics
      const qualityMetrics = this.calculateInsightQualityMetrics(insights);

      const aggregation: InsightAggregation = {
        chainId,
        aggregatedInsights: synthesizedInsights,
        confidenceScore,
        synthesizedRecommendations,
        qualityMetrics
      };

      this.logger.info(`Insight aggregation completed for chain ${chainId}`, {
        originalInsights: insights.length,
        synthesizedInsights: synthesizedInsights.length,
        confidenceScore,
        recommendations: synthesizedRecommendations.length
      });

      return aggregation;

    } catch (error) {
      this.logger.error('Insight aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Prepare handoff package for next step
   */
  async prepareHandoffPackage(
    persona: PersonaName,
    context: PersonaContext,
    insights: Insight[],
    previousResults: ChainStepResult[]
  ): Promise<HandoffPackage> {
    try {
      // Determine next persona from context or chain
      const nextPersona = this.determineNextPersona(previousResults);
      
      if (!nextPersona) {
        // Last step in chain
        return {
          fromPersona: persona,
          toPersona: persona, // Self-reference for last step
          context,
          insights,
          recommendations: [],
          priorities: [],
          state: { isLastStep: true }
        };
      }

      // Get persona priorities
      const priorities = await this.getPersonaPriorities(nextPersona);
      
      // Generate handoff recommendations
      const recommendations = await this.generateHandoffRecommendations(
        persona,
        nextPersona,
        insights
      );

      // Capture current state
      const state = this.capturePersonaState(persona, context, insights);

      const handoffPackage: HandoffPackage = {
        fromPersona: persona,
        toPersona: nextPersona,
        context,
        insights,
        recommendations,
        priorities,
        state
      };

      return handoffPackage;

    } catch (error) {
      this.logger.error('Handoff package preparation failed:', error);
      throw error;
    }
  }

  /**
   * Get context preservation score for a chain
   */
  getContextPreservationScore(chainId: string): number {
    const preservation = this.contextPreservation.get(chainId);
    return preservation?.preservationScore || 0;
  }

  /**
   * Get chain execution status
   */
  getChainExecutionStatus(chainId: string): string {
    const execution = this.activeChains.get(chainId);
    return execution?.status || 'unknown';
  }

  // Private helper methods

  private initializeChainExecution(steps: ChainStep[], context: ChainContext): ChainExecution {
    return {
      chainId: context.chainId,
      steps,
      currentStep: 0,
      results: [],
      accumulatedInsights: [],
      contextPreservation: {},
      startTime: new Date(),
      status: 'pending'
    };
  }

  private initializeContextPreservation(chainId: string): void {
    this.contextPreservation.set(chainId, {
      chainId,
      stepContexts: new Map(),
      sharedState: {},
      preservedInsights: [],
      handoffPackages: [],
      preservationScore: 0
    });
  }

  private async buildStepContext(
    step: ChainStep,
    context: ChainContext,
    previousResults: ChainStepResult[]
  ): Promise<PersonaContext> {
    // Build context for this step based on chain context and previous results
    const stepContext: PersonaContext = {
      domain: step.operation.type || 'general',
      complexity: this.calculateStepComplexity(step, previousResults),
      userIntent: step.expectedOutcome,
      projectContext: context.accumulatedContext?.projectContext || {
        projectType: 'unknown',
        framework: 'unknown',
        language: 'unknown',
        environment: 'development',
        phase: 'development',
        constraints: []
      },
      sessionHistory: previousResults.map(result => ({
        timestamp: new Date(),
        eventType: 'chain_step_result',
        data: result,
        persona: result.persona
      })),
      qualityRequirements: step.operation.requirements?.map(req => ({
        category: 'chain',
        requirement: req,
        priority: 1,
        validationMethod: 'automated'
      })) || []
    };

    return stepContext;
  }

  private calculateStepComplexity(step: ChainStep, previousResults: ChainStepResult[]): number {
    let complexity = 0.5; // Base complexity
    
    // Increase complexity based on step number
    complexity += step.stepNumber * 0.1;
    
    // Increase complexity based on previous results
    if (previousResults.length > 0) {
      const avgConfidence = previousResults.reduce((sum, result) => 
        sum + (result.result.confidence || 0), 0) / previousResults.length;
      
      if (avgConfidence < 0.7) {
        complexity += 0.2; // Low confidence in previous steps increases complexity
      }
    }
    
    return Math.min(complexity, 1.0);
  }

  private generateInsightsFromBehavior(
    persona: PersonaName,
    behaviorResult: any
  ): Insight[] {
    const insights: Insight[] = [];
    
    // Generate insights from behavior transformations
    if (behaviorResult.transformations) {
      for (const transformation of behaviorResult.transformations) {
        insights.push({
          persona,
          type: 'transformation',
          content: transformation.description,
          confidence: behaviorResult.confidence || 0.5,
          applicability: [transformation.type]
        });
      }
    }
    
    // Generate insights from recommendations
    if (behaviorResult.recommendations) {
      for (const recommendation of behaviorResult.recommendations) {
        insights.push({
          persona,
          type: 'recommendation',
          content: recommendation,
          confidence: behaviorResult.confidence || 0.5,
          applicability: ['general']
        });
      }
    }
    
    // Generate insights from optimizations
    if (behaviorResult.optimizations) {
      for (const optimization of behaviorResult.optimizations) {
        insights.push({
          persona,
          type: 'optimization',
          content: optimization.description,
          confidence: behaviorResult.confidence || 0.5,
          applicability: [optimization.type]
        });
      }
    }

    return insights;
  }

  private updateAccumulatedContext(
    accumulatedContext: any,
    stepResult: ChainStepResult
  ): any {
    return {
      ...accumulatedContext,
      [`step_${stepResult.stepNumber}`]: {
        persona: stepResult.persona,
        insights: stepResult.insights,
        confidence: stepResult.result.confidence,
        timestamp: new Date()
      },
      lastStep: {
        persona: stepResult.persona,
        insights: stepResult.insights,
        recommendations: stepResult.nextStepRecommendations
      }
    };
  }

  private async updateContextPreservation(
    chainId: string,
    stepResult: ChainStepResult
  ): Promise<void> {
    const preservation = this.contextPreservation.get(chainId);
    if (!preservation) return;

    // Update preservation with step result
    preservation.preservedInsights.push(...stepResult.insights);
    preservation.stepContexts.set(stepResult.stepNumber, stepResult);
    
    // Update preservation score
    preservation.preservationScore = this.calculatePreservationScore(preservation);
  }

  private calculatePreservationScore(preservation: ContextPreservation): number {
    let score = 0;
    
    // Score based on insights preservation
    if (preservation.preservedInsights.length > 0) {
      score += 0.3;
    }
    
    // Score based on handoff packages
    if (preservation.handoffPackages.length > 0) {
      score += 0.3;
    }
    
    // Score based on step contexts
    if (preservation.stepContexts.size > 0) {
      score += 0.2;
    }
    
    // Score based on shared state
    if (Object.keys(preservation.sharedState).length > 0) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private async prepareHandoffForNextStep(
    nextStep: ChainStep,
    currentResult: ChainStepResult,
    context: ChainContext
  ): Promise<void> {
    try {
      // Use collaboration coordinator for handoff
      await this.collaborationCoordinator.managePersonaHandoff(
        currentResult.persona,
        nextStep.persona,
        context.accumulatedContext,
        currentResult.insights
      );
    } catch (error) {
      this.logger.error('Handoff preparation failed:', error);
      // Continue execution even if handoff fails
    }
  }

  private async generateNextStepRecommendations(
    step: ChainStep,
    behaviorResult: any,
    context: ChainContext
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Generate recommendations based on current step results
    if (behaviorResult.recommendations) {
      recommendations.push(...behaviorResult.recommendations);
    }
    
    // Add context-specific recommendations
    if (context.currentStep < context.totalSteps - 1) {
      recommendations.push('Consider next step requirements');
      recommendations.push('Preserve important context for handoff');
    }
    
    return recommendations;
  }

  private groupInsightsByType(insights: Insight[]): Map<string, Insight[]> {
    const grouped = new Map<string, Insight[]>();
    
    for (const insight of insights) {
      if (!grouped.has(insight.type)) {
        grouped.set(insight.type, []);
      }
      grouped.get(insight.type)!.push(insight);
    }
    
    return grouped;
  }

  private groupInsightsByPersona(insights: Insight[]): Map<PersonaName, Insight[]> {
    const grouped = new Map<PersonaName, Insight[]>();
    
    for (const insight of insights) {
      if (!grouped.has(insight.persona)) {
        grouped.set(insight.persona, []);
      }
      grouped.get(insight.persona)!.push(insight);
    }
    
    return grouped;
  }

  private async synthesizeInsights(insights: Insight[]): Promise<Insight[]> {
    const synthesized: Insight[] = [];
    
    // Group similar insights
    const groupedByContent = new Map<string, Insight[]>();
    
    for (const insight of insights) {
      const key = insight.content.toLowerCase().substring(0, 50);
      if (!groupedByContent.has(key)) {
        groupedByContent.set(key, []);
      }
      groupedByContent.get(key)!.push(insight);
    }
    
    // Synthesize grouped insights
    for (const [_, group] of groupedByContent) {
      if (group.length > 1) {
        // Merge similar insights
        const mergedInsight: Insight = {
          persona: group[0].persona,
          type: 'synthesized',
          content: `Combined insight: ${group.map(i => i.content).join('; ')}`,
          confidence: group.reduce((sum, i) => sum + i.confidence, 0) / group.length,
          applicability: [...new Set(group.flatMap(i => i.applicability))]
        };
        synthesized.push(mergedInsight);
      } else {
        synthesized.push(group[0]);
      }
    }
    
    return synthesized;
  }

  private generateSynthesizedRecommendations(
    insights: Insight[],
    insightsByPersona: Map<PersonaName, Insight[]>
  ): string[] {
    const recommendations: string[] = [];
    
    // Generate recommendations from insights
    for (const insight of insights) {
      if (insight.type === 'recommendation') {
        recommendations.push(insight.content);
      }
    }
    
    // Generate persona-specific recommendations
    for (const [persona, personaInsights] of insightsByPersona) {
      if (personaInsights.length > 0) {
        recommendations.push(`Consider ${persona} perspective: ${personaInsights[0].content}`);
      }
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  private calculateInsightQualityMetrics(insights: Insight[]): any {
    return {
      totalInsights: insights.length,
      averageConfidence: insights.length > 0 
        ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length 
        : 0,
      insightTypes: [...new Set(insights.map(i => i.type))].length,
      personaContributions: [...new Set(insights.map(i => i.persona))].length,
      applicabilityScore: insights.reduce((sum, i) => sum + i.applicability.length, 0) / insights.length
    };
  }

  private determineNextPersona(previousResults: ChainStepResult[]): PersonaName | null {
    // This would typically be determined by the chain configuration
    // For now, return null to indicate last step
    return null;
  }

  private async getPersonaPriorities(persona: PersonaName): Promise<string[]> {
    const personaImpl = this.personas.get(persona);
    return personaImpl?.priorityHierarchy || [];
  }

  private async generateHandoffRecommendations(
    fromPersona: PersonaName,
    toPersona: PersonaName,
    insights: Insight[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Generate handoff recommendations based on persona transition
    if (fromPersona === 'analyzer' && toPersona === 'architect') {
      recommendations.push('Consider architectural implications of analysis findings');
    }
    
    if (fromPersona === 'architect' && toPersona === 'frontend') {
      recommendations.push('Implement user-facing components following architectural patterns');
    }
    
    // Add insight-based recommendations
    for (const insight of insights) {
      if (insight.type === 'recommendation') {
        recommendations.push(`From ${fromPersona}: ${insight.content}`);
      }
    }
    
    return recommendations;
  }

  private capturePersonaState(
    persona: PersonaName,
    context: PersonaContext,
    insights: Insight[]
  ): any {
    return {
      persona,
      context: {
        domain: context.domain,
        complexity: context.complexity,
        userIntent: context.userIntent
      },
      insights: insights.map(i => ({
        type: i.type,
        content: i.content,
        confidence: i.confidence
      })),
      timestamp: new Date()
    };
  }

  private cleanupChainExecution(chainId: string): void {
    this.activeChains.delete(chainId);
    
    // Keep context preservation for a while for analysis
    setTimeout(() => {
      this.contextPreservation.delete(chainId);
    }, 300000); // 5 minutes
  }
}