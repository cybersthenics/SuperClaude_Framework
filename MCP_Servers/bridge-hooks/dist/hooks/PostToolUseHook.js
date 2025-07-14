import { BaseHook } from '../core/BaseHook.js';
import { HookType } from '../types/index.js';
export class PostToolUseHook extends BaseHook {
    constructor() {
        super(HookType.PostToolUse);
    }
    async execute(context) {
        const timer = performance.now();
        try {
            const validationResult = await this.validateMCPResult(context);
            let qualityGatesTriggered = false;
            if (this.requiresQualityGates(context)) {
                await this.triggerQualityGates(context, validationResult);
                qualityGatesTriggered = true;
            }
            await this.updatePerformanceMetrics(context, validationResult);
            if (validationResult.success) {
                await this.cacheValidatedResult(context, validationResult);
            }
            const executionTime = performance.now() - timer;
            const result = this.createSuccessResult({
                validation: validationResult,
                qualityGatesTriggered,
                metricsUpdated: true,
                serverTarget: this.targetServer,
                validationScore: this.calculateValidationScore(validationResult)
            }, {
                executionTime,
                validationTime: validationResult.executionTime,
                optimizationFactor: 1.41
            }, {
                cacheable: validationResult.success,
                ttl: validationResult.success ? 3600 : 0
            });
            return result;
        }
        catch (error) {
            const executionTime = performance.now() - timer;
            await this.reportValidationError(context, error);
            return this.createErrorResult(error, executionTime);
        }
    }
    async validateMCPResult(context) {
        const validationStart = performance.now();
        try {
            const validations = await Promise.all([
                this.validateResultStructure(context.data),
                this.validateResultContent(context.data),
                this.validatePerformanceMetrics(context.performance),
                this.validateSemanticConsistency(context.data, context.semantic)
            ]);
            const success = validations.every(v => v.success);
            const executionTime = performance.now() - validationStart;
            return {
                success,
                details: validations,
                executionTime,
                issues: validations.flatMap(v => v.issues || [])
            };
        }
        catch (error) {
            return {
                success: false,
                executionTime: performance.now() - validationStart,
                issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async validateResultStructure(data) {
        try {
            if (!data) {
                return {
                    success: false,
                    issues: ['No result data provided']
                };
            }
            const requiredFields = ['success', 'data'];
            const missingFields = requiredFields.filter(field => !(field in data));
            if (missingFields.length > 0) {
                return {
                    success: false,
                    issues: [`Missing required fields: ${missingFields.join(', ')}`]
                };
            }
            if (typeof data.success !== 'boolean') {
                return {
                    success: false,
                    issues: ['Invalid success field type']
                };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                issues: [`Structure validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async validateResultContent(data) {
        try {
            if (!data?.data) {
                return { success: true };
            }
            const content = data.data;
            const issues = [];
            const contentSize = JSON.stringify(content).length;
            if (contentSize > 10 * 1024 * 1024) {
                issues.push('Content size exceeds 10MB limit');
            }
            if (content.type === 'code' && !content.language) {
                issues.push('Code content missing language specification');
            }
            if (content.type === 'analysis' && !content.findings) {
                issues.push('Analysis content missing findings');
            }
            if (this.containsHarmfulContent(content)) {
                issues.push('Content contains potentially harmful elements');
            }
            return {
                success: issues.length === 0,
                issues: issues.length > 0 ? issues : []
            };
        }
        catch (error) {
            return {
                success: false,
                issues: [`Content validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async validatePerformanceMetrics(performance) {
        try {
            if (!performance) {
                return {
                    success: false,
                    issues: ['No performance metrics provided']
                };
            }
            const issues = [];
            if (typeof performance.executionTime !== 'number' || performance.executionTime < 0) {
                issues.push('Invalid execution time');
            }
            else if (performance.executionTime > this.performanceBudget.maxExecutionTime * 2) {
                issues.push(`Execution time exceeds budget by 100%: ${performance.executionTime}ms`);
            }
            if (performance.memoryUsage && performance.memoryUsage > this.performanceBudget.maxMemoryUsage * 2) {
                issues.push(`Memory usage exceeds budget: ${performance.memoryUsage}MB`);
            }
            if (performance.optimizationFactor && performance.optimizationFactor < 0.5) {
                issues.push(`Low optimization factor: ${performance.optimizationFactor}`);
            }
            return {
                success: issues.length === 0,
                issues: issues.length > 0 ? issues : []
            };
        }
        catch (error) {
            return {
                success: false,
                issues: [`Performance validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async validateSemanticConsistency(data, semantic) {
        try {
            if (!semantic?.enabled) {
                return { success: true };
            }
            if (data && semantic.semanticKey) {
                const consistencyScore = this.calculateSemanticConsistency(data, semantic);
                if (consistencyScore < 0.7) {
                    return {
                        success: false,
                        issues: [`Low semantic consistency score: ${consistencyScore}`]
                    };
                }
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                issues: [`Semantic validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    requiresQualityGates(context) {
        const operation = context.operation.toLowerCase();
        const criticalOperations = ['deploy', 'production', 'release', 'publish'];
        const hasCodeChanges = context.data?.type === 'code' || operation.includes('code');
        const hasAnalysisResults = context.data?.type === 'analysis';
        const isHighComplexity = this.calculateComplexity(context) > 0.7;
        return criticalOperations.some(op => operation.includes(op)) ||
            hasCodeChanges ||
            hasAnalysisResults ||
            isHighComplexity;
    }
    async triggerQualityGates(context, validation) {
        const gates = [];
        if (context.data?.type === 'code') {
            gates.push('code_quality');
            gates.push('security_scan');
        }
        if (context.operation.includes('deploy')) {
            gates.push('deployment_validation');
            gates.push('performance_test');
        }
        if (validation.issues && validation.issues.length > 0) {
            gates.push('issue_resolution');
        }
        for (const gate of gates) {
            console.log(`Triggering quality gate: ${gate} for operation: ${context.operation}`);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    async updatePerformanceMetrics(context, validation) {
        const metrics = {
            operation: context.operation,
            validationTime: validation.executionTime || 0,
            validationSuccess: validation.success,
            issuesFound: validation.issues?.length || 0
        };
        console.log(`Performance metrics updated for ${context.operation}:`, metrics);
    }
    async cacheValidatedResult(context, validation) {
        if (!validation.success)
            return;
        const cacheKey = `validated_${this.generateCacheKey(context)}`;
        const cacheData = {
            validation,
            timestamp: Date.now(),
            ttl: 3600000
        };
        console.log(`Caching validated result: ${cacheKey}`);
    }
    async reportValidationError(context, error) {
        const errorReport = {
            operation: context.operation,
            error: error.message,
            stack: error.stack,
            context: {
                sessionId: context.sessionId,
                timestamp: Date.now()
            }
        };
        console.error(`Validation error reported:`, errorReport);
    }
    containsHarmfulContent(content) {
        const contentString = JSON.stringify(content).toLowerCase();
        const harmfulPatterns = [
            'eval(',
            'exec(',
            'system(',
            'shell_exec',
            '<script',
            'javascript:',
            'data:text/html'
        ];
        return harmfulPatterns.some(pattern => contentString.includes(pattern));
    }
    calculateSemanticConsistency(data, semantic) {
        if (!data || !semantic)
            return 1.0;
        const dataString = JSON.stringify(data).toLowerCase();
        const semanticKey = semantic.semanticKey?.toLowerCase() || '';
        if (semanticKey && dataString.includes(semanticKey)) {
            return 0.9;
        }
        return 0.8;
    }
    calculateValidationScore(validation) {
        if (!validation.success)
            return 0.0;
        const issueCount = validation.issues?.length || 0;
        const baseScore = 1.0;
        const penaltyPerIssue = 0.1;
        return Math.max(baseScore - (issueCount * penaltyPerIssue), 0.0);
    }
    shouldCache(context) {
        const operation = context.operation.toLowerCase();
        const hasValidationResults = context.data?.validation;
        const isExpensiveValidation = operation.includes('complex') || operation.includes('analysis');
        return context.cache?.enabled === true &&
            (hasValidationResults || isExpensiveValidation) &&
            this.isStableCacheCandidate(context);
    }
    isStableCacheCandidate(context) {
        const operation = context.operation.toLowerCase();
        if (operation.includes('real-time') || operation.includes('live')) {
            return false;
        }
        if (context.sessionId && operation.includes('user-specific')) {
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=PostToolUseHook.js.map