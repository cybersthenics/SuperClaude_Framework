/**
 * Hybrid Orchestrator - Combines Wave, Delegation, Loop, and Chain patterns
 * Enables complex orchestration scenarios with pattern combinations
 */

import { WaveOrchestratorEngine } from '../wave/WaveOrchestratorEngine.js';
import { DelegationEngine } from '../delegation/DelegationEngine.js';
import { LoopModeController } from '../loop/LoopModeController.js';
import { ChainModeManager } from '../chain/ChainModeManager.js';
import { 
  HybridConfiguration,
  HybridResult,
  OrchestrationPattern,
  ExecutionContext,
  PersonaSpecialization 
} from '../types/index.js';

export class HybridOrchestrator {
  private waveEngine: WaveOrchestratorEngine;
  private delegationEngine: DelegationEngine;
  private loopController: LoopModeController;
  private chainManager: ChainModeManager;

  constructor(
    waveEngine: WaveOrchestratorEngine,
    delegationEngine: DelegationEngine,
    loopController: LoopModeController,
    chainManager: ChainModeManager
  ) {
    this.waveEngine = waveEngine;
    this.delegationEngine = delegationEngine;
    this.loopController = loopController;
    this.chainManager = chainManager;
  }

  /**
   * Execute hybrid orchestration with multiple patterns
   */
  async executeHybrid(
    configuration: HybridConfiguration,
    context: ExecutionContext
  ): Promise<HybridResult> {
    console.log(`🌊 Starting hybrid orchestration: ${configuration.patterns.join(' + ')}`);

    const results: any[] = [];
    let currentContext = { ...context };

    for (const pattern of configuration.patterns) {
      const patternResult = await this.executePattern(pattern, currentContext, configuration);
      results.push(patternResult);
      
      // Update context with results for next pattern
      currentContext = this.mergeContextWithResults(currentContext, patternResult);
    }

    return {
      hybridId: `hybrid_${Date.now()}`,
      patterns: configuration.patterns,
      results,
      overallQuality: this.calculateOverallQuality(results),
      executionTime: this.calculateTotalExecutionTime(results)
    };
  }

  /**
   * Execute a specific orchestration pattern
   */
  private async executePattern(
    pattern: OrchestrationPattern,
    context: ExecutionContext,
    config: HybridConfiguration
  ): Promise<any> {
    switch (pattern.type) {
      case 'wave':
        return await this.executeWavePattern(pattern, context);
      case 'delegation':
        return await this.executeDelegationPattern(pattern, context);
      case 'loop':
        return await this.executeLoopPattern(pattern, context);
      case 'chain':
        return await this.executeChainPattern(pattern, context);
      default:
        throw new Error(`Unknown pattern type: ${pattern.type}`);
    }
  }

  private async executeWavePattern(pattern: OrchestrationPattern, context: ExecutionContext): Promise<any> {
    const operation = {
      type: 'hybrid_wave',
      complexity: 0.7,
      fileCount: 30,
      domains: ['analysis'],
      operationTypes: ['improvement']
    };

    const plan = await this.waveEngine.createWavePlan(operation, 'adaptive');
    return await this.waveEngine.executeWave(plan);
  }

  private async executeDelegationPattern(pattern: OrchestrationPattern, context: ExecutionContext): Promise<any> {
    const task = {
      type: 'hybrid_delegation',
      scope: context.scope,
      requirements: ['parallel analysis'],
      context
    };

    const strategy = { 
      type: 'auto' as const, 
      concurrency: 5, 
      resourceAllocation: 'dynamic' as const 
    };
    return await this.delegationEngine.delegateToSubAgents(task, strategy);
  }

  private async executeLoopPattern(pattern: OrchestrationPattern, context: ExecutionContext): Promise<any> {
    const config = {
      mode: 'enhance' as const,
      maxIterations: 3,
      enableInteractiveMode: false,
      qualityGates: ['minimum_quality']
    };

    const loopId = await this.loopController.startLoop(config, context);
    
    // Execute iterations
    for (let i = 0; i < 3; i++) {
      await this.loopController.executeIteration(loopId);
    }
    
    return this.loopController.getLoopStatus(loopId);
  }

  private async executeChainPattern(pattern: OrchestrationPattern, context: ExecutionContext): Promise<any> {
    const config = {
      personas: ['analyzer', 'architect'] as PersonaSpecialization[],
      strategy: 'sequential' as const,
      contextPreservation: 'essential' as const,
      enableValidation: true
    };

    const chainId = await this.chainManager.startChain(config, context);
    return await this.chainManager.executeChain(chainId);
  }

  private mergeContextWithResults(context: ExecutionContext, result: any): ExecutionContext {
    return {
      ...context,
      metadata: {
        ...context.metadata,
        previousResult: result,
        timestamp: new Date()
      },
      timestamp: new Date()
    };
  }

  private calculateOverallQuality(results: any[]): number {
    if (results.length === 0) return 0;
    
    let totalQuality = 0;
    let count = 0;

    for (const result of results) {
      if (result.finalQualityScore) {
        totalQuality += result.finalQualityScore;
        count++;
      } else if (result.performance?.overallScore) {
        totalQuality += result.performance.overallScore / 100;
        count++;
      }
    }

    return count > 0 ? totalQuality / count : 0.75; // Default quality
  }

  private calculateTotalExecutionTime(results: any[]): number {
    return results.reduce((total, result) => {
      if (result.performance?.totalExecutionTime) {
        return total + result.performance.totalExecutionTime;
      } else if (result.estimatedCompletionTime) {
        return total + result.estimatedCompletionTime;
      }
      return total + 1000; // Default 1s
    }, 0);
  }
}

// Common hybrid patterns
export const HYBRID_PATTERNS = {
  // Wave → Loop: Multi-phase improvement with iterative refinement
  WAVE_LOOP: {
    name: 'Wave + Loop',
    description: 'Multi-phase orchestration with iterative refinement',
    patterns: [
      { type: 'wave', config: { strategy: 'progressive' } },
      { type: 'loop', config: { mode: 'refine', maxIterations: 5 } }
    ]
  },

  // Chain → Delegation: Persona analysis followed by parallel processing
  CHAIN_DELEGATION: {
    name: 'Chain + Delegation', 
    description: 'Sequential expertise analysis with parallel execution',
    patterns: [
      { type: 'chain', config: { personas: ['analyzer', 'architect'] } },
      { type: 'delegation', config: { strategy: 'auto', concurrency: 7 } }
    ]
  },

  // Full Stack: All patterns in sequence
  FULL_ORCHESTRATION: {
    name: 'Full Orchestration',
    description: 'Complete orchestration using all patterns',
    patterns: [
      { type: 'wave', config: { strategy: 'systematic' } },
      { type: 'chain', config: { personas: ['analyzer', 'architect', 'qa'] } },
      { type: 'delegation', config: { strategy: 'folders', concurrency: 5 } },
      { type: 'loop', config: { mode: 'polish', maxIterations: 3 } }
    ]
  }
};