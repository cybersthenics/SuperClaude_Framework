export class BasePersona {
    async applyBehavior(context) {
        try {
            const transformations = await this.generateBehaviorTransformations(context);
            const qualityAdjustments = await this.generateQualityAdjustments(context);
            const confidence = await this.calculateBehaviorConfidence(context);
            const recommendations = await this.generateRecommendations(context);
            const optimizations = await this.generateOptimizations(context);
            return {
                transformations,
                qualityAdjustments,
                confidence,
                recommendations,
                optimizations
            };
        }
        catch (error) {
            return {
                transformations: [],
                qualityAdjustments: [],
                confidence: 0.5,
                recommendations: [],
                optimizations: []
            };
        }
    }
    async makeDecision(options, context) {
        try {
            const scoredOptions = await this.scoreOptions(options, context);
            const selectedOption = scoredOptions[0];
            const reasoning = await this.generateDecisionReasoning(selectedOption, scoredOptions, context);
            const confidence = await this.calculateDecisionConfidence(selectedOption, context);
            const alternativeRecommendations = scoredOptions.slice(1, 3).map(option => option.id);
            return {
                selectedOption: selectedOption.id,
                reasoning,
                confidence,
                alternativeRecommendations
            };
        }
        catch (error) {
            return {
                selectedOption: options[0]?.id || 'default',
                reasoning: 'Error occurred during decision making',
                confidence: 0.3,
                alternativeRecommendations: []
            };
        }
    }
    async transformOperation(operation, behaviorResult) {
        const transformedOperation = { ...operation };
        for (const transformation of behaviorResult.transformations) {
            transformedOperation.parameters = await this.applyTransformation(transformedOperation.parameters, transformation);
        }
        for (const adjustment of behaviorResult.qualityAdjustments) {
            transformedOperation.requirements = await this.applyQualityAdjustment(transformedOperation.requirements || [], adjustment);
        }
        return transformedOperation;
    }
    async generateOptimizations(operation) {
        const optimizations = [];
        const strategies = this.coreStrategies.filter(s => s.optimizationFocus.length > 0);
        for (const strategy of strategies) {
            for (const focus of strategy.optimizationFocus) {
                const optimization = await this.generateOptimizationForFocus(focus, operation);
                if (optimization) {
                    optimizations.push(optimization);
                }
            }
        }
        return optimizations;
    }
    async receiveExpertise(expertise, fromPersona) {
        try {
            const applicabilityScore = await this.calculateExpertiseApplicability(expertise);
            if (applicabilityScore < 0.5) {
                return {
                    applied: false,
                    modifications: [],
                    reasoning: 'Expertise not applicable to this persona domain',
                    confidence: applicabilityScore
                };
            }
            const modifications = await this.applyExpertiseInsights(expertise);
            const reasoning = await this.generateExpertiseApplicationReasoning(expertise, modifications);
            return {
                applied: true,
                modifications,
                reasoning,
                confidence: applicabilityScore
            };
        }
        catch (error) {
            return {
                applied: false,
                modifications: [],
                reasoning: 'Error applying expertise',
                confidence: 0.3
            };
        }
    }
    async applyContextToPriorities(priorities, context) {
        try {
            const scoredPriorities = await this.scorePrioritiesForContext(priorities, context);
            return scoredPriorities.map(p => p.priority);
        }
        catch (error) {
            return priorities;
        }
    }
    async scoreOptions(options, context) {
        const scoredOptions = [];
        for (const option of options) {
            const score = await this.calculateOptionScore(option, context);
            scoredOptions.push({ ...option, score });
        }
        return scoredOptions.sort((a, b) => b.score - a.score);
    }
    async calculateOptionScore(option, context) {
        let score = 0;
        const priorityScore = await this.scorePriorityAlignment(option, context);
        score += priorityScore * 0.4;
        const riskScore = await this.scoreRiskTolerance(option);
        score += riskScore * 0.3;
        const complexityScore = await this.scoreComplexity(option, context);
        score += complexityScore * 0.2;
        const domainScore = await this.scoreDomainFit(option, context);
        score += domainScore * 0.1;
        return Math.min(Math.max(score, 0), 1);
    }
    async scorePriorityAlignment(option, context) {
        return 0.5;
    }
    async scoreRiskTolerance(option) {
        const strategy = this.coreStrategies.find(s => s.domain === 'risk');
        const tolerance = strategy?.riskToleranceLevel || 'medium';
        switch (tolerance) {
            case 'low':
                return 1 - option.riskLevel;
            case 'high':
                return option.riskLevel;
            default:
                return 0.5;
        }
    }
    async scoreComplexity(option, context) {
        const complexityDiff = Math.abs(context.complexity - option.implementationComplexity);
        return 1 - complexityDiff;
    }
    async scoreDomainFit(option, context) {
        const domainMatch = this.coreStrategies.some(s => s.domain === context.domain);
        return domainMatch ? 1 : 0.5;
    }
    async generateDecisionReasoning(selectedOption, allOptions, context) {
        const reasons = [];
        if (selectedOption.pros.length > 0) {
            reasons.push(`Aligns with key advantages: ${selectedOption.pros.slice(0, 2).join(', ')}`);
        }
        if (selectedOption.riskLevel < 0.3) {
            reasons.push('Low risk option preferred');
        }
        else if (selectedOption.riskLevel > 0.7) {
            reasons.push('High risk accepted for potential benefits');
        }
        if (selectedOption.implementationComplexity < 0.3) {
            reasons.push('Simple implementation preferred');
        }
        else if (selectedOption.implementationComplexity > 0.7) {
            reasons.push('Complex implementation justified by requirements');
        }
        return reasons.join('; ') || 'Selected based on persona priorities';
    }
    async calculateDecisionConfidence(selectedOption, context) {
        let confidence = 0.5;
        if (this.coreStrategies.some(s => s.domain === context.domain)) {
            confidence += 0.2;
        }
        if (selectedOption.pros.length > selectedOption.cons.length) {
            confidence += 0.2;
        }
        if (selectedOption.riskLevel > 0.7) {
            confidence -= 0.1;
        }
        return Math.min(Math.max(confidence, 0), 1);
    }
    async applyTransformation(parameters, transformation) {
        return parameters;
    }
    async applyQualityAdjustment(requirements, adjustment) {
        return [...requirements, `${adjustment.metric}: ${adjustment.reasoning}`];
    }
    async generateOptimizationForFocus(focus, operation) {
        return {
            type: focus,
            description: `Optimize for ${focus}`,
            impact: 'Medium',
            effort: 0.5,
            priority: 1
        };
    }
    async calculateExpertiseApplicability(expertise) {
        const domainMatch = this.coreStrategies.some(s => s.domain === expertise.domain);
        if (domainMatch) {
            return Math.min(expertise.confidence + 0.2, 1);
        }
        const relatedDomains = this.getRelatedDomains(expertise.domain);
        if (relatedDomains.length > 0) {
            return Math.min(expertise.confidence, 0.8);
        }
        return Math.min(expertise.confidence, 0.5);
    }
    async applyExpertiseInsights(expertise) {
        const modifications = [];
        for (const insight of expertise.insights) {
            const modification = await this.interpretInsight(insight, expertise.fromPersona);
            if (modification) {
                modifications.push(modification);
            }
        }
        return modifications;
    }
    async interpretInsight(insight, fromPersona) {
        return `Incorporated ${fromPersona} insight: ${insight}`;
    }
    async generateExpertiseApplicationReasoning(expertise, modifications) {
        return `Applied ${expertise.insights.length} insights from ${expertise.fromPersona} ` +
            `with ${modifications.length} modifications based on persona priorities`;
    }
    async scorePrioritiesForContext(priorities, context) {
        const scored = [];
        for (const priority of priorities) {
            const score = await this.calculatePriorityContextScore(priority, context);
            scored.push({ priority, score });
        }
        return scored.sort((a, b) => b.score - a.score);
    }
    async calculatePriorityContextScore(priority, context) {
        let score = 0.5;
        if (context.objectives.some(obj => obj.toLowerCase().includes(priority.toLowerCase()))) {
            score += 0.3;
        }
        if (context.constraints.some(constraint => constraint.toLowerCase().includes(priority.toLowerCase()))) {
            score += 0.2;
        }
        return Math.min(score, 1);
    }
    getRelatedDomains(domain) {
        const domainRelations = {
            'frontend': ['ui', 'ux', 'design', 'accessibility'],
            'backend': ['api', 'database', 'performance', 'security'],
            'security': ['backend', 'compliance', 'authentication'],
            'performance': ['backend', 'frontend', 'optimization'],
            'architecture': ['design', 'scalability', 'patterns']
        };
        return domainRelations[domain] || [];
    }
    async validatePerformance(metrics) {
        return {
            isValid: true,
            score: 0.5,
            issues: [],
            recommendations: []
        };
    }
    async validateReliability(system) {
        return {
            isValid: true,
            score: 0.5,
            issues: [],
            recommendations: []
        };
    }
    async validateQuality(metrics) {
        return {
            isValid: true,
            score: 0.5,
            issues: [],
            recommendations: []
        };
    }
    async assessThreat(threat) {
        return {
            riskLevel: 'unknown',
            recommendations: ['Consult security persona for detailed assessment']
        };
    }
    async investigateIssue(problem) {
        return {
            rootCause: 'unknown',
            recommendations: ['Consult analyzer persona for detailed investigation']
        };
    }
    async createLearningPath(topic, userLevel) {
        return {
            path: ['Basic understanding', 'Intermediate concepts', 'Advanced applications'],
            recommendations: ['Consult mentor persona for detailed learning path']
        };
    }
    async localizeContent(content, targetLanguage) {
        return {
            localizedContent: content,
            recommendations: ['Consult scribe persona for proper localization']
        };
    }
}
//# sourceMappingURL=BasePersona.js.map