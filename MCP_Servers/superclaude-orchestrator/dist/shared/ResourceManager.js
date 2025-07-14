/**
 * Resource Manager - Handles resource allocation, distribution, and optimization
 */
export class ResourceManager {
    resourcePools;
    activeAllocations;
    resourceThresholds;
    usageHistory;
    constructor() {
        this.resourcePools = new Map();
        this.activeAllocations = new Map();
        this.resourceThresholds = {
            memoryWarning: 0.75,
            memoryCritical: 0.90,
            cpuWarning: 0.80,
            cpuCritical: 0.95,
            concurrencyMax: 15
        };
        this.usageHistory = [];
        this.initializeDefaultPools();
    }
    /**
     * Allocate resources for a specific execution type
     */
    async allocateResources(executionType, requirements) {
        console.log(`🔧 Allocating resources for ${executionType} execution`);
        const pool = this.getOrCreatePool(executionType);
        // Check resource availability
        const availability = await this.checkResourceAvailability(requirements);
        if (!availability.sufficient) {
            console.log(`⚠️  Resource shortage detected, optimizing requirements`);
            requirements = await this.optimizeResourceRequirements(requirements);
        }
        // Allocate resources
        const allocation = await pool.allocate(requirements);
        // Track allocation
        this.activeAllocations.set(allocation.allocationId, allocation);
        // Start monitoring
        this.startResourceMonitoring(allocation);
        console.log(`✅ Resources allocated: ${allocation.allocationId}`);
        return allocation;
    }
    /**
     * Release allocated resources
     */
    async releaseResources(allocationId) {
        const allocation = this.activeAllocations.get(allocationId);
        if (!allocation) {
            console.warn(`⚠️  Allocation ${allocationId} not found`);
            return;
        }
        const pool = this.resourcePools.get(this.getPoolForAllocation(allocation));
        if (pool) {
            pool.release(allocation);
        }
        this.activeAllocations.delete(allocationId);
        console.log(`🔓 Resources released: ${allocationId}`);
    }
    /**
     * Optimize resource distribution across active executions
     */
    async optimizeResourceDistribution(activeExecutions) {
        console.log(`⚡ Optimizing resource distribution for ${activeExecutions.length} executions`);
        // Analyze current resource usage patterns
        const usage = this.analyzeResourceUsage(activeExecutions);
        // Identify optimization opportunities
        const opportunities = this.identifyOptimizationOpportunities(usage);
        // Apply optimizations
        const results = await this.applyOptimizations(opportunities);
        console.log(`📊 Optimization completed: ${results.improvements.length} improvements applied`);
        return results;
    }
    /**
     * Get current resource utilization statistics
     */
    getResourceUtilization() {
        const totalPools = Array.from(this.resourcePools.values());
        const totalAllocations = Array.from(this.activeAllocations.values());
        const memoryUsed = totalAllocations.reduce((sum, alloc) => sum + alloc.allocated.memory, 0);
        const cpuUsed = totalAllocations.reduce((sum, alloc) => sum + alloc.allocated.cpu, 0);
        const concurrencyUsed = totalAllocations.reduce((sum, alloc) => sum + alloc.allocated.concurrency, 0);
        const memoryTotal = totalPools.reduce((sum, pool) => sum + pool.memory, 0);
        const cpuTotal = totalPools.reduce((sum, pool) => sum + pool.cpu, 0);
        const concurrencyTotal = this.resourceThresholds.concurrencyMax;
        return {
            memory: {
                used: memoryUsed,
                total: memoryTotal,
                utilization: memoryTotal > 0 ? memoryUsed / memoryTotal : 0
            },
            cpu: {
                used: cpuUsed,
                total: cpuTotal,
                utilization: cpuTotal > 0 ? cpuUsed / cpuTotal : 0
            },
            concurrency: {
                used: concurrencyUsed,
                total: concurrencyTotal,
                utilization: concurrencyUsed / concurrencyTotal
            },
            activeAllocations: totalAllocations.length,
            poolCount: totalPools.length
        };
    }
    /**
     * Check if system is under resource pressure
     */
    checkResourcePressure() {
        const utilization = this.getResourceUtilization();
        const memoryPressure = this.calculatePressureLevel(utilization.memory.utilization, this.resourceThresholds.memoryWarning, this.resourceThresholds.memoryCritical);
        const cpuPressure = this.calculatePressureLevel(utilization.cpu.utilization, this.resourceThresholds.cpuWarning, this.resourceThresholds.cpuCritical);
        const concurrencyPressure = this.calculatePressureLevel(utilization.concurrency.utilization, 0.8, // 80% warning
        0.95 // 95% critical
        );
        const overallPressure = Math.max(memoryPressure, cpuPressure, concurrencyPressure);
        return {
            overall: overallPressure,
            memory: memoryPressure,
            cpu: cpuPressure,
            concurrency: concurrencyPressure,
            recommendations: this.generatePressureRecommendations(overallPressure)
        };
    }
    // Private helper methods
    initializeDefaultPools() {
        this.resourcePools.set('wave', new ResourcePoolImpl({
            memory: 2048, // 2GB
            cpu: 4.0, // 4 CPU cores
            concurrency: 8,
            available: true
        }));
        this.resourcePools.set('delegation', new ResourcePoolImpl({
            memory: 4096, // 4GB for sub-agents
            cpu: 8.0, // 8 CPU cores
            concurrency: 15,
            available: true
        }));
        this.resourcePools.set('loop', new ResourcePoolImpl({
            memory: 1024, // 1GB
            cpu: 2.0, // 2 CPU cores
            concurrency: 4,
            available: true
        }));
        this.resourcePools.set('chain', new ResourcePoolImpl({
            memory: 1536, // 1.5GB
            cpu: 3.0, // 3 CPU cores
            concurrency: 6,
            available: true
        }));
    }
    getOrCreatePool(executionType) {
        let pool = this.resourcePools.get(executionType);
        if (!pool) {
            // Create dynamic pool for unknown execution types
            pool = new ResourcePoolImpl({
                memory: 1024,
                cpu: 2.0,
                concurrency: 4,
                available: true
            });
            this.resourcePools.set(executionType, pool);
        }
        return pool;
    }
    async checkResourceAvailability(requirements) {
        const utilization = this.getResourceUtilization();
        const memoryAvailable = utilization.memory.total - utilization.memory.used;
        const cpuAvailable = utilization.cpu.total - utilization.cpu.used;
        const concurrencyAvailable = utilization.concurrency.total - utilization.concurrency.used;
        const sufficient = memoryAvailable >= requirements.memory &&
            cpuAvailable >= requirements.cpu &&
            concurrencyAvailable >= requirements.concurrency;
        return {
            sufficient,
            shortfalls: {
                memory: Math.max(0, requirements.memory - memoryAvailable),
                cpu: Math.max(0, requirements.cpu - cpuAvailable),
                concurrency: Math.max(0, requirements.concurrency - concurrencyAvailable)
            }
        };
    }
    async optimizeResourceRequirements(requirements) {
        const optimized = { ...requirements };
        // Reduce requirements by 20% as optimization
        optimized.memory = Math.max(optimized.memory * 0.8, 256);
        optimized.cpu = Math.max(optimized.cpu * 0.8, 0.5);
        optimized.concurrency = Math.max(Math.floor(optimized.concurrency * 0.8), 1);
        console.log(`🔧 Optimized requirements: memory ${requirements.memory}→${optimized.memory}MB`);
        return optimized;
    }
    startResourceMonitoring(allocation) {
        // In real implementation, this would start actual resource monitoring
        console.log(`📊 Started monitoring allocation ${allocation.allocationId}`);
    }
    getPoolForAllocation(allocation) {
        // Determine which pool this allocation belongs to
        return 'default'; // Simplified for now
    }
    analyzeResourceUsage(executions) {
        return {
            totalExecutions: executions.length,
            memoryPattern: 'stable',
            cpuPattern: 'variable',
            concurrencyPattern: 'peak_usage',
            efficiency: 0.75
        };
    }
    identifyOptimizationOpportunities(usage) {
        const opportunities = [];
        if (usage.efficiency < 0.8) {
            opportunities.push({
                type: 'efficiency_improvement',
                description: 'Resource usage efficiency can be improved',
                estimatedBenefit: 0.15,
                cost: 0.05,
                priority: 8
            });
        }
        return opportunities;
    }
    async applyOptimizations(opportunities) {
        const improvements = [];
        let totalBenefit = 0;
        for (const opportunity of opportunities) {
            improvements.push(opportunity.description);
            totalBenefit += opportunity.estimatedBenefit;
            // Simulate optimization application
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return {
            applied: opportunities.length > 0,
            strategy: 'resource_optimization',
            improvements,
            estimatedBenefit: totalBenefit
        };
    }
    calculatePressureLevel(utilization, warning, critical) {
        if (utilization >= critical)
            return 1.0;
        if (utilization >= warning)
            return 0.5 + (utilization - warning) / (critical - warning) * 0.5;
        return utilization / warning * 0.5;
    }
    generatePressureRecommendations(pressure) {
        const recommendations = [];
        if (pressure >= 0.8) {
            recommendations.push('Consider reducing concurrent operations');
            recommendations.push('Enable aggressive resource optimization');
        }
        else if (pressure >= 0.5) {
            recommendations.push('Monitor resource usage closely');
            recommendations.push('Consider load balancing adjustments');
        }
        return recommendations;
    }
}
// Resource Pool Implementation
class ResourcePoolImpl {
    memory;
    cpu;
    concurrency;
    available;
    allocations;
    constructor(config) {
        this.memory = config.memory;
        this.cpu = config.cpu;
        this.concurrency = config.concurrency;
        this.available = config.available;
        this.allocations = new Map();
    }
    async allocate(requirements) {
        const allocationId = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const allocation = {
            allocationId,
            requirements,
            allocated: {
                memory: Math.min(requirements.memory, this.memory),
                cpu: Math.min(requirements.cpu, this.cpu),
                concurrency: Math.min(requirements.concurrency, this.concurrency),
                available: true
            },
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + (requirements.timeout || 3600000)) // 1 hour default
        };
        this.allocations.set(allocationId, allocation);
        return allocation;
    }
    release(allocation) {
        this.allocations.delete(allocation.allocationId);
    }
}
//# sourceMappingURL=ResourceManager.js.map