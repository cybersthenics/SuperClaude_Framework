import { PersonaImplementation, PersonaStrategy, MCPServerPreference, ActivationTrigger, QualityStandard, CollaborationPattern, PersonaContext, BehaviorResult, BehaviorTransformation, QualityAdjustment, Optimization, DecisionResult, DecisionOption, Operation, ExpertiseContribution, ExpertiseApplicationResult, DecisionContext, ValidationResult } from '../types';
export declare abstract class BasePersona implements PersonaImplementation {
    abstract readonly identity: string;
    abstract readonly priorityHierarchy: string[];
    abstract readonly coreStrategies: PersonaStrategy[];
    abstract readonly mcpPreferences: MCPServerPreference[];
    abstract readonly autoActivationTriggers: ActivationTrigger[];
    abstract readonly qualityStandards: QualityStandard[];
    abstract readonly collaborationPatterns: CollaborationPattern[];
    applyBehavior(context: PersonaContext): Promise<BehaviorResult>;
    makeDecision(options: DecisionOption[], context: PersonaContext): Promise<DecisionResult>;
    transformOperation(operation: Operation, behaviorResult: BehaviorResult): Promise<Operation>;
    generateOptimizations(operation: Operation | PersonaContext): Promise<Optimization[]>;
    receiveExpertise(expertise: ExpertiseContribution, fromPersona: string): Promise<ExpertiseApplicationResult>;
    applyContextToPriorities(priorities: string[], context: DecisionContext): Promise<string[]>;
    protected abstract generateBehaviorTransformations(context: PersonaContext): Promise<BehaviorTransformation[]>;
    protected abstract generateQualityAdjustments(context: PersonaContext): Promise<QualityAdjustment[]>;
    protected abstract generateRecommendations(context: PersonaContext): Promise<string[]>;
    protected abstract calculateBehaviorConfidence(context: PersonaContext): Promise<number>;
    protected scoreOptions(options: DecisionOption[], context: PersonaContext): Promise<DecisionOption[]>;
    protected calculateOptionScore(option: DecisionOption, context: PersonaContext): Promise<number>;
    protected scorePriorityAlignment(option: DecisionOption, context: PersonaContext): Promise<number>;
    protected scoreRiskTolerance(option: DecisionOption): Promise<number>;
    protected scoreComplexity(option: DecisionOption, context: PersonaContext): Promise<number>;
    protected scoreDomainFit(option: DecisionOption, context: PersonaContext): Promise<number>;
    protected generateDecisionReasoning(selectedOption: DecisionOption, allOptions: DecisionOption[], context: PersonaContext): Promise<string>;
    protected calculateDecisionConfidence(selectedOption: DecisionOption, context: PersonaContext): Promise<number>;
    protected applyTransformation(parameters: any, transformation: BehaviorTransformation): Promise<any>;
    protected applyQualityAdjustment(requirements: string[], adjustment: QualityAdjustment): Promise<string[]>;
    protected generateOptimizationForFocus(focus: string, operation: Operation | PersonaContext): Promise<Optimization | null>;
    protected calculateExpertiseApplicability(expertise: ExpertiseContribution): Promise<number>;
    protected applyExpertiseInsights(expertise: ExpertiseContribution): Promise<string[]>;
    protected interpretInsight(insight: string, fromPersona: string): Promise<string | null>;
    protected generateExpertiseApplicationReasoning(expertise: ExpertiseContribution, modifications: string[]): Promise<string>;
    protected scorePrioritiesForContext(priorities: string[], context: DecisionContext): Promise<Array<{
        priority: string;
        score: number;
    }>>;
    protected calculatePriorityContextScore(priority: string, context: DecisionContext): Promise<number>;
    protected getRelatedDomains(domain: string): string[];
    validatePerformance?(metrics: any): Promise<ValidationResult>;
    validateReliability?(system: any): Promise<ValidationResult>;
    validateQuality?(metrics: any): Promise<ValidationResult>;
    assessThreat?(threat: any): Promise<any>;
    investigateIssue?(problem: any): Promise<any>;
    createLearningPath?(topic: any, userLevel: any): Promise<any>;
    localizeContent?(content: any, targetLanguage: string): Promise<any>;
}
//# sourceMappingURL=BasePersona.d.ts.map