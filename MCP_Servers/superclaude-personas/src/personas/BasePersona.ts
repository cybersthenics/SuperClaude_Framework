// SuperClaude Personas - BasePersona
// Abstract base class for all persona implementations

import {
  PersonaImplementation,
  PersonaStrategy,
  MCPServerPreference,
  ActivationTrigger,
  QualityStandard,
  CollaborationPattern,
  PersonaContext,
  BehaviorResult,
  BehaviorTransformation,
  QualityAdjustment,
  Optimization,
  DecisionResult,
  DecisionOption,
  Operation,
  ExpertiseContribution,
  ExpertiseApplicationResult,
  DecisionContext,
  ValidationResult,
  ValidationIssue
} from '../types';

export abstract class BasePersona implements PersonaImplementation {
  abstract readonly identity: string;
  abstract readonly priorityHierarchy: string[];
  abstract readonly coreStrategies: PersonaStrategy[];
  abstract readonly mcpPreferences: MCPServerPreference[];
  abstract readonly autoActivationTriggers: ActivationTrigger[];
  abstract readonly qualityStandards: QualityStandard[];
  abstract readonly collaborationPatterns: CollaborationPattern[];

  /**
   * Apply persona-specific behavior to context
   */
  async applyBehavior(context: PersonaContext): Promise<BehaviorResult> {
    try {
      // Apply persona-specific transformations
      const transformations = await this.generateBehaviorTransformations(context);
      
      // Apply quality adjustments
      const qualityAdjustments = await this.generateQualityAdjustments(context);
      
      // Calculate confidence based on context match
      const confidence = await this.calculateBehaviorConfidence(context);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(context);
      
      // Generate optimizations
      const optimizations = await this.generateOptimizations(context);

      return {
        transformations,
        qualityAdjustments,
        confidence,
        recommendations,
        optimizations
      };
    } catch (error) {
      // Return minimal behavior result on error
      return {
        transformations: [],
        qualityAdjustments: [],
        confidence: 0.5,
        recommendations: [],
        optimizations: []
      };
    }
  }

  /**
   * Make a decision based on options and context
   */
  async makeDecision(options: DecisionOption[], context: PersonaContext): Promise<DecisionResult> {
    try {
      // Score options based on persona priorities
      const scoredOptions = await this.scoreOptions(options, context);
      
      // Select best option
      const selectedOption = scoredOptions[0];
      
      // Generate reasoning
      const reasoning = await this.generateDecisionReasoning(selectedOption, scoredOptions, context);
      
      // Calculate confidence
      const confidence = await this.calculateDecisionConfidence(selectedOption, context);
      
      // Generate alternatives
      const alternativeRecommendations = scoredOptions.slice(1, 3).map(option => option.id);

      return {
        selectedOption: selectedOption.id,
        reasoning,
        confidence,
        alternativeRecommendations
      };
    } catch (error) {
      // Return default decision on error
      return {
        selectedOption: options[0]?.id || 'default',
        reasoning: 'Error occurred during decision making',
        confidence: 0.3,
        alternativeRecommendations: []
      };
    }
  }

  /**
   * Transform operation based on persona behavior
   */
  async transformOperation(operation: Operation, behaviorResult: BehaviorResult): Promise<Operation> {
    const transformedOperation = { ...operation };

    // Apply behavior transformations
    for (const transformation of behaviorResult.transformations) {
      transformedOperation.parameters = await this.applyTransformation(
        transformedOperation.parameters,
        transformation
      );
    }

    // Apply quality adjustments
    for (const adjustment of behaviorResult.qualityAdjustments) {
      transformedOperation.requirements = await this.applyQualityAdjustment(
        transformedOperation.requirements || [],
        adjustment
      );
    }

    return transformedOperation;
  }

  /**
   * Generate optimizations for operation
   */
  async generateOptimizations(operation: Operation | PersonaContext): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Get persona-specific optimization strategies
    const strategies = this.coreStrategies.filter(s => s.optimizationFocus.length > 0);

    for (const strategy of strategies) {
      for (const focus of strategy.optimizationFocus) {
        const optimization = await this.generateOptimizationForFocus(focus, operation);
        if (optimization) {
          optimizations.push(optimization);
        }
      }
    }

