/**
 * Resource Manager - Handles resource allocation, distribution, and optimization
 */
import { ResourceRequirements, ResourceAllocation, OptimizationResult } from '../types/index.js';
export declare class ResourceManager {
    private resourcePools;
    private activeAllocations;
    private resourceThresholds;
    private usageHistory;
    constructor();
    /**
     * Allocate resources for a specific execution type
     */
    allocateResources(executionType: 'wave' | 'delegation' | 'loop' | 'chain', requirements: ResourceRequirements): Promise<ResourceAllocation>;
    /**
     * Release allocated resources
     */
    releaseResources(allocationId: string): Promise<void>;
    /**
     * Optimize resource distribution across active executions
     */
    optimizeResourceDistribution(activeExecutions: ExecutionContext[]): Promise<OptimizationResult>;
    /**
     * Get current resource utilization statistics
     */
    getResourceUtilization(): ResourceUtilizationStats;
    /**
     * Check if system is under resource pressure
     */
    checkResourcePressure(): ResourcePressureStatus;
    private initializeDefaultPools;
    private getOrCreatePool;
    private checkResourceAvailability;
    private optimizeResourceRequirements;
    private startResourceMonitoring;
    private getPoolForAllocation;
    private analyzeResourceUsage;
    private identifyOptimizationOpportunities;
    private applyOptimizations;
    private calculatePressureLevel;
    private generatePressureRecommendations;
}
interface ResourceUtilizationStats {
    memory: {
        used: number;
        total: number;
        utilization: number;
    };
    cpu: {
        used: number;
        total: number;
        utilization: number;
    };
    concurrency: {
        used: number;
        total: number;
        utilization: number;
    };
    activeAllocations: number;
    poolCount: number;
}
interface ResourcePressureStatus {
    overall: number;
    memory: number;
    cpu: number;
    concurrency: number;
    recommendations: string[];
}
interface ExecutionContext {
    executionId: string;
    command: string;
    flags: string[];
    scope: string[];
    metadata: Record<string, any>;
    timestamp: Date;
}
export {};
//# sourceMappingURL=ResourceManager.d.ts.map