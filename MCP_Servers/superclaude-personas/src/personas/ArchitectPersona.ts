// SuperClaude Personas - ArchitectPersona
// Systems architecture specialist with long-term thinking focus

import { BasePersona } from './BasePersona';
import {
  PersonaStrategy,
  MCPServerPreference,
  ActivationTrigger,
  QualityStandard,
  CollaborationPattern,
  PersonaContext,
  BehaviorTransformation,
  QualityAdjustment,
  DecisionOption,
  ValidationResult,
  ValidationIssue
} from '../types';

export class ArchitectPersona extends BasePersona {
  readonly identity = "Systems architecture specialist, long-term thinking focus, scalability expert";
  readonly priorityHierarchy = [
    "Long-term maintainability",
    "Scalability",
    "Performance",
    "Security",
    "Short-term gains"
  ];

  readonly coreStrategies: PersonaStrategy[] = [
    {
      domain: "architecture",
      approach: "systems_thinking",
      decisionFramework: [
        { factor: "future_proofing", weight: 0.3, evaluationMethod: "scalability_analysis", priorityLevel: 1 },
        { factor: "dependency_management", weight: 0.25, evaluationMethod: "coupling_analysis", priorityLevel: 2 },
        { factor: "maintainability", weight: 0.25, evaluationMethod: "code_quality_metrics", priorityLevel: 1 },
        { factor: "performance", weight: 0.2, evaluationMethod: "benchmarking", priorityLevel: 3 }
      ],
      performanceMetrics: [
        { metric: "maintainability_index", target: 0.8, unit: "ratio", measurement: "code_analysis" },
        { metric: "coupling_coefficient", target: 0.3, unit: "ratio", measurement: "dependency_analysis" },
        { metric: "scalability_index", target: 0.9, unit: "ratio", measurement: "load_testing" }
      ],
      riskToleranceLevel: "low",
      optimizationFocus: [
        "architectural_clarity",
        "long_term_sustainability",
        "system_coherence",
        "scalability_patterns",
        "dependency_management"
      ]
    },
    {
      domain: "design",
      approach: "pattern_based",
      decisionFramework: [
        { factor: "design_patterns", weight: 0.4, evaluationMethod: "pattern_matching", priorityLevel: 1 },
        { factor: "system_boundaries", weight: 0.3, evaluationMethod: "boundary_analysis", priorityLevel: 2 },
        { factor: "interface_design", weight: 0.3, evaluationMethod: "api_design_review", priorityLevel: 2 }
      ],
      performanceMetrics: [
        { metric: "pattern_compliance", target: 0.9, unit: "ratio", measurement: "code_review" },
        { metric: "interface_stability", target: 0.95, unit: "ratio", measurement: "version_analysis" }
      ],
      riskToleranceLevel: "low",
      optimizationFocus: [
        "design_consistency",
        "pattern_reuse",
        "interface_stability"
      ]
    }
  ];

  readonly mcpPreferences: MCPServerPreference[] = [
    {
      serverName: "sequential",
      preference: "primary",
      useCases: ["architectural_analysis", "system_design", "complexity_assessment"],
      integrationPatterns: ["systematic_analysis", "structured_thinking"]
    },
    {
      serverName: "context7",
      preference: "secondary",
      useCases: ["architectural_patterns", "best_practices", "design_principles"],
      integrationPatterns: ["pattern_lookup", "documentation_reference"]
    },
    {
      serverName: "magic",
      preference: "avoided",
      useCases: [],
      integrationPatterns: []
    }
  ];

  readonly autoActivationTriggers: ActivationTrigger[] = [
    {
      triggerType: "keyword",
      patterns: ["architecture", "design", "scalability", "system", "structure", "patterns", "long-term"],
      confidenceThreshold: 0.8,
      combinationRules: [
        { rule: "architecture_analysis", personas: ["architect", "analyzer"], conditions: ["system analysis"], weight: 0.9 },
        { rule: "design_review", personas: ["architect", "qa"], conditions: ["design review"], weight: 0.8 }
      ]
    },
    {
      triggerType: "context",
      patterns: ["system_design", "architectural_decision", "scalability_planning"],
      confidenceThreshold: 0.7,
      combinationRules: []
    },
    {
      triggerType: "complexity",
      patterns: ["high_complexity", "system_wide", "cross_module"],
      confidenceThreshold: 0.8,
      combinationRules: []
    }
  ];

  readonly qualityStandards: QualityStandard[] = [
    {
      category: "maintainability",
      metric: "maintainability_index",
      threshold: 0.8,
      measurement: "code_analysis",
      validationMethod: "automated_metrics"
    },
    {
      category: "scalability",
      metric: "scalability_score",
      threshold: 0.9,
      measurement: "load_testing",
      validationMethod: "performance_testing"
    },
    {
      category: "coupling",
      metric: "coupling_coefficient",
      threshold: 0.3,
      measurement: "dependency_analysis",
      validationMethod: "static_analysis"
    },
    {
      category: "cohesion",
      metric: "cohesion_score",
      threshold: 0.8,
      measurement: "module_analysis",
      validationMethod: "structural_analysis"
    }
  ];

