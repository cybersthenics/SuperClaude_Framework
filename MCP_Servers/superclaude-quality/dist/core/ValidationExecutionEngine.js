import { ValidationCacheManager } from '../utils/ValidationCacheManager.js';
import { ProgressTracker } from '../utils/ProgressTracker.js';
import { Logger } from '../utils/Logger.js';
export class ValidationExecutionEngine {
    parallelExecutor;
    cacheManager;
    progressTracker;
    logger;
    maxConcurrency = 5;
    constructor() {
        this.parallelExecutor = new DefaultParallelExecutor();
        this.cacheManager = new ValidationCacheManager();
        this.progressTracker = new ProgressTracker();
        this.logger = new Logger('ValidationExecutionEngine');
    }
    async executeValidationPlan(plan) {
        const startTime = Date.now();
        this.logger.info('Executing validation plan', {
            gatesCount: plan.gates.length,
            estimatedTime: plan.estimatedTime
        });
        try {
            this.progressTracker.start(plan.gates.length);
            let gateResults = [];
            if (plan.parallelGroups.length > 1) {
                for (const group of plan.parallelGroups) {
                    const groupGates = plan.gates.filter(g => group.includes(g.name));
                    const groupResults = await this.executeGateParallel(groupGates, this.createMockContext());
                    gateResults.push(...groupResults);
                    this.progressTracker.updateProgress(gateResults.length);
                }
            }
            else {
                gateResults = await this.executeGateSequential(plan.gates, this.createMockContext());
            }
            const executionTime = Date.now() - startTime;
            const overallStatus = this.determineOverallStatus(gateResults);
            this.progressTracker.complete();
            this.logger.info('Validation plan completed', {
                overallStatus,
                executionTime,
                gatesExecuted: gateResults.length
            });
            return {
                gateResults,
                overallStatus,
                executionTime
            };
        }
        catch (error) {
            this.logger.error('Validation plan execution failed', { error });
            this.progressTracker.fail(error.message);
            throw error;
        }
    }
    async executeGateParallel(gates, context) {
        this.logger.debug('Executing gates in parallel', { gateCount: gates.length });
        const executionTasks = gates.map(gate => async () => {
            const dependenciesReady = await this.checkGateDependencies(gate, []);
            if (!dependenciesReady) {
                throw new Error(`Dependencies not met for gate: ${gate.name}`);
            }
            const cacheResult = await this.applyCaching(gate, context);
            if (cacheResult.hit && cacheResult.result) {
                this.logger.debug('Cache hit for gate', { gate: gate.name });
                return cacheResult.result;
            }
            return await this.executeGateWithTimeout(gate, context);
        });
        try {
            const results = await this.parallelExecutor.executeParallel(executionTasks, this.maxConcurrency);
            return results;
        }
        catch (error) {
            this.logger.error('Parallel execution failed', { error });
            throw error;
        }
    }
    async executeGateSequential(gates, context) {
        this.logger.debug('Executing gates sequentially', { gateCount: gates.length });
        const results = [];
        const completedGates = [];
        for (const gate of gates) {
            try {
                const dependenciesReady = await this.checkGateDependencies(gate, completedGates);
                if (!dependenciesReady) {
                    this.logger.warn('Skipping gate due to unmet dependencies', {
                        gate: gate.name,
                        dependencies: gate.dependencies
                    });
                    continue;
                }
                const cacheResult = await this.applyCaching(gate, context);
                if (cacheResult.hit && cacheResult.result) {
                    this.logger.debug('Cache hit for gate', { gate: gate.name });
                    results.push(cacheResult.result);
                    completedGates.push(gate.name);
                    continue;
                }
                const result = await this.executeGateWithTimeout(gate, context);
                results.push(result);
                completedGates.push(gate.name);
                this.progressTracker.updateProgress(results.length);
                await this.cacheManager.cacheResult(cacheResult.key, result);
            }
            catch (error) {
                const failureResult = await this.handleGateFailure(gate, error, context);
                if (failureResult.fallbackResult) {
                    results.push(failureResult.fallbackResult);
                    completedGates.push(gate.name);
                }
            }
        }
        return results;
    }
    async handleGateFailure(gate, error, context) {
        this.logger.warn('Gate execution failed', { gate: gate.name, error: error.message });
        const shouldRetry = this.shouldRetryGate(gate, error);
        if (shouldRetry) {
            this.logger.info('Retrying gate execution', { gate: gate.name });
            try {
                const result = await this.executeGateWithTimeout(gate, context);
                return {
                    gate: gate.name,
                    error,
                    shouldRetry: false,
                    fallbackResult: result
                };
            }
            catch (retryError) {
                this.logger.error('Gate retry failed', { gate: gate.name, retryError });
            }
        }
        const fallbackResult = {
            gate: gate.name,
            type: gate.type,
            status: 'failed',
            score: 0,
            issues: [{
                    id: `${gate.name}-failure`,
                    severity: 'critical',
                    category: gate.type,
                    message: `Gate execution failed: ${error.message}`,
                    location: { file: '', line: 0, column: 0 },
                    suggestion: 'Check gate configuration and retry',
                    autoFixable: false,
                    ruleId: 'gate-execution-failure'
                }],
            processingTime: 0,
            metadata: {
                filesAnalyzed: 0,
                gateDuration: 0,
                error: error.message
            }
        };
        return {
            gate: gate.name,
            error,
            shouldRetry,
            fallbackResult
        };
    }
    async optimizeExecution(plan) {
        const systemLoad = await this.getSystemLoad();
        if (systemLoad > 0.8) {
            this.maxConcurrency = Math.max(1, Math.floor(this.maxConcurrency * 0.5));
            this.logger.info('Reduced concurrency due to high system load', {
                newConcurrency: this.maxConcurrency
            });
        }
        const optimizedGates = await this.reorderGatesByCache(plan.gates);
        return {
            ...plan,
            gates: optimizedGates
        };
    }
    async executeGateWithTimeout(gate, context) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Gate execution timeout: ${gate.name} (${gate.timeout}ms)`));
            }, gate.timeout);
            try {
                const startTime = Date.now();
                const result = await gate.validator.validate(context);
                const processingTime = Date.now() - startTime;
                clearTimeout(timeoutId);
                resolve({
                    gate: gate.name,
                    type: gate.type,
                    status: result.status,
                    score: result.score,
                    issues: result.issues,
                    processingTime,
                    metadata: result.metadata
                });
            }
            catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    async checkGateDependencies(gate, completedGates) {
        if (!gate.dependencies || gate.dependencies.length === 0) {
            return true;
        }
        return gate.dependencies.every(dep => completedGates.includes(dep));
    }
    async applyCaching(gate, context) {
        const cacheKey = this.generateCacheKey(gate, context);
        const cachedResult = await this.cacheManager.getCachedResult(cacheKey);
        return {
            hit: !!cachedResult,
            result: cachedResult,
            key: cacheKey
        };
    }
    generateCacheKey(gate, context) {
        const contextHash = this.hashObject({
            target: context.target,
            gateName: gate.name,
            gateConfig: gate.configuration
        });
        return `gate-${gate.name}-${contextHash}`;
    }
    hashObject(obj) {
        return Buffer.from(JSON.stringify(obj)).toString('base64').slice(0, 16);
    }
    async trackProgress(gate, progress) {
        this.progressTracker.updateGateProgress(gate.name, progress);
    }
    async handleTimeout(gate) {
        this.logger.warn('Gate execution timeout', { gate: gate.name, timeout: gate.timeout });
        return {
            gate: gate.name,
            timeoutDuration: gate.timeout
        };
    }
    shouldRetryGate(gate, error) {
        const retryableErrors = ['TIMEOUT', 'NETWORK_ERROR', 'TEMPORARY_FAILURE'];
        return retryableErrors.some(errType => error.message.includes(errType));
    }
    determineOverallStatus(results) {
        if (results.some(r => r.status === 'failed'))
            return 'failed';
        if (results.some(r => r.status === 'warning'))
            return 'warning';
        return 'passed';
    }
    async getSystemLoad() {
        return Math.random() * 0.5;
    }
    async reorderGatesByCache(gates) {
        const gatesWithCacheProb = await Promise.all(gates.map(async (gate) => ({
            gate,
            cacheHitProb: await this.cacheManager.getCacheHitProbability(gate.name)
        })));
        return gatesWithCacheProb
            .sort((a, b) => b.cacheHitProb - a.cacheHitProb)
            .map(item => item.gate);
    }
    createMockContext() {
        return {
            target: {
                type: 'project',
                uri: '',
                files: [],
                excludePatterns: []
            },
            scope: { depth: 'project' },
            gates: [],
            requirements: {},
            constraints: { timeout: 60000 }
        };
    }
}
class DefaultParallelExecutor {
    async executeParallel(tasks, maxConcurrency) {
        const results = [];
        const executing = [];
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const promise = task().then(result => {
                results[i] = result;
            });
            executing.push(promise);
            if (executing.length >= maxConcurrency) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }
        await Promise.all(executing);
        return results;
    }
}
//# sourceMappingURL=ValidationExecutionEngine.js.map