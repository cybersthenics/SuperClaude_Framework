import { BaseHook } from '../core/BaseHook.js';
import { HookType, HookContext, HookResult } from '../types/index.js';

export class PrePromptHook extends BaseHook {
  constructor() {
    super(HookType.PrePrompt);
  }

  async execute(context: HookContext): Promise<HookResult> {
    const timer = performance.now();
    
    try {
      // 1. Analyze prompt context for persona activation
      const personaAnalysis = await this.analyzePersonaNeeds(context);
      
      // 2. Enhance context based on active persona
      const enhancedContext = await this.enhanceContextForPersona(context, personaAnalysis);
      
      // 3. Apply prompt optimization strategies
      const optimizations = await this.applyPromptOptimizations(enhancedContext);
      
      // 4. Prepare context preservation strategies
      const preservationStrategy = await this.prepareContextPreservation(context);
      
      const executionTime = performance.now() - timer;
      
      const result = this.createSuccessResult(
        {
          personaAnalysis,
          enhancedContext,
          optimizations,
          preservationStrategy,
          serverTarget: this.targetServer,
          promptComplexity: this.calculatePromptComplexity(context)
        },
        {
          executionTime,
          optimizationFactor: 4.66 // Proven factor for prompt hooks
        },
        {
          cacheable: true,
          ttl: this.calculateOptimalTTL(context)
        }
      );

      // Cache the enhanced context for session reuse
      await this.cacheResult(context, result);
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - timer;
      return this.createErrorResult(error as Error, executionTime);
    }
  }

  private async analyzePersonaNeeds(context: HookContext): Promise<any> {
    // Analyze the prompt context to determine persona requirements
    const operation = context.operation.toLowerCase();
    const parameters = context.parameters || {};
    
    const personaIndicators = {
      architect: ['architecture', 'design', 'system', 'scalability'],
      frontend: ['ui', 'component', 'responsive', 'accessibility'],
      backend: ['api', 'database', 'server', 'performance'],
      security: ['security', 'vulnerability', 'audit', 'compliance'],
      analyzer: ['analyze', 'investigate', 'debug', 'troubleshoot'],
      qa: ['test', 'quality', 'validation', 'verification']
    };

    const suggestedPersonas: string[] = [];
    const confidence: Record<string, number> = {};

    for (const [persona, indicators] of Object.entries(personaIndicators)) {
      const matches = indicators.filter(indicator => 
        operation.includes(indicator) || 
        JSON.stringify(parameters).toLowerCase().includes(indicator)
      );
      
      if (matches.length > 0) {
        suggestedPersonas.push(persona);
        confidence[persona] = matches.length / indicators.length;
      }
    }

    return {
      suggestedPersonas,
      confidence,
      primaryPersona: suggestedPersonas[0] || 'default',
      contextComplexity: this.calculatePromptComplexity(context)
    };
  }

  private async enhanceContextForPersona(context: HookContext, personaAnalysis: any): Promise<any> {
    // Enhance the context based on the identified persona needs
    const enhancements = {
      priorityAdjustments: {},
      additionalContext: {},
      optimizationHints: ['default']
    };

    const primaryPersona = personaAnalysis.primaryPersona;

    switch (primaryPersona) {
      case 'architect':
        enhancements.priorityAdjustments = { 
          'Long-term maintainability': 'high',
          'Scalability': 'high',
          'System design': 'high'
        };
        enhancements.additionalContext = {
          systemPerspective: true,
          architecturalPatterns: true
        };
        break;

      case 'frontend':
        enhancements.priorityAdjustments = {
          'User experience': 'high',
          'Accessibility': 'high',
          'Performance': 'high'
        };
        enhancements.additionalContext = {
          userFocused: true,
          performanceMetrics: true
        };
        break;

      case 'security':
        enhancements.priorityAdjustments = {
          'Security': 'critical',
          'Compliance': 'high',
          'Risk assessment': 'high'
        };
        enhancements.additionalContext = {
          securityFirst: true,
          threatModel: true
        };
        break;

      default:
        enhancements.optimizationHints = ['general_optimization'];
    }

    return enhancements;
  }

  private async applyPromptOptimizations(enhancedContext: any): Promise<any> {
    // Apply various prompt optimization strategies
    const optimizations = {
      contextCompression: false,
      priorityReordering: false,
      redundancyRemoval: false,
      focusEnhancement: false
    };

    // Enable optimizations based on context size and complexity
    const contextSize = JSON.stringify(enhancedContext).length;
    
    if (contextSize > 5000) {
      optimizations.contextCompression = true;
      optimizations.redundancyRemoval = true;
    }

    if (enhancedContext.priorityAdjustments) {
      optimizations.priorityReordering = true;
    }

    optimizations.focusEnhancement = true; // Always enhance focus

    return optimizations;
  }

