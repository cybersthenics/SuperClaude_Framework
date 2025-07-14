/**
 * Sub-Agent Manager - Creates and manages specialized sub-agents
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SubAgent,
  SubAgentSpecialization 
} from '../types/index.js';

export class SubAgentManager {
  private agentPool: Map<string, SubAgent>;
  private specializationConfigs: Map<SubAgentSpecialization, SpecializationConfig>;

  constructor() {
    this.agentPool = new Map();
    this.specializationConfigs = new Map();
    
    this.initializeSpecializations();
  }

  /**
   * Create a specialized sub-agent
   */
  createSpecializedAgent(
    specialization: SubAgentSpecialization,
    scope: string[]
  ): SubAgent {
    const config = this.specializationConfigs.get(specialization);
    if (!config) {
      throw new Error(`Unknown specialization: ${specialization}`);
    }

    const agent: SubAgent = {
      agentId: this.generateAgentId(),
      specialization,
      persona: config.persona,
      tools: [...config.tools],
      focus: [...config.focus],
      scope: scope.join(','),
      status: 'idle'
    };

    this.agentPool.set(agent.agentId, agent);
    
    console.log(`🤖 Created ${specialization} agent: ${agent.agentId}`);
    
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): SubAgent | undefined {
    return this.agentPool.get(agentId);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: SubAgent['status']): void {
    const agent = this.agentPool.get(agentId);
    if (agent) {
      agent.status = status;
    }
  }

  /**
   * Release agent back to pool
   */
  releaseAgent(agentId: string): void {
    const agent = this.agentPool.get(agentId);
    if (agent) {
      agent.status = 'idle';
      // Could implement agent reuse logic here
    }
  }

  /**
   * Get agent statistics
   */
  getAgentStatistics(): AgentStatistics {
    const agents = Array.from(this.agentPool.values());
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'running').length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      specializationCounts: this.calculateSpecializationCounts(agents)
    };
  }

  // Private helper methods

  private initializeSpecializations(): void {
    this.specializationConfigs.set('quality', {
      persona: 'qa',
      focus: ['complexity', 'maintainability', 'test_coverage'],
      tools: ['Read', 'Grep', 'Sequential'],
      description: 'Quality assurance and code review specialist'
    });

    this.specializationConfigs.set('security', {
      persona: 'security',
      focus: ['vulnerabilities', 'compliance', 'auth_patterns'],
      tools: ['Grep', 'Sequential', 'Context7'],
      description: 'Security analysis and vulnerability assessment specialist'
    });

    this.specializationConfigs.set('performance', {
      persona: 'performance',
      focus: ['bottlenecks', 'optimization', 'resource_usage'],
      tools: ['Read', 'Sequential', 'Playwright'],
      description: 'Performance optimization and monitoring specialist'
    });

    this.specializationConfigs.set('architecture', {
      persona: 'architect',
      focus: ['patterns', 'structure', 'dependencies'],
      tools: ['Read', 'Sequential', 'Context7'],
      description: 'System architecture and design patterns specialist'
    });
  }

  private generateAgentId(): string {
    return `agent_${uuidv4()}`;
  }

  private calculateSpecializationCounts(agents: SubAgent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const agent of agents) {
      counts[agent.specialization] = (counts[agent.specialization] || 0) + 1;
    }
    
    return counts;
  }
}

// Supporting interfaces
interface SpecializationConfig {
  persona: string;
  focus: string[];
  tools: string[];
  description: string;
}

interface AgentStatistics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  specializationCounts: Record<string, number>;
}