  readonly collaborationPatterns: CollaborationPattern[] = [
    {
      name: "architect_analyzer",
      personas: ["architect", "analyzer"],
      sequenceType: "sequential",
      handoffCriteria: [
        {
          trigger: "analysis_complete",
          fromPersona: "analyzer",
          toPersona: "architect",
          contextRequirements: ["root_cause", "system_impact"],
          validationRules: ["architectural_implications", "scalability_impact"]
        }
      ],
      contextMergeStrategy: "accumulate"
    },
    {
      name: "architect_security",
      personas: ["architect", "security"],
      sequenceType: "parallel",
      handoffCriteria: [
        {
          trigger: "security_review",
          fromPersona: "architect",
          toPersona: "security",
          contextRequirements: ["system_design", "data_flow"],
          validationRules: ["security_compliance", "threat_assessment"]
        }
      ],
      contextMergeStrategy: "synthesize"
    }
  ];

  // Architect-specific behavior implementations

  protected async generateBehaviorTransformations(context: PersonaContext): Promise<BehaviorTransformation[]> {
    const transformations: BehaviorTransformation[] = [];

    // Long-term thinking transformation
    transformations.push({
      type: "long_term_perspective",
      description: "Evaluate decisions for long-term maintainability and scalability",
      impact: "Prioritizes sustainable solutions over quick fixes",
      priority: 1
    });

    // Systems thinking transformation
    transformations.push({
      type: "systems_analysis",
      description: "Analyze system-wide impacts and dependencies",
      impact: "Considers broader system implications",
      priority: 2
    });

    // Pattern-based design
    if (context.complexity > 0.6) {
      transformations.push({
        type: "pattern_application",
        description: "Apply established architectural patterns",
        impact: "Leverages proven design solutions",
        priority: 3
      });
    }

    // Scalability focus
    if (context.projectContext.phase === 'production' || context.complexity > 0.7) {
      transformations.push({
        type: "scalability_optimization",
        description: "Design for horizontal and vertical scaling",
        impact: "Ensures system can handle growth",
        priority: 2
      });
    }

    return transformations;
  }

  protected async generateQualityAdjustments(context: PersonaContext): Promise<QualityAdjustment[]> {
    const adjustments: QualityAdjustment[] = [];

    // Maintainability adjustment
    adjustments.push({
      metric: "maintainability_index",
      adjustment: 0.15,
      reasoning: "Architect prioritizes long-term maintainability over short-term convenience"
    });

    // Coupling adjustment
    adjustments.push({
      metric: "coupling_coefficient",
      adjustment: -0.2,
      reasoning: "Reduce coupling for better modularity and maintainability"
    });

    // Code complexity adjustment
    if (context.complexity > 0.7) {
      adjustments.push({
        metric: "cyclomatic_complexity",
        adjustment: -0.1,
        reasoning: "Simplify complex systems through better architectural patterns"
      });
    }

    // Documentation requirement
    adjustments.push({
      metric: "documentation_coverage",
      adjustment: 0.2,
      reasoning: "Comprehensive documentation essential for long-term maintainability"
    });

    return adjustments;
  }

  protected async generateRecommendations(context: PersonaContext): Promise<string[]> {
    const recommendations: string[] = [];

    // Architecture-specific recommendations
    recommendations.push("Consider long-term maintainability in all design decisions");
    recommendations.push("Implement clear separation of concerns and modular design");
    recommendations.push("Use established architectural patterns where appropriate");

    // Context-specific recommendations
    if (context.complexity > 0.7) {
      recommendations.push("Break down complex systems into manageable components");
      recommendations.push("Implement comprehensive monitoring and observability");
    }

    if (context.projectContext.phase === 'development') {
      recommendations.push("Establish clear architectural guidelines early");
      recommendations.push("Implement automated quality gates for architectural compliance");
    }

    if (context.projectContext.phase === 'production') {
      recommendations.push("Plan for horizontal scaling and load distribution");
      recommendations.push("Implement robust error handling and recovery mechanisms");
    }

    // Domain-specific recommendations
    if (context.domain === 'performance') {
      recommendations.push("Design for performance from the ground up");
      recommendations.push("Implement caching strategies at appropriate architectural layers");
    }

    if (context.domain === 'security') {
      recommendations.push("Implement security by design principles");
      recommendations.push("Establish secure communication patterns between components");
    }

    return recommendations;
  }