    return optimizations;
  }

  /**
   * Receive and apply expertise from another persona
   */
  async receiveExpertise(
    expertise: ExpertiseContribution,
    fromPersona: string
  ): Promise<ExpertiseApplicationResult> {
    try {
      // Check if expertise is applicable to this persona
      const applicabilityScore = await this.calculateExpertiseApplicability(expertise);
      
      if (applicabilityScore < 0.5) {
        return {
          applied: false,
          modifications: [],
          reasoning: 'Expertise not applicable to this persona domain',
          confidence: applicabilityScore
        };
      }

      // Apply expertise insights
      const modifications = await this.applyExpertiseInsights(expertise);
      
      // Generate reasoning
      const reasoning = await this.generateExpertiseApplicationReasoning(expertise, modifications);

      return {
        applied: true,
        modifications,
        reasoning,
        confidence: applicabilityScore
      };
    } catch (error) {
      return {
        applied: false,
        modifications: [],
        reasoning: 'Error applying expertise',
        confidence: 0.3
      };
    }
  }

  /**
   * Apply context to priorities
   */
  async applyContextToPriorities(
    priorities: string[],
    context: DecisionContext
  ): Promise<string[]> {
    try {
      // Score priorities based on context
      const scoredPriorities = await this.scorePrioritiesForContext(priorities, context);
      
      // Return reordered priorities
      return scoredPriorities.map(p => p.priority);
    } catch (error) {
      // Return original priorities on error
      return priorities;
    }
  }

  // Protected methods for subclasses to implement

  protected abstract generateBehaviorTransformations(context: PersonaContext): Promise<BehaviorTransformation[]>;
  protected abstract generateQualityAdjustments(context: PersonaContext): Promise<QualityAdjustment[]>;
  protected abstract generateRecommendations(context: PersonaContext): Promise<string[]>;
  protected abstract calculateBehaviorConfidence(context: PersonaContext): Promise<number>;

  // Protected helper methods

  protected async scoreOptions(
    options: DecisionOption[],
    context: PersonaContext
  ): Promise<DecisionOption[]> {
    const scoredOptions: Array<DecisionOption & { score: number }> = [];

    for (const option of options) {
      const score = await this.calculateOptionScore(option, context);
      scoredOptions.push({ ...option, score });
    }

    return scoredOptions.sort((a, b) => b.score - a.score);
  }

  protected async calculateOptionScore(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    let score = 0;

    // Score based on persona priorities
    const priorityScore = await this.scorePriorityAlignment(option, context);
    score += priorityScore * 0.4;

    // Score based on risk tolerance
    const riskScore = await this.scoreRiskTolerance(option);
    score += riskScore * 0.3;

    // Score based on complexity
    const complexityScore = await this.scoreComplexity(option, context);
    score += complexityScore * 0.2;

    // Score based on domain fit
    const domainScore = await this.scoreDomainFit(option, context);
    score += domainScore * 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  protected async scorePriorityAlignment(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    // Default implementation - subclasses should override
    return 0.5;
  }

  protected async scoreRiskTolerance(option: DecisionOption): Promise<number> {
    // Get persona's risk tolerance
    const strategy = this.coreStrategies.find(s => s.domain === 'risk');
    const tolerance = strategy?.riskToleranceLevel || 'medium';

    switch (tolerance) {
      case 'low':
        return 1 - option.riskLevel; // Prefer low risk
      case 'high':
        return option.riskLevel; // Prefer high risk
      default:
        return 0.5; // Neutral
    }
  }

  protected async scoreComplexity(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    // Prefer options that match context complexity
    const complexityDiff = Math.abs(context.complexity - option.implementationComplexity);
    return 1 - complexityDiff;
  }

  protected async scoreDomainFit(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    // Check if option fits persona's domain
    const domainMatch = this.coreStrategies.some(s => s.domain === context.domain);
    return domainMatch ? 1 : 0.5;
  }

  protected async generateDecisionReasoning(
    selectedOption: DecisionOption,
    allOptions: DecisionOption[],
    context: PersonaContext
  ): Promise<string> {
    const reasons: string[] = [];

    // Priority-based reasoning
    if (selectedOption.pros.length > 0) {
      reasons.push(`Aligns with key advantages: ${selectedOption.pros.slice(0, 2).join(', ')}`);
    }

    // Risk-based reasoning
    if (selectedOption.riskLevel < 0.3) {
      reasons.push('Low risk option preferred');
    } else if (selectedOption.riskLevel > 0.7) {
      reasons.push('High risk accepted for potential benefits');
    }

    // Complexity reasoning
    if (selectedOption.implementationComplexity < 0.3) {
      reasons.push('Simple implementation preferred');
    } else if (selectedOption.implementationComplexity > 0.7) {
      reasons.push('Complex implementation justified by requirements');
    }

    return reasons.join('; ') || 'Selected based on persona priorities';
  }

  protected async calculateDecisionConfidence(
    selectedOption: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    let confidence = 0.5;

    // Increase confidence for domain alignment
    if (this.coreStrategies.some(s => s.domain === context.domain)) {
      confidence += 0.2;
    }

    // Increase confidence for clear advantages
    if (selectedOption.pros.length > selectedOption.cons.length) {
      confidence += 0.2;
    }

    // Decrease confidence for high risk
    if (selectedOption.riskLevel > 0.7) {
      confidence -= 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  protected async applyTransformation(
    parameters: any,
    transformation: BehaviorTransformation
  ): Promise<any> {
    // Default implementation - subclasses should override for specific transformations
    return parameters;
  }

  protected async applyQualityAdjustment(
    requirements: string[],
    adjustment: QualityAdjustment
  ): Promise<string[]> {
    // Add quality-specific requirement
    return [...requirements, `${adjustment.metric}: ${adjustment.reasoning}`];
  }

  protected async generateOptimizationForFocus(
    focus: string,
    operation: Operation | PersonaContext
  ): Promise<Optimization | null> {
    // Default implementation - subclasses should override
    return {
      type: focus,
      description: `Optimize for ${focus}`,
      impact: 'Medium',
      effort: 0.5,
      priority: 1
    };
  }

  protected async calculateExpertiseApplicability(
    expertise: ExpertiseContribution
  ): Promise<number> {
    // Check domain overlap
    const domainMatch = this.coreStrategies.some(s => s.domain === expertise.domain);
    
    if (domainMatch) {
      return Math.min(expertise.confidence + 0.2, 1);
    }
    
    // Check for related domains
    const relatedDomains = this.getRelatedDomains(expertise.domain);
    if (relatedDomains.length > 0) {
      return Math.min(expertise.confidence, 0.8);
    }
    
    return Math.min(expertise.confidence, 0.5);
  }

  protected async applyExpertiseInsights(
    expertise: ExpertiseContribution
  ): Promise<string[]> {
    const modifications: string[] = [];

    // Apply insights based on persona's interpretation
    for (const insight of expertise.insights) {
      const modification = await this.interpretInsight(insight, expertise.fromPersona);
      if (modification) {
        modifications.push(modification);
      }
    }

    return modifications;
  }

  protected async interpretInsight(
    insight: string,
    fromPersona: string
  ): Promise<string | null> {
    // Default interpretation - subclasses should override
    return `Incorporated ${fromPersona} insight: ${insight}`;
  }

  protected async generateExpertiseApplicationReasoning(
    expertise: ExpertiseContribution,
    modifications: string[]
  ): Promise<string> {
    return `Applied ${expertise.insights.length} insights from ${expertise.fromPersona} ` +
           `with ${modifications.length} modifications based on persona priorities`;
  }

  protected async scorePrioritiesForContext(
    priorities: string[],
    context: DecisionContext
  ): Promise<Array<{ priority: string; score: number }>> {
    const scored: Array<{ priority: string; score: number }> = [];

    for (const priority of priorities) {
      const score = await this.calculatePriorityContextScore(priority, context);
      scored.push({ priority, score });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  protected async calculatePriorityContextScore(
    priority: string,
    context: DecisionContext
  ): Promise<number> {
    let score = 0.5; // Base score

    // Check if priority matches context objectives
    if (context.objectives.some(obj => obj.toLowerCase().includes(priority.toLowerCase()))) {
      score += 0.3;
    }

    // Check if priority addresses constraints
    if (context.constraints.some(constraint => 
      constraint.toLowerCase().includes(priority.toLowerCase())
    )) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  protected getRelatedDomains(domain: string): string[] {
    const domainRelations: Record<string, string[]> = {
      'frontend': ['ui', 'ux', 'design', 'accessibility'],
      'backend': ['api', 'database', 'performance', 'security'],
      'security': ['backend', 'compliance', 'authentication'],
      'performance': ['backend', 'frontend', 'optimization'],
      'architecture': ['design', 'scalability', 'patterns']
    };

    return domainRelations[domain] || [];
  }

  // Validation methods that can be overridden by specific personas

  async validatePerformance?(metrics: any): Promise<ValidationResult> {
    return {
      isValid: true,
      score: 0.5,
      issues: [],
      recommendations: []
    };
  }

  async validateReliability?(system: any): Promise<ValidationResult> {
    return {
      isValid: true,
      score: 0.5,
      issues: [],
      recommendations: []
    };
  }

  async validateQuality?(metrics: any): Promise<ValidationResult> {
    return {
      isValid: true,
      score: 0.5,
      issues: [],
      recommendations: []
    };
  }

  async assessThreat?(threat: any): Promise<any> {
    return {
      riskLevel: 'unknown',
      recommendations: ['Consult security persona for detailed assessment']
    };
  }

  async investigateIssue?(problem: any): Promise<any> {
    return {
      rootCause: 'unknown',
      recommendations: ['Consult analyzer persona for detailed investigation']
    };
  }

  async createLearningPath?(topic: any, userLevel: any): Promise<any> {
    return {
      path: ['Basic understanding', 'Intermediate concepts', 'Advanced applications'],
      recommendations: ['Consult mentor persona for detailed learning path']
    };
  }

  async localizeContent?(content: any, targetLanguage: string): Promise<any> {
    return {
      localizedContent: content,
      recommendations: ['Consult scribe persona for proper localization']
    };
  }
}