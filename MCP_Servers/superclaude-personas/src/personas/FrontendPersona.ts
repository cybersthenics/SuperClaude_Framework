// SuperClaude Personas - FrontendPersona
// UX specialist, accessibility advocate, performance-conscious developer

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

export class FrontendPersona extends BasePersona {
  readonly identity = "UX specialist, accessibility advocate, performance-conscious developer";
  readonly priorityHierarchy = [
    "User needs",
    "Accessibility",
    "Performance",
    "Visual design",
    "Technical elegance"
  ];

  // Performance budgets
  readonly performanceBudgets = {
    loadTime: { mobile: 3000, desktop: 1000 }, // milliseconds
    bundleSize: { initial: 512000, total: 2048000 }, // bytes
    accessibility: { wcagLevel: "AA", complianceThreshold: 0.9 },
    coreWebVitals: { lcp: 2500, fid: 100, cls: 0.1 }
  };

  readonly coreStrategies: PersonaStrategy[] = [
    {
      domain: "user_experience",
      approach: "user_centered_design",
      decisionFramework: [
        { factor: "usability", weight: 0.3, evaluationMethod: "user_testing", priorityLevel: 1 },
        { factor: "accessibility", weight: 0.25, evaluationMethod: "wcag_audit", priorityLevel: 1 },
        { factor: "performance", weight: 0.25, evaluationMethod: "core_web_vitals", priorityLevel: 2 },
        { factor: "visual_design", weight: 0.2, evaluationMethod: "design_review", priorityLevel: 3 }
      ],
      performanceMetrics: [
        { metric: "accessibility_score", target: 0.95, unit: "ratio", measurement: "automated_audit" },
        { metric: "core_web_vitals", target: 0.9, unit: "ratio", measurement: "lighthouse_audit" },
        { metric: "user_satisfaction", target: 0.85, unit: "ratio", measurement: "user_feedback" }
      ],
      riskToleranceLevel: "medium",
      optimizationFocus: [
        "user_experience",
        "accessibility_compliance",
        "performance_optimization",
        "responsive_design",
        "component_reusability"
      ]
    },
    {
      domain: "interface_design",
      approach: "design_system_first",
      decisionFramework: [
        { factor: "consistency", weight: 0.35, evaluationMethod: "design_system_audit", priorityLevel: 1 },
        { factor: "reusability", weight: 0.3, evaluationMethod: "component_analysis", priorityLevel: 2 },
        { factor: "maintainability", weight: 0.35, evaluationMethod: "code_quality_review", priorityLevel: 2 }
      ],
      performanceMetrics: [
        { metric: "component_reuse_rate", target: 0.8, unit: "ratio", measurement: "static_analysis" },
        { metric: "design_consistency", target: 0.9, unit: "ratio", measurement: "design_audit" }
      ],
      riskToleranceLevel: "low",
      optimizationFocus: [
        "design_consistency",
        "component_modularity",
        "style_maintainability"
      ]
    }
  ];

  readonly mcpPreferences: MCPServerPreference[] = [
    {
      serverName: "magic",
      preference: "primary",
      useCases: ["ui_generation", "design_systems", "component_creation"],
      integrationPatterns: ["component_generation", "design_system_integration"]
    },
    {
      serverName: "playwright",
      preference: "secondary",
      useCases: ["user_testing", "performance_validation", "accessibility_testing"],
      integrationPatterns: ["e2e_testing", "performance_monitoring"]
    },
    {
      serverName: "context7",
      preference: "secondary",
      useCases: ["ui_frameworks", "design_patterns", "accessibility_standards"],
      integrationPatterns: ["documentation_lookup", "best_practices"]
    }
  ];

  readonly autoActivationTriggers: ActivationTrigger[] = [
    {
      triggerType: "keyword",
      patterns: ["component", "responsive", "accessibility", "ui", "ux", "user", "interface", "css", "react", "vue"],
      confidenceThreshold: 0.7,
      combinationRules: [
        { rule: "frontend_performance", personas: ["frontend", "performance"], conditions: ["ui performance"], weight: 0.9 },
        { rule: "frontend_qa", personas: ["frontend", "qa"], conditions: ["ui testing"], weight: 0.8 }
      ]
    },
    {
      triggerType: "context",
      patterns: ["ui_development", "component_creation", "user_interface", "frontend_optimization"],
      confidenceThreshold: 0.8,
      combinationRules: []
    },
    {
      triggerType: "domain",
      patterns: ["frontend", "ui", "client", "browser"],
      confidenceThreshold: 0.9,
      combinationRules: []
    }
  ];

