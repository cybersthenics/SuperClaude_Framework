import { SYSTEM_PERFORMANCE_TARGETS } from '../types/index.js';
export class PerformanceTracker {
    config;
    activeTimers = new Map();
    operationMetrics = new Map();
    recentExecutions = [];
    maxRecentExecutions = 1000;
    constructor(config) {
        this.config = config;
        this.startPeriodicCleanup();
    }
    startTimer(operation) {
        const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timer = {
            operation,
            startTime: performance.now(),
            startMemory: this.getCurrentMemoryUsage()
        };
        this.activeTimers.set(timerId, timer);
        return timerId;
    }
    async endTimer(timerId) {
        const timer = this.activeTimers.get(timerId);
        if (!timer) {
            throw new Error(`Timer ${timerId} not found`);
        }
        const endTime = performance.now();
        const executionTime = endTime - timer.startTime;
        const memoryUsage = this.getCurrentMemoryUsage() - timer.startMemory;
        const optimizationFactor = this.calculateOptimizationFactor(timer.operation, executionTime);
        const metrics = {
            executionTime,
            optimizationFactor,
            memoryUsage,
            cpuUsage: this.getCurrentCPUUsage()
        };
        this.updateOperationMetrics(timer.operation, metrics, true);
        this.recentExecutions.push({
            operation: timer.operation,
            time: executionTime,
            timestamp: Date.now()
        });
        this.cleanupRecentExecutions();
        this.activeTimers.delete(timerId);
        return metrics;
    }
    async getMetrics(operation) {
        if (operation) {
            const opMetrics = this.operationMetrics.get(operation);
            if (!opMetrics) {
                return this.getDefaultMetrics();
            }
            return {
                executionTime: opMetrics.averageTime,
                optimizationFactor: opMetrics.averageOptimization,
                memoryUsage: this.getCurrentMemoryUsage(),
                cpuUsage: this.getCurrentCPUUsage()
            };
        }
        return this.getOverallMetrics();
    }
    async getOverallMetrics() {
        const allMetrics = Array.from(this.operationMetrics.values());
        if (allMetrics.length === 0) {
            return {
                executionTime: 0,
                optimizationFactor: 1.0,
                memoryUsage: this.getCurrentMemoryUsage(),
                cpuUsage: this.getCurrentCPUUsage(),
                requestsPerSecond: 0,
                errorRate: 0,
                averageExecutionTime: 0
            };
        }
        const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
        const weightedTimeSum = allMetrics.reduce((sum, m) => sum + (m.averageTime * m.totalExecutions), 0);
        const weightedOptimizationSum = allMetrics.reduce((sum, m) => sum + (m.averageOptimization * m.totalExecutions), 0);
        const totalErrors = allMetrics.reduce((sum, m) => sum + m.errors, 0);
        const averageExecutionTime = totalExecutions > 0 ? weightedTimeSum / totalExecutions : 0;
        const averageOptimization = totalExecutions > 0 ? weightedOptimizationSum / totalExecutions : 1.0;
        const errorRate = totalExecutions > 0 ? totalErrors / totalExecutions : 0;
        const requestsPerSecond = this.calculateRequestsPerSecond();
        return {
            executionTime: averageExecutionTime,
            optimizationFactor: averageOptimization,
            memoryUsage: this.getCurrentMemoryUsage(),
            cpuUsage: this.getCurrentCPUUsage(),
            requestsPerSecond,
            errorRate,
            averageExecutionTime
        };
    }
    async getOptimizationFactor() {
        const metrics = await this.getOverallMetrics();
        return metrics.optimizationFactor;
    }
    getOperationStatistics() {
        return new Map(this.operationMetrics);
    }
    resetMetrics(operation) {
        if (operation) {
            this.operationMetrics.delete(operation);
        }
        else {
            this.operationMetrics.clear();
            this.recentExecutions = [];
        }
    }
    isPerformingWithinBudget(operation) {
        const metrics = this.operationMetrics.get(operation);
        if (!metrics)
            return true;
        return (metrics.averageTime <= this.config.targetAverageTime * 1.2 &&
            metrics.averageOptimization >= this.config.targetOptimizationFactor * 0.8 &&
            metrics.errorRate <= 0.01);
    }
    getPerformanceReport() {
        const overallPromise = this.getOverallMetrics();
        const overall = {
            executionTime: 0,
            optimizationFactor: 1.0,
            memoryUsage: 0,
            cpuUsage: 0,
            requestsPerSecond: 0,
            errorRate: 0,
            averageExecutionTime: 0
        };
        const byOperation = {};
        for (const [operation, metrics] of this.operationMetrics) {
            byOperation[operation] = { ...metrics };
        }
        const systemHealth = {
            withinBudget: overall.executionTime <= SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME * 1.2,
            optimizationTarget: overall.optimizationFactor >= SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR * 0.8,
            reliabilityTarget: (overall.errorRate || 0) <= 0.01
        };
        return {
            overall,
            byOperation,
            systemHealth
        };
    }
    calculateOptimizationFactor(operation, executionTime) {
        let baselineTime = this.config.targetAverageTime;
        if (operation.includes('preToolUse')) {
            baselineTime = 74;
        }
        else if (operation.includes('postToolUse')) {
            baselineTime = 71;
        }
        else if (operation.includes('prePrompt') || operation.includes('postPrompt')) {
            baselineTime = 26;
        }
        else if (operation.includes('preCompact')) {
            baselineTime = 72;
        }
        else if (operation.includes('stop')) {
            baselineTime = 81;
        }
        if (executionTime <= 0)
            return this.config.targetOptimizationFactor;
        const factor = baselineTime / executionTime;
        return Math.min(Math.max(factor, 0.5), 10.0);
    }
    updateOperationMetrics(operation, metrics, success) {
        let opMetrics = this.operationMetrics.get(operation);
        if (!opMetrics) {
            opMetrics = {
                totalExecutions: 0,
                totalTime: 0,
                totalOptimization: 0,
                errors: 0,
                averageTime: 0,
                averageOptimization: 0,
                errorRate: 0
            };
            this.operationMetrics.set(operation, opMetrics);
        }
        opMetrics.totalExecutions++;
        opMetrics.totalTime += metrics.executionTime;
        opMetrics.totalOptimization += metrics.optimizationFactor;
        if (!success) {
            opMetrics.errors++;
        }
        opMetrics.averageTime = opMetrics.totalTime / opMetrics.totalExecutions;
        opMetrics.averageOptimization = opMetrics.totalOptimization / opMetrics.totalExecutions;
        opMetrics.errorRate = opMetrics.errors / opMetrics.totalExecutions;
    }
    calculateRequestsPerSecond() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        const recentRequests = this.recentExecutions.filter(execution => execution.timestamp >= oneSecondAgo);
        return recentRequests.length;
    }
    cleanupRecentExecutions() {
        if (this.recentExecutions.length > this.maxRecentExecutions) {
            this.recentExecutions = this.recentExecutions.slice(-this.maxRecentExecutions);
        }
        const oneMinuteAgo = Date.now() - 60000;
        this.recentExecutions = this.recentExecutions.filter(execution => execution.timestamp >= oneMinuteAgo);
    }
    getCurrentMemoryUsage() {
        if (process.memoryUsage) {
            return process.memoryUsage().heapUsed / 1024 / 1024;
        }
        return 0;
    }
    getCurrentCPUUsage() {
        const activeTimerCount = this.activeTimers.size;
        return Math.min(activeTimerCount * 10, 100);
    }
    getDefaultMetrics() {
        return {
            executionTime: 0,
            optimizationFactor: 1.0,
            memoryUsage: this.getCurrentMemoryUsage(),
            cpuUsage: this.getCurrentCPUUsage()
        };
    }
    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupRecentExecutions();
            for (const [operation, metrics] of this.operationMetrics) {
                if (metrics.totalExecutions === 0) {
                    this.operationMetrics.delete(operation);
                }
            }
        }, 60000);
    }
}
//# sourceMappingURL=PerformanceTracker.js.map