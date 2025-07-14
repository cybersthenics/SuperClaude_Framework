// SuperClaude Personas - AnalyzerPersona
// Root cause specialist, evidence-based investigator, systematic analyst

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

export interface InvestigationResult {
  rootCause: string;
  evidence: string[];
  confidence: number;
  recommendations: string[];
  preventionStrategies: string[];
}

export interface AnalysisMethodology {
  phase: string;
  description: string;
  techniques: string[];
  expectedOutcome: string;
}

export class AnalyzerPersona extends BasePersona {
  readonly identity = "Root cause specialist, evidence-based investigator, systematic analyst";
  readonly priorityHierarchy = [
    "Evidence",
    "Systematic approach",
    "Thoroughness",
    "Accuracy",
    "Speed"
  ];

  readonly investigationMethodology: AnalysisMethodology[] = [
    {
      phase: "evidence_collection",
      description: "Gather all available data and information",
      techniques: ["log_analysis", "metric_collection", "stakeholder_interviews"],
      expectedOutcome: "Comprehensive dataset for analysis"
    },
    {
      phase: "pattern_recognition",
      description: "Identify patterns, correlations, and anomalies",
      techniques: ["statistical_analysis", "correlation_analysis", "anomaly_detection"],
      expectedOutcome: "Identified patterns and potential causes"
    },
    {
      phase: "hypothesis_testing",
      description: "Formulate and test hypotheses systematically",
      techniques: ["controlled_experiments", "A/B_testing", "simulation"],
      expectedOutcome: "Validated or refuted hypotheses"
    },
    {
      phase: "root_cause_validation",
      description: "Confirm underlying causes through reproducible tests",
      techniques: ["reproduction_testing", "regression_analysis", "causal_analysis"],
      expectedOutcome: "Confirmed root causes with supporting evidence"
    }
  ];

  readonly coreStrategies: PersonaStrategy[] = [
    {
      domain: "investigation",
      approach: "evidence_based_analysis",
      decisionFramework: [
        { factor: "evidence_quality", weight: 0.35, evaluationMethod: "data_validation", priorityLevel: 1 },
        { factor: "systematic_approach", weight: 0.3, evaluationMethod: "methodology_adherence", priorityLevel: 1 },
        { factor: "thoroughness", weight: 0.25, evaluationMethod: "coverage_analysis", priorityLevel: 2 },
        { factor: "reproducibility", weight: 0.1, evaluationMethod: "replication_testing", priorityLevel: 2 }
      ],
      performanceMetrics: [
        { metric: "analysis_accuracy", target: 0.95, unit: "ratio", measurement: "outcome_validation" },
        { metric: "evidence_coverage", target: 0.9, unit: "ratio", measurement: "data_completeness" },
        { metric: "root_cause_identification", target: 0.85, unit: "ratio", measurement: "problem_resolution" }
      ],
      riskToleranceLevel: "low",
      optimizationFocus: [
        "evidence_quality",
        "systematic_methodology",
        "analysis_thoroughness",
        "reproducible_results",
        "preventive_insights"
      ]
    },
    {
      domain: "problem_solving",
      approach: "structured_analysis",
      decisionFramework: [
        { factor: "problem_definition", weight: 0.3, evaluationMethod: "clarity_assessment", priorityLevel: 1 },
        { factor: "solution_viability", weight: 0.25, evaluationMethod: "feasibility_analysis", priorityLevel: 2 },
        { factor: "impact_assessment", weight: 0.25, evaluationMethod: "risk_analysis", priorityLevel: 2 },
        { factor: "implementation_complexity", weight: 0.2, evaluationMethod: "complexity_scoring", priorityLevel: 3 }
      ],
      performanceMetrics: [
        { metric: "problem_resolution_rate", target: 0.8, unit: "ratio", measurement: "success_tracking" },
        { metric: "solution_effectiveness", target: 0.85, unit: "ratio", measurement: "outcome_measurement" }
      ],
      riskToleranceLevel: "medium",
      optimizationFocus: [
        "problem_clarity",
        "solution_effectiveness",
        "implementation_feasibility"
      ]
    }
  ];

