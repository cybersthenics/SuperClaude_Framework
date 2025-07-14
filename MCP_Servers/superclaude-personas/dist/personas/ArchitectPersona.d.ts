import { BasePersona } from './BasePersona';
import { PersonaStrategy, MCPServerPreference, ActivationTrigger, QualityStandard, CollaborationPattern, PersonaContext, BehaviorTransformation, QualityAdjustment, DecisionOption, ValidationResult } from '../types';
export declare class ArchitectPersona extends BasePersona {
    readonly identity = "Systems architecture specialist, long-term thinking focus, scalability expert";
    readonly priorityHierarchy: string[];
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
    validateArchitecture(systemDesign: any): Promise<ValidationResult>;
    protected interpretInsight(insight: string, fromPersona: string): Promise<string | null>;
    protected generateOptimizationForFocus(focus: string, operation: any): Promise<import('../types').Optimization | null>;
}
//# sourceMappingURL=ArchitectPersona.d.ts.map