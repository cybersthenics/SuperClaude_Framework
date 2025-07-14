/**
 * Sub-Agent Manager - Creates and manages specialized sub-agents
 */
import { SubAgent, SubAgentSpecialization } from '../types/index.js';
export declare class SubAgentManager {
    private agentPool;
    private specializationConfigs;
    constructor();
    /**
     * Create a specialized sub-agent
     */
    createSpecializedAgent(specialization: SubAgentSpecialization, scope: string[]): SubAgent;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): SubAgent | undefined;
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: SubAgent['status']): void;
    /**
     * Release agent back to pool
     */
    releaseAgent(agentId: string): void;
    /**
     * Get agent statistics
     */
    getAgentStatistics(): AgentStatistics;
    private initializeSpecializations;
    private generateAgentId;
    private calculateSpecializationCounts;
}
interface AgentStatistics {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    specializationCounts: Record<string, number>;
}
export {};
//# sourceMappingURL=SubAgentManager.d.ts.map