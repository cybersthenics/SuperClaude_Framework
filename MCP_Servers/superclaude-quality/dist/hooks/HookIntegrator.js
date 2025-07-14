import { RealTimeValidator } from './RealTimeValidator.js';
import { Logger } from '../utils/Logger.js';
export class HookIntegrator {
    hookClient;
    realTimeValidator;
    validationCache;
    logger;
    isRealTimeEnabled = false;
    activeTargets = new Set();
    constructor() {
        this.hookClient = new DefaultHookClient();
        this.realTimeValidator = new RealTimeValidator();
        this.validationCache = new InMemoryValidationCache();
        this.logger = new Logger('HookIntegrator');
        this.initializeHookSubscriptions();
    }
    async handlePreToolUseHook(hookContext) {
        const startTime = Date.now();
        this.logger.debug('Handling PreToolUse hook', {
            operation: hookContext.operation,
            files: hookContext.files.length
        });
        try {
            const validationResult = await this.realTimeValidator.validatePreOperation(hookContext);
            const processingTime = Date.now() - startTime;
            await this.cacheValidationResults([validationResult]);
            const success = validationResult.status !== 'failed';
            this.logger.info('PreToolUse validation completed', {
                success,
                processingTime,
                issuesFound: validationResult.issues.length
            });
            return {
                success,
                validationResult,
                message: success
                    ? 'Pre-operation validation passed'
                    : `Pre-operation validation failed with ${validationResult.issues.length} issues`,
                metadata: {
                    processingTime,
                    issuesCount: validationResult.issues.length,
                    hookType: 'pre'
                }
            };
        }
        catch (error) {
            this.logger.error('PreToolUse hook failed', { error });
            return {
                success: false,
                message: `Pre-operation validation failed: ${error.message}`,
                metadata: {
                    error: error.message,
                    processingTime: Date.now() - startTime,
                    hookType: 'pre'
                }
            };
        }
    }
    async handlePostToolUseHook(hookContext) {
        const startTime = Date.now();
        this.logger.debug('Handling PostToolUse hook', {
            operation: hookContext.operation,
            files: hookContext.files.length
        });
        try {
            const validationResult = await this.realTimeValidator.validatePostOperation(hookContext);
            const processingTime = Date.now() - startTime;
            await this.updateQualityMetrics(hookContext, [validationResult]);
            await this.cacheValidationResults([validationResult]);
            const success = validationResult.status !== 'failed';
            this.logger.info('PostToolUse validation completed', {
                success,
                processingTime,
                issuesFound: validationResult.issues.length
            });
            return {
                success,
                validationResult,
                message: success
                    ? 'Post-operation validation passed'
                    : `Post-operation validation found ${validationResult.issues.length} issues`,
                metadata: {
                    processingTime,
                    issuesCount: validationResult.issues.length,
                    hookType: 'post'
                }
            };
        }
        catch (error) {
            this.logger.error('PostToolUse hook failed', { error });
            return {
                success: false,
                message: `Post-operation validation failed: ${error.message}`,
                metadata: {
                    error: error.message,
                    processingTime: Date.now() - startTime,
                    hookType: 'post'
                }
            };
        }
    }
    async handleStopHook(hookContext) {
        const startTime = Date.now();
        this.logger.info('Handling Stop hook - generating session quality report');
        try {
            const sessionReport = await this.generateSessionQualityReport(hookContext);
            const processingTime = Date.now() - startTime;
            this.logger.info('Session quality report generated', {
                processingTime,
                overallScore: sessionReport.overallScore,
                totalIssues: sessionReport.totalIssues
            });
            return {
                success: true,
                message: `Session quality report: Score ${sessionReport.overallScore}/100, ${sessionReport.totalIssues} issues found`,
                metadata: {
                    sessionReport,
                    processingTime,
                    hookType: 'stop'
                }
            };
        }
        catch (error) {
            this.logger.error('Stop hook failed', { error });
            return {
                success: false,
                message: `Session quality reporting failed: ${error.message}`,
                metadata: {
                    error: error.message,
                    processingTime: Date.now() - startTime,
                    hookType: 'stop'
                }
            };
        }
    }
    async enableRealTimeValidation(target) {
        this.activeTargets.add(target.uri);
        this.isRealTimeEnabled = true;
        this.logger.info('Real-time validation enabled', { target: target.uri });
    }
    async disableRealTimeValidation(target) {
        this.activeTargets.delete(target.uri);
        if (this.activeTargets.size === 0) {
            this.isRealTimeEnabled = false;
        }
        this.logger.info('Real-time validation disabled', { target: target.uri });
    }
    async initializeHookSubscriptions() {
        try {
            await this.hookClient.subscribeToHooks(async (hookContext) => {
                try {
                    let result;
                    switch (hookContext.hookType) {
                        case 'pre':
                            result = await this.handlePreToolUseHook(hookContext);
                            break;
                        case 'post':
                            result = await this.handlePostToolUseHook(hookContext);
                            break;
                        case 'stop':
                            result = await this.handleStopHook(hookContext);
                            break;
                        default:
                            this.logger.warn('Unknown hook type', { hookType: hookContext.hookType });
                            return;
                    }
                    await this.hookClient.sendHookResponse(hookContext.hookType, result);
                }
                catch (error) {
                    this.logger.error('Hook handling error', { error, hookType: hookContext.hookType });
                }
            });
            this.logger.info('Hook subscriptions initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize hook subscriptions', { error });
        }
    }
    async validateToolOperation(operation) {
        const validationRules = this.getOperationValidationRules(operation);
        return {
            valid: true,
            warnings: [],
            errors: []
        };
    }
    getOperationValidationRules(operation) {
        const rules = {
            'edit': [
                { type: 'syntax', enabled: true },
                { type: 'semantic', enabled: true }
            ],
            'write': [
                { type: 'syntax', enabled: true },
                { type: 'security', enabled: true }
            ],
            'read': [
                { type: 'access', enabled: true }
            ]
        };
        return rules[operation] || [];
    }
    async generateQualityFeedback(results) {
        const allIssues = results.flatMap(r => r.issues);
        const allRecommendations = results.flatMap(r => r.recommendations);
        const criticalIssues = allIssues.filter(i => i.severity === 'critical');
        const score = criticalIssues.length === 0 ? 85 : Math.max(0, 85 - (criticalIssues.length * 10));
        return {
            issues: allIssues,
            recommendations: allRecommendations,
            score,
            actionable: allRecommendations.some(r => r.actionable)
        };
    }
    async updateQualityMetrics(hookContext, results) {
        const feedback = await this.generateQualityFeedback(results);
        this.logger.debug('Quality metrics updated', {
            score: feedback.score,
            issuesCount: feedback.issues.length,
            operation: hookContext.operation
        });
    }
    async cacheValidationResults(results) {
        for (const result of results) {
            const cacheKey = `realtime-${Date.now()}-${Math.random()}`;
            await this.validationCache.store(cacheKey, result);
        }
    }
    async generateSessionQualityReport(hookContext) {
        const cachedResults = await this.validationCache.getAll();
        const totalIssues = cachedResults.reduce((sum, result) => sum + result.issues.length, 0);
        const criticalIssues = cachedResults.reduce((sum, result) => sum + result.issues.filter(i => i.severity === 'critical').length, 0);
        const overallScore = criticalIssues === 0 ? 90 : Math.max(0, 90 - (criticalIssues * 5));
        return {
            overallScore,
            totalIssues,
            criticalIssues,
            validationRuns: cachedResults.length,
            averagePerformance: cachedResults.reduce((sum, result) => sum + result.performance, 0) / cachedResults.length,
            topIssues: this.getTopIssues(cachedResults),
            recommendations: this.getSessionRecommendations(cachedResults)
        };
    }
    getTopIssues(results) {
        const allIssues = results.flatMap(r => r.issues);
        const issueCounts = new Map();
        for (const issue of allIssues) {
            const key = `${issue.category}-${issue.ruleId}`;
            const existing = issueCounts.get(key);
            if (existing) {
                existing.count++;
            }
            else {
                issueCounts.set(key, { issue, count: 1 });
            }
        }
        return Array.from(issueCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(item => item.issue);
    }
    getSessionRecommendations(results) {
        const allRecommendations = results.flatMap(r => r.recommendations);
        const uniqueRecommendations = new Map();
        for (const rec of allRecommendations) {
            const key = rec.description;
            if (!uniqueRecommendations.has(key) || rec.priority === 'critical') {
                uniqueRecommendations.set(key, rec);
            }
        }
        return Array.from(uniqueRecommendations.values())
            .sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
            .slice(0, 10);
    }
}
class DefaultHookClient {
    logger;
    subscriptions = [];
    constructor() {
        this.logger = new Logger('DefaultHookClient');
    }
    async sendHookResponse(hookType, result) {
        this.logger.debug('Sending hook response', { hookType, success: result.success });
    }
    async subscribeToHooks(callback) {
        this.subscriptions.push(callback);
        this.logger.info('Subscribed to hooks');
    }
    async unsubscribeFromHooks() {
        this.subscriptions.length = 0;
        this.logger.info('Unsubscribed from hooks');
    }
}
class InMemoryValidationCache {
    cache = new Map();
    async store(key, result) {
        this.cache.set(key, result);
    }
    async get(key) {
        return this.cache.get(key) || null;
    }
    async getAll() {
        return Array.from(this.cache.values());
    }
    async clear() {
        this.cache.clear();
    }
}
//# sourceMappingURL=HookIntegrator.js.map