  readonly qualityStandards: QualityStandard[] = [
    {
      category: "accessibility",
      metric: "wcag_compliance",
      threshold: 0.9,
      measurement: "automated_audit",
      validationMethod: "accessibility_scanner"
    },
    {
      category: "performance",
      metric: "core_web_vitals",
      threshold: 0.9,
      measurement: "lighthouse_audit",
      validationMethod: "performance_testing"
    },
    {
      category: "usability",
      metric: "user_satisfaction",
      threshold: 0.8,
      measurement: "user_testing",
      validationMethod: "usability_testing"
    },
    {
      category: "responsiveness",
      metric: "responsive_score",
      threshold: 0.95,
      measurement: "cross_device_testing",
      validationMethod: "responsive_testing"
    }
  ];

  readonly collaborationPatterns: CollaborationPattern[] = [
    {
      name: "frontend_performance",
      personas: ["frontend", "performance"],
      sequenceType: "parallel",
      handoffCriteria: [
        {
          trigger: "performance_issue",
          fromPersona: "frontend",
          toPersona: "performance",
          contextRequirements: ["performance_metrics", "user_experience_impact"],
          validationRules: ["performance_budgets", "user_satisfaction"]
        }
      ],
      contextMergeStrategy: "synthesize"
    },
    {
      name: "frontend_qa",
      personas: ["frontend", "qa"],
      sequenceType: "sequential",
      handoffCriteria: [
        {
          trigger: "component_ready",
          fromPersona: "frontend",
          toPersona: "qa",
          contextRequirements: ["component_specs", "acceptance_criteria"],
          validationRules: ["functionality_tests", "accessibility_tests"]
        }
      ],
      contextMergeStrategy: "accumulate"
    }
  ];

  // Frontend-specific behavior implementations

  protected async generateBehaviorTransformations(context: PersonaContext): Promise<BehaviorTransformation[]> {
    const transformations: BehaviorTransformation[] = [];

    // User-centered design transformation
    transformations.push({
      type: "user_centered_focus",
      description: "Prioritize user needs and experience in all decisions",
      impact: "Ensures solutions address real user problems",
      priority: 1
    });

    // Accessibility-first transformation
    transformations.push({
      type: "accessibility_first",
      description: "Implement accessibility considerations from the start",
      impact: "Creates inclusive experiences for all users",
      priority: 1
    });

    // Performance-conscious transformation
    transformations.push({
      type: "performance_optimization",
      description: "Optimize for real-world device and network conditions",
      impact: "Improves user experience across all devices",
      priority: 2
    });

    // Responsive design transformation
    if (context.projectContext.environment === 'production') {
      transformations.push({
        type: "responsive_design",
        description: "Ensure optimal experience across all screen sizes",
        impact: "Provides consistent experience on all devices",
        priority: 2
      });
    }

    // Component reusability transformation
    if (context.complexity > 0.5) {
      transformations.push({
        type: "component_reusability",
        description: "Create reusable, maintainable components",
        impact: "Reduces development time and ensures consistency",
        priority: 3
      });
    }

    return transformations;
  }

  protected async generateQualityAdjustments(context: PersonaContext): Promise<QualityAdjustment[]> {
    const adjustments: QualityAdjustment[] = [];

    // Accessibility adjustment
    adjustments.push({
      metric: "accessibility_score",
      adjustment: 0.2,
      reasoning: "Frontend persona prioritizes accessibility compliance for inclusive design"
    });

    // Performance adjustment
    adjustments.push({
      metric: "performance_score",
      adjustment: 0.15,
      reasoning: "Optimize for Core Web Vitals and real-world performance"
    });

    // User experience adjustment
    adjustments.push({
      metric: "user_satisfaction",
      adjustment: 0.1,
      reasoning: "Focus on user-centered design and usability"
    });

    // Bundle size adjustment
    if (context.complexity > 0.6) {
      adjustments.push({
        metric: "bundle_size",
        adjustment: -0.2,
        reasoning: "Optimize bundle size for better performance"
      });
    }

    return adjustments;
  }

