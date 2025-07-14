/**
 * Hybrid Orchestrator - Combines Wave, Delegation, Loop, and Chain patterns
 * Enables complex orchestration scenarios with pattern combinations
 */
import { WaveOrchestratorEngine } from '../wave/WaveOrchestratorEngine.js';
import { DelegationEngine } from '../delegation/DelegationEngine.js';
import { LoopModeController } from '../loop/LoopModeController.js';
import { ChainModeManager } from '../chain/ChainModeManager.js';
import { HybridConfiguration, HybridResult, ExecutionContext } from '../types/index.js';
export declare class HybridOrchestrator {
    private waveEngine;
    private delegationEngine;
    private loopController;
    private chainManager;
    constructor(waveEngine: WaveOrchestratorEngine, delegationEngine: DelegationEngine, loopController: LoopModeController, chainManager: ChainModeManager);
    /**
     * Execute hybrid orchestration with multiple patterns
     */
    executeHybrid(configuration: HybridConfiguration, context: ExecutionContext): Promise<HybridResult>;
    /**
     * Execute a specific orchestration pattern
     */
    private executePattern;
    private executeWavePattern;
    private executeDelegationPattern;
    private executeLoopPattern;
    private executeChainPattern;
    private mergeContextWithResults;
    private calculateOverallQuality;
    private calculateTotalExecutionTime;
}
export declare const HYBRID_PATTERNS: {
    WAVE_LOOP: {
        name: string;
        description: string;
        patterns: ({
            type: string;
            config: {
                strategy: string;
                mode?: never;
                maxIterations?: never;
            };
        } | {
            type: string;
            config: {
                mode: string;
                maxIterations: number;
                strategy?: never;
            };
        })[];
    };
    CHAIN_DELEGATION: {
        name: string;
        description: string;
        patterns: ({
            type: string;
            config: {
                personas: string[];
                strategy?: never;
                concurrency?: never;
            };
        } | {
            type: string;
            config: {
                strategy: string;
                concurrency: number;
                personas?: never;
            };
        })[];
    };
    FULL_ORCHESTRATION: {
        name: string;
        description: string;
        patterns: ({
            type: string;
            config: {
                strategy: string;
                personas?: never;
                concurrency?: never;
                mode?: never;
                maxIterations?: never;
            };
        } | {
            type: string;
            config: {
                personas: string[];
                strategy?: never;
                concurrency?: never;
                mode?: never;
                maxIterations?: never;
            };
        } | {
            type: string;
            config: {
                strategy: string;
                concurrency: number;
                personas?: never;
                mode?: never;
                maxIterations?: never;
            };
        } | {
            type: string;
            config: {
                mode: string;
                maxIterations: number;
                strategy?: never;
                personas?: never;
                concurrency?: never;
            };
        })[];
    };
};
//# sourceMappingURL=HybridOrchestrator.d.ts.map