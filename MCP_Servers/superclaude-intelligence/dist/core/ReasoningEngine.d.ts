import { ReasoningContext, ReasoningResult, Hypothesis, Evidence, Problem, Insight } from '../types/index.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';
import { KnowledgeGraphBuilder } from './KnowledgeGraphBuilder.js';
export interface SequentialClient {
    sendRequest(method: string, params: any): Promise<any>;
}
export interface InsightGenerator {
    generateInsights(data: any): Promise<Insight[]>;
}
export interface HypothesisTracker {
    trackHypothesis(hypothesis: Hypothesis): void;
    getHypothesisHistory(): Hypothesis[];
}
export interface Explanation {
    reasoning: string;
    steps: string[];
    confidence: number;
    alternatives: string[];
    assumptions: string[];
}
export interface StepResult {
    success: boolean;
    output: any;
    confidence: number;
    evidence: Evidence[];
    nextSteps: string[];
}
export declare class ReasoningEngine {
    private semanticAnalyzer;
    private knowledgeGraphBuilder;
    private sequentialClient;
    private reasoningChains;
    private insightGenerator;
    private hypothesisTracker;
    private cacheManager;
    constructor(semanticAnalyzer: SemanticAnalyzer, knowledgeGraphBuilder: KnowledgeGraphBuilder);
    executeReasoningChain(context: ReasoningContext): Promise<ReasoningResult>;
    generateHypotheses(problem: Problem): Promise<Hypothesis[]>;
    validateHypothesis(hypothesis: Hypothesis, evidence: Evidence[]): Promise<Hypothesis>;
    synthesizeInsights(analyses: any[]): Promise<Insight[]>;
    explainReasoning(result: ReasoningResult): Promise<Explanation>;
    private buildReasoningChain;
    private executeChainSteps;
    private executeReasoningStep;
    private executeAnalysisStep;
    private executeHypothesisGenerationStep;
    private executeEvidenceGatheringStep;
    private executeSynthesisStep;
    private generateDomainSpecificHypotheses;
    private generatePatternBasedHypotheses;
    private generateFallbackHypotheses;
    private performHypothesisValidation;
    private evidenceSupportsHypothesis;
    private calculateHypothesisConfidence;
    private selectBestHypothesis;
    private calculateOverallConfidence;
    private generateRecommendations;
    private calculateRecommendationPriority;
    private estimateEffort;
    private estimateImpact;
    private generateActions;
    private enhanceInsight;
    private generateAlternativeApproaches;
    private buildReasoningNarrative;
    private initializeSequentialClient;
    private generateChainId;
}
//# sourceMappingURL=ReasoningEngine.d.ts.map