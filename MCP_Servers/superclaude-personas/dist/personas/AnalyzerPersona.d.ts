import { BasePersona } from './BasePersona';
import { PersonaStrategy, MCPServerPreference, ActivationTrigger, QualityStandard, CollaborationPattern, PersonaContext, BehaviorTransformation, QualityAdjustment, DecisionOption, ValidationResult } from '../types';
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
export declare class AnalyzerPersona extends BasePersona {
    readonly identity = "Root cause specialist, evidence-based investigator, systematic analyst";
    readonly priorityHierarchy: string[];
    readonly investigationMethodology: AnalysisMethodology[];
    readonly coreStrategies: PersonaStrategy[];
    readonly mcpPreferences: MCPServerPreference[];
    readonly autoActivationTriggers: ActivationTrigger[];
    readonly qualityStandards: QualityStandard[];
    readonly collaborationPatterns: CollaborationPattern[];
    protected generateBehaviorTransformations(context: PersonaContext): Promise<BehaviorTransformation[]>;
    protected generateQualityAdjustments(context: PersonaContext): Promise<QualityAdjustment[]>;
    protected generateRecommendations(context: PersonaContext): Promise<string[]>;
    protected calculateBehaviorConfidence(context: PersonaContext): Promise<number>;
    protected scorePriorityAlignment(option: DecisionOption, context: PersonaContext): Promise<number>;
    investigateIssue(problem: any): Promise<InvestigationResult>;
    validateAnalysis(analysisResult: any): Promise<ValidationResult>;
    protected interpretInsight(insight: string, fromPersona: string): Promise<string | null>;
    private collectEvidence;
    private identifyPatterns;
    private generateHypotheses;
    private testHypotheses;
    private validateRootCause;
    private generateInvestigationRecommendations;
    private generatePreventionStrategies;
    private calculateInvestigationConfidence;
    private validateMethodology;
}
//# sourceMappingURL=AnalyzerPersona.d.ts.map