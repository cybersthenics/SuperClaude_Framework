export class PatternApplicator {
    patternLibrary;
    context7Client;
    semanticMatcher;
    constructor(patternLibrary, context7Client, semanticMatcher) {
        this.patternLibrary = patternLibrary;
        this.context7Client = context7Client;
        this.semanticMatcher = semanticMatcher;
    }
    async applyDesignPattern(pattern, target, options = {}) {
        try {
            const applicabilityCheck = await this.validatePatternApplicability(pattern, target);
            if (!applicabilityCheck.isValid) {
                throw new Error(`Pattern not applicable: ${applicabilityCheck.errors.join(', ')}`);
            }
            const enhancedPattern = await this.loadEnhancedPattern(pattern, options.framework);
            const targetAnalysis = await this.analyzeTargetCode(target);
            const adaptedPattern = await this.adaptPatternToContext(enhancedPattern, this.buildContextFromTarget(target, targetAnalysis, options));
            const implementation = await this.generatePatternImplementation(adaptedPattern, target, targetAnalysis, options);
            const validation = await this.validatePatternImplementation(implementation, adaptedPattern, target);
            if (!validation.isValid) {
                throw new Error(`Pattern implementation validation failed: ${validation.violations.join(', ')}`);
            }
            const changes = await this.applyImplementation(implementation, target, options);
            return {
                success: true,
                generatedCode: implementation,
                appliedPattern: adaptedPattern,
                changes,
                recommendations: validation.improvements
            };
        }
        catch (error) {
            return {
                success: false,
                generatedCode: '',
                appliedPattern: pattern,
                changes: [],
                recommendations: [`Failed to apply pattern: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }
    async detectPatternOpportunities(code) {
        try {
            const opportunities = await this.semanticMatcher.findPatternOpportunities(code.structure);
            const enhancedOpportunities = await Promise.all(opportunities.map(async (opportunity) => {
                const documentation = await this.context7Client.getPatternDocumentation(opportunity.pattern.name);
                return {
                    ...opportunity,
                    benefits: this.extractBenefits(documentation),
                    effort: this.estimateEffort(opportunity, code)
                };
            }));
            return enhancedOpportunities.sort((a, b) => {
                const scoreA = a.confidence * this.calculateImpactScore(a);
                const scoreB = b.confidence * this.calculateImpactScore(b);
                return scoreB - scoreA;
            });
        }
        catch (error) {
            console.error('Error detecting pattern opportunities:', error);
            return [];
        }
    }
    async refactorToPattern(existing, pattern) {
        try {
            const codeAnalysis = await this.analyzeExistingCode(existing);
            const compatibility = await this.checkPatternCompatibility(codeAnalysis, pattern);
            if (compatibility.score < 0.6) {
                throw new Error(`Pattern incompatible with existing code (score: ${compatibility.score})`);
            }
            const refactoringPlan = await this.planPatternRefactoring(codeAnalysis, pattern);
            const refactoringResult = await this.executePatternRefactoring(existing, pattern, refactoringPlan);
            const validation = await this.validateRefactoredCode(refactoringResult.refactoredCode, pattern, existing);
            if (!validation.isValid) {
                throw new Error(`Refactoring validation failed: ${validation.issues.join(', ')}`);
            }
            return {
                success: true,
                changes: refactoringResult.changes,
                rollbackId: refactoringResult.rollbackId,
                appliedPattern: pattern
            };
        }
        catch (error) {
            throw new Error(`Pattern refactoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validatePatternImplementation(code, pattern) {
        try {
            const structuralCompliance = await this.checkStructuralCompliance(code, pattern);
            const semanticCompliance = await this.checkSemanticCompliance(code, pattern);
            const violations = [
                ...structuralCompliance.violations,
                ...semanticCompliance.violations
            ];
            const improvements = await this.generateImprovementSuggestions(code, pattern, violations);
            const compliance = (structuralCompliance.score + semanticCompliance.score) / 2;
            return {
                isValid: violations.length === 0,
                compliance,
                violations,
                improvements
            };
        }
        catch (error) {
            return {
                isValid: false,
                compliance: 0,
                violations: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                improvements: []
            };
        }
    }
    async validatePatternApplicability(pattern, target) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        for (const constraint of pattern.constraints || []) {
            const constraintMet = await this.checkConstraint(constraint, target);
            if (!constraintMet) {
                errors.push(`Pattern constraint not met: ${constraint}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }
    async loadEnhancedPattern(pattern, framework) {
        try {
            const documentation = await this.context7Client.getPatternDocumentation(pattern.name);
            if (framework) {
                const frameworkPatterns = await this.context7Client.getFrameworkPatterns(framework);
                const frameworkPattern = frameworkPatterns.find(p => p.name === pattern.name);
                if (frameworkPattern) {
                    return { ...pattern, ...frameworkPattern };
                }
            }
            return { ...pattern, ...documentation };
        }
        catch (error) {
            console.warn(`Could not enhance pattern ${pattern.name}:`, error);
            return pattern;
        }
    }
    async analyzeTargetCode(target) {
        return {
            structure: 'analyzed',
            symbols: [],
            dependencies: [],
            complexity: 0.5
        };
    }
    buildContextFromTarget(target, analysis, options) {
        return {
            projectType: { language: options.targetLanguage || 'typescript' },
            framework: options.framework ? { name: options.framework } : null,
            language: options.targetLanguage || 'typescript',
            targetLocation: { uri: target.uri, range: target.range },
            existingCode: { imports: [], exports: [], symbols: [], dependencies: [] },
            requirements: {
                type: 'pattern',
                name: target.symbolName || 'PatternImplementation',
                description: 'Design pattern implementation'
            },
            constraints: {
                maxLines: 1000,
                conventions: {},
                dependencies: [],
                performance: {}
            }
        };
    }
    async adaptPatternToContext(pattern, context) {
        const adaptations = [];
        const constraints = [...(pattern.constraints || [])];
        if (context.language !== 'typescript') {
            adaptations.push(`Adapted for ${context.language}`);
        }
        if (context.framework) {
            adaptations.push(`Adapted for ${context.framework.name}`);
        }
        return {
            original: pattern,
            adapted: { ...pattern, variables: { ...pattern.variables, language: context.language } },
            adaptations,
            constraints
        };
    }
    async generatePatternImplementation(pattern, target, analysis, options) {
        let implementation = pattern.adapted.template;
        for (const [key, value] of Object.entries(pattern.adapted.variables || {})) {
            const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            implementation = implementation.replace(placeholder, String(value));
        }
        if (options.generateComments) {
            implementation = `// ${pattern.adapted.description}\n${implementation}`;
        }
        return implementation;
    }
    async applyImplementation(implementation, target, options) {
        return [{
                type: 'pattern_application',
                location: target,
                code: implementation,
                pattern: 'design_pattern'
            }];
    }
    extractBenefits(documentation) {
        return documentation?.benefits || ['Improved code structure', 'Better maintainability'];
    }
    estimateEffort(opportunity, code) {
        if (code.complexity < 0.3)
            return 'low';
        if (code.complexity < 0.7)
            return 'medium';
        return 'high';
    }
    calculateImpactScore(opportunity) {
        const effortMultiplier = opportunity.effort === 'low' ? 1 : opportunity.effort === 'medium' ? 0.7 : 0.4;
        return opportunity.confidence * effortMultiplier;
    }
    async analyzeExistingCode(existing) {
        return {
            structure: 'analyzed',
            patterns: [],
            complexity: 0.5
        };
    }
    async checkPatternCompatibility(analysis, pattern) {
        return { score: 0.8 };
    }
    async planPatternRefactoring(analysis, pattern) {
        return {
            steps: ['analyze', 'refactor', 'validate'],
            estimatedTime: '30 minutes'
        };
    }
    async executePatternRefactoring(existing, pattern, plan) {
        return {
            refactoredCode: 'refactored implementation',
            changes: [],
            rollbackId: 'rollback-123'
        };
    }
    async validateRefactoredCode(code, pattern, original) {
        return {
            isValid: true,
            semanticPreservation: 0.95,
            issues: [],
            recommendations: []
        };
    }
    async checkStructuralCompliance(code, pattern) {
        return {
            score: 0.9,
            violations: []
        };
    }
    async checkSemanticCompliance(code, pattern) {
        return {
            score: 0.85,
            violations: []
        };
    }
    async generateImprovementSuggestions(code, pattern, violations) {
        return violations.map(violation => `Fix: ${violation}`);
    }
    async checkConstraint(constraint, target) {
        return true;
    }
    async loadPatternFromContext7(patternName) {
        try {
            const documentation = await this.context7Client.getPatternDocumentation(patternName);
            return documentation;
        }
        catch (error) {
            console.error(`Failed to load pattern ${patternName} from Context7:`, error);
            return null;
        }
    }
    async ensurePatternSemantics(implementation, pattern) {
        return await this.validatePatternImplementation(implementation, pattern);
    }
    async getAvailablePatterns() {
        return await this.patternLibrary.listPatterns();
    }
    async searchPatterns(query) {
        return await this.patternLibrary.searchPatterns(query);
    }
}
//# sourceMappingURL=PatternApplicator.js.map