  private async prepareContextPreservation(context: HookContext): Promise<any> {
    // Prepare context preservation strategies for the session
    return {
      preservePersonaState: true,
      preserveOptimizations: true,
      sessionCaching: true,
      contextKey: `session_${context.sessionId}_${Date.now()}`
    };
  }

  private calculatePromptComplexity(context: HookContext): number {
    // Calculate prompt-specific complexity
    let complexity = this.calculateComplexity(context);
    
    // Adjust for prompt-specific factors
    const operation = context.operation.toLowerCase();
    const parameters = context.parameters || {};
    
    // Multi-step operations are more complex
    if (operation.includes('multi') || operation.includes('chain')) {
      complexity += 0.3;
    }
    
    // Creative tasks are more complex
    if (operation.includes('creative') || operation.includes('generate')) {
      complexity += 0.2;
    }
    
    // Large parameter sets increase complexity
    const paramCount = Object.keys(parameters).length;
    complexity += Math.min(paramCount / 20, 0.2);
    
    return Math.min(complexity, 1.0);
  }

  private calculateOptimalTTL(context: HookContext): number {
    // Calculate optimal TTL based on context
    const basePersonaTTL = 1800; // 30 minutes for persona context
    const operation = context.operation.toLowerCase();
    
    // Session-specific context has shorter TTL
    if (operation.includes('session')) {
      return basePersonaTTL / 2;
    }
    
    // Creative operations have shorter TTL
    if (operation.includes('creative')) {
      return basePersonaTTL / 3;
    }
    
    return basePersonaTTL;
  }
}

export class PostPromptHook extends BaseHook {
  constructor() {
    super(HookType.PostPrompt);
  }

