// SuperClaude Personas - ActivationEngine
// Intelligent persona selection and auto-activation system

import {
  RequestContext,
  ActivationAnalysis,
  PersonaScore,
  ScoreBreakdown,
  PersonaName,
  PERSONA_NAMES,
  ActivationTrigger,
  PersonaActivationDecision,
  UserHistory,
  SystemState,
  TriggerCombination
} from '../types';

import { Logger } from '../utils/Logger';
import { CacheManager } from '../utils/CacheManager';

export class ActivationEngine {
  private logger: Logger;
  private cache: CacheManager;
  
  // Keyword patterns for each persona
  private keywordMatchers: Record<PersonaName, string[]> = {
    architect: ["architecture", "design", "scalability", "system", "structure", "patterns", "long-term"],
    frontend: ["component", "responsive", "accessibility", "ui", "ux", "user", "interface", "css", "react", "vue"],
    backend: ["api", "database", "service", "reliability", "server", "endpoint", "data", "performance"],
    analyzer: ["analyze", "investigate", "root cause", "debug", "troubleshoot", "examine", "inspect"],
    security: ["vulnerability", "threat", "compliance", "secure", "authentication", "authorization", "encrypt"],
    performance: ["optimize", "performance", "bottleneck", "speed", "slow", "memory", "cpu", "benchmark"],
    qa: ["test", "quality", "validation", "edge case", "coverage", "regression", "bug", "defect"],
    refactorer: ["refactor", "cleanup", "technical debt", "maintainability", "simplify", "improve"],
    devops: ["deploy", "infrastructure", "ci/cd", "docker", "kubernetes", "monitoring", "automation"],
    mentor: ["explain", "learn", "understand", "guide", "teach", "documentation", "help", "tutorial"],
    scribe: ["document", "write", "guide", "readme", "wiki", "manual", "instructions", "content"]
  };

  // Context patterns for domain detection
  private contextPatterns: Record<string, string[]> = {
    frontend: ["*.tsx", "*.jsx", "*.vue", "*.css", "*.scss", "components/", "pages/", "styles/"],
    backend: ["*.py", "*.java", "*.go", "*.js", "*.ts", "api/", "models/", "controllers/", "services/"],
    infrastructure: ["Dockerfile", "*.yml", "*.yaml", ".github/", "terraform/", "k8s/", "docker-compose"],
    security: ["*auth*", "*security*", "*.pem", "*.key", "middleware/", "guards/"],
    documentation: ["*.md", "*.rst", "*.txt", "docs/", "README*", "CHANGELOG*", "wiki/"],
    testing: ["*.test.*", "*.spec.*", "test/", "tests/", "__tests__/", "e2e/", "integration/"]
  };

  // Combination rules for multi-persona scenarios
  private combinationRules: TriggerCombination[] = [
    {
      rule: "performance_frontend",
      personas: ["performance", "frontend"],
      conditions: ["performance issues", "ui slow", "render performance"],
      weight: 0.8
    },
    {
      rule: "security_backend",
      personas: ["security", "backend"],
      conditions: ["api security", "authentication", "data protection"],
      weight: 0.9
    },
    {
      rule: "architect_analyzer",
      personas: ["architect", "analyzer"],
      conditions: ["system design", "architecture analysis", "structural issues"],
      weight: 0.7
    },
    {
      rule: "qa_frontend",
      personas: ["qa", "frontend"],
      conditions: ["ui testing", "user experience", "accessibility testing"],
      weight: 0.6
    },
    {
      rule: "devops_security",
      personas: ["devops", "security"],
      conditions: ["secure deployment", "infrastructure security", "compliance"],
      weight: 0.8
    }
  ];

  constructor(logger: Logger, cache: CacheManager) {
    this.logger = logger;
    this.cache = cache;
  }

  /**
   * Analyze context to determine persona activation needs
   */
  async analyzeContext(context: RequestContext): Promise<ActivationAnalysis> {
    try {
      this.logger.debug('Analyzing context for persona activation', { 
        command: context.command, 
        content: context.content.substring(0, 100) 
      });

      // Check cache first
      const cacheKey = `analysis:${this.hashContext(context)}`;
      const cached = this.cache.get<ActivationAnalysis>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached analysis');
        return cached;
      }

      // Detect primary domain
      const primaryDomain = this.detectPrimaryDomain(context);
      
      // Assess complexity
      const complexity = this.assessComplexity(context);
      
      // Extract user intent
      const userIntent = this.extractUserIntent(context);
      
      // Identify collaboration opportunities
      const collaborationOpportunities = this.identifyCollaborationOpportunities(context);
      
      // Calculate persona scores
      const confidenceScores = await this.calculatePersonaScores(context);
      
      // Get top recommendations
      const recommendedPersonas = confidenceScores
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3)
        .map(score => score.persona);

