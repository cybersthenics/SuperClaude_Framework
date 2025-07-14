import { PersonaName, PersonaImplementation, ExpertiseContribution, ConflictResolution, CoordinationResult, ExpertiseSharingLog, Operation, PersonaContext, HandoffPackage, DecisionOption, Insight } from '../types';
import { Logger } from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
export interface ExpertiseRegistry {
    contributions: Map<string, ExpertiseContribution[]>;
    sharingLog: ExpertiseSharingLog[];
    compatibilityMatrix: Map<string, number>;
}
export interface PriorityConflict {
    conflictId: string;
    participants: PersonaName[];
    conflictType: string;
    options: DecisionOption[];
    priorities: Record<PersonaName, string[]>;
    context: any;
}
export interface ResolutionResult {
    conflictId: string;
    resolution: ConflictResolution;
    satisfactionScore: number;
    reasoning: string;
}
export interface SharingResult {
    success: boolean;
    translatedExpertise?: ExpertiseContribution;
    applicationResult?: any;
    compatibility?: {
        isCompatible: boolean;
        score: number;
        reasons: string[];
    };
    reason?: string;
}
export declare class CollaborationCoordinator {
    private expertiseRegistry;
    private personas;
    private logger;
    private performanceMonitor;
    private collaborationPatterns;
    constructor(personas: Map<PersonaName, PersonaImplementation>, logger: Logger, performanceMonitor: PerformanceMonitor);
    coordinatePersonas(personas: PersonaName[], operation: Operation, coordinationMode: "parallel" | "sequential" | "hierarchical"): Promise<CoordinationResult>;
    shareExpertise(fromPersona: PersonaName, toPersona: PersonaName, expertise: ExpertiseContribution): Promise<SharingResult>;
    resolvePriorityConflicts(conflicts: PriorityConflict[]): Promise<ConflictResolution[]>;
    managePersonaHandoff(fromPersona: PersonaName, toPersona: PersonaName, context: PersonaContext, insights: Insight[]): Promise<HandoffPackage>;
    private coordinateParallelPersonas;
    private coordinateSequentialPersonas;
    private coordinateHierarchicalPersonas;
    private facilitateExpertiseSharing;
    private identifyPriorityConflicts;
    private resolveSingleConflict;
    private synthesizePersonaResults;
    private findCollaborationPattern;
    private buildPersonaContext;
    private initializeCompatibilityMatrix;
    private checkExpertiseCompatibility;
    private translateExpertise;
    private logExpertiseSharing;
    private updateExpertiseRegistry;
    private getExpertiseSharingLog;
    private updateContextForNextPersona;
    private establishHierarchy;
    private updateDecisionFromHierarchy;
    private identifyExpertiseSharingOpportunities;
    private detectPriorityConflict;
    private findConflictingRecommendations;
    private areRecommendationsConflicting;
    private determineResolutionStrategy;
    private resolveByHierarchy;
    private resolveByConsensus;
    private resolveByExpertise;
    private resolveByDefault;
    private generateActionItems;
    private generateHandoffRecommendations;
    private getPersonaPriorities;
    private capturePersonaState;
    private validateHandoffReadiness;
    private executeHandoff;
}
//# sourceMappingURL=CollaborationCoordinator.d.ts.map