  protected async calculateBehaviorConfidence(context: PersonaContext): Promise<number> {
    let confidence = 0.5; // Base confidence

    // Increase confidence for architectural domains
    if (['architecture', 'design', 'scalability', 'system'].includes(context.domain)) {
      confidence += 0.3;
    }

    // Increase confidence for complex systems
    if (context.complexity > 0.6) {
      confidence += 0.2;
    }

    // Increase confidence for long-term projects
    if (context.projectContext.phase === 'production' || context.userIntent.includes('long-term')) {
      confidence += 0.15;
    }

    // Decrease confidence for quick fixes
    if (context.userIntent.includes('quick') || context.userIntent.includes('temporary')) {
      confidence -= 0.2;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  // Architect-specific scoring methods

  protected async scorePriorityAlignment(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    let score = 0;

    // Score based on maintainability impact
    if (option.description.includes('maintainable') || option.description.includes('clean')) {
      score += 0.3;
    }

    // Score based on scalability impact
    if (option.description.includes('scalable') || option.description.includes('performance')) {
      score += 0.25;
    }

    // Score based on long-term thinking
    if (option.description.includes('sustainable') || option.description.includes('future')) {
      score += 0.25;
    }

    // Penalize quick fixes
    if (option.description.includes('quick') || option.description.includes('temporary')) {
      score -= 0.2;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  // Architect-specific validation

  async validateArchitecture(systemDesign: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Check for architectural patterns
    if (!systemDesign.patterns || systemDesign.patterns.length === 0) {
      issues.push({
        severity: "medium",
        message: "No architectural patterns identified",
        location: "system_design",
        suggestion: "Consider implementing established architectural patterns"
      });
      score -= 0.2;
    }

    // Check for modularity
    if (!systemDesign.modules || systemDesign.modules.length < 2) {
      issues.push({
        severity: "high",
        message: "Insufficient modularity in system design",
        location: "system_structure",
        suggestion: "Break system into logical modules with clear boundaries"
      });
      score -= 0.3;
    }

    // Check for scalability considerations
    if (!systemDesign.scalability_strategy) {
      issues.push({
        severity: "medium",
        message: "No scalability strategy defined",
        location: "system_design",
        suggestion: "Define horizontal and vertical scaling strategies"
      });
      score -= 0.15;
    }

    // Check for monitoring
    if (!systemDesign.monitoring) {
      issues.push({
        severity: "low",
        message: "No monitoring strategy defined",
        location: "observability",
        suggestion: "Implement comprehensive monitoring and logging"
      });
      score -= 0.1;
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push("Implement architectural review process");
      recommendations.push("Document architectural decisions and trade-offs");
      recommendations.push("Establish quality gates for architectural compliance");
    }

    return {
      isValid: issues.filter(i => i.severity === 'high').length === 0,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  // Architect-specific insight interpretation

  protected async interpretInsight(
    insight: string,
    fromPersona: string
  ): Promise<string | null> {
    const insightLower = insight.toLowerCase();

    // Interpret performance insights
    if (fromPersona === 'performance' && insightLower.includes('performance')) {
      return `Architectural consideration: ${insight} - Consider caching layers and load balancing`;
    }

    // Interpret security insights
    if (fromPersona === 'security' && insightLower.includes('security')) {
      return `Security architecture: ${insight} - Implement secure-by-design principles`;
    }

    // Interpret analyzer insights
    if (fromPersona === 'analyzer' && insightLower.includes('root cause')) {
      return `Architectural root cause: ${insight} - Consider structural changes to prevent recurrence`;
    }

    // Interpret QA insights
    if (fromPersona === 'qa' && insightLower.includes('quality')) {
      return `Quality architecture: ${insight} - Implement automated quality gates`;
    }

    // Default interpretation
    return `Architectural perspective on ${fromPersona} insight: ${insight}`;
  }

  // Architect-specific optimization generation

  protected async generateOptimizationForFocus(
    focus: string,
    operation: any
  ): Promise<import('../types').Optimization | null> {
    switch (focus) {
      case "architectural_clarity":
        return {
          type: "architectural_clarity",
          description: "Improve system architecture documentation and component boundaries",
          impact: "Better maintainability and developer understanding",
          effort: 0.6,
          priority: 1
        };

      case "long_term_sustainability":
        return {
          type: "sustainability",
          description: "Implement technical debt management and upgrade pathways",
          impact: "Reduced long-term maintenance costs and improved adaptability",
          effort: 0.8,
          priority: 1
        };

      case "system_coherence":
        return {
          type: "coherence",
          description: "Standardize interfaces and communication patterns",
          impact: "Improved system consistency and reduced integration complexity",
          effort: 0.7,
          priority: 2
        };

      case "scalability_patterns":
        return {
          type: "scalability",
          description: "Implement horizontal scaling patterns and load distribution",
          impact: "Better system performance under load and growth capability",
          effort: 0.9,
          priority: 2
        };

      case "dependency_management":
        return {
          type: "dependencies",
          description: "Reduce coupling and implement dependency injection patterns",
          impact: "Improved testability and module independence",
          effort: 0.5,
          priority: 3
        };

      default:
        return await super.generateOptimizationForFocus(focus, operation);
    }
  }
}