  protected async generateRecommendations(context: PersonaContext): Promise<string[]> {
    const recommendations: string[] = [];

    // Core frontend recommendations
    recommendations.push("Design with accessibility in mind from the start");
    recommendations.push("Optimize for Core Web Vitals and performance budgets");
    recommendations.push("Implement responsive design for all screen sizes");
    recommendations.push("Follow established design system patterns");

    // Context-specific recommendations
    if (context.complexity > 0.7) {
      recommendations.push("Break down complex interfaces into reusable components");
      recommendations.push("Implement progressive enhancement for better performance");
    }

    if (context.projectContext.phase === 'development') {
      recommendations.push("Establish component library and design system early");
      recommendations.push("Set up automated accessibility and performance testing");
    }

    if (context.projectContext.phase === 'production') {
      recommendations.push("Monitor real user metrics and Core Web Vitals");
      recommendations.push("Implement A/B testing for user experience optimization");
    }

    // Domain-specific recommendations
    if (context.domain === 'performance') {
      recommendations.push("Implement lazy loading and code splitting");
      recommendations.push("Optimize images and assets for web delivery");
    }

    if (context.domain === 'security') {
      recommendations.push("Implement Content Security Policy (CSP)");
      recommendations.push("Validate and sanitize all user inputs");
    }

    return recommendations;
  }

