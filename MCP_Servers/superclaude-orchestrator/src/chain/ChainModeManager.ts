/**
 * Chain Mode Manager - Sequential persona execution with context handoff
 * Coordinates specialized personas in ordered workflows with state preservation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ChainConfiguration,
  ChainExecution,
  ChainLink,
  ChainResult,
  PersonaSpecialization,
  ContextHandoff,
  ChainStrategy,
  ExecutionContext
} from '../types/index.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';
import { ContextPreserver } from '../shared/ContextPreserver.js';

export class ChainModeManager {
  private performanceTracker: PerformanceTracker;
  private contextPreserver: ContextPreserver;
  private activeChains: Map<string, ChainExecution>;
  private personaConfigurations: Map<PersonaSpecialization, PersonaConfiguration>;
  private handoffStrategies: Map<string, HandoffStrategy>;

  constructor(
    performanceTracker: PerformanceTracker,
    contextPreserver: ContextPreserver
  ) {
    this.performanceTracker = performanceTracker;
    this.contextPreserver = contextPreserver;
    this.activeChains = new Map();
    this.personaConfigurations = new Map();
    this.handoffStrategies = new Map();
    
    this.initializePersonaConfigurations();
    this.initializeHandoffStrategies();
  }

  /**
   * Start a new chain execution with specified configuration
   */
  async startChain(
    configuration: ChainConfiguration,
    initialContext: ExecutionContext
  ): Promise<string> {
    const chainId = this.generateChainId();
    const startTime = Date.now();

    console.log(`🔗 Starting chain: ${chainId} (${configuration.strategy} strategy, ${configuration.personas.length} personas)`);

    // Create chain links from persona sequence
    const chainLinks = await this.createChainLinks(configuration, initialContext);

    const execution: ChainExecution = {
      chainId,
      configuration,
      chainLinks,
      currentLinkIndex: 0,
      status: 'running',
      startTime: new Date(),
      context: initialContext,
      handoffHistory: [],
      results: []
    };

    this.activeChains.set(chainId, execution);

    // Preserve initial context
    const contextSnapshotId = await this.contextPreserver.preserveContext(
      chainId,
      initialContext,
      { phase: 'initial', persona: 'none' }
    );

    execution.initialContextSnapshot = contextSnapshotId;

    return chainId;
  }

  /**
   * Execute the next link in the chain
   */
  async executeNextLink(chainId: string): Promise<ChainLink> {
    const execution = this.activeChains.get(chainId);
    if (!execution) {
      throw new Error(`Chain ${chainId} not found`);
    }

    if (execution.status !== 'running') {
      throw new Error(`Chain ${chainId} is not in running state`);
    }

    if (execution.currentLinkIndex >= execution.chainLinks.length) {
      throw new Error(`Chain ${chainId} has no more links to execute`);
    }

    const currentLink = execution.chainLinks[execution.currentLinkIndex];
    if (!currentLink) {
      throw new Error(`No link found at index ${execution.currentLinkIndex}`);
    }

    const linkStartTime = Date.now();

    console.log(`🎭 Executing link ${execution.currentLinkIndex + 1}/${execution.chainLinks.length}: ${currentLink.persona} persona`);

    try {
      // Execute persona-specific logic
      const linkResult = await this.executePersonaLink(currentLink, execution);

      // Update link with results
      currentLink.output = linkResult.output;
      currentLink.metrics = linkResult.metrics;
      currentLink.status = 'completed';
      currentLink.endTime = new Date();

      // Handle context handoff to next persona
      if (execution.currentLinkIndex < execution.chainLinks.length - 1) {
        const nextLink = execution.chainLinks[execution.currentLinkIndex + 1];
        if (nextLink) {
          await this.performContextHandoff(currentLink, nextLink, execution);
        }
      }

      // Update execution state
      execution.currentLinkIndex++;
      execution.results.push(currentLink);

      // Check if chain is complete
      if (execution.currentLinkIndex >= execution.chainLinks.length) {
        await this.completeChain(execution);
      }

      console.log(`✅ Link completed: ${currentLink.persona} (duration: ${linkResult.metrics.executionTime}ms)`);

      return currentLink;

    } catch (error) {
      currentLink.status = 'failed';
      currentLink.error = error;
      execution.status = 'failed';
      throw error;
    }
  }

  /**
   * Execute the entire chain sequentially
   */
  async executeChain(chainId: string): Promise<ChainResult> {
    const execution = this.activeChains.get(chainId);
    if (!execution) {
      throw new Error(`Chain ${chainId} not found`);
    }

    console.log(`🏃 Executing full chain: ${chainId}`);

    try {
      // Execute all links in sequence
      while (execution.currentLinkIndex < execution.chainLinks.length && execution.status === 'running') {
        await this.executeNextLink(chainId);
      }

      if (execution.status === 'completed') {
        return await this.getChainResult(chainId);
      } else {
        throw new Error(`Chain execution failed with status: ${execution.status}`);
      }

    } catch (error) {
      execution.status = 'failed';
      throw error;
    }
  }

  /**
   * Get current chain status and progress
   */
  getChainStatus(chainId: string): ChainExecution | null {
    return this.activeChains.get(chainId) || null;
  }

  /**
   * Get final chain results
   */
  async getChainResult(chainId: string): Promise<ChainResult> {
    const execution = this.activeChains.get(chainId);
    if (!execution) {
      throw new Error(`Chain ${chainId} not found`);
    }

    if (execution.status !== 'completed') {
      throw new Error(`Chain ${chainId} is not completed`);
    }

    return {
      chainId: execution.chainId,
      totalLinks: execution.chainLinks.length,
      completedLinks: execution.results.length,
      finalOutput: this.aggregateChainOutputs(execution),
      performance: {
        totalExecutionTime: execution.endTime!.getTime() - execution.startTime.getTime(),
        linkExecutionTimes: execution.results.map(link => link.metrics?.executionTime || 0),
        averageLinkTime: this.calculateAverageLinkTime(execution),
        handoffOverhead: this.calculateHandoffOverhead(execution)
      },
      handoffHistory: execution.handoffHistory,
      finalContext: execution.context
    };
  }

  /**
   * Cancel a running chain
   */
  async cancelChain(chainId: string): Promise<void> {
    const execution = this.activeChains.get(chainId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      console.log(`❌ Chain cancelled: ${chainId}`);
    }
  }

  /**
   * Configure persona-specific settings
   */
  configurePersona(
    persona: PersonaSpecialization,
    configuration: Partial<PersonaConfiguration>
  ): void {
    const existing = this.personaConfigurations.get(persona) || this.getDefaultPersonaConfiguration(persona);
    const updated = { ...existing, ...configuration };
    this.personaConfigurations.set(persona, updated);
    console.log(`⚙️ Persona configured: ${persona}`);
  }

  /**
   * Add custom handoff strategy
   */
  addHandoffStrategy(name: string, strategy: HandoffStrategy): void {
    this.handoffStrategies.set(name, strategy);
    console.log(`🔄 Handoff strategy added: ${name}`);
  }

  /**
   * Get chain execution statistics
   */
  getChainStatistics(): ChainStatistics {
    const activeChains = Array.from(this.activeChains.values());
    const completedChains = activeChains.filter(chain => chain.status === 'completed');
    
    return {
      activeChains: activeChains.filter(chain => chain.status === 'running').length,
      completedChains: completedChains.length,
      cancelledChains: activeChains.filter(chain => chain.status === 'cancelled').length,
      failedChains: activeChains.filter(chain => chain.status === 'failed').length,
      averageChainLength: completedChains.length > 0 ? 
        completedChains.reduce((sum, chain) => sum + chain.chainLinks.length, 0) / completedChains.length : 0,
      averageExecutionTime: this.calculateAverageExecutionTime(completedChains),
      personaUsageDistribution: this.calculatePersonaUsageDistribution(completedChains),
      handoffEfficiency: this.calculateHandoffEfficiency(completedChains)
    };
  }

  // Private implementation methods

  private initializePersonaConfigurations(): void {
    const personas: PersonaSpecialization[] = [
      'analyzer', 'architect', 'frontend', 'backend', 'security', 
      'performance', 'qa', 'devops', 'mentor', 'refactorer', 'scribe'
    ];

    for (const persona of personas) {
      this.personaConfigurations.set(persona, this.getDefaultPersonaConfiguration(persona));
    }
  }

  private initializeHandoffStrategies(): void {
    // Sequential handoff strategy
    this.handoffStrategies.set('sequential', {
      handoff: async (fromLink: ChainLink, toLink: ChainLink, execution: ChainExecution): Promise<ContextHandoff> => {
        return {
          handoffId: uuidv4(),
          fromPersona: fromLink.persona,
          toPersona: toLink.persona,
          contextTransformation: 'sequential',
          preservedElements: ['metadata', 'scope', 'results'],
          transformedElements: ['focus', 'perspective'],
          timestamp: new Date()
        };
      }
    });

    // Cumulative handoff strategy
    this.handoffStrategies.set('cumulative', {
      handoff: async (fromLink: ChainLink, toLink: ChainLink, execution: ChainExecution): Promise<ContextHandoff> => {
        return {
          handoffId: uuidv4(),
          fromPersona: fromLink.persona,
          toPersona: toLink.persona,
          contextTransformation: 'cumulative',
          preservedElements: ['metadata', 'scope', 'results', 'findings', 'recommendations'],
          transformedElements: ['focus', 'perspective', 'priorities'],
          timestamp: new Date()
        };
      }
    });

    // Focused handoff strategy
    this.handoffStrategies.set('focused', {
      handoff: async (fromLink: ChainLink, toLink: ChainLink, execution: ChainExecution): Promise<ContextHandoff> => {
        return {
          handoffId: uuidv4(),
          fromPersona: fromLink.persona,
          toPersona: toLink.persona,
          contextTransformation: 'focused',
          preservedElements: ['scope', 'primary_findings'],
          transformedElements: ['focus', 'perspective', 'priorities', 'methodology'],
          timestamp: new Date()
        };
      }
    });
  }

  private getDefaultPersonaConfiguration(persona: PersonaSpecialization): PersonaConfiguration {
    const baseConfig = {
      timeoutMs: 30000,
      resourceLimits: { memory: 512, cpu: 1.0 },
      qualityThreshold: 0.7,
      retryAttempts: 2
    };

    const personaSpecificConfigs: Record<PersonaSpecialization, Partial<PersonaConfiguration>> = {
      analyzer: { timeoutMs: 45000, qualityThreshold: 0.8 },
      architect: { timeoutMs: 60000, resourceLimits: { memory: 1024, cpu: 1.5 } },
      frontend: { timeoutMs: 30000, qualityThreshold: 0.75 },
      backend: { timeoutMs: 45000, qualityThreshold: 0.8 },
      security: { timeoutMs: 60000, qualityThreshold: 0.9, retryAttempts: 3 },
      performance: { timeoutMs: 45000, qualityThreshold: 0.85 },
      qa: { timeoutMs: 40000, qualityThreshold: 0.85, retryAttempts: 3 },
      devops: { timeoutMs: 50000, qualityThreshold: 0.8 },
      mentor: { timeoutMs: 35000, qualityThreshold: 0.75 },
      refactorer: { timeoutMs: 40000, qualityThreshold: 0.8 },
      scribe: { timeoutMs: 30000, qualityThreshold: 0.75 }
    };

    return { ...baseConfig, ...personaSpecificConfigs[persona] };
  }

  private async createChainLinks(
    configuration: ChainConfiguration,
    initialContext: ExecutionContext
  ): Promise<ChainLink[]> {
    const links: ChainLink[] = [];

    for (let i = 0; i < configuration.personas.length; i++) {
      const persona = configuration.personas[i];
      if (!persona) {
        throw new Error(`Persona at index ${i} is undefined`);
      }
      const linkId = `${configuration.chainId || 'chain'}_link_${i + 1}`;

      const link: ChainLink = {
        linkId,
        persona,
        order: i,
        input: i === 0 ? initialContext : null, // First link gets initial context
        output: null,
        status: 'pending',
        metrics: {
          executionTime: 0,
          qualityScore: 0,
          handoffTime: 0
        },
        contextSnapshot: null
      };

      links.push(link);
    }

    console.log(`🔗 Created ${links.length} chain links`);
    return links;
  }

  private async executePersonaLink(
    link: ChainLink,
    execution: ChainExecution
  ): Promise<PersonaExecutionResult> {
    const startTime = Date.now();
    const persona = link.persona;
    const config = this.personaConfigurations.get(persona)!;

    console.log(`🎭 Executing ${persona} persona logic`);

    // Simulate persona-specific execution (in real implementation, this would call actual persona logic)
    const executionResult = await this.simulatePersonaExecution(persona, link.input, config);

    const executionTime = Date.now() - startTime;
    
    return {
      output: executionResult.output,
      metrics: {
        executionTime,
        qualityScore: executionResult.qualityScore,
        handoffTime: 0 // Will be updated during handoff
      }
    };
  }

  private async simulatePersonaExecution(
    persona: PersonaSpecialization,
    input: any,
    config: PersonaConfiguration
  ): Promise<SimulatedPersonaResult> {
    // Simulate different execution times and quality scores based on persona
    const personaCharacteristics: Record<PersonaSpecialization, { baseTime: number, qualityRange: [number, number] }> = {
      analyzer: { baseTime: 2000, qualityRange: [0.8, 0.95] },
      architect: { baseTime: 3000, qualityRange: [0.75, 0.9] },
      frontend: { baseTime: 1500, qualityRange: [0.7, 0.85] },
      backend: { baseTime: 2000, qualityRange: [0.75, 0.9] },
      security: { baseTime: 2500, qualityRange: [0.85, 0.95] },
      performance: { baseTime: 2200, qualityRange: [0.8, 0.92] },
      qa: { baseTime: 1800, qualityRange: [0.8, 0.9] },
      devops: { baseTime: 2100, qualityRange: [0.75, 0.88] },
      mentor: { baseTime: 1200, qualityRange: [0.7, 0.85] },
      refactorer: { baseTime: 1800, qualityRange: [0.75, 0.9] },
      scribe: { baseTime: 1000, qualityRange: [0.7, 0.85] }
    };

    const characteristics = personaCharacteristics[persona];
    const simulationTime = characteristics.baseTime + Math.random() * 500; // Add some variance
    
    await new Promise(resolve => setTimeout(resolve, simulationTime));

    const qualityScore = characteristics.qualityRange[0] + 
      Math.random() * (characteristics.qualityRange[1] - characteristics.qualityRange[0]);

    return {
      output: {
        persona,
        findings: [`${persona} analysis completed`, `Quality improvements identified`],
        recommendations: [`Apply ${persona}-specific optimizations`, `Continue to next persona`],
        metrics: {
          linesAnalyzed: Math.floor(Math.random() * 1000) + 500,
          issuesFound: Math.floor(Math.random() * 10) + 1,
          improvementsApplied: Math.floor(Math.random() * 5) + 1
        }
      },
      qualityScore
    };
  }

  private async performContextHandoff(
    fromLink: ChainLink,
    toLink: ChainLink,
    execution: ChainExecution
  ): Promise<void> {
    const handoffStartTime = Date.now();
    
    // Get handoff strategy
    const strategyName = execution.configuration.handoffStrategy || 'sequential';
    const strategy = this.handoffStrategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Unknown handoff strategy: ${strategyName}`);
    }

    // Perform context handoff
    const handoff = await strategy.handoff(fromLink, toLink, execution);
    
    // Transform context based on handoff strategy
    const transformedContext = await this.transformContext(
      execution.context,
      handoff,
      fromLink,
      toLink
    );

    // Update execution context
    execution.context = transformedContext;
    
    // Store handoff information
    execution.handoffHistory.push(handoff);
    
    // Preserve context at handoff point
    const contextSnapshotId = await this.contextPreserver.preserveContext(
      execution.chainId,
      transformedContext,
      { 
        phase: 'handoff',
        fromPersona: fromLink.persona,
        toPersona: toLink.persona,
        handoffId: handoff.handoffId
      }
    );

    toLink.contextSnapshot = contextSnapshotId;
    toLink.input = transformedContext;

    const handoffTime = Date.now() - handoffStartTime;
    fromLink.metrics!.handoffTime = handoffTime;

    console.log(`🔄 Context handoff completed: ${fromLink.persona} → ${toLink.persona} (${handoffTime}ms)`);
  }

  private async transformContext(
    originalContext: ExecutionContext,
    handoff: ContextHandoff,
    fromLink: ChainLink,
    toLink: ChainLink
  ): Promise<ExecutionContext> {
    const transformed = { ...originalContext };

    // Add handoff-specific metadata
    transformed.metadata = {
      ...transformed.metadata,
      previousPersona: fromLink.persona,
      currentPersona: toLink.persona,
      handoffId: handoff.handoffId,
      handoffType: handoff.contextTransformation,
      chainProgress: `${toLink.order + 1}/${toLink.order + 1}` // Simplified
    };

    // Add results from previous persona
    if (fromLink.output) {
      transformed.metadata.previousResults = fromLink.output;
    }

    // Update timestamp
    transformed.timestamp = new Date();

    return transformed;
  }

  private async completeChain(execution: ChainExecution): Promise<void> {
    execution.status = 'completed';
    execution.endTime = new Date();

    const totalTime = execution.endTime.getTime() - execution.startTime.getTime();

    console.log(`🏁 Chain completed: ${execution.chainId} (${execution.results.length} links, ${totalTime}ms total)`);

    // Record performance metrics
    this.performanceTracker.recordChainCompletion(
      execution.chainId,
      execution.results.length,
      totalTime,
      this.calculateChainQuality(execution)
    );
  }

  private aggregateChainOutputs(execution: ChainExecution): any {
    const outputs = execution.results.map(link => link.output).filter(output => output);
    
    return {
      chainId: execution.chainId,
      personaSequence: execution.results.map(link => link.persona),
      aggregatedFindings: this.aggregateFindings(outputs),
      aggregatedRecommendations: this.aggregateRecommendations(outputs),
      qualityProgression: execution.results.map(link => link.metrics?.qualityScore || 0),
      finalQuality: this.calculateChainQuality(execution)
    };
  }

  private aggregateFindings(outputs: any[]): string[] {
    const allFindings = new Set<string>();
    
    for (const output of outputs) {
      if (output && output.findings) {
        output.findings.forEach((finding: string) => allFindings.add(finding));
      }
    }
    
    return Array.from(allFindings);
  }

  private aggregateRecommendations(outputs: any[]): string[] {
    const allRecommendations = new Set<string>();
    
    for (const output of outputs) {
      if (output && output.recommendations) {
        output.recommendations.forEach((rec: string) => allRecommendations.add(rec));
      }
    }
    
    return Array.from(allRecommendations);
  }

  private calculateChainQuality(execution: ChainExecution): number {
    if (execution.results.length === 0) return 0;
    
    const qualityScores = execution.results
      .map(link => link.metrics?.qualityScore || 0)
      .filter(score => score > 0);
    
    if (qualityScores.length === 0) return 0;
    
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private calculateAverageLinkTime(execution: ChainExecution): number {
    if (execution.results.length === 0) return 0;
    
    const executionTimes = execution.results
      .map(link => link.metrics?.executionTime || 0)
      .filter(time => time > 0);
    
    if (executionTimes.length === 0) return 0;
    
    return executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
  }

  private calculateHandoffOverhead(execution: ChainExecution): number {
    if (execution.results.length === 0) return 0;
    
    const handoffTimes = execution.results
      .map(link => link.metrics?.handoffTime || 0)
      .filter(time => time > 0);
    
    if (handoffTimes.length === 0) return 0;
    
    return handoffTimes.reduce((sum, time) => sum + time, 0);
  }

  private calculateAverageExecutionTime(chains: ChainExecution[]): number {
    if (chains.length === 0) return 0;
    
    const totalTimes = chains
      .filter(chain => chain.endTime)
      .map(chain => chain.endTime!.getTime() - chain.startTime.getTime());
    
    if (totalTimes.length === 0) return 0;
    
    return totalTimes.reduce((sum, time) => sum + time, 0) / totalTimes.length;
  }

  private calculatePersonaUsageDistribution(chains: ChainExecution[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const chain of chains) {
      for (const link of chain.results) {
        distribution[link.persona] = (distribution[link.persona] || 0) + 1;
      }
    }
    
    return distribution;
  }

  private calculateHandoffEfficiency(chains: ChainExecution[]): number {
    if (chains.length === 0) return 0;
    
    let totalHandoffs = 0;
    let totalHandoffTime = 0;
    
    for (const chain of chains) {
      for (const link of chain.results) {
        if (link.metrics?.handoffTime) {
          totalHandoffs++;
          totalHandoffTime += link.metrics.handoffTime;
        }
      }
    }
    
    if (totalHandoffs === 0) return 1;
    
    // Efficiency = 1 - (average handoff time / baseline handoff time)
    const averageHandoffTime = totalHandoffTime / totalHandoffs;
    const baselineHandoffTime = 100; // 100ms baseline
    
    return Math.max(0, 1 - (averageHandoffTime / baselineHandoffTime));
  }

  private generateChainId(): string {
    return `chain_${uuidv4()}`;
  }
}

// Supporting interfaces for internal use
interface PersonaConfiguration {
  timeoutMs: number;
  resourceLimits: { memory: number; cpu: number };
  qualityThreshold: number;
  retryAttempts: number;
}

interface HandoffStrategy {
  handoff(fromLink: ChainLink, toLink: ChainLink, execution: ChainExecution): Promise<ContextHandoff>;
}

interface PersonaExecutionResult {
  output: any;
  metrics: {
    executionTime: number;
    qualityScore: number;
    handoffTime: number;
  };
}

interface SimulatedPersonaResult {
  output: any;
  qualityScore: number;
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