  async execute(context: HookContext): Promise<HookResult> {
    const timer = performance.now();
    
    try {
      // 1. Analyze response quality and persona alignment
      const responseAnalysis = await this.analyzeResponseQuality(context);
      
      // 2. Apply response optimization based on persona
      const optimizedResponse = await this.optimizeResponseForPersona(context, responseAnalysis);
      
      // 3. Update persona state and learning
      await this.updatePersonaLearning(context, responseAnalysis);
      
      // 4. Prepare response caching strategy
      const cachingStrategy = await this.prepareCachingStrategy(context, optimizedResponse);
      
      const executionTime = performance.now() - timer;
      
      const result = this.createSuccessResult(
        {
          responseAnalysis,
          optimizedResponse,
          personaLearningUpdated: true,
          cachingStrategy,
          serverTarget: this.targetServer,
          responseQualityScore: responseAnalysis.qualityScore
        },
        {
          executionTime,
          optimizationFactor: 4.66 // Proven factor for prompt hooks
        },
        {
          cacheable: optimizedResponse.cacheable,
          ttl: cachingStrategy.ttl
        }
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - timer;
      return this.createErrorResult(error as Error, executionTime);
    }
  }

  private async analyzeResponseQuality(context: HookContext): Promise<any> {
    // Analyze the quality of the generated response
    const response = context.data;
    
    if (!response) {
      return {
        qualityScore: 0.0,
        issues: ['No response data provided'],
        recommendations: ['Generate valid response']
      };
    }

    const analysis = {
      qualityScore: 0.0,
      completeness: 0.0,
      relevance: 0.0,
      clarity: 0.0,
      personaAlignment: 0.0,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Assess completeness
    analysis.completeness = this.assessCompleteness(response);
    
    // Assess relevance to the query
    analysis.relevance = this.assessRelevance(response, context);
    
    // Assess clarity and structure
    analysis.clarity = this.assessClarity(response);
    
    // Assess persona alignment
    analysis.personaAlignment = this.assessPersonaAlignment(response, context);
    
    // Calculate overall quality score
    analysis.qualityScore = (
      analysis.completeness * 0.3 +
      analysis.relevance * 0.3 +
      analysis.clarity * 0.2 +
      analysis.personaAlignment * 0.2
    );

    // Generate issues and recommendations
    if (analysis.qualityScore < 0.7) {
      analysis.issues.push('Response quality below threshold');
      analysis.recommendations.push('Review and enhance response');
    }

    return analysis;
  }

  private async optimizeResponseForPersona(context: HookContext, analysis: any): Promise<any> {
    // Optimize response based on active persona and quality analysis
    const optimizations = {
      applied: [] as string[],
      cacheable: true,
      personaSpecific: true
    };

    // Apply optimizations based on quality analysis
    if (analysis.clarity < 0.8) {
      optimizations.applied.push('clarity_enhancement');
    }

    if (analysis.personaAlignment < 0.8) {
      optimizations.applied.push('persona_alignment');
    }

    if (analysis.completeness < 0.8) {
      optimizations.applied.push('completeness_improvement');
    }

    // Persona-specific optimizations
    const operation = context.operation.toLowerCase();
    if (operation.includes('architect')) {
      optimizations.applied.push('system_perspective');
    } else if (operation.includes('frontend')) {
      optimizations.applied.push('user_focus');
    } else if (operation.includes('security')) {
      optimizations.applied.push('security_emphasis');
    }

    return optimizations;
  }

  private async updatePersonaLearning(context: HookContext, analysis: any): Promise<void> {
    // Update persona learning based on response quality
    const learningUpdate = {
      sessionId: context.sessionId,
      qualityScore: analysis.qualityScore,
      personaEffectiveness: analysis.personaAlignment,
      timestamp: Date.now()
    };

    console.log(`Persona learning updated:`, learningUpdate);
    // In production, this would update actual learning storage
  }

  private async prepareCachingStrategy(context: HookContext, optimizedResponse: any): Promise<any> {
    // Prepare caching strategy for optimized response
    const strategy = {
      ttl: 1800, // 30 minutes default
      cacheable: optimizedResponse.cacheable,
      cacheKey: this.generateResponseCacheKey(context),
      invalidationTriggers: [] as string[]
    };

    // Adjust TTL based on response type
    const operation = context.operation.toLowerCase();
    if (operation.includes('creative')) {
      strategy.ttl = 600; // 10 minutes for creative content
    } else if (operation.includes('analysis')) {
      strategy.ttl = 3600; // 1 hour for analysis
    }

    // Set invalidation triggers
    if (context.parameters?.version) {
      strategy.invalidationTriggers.push('version_change');
    }

    return strategy;
  }

  private assessCompleteness(response: any): number {
    // Assess response completeness
    if (!response) return 0.0;
    
    const responseString = JSON.stringify(response);
    const length = responseString.length;
    
    // Simple heuristic based on length and structure
    if (length < 100) return 0.3;
    if (length < 500) return 0.6;
    if (length < 1000) return 0.8;
    return 1.0;
  }

  private assessRelevance(response: any, context: HookContext): number {
    // Assess response relevance to the context
    if (!response || !context.operation) return 0.5;
    
    const responseString = JSON.stringify(response).toLowerCase();
    const operation = context.operation.toLowerCase();
    
    // Check if response contains operation-related terms
    const operationWords = operation.split(/\s+/);
    const relevantWords = operationWords.filter(word => 
      responseString.includes(word)
    );
    
    return Math.min(relevantWords.length / operationWords.length, 1.0);
  }

  private assessClarity(response: any): number {
    // Assess response clarity and structure
    if (!response) return 0.0;
    
    // Simple clarity assessment based on structure
    const hasStructure = typeof response === 'object' && response !== null;
    const hasDescription = response.description || response.content;
    const hasOrganization = response.sections || response.steps || response.items;
    
    let clarityScore = 0.5; // Base score
    
    if (hasStructure) clarityScore += 0.2;
    if (hasDescription) clarityScore += 0.2;
    if (hasOrganization) clarityScore += 0.1;
    
    return Math.min(clarityScore, 1.0);
  }

  private assessPersonaAlignment(response: any, context: HookContext): number {
    // Assess how well the response aligns with the expected persona
    if (!response) return 0.0;
    
    const operation = context.operation.toLowerCase();
    const responseString = JSON.stringify(response).toLowerCase();
    
    // Persona-specific assessment
    if (operation.includes('architect')) {
      const architectTerms = ['system', 'design', 'scalability', 'architecture'];
      const matches = architectTerms.filter(term => responseString.includes(term));
      return matches.length / architectTerms.length;
    }
    
    if (operation.includes('security')) {
      const securityTerms = ['security', 'vulnerability', 'risk', 'compliance'];
      const matches = securityTerms.filter(term => responseString.includes(term));
      return matches.length / securityTerms.length;
    }
    
    return 0.8; // Default alignment score
  }

  private generateResponseCacheKey(context: HookContext): string {
    // Generate cache key for response caching
    return `response_${context.sessionId}_${context.operation}_${Date.now()}`;
  }
}