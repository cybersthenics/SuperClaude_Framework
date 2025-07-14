export class PerformanceMonitor {
    logger;
    metrics = new Map();
    startTime = new Date();
    activationCount = 0;
    collaborationCount = 0;
    chainExecutions = 0;
    errorCount = 0;
    totalOperations = 0;
    targets = {
        personaActivation: 50,
        recommendationGeneration: 100,
        behaviorApplication: 30,
        collaborationCoordination: 200,
        chainModeHandoff: 75,
        priorityResolution: 10,
        contextPreservation: 0.95,
        autoActivationAccuracy: 0.95,
        memoryUsage: 200 * 1024 * 1024,
        cpuUsage: 0.5
    };
    constructor(logger) {
        this.logger = logger.createChildLogger('PerformanceMonitor');
        this.startPeriodicMonitoring();
    }
    recordMetric(name, value, unit = 'ms', tags) {
        const metric = {
            name,
            value,
            unit,
            timestamp: new Date(),
            tags
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metricHistory = this.metrics.get(name);
        metricHistory.push(metric);
        if (metricHistory.length > 1000) {
            metricHistory.splice(0, metricHistory.length - 1000);
        }
        this.checkPerformanceTarget(name, value);
        if (this.isSignificantMetric(name)) {
            this.logger.logPerformance(name, value, { unit, tags });
        }
    }
    recordPersonaActivation(persona, activationTime, confidence, success) {
        this.activationCount++;
        this.totalOperations++;
        if (!success) {
            this.errorCount++;
        }
        this.recordMetric('persona_activation_time', activationTime, 'ms', { persona });
        this.recordMetric('persona_activation_confidence', confidence, 'ratio', { persona });
        this.recordMetric('persona_activation_success', success ? 1 : 0, 'boolean', { persona });
        if (activationTime > this.targets.personaActivation) {
            this.logger.warn(`Persona activation time exceeded target`, {
                persona,
                activationTime,
                target: this.targets.personaActivation,
                overage: activationTime - this.targets.personaActivation
            });
        }
    }
    recordCollaboration(personas, mode, executionTime, conflicts, success) {
        this.collaborationCount++;
        this.totalOperations++;
        if (!success) {
            this.errorCount++;
        }
        this.recordMetric('collaboration_time', executionTime, 'ms', {
            mode,
            personas: personas.join(','),
            persona_count: personas.length.toString()
        });
        this.recordMetric('collaboration_conflicts', conflicts, 'count', { mode });
        this.recordMetric('collaboration_success', success ? 1 : 0, 'boolean', { mode });
        if (executionTime > this.targets.collaborationCoordination) {
            this.logger.warn(`Collaboration time exceeded target`, {
                personas,
                mode,
                executionTime,
                target: this.targets.collaborationCoordination,
                overage: executionTime - this.targets.collaborationCoordination
            });
        }
    }
    recordChainExecution(chainId, steps, executionTime, preservationScore, success) {
        this.chainExecutions++;
        this.totalOperations++;
        if (!success) {
            this.errorCount++;
        }
        this.recordMetric('chain_execution_time', executionTime, 'ms', {
            chainId,
            steps: steps.toString()
        });
        this.recordMetric('chain_preservation_score', preservationScore, 'ratio', { chainId });
        this.recordMetric('chain_execution_success', success ? 1 : 0, 'boolean', { chainId });
        if (preservationScore < this.targets.contextPreservation) {
            this.logger.warn(`Context preservation below target`, {
                chainId,
                preservationScore,
                target: this.targets.contextPreservation,
                shortfall: this.targets.contextPreservation - preservationScore
            });
        }
    }
    recordAutoActivationAccuracy(persona, confidence, correct) {
        this.recordMetric('auto_activation_accuracy', correct ? 1 : 0, 'boolean', { persona });
        this.recordMetric('auto_activation_confidence', confidence, 'ratio', { persona });
    }
    recordMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        this.recordMetric('memory_heap_used', memoryUsage.heapUsed, 'bytes');
        this.recordMetric('memory_heap_total', memoryUsage.heapTotal, 'bytes');
        this.recordMetric('memory_external', memoryUsage.external, 'bytes');
        this.recordMetric('memory_rss', memoryUsage.rss, 'bytes');
        if (memoryUsage.heapUsed > this.targets.memoryUsage) {
            this.logger.warn(`Memory usage exceeded target`, {
                heapUsed: memoryUsage.heapUsed,
                target: this.targets.memoryUsage,
                overage: memoryUsage.heapUsed - this.targets.memoryUsage
            });
        }
    }
    recordCPUUsage() {
        const cpuUsage = process.cpuUsage();
        const totalCPU = cpuUsage.user + cpuUsage.system;
        this.recordMetric('cpu_user', cpuUsage.user, 'microseconds');
        this.recordMetric('cpu_system', cpuUsage.system, 'microseconds');
        this.recordMetric('cpu_total', totalCPU, 'microseconds');
    }
    getPerformanceSnapshot() {
        const currentTime = new Date();
        const allMetrics = [];
        for (const metricHistory of this.metrics.values()) {
            allMetrics.push(...metricHistory);
        }
        const activationTimes = this.getMetricValues('persona_activation_time');
        const averageActivationTime = activationTimes.length > 0
            ? activationTimes.reduce((sum, val) => sum + val, 0) / activationTimes.length
            : 0;
        const memoryUsage = this.getLatestMetricValue('memory_heap_used') || 0;
        const cpuUsage = this.getLatestMetricValue('cpu_total') || 0;
        return {
            timestamp: currentTime,
            metrics: allMetrics.slice(-100),
            summary: {
                totalActivations: this.activationCount,
                averageActivationTime,
                collaborationCount: this.collaborationCount,
                chainExecutions: this.chainExecutions,
                errorRate: this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0,
                memoryUsage,
                cpuUsage
            }
        };
    }
    getMetricStats(metricName) {
        const metrics = this.metrics.get(metricName);
        if (!metrics || metrics.length === 0) {
            return null;
        }
        const values = metrics.map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            count: values.length,
            average: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            latest: values[values.length - 1]
        };
    }
    isPerformingWithinTargets() {
        const details = {};
        let allWithinTargets = true;
        const avgActivationTime = this.getMetricStats('persona_activation_time')?.average || 0;
        details.activationTime = {
            value: avgActivationTime,
            target: this.targets.personaActivation,
            within: avgActivationTime <= this.targets.personaActivation
        };
        allWithinTargets = allWithinTargets && details.activationTime.within;
        const avgCollaborationTime = this.getMetricStats('collaboration_time')?.average || 0;
        details.collaborationTime = {
            value: avgCollaborationTime,
            target: this.targets.collaborationCoordination,
            within: avgCollaborationTime <= this.targets.collaborationCoordination
        };
        allWithinTargets = allWithinTargets && details.collaborationTime.within;
        const currentMemory = this.getLatestMetricValue('memory_heap_used') || 0;
        details.memoryUsage = {
            value: currentMemory,
            target: this.targets.memoryUsage,
            within: currentMemory <= this.targets.memoryUsage
        };
        allWithinTargets = allWithinTargets && details.memoryUsage.within;
        const avgPreservation = this.getMetricStats('chain_preservation_score')?.average || 1;
        details.contextPreservation = {
            value: avgPreservation,
            target: this.targets.contextPreservation,
            within: avgPreservation >= this.targets.contextPreservation
        };
        allWithinTargets = allWithinTargets && details.contextPreservation.within;
        return { overall: allWithinTargets, details };
    }
    getUptime() {
        return (Date.now() - this.startTime.getTime()) / 1000;
    }
    resetMetrics() {
        this.metrics.clear();
        this.activationCount = 0;
        this.collaborationCount = 0;
        this.chainExecutions = 0;
        this.errorCount = 0;
        this.totalOperations = 0;
        this.startTime = new Date();
        this.logger.info('Performance metrics reset');
    }
    exportMetrics() {
        const snapshot = this.getPerformanceSnapshot();
        const performance = this.isPerformingWithinTargets();
        return {
            timestamp: snapshot.timestamp,
            uptime: this.getUptime(),
            summary: snapshot.summary,
            performance: performance.overall,
            targets: this.targets,
            details: performance.details
        };
    }
    startPeriodicMonitoring() {
        setInterval(() => {
            this.recordMemoryUsage();
            this.recordCPUUsage();
        }, 30000);
        setInterval(() => {
            const snapshot = this.getPerformanceSnapshot();
            this.logger.logSystemHealth('PersonasServer', 'monitoring', snapshot.summary);
        }, 300000);
    }
    checkPerformanceTarget(metricName, value) {
        const targetMap = {
            'persona_activation_time': this.targets.personaActivation,
            'collaboration_time': this.targets.collaborationCoordination,
            'chain_execution_time': this.targets.chainModeHandoff,
            'memory_heap_used': this.targets.memoryUsage,
            'chain_preservation_score': this.targets.contextPreservation
        };
        const target = targetMap[metricName];
        if (target !== undefined) {
            const exceedsTarget = metricName === 'chain_preservation_score'
                ? value < target
                : value > target;
            if (exceedsTarget) {
                this.logger.warn(`Performance target exceeded`, {
                    metric: metricName,
                    value,
                    target,
                    difference: Math.abs(value - target)
                });
            }
        }
    }
    isSignificantMetric(metricName) {
        const significantMetrics = [
            'persona_activation_time',
            'collaboration_time',
            'chain_execution_time',
            'chain_preservation_score',
            'memory_heap_used'
        ];
        return significantMetrics.includes(metricName);
    }
    getMetricValues(metricName) {
        const metrics = this.metrics.get(metricName);
        return metrics ? metrics.map(m => m.value) : [];
    }
    getLatestMetricValue(metricName) {
        const metrics = this.metrics.get(metricName);
        return metrics && metrics.length > 0 ? metrics[metrics.length - 1].value : null;
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map