  readonly mcpPreferences: MCPServerPreference[] = [
    {
      serverName: "sequential",
      preference: "primary",
      useCases: ["systematic_analysis", "structured_investigation", "complex_reasoning"],
      integrationPatterns: ["step_by_step_analysis", "logical_progression"]
    },
    {
      serverName: "context7",
      preference: "secondary",
      useCases: ["research_validation", "pattern_verification", "best_practices"],
      integrationPatterns: ["evidence_lookup", "methodology_reference"]
    },
    {
      serverName: "playwright",
      preference: "secondary",
      useCases: ["issue_reproduction", "behavior_validation", "system_testing"],
      integrationPatterns: ["automated_testing", "issue_reproduction"]
    }
  ];

  readonly autoActivationTriggers: ActivationTrigger[] = [
    {
      triggerType: "keyword",
      patterns: ["analyze", "investigate", "root cause", "debug", "troubleshoot", "examine", "inspect"],
      confidenceThreshold: 0.8,
      combinationRules: [
        { rule: "analyzer_architect", personas: ["analyzer", "architect"], conditions: ["system analysis"], weight: 0.9 },
        { rule: "analyzer_security", personas: ["analyzer", "security"], conditions: ["security investigation"], weight: 0.8 }
      ]
    },
    {
      triggerType: "context",
      patterns: ["problem_investigation", "issue_analysis", "system_debugging"],
      confidenceThreshold: 0.7,
      combinationRules: []
    },
    {
      triggerType: "complexity",
      patterns: ["unknown_cause", "system_failure", "performance_degradation"],
      confidenceThreshold: 0.9,
      combinationRules: []
    }
  ];

  readonly qualityStandards: QualityStandard[] = [
    {
      category: "evidence_quality",
      metric: "evidence_validation_score",
      threshold: 0.9,
      measurement: "data_verification",
      validationMethod: "cross_reference_validation"
    },
    {
      category: "analysis_accuracy",
      metric: "prediction_accuracy",
      threshold: 0.85,
      measurement: "outcome_validation",
      validationMethod: "retrospective_analysis"
    },
    {
      category: "methodology_adherence",
      metric: "process_compliance",
      threshold: 0.9,
      measurement: "methodology_audit",
      validationMethod: "process_review"
    },
    {
      category: "reproducibility",
      metric: "replication_success",
      threshold: 0.8,
      measurement: "independent_verification",
      validationMethod: "peer_review"
    }
  ];

  readonly collaborationPatterns: CollaborationPattern[] = [
    {
      name: "analyzer_architect",
      personas: ["analyzer", "architect"],
      sequenceType: "sequential",
      handoffCriteria: [
        {
          trigger: "root_cause_identified",
          fromPersona: "analyzer",
          toPersona: "architect",
          contextRequirements: ["root_cause_analysis", "system_impact_assessment"],
          validationRules: ["architectural_implications", "design_impact"]
        }
      ],
      contextMergeStrategy: "accumulate"
    },
    {
      name: "analyzer_security",
      personas: ["analyzer", "security"],
      sequenceType: "parallel",
      handoffCriteria: [
        {
          trigger: "security_concern",
          fromPersona: "analyzer",
          toPersona: "security",
          contextRequirements: ["security_indicators", "threat_assessment"],
          validationRules: ["security_validation", "threat_analysis"]
        }
      ],
      contextMergeStrategy: "synthesize"
    }
  ];

  // Analyzer-specific behavior implementations

  protected async generateBehaviorTransformations(context: PersonaContext): Promise<BehaviorTransformation[]> {
    const transformations: BehaviorTransformation[] = [];

    // Evidence-based approach transformation
    transformations.push({
      type: "evidence_based_approach",
      description: "Require verifiable evidence for all conclusions",
      impact: "Increases reliability and accuracy of analysis",
      priority: 1
    });

    // Systematic methodology transformation
    transformations.push({
      type: "systematic_methodology",
      description: "Follow structured investigation process",
      impact: "Ensures thorough and reproducible analysis",
      priority: 1
    });

    // Root cause focus transformation
    transformations.push({
      type: "root_cause_focus",
      description: "Identify underlying causes, not just symptoms",
      impact: "Addresses fundamental issues for lasting solutions",
      priority: 2
    });

    // Hypothesis-driven investigation
    if (context.complexity > 0.6) {
      transformations.push({
        type: "hypothesis_driven",
        description: "Formulate and test specific hypotheses",
        impact: "Provides structured approach to complex problems",
        priority: 2
      });
    }

    // Pattern recognition enhancement
    if (context.domain === 'performance' || context.domain === 'security') {
      transformations.push({
        type: "pattern_recognition",
        description: "Identify recurring patterns and anomalies",
        impact: "Reveals hidden relationships and trends",
        priority: 3
      });
    }

    return transformations;
  }

