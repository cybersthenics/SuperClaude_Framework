/**
 * Loop Mode Controller - Iterative refinement and progressive enhancement
 * Supports convergence detection, quality gates, and adaptive iteration strategies
 */
import { v4 as uuidv4 } from 'uuid';
export class LoopModeController {
    performanceTracker;
    contextPreserver;
    activeLoops;
    convergenceThresholds;
    qualityGates;
    constructor(performanceTracker, contextPreserver) {
        this.performanceTracker = performanceTracker;
        this.contextPreserver = contextPreserver;
        this.activeLoops = new Map();
        this.convergenceThresholds = new Map();
        this.qualityGates = [];
        this.initializeDefaultConfiguration();
    }
    /**
     * Start a new loop execution with specified configuration
     */
    async startLoop(configuration, initialContext) {
        const loopId = this.generateLoopId();
        const startTime = Date.now();
        console.log(`🔄 Starting loop: ${loopId} (${configuration.mode} mode, max ${configuration.maxIterations} iterations)`);
        const execution = {
            loopId,
            configuration,
            iterations: [],
            status: 'running',
            startTime: new Date(),
            convergenceMetrics: this.initializeConvergenceMetrics(),
            currentIteration: 0,
            context: initialContext
        };
        this.activeLoops.set(loopId, execution);
        // Preserve initial context
        const contextSnapshotId = await this.contextPreserver.preserveContext(loopId, initialContext, { phase: 'initial', iteration: 0 });
        execution.initialContextSnapshot = contextSnapshotId;
        return loopId;
    }
    /**
     * Execute the next iteration in a loop
     */
    async executeIteration(loopId, iterationInput) {
        const execution = this.activeLoops.get(loopId);
        if (!execution) {
            throw new Error(`Loop ${loopId} not found`);
        }
        if (execution.status !== 'running') {
            throw new Error(`Loop ${loopId} is not in running state`);
        }
        const iterationNumber = execution.currentIteration + 1;
        const iterationId = `${loopId}_iteration_${iterationNumber}`;
        console.log(`🔁 Executing iteration ${iterationNumber}/${execution.configuration.maxIterations} for loop ${loopId}`);
        const iteration = {
            iterationId,
            iterationNumber,
            startTime: new Date(),
            input: iterationInput,
            output: null,
            metrics: {
                executionTime: 0,
                qualityScore: 0,
                improvementScore: 0,
                convergenceIndicators: {}
            },
            status: 'running',
            qualityGateResults: []
        };
        execution.iterations.push(iteration);
        execution.currentIteration = iterationNumber;
        try {
            // Execute iteration based on loop mode
            const iterationResult = await this.executeIterationByMode(execution.configuration.mode, iteration, execution);
            // Update iteration with results
            iteration.output = iterationResult.output;
            iteration.metrics = iterationResult.metrics;
            iteration.status = 'completed';
            iteration.endTime = new Date();
            // Run quality gates
            iteration.qualityGateResults = await this.runQualityGates(iteration, execution);
            // Update convergence metrics
            await this.updateConvergenceMetrics(execution, iteration);
            // Check for convergence or completion
            const shouldContinue = await this.evaluateContinuation(execution);
            if (!shouldContinue || iterationNumber >= execution.configuration.maxIterations) {
                await this.completeLoop(execution);
            }
            console.log(`✅ Iteration ${iterationNumber} completed (quality: ${iteration.metrics.qualityScore.toFixed(2)}, improvement: ${iteration.metrics.improvementScore.toFixed(2)})`);
            return iteration;
        }
        catch (error) {
            iteration.status = 'failed';
            iteration.error = error;
            execution.status = 'failed';
            throw error;
        }
    }
    /**
     * Get current loop status and progress
     */
    getLoopStatus(loopId) {
        return this.activeLoops.get(loopId) || null;
    }
    /**
     * Complete a loop execution
     */
    async completeLoop(execution) {
        execution.status = 'completed';
        execution.endTime = new Date();
        const result = {
            loopId: execution.loopId,
            totalIterations: execution.iterations.length,
            finalQualityScore: this.calculateFinalQualityScore(execution),
            totalImprovementScore: this.calculateTotalImprovement(execution),
            convergenceAchieved: this.hasConverged(execution),
            performance: {
                totalExecutionTime: execution.endTime.getTime() - execution.startTime.getTime(),
                averageIterationTime: this.calculateAverageIterationTime(execution),
                qualityProgression: execution.iterations.map(it => it.metrics.qualityScore),
                improvementProgression: execution.iterations.map(it => it.metrics.improvementScore)
            },
            finalContext: execution.context
        };
        console.log(`🏁 Loop completed: ${execution.loopId} (${execution.iterations.length} iterations, quality: ${result.finalQualityScore.toFixed(2)})`);
        // Record performance metrics
        this.performanceTracker.recordLoopCompletion(execution.loopId, execution.iterations.length, result.performance.totalExecutionTime, result.finalQualityScore);
        return result;
    }
    /**
     * Cancel a running loop
     */
    async cancelLoop(loopId) {
        const execution = this.activeLoops.get(loopId);
        if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            console.log(`❌ Loop cancelled: ${loopId}`);
        }
    }
    /**
     * Configure convergence detection parameters
     */
    configureConvergence(metric, threshold, strategy) {
        this.convergenceThresholds.set(metric, threshold);
        console.log(`⚙️ Convergence configured: ${metric} threshold ${threshold} (${strategy})`);
    }
    /**
     * Add custom quality gate
     */
    addQualityGate(gate) {
        this.qualityGates.push(gate);
        console.log(`🚪 Quality gate added: ${gate.name} (${gate.type})`);
    }
    /**
     * Get loop execution statistics
     */
    getLoopStatistics() {
        const activeLoops = Array.from(this.activeLoops.values());
        const completedLoops = activeLoops.filter(loop => loop.status === 'completed');
        return {
            activeLoops: activeLoops.filter(loop => loop.status === 'running').length,
            completedLoops: completedLoops.length,
            cancelledLoops: activeLoops.filter(loop => loop.status === 'cancelled').length,
            failedLoops: activeLoops.filter(loop => loop.status === 'failed').length,
            averageIterations: completedLoops.length > 0 ?
                completedLoops.reduce((sum, loop) => sum + loop.iterations.length, 0) / completedLoops.length : 0,
            averageQualityImprovement: this.calculateAverageQualityImprovement(completedLoops),
            convergenceRate: completedLoops.length > 0 ?
                completedLoops.filter(loop => this.hasConverged(loop)).length / completedLoops.length : 0
        };
    }
    // Private implementation methods
    initializeDefaultConfiguration() {
        // Default convergence thresholds
        this.convergenceThresholds.set('quality_improvement', 0.01); // 1% improvement threshold
        this.convergenceThresholds.set('stability_window', 3); // 3 iterations without significant change
        this.convergenceThresholds.set('quality_plateau', 0.95); // 95% quality score plateau
        // Default quality gates
        this.qualityGates.push({
            name: 'minimum_quality',
            type: 'threshold',
            threshold: 0.7,
            description: 'Minimum quality score requirement'
        });
        this.qualityGates.push({
            name: 'improvement_rate',
            type: 'improvement',
            threshold: 0.05,
            description: 'Minimum improvement rate per iteration'
        });
    }
    async executeIterationByMode(mode, iteration, execution) {
        const startTime = Date.now();
        switch (mode) {
            case 'polish':
                return await this.executePolishIteration(iteration, execution);
            case 'refine':
                return await this.executeRefineIteration(iteration, execution);
            case 'enhance':
                return await this.executeEnhanceIteration(iteration, execution);
            case 'converge':
                return await this.executeConvergeIteration(iteration, execution);
            default:
                throw new Error(`Unknown loop mode: ${mode}`);
        }
    }
    async executePolishIteration(iteration, execution) {
        // Polish mode focuses on small incremental improvements
        const previousQuality = this.getPreviousQualityScore(execution);
        // Simulate polish operation (in real implementation, this would call actual tools)
        await this.simulateIterationWork(500); // 500ms simulation
        const qualityScore = Math.min(previousQuality + 0.05 + Math.random() * 0.1, 1.0);
        const improvementScore = Math.max(0, qualityScore - previousQuality);
        return {
            output: {
                type: 'polish',
                changes: ['Minor formatting improvements', 'Code style consistency', 'Documentation polish'],
                metrics: { linesChanged: Math.floor(Math.random() * 20) + 5 }
            },
            metrics: {
                executionTime: Date.now() - Date.now(),
                qualityScore,
                improvementScore,
                convergenceIndicators: {
                    stability: this.calculateStability(execution, qualityScore),
                    trend: this.calculateTrend(execution, qualityScore)
                }
            }
        };
    }
    async executeRefineIteration(iteration, execution) {
        // Refine mode focuses on structural improvements
        const previousQuality = this.getPreviousQualityScore(execution);
        await this.simulateIterationWork(1000); // 1s simulation
        const qualityScore = Math.min(previousQuality + 0.08 + Math.random() * 0.15, 1.0);
        const improvementScore = Math.max(0, qualityScore - previousQuality);
        return {
            output: {
                type: 'refine',
                changes: ['Code structure improvements', 'Performance optimizations', 'Error handling enhancement'],
                metrics: { linesChanged: Math.floor(Math.random() * 50) + 20 }
            },
            metrics: {
                executionTime: Date.now() - Date.now(),
                qualityScore,
                improvementScore,
                convergenceIndicators: {
                    stability: this.calculateStability(execution, qualityScore),
                    trend: this.calculateTrend(execution, qualityScore)
                }
            }
        };
    }
    async executeEnhanceIteration(iteration, execution) {
        // Enhance mode focuses on feature additions and major improvements
        const previousQuality = this.getPreviousQualityScore(execution);
        await this.simulateIterationWork(1500); // 1.5s simulation
        const qualityScore = Math.min(previousQuality + 0.12 + Math.random() * 0.2, 1.0);
        const improvementScore = Math.max(0, qualityScore - previousQuality);
        return {
            output: {
                type: 'enhance',
                changes: ['New feature additions', 'Architecture improvements', 'Comprehensive optimizations'],
                metrics: { linesChanged: Math.floor(Math.random() * 100) + 50 }
            },
            metrics: {
                executionTime: Date.now() - Date.now(),
                qualityScore,
                improvementScore,
                convergenceIndicators: {
                    stability: this.calculateStability(execution, qualityScore),
                    trend: this.calculateTrend(execution, qualityScore)
                }
            }
        };
    }
    async executeConvergeIteration(iteration, execution) {
        // Converge mode focuses on achieving specific targets with convergence detection
        const previousQuality = this.getPreviousQualityScore(execution);
        const targetQuality = execution.configuration.targetQuality || 0.95;
        await this.simulateIterationWork(800); // 800ms simulation
        // Converge toward target quality
        const distanceToTarget = Math.max(0, targetQuality - previousQuality);
        const improvement = distanceToTarget * 0.3 + Math.random() * 0.05; // 30% of remaining distance + noise
        const qualityScore = Math.min(previousQuality + improvement, targetQuality);
        const improvementScore = Math.max(0, qualityScore - previousQuality);
        return {
            output: {
                type: 'converge',
                changes: ['Targeted improvements', 'Convergence optimizations', 'Quality threshold pursuit'],
                metrics: {
                    linesChanged: Math.floor(Math.random() * 30) + 10,
                    distanceToTarget: Math.max(0, targetQuality - qualityScore)
                }
            },
            metrics: {
                executionTime: Date.now() - Date.now(),
                qualityScore,
                improvementScore,
                convergenceIndicators: {
                    stability: this.calculateStability(execution, qualityScore),
                    trend: this.calculateTrend(execution, qualityScore),
                    distanceToTarget: Math.max(0, targetQuality - qualityScore)
                }
            }
        };
    }
    async runQualityGates(iteration, execution) {
        const results = [];
        for (const gate of this.qualityGates) {
            const result = await this.evaluateQualityGate(gate, iteration, execution);
            results.push(result);
        }
        return results;
    }
    async evaluateQualityGate(gate, iteration, execution) {
        switch (gate.type) {
            case 'threshold':
                return {
                    gateName: gate.name,
                    passed: iteration.metrics.qualityScore >= gate.threshold,
                    actualValue: iteration.metrics.qualityScore,
                    expectedValue: gate.threshold,
                    message: `Quality score ${iteration.metrics.qualityScore.toFixed(2)} vs threshold ${gate.threshold}`
                };
            case 'improvement':
                return {
                    gateName: gate.name,
                    passed: iteration.metrics.improvementScore >= gate.threshold,
                    actualValue: iteration.metrics.improvementScore,
                    expectedValue: gate.threshold,
                    message: `Improvement ${iteration.metrics.improvementScore.toFixed(2)} vs threshold ${gate.threshold}`
                };
            default:
                return {
                    gateName: gate.name,
                    passed: true,
                    actualValue: 0,
                    expectedValue: 0,
                    message: 'Unknown gate type'
                };
        }
    }
    async updateConvergenceMetrics(execution, iteration) {
        const metrics = execution.convergenceMetrics;
        // Update quality progression
        metrics.qualityProgression.push(iteration.metrics.qualityScore);
        // Update improvement rates
        if (execution.iterations.length > 1) {
            const previousIteration = execution.iterations[execution.iterations.length - 2];
            if (previousIteration) {
                const improvementRate = iteration.metrics.qualityScore - previousIteration.metrics.qualityScore;
                metrics.improvementRates.push(improvementRate);
            }
        }
        // Calculate stability indicator
        if (metrics.qualityProgression.length >= 3) {
            const recentQualities = metrics.qualityProgression.slice(-3);
            const variance = this.calculateVariance(recentQualities);
            metrics.stabilityIndicator = 1 - Math.min(variance * 10, 1); // Higher stability = lower variance
        }
        // Calculate convergence confidence
        metrics.convergenceConfidence = this.calculateConvergenceConfidence(execution);
    }
    async evaluateContinuation(execution) {
        // Check convergence conditions
        if (this.hasConverged(execution)) {
            console.log(`🎯 Loop ${execution.loopId} has converged`);
            return false;
        }
        // Check quality plateau
        if (this.hasReachedQualityPlateau(execution)) {
            console.log(`📈 Loop ${execution.loopId} has reached quality plateau`);
            return false;
        }
        // Check improvement stagnation
        if (this.hasStagnated(execution)) {
            console.log(`⏸️ Loop ${execution.loopId} has stagnated`);
            return false;
        }
        return true;
    }
    // Helper methods for convergence detection and analysis
    initializeConvergenceMetrics() {
        return {
            qualityProgression: [],
            improvementRates: [],
            stabilityIndicator: 0,
            convergenceConfidence: 0
        };
    }
    getPreviousQualityScore(execution) {
        if (execution.iterations.length === 0) {
            return 0.5; // Starting quality score
        }
        const lastIteration = execution.iterations[execution.iterations.length - 1];
        return lastIteration ? lastIteration.metrics.qualityScore : 0.5;
    }
    calculateStability(execution, currentQuality) {
        if (execution.iterations.length < 2)
            return 0;
        const recentQualities = execution.iterations
            .slice(-3)
            .map(it => it.metrics.qualityScore)
            .concat([currentQuality]);
        return 1 - this.calculateVariance(recentQualities);
    }
    calculateTrend(execution, currentQuality) {
        if (execution.iterations.length < 2)
            return 0;
        const previousQuality = this.getPreviousQualityScore(execution);
        return currentQuality - previousQuality;
    }
    calculateVariance(values) {
        if (values.length < 2)
            return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
    calculateConvergenceConfidence(execution) {
        const metrics = execution.convergenceMetrics;
        if (metrics.qualityProgression.length < 3)
            return 0;
        // Convergence confidence based on stability and improvement trend
        const stabilityWeight = 0.6;
        const trendWeight = 0.4;
        const stability = metrics.stabilityIndicator;
        const recentImprovements = metrics.improvementRates.slice(-3);
        const averageImprovement = recentImprovements.reduce((sum, rate) => sum + rate, 0) / recentImprovements.length;
        const trendScore = Math.max(0, 1 - Math.abs(averageImprovement) * 10); // Lower improvements = higher convergence
        return stability * stabilityWeight + trendScore * trendWeight;
    }
    hasConverged(execution) {
        const confidence = execution.convergenceMetrics.convergenceConfidence;
        const threshold = this.convergenceThresholds.get('convergence_confidence') || 0.8;
        return confidence >= threshold;
    }
    hasReachedQualityPlateau(execution) {
        const qualityThreshold = this.convergenceThresholds.get('quality_plateau') || 0.95;
        const currentQuality = this.getPreviousQualityScore(execution);
        return currentQuality >= qualityThreshold;
    }
    hasStagnated(execution) {
        const improvementThreshold = this.convergenceThresholds.get('quality_improvement') || 0.01;
        const windowSize = this.convergenceThresholds.get('stability_window') || 3;
        if (execution.iterations.length < windowSize)
            return false;
        const recentIterations = execution.iterations.slice(-windowSize);
        const totalImprovement = recentIterations.reduce((sum, it) => sum + it.metrics.improvementScore, 0);
        return totalImprovement < improvementThreshold;
    }
    calculateFinalQualityScore(execution) {
        if (execution.iterations.length === 0)
            return 0;
        const lastIteration = execution.iterations[execution.iterations.length - 1];
        return lastIteration ? lastIteration.metrics.qualityScore : 0;
    }
    calculateTotalImprovement(execution) {
        if (execution.iterations.length === 0)
            return 0;
        const firstQuality = execution.iterations[0]?.metrics.qualityScore || 0;
        const lastQuality = this.calculateFinalQualityScore(execution);
        return lastQuality - firstQuality;
    }
    calculateAverageIterationTime(execution) {
        if (execution.iterations.length === 0)
            return 0;
        const totalTime = execution.iterations.reduce((sum, it) => sum + (it ? it.metrics.executionTime : 0), 0);
        return totalTime / execution.iterations.length;
    }
    calculateAverageQualityImprovement(loops) {
        if (loops.length === 0)
            return 0;
        const totalImprovement = loops.reduce((sum, loop) => sum + this.calculateTotalImprovement(loop), 0);
        return totalImprovement / loops.length;
    }
    async simulateIterationWork(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }
    generateLoopId() {
        return `loop_${uuidv4()}`;
    }
}
//# sourceMappingURL=LoopModeController.js.map