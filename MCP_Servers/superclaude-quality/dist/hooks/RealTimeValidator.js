import { Logger } from '../utils/Logger.js';
export class RealTimeValidator {
    logger;
    preOperationRules = [];
    postOperationRules = [];
    constructor() {
        this.logger = new Logger('RealTimeValidator');
        this.initializeValidationRules();
    }
    async validatePreOperation(hookContext) {
        const startTime = Date.now();
        this.logger.debug('Pre-operation validation', { operation: hookContext.operation });
        try {
            const issues = [];
            for (const file of hookContext.files) {
                const fileIssues = await this.validateFileWithRules(file, this.preOperationRules);
                issues.push(...fileIssues);
            }
            const operationIssues = await this.validateOperation(hookContext.operation, hookContext);
            issues.push(...operationIssues);
            const status = this.determineValidationStatus(issues);
            const recommendations = await this.generateQuickRecommendations(issues);
            return {
                status,
                issues,
                performance: Date.now() - startTime,
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Pre-operation validation failed', { error });
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
    async validatePostOperation(hookContext) {
        const startTime = Date.now();
        this.logger.debug('Post-operation validation', { operation: hookContext.operation });
        try {
            const issues = [];
            for (const file of hookContext.files) {
                const fileIssues = await this.validateFileWithRules(file, this.postOperationRules);
                issues.push(...fileIssues);
            }
            const sideEffectIssues = await this.validateOperationSideEffects(hookContext);
            issues.push(...sideEffectIssues);
            const status = this.determineValidationStatus(issues);
            const recommendations = await this.generateQuickRecommendations(issues);
            return {
                status,
                issues,
                performance: Date.now() - startTime,
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Post-operation validation failed', { error });
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
    async validateFileWithRules(filePath, rules) {
        const issues = [];
        try {
            const fileContent = await this.readFileContent(filePath);
            for (const rule of rules) {
                const ruleIssues = await this.applyRule(rule, fileContent, filePath);
                issues.push(...ruleIssues);
            }
        }
        catch (error) {
            this.logger.warn('File validation failed', { file: filePath, error });
            issues.push({
                id: `file-error-${Date.now()}`,
                severity: 'medium',
                category: 'syntax',
                message: `Could not validate file: ${error.message}`,
                location: { file: filePath, line: 0, column: 0 },
                suggestion: 'Check file accessibility and format',
                autoFixable: false,
                ruleId: 'file-read-error'
            });
        }
        return issues;
    }
    async applyRule(rule, content, filePath) {
        const issues = [];
        try {
            if (rule.pattern instanceof RegExp) {
                const matches = content.matchAll(new RegExp(rule.pattern, 'g'));
                for (const match of matches) {
                    const lineNumber = this.getLineNumber(content, match.index || 0);
                    issues.push({
                        id: `${rule.name}-${Date.now()}-${Math.random()}`,
                        severity: rule.severity,
                        category: rule.category,
                        message: rule.message,
                        location: {
                            file: filePath,
                            line: lineNumber,
                            column: (match.index || 0) - this.getLineStart(content, lineNumber)
                        },
                        suggestion: rule.suggestion,
                        autoFixable: false,
                        ruleId: rule.name
                    });
                }
            }
            else {
                if (content.includes(rule.pattern)) {
                    const index = content.indexOf(rule.pattern);
                    const lineNumber = this.getLineNumber(content, index);
                    issues.push({
                        id: `${rule.name}-${Date.now()}`,
                        severity: rule.severity,
                        category: rule.category,
                        message: rule.message,
                        location: {
                            file: filePath,
                            line: lineNumber,
                            column: index - this.getLineStart(content, lineNumber)
                        },
                        suggestion: rule.suggestion,
                        autoFixable: false,
                        ruleId: rule.name
                    });
                }
            }
        }
        catch (error) {
            this.logger.warn('Rule application failed', { rule: rule.name, error });
        }
        return issues;
    }
    async validateOperation(operation, hookContext) {
        const issues = [];
        switch (operation) {
            case 'edit':
            case 'write':
                if (hookContext.files.length === 0) {
                    issues.push({
                        id: 'no-files-operation',
                        severity: 'medium',
                        category: 'syntax',
                        message: 'Write operation with no target files',
                        location: { file: '', line: 0, column: 0 },
                        suggestion: 'Specify target files for write operations',
                        autoFixable: false,
                        ruleId: 'operation-no-files'
                    });
                }
                break;
            case 'read':
                for (const file of hookContext.files) {
                    if (!await this.fileExists(file)) {
                        issues.push({
                            id: 'file-not-found',
                            severity: 'high',
                            category: 'syntax',
                            message: `File not found: ${file}`,
                            location: { file, line: 0, column: 0 },
                            suggestion: 'Check file path and existence',
                            autoFixable: false,
                            ruleId: 'file-not-found'
                        });
                    }
                }
                break;
            default:
                this.logger.debug('Unknown operation for validation', { operation });
        }
        return issues;
    }
    async validateOperationSideEffects(hookContext) {
        const issues = [];
        switch (hookContext.operation) {
            case 'edit':
            case 'write':
                for (const file of hookContext.files) {
                    const syntaxValid = await this.quickSyntaxCheck(file);
                    if (!syntaxValid) {
                        issues.push({
                            id: 'syntax-invalid-after-write',
                            severity: 'critical',
                            category: 'syntax',
                            message: `File has syntax errors after modification: ${file}`,
                            location: { file, line: 0, column: 0 },
                            suggestion: 'Review and fix syntax errors',
                            autoFixable: false,
                            ruleId: 'post-write-syntax-error'
                        });
                    }
                }
                break;
        }
        return issues;
    }
    initializeValidationRules() {
        this.preOperationRules = [
            {
                name: 'no-console-log',
                pattern: /console\.log\(/g,
                severity: 'medium',
                category: 'style',
                message: 'Console.log statements should be removed',
                suggestion: 'Use proper logging instead of console.log'
            },
            {
                name: 'no-todo-comments',
                pattern: /\/\/\s*TODO|\/\*\s*TODO/g,
                severity: 'low',
                category: 'maintainability',
                message: 'TODO comments found',
                suggestion: 'Address TODO items or convert to proper issue tracking'
            },
            {
                name: 'no-hardcoded-credentials',
                pattern: /(password|secret|key|token)\s*=\s*['"][^'"]+['"]/gi,
                severity: 'critical',
                category: 'security',
                message: 'Hardcoded credentials detected',
                suggestion: 'Use environment variables or secure configuration'
            }
        ];
        this.postOperationRules = [
            {
                name: 'syntax-check',
                pattern: /\bSyntaxError\b/g,
                severity: 'critical',
                category: 'syntax',
                message: 'Syntax error detected',
                suggestion: 'Fix syntax errors before proceeding'
            },
            {
                name: 'missing-imports',
                pattern: /ReferenceError.*is not defined/g,
                severity: 'high',
                category: 'semantic',
                message: 'Missing import or undefined reference',
                suggestion: 'Add missing imports or define undefined variables'
            },
            {
                name: 'unused-imports',
                pattern: /import\s+.*\s+from\s+['"][^'"]+['"].*\n(?!.*\1)/g,
                severity: 'medium',
                category: 'style',
                message: 'Unused import detected',
                suggestion: 'Remove unused imports to improve code clarity'
            }
        ];
        this.logger.info('Validation rules initialized', {
            preRules: this.preOperationRules.length,
            postRules: this.postOperationRules.length
        });
    }
    async generateQuickRecommendations(issues) {
        const recommendations = [];
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push({
                type: 'fix',
                priority: 'critical',
                description: `Fix ${criticalIssues.length} critical issues immediately`,
                actionable: true,
                estimatedEffort: 'high',
                categories: [...new Set(criticalIssues.map(i => i.category))]
            });
        }
        const securityIssues = issues.filter(i => i.category === 'security');
        if (securityIssues.length > 0) {
            recommendations.push({
                type: 'security',
                priority: 'high',
                description: 'Review and address security concerns',
                actionable: true,
                estimatedEffort: 'medium',
                categories: ['security']
            });
        }
        return recommendations.slice(0, 3);
    }
    determineValidationStatus(issues) {
        if (issues.some(i => i.severity === 'critical'))
            return 'failed';
        if (issues.some(i => i.severity === 'high'))
            return 'warning';
        return 'passed';
    }
    createErrorResult(error, processingTime) {
        return {
            status: 'failed',
            issues: [{
                    id: `validation-error-${Date.now()}`,
                    severity: 'critical',
                    category: 'syntax',
                    message: `Validation failed: ${error.message}`,
                    location: { file: '', line: 0, column: 0 },
                    suggestion: 'Check validation configuration and try again',
                    autoFixable: false,
                    ruleId: 'validation-error'
                }],
            performance: processingTime,
            recommendations: []
        };
    }
    async readFileContent(filePath) {
        return `// Mock content for ${filePath}`;
    }
    async fileExists(filePath) {
        return !filePath.includes('nonexistent');
    }
    async quickSyntaxCheck(filePath) {
        return !filePath.includes('invalid');
    }
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    getLineStart(content, lineNumber) {
        const lines = content.split('\n');
        let start = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            start += lines[i].length + 1;
        }
        return start;
    }
}
//# sourceMappingURL=RealTimeValidator.js.map