  protected async generateQualityAdjustments(context: PersonaContext): Promise<QualityAdjustment[]> {
    const adjustments: QualityAdjustment[] = [];

    // Evidence quality adjustment
    adjustments.push({
      metric: "evidence_quality",
      adjustment: 0.2,
      reasoning: "Analyzer persona requires high-quality, verifiable evidence"
    });

    // Analysis thoroughness adjustment
    adjustments.push({
      metric: "analysis_coverage",
      adjustment: 0.15,
      reasoning: "Comprehensive analysis necessary for accurate conclusions"
    });

    // Reproducibility adjustment
    adjustments.push({
      metric: "reproducibility_score",
      adjustment: 0.1,
      reasoning: "Results must be reproducible for validation"
    });

    // Documentation quality adjustment
    adjustments.push({
      metric: "documentation_quality",
      adjustment: 0.15,
      reasoning: "Detailed documentation essential for evidence tracking"
    });

    return adjustments;
  }

  protected async generateRecommendations(context: PersonaContext): Promise<string[]> {
    const recommendations: string[] = [];

    // Core analyzer recommendations
    recommendations.push("Collect comprehensive evidence before drawing conclusions");
    recommendations.push("Follow systematic investigation methodology");
    recommendations.push("Focus on root causes rather than symptoms");
    recommendations.push("Validate findings through independent verification");

    // Context-specific recommendations
    if (context.complexity > 0.7) {
      recommendations.push("Break down complex problems into manageable components");
      recommendations.push("Use hypothesis-driven approach for systematic investigation");
    }

    if (context.domain === 'performance') {
      recommendations.push("Collect performance metrics across multiple dimensions");
      recommendations.push("Identify performance bottlenecks through systematic profiling");
    }

    if (context.domain === 'security') {
      recommendations.push("Conduct thorough security impact assessment");
      recommendations.push("Document all security-related findings and evidence");
    }

    // Phase-specific recommendations
    if (context.projectContext.phase === 'development') {
      recommendations.push("Implement monitoring and logging for future analysis");
      recommendations.push("Establish baseline metrics for comparison");
    }

    if (context.projectContext.phase === 'production') {
      recommendations.push("Correlate issues with recent changes and deployments");
      recommendations.push("Implement automated anomaly detection");
    }

    return recommendations;
  }

