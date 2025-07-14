/**
 * Delegation Engine - Intelligent task distribution across specialized sub-agents
 * Supports file-based, folder-based, and auto delegation strategies
 */
import { DelegationTask, DelegationResult, DelegationStrategy, DelegationStrategyConfig, SubAgentResults } from '../types/index.js';
import { SubAgentManager } from './SubAgentManager.js';
import { ConcurrencyController } from './ConcurrencyController.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';
export declare class DelegationEngine {
    private subAgentManager;
    private concurrencyController;
    private performanceTracker;
    private activeDelegations;
    private strategyConfigurations;
    constructor(subAgentManager: SubAgentManager, concurrencyController: ConcurrencyController, performanceTracker: PerformanceTracker);
    /**
     * Delegate task to specialized sub-agents
     */
    delegateToSubAgents(task: DelegationTask, strategy: DelegationStrategyConfig): Promise<DelegationResult>;
    /**
     * Configure delegation strategy parameters
     */
    configureDelegationStrategy(strategy: DelegationStrategy, configuration: any): void;
    /**
     * Get aggregated results from sub-agents
     */
    getSubAgentResults(delegationId: string): Promise<SubAgentResults>;
    /**
     * Manage concurrent sub-agent execution
     */
    manageConcurrency(maxConcurrent: number): void;
    /**
     * Get delegation statistics
     */
    getDelegationStatistics(): DelegationStatistics;
    private initializeDefaultStrategies;
    private createDelegationPlan;
    private createFileBasedSubTasks;
    private createFolderBasedSubTasks;
    private createAutoSubTasks;
    private createMixedSubTasks;
    private createSubAgents;
    private executeDelegation;
    private waitForDelegationCompletion;
    private aggregateSubAgentResults;
    private aggregateResults;
    private calculateDelegationEfficiency;
    private mergeFindingsFromResults;
    private generateAggregatedRecommendations;
    private deduplicateAndSortFindings;
    private isFile;
    private groupFilesByFolder;
    private categorizeFilesByType;
    private getFileTypeCategory;
    private analyzeTaskComplexity;
    private calculateOptimalChunkSize;
    private calculateFilePriority;
    private calculateFolderPriority;
    private calculateTypePriority;
    private determineOptimalSpecialization;
    private estimateDuration;
    private calculateStrategyDistribution;
    private generateDelegationId;
}
interface DelegationStatistics {
    activeDelegations: number;
    completedDelegations: number;
    averageSubAgentCount: number;
    averageEfficiency: number;
    strategyDistribution: Record<string, number>;
}
export {};
//# sourceMappingURL=DelegationEngine.d.ts.map