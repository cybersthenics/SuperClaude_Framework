import { PersonaImplementation, PersonaContext, PersonaState, PersonaStackEntry, ActivationResult, PersonaRecommendation, CoordinationResult, ChainStepResult, PersonaName, RequestContext, Operation, ChainStep, ChainContext, PersonaDecision, ExpertiseContribution } from '../types';
import { ActivationEngine } from './ActivationEngine';
import { CollaborationCoordinator } from './CollaborationCoordinator';
import { ChainModeHandler } from './ChainModeHandler';
import { Logger } from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { CacheManager } from '../utils/CacheManager';
export declare class PersonaManager {
    private personas;
    private activationEngine;
    private collaborationCoordinator;
    private chainModeHandler;
    private logger;
    private performanceMonitor;
    private cache;
    private personaState;
    constructor(personas: Map<PersonaName, PersonaImplementation>, activationEngine: ActivationEngine, collaborationCoordinator: CollaborationCoordinator, chainModeHandler: ChainModeHandler, logger: Logger, performanceMonitor: PerformanceMonitor, cache: CacheManager);
    activatePersona(persona: PersonaName, context: PersonaContext, options?: {
        forceActivation?: boolean;
        preserveStack?: boolean;
        collaborationMode?: "single" | "parallel" | "chain";
    }): Promise<ActivationResult>;
    getPersonaRecommendation(context: RequestContext, options?: {
        includeConfidenceBreakdown?: boolean;
        maxRecommendations?: number;
        excludePersonas?: PersonaName[];
    }): Promise<PersonaRecommendation[]>;
    coordinateMultiPersona(personas: PersonaName[], operation: Operation, coordinationMode?: "parallel" | "sequential" | "hierarchical"): Promise<CoordinationResult>;
    executeChainMode(steps: ChainStep[], context: ChainContext): Promise<ChainStepResult[]>;
    getPersonaState(): PersonaState;
    getActivePersona(): PersonaName | null;
    getPersonaStack(): PersonaStackEntry[];
    clearPersonaStack(): void;
    getPersona(name: PersonaName): PersonaImplementation | undefined;
    getAllPersonas(): PersonaName[];
    shareExpertise(fromPersona: PersonaName, toPersona: PersonaName, expertise: ExpertiseContribution): Promise<boolean>;
    getPersonaPriorities(persona: PersonaName, context?: any): Promise<string[]>;
    recordDecision(decision: PersonaDecision): void;
    getDecisionHistory(persona?: PersonaName): PersonaDecision[];
    private getCachedActivationResult;
    private updatePerformanceMetrics;
    private generateRecommendationReasoning;
    private getExpectedBehaviors;
    private hashContext;
}
//# sourceMappingURL=PersonaManager.d.ts.map