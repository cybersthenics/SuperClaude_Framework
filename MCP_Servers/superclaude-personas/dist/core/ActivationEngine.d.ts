import { RequestContext, ActivationAnalysis, PersonaScore, PersonaName, PersonaActivationDecision } from '../types';
import { Logger } from '../utils/Logger';
import { CacheManager } from '../utils/CacheManager';
export declare class ActivationEngine {
    private logger;
    private cache;
    private keywordMatchers;
    private contextPatterns;
    private combinationRules;
    constructor(logger: Logger, cache: CacheManager);
    analyzeContext(context: RequestContext): Promise<ActivationAnalysis>;
    calculatePersonaScores(context: RequestContext): Promise<PersonaScore[]>;
    calculatePersonaScore(context: RequestContext, persona: PersonaName): Promise<PersonaScore>;
    determineAutoActivation(analysis: ActivationAnalysis, confidenceThreshold?: number): Promise<PersonaActivationDecision>;
    validateActivationDecision(decision: PersonaActivationDecision, context: RequestContext): Promise<{
        isValid: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    private detectPrimaryDomain;
    private assessComplexity;
    private extractUserIntent;
    private identifyCollaborationOpportunities;
    private calculateKeywordMatch;
    private calculateContextMatch;
    private calculateHistoryMatch;
    private calculatePerformanceMatch;
    private calculateConfidence;
    private generateActivationReasoning;
    private suggestOverrideFlags;
    private checkDomainConflicts;
    private checkResourceRequirements;
    private hashContext;
}
//# sourceMappingURL=ActivationEngine.d.ts.map