  protected async calculateBehaviorConfidence(context: PersonaContext): Promise<number> {
    let confidence = 0.5; // Base confidence

    // Increase confidence for analysis-related domains
    if (['analysis', 'investigation', 'debugging', 'troubleshooting'].includes(context.domain)) {
      confidence += 0.3;
    }

    // Increase confidence for problem-solving contexts
    if (context.userIntent.includes('analyze') || context.userIntent.includes('investigate')) {
      confidence += 0.2;
    }

    // Increase confidence for systematic approaches
    if (context.userIntent.includes('systematic') || context.userIntent.includes('thorough')) {
      confidence += 0.15;
    }

    // Increase confidence for complex problems
    if (context.complexity > 0.7) {
      confidence += 0.1;
    }

    // Decrease confidence for quick fixes
    if (context.userIntent.includes('quick') || context.userIntent.includes('fast')) {
      confidence -= 0.2;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  // Analyzer-specific scoring methods

  protected async scorePriorityAlignment(
    option: DecisionOption,
    context: PersonaContext
  ): Promise<number> {
    let score = 0;

    // Score based on evidence quality
    if (option.description.includes('evidence') || option.description.includes('data')) {
      score += 0.35;
    }

    // Score based on systematic approach
    if (option.description.includes('systematic') || option.description.includes('methodical')) {
      score += 0.3;
    }

    // Score based on thoroughness
    if (option.description.includes('comprehensive') || option.description.includes('thorough')) {
      score += 0.25;
    }

    // Score based on accuracy
    if (option.description.includes('accurate') || option.description.includes('precise')) {
      score += 0.1;
    }

    // Penalize rushed solutions
    if (option.description.includes('quick') || option.description.includes('fast')) {
      score -= 0.2;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  // Analyzer-specific investigation methods

  async investigateIssue(problem: any): Promise<InvestigationResult> {
    try {
      // Phase 1: Evidence Collection
      const evidence = await this.collectEvidence(problem);
      
      // Phase 2: Pattern Recognition
      const patterns = await this.identifyPatterns(evidence);
      
      // Phase 3: Hypothesis Testing
      const hypotheses = await this.generateHypotheses(patterns);
      const testedHypotheses = await this.testHypotheses(hypotheses);
      
      // Phase 4: Root Cause Validation
      const rootCause = await this.validateRootCause(testedHypotheses);
      
      // Generate recommendations
      const recommendations = await this.generateInvestigationRecommendations(rootCause, evidence);
      
      // Generate prevention strategies
      const preventionStrategies = await this.generatePreventionStrategies(rootCause);
      
      // Calculate confidence
      const confidence = await this.calculateInvestigationConfidence(evidence, rootCause);

      return {
        rootCause: rootCause.description,
        evidence: evidence.map(e => e.description),
        confidence,
        recommendations,
        preventionStrategies
      };
    } catch (error) {
      return {
        rootCause: "Unable to determine root cause",
        evidence: ["Investigation failed due to insufficient data"],
        confidence: 0.1,
        recommendations: ["Collect more detailed information and retry analysis"],
        preventionStrategies: ["Implement comprehensive monitoring and logging"]
      };
    }
  }

  // Analyzer-specific validation methods

  async validateAnalysis(analysisResult: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Check evidence quality
    if (!analysisResult.evidence || analysisResult.evidence.length === 0) {
      issues.push({
        severity: "high",
        message: "No evidence provided for analysis conclusions",
        location: "evidence_section",
        suggestion: "Collect and document supporting evidence"
      });
      score -= 0.4;
    }

    // Check methodology adherence
    if (!analysisResult.methodology || !this.validateMethodology(analysisResult.methodology)) {
      issues.push({
        severity: "medium",
        message: "Analysis methodology not properly documented or followed",
        location: "methodology_section",
        suggestion: "Follow systematic investigation methodology"
      });
      score -= 0.2;
    }

    // Check reproducibility
    if (!analysisResult.reproducibility_info) {
      issues.push({
        severity: "medium",
        message: "Insufficient information for result reproduction",
        location: "reproducibility_section",
        suggestion: "Document steps and conditions for result reproduction"
      });
      score -= 0.15;
    }

    // Check confidence levels
    if (analysisResult.confidence < 0.7) {
      issues.push({
        severity: "low",
        message: "Analysis confidence below recommended threshold",
        location: "confidence_assessment",
        suggestion: "Gather additional evidence or acknowledge uncertainty"
      });
      score -= 0.1;
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push("Implement peer review process for analysis results");
      recommendations.push("Establish evidence quality standards");
      recommendations.push("Document analysis methodology and assumptions");
    }

    return {
      isValid: issues.filter(i => i.severity === 'high').length === 0,
      score: Math.max(score, 0),
      issues,
      recommendations
    };
  }

  // Analyzer-specific insight interpretation

  protected async interpretInsight(
    insight: string,
    fromPersona: string
  ): Promise<string | null> {
    const insightLower = insight.toLowerCase();

    // Interpret architectural insights
    if (fromPersona === 'architect' && insightLower.includes('architecture')) {
      return `Analytical perspective on architecture: ${insight} - Investigate structural implications`;
    }

    // Interpret performance insights
    if (fromPersona === 'performance' && insightLower.includes('performance')) {
      return `Performance analysis: ${insight} - Investigate performance bottlenecks systematically`;
    }

    // Interpret security insights
    if (fromPersona === 'security' && insightLower.includes('security')) {
      return `Security analysis: ${insight} - Investigate security implications and attack vectors`;
    }

    // Interpret QA insights
    if (fromPersona === 'qa' && insightLower.includes('quality')) {
      return `Quality analysis: ${insight} - Investigate quality patterns and root causes`;
    }

    // Default interpretation
    return `Analytical investigation of ${fromPersona} insight: ${insight}`;
  }

  // Private helper methods

  private async collectEvidence(problem: any): Promise<any[]> {
    const evidence = [];
    
    // Collect logs
    if (problem.logs) {
      evidence.push({ type: 'logs', description: 'System logs collected', data: problem.logs });
    }
    
    // Collect metrics
    if (problem.metrics) {
      evidence.push({ type: 'metrics', description: 'Performance metrics collected', data: problem.metrics });
    }
    
    // Collect user reports
    if (problem.userReports) {
      evidence.push({ type: 'user_reports', description: 'User feedback collected', data: problem.userReports });
    }
    
    return evidence;
  }

  private async identifyPatterns(evidence: any[]): Promise<any[]> {
    const patterns = [];
    
    // Simple pattern identification
    for (const item of evidence) {
      if (item.type === 'logs' && item.data.includes('error')) {
        patterns.push({ type: 'error_pattern', description: 'Error patterns found in logs' });
      }
      
      if (item.type === 'metrics' && item.data.responseTime > 1000) {
        patterns.push({ type: 'performance_pattern', description: 'Performance degradation pattern' });
      }
    }
    
    return patterns;
  }

  private async generateHypotheses(patterns: any[]): Promise<any[]> {
    const hypotheses = [];
    
    for (const pattern of patterns) {
      if (pattern.type === 'error_pattern') {
        hypotheses.push({
          id: 'error_hypothesis',
          description: 'System errors causing functionality issues',
          testable: true,
          confidence: 0.7
        });
      }
      
      if (pattern.type === 'performance_pattern') {
        hypotheses.push({
          id: 'performance_hypothesis',
          description: 'Performance bottleneck causing user experience issues',
          testable: true,
          confidence: 0.8
        });
      }
    }
    
    return hypotheses;
  }

  private async testHypotheses(hypotheses: any[]): Promise<any[]> {
    const tested = [];
    
    for (const hypothesis of hypotheses) {
      // Simulate hypothesis testing
      const testResult = {
        ...hypothesis,
        tested: true,
        result: Math.random() > 0.3 ? 'confirmed' : 'refuted',
        confidence: hypothesis.confidence * (Math.random() * 0.3 + 0.7)
      };
      
      tested.push(testResult);
    }
    
    return tested.filter(h => h.result === 'confirmed');
  }

  private async validateRootCause(hypotheses: any[]): Promise<any> {
    // Select the highest confidence hypothesis as root cause
    const rootCause = hypotheses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best,
      hypotheses[0] || { description: 'Unknown root cause', confidence: 0.1 }
    );
    
    return rootCause;
  }

  private async generateInvestigationRecommendations(rootCause: any, evidence: any[]): Promise<string[]> {
    const recommendations = [];
    
    recommendations.push(`Address identified root cause: ${rootCause.description}`);
    recommendations.push('Implement monitoring to detect similar issues early');
    recommendations.push('Document findings for future reference');
    
    if (evidence.length > 0) {
      recommendations.push('Establish baseline metrics for comparison');
    }
    
    return recommendations;
  }

  private async generatePreventionStrategies(rootCause: any): Promise<string[]> {
    const strategies = [];
    
    strategies.push('Implement comprehensive monitoring and alerting');
    strategies.push('Establish automated testing for similar scenarios');
    strategies.push('Create runbooks for common issues');
    
    if (rootCause.description.includes('performance')) {
      strategies.push('Implement performance budgets and monitoring');
    }
    
    if (rootCause.description.includes('error')) {
      strategies.push('Enhance error handling and recovery mechanisms');
    }
    
    return strategies;
  }

  private async calculateInvestigationConfidence(evidence: any[], rootCause: any): Promise<number> {
    let confidence = rootCause.confidence || 0.5;
    
    // Increase confidence based on evidence quality
    if (evidence.length > 3) {
      confidence += 0.1;
    }
    
    // Increase confidence based on evidence diversity
    const evidenceTypes = new Set(evidence.map(e => e.type));
    if (evidenceTypes.size > 2) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1);
  }

  private validateMethodology(methodology: any): boolean {
    // Check if methodology follows the standard phases
    const requiredPhases = ['evidence_collection', 'pattern_recognition', 'hypothesis_testing', 'root_cause_validation'];
    
    if (!methodology.phases) {
      return false;
    }
    
    return requiredPhases.every(phase => 
      methodology.phases.some((p: any) => p.name === phase)
    );
  }
}