      const analysis: ActivationAnalysis = {
        primaryDomain,
        complexity,
        userIntent,
        collaborationOpportunities,
        recommendedPersonas,
        confidenceScores
      };

      // Cache the result
      this.cache.set(cacheKey, analysis, 300); // 5 minutes
      
      this.logger.info('Context analysis completed', { 
        primaryDomain, 
        complexity, 
        topPersona: recommendedPersonas[0] 
      });

      return analysis;

    } catch (error) {
      this.logger.error('Context analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate confidence scores for all personas
   */
  async calculatePersonaScores(context: RequestContext): Promise<PersonaScore[]> {
    try {
      const scores: PersonaScore[] = [];

      for (const persona of PERSONA_NAMES) {
        const score = await this.calculatePersonaScore(context, persona);
        scores.push(score);
      }

      return scores.sort((a, b) => b.totalScore - a.totalScore);

    } catch (error) {
      this.logger.error('Persona score calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate score for a specific persona
   */
  async calculatePersonaScore(context: RequestContext, persona: PersonaName): Promise<PersonaScore> {
    try {
      // Keyword matching score (30% weight)
      const keywordScore = this.calculateKeywordMatch(context.content, persona) * 0.3;
      
      // Context analysis score (40% weight)
      const contextScore = this.calculateContextMatch(context, persona) * 0.4;
      
      // User history score (20% weight)
      const historyScore = this.calculateHistoryMatch(context.userHistory, persona) * 0.2;
      
      // System performance score (10% weight)
      const performanceScore = this.calculatePerformanceMatch(context.systemState, persona) * 0.1;

      const totalScore = keywordScore + contextScore + historyScore + performanceScore;
      const confidence = this.calculateConfidence(keywordScore, contextScore, historyScore, performanceScore);

      return {
        persona,
        totalScore,
        confidence,
        breakdown: {
          keywordScore,
          contextScore,
          historyScore,
          performanceScore
        }
      };

    } catch (error) {
      this.logger.error(`Score calculation failed for persona ${persona}:`, error);
      throw error;
    }
  }

  /**
   * Determine auto-activation decision
   */
  async determineAutoActivation(
    analysis: ActivationAnalysis,
    confidenceThreshold: number = 0.7
  ): Promise<PersonaActivationDecision> {
    try {
      const topPersona = analysis.recommendedPersonas[0] as PersonaName;
      const topScore = analysis.confidenceScores.find(s => s.persona === topPersona);
      
      if (!topScore) {
        throw new Error('No persona scores available');
      }

      const shouldActivate = topScore.confidence >= confidenceThreshold;
      
      const decision: PersonaActivationDecision = {
        persona: topPersona,
        confidence: topScore.confidence,
        reasoning: this.generateActivationReasoning(topScore, analysis),
        autoActivated: shouldActivate,
        overrideFlags: this.suggestOverrideFlags(analysis)
      };

      this.logger.info('Auto-activation decision made', { 
        persona: topPersona, 
        confidence: topScore.confidence, 
        activated: shouldActivate 
      });

      return decision;

    } catch (error) {
      this.logger.error('Auto-activation decision failed:', error);
      throw error;
    }
  }

  /**
   * Validate activation decision
   */
  async validateActivationDecision(
    decision: PersonaActivationDecision,
    context: RequestContext
  ): Promise<{ isValid: boolean; issues: string[]; recommendations: string[] }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check confidence threshold
      if (decision.confidence < 0.5) {
        issues.push('Low confidence score for persona activation');
        recommendations.push('Consider manual persona selection');
      }

      // Check for conflicting domains
      const conflictingDomains = this.checkDomainConflicts(decision.persona, context);
      if (conflictingDomains.length > 0) {
        issues.push(`Potential domain conflicts: ${conflictingDomains.join(', ')}`);
        recommendations.push('Consider multi-persona collaboration');
      }

      // Check resource requirements
      const resourceCheck = this.checkResourceRequirements(decision.persona, context);
      if (!resourceCheck.sufficient) {
        issues.push('Insufficient resources for persona activation');
        recommendations.push('Reduce operation scope or enable resource optimization');
      }

      // Check for collaboration opportunities
      const collaborationOpportunities = this.identifyCollaborationOpportunities(context);
      if (collaborationOpportunities.length > 1) {
        recommendations.push('Consider multi-persona coordination for better results');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      this.logger.error('Activation decision validation failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private detectPrimaryDomain(context: RequestContext): string {
    const content = context.content.toLowerCase();
    const command = context.command.toLowerCase();
    
    // Check file patterns in project context
    if (context.projectContext) {
      const framework = context.projectContext.framework?.toLowerCase();
      const language = context.projectContext.language?.toLowerCase();
      
      if (framework && ['react', 'vue', 'angular'].includes(framework)) {
        return 'frontend';
      }
      
      if (language && ['python', 'java', 'go', 'rust'].includes(language)) {
        return 'backend';
      }
    }

    // Check command patterns
    if (command.includes('analyze') || command.includes('debug')) {
      return 'analysis';
    }
    
    if (command.includes('deploy') || command.includes('build')) {
      return 'infrastructure';
    }

    // Check content patterns
    for (const [domain, patterns] of Object.entries(this.contextPatterns)) {
      if (patterns.some(pattern => content.includes(pattern.toLowerCase()))) {
        return domain;
      }
    }

    // Default to general analysis
    return 'analysis';
  }

  private assessComplexity(context: RequestContext): number {
    let complexity = 0.5; // Base complexity

    // Command complexity
    if (context.command.includes('analyze') || context.command.includes('troubleshoot')) {
      complexity += 0.2;
    }

    // Content complexity indicators
    const complexityIndicators = [
      'architecture', 'system', 'performance', 'security', 'scale',
      'optimization', 'refactor', 'migration', 'integration'
    ];

    const matches = complexityIndicators.filter(indicator => 
      context.content.toLowerCase().includes(indicator)
    );

    complexity += matches.length * 0.1;

    // Flag complexity
    if (context.flags.includes('--think') || context.flags.includes('--analyze')) {
      complexity += 0.1;
    }

    if (context.flags.includes('--think-hard') || context.flags.includes('--comprehensive')) {
      complexity += 0.2;
    }

    if (context.flags.includes('--ultrathink') || context.flags.includes('--enterprise')) {
      complexity += 0.3;
    }

    return Math.min(complexity, 1.0);
  }

  private extractUserIntent(context: RequestContext): string {
    const content = context.content.toLowerCase();
    
    // Intent patterns
    const intentPatterns: Record<string, string[]> = {
      'create': ['create', 'build', 'implement', 'develop', 'generate'],
      'analyze': ['analyze', 'review', 'examine', 'investigate', 'understand'],
      'fix': ['fix', 'resolve', 'solve', 'debug', 'troubleshoot'],
      'optimize': ['optimize', 'improve', 'enhance', 'refactor', 'cleanup'],
      'test': ['test', 'validate', 'verify', 'check', 'ensure'],
      'document': ['document', 'write', 'explain', 'describe', 'guide']
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        return intent;
      }
    }

    return 'general';
  }

  private identifyCollaborationOpportunities(context: RequestContext): string[] {
    const opportunities: string[] = [];
    const content = context.content.toLowerCase();

    // Check for multi-domain indicators
    const domainMatches = Object.entries(this.contextPatterns).filter(([_, patterns]) =>
      patterns.some(pattern => content.includes(pattern.toLowerCase()))
    );

    if (domainMatches.length > 1) {
      opportunities.push('multi-domain');
    }

    // Check combination rules
    for (const rule of this.combinationRules) {
      if (rule.conditions.some(condition => content.includes(condition))) {
        opportunities.push(rule.rule);
      }
    }

    return opportunities;
  }

  private calculateKeywordMatch(content: string, persona: PersonaName): number {
    const keywords = this.keywordMatchers[persona];
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    let totalWeight = 0;

    for (const keyword of keywords) {
      const weight = keyword.length > 6 ? 2 : 1; // Longer keywords get more weight
      totalWeight += weight;
      
      if (contentLower.includes(keyword)) {
        matches += weight;
      }
    }

    return totalWeight > 0 ? matches / totalWeight : 0;
  }

  private calculateContextMatch(context: RequestContext, persona: PersonaName): number {
    let score = 0;

    // Project context matching
    if (context.projectContext) {
      const framework = context.projectContext.framework?.toLowerCase();
      const language = context.projectContext.language?.toLowerCase();
      
      // Frontend persona context
      if (persona === 'frontend' && framework && ['react', 'vue', 'angular'].includes(framework)) {
        score += 0.4;
      }
      
      // Backend persona context
      if (persona === 'backend' && language && ['python', 'java', 'go', 'rust'].includes(language)) {
        score += 0.4;
      }
      
      // DevOps persona context
      if (persona === 'devops' && context.projectContext.environment === 'production') {
        score += 0.3;
      }
    }

    // Command context matching
    const commandPersonaMap: Record<string, PersonaName[]> = {
      'analyze': ['analyzer', 'architect'],
      'build': ['architect', 'devops'],
      'test': ['qa', 'performance'],
      'deploy': ['devops', 'security'],
      'document': ['scribe', 'mentor'],
      'optimize': ['performance', 'refactorer']
    };

    for (const [command, personas] of Object.entries(commandPersonaMap)) {
      if (context.command.includes(command) && personas.includes(persona)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  private calculateHistoryMatch(history: UserHistory, persona: PersonaName): number {
    if (!history || !history.personaPreferences) {
      return 0.5; // Neutral score
    }

    const preference = history.personaPreferences.find(p => p.persona === persona);
    if (!preference) {
      return 0.5;
    }

    // Recent preferences get higher weight
    const ageInDays = (Date.now() - preference.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const ageWeight = Math.max(0, 1 - ageInDays / 30); // Decay over 30 days

    return preference.preference * ageWeight;
  }

  private calculatePerformanceMatch(systemState: SystemState, persona: PersonaName): number {
    if (!systemState || !systemState.performance) {
      return 0.5; // Neutral score
    }

    const performance = systemState.performance;
    
    // Performance persona should activate when performance is poor
    if (persona === 'performance') {
      if (performance.responseTime > 1000 || performance.cpuUsage > 80 || performance.memoryUsage > 80) {
        return 0.9;
      }
    }

    // Security persona should activate when error rate is high
    if (persona === 'security' && performance.errorRate > 0.05) {
      return 0.8;
    }

    return 0.5;
  }

  private calculateConfidence(
    keywordScore: number,
    contextScore: number,
    historyScore: number,
    performanceScore: number
  ): number {
    // Weighted confidence calculation
    const weights = [0.3, 0.4, 0.2, 0.1];
    const scores = [keywordScore, contextScore, historyScore, performanceScore];
    
    const weightedSum = scores.reduce((sum, score, index) => sum + score * weights[index], 0);
    
    // Apply confidence boost for strong matches
    let confidence = weightedSum;
    
    if (keywordScore > 0.8 && contextScore > 0.6) {
      confidence += 0.1;
    }
    
    if (historyScore > 0.8) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  private generateActivationReasoning(score: PersonaScore, analysis: ActivationAnalysis): string {
    const reasons: string[] = [];
    
    if (score.breakdown.keywordScore > 0.7) {
      reasons.push('Strong keyword match');
    }
    
    if (score.breakdown.contextScore > 0.7) {
      reasons.push('Excellent context alignment');
    }
    
    if (score.breakdown.historyScore > 0.7) {
      reasons.push('Matches user preferences');
    }
    
    if (analysis.complexity > 0.7) {
      reasons.push('High complexity task');
    }

    return reasons.join(', ') || 'General suitability';
  }

  private suggestOverrideFlags(analysis: ActivationAnalysis): string[] {
    const flags: string[] = [];
    
    if (analysis.complexity > 0.8) {
      flags.push('--think-hard');
    }
    
    if (analysis.collaborationOpportunities.length > 1) {
      flags.push('--multi-persona');
    }
    
    if (analysis.primaryDomain === 'frontend') {
      flags.push('--magic');
    }
    
    if (analysis.primaryDomain === 'analysis') {
      flags.push('--seq');
    }

    return flags;
  }

  private checkDomainConflicts(persona: PersonaName, context: RequestContext): string[] {
    const conflicts: string[] = [];
    
    // Example conflict checks
    if (persona === 'frontend' && context.projectContext?.language === 'python') {
      conflicts.push('backend-language');
    }
    
    if (persona === 'security' && context.command.includes('ui')) {
      conflicts.push('ui-security-mismatch');
    }

    return conflicts;
  }

  private checkResourceRequirements(persona: PersonaName, context: RequestContext): { sufficient: boolean; required: string[] } {
    const required: string[] = [];
    
    // Resource requirements by persona
    const resourceMap: Record<PersonaName, string[]> = {
      performance: ['high-cpu', 'benchmarking-tools'],
      security: ['security-scanners', 'compliance-tools'],
      architect: ['modeling-tools', 'analysis-frameworks'],
      analyzer: ['debugging-tools', 'log-analysis'],
      qa: ['testing-frameworks', 'coverage-tools'],
      devops: ['deployment-tools', 'monitoring'],
      frontend: ['ui-frameworks', 'design-tools'],
      backend: ['database-tools', 'api-frameworks'],
      refactorer: ['code-analysis', 'refactoring-tools'],
      mentor: ['documentation-tools', 'example-libraries'],
      scribe: ['writing-tools', 'localization']
    };

    required.push(...(resourceMap[persona] || []));

    // For now, assume all resources are sufficient
    return { sufficient: true, required };
  }

  private hashContext(context: RequestContext): string {
    const hash = Buffer.from(JSON.stringify({
      command: context.command,
      content: context.content.substring(0, 200),
      flags: context.flags
    })).toString('base64');
    
    return hash.substring(0, 16);
  }
}