import { PersonaName, PersonaImplementation, ChainStep, ChainContext, ChainStepResult, Insight, HandoffPackage, PersonaContext } from '../types';
import { Logger } from '../utils/Logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { CollaborationCoordinator } from './CollaborationCoordinator';
export interface ChainExecution {
    chainId: string;
    steps: ChainStep[];
    currentStep: number;
    results: ChainStepResult[];
    accumulatedInsights: Insight[];
    contextPreservation: any;
    startTime: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
}
export interface ContextPreservation {
    chainId: string;
    stepContexts: Map<number, any>;
    sharedState: any;
    preservedInsights: Insight[];
    handoffPackages: HandoffPackage[];
    preservationScore: number;
}
export interface InsightAggregation {
    chainId: string;
    aggregatedInsights: Insight[];
    confidenceScore: number;
    synthesizedRecommendations: string[];
    qualityMetrics: any;
}
export declare class ChainModeHandler {
    private personas;
    private logger;
    private performanceMonitor;
    private collaborationCoordinator;
    private activeChains;
    private contextPreservation;
    private preservationThreshold;
    constructor(personas: Map<PersonaName, PersonaImplementation>, logger: Logger, performanceMonitor: PerformanceMonitor, collaborationCoordinator: CollaborationCoordinator);
    executeChain(steps: ChainStep[], context: ChainContext): Promise<ChainStepResult[]>;
    executeChainStep(step: ChainStep, context: ChainContext, previousResults: ChainStepResult[]): Promise<ChainStepResult>;
    preserveContextAcrossTransitions(fromStep: ChainStepResult, toStep: ChainStep, context: ChainContext): Promise<{
        preservationScore: number;
        preservedElements: string[];
    }>;
    aggregateInsights(insights: Insight[], chainId: string): Promise<InsightAggregation>;
    prepareHandoffPackage(persona: PersonaName, context: PersonaContext, insights: Insight[], previousResults: ChainStepResult[]): Promise<HandoffPackage>;
    getContextPreservationScore(chainId: string): number;
    getChainExecutionStatus(chainId: string): string;
    private initializeChainExecution;
    private initializeContextPreservation;
    private buildStepContext;
    private calculateStepComplexity;
    private generateInsightsFromBehavior;
    private updateAccumulatedContext;
    private updateContextPreservation;
    private calculatePreservationScore;
    private prepareHandoffForNextStep;
    private generateNextStepRecommendations;
    private groupInsightsByType;
    private groupInsightsByPersona;
    private synthesizeInsights;
    private generateSynthesizedRecommendations;
    private calculateInsightQualityMetrics;
    private determineNextPersona;
    private getPersonaPriorities;
    private generateHandoffRecommendations;
    private capturePersonaState;
    private cleanupChainExecution;
}
//# sourceMappingURL=ChainModeHandler.d.ts.map