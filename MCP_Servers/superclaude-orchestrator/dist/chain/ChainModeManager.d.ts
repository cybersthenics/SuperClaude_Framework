/**
 * Chain Mode Manager - Sequential persona execution with context handoff
 * Coordinates specialized personas in ordered workflows with state preservation
 */
import { ChainConfiguration, ChainExecution, ChainLink, ChainResult, PersonaSpecialization, ContextHandoff, ExecutionContext } from '../types/index.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';
import { ContextPreserver } from '../shared/ContextPreserver.js';
export declare class ChainModeManager {
    private performanceTracker;
    private contextPreserver;
    private activeChains;
    private personaConfigurations;
    private handoffStrategies;
    constructor(performanceTracker: PerformanceTracker, contextPreserver: ContextPreserver);
    /**
     * Start a new chain execution with specified configuration
     */
    startChain(configuration: ChainConfiguration, initialContext: ExecutionContext): Promise<string>;
    /**
     * Execute the next link in the chain
     */
    executeNextLink(chainId: string): Promise<ChainLink>;
    /**
     * Execute the entire chain sequentially
     */
    executeChain(chainId: string): Promise<ChainResult>;
    /**
     * Get current chain status and progress
     */
    getChainStatus(chainId: string): ChainExecution | null;
    /**
     * Get final chain results
     */
    getChainResult(chainId: string): Promise<ChainResult>;
    /**
     * Cancel a running chain
     */
    cancelChain(chainId: string): Promise<void>;
    /**
     * Configure persona-specific settings
     */
    configurePersona(persona: PersonaSpecialization, configuration: Partial<PersonaConfiguration>): void;
    /**
     * Add custom handoff strategy
     */
    addHandoffStrategy(name: string, strategy: HandoffStrategy): void;
    /**
     * Get chain execution statistics
     */
    getChainStatistics(): ChainStatistics;
    private initializePersonaConfigurations;
    private initializeHandoffStrategies;
    private getDefaultPersonaConfiguration;
    private createChainLinks;
    private executePersonaLink;
    private simulatePersonaExecution;
    private performContextHandoff;
    private transformContext;
    private completeChain;
    private aggregateChainOutputs;
    private aggregateFindings;
    private aggregateRecommendations;
    private calculateChainQuality;
    private calculateAverageLinkTime;
    private calculateHandoffOverhead;
    private calculateAverageExecutionTime;
    private calculatePersonaUsageDistribution;
    private calculateHandoffEfficiency;
    private generateChainId;
}
interface PersonaConfiguration {
    timeoutMs: number;
    resourceLimits: {
        memory: number;
        cpu: number;
    };
    qualityThreshold: number;
    retryAttempts: number;
}
interface HandoffStrategy {
    handoff(fromLink: ChainLink, toLink: ChainLink, execution: ChainExecution): Promise<ContextHandoff>;
}
interface ChainStatistics {
    activeChains: number;
    completedChains: number;
    cancelledChains: number;
    failedChains: number;
    averageChainLength: number;
    averageExecutionTime: number;
    personaUsageDistribution: Record<string, number>;
    handoffEfficiency: number;
}
export {};
//# sourceMappingURL=ChainModeManager.d.ts.map