import { BasePersona } from './BasePersona';
import { PersonaStrategy, MCPServerPreference, ActivationTrigger, QualityStandard, CollaborationPattern, PersonaContext, BehaviorTransformation, QualityAdjustment, DecisionOption, ValidationResult } from '../types';
export declare class FrontendPersona extends BasePersona {
    readonly identity = "UX specialist, accessibility advocate, performance-conscious developer";
    readonly priorityHierarchy: string[];
    readonly performanceBudgets: {
        loadTime: {
            mobile: number;
            desktop: number;
        };
        bundleSize: {
            initial: number;
            total: number;
        };
        accessibility: {
            wcagLevel: string;
            complianceThreshold: number;
        };
        coreWebVitals: {
            lcp: number;
            fid: number;
            cls: number;
        };
    };
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
    validatePerformance(metrics: any): Promise<ValidationResult>;
    validateAccessibility(auditResult: any): Promise<ValidationResult>;
    protected interpretInsight(insight: string, fromPersona: string): Promise<string | null>;
    protected generateOptimizationForFocus(focus: string, operation: any): Promise<import('../types').Optimization | null>;
}
//# sourceMappingURL=FrontendPersona.d.ts.map