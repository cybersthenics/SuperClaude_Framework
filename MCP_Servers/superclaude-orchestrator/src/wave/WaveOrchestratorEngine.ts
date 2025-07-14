/**
 * Wave Orchestrator Engine - Core orchestration system for complex multi-phase operations
 * Supports Progressive, Systematic, Adaptive, and Enterprise strategies
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  OrchestrationRequest, 
  WavePlan, 
  WaveStrategy, 
  WavePhase, 
  WaveResult,
  WaveStatus,
  ResourceRequirements,
  CheckpointDefinition,
  RollbackResult,
  PhaseResult,
  WavePerformanceMetrics,
  ExecutionContext
} from '../types/index.js';
import { ResourceManager } from '../shared/ResourceManager.js';
import { ContextPreserver } from '../shared/ContextPreserver.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';

export class WaveOrchestratorEngine {
  private resourceManager: ResourceManager;
  private contextPreserver: ContextPreserver;
  private performanceTracker: PerformanceTracker;
  private activeWaves: Map<string, WaveExecution>;
  private checkpoints: Map<string, CheckpointData>;

  constructor(
    resourceManager: ResourceManager,
    contextPreserver: ContextPreserver,
    performanceTracker: PerformanceTracker
  ) {
    this.resourceManager = resourceManager;
    this.contextPreserver = contextPreserver;
    this.performanceTracker = performanceTracker;
    this.activeWaves = new Map();
    this.checkpoints = new Map();
  }

  /**
   * Create a comprehensive wave plan based on operation complexity and strategy
   */
  async createWavePlan(
    operation: OrchestrationRequest,
    strategy?: WaveStrategy
  ): Promise<WavePlan> {
    const startTime = Date.now();

    // Analyze operation complexity
    const complexity = await this.analyzeComplexity(operation);
    
    // Select appropriate wave strategy
    const selectedStrategy = strategy || this.selectStrategy(complexity);
    
    // Create phase breakdown
    const phases = await this.createPhases(operation, selectedStrategy);
    
    // Estimate resources and timing
    const resources = await this.estimateResources(phases);
    
    const waveId = this.generateWaveId();
    const plan: WavePlan = {
      waveId,
      strategy: selectedStrategy,
      phases,
      totalEstimatedTime: this.calculateTotalTime(phases),
      resourceRequirements: resources,
      checkpoints: this.createCheckpoints(phases)
    };

    // Record performance
    this.performanceTracker.recordWaveCoordination(
      waveId,
      Date.now() - startTime
    );

    return plan;
  }

  /**
   * Execute a wave plan with proper coordination and monitoring
   */
  async executeWave(
    plan: WavePlan,
    options: { monitorProgress?: boolean; enableRollback?: boolean } = {}
  ): Promise<WaveResult> {
    const { monitorProgress = true, enableRollback = true } = options;
    const startTime = Date.now();

    const waveExecution: WaveExecution = {
      waveId: plan.waveId,
      strategy: plan.strategy,
      status: 'running',
      phases: plan.phases,
      completedPhases: [],
      currentPhase: plan.phases[0]?.phaseId || null,
      results: [],
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + plan.totalEstimatedTime)
    };

    this.activeWaves.set(plan.waveId, waveExecution);

    try {
      // Execute phases according to strategy
      const results = await this.executePhases(plan, waveExecution);
      
      // Calculate performance metrics
      const performanceMetrics: WavePerformanceMetrics = {
        coordinationTime: Date.now() - startTime,
        totalExecutionTime: Date.now() - startTime,
        phaseTimings: this.calculatePhaseTimings(results),
        resourceUtilization: await this.calculateResourceUtilization(plan.waveId),
        checkpointOverhead: this.calculateCheckpointOverhead(plan.checkpoints)
      };

      const finalResult: WaveResult = {
        waveId: plan.waveId,
        status: 'completed',
        completedPhases: results,
        currentPhase: null,
        results: results.map(r => r.output),
        performanceMetrics
      };

      // Clean up
      this.activeWaves.delete(plan.waveId);
      
      return finalResult;

    } catch (error) {
      // Handle rollback if enabled
      if (enableRollback) {
        await this.handleWaveFailure(plan.waveId, error);
      }
      
      waveExecution.status = 'failed';
      this.activeWaves.delete(plan.waveId);
      
      throw error;
    }
  }

  /**
   * Get current status of a wave execution
   */
  async getWaveStatus(waveId: string): Promise<WaveStatus> {
    const execution = this.activeWaves.get(waveId);
    if (!execution) {
      throw new Error(`Wave execution ${waveId} not found`);
    }

    const progress = execution.completedPhases.length / execution.phases.length;
    const estimatedCompletion = new Date(
      Date.now() + (execution.estimatedCompletion.getTime() - Date.now()) * (1 - progress)
    );

    return {
      waveId,
      status: execution.status,
      currentPhase: execution.currentPhase,
      progress,
      estimatedCompletion
    };
  }

  /**
   * Rollback to a previous wave phase
   */
  async rollbackWavePhase(
    waveId: string, 
    targetPhase: string,
    options: { preserveCheckpoints?: boolean } = {}
  ): Promise<RollbackResult> {
    const { preserveCheckpoints = true } = options;
    const execution = this.activeWaves.get(waveId);
    
    if (!execution) {
      throw new Error(`Wave execution ${waveId} not found`);
    }

    const targetIndex = execution.phases.findIndex(p => p.phaseId === targetPhase);
    if (targetIndex === -1) {
      throw new Error(`Target phase ${targetPhase} not found in wave ${waveId}`);
    }

    // Identify phases to rollback
    const rolledBackPhases = execution.completedPhases
      .slice(targetIndex + 1)
      .map(p => p.phaseId);

    // Perform rollback
    execution.completedPhases = execution.completedPhases.slice(0, targetIndex + 1);
    execution.currentPhase = targetPhase;
    execution.status = 'running';

    // Handle checkpoints
    let preservedCheckpoints: string[] = [];
    if (preserveCheckpoints) {
      preservedCheckpoints = await this.preserveCheckpoints(waveId, targetPhase);
    }

    return {
      success: true,
      rolledBackPhases,
      currentPhase: targetPhase,
      preservedCheckpoints
    };
  }

  // Private helper methods

  private async analyzeComplexity(operation: OrchestrationRequest): Promise<number> {
    let complexity = operation.complexity || 0;
    
    // Adjust based on file count
    if (operation.fileCount > 100) complexity += 0.3;
    else if (operation.fileCount > 50) complexity += 0.2;
    else if (operation.fileCount > 20) complexity += 0.1;
    
    // Adjust based on domains
    complexity += operation.domains.length * 0.1;
    
    // Adjust based on operation types
    complexity += (operation.operationTypes?.length || 1) * 0.05;
    
    return Math.min(complexity, 1.0);
  }

  private selectStrategy(complexity: number): WaveStrategy {
    if (complexity >= 0.9) return 'enterprise';
    if (complexity >= 0.7) return 'adaptive';
    if (complexity >= 0.5) return 'systematic';
    return 'progressive';
  }

  private async createPhases(
    operation: OrchestrationRequest,
    strategy: WaveStrategy
  ): Promise<WavePhase[]> {
    switch (strategy) {
      case 'progressive':
        return this.createProgressivePhases(operation);
      case 'systematic':
        return this.createSystematicPhases(operation);
      case 'adaptive':
        return this.createAdaptivePhases(operation);
      case 'enterprise':
        return this.createEnterprisePhases(operation);
      default:
        throw new Error(`Unknown wave strategy: ${strategy}`);
    }
  }

  private async createProgressivePhases(operation: OrchestrationRequest): Promise<WavePhase[]> {
    return [
      {
        phaseId: uuidv4(),
        name: 'Initial Analysis',
        servers: ['superclaude-router'],
        personas: ['analyzer'],
        dependencies: [],
        parallel: false,
        timeout: 60000,
        validationCriteria: {
          required: ['analysis_complete'],
          optional: ['recommendations'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Incremental Implementation',
        servers: ['superclaude-tasks'],
        personas: ['refactorer'],
        dependencies: [],
        parallel: false,
        timeout: 300000,
        validationCriteria: {
          required: ['implementation_complete'],
          optional: ['quality_metrics'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Validation & Feedback',
        servers: ['superclaude-quality'],
        personas: ['qa'],
        dependencies: [],
        parallel: false,
        timeout: 120000,
        validationCriteria: {
          required: ['validation_complete'],
          optional: ['feedback'],
          constraints: {}
        }
      }
    ];
  }

  private async createSystematicPhases(operation: OrchestrationRequest): Promise<WavePhase[]> {
    return [
      {
        phaseId: uuidv4(),
        name: 'Comprehensive Analysis',
        servers: ['superclaude-router', 'superclaude-intelligence'],
        personas: ['analyzer', 'architect'],
        dependencies: [],
        parallel: true,
        timeout: 300000,
        validationCriteria: {
          required: ['deep_analysis', 'architecture_review'],
          optional: ['patterns_identified'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Strategic Planning',
        servers: ['superclaude-intelligence'],
        personas: ['architect'],
        dependencies: [],
        parallel: false,
        timeout: 180000,
        validationCriteria: {
          required: ['strategy_defined'],
          optional: ['risk_assessment'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Coordinated Implementation',
        servers: ['superclaude-tasks', 'superclaude-code'],
        personas: ['backend', 'frontend'],
        dependencies: [],
        parallel: true,
        timeout: 600000,
        validationCriteria: {
          required: ['implementation_complete'],
          optional: ['performance_metrics'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Quality Assurance',
        servers: ['superclaude-quality'],
        personas: ['qa', 'security'],
        dependencies: [],
        parallel: true,
        timeout: 240000,
        validationCriteria: {
          required: ['qa_complete', 'security_validated'],
          optional: ['compliance_check'],
          constraints: {}
        }
      }
    ];
  }

  private async createAdaptivePhases(operation: OrchestrationRequest): Promise<WavePhase[]> {
    const basePhases = await this.createSystematicPhases(operation);
    
    // Add adaptive elements based on operation characteristics
    if (operation.domains.includes('security')) {
      basePhases.splice(1, 0, {
        phaseId: uuidv4(),
        name: 'Security Assessment',
        servers: ['superclaude-intelligence'],
        personas: ['security'],
        dependencies: [],
        parallel: false,
        timeout: 180000,
        validationCriteria: {
          required: ['security_assessment'],
          optional: ['threat_model'],
          constraints: {}
        }
      });
    }

    if (operation.fileCount > 100) {
      basePhases.push({
        phaseId: uuidv4(),
        name: 'Performance Optimization',
        servers: ['superclaude-performance'],
        personas: ['performance'],
        dependencies: [],
        parallel: false,
        timeout: 300000,
        validationCriteria: {
          required: ['performance_optimized'],
          optional: ['benchmarks'],
          constraints: {}
        }
      });
    }

    return basePhases;
  }

  private async createEnterprisePhases(operation: OrchestrationRequest): Promise<WavePhase[]> {
    return [
      {
        phaseId: uuidv4(),
        name: 'Enterprise Discovery',
        servers: ['superclaude-router', 'superclaude-intelligence'],
        personas: ['analyzer', 'architect'],
        dependencies: [],
        parallel: true,
        timeout: 600000,
        validationCriteria: {
          required: ['discovery_complete', 'architecture_mapped'],
          optional: ['dependency_graph'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Risk Assessment',
        servers: ['superclaude-intelligence'],
        personas: ['security', 'architect'],
        dependencies: [],
        parallel: true,
        timeout: 300000,
        validationCriteria: {
          required: ['risk_assessment', 'mitigation_plan'],
          optional: ['compliance_review'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Strategic Implementation',
        servers: ['superclaude-tasks', 'superclaude-code'],
        personas: ['backend', 'frontend', 'devops'],
        dependencies: [],
        parallel: true,
        timeout: 1200000,
        validationCriteria: {
          required: ['implementation_complete'],
          optional: ['integration_tests'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Quality & Performance Validation',
        servers: ['superclaude-quality', 'superclaude-performance'],
        personas: ['qa', 'performance'],
        dependencies: [],
        parallel: true,
        timeout: 600000,
        validationCriteria: {
          required: ['quality_validated', 'performance_benchmarked'],
          optional: ['scalability_tested'],
          constraints: {}
        }
      },
      {
        phaseId: uuidv4(),
        name: 'Enterprise Deployment',
        servers: ['superclaude-orchestrator'],
        personas: ['devops'],
        dependencies: [],
        parallel: false,
        timeout: 300000,
        validationCriteria: {
          required: ['deployment_complete'],
          optional: ['monitoring_enabled'],
          constraints: {}
        }
      }
    ];
  }

  private async estimateResources(phases: WavePhase[]): Promise<ResourceRequirements> {
    let totalMemory = 0;
    let totalCpu = 0;
    let maxConcurrency = 0;
    let maxTimeout = 0;

    for (const phase of phases) {
      // Estimate based on servers and personas involved
      const phaseMemory = phase.servers.length * 512 + phase.personas.length * 256;
      const phaseCpu = phase.servers.length * 0.5 + phase.personas.length * 0.3;
      
      totalMemory += phaseMemory;
      totalCpu += phaseCpu;
      
      if (phase.parallel) {
        maxConcurrency = Math.max(maxConcurrency, phase.servers.length + phase.personas.length);
      }
      
      maxTimeout = Math.max(maxTimeout, phase.timeout);
    }

    return {
      memory: totalMemory,
      cpu: totalCpu,
      concurrency: maxConcurrency,
      timeout: maxTimeout
    };
  }

  private calculateTotalTime(phases: WavePhase[]): number {
    let totalTime = 0;
    let parallelTime = 0;

    for (const phase of phases) {
      if (phase.parallel) {
        parallelTime = Math.max(parallelTime, phase.timeout);
      } else {
        totalTime += parallelTime + phase.timeout;
        parallelTime = 0;
      }
    }

    return totalTime + parallelTime;
  }

  private createCheckpoints(phases: WavePhase[]): CheckpointDefinition[] {
    return phases.map(phase => ({
      checkpointId: uuidv4(),
      phaseId: phase.phaseId,
      description: `Checkpoint for ${phase.name}`,
      rollbackStrategy: 'phase' as const
    }));
  }

  private generateWaveId(): string {
    return `wave_${uuidv4()}`;
  }

  private async executePhases(plan: WavePlan, execution: WaveExecution): Promise<PhaseResult[]> {
    const results: PhaseResult[] = [];

    for (const phase of plan.phases) {
      execution.currentPhase = phase.phaseId;
      
      try {
        const result = await this.executePhase(phase);
        results.push(result);
        execution.completedPhases.push(result);
        
        // Create checkpoint
        await this.createPhaseCheckpoint(phase, result);
        
      } catch (error) {
        // Phase failed - handle according to strategy
        throw new Error(`Phase ${phase.name} failed: ${error}`);
      }
    }

    return results;
  }

  private async executePhase(phase: WavePhase): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Simulate phase execution - In real implementation, this would
    // coordinate with actual servers and personas
    await new Promise(resolve => setTimeout(resolve, Math.min(phase.timeout / 10, 1000)));
    
    const executionTime = Date.now() - startTime;
    
    return {
      phaseId: phase.phaseId,
      status: 'completed',
      output: {
        phase: phase.name,
        servers: phase.servers,
        personas: phase.personas,
        executionTime
      },
      context: {
        executionId: uuidv4(),
        command: 'wave_execution',
        flags: [],
        scope: [],
        metadata: { phase: phase.name },
        timestamp: new Date()
      },
      metrics: {
        executionTime,
        resourceUsage: {
          memory: 100,
          cpu: 0.5,
          io: 10
        },
        validationTime: 50
      }
    };
  }

  private async createPhaseCheckpoint(phase: WavePhase, result: PhaseResult): Promise<void> {
    const checkpointData = {
      checkpointId: uuidv4(),
      timestamp: new Date(),
      state: result.output,
      context: result.context,
      validationResults: []
    };
    
    this.checkpoints.set(phase.phaseId, checkpointData);
  }

  private calculatePhaseTimings(results: PhaseResult[]): Record<string, number> {
    const timings: Record<string, number> = {};
    
    for (const result of results) {
      timings[result.phaseId] = result.metrics.executionTime;
    }
    
    return timings;
  }

  private async calculateResourceUtilization(waveId: string): Promise<number> {
    // Simplified calculation - in real implementation would use actual resource monitoring
    return 0.75; // 75% utilization
  }

  private calculateCheckpointOverhead(checkpoints: CheckpointDefinition[]): number {
    // Each checkpoint adds ~50ms overhead
    return checkpoints.length * 50;
  }

  private async handleWaveFailure(waveId: string, error: any): Promise<void> {
    console.error(`Wave ${waveId} failed:`, error);
    // Implement rollback logic
  }

  private async preserveCheckpoints(waveId: string, targetPhase: string): Promise<string[]> {
    // Implementation would preserve checkpoints up to target phase
    return [`checkpoint_${targetPhase}`];
  }
}

// Supporting interfaces for internal use
interface WaveExecution {
  waveId: string;
  strategy: WaveStrategy;
  status: 'running' | 'completed' | 'failed' | 'rolled_back';
  phases: WavePhase[];
  completedPhases: PhaseResult[];
  currentPhase: string | null;
  results: any[];
  startTime: Date;
  estimatedCompletion: Date;
}

interface CheckpointData {
  checkpointId: string;
  timestamp: Date;
  state: any;
  context: ExecutionContext;
  validationResults: any[];
}