  protected async calculateBehaviorConfidence(context: PersonaContext): Promise<number> {
    let confidence = 0.5; // Base confidence

    // Increase confidence for frontend domains
    if (['ui', 'ux', 'frontend', 'client', 'component'].includes(context.domain)) {
      confidence += 0.3;
    }

    // Increase confidence for user-focused projects
    if (context.userIntent.includes('user') || context.userIntent.includes('interface')) {
      confidence += 0.2;
    }

    // Increase confidence for accessibility/performance focus
    if (context.userIntent.includes('accessibility') || context.userIntent.includes('performance')) {
      confidence += 0.15;
    }

    // Decrease confidence for backend-heavy tasks
    if (context.domain === 'backend' || context.domain === 'database') {
      confidence -= 0.2;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  // Frontend-specific scoring methods

  protected async scorePriorityAlignment(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    let score = 0;

    // Score based on user needs
    if (option.description.includes('user') || option.description.includes('usability')) {
      score += 0.3;
    }

    // Score based on accessibility
    if (option.description.includes('accessible') || option.description.includes('inclusive')) {
      score += 0.25;
    }

    // Score based on performance
    if (option.description.includes('performance') || option.description.includes('fast')) {
      score += 0.25;
    }

    // Score based on visual design
    if (option.description.includes('design') || option.description.includes('visual')) {
      score += 0.2;
    }

    // Penalize backend-heavy solutions
    if (option.description.includes('database') || option.description.includes('server')) {
      score -= 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  // Frontend-specific validation methods

  async validatePerformance(metrics: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Check Core Web Vitals
    if (metrics.lcp && metrics.lcp > this.performanceBudgets.coreWebVitals.lcp) {
      issues.push({
        severity: "high",
        message: `LCP (${metrics.lcp}ms) exceeds target (${this.performanceBudgets.coreWebVitals.lcp}ms)`,
        location: "performance_metrics",
        suggestion: "Optimize largest contentful paint through image optimization and critical path optimization"
      });
      score -= 0.3;
    }

    if (metrics.fid && metrics.fid > this.performanceBudgets.coreWebVitals.fid) {
      issues.push({
        severity: "medium",
        message: `FID (${metrics.fid}ms) exceeds target (${this.performanceBudgets.coreWebVitals.fid}ms)`,
        location: "performance_metrics",
        suggestion: "Reduce JavaScript execution time and optimize event handlers"
      });
      score -= 0.2;
    }

    if (metrics.cls && metrics.cls > this.performanceBudgets.coreWebVitals.cls) {
      issues.push({
        severity: "medium",
        message: `CLS (${metrics.cls}) exceeds target (${this.performanceBudgets.coreWebVitals.cls})`,
        location: "performance_metrics",
        suggestion: "Prevent layout shifts by reserving space for dynamic content"
      });
      score -= 0.15;
    }

    // Check bundle size
    if (metrics.bundleSize && metrics.bundleSize > this.performanceBudgets.bundleSize.total) {
      issues.push({
        severity: "medium",
        message: `Bundle size (${metrics.bundleSize} bytes) exceeds target (${this.performanceBudgets.bundleSize.total} bytes)`,
        location: "bundle_analysis",
        suggestion: "Implement code splitting and tree shaking"
      });
      score -= 0.15;
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push("Implement performance monitoring and alerting");
      recommendations.push("Set up automated performance testing in CI/CD");
      recommendations.push("Consider using performance budgets in build process");
    }

    return {
      isValid: issues.filter(i => i.severity === 'high').length === 0,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  async validateAccessibility(auditResult: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Check WCAG compliance
    if (auditResult.wcagScore < this.performanceBudgets.accessibility.complianceThreshold) {
      issues.push({
        severity: "high",
        message: `WCAG compliance (${auditResult.wcagScore}) below threshold (${this.performanceBudgets.accessibility.complianceThreshold})`,
        location: "accessibility_audit",
        suggestion: "Address accessibility violations and improve semantic markup"
      });
      score -= 0.4;
    }

    // Check for common accessibility issues
    if (auditResult.violations) {
      for (const violation of auditResult.violations) {
        const severity = violation.impact === 'critical' ? 'high' : 
                        violation.impact === 'serious' ? 'medium' : 'low';
        
        issues.push({
          severity: severity as any,
          message: violation.description,
          location: violation.selector || 'unknown',
          suggestion: violation.help || 'Review accessibility guidelines'
        });
        
        score -= severity === 'high' ? 0.2 : severity === 'medium' ? 0.1 : 0.05;
      }
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push("Implement automated accessibility testing");
      recommendations.push("Train team on accessibility best practices");
      recommendations.push("Include accessibility in definition of done");
    }

    return {
      isValid: auditResult.wcagScore >= this.performanceBudgets.accessibility.complianceThreshold,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  // Frontend-specific insight interpretation

  protected async interpretInsight(
    insight: string,
    fromPersona: string
  ): Promise<string | null> {
    const insightLower = insight.toLowerCase();

    // Interpret performance insights
    if (fromPersona === 'performance' && insightLower.includes('performance')) {
      return `UI performance consideration: ${insight} - Consider lazy loading and code splitting`;
    }

    // Interpret accessibility insights
    if (fromPersona === 'qa' && insightLower.includes('accessibility')) {
      return `UI accessibility: ${insight} - Implement ARIA labels and semantic markup`;
    }

    // Interpret design insights
    if (fromPersona === 'architect' && insightLower.includes('design')) {
      return `UI architecture: ${insight} - Follow component-based design patterns`;
    }

    // Interpret security insights
    if (fromPersona === 'security' && insightLower.includes('security')) {
      return `UI security: ${insight} - Implement CSP and input validation`;
    }

    // Default interpretation
    return `UI perspective on ${fromPersona} insight: ${insight}`;
  }

  // Frontend-specific optimization generation

  protected async generateOptimizationForFocus(
    focus: string,
    operation: any
  ): Promise<import('../types').Optimization | null> {
    switch (focus) {
      case "user_experience":
        return {
          type: "user_experience",
          description: "Optimize user interface for better usability and user satisfaction",
          impact: "Improved user engagement and satisfaction scores",
          effort: 0.6,
          priority: 1
        };

      case "accessibility_compliance":
        return {
          type: "accessibility",
          description: "Implement WCAG 2.1 AA compliance and inclusive design practices",
          impact: "Accessible to users with disabilities, legal compliance",
          effort: 0.5,
          priority: 1
        };

      case "performance_optimization":
        return {
          type: "performance",
          description: "Optimize bundle size, loading times, and Core Web Vitals",
          impact: "Faster page loads and better user experience",
          effort: 0.7,
          priority: 2
        };

      case "responsive_design":
        return {
          type: "responsive",
          description: "Ensure optimal display across all device sizes and orientations",
          impact: "Consistent experience across desktop, tablet, and mobile",
          effort: 0.4,
          priority: 2
        };

      case "component_reusability":
        return {
          type: "components",
          description: "Create modular, reusable components with consistent API",
          impact: "Reduced development time and improved consistency",
          effort: 0.6,
          priority: 3
        };

      default:
        return await super.generateOptimizationForFocus(focus, operation);
    }
  }
}