/**
 * Performance Tracker - Monitors and records performance metrics across orchestration patterns
 */
export class PerformanceTracker {
    waveMetrics;
    delegationMetrics;
    loopMetrics;
    chainMetrics;
    systemMetrics;
    performanceThresholds;
    constructor() {
        this.waveMetrics = new Map();
        this.delegationMetrics = new Map();
        this.loopMetrics = new Map();
        this.chainMetrics = new Map();
        this.systemMetrics = [];
        this.performanceThresholds = {
            waveCoordinationMs: 200,
            delegationSetupMs: 500,
            loopIterationMs: 100,
            chainHandoffMs: 50,
            resourceUtilizationMax: 0.90
        };
    }
    /**
     * Record wave orchestration performance
     */
    recordWaveCoordination(waveId, coordinationTime) {
        const record = {
            waveId,
            coordinationTime,
            timestamp: new Date(),
            exceededThreshold: coordinationTime > this.performanceThresholds.waveCoordinationMs
        };
        this.waveMetrics.set(waveId, record);
        if (record.exceededThreshold) {
            console.warn(`⚠️  Wave coordination time exceeded threshold: ${coordinationTime}ms > ${this.performanceThresholds.waveCoordinationMs}ms`);
        }
        console.log(`📊 Wave coordination recorded: ${waveId} (${coordinationTime}ms)`);
    }
    /**
     * Record delegation performance
     */
    recordDelegationPerformance(delegationId, subAgentCount, executionTime, efficiency) {
        const record = {
            delegationId,
            subAgentCount,
            executionTime,
            efficiency,
            timestamp: new Date(),
            timeSavingsAchieved: efficiency >= 0.4 // 40% minimum time savings
        };
        this.delegationMetrics.set(delegationId, record);
        console.log(`📊 Delegation performance recorded: ${delegationId} (${efficiency.toFixed(2)} efficiency, ${subAgentCount} agents)`);
    }
    /**
     * Record loop iteration performance
     */
    recordLoopIteration(loopId, iteration, coordinationTime, convergenceProgress) {
        let record = this.loopMetrics.get(loopId);
        if (!record) {
            record = {
                loopId,
                iterations: [],
                totalCoordinationTime: 0,
                averageIterationTime: 0,
                convergenceRate: 0,
                timestamp: new Date()
            };
            this.loopMetrics.set(loopId, record);
        }
        record.iterations.push({
            iteration,
            coordinationTime,
            convergenceProgress,
            timestamp: new Date()
        });
        record.totalCoordinationTime += coordinationTime;
        record.averageIterationTime = record.totalCoordinationTime / record.iterations.length;
        record.convergenceRate = convergenceProgress;
        console.log(`📊 Loop iteration recorded: ${loopId}#${iteration} (${coordinationTime}ms, ${(convergenceProgress * 100).toFixed(1)}% convergence)`);
    }
    /**
     * Record chain handoff performance
     */
    recordChainHandoff(chainId, step, handoffTime, contextSize, fidelity) {
        let record = this.chainMetrics.get(chainId);
        if (!record) {
            record = {
                chainId,
                handoffs: [],
                totalHandoffTime: 0,
                averageHandoffTime: 0,
                averageContextFidelity: 0,
                timestamp: new Date()
            };
            this.chainMetrics.set(chainId, record);
        }
        record.handoffs.push({
            step,
            handoffTime,
            contextSize,
            fidelity,
            timestamp: new Date()
        });
        record.totalHandoffTime += handoffTime;
        record.averageHandoffTime = record.totalHandoffTime / record.handoffs.length;
        record.averageContextFidelity = record.handoffs.reduce((sum, h) => sum + h.fidelity, 0) / record.handoffs.length;
        console.log(`📊 Chain handoff recorded: ${chainId}#${step} (${handoffTime}ms, ${(fidelity * 100).toFixed(1)}% fidelity)`);
    }
    /**
     * Record loop completion performance
     */
    recordLoopCompletion(loopId, iterations, totalTime, finalQuality) {
        const averageIterationTime = totalTime / iterations;
        const completionRecord = {
            loopId,
            iterations,
            totalTime,
            averageIterationTime,
            finalQuality,
            timestamp: new Date(),
            exceededThreshold: averageIterationTime > this.performanceThresholds.loopIterationMs
        };
        // Update existing loop record with completion data
        const existing = this.loopMetrics.get(loopId);
        if (existing) {
            existing.completionData = completionRecord;
        }
        if (completionRecord.exceededThreshold) {
            console.warn(`⚠️  Loop iteration time exceeded threshold: ${averageIterationTime.toFixed(1)}ms > ${this.performanceThresholds.loopIterationMs}ms`);
        }
        console.log(`📊 Loop completion recorded: ${loopId} (${iterations} iterations, quality: ${finalQuality.toFixed(2)})`);
    }
    /**
     * Record chain completion performance
     */
    recordChainCompletion(chainId, linkCount, totalTime, finalQuality) {
        const averageLinkTime = totalTime / linkCount;
        const completionRecord = {
            chainId,
            linkCount,
            totalTime,
            averageLinkTime,
            finalQuality,
            timestamp: new Date(),
            exceededThreshold: averageLinkTime > this.performanceThresholds.chainHandoffMs * 10 // 10x handoff time
        };
        // Update existing chain record with completion data
        const existing = this.chainMetrics.get(chainId);
        if (existing) {
            existing.completionData = completionRecord;
        }
        if (completionRecord.exceededThreshold) {
            console.warn(`⚠️  Chain link time exceeded threshold: ${averageLinkTime.toFixed(1)}ms > ${this.performanceThresholds.chainHandoffMs * 10}ms`);
        }
        console.log(`📊 Chain completion recorded: ${chainId} (${linkCount} links, quality: ${finalQuality.toFixed(2)})`);
    }
    /**
     * Record system-wide performance metrics
     */
    recordSystemMetrics(resourceUsage, activeExecutions) {
        const record = {
            timestamp: new Date(),
            resourceUsage,
            activeExecutions,
            memoryPressure: resourceUsage.memory / 1024, // Normalize to GB
            cpuPressure: resourceUsage.cpu,
            overallPressure: this.calculateOverallPressure(resourceUsage, activeExecutions)
        };
        this.systemMetrics.push(record);
        // Keep only recent metrics (last 1000 records)
        if (this.systemMetrics.length > 1000) {
            this.systemMetrics.shift();
        }
        if (record.overallPressure > 0.8) {
            console.warn(`⚠️  High system pressure detected: ${(record.overallPressure * 100).toFixed(1)}%`);
        }
    }
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date(),
            waveMetrics: this.analyzeWaveMetrics(),
            delegationMetrics: this.analyzeDelegationMetrics(),
            loopMetrics: this.analyzeLoopMetrics(),
            chainMetrics: this.analyzeChainMetrics(),
            systemMetrics: this.analyzeSystemMetrics(),
            overallScore: 0,
            recommendations: []
        };
        // Calculate overall performance score
        report.overallScore = this.calculateOverallScore(report);
        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);
        return report;
    }
    /**
     * Get performance trends over time
     */
    getPerformanceTrends(timeWindow = 3600000) {
        const cutoff = new Date(Date.now() - timeWindow);
        const recentSystemMetrics = this.systemMetrics.filter(m => m.timestamp >= cutoff);
        const recentWaveMetrics = Array.from(this.waveMetrics.values()).filter(m => m.timestamp >= cutoff);
        const recentDelegationMetrics = Array.from(this.delegationMetrics.values()).filter(m => m.timestamp >= cutoff);
        return {
            timeWindow,
            sampleCount: recentSystemMetrics.length,
            memoryTrend: this.calculateTrend(recentSystemMetrics.map(m => m.memoryPressure)),
            cpuTrend: this.calculateTrend(recentSystemMetrics.map(m => m.cpuPressure)),
            waveCoordinationTrend: this.calculateTrend(recentWaveMetrics.map(m => m.coordinationTime)),
            delegationEfficiencyTrend: this.calculateTrend(recentDelegationMetrics.map(m => m.efficiency)),
            overallTrend: this.calculateTrend(recentSystemMetrics.map(m => m.overallPressure))
        };
    }
    /**
     * Check if performance targets are being met
     */
    checkPerformanceTargets() {
        const recentWaves = Array.from(this.waveMetrics.values()).slice(-10);
        const recentDelegations = Array.from(this.delegationMetrics.values()).slice(-10);
        const recentSystem = this.systemMetrics.slice(-10);
        const waveTargetMet = recentWaves.length === 0 ||
            recentWaves.every(w => w.coordinationTime <= this.performanceThresholds.waveCoordinationMs);
        const delegationTargetMet = recentDelegations.length === 0 ||
            recentDelegations.every(d => d.efficiency >= 0.4);
        const systemTargetMet = recentSystem.length === 0 ||
            recentSystem.every(s => s.overallPressure <= this.performanceThresholds.resourceUtilizationMax);
        return {
            allTargetsMet: waveTargetMet && delegationTargetMet && systemTargetMet,
            waveCoordinationTarget: waveTargetMet,
            delegationEfficiencyTarget: delegationTargetMet,
            systemResourceTarget: systemTargetMet,
            details: {
                waveAvgCoordination: recentWaves.length > 0 ?
                    recentWaves.reduce((sum, w) => sum + w.coordinationTime, 0) / recentWaves.length : 0,
                delegationAvgEfficiency: recentDelegations.length > 0 ?
                    recentDelegations.reduce((sum, d) => sum + d.efficiency, 0) / recentDelegations.length : 0,
                systemAvgPressure: recentSystem.length > 0 ?
                    recentSystem.reduce((sum, s) => sum + s.overallPressure, 0) / recentSystem.length : 0
            }
        };
    }
    // Private helper methods
    calculateOverallPressure(resourceUsage, activeExecutions) {
        const memoryPressure = Math.min(resourceUsage.memory / 2048, 1.0); // Normalize to 2GB
        const cpuPressure = Math.min(resourceUsage.cpu / 4.0, 1.0); // Normalize to 4 cores
        const executionPressure = Math.min(activeExecutions / 15, 1.0); // Normalize to 15 concurrent
        return (memoryPressure + cpuPressure + executionPressure) / 3;
    }
    analyzeWaveMetrics() {
        const waves = Array.from(this.waveMetrics.values());
        if (waves.length === 0) {
            return {
                totalWaves: 0,
                averageCoordinationTime: 0,
                thresholdExceededCount: 0,
                thresholdExceededRate: 0
            };
        }
        const totalCoordinationTime = waves.reduce((sum, w) => sum + w.coordinationTime, 0);
        const thresholdExceeded = waves.filter(w => w.exceededThreshold);
        return {
            totalWaves: waves.length,
            averageCoordinationTime: totalCoordinationTime / waves.length,
            thresholdExceededCount: thresholdExceeded.length,
            thresholdExceededRate: thresholdExceeded.length / waves.length
        };
    }
    analyzeDelegationMetrics() {
        const delegations = Array.from(this.delegationMetrics.values());
        if (delegations.length === 0) {
            return {
                totalDelegations: 0,
                averageEfficiency: 0,
                averageSubAgentCount: 0,
                timeSavingsAchievedRate: 0
            };
        }
        const totalEfficiency = delegations.reduce((sum, d) => sum + d.efficiency, 0);
        const totalSubAgents = delegations.reduce((sum, d) => sum + d.subAgentCount, 0);
        const timeSavingsAchieved = delegations.filter(d => d.timeSavingsAchieved);
        return {
            totalDelegations: delegations.length,
            averageEfficiency: totalEfficiency / delegations.length,
            averageSubAgentCount: totalSubAgents / delegations.length,
            timeSavingsAchievedRate: timeSavingsAchieved.length / delegations.length
        };
    }
    analyzeLoopMetrics() {
        const loops = Array.from(this.loopMetrics.values());
        if (loops.length === 0) {
            return {
                totalLoops: 0,
                averageIterations: 0,
                averageCoordinationTime: 0,
                averageConvergenceRate: 0
            };
        }
        const totalIterations = loops.reduce((sum, l) => sum + l.iterations.length, 0);
        const totalCoordinationTime = loops.reduce((sum, l) => sum + l.totalCoordinationTime, 0);
        const totalConvergenceRate = loops.reduce((sum, l) => sum + l.convergenceRate, 0);
        return {
            totalLoops: loops.length,
            averageIterations: totalIterations / loops.length,
            averageCoordinationTime: totalCoordinationTime / Math.max(totalIterations, 1),
            averageConvergenceRate: totalConvergenceRate / loops.length
        };
    }
    analyzeChainMetrics() {
        const chains = Array.from(this.chainMetrics.values());
        if (chains.length === 0) {
            return {
                totalChains: 0,
                averageSteps: 0,
                averageHandoffTime: 0,
                averageContextFidelity: 0
            };
        }
        const totalSteps = chains.reduce((sum, c) => sum + c.handoffs.length, 0);
        const totalHandoffTime = chains.reduce((sum, c) => sum + c.totalHandoffTime, 0);
        const totalFidelity = chains.reduce((sum, c) => sum + c.averageContextFidelity, 0);
        return {
            totalChains: chains.length,
            averageSteps: totalSteps / chains.length,
            averageHandoffTime: totalHandoffTime / Math.max(totalSteps, 1),
            averageContextFidelity: totalFidelity / chains.length
        };
    }
    analyzeSystemMetrics() {
        if (this.systemMetrics.length === 0) {
            return {
                sampleCount: 0,
                averageMemoryPressure: 0,
                averageCpuPressure: 0,
                averageOverallPressure: 0,
                peakOverallPressure: 0
            };
        }
        const totalMemoryPressure = this.systemMetrics.reduce((sum, s) => sum + s.memoryPressure, 0);
        const totalCpuPressure = this.systemMetrics.reduce((sum, s) => sum + s.cpuPressure, 0);
        const totalOverallPressure = this.systemMetrics.reduce((sum, s) => sum + s.overallPressure, 0);
        const peakOverallPressure = Math.max(...this.systemMetrics.map(s => s.overallPressure));
        return {
            sampleCount: this.systemMetrics.length,
            averageMemoryPressure: totalMemoryPressure / this.systemMetrics.length,
            averageCpuPressure: totalCpuPressure / this.systemMetrics.length,
            averageOverallPressure: totalOverallPressure / this.systemMetrics.length,
            peakOverallPressure
        };
    }
    calculateOverallScore(report) {
        let score = 100; // Start with perfect score
        // Penalize wave coordination issues
        if (report.waveMetrics.thresholdExceededRate > 0.1) {
            score -= report.waveMetrics.thresholdExceededRate * 20;
        }
        // Penalize delegation efficiency issues
        if (report.delegationMetrics.averageEfficiency < 0.4) {
            score -= (0.4 - report.delegationMetrics.averageEfficiency) * 50;
        }
        // Penalize high system pressure
        if (report.systemMetrics.averageOverallPressure > 0.8) {
            score -= (report.systemMetrics.averageOverallPressure - 0.8) * 100;
        }
        return Math.max(score, 0);
    }
    generateRecommendations(report) {
        const recommendations = [];
        if (report.waveMetrics.thresholdExceededRate > 0.2) {
            recommendations.push('Consider optimizing wave coordination overhead');
        }
        if (report.delegationMetrics.averageEfficiency < 0.5) {
            recommendations.push('Review delegation strategies for better efficiency');
        }
        if (report.systemMetrics.averageOverallPressure > 0.8) {
            recommendations.push('System under high pressure - consider resource scaling');
        }
        if (report.chainMetrics.averageContextFidelity < 0.9) {
            recommendations.push('Improve context preservation in chain operations');
        }
        return recommendations;
    }
    calculateTrend(values) {
        if (values.length < 2)
            return 'stable';
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        const change = (secondAvg - firstAvg) / firstAvg;
        if (change > 0.1)
            return 'degrading';
        if (change < -0.1)
            return 'improving';
        return 'stable';
    }
}
//# sourceMappingURL=PerformanceTracker.js.map