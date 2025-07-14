export class ChainModeHandler {
    personas;
    logger;
    performanceMonitor;
    collaborationCoordinator;
    activeChains = new Map();
    contextPreservation = new Map();
    preservationThreshold = 0.95;
    constructor(personas, logger, performanceMonitor, collaborationCoordinator) {
        this.personas = personas;
        this.logger = logger;
        this.performanceMonitor = performanceMonitor;
        this.collaborationCoordinator = collaborationCoordinator;
    }
    async executeChain(steps, context) {
        const startTime = Date.now();
        try {
            this.logger.info(`Starting chain execution: ${context.chainId}`, {
                totalSteps: steps.length,
                personas: steps.map(s => s.persona)
            });
            const chainExecution = this.initializeChainExecution(steps, context);
            this.activeChains.set(context.chainId, chainExecution);
            this.initializeContextPreservation(context.chainId);
            const results = [];
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepResult = await this.executeChainStep(step, context, results);
                results.push(stepResult);
                chainExecution.results.push(stepResult);
                chainExecution.currentStep = i + 1;
                await this.updateContextPreservation(context.chainId, stepResult);
                if (i < steps.length - 1) {
                    await this.prepareHandoffForNextStep(steps[i + 1], stepResult, context);
                }
            }
            chainExecution.status = 'completed';
            const executionTime = Date.now() - startTime;
            const preservation = this.contextPreservation.get(context.chainId);
            this.logger.info(`Chain execution completed: ${context.chainId}`, {
                executionTime,
                steps: results.length,
                preservationScore: preservation?.preservationScore || 0
            });
            this.performanceMonitor.recordMetric('chain_execution_time', executionTime);
            this.performanceMonitor.recordMetric('chain_preservation_score', preservation?.preservationScore || 0);
            return results;
        }
        catch (error) {
            this.logger.error(`Chain execution failed: ${context.chainId}`, error);
            const chainExecution = this.activeChains.get(context.chainId);
            if (chainExecution) {
                chainExecution.status = 'failed';
            }
            throw error;
        }
        finally {
            this.cleanupChainExecution(context.chainId);
        }
    }
    async executeChainStep(step, context, previousResults) {
        const startTime = Date.now();
        try {
            this.logger.debug(`Executing chain step ${step.stepNumber}: ${step.persona}`);
            const personaImpl = this.personas.get(step.persona);
            if (!personaImpl) {
                throw new Error(`Persona ${step.persona} not found`);
            }
            const stepContext = await this.buildStepContext(step, context, previousResults);
            const behaviorResult = await personaImpl.applyBehavior(stepContext);
            const insights = this.generateInsightsFromBehavior(step.persona, behaviorResult);
            const handoffPackage = await this.prepareHandoffPackage(step.persona, stepContext, insights, previousResults);
            const nextStepRecommendations = await this.generateNextStepRecommendations(step, behaviorResult, context);
            const executionTime = Date.now() - startTime;
            const stepResult = {
                stepNumber: step.stepNumber,
                persona: step.persona,
                result: behaviorResult,
                insights,
                handoffPackage,
                nextStepRecommendations
            };
            context.accumulatedContext = this.updateAccumulatedContext(context.accumulatedContext, stepResult);
            context.preservedInsights.push(...insights);
            this.logger.info(`Chain step completed: ${step.stepNumber} (${step.persona})`, {
                executionTime,
                insightCount: insights.length,
                confidence: behaviorResult.confidence
            });
            return stepResult;
        }
        catch (error) {
            this.logger.error(`Chain step failed: ${step.stepNumber} (${step.persona})`, error);
            throw error;
        }
    }
    async preserveContextAcrossTransitions(fromStep, toStep, context) {
        try {
            this.logger.debug(`Preserving context from ${fromStep.persona} to ${toStep.persona}`);
            const preservation = this.contextPreservation.get(context.chainId);
            if (!preservation) {
                throw new Error(`Context preservation not initialized for chain ${context.chainId}`);
            }
            const preservedElements = [];
            if (fromStep.insights && fromStep.insights.length > 0) {
                preservation.preservedInsights.push(...fromStep.insights);
                preservedElements.push('insights');
            }
            if (fromStep.handoffPackage) {
                preservation.handoffPackages.push(fromStep.handoffPackage);
                preservedElements.push('handoff_package');
            }
            preservation.stepContexts.set(fromStep.stepNumber, {
                persona: fromStep.persona,
                result: fromStep.result,
                timestamp: new Date()
            });
            preservedElements.push('step_context');
            preservation.sharedState = {
                ...preservation.sharedState,
                [`step_${fromStep.stepNumber}`]: {
                    persona: fromStep.persona,
                    key_insights: fromStep.insights.map(i => i.content),
                    confidence: fromStep.result.confidence,
                    recommendations: fromStep.nextStepRecommendations
                }
            };
            preservedElements.push('shared_state');
            const preservationScore = this.calculatePreservationScore(preservation);
            preservation.preservationScore = preservationScore;
            this.logger.info(`Context preservation completed`, {
                preservationScore,
                preservedElements: preservedElements.length,
                chainId: context.chainId
            });
            return { preservationScore, preservedElements };
        }
        catch (error) {
            this.logger.error('Context preservation failed:', error);
            throw error;
        }
    }
    async aggregateInsights(insights, chainId) {
        try {
            this.logger.debug(`Aggregating ${insights.length} insights for chain ${chainId}`);
            const insightsByType = this.groupInsightsByType(insights);
            const insightsByPersona = this.groupInsightsByPersona(insights);
            const synthesizedInsights = await this.synthesizeInsights(insights);
            const confidenceScore = insights.length > 0
                ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length
                : 0;
            const synthesizedRecommendations = this.generateSynthesizedRecommendations(synthesizedInsights, insightsByPersona);
            const qualityMetrics = this.calculateInsightQualityMetrics(insights);
            const aggregation = {
                chainId,
                aggregatedInsights: synthesizedInsights,
                confidenceScore,
                synthesizedRecommendations,
                qualityMetrics
            };
            this.logger.info(`Insight aggregation completed for chain ${chainId}`, {
                originalInsights: insights.length,
                synthesizedInsights: synthesizedInsights.length,
                confidenceScore,
                recommendations: synthesizedRecommendations.length
            });
            return aggregation;
        }
        catch (error) {
            this.logger.error('Insight aggregation failed:', error);
            throw error;
        }
    }
    async prepareHandoffPackage(persona, context, insights, previousResults) {
        try {
            const nextPersona = this.determineNextPersona(previousResults);
            if (!nextPersona) {
                return {
                    fromPersona: persona,
                    toPersona: persona,
                    context,
                    insights,
                    recommendations: [],
                    priorities: [],
                    state: { isLastStep: true }
                };
            }
            const priorities = await this.getPersonaPriorities(nextPersona);
            const recommendations = await this.generateHandoffRecommendations(persona, nextPersona, insights);
            const state = this.capturePersonaState(persona, context, insights);
            const handoffPackage = {
                fromPersona: persona,
                toPersona: nextPersona,
                context,
                insights,
                recommendations,
                priorities,
                state
            };
            return handoffPackage;
        }
        catch (error) {
            this.logger.error('Handoff package preparation failed:', error);
            throw error;
        }
    }
    getContextPreservationScore(chainId) {
        const preservation = this.contextPreservation.get(chainId);
        return preservation?.preservationScore || 0;
    }
    getChainExecutionStatus(chainId) {
        const execution = this.activeChains.get(chainId);
        return execution?.status || 'unknown';
    }
    initializeChainExecution(steps, context) {
        return {
            chainId: context.chainId,
            steps,
            currentStep: 0,
            results: [],
            accumulatedInsights: [],
            contextPreservation: {},
            startTime: new Date(),
            status: 'pending'
        };
    }
    initializeContextPreservation(chainId) {
        this.contextPreservation.set(chainId, {
            chainId,
            stepContexts: new Map(),
            sharedState: {},
            preservedInsights: [],
            handoffPackages: [],
            preservationScore: 0
        });
    }
    async buildStepContext(step, context, previousResults) {
        const stepContext = {
            domain: step.operation.type || 'general',
            complexity: this.calculateStepComplexity(step, previousResults),
            userIntent: step.expectedOutcome,
            projectContext: context.accumulatedContext?.projectContext || {
                projectType: 'unknown',
                framework: 'unknown',
                language: 'unknown',
                environment: 'development',
                phase: 'development',
                constraints: []
            },
            sessionHistory: previousResults.map(result => ({
                timestamp: new Date(),
                eventType: 'chain_step_result',
                data: result,
                persona: result.persona
            })),
            qualityRequirements: step.operation.requirements?.map(req => ({
                category: 'chain',
                requirement: req,
                priority: 1,
                validationMethod: 'automated'
            })) || []
        };
        return stepContext;
    }
    calculateStepComplexity(step, previousResults) {
        let complexity = 0.5;
        complexity += step.stepNumber * 0.1;
        if (previousResults.length > 0) {
            const avgConfidence = previousResults.reduce((sum, result) => sum + (result.result.confidence || 0), 0) / previousResults.length;
            if (avgConfidence < 0.7) {
                complexity += 0.2;
            }
        }
        return Math.min(complexity, 1.0);
    }
    generateInsightsFromBehavior(persona, behaviorResult) {
        const insights = [];
        if (behaviorResult.transformations) {
            for (const transformation of behaviorResult.transformations) {
                insights.push({
                    persona,
                    type: 'transformation',
                    content: transformation.description,
                    confidence: behaviorResult.confidence || 0.5,
                    applicability: [transformation.type]
                });
            }
        }
        if (behaviorResult.recommendations) {
            for (const recommendation of behaviorResult.recommendations) {
                insights.push({
                    persona,
                    type: 'recommendation',
                    content: recommendation,
                    confidence: behaviorResult.confidence || 0.5,
                    applicability: ['general']
                });
            }
        }
        if (behaviorResult.optimizations) {
            for (const optimization of behaviorResult.optimizations) {
                insights.push({
                    persona,
                    type: 'optimization',
                    content: optimization.description,
                    confidence: behaviorResult.confidence || 0.5,
                    applicability: [optimization.type]
                });
            }
        }
        return insights;
    }
    updateAccumulatedContext(accumulatedContext, stepResult) {
        return {
            ...accumulatedContext,
            [`step_${stepResult.stepNumber}`]: {
                persona: stepResult.persona,
                insights: stepResult.insights,
                confidence: stepResult.result.confidence,
                timestamp: new Date()
            },
            lastStep: {
                persona: stepResult.persona,
                insights: stepResult.insights,
                recommendations: stepResult.nextStepRecommendations
            }
        };
    }
    async updateContextPreservation(chainId, stepResult) {
        const preservation = this.contextPreservation.get(chainId);
        if (!preservation)
            return;
        preservation.preservedInsights.push(...stepResult.insights);
        preservation.stepContexts.set(stepResult.stepNumber, stepResult);
        preservation.preservationScore = this.calculatePreservationScore(preservation);
    }
    calculatePreservationScore(preservation) {
        let score = 0;
        if (preservation.preservedInsights.length > 0) {
            score += 0.3;
        }
        if (preservation.handoffPackages.length > 0) {
            score += 0.3;
        }
        if (preservation.stepContexts.size > 0) {
            score += 0.2;
        }
        if (Object.keys(preservation.sharedState).length > 0) {
            score += 0.2;
        }
        return Math.min(score, 1.0);
    }
    async prepareHandoffForNextStep(nextStep, currentResult, context) {
        try {
            await this.collaborationCoordinator.managePersonaHandoff(currentResult.persona, nextStep.persona, context.accumulatedContext, currentResult.insights);
        }
        catch (error) {
            this.logger.error('Handoff preparation failed:', error);
        }
    }
    async generateNextStepRecommendations(step, behaviorResult, context) {
        const recommendations = [];
        if (behaviorResult.recommendations) {
            recommendations.push(...behaviorResult.recommendations);
        }
        if (context.currentStep < context.totalSteps - 1) {
            recommendations.push('Consider next step requirements');
            recommendations.push('Preserve important context for handoff');
        }
        return recommendations;
    }
    groupInsightsByType(insights) {
        const grouped = new Map();
        for (const insight of insights) {
            if (!grouped.has(insight.type)) {
                grouped.set(insight.type, []);
            }
            grouped.get(insight.type).push(insight);
        }
        return grouped;
    }
    groupInsightsByPersona(insights) {
        const grouped = new Map();
        for (const insight of insights) {
            if (!grouped.has(insight.persona)) {
                grouped.set(insight.persona, []);
            }
            grouped.get(insight.persona).push(insight);
        }
        return grouped;
    }
    async synthesizeInsights(insights) {
        const synthesized = [];
        const groupedByContent = new Map();
        for (const insight of insights) {
            const key = insight.content.toLowerCase().substring(0, 50);
            if (!groupedByContent.has(key)) {
                groupedByContent.set(key, []);
            }
            groupedByContent.get(key).push(insight);
        }
        for (const [_, group] of groupedByContent) {
            if (group.length > 1) {
                const mergedInsight = {
                    persona: group[0].persona,
                    type: 'synthesized',
                    content: `Combined insight: ${group.map(i => i.content).join('; ')}`,
                    confidence: group.reduce((sum, i) => sum + i.confidence, 0) / group.length,
                    applicability: [...new Set(group.flatMap(i => i.applicability))]
                };
                synthesized.push(mergedInsight);
            }
            else {
                synthesized.push(group[0]);
            }
        }
        return synthesized;
    }
    generateSynthesizedRecommendations(insights, insightsByPersona) {
        const recommendations = [];
        for (const insight of insights) {
            if (insight.type === 'recommendation') {
                recommendations.push(insight.content);
            }
        }
        for (const [persona, personaInsights] of insightsByPersona) {
            if (personaInsights.length > 0) {
                recommendations.push(`Consider ${persona} perspective: ${personaInsights[0].content}`);
            }
        }
        return [...new Set(recommendations)];
    }
    calculateInsightQualityMetrics(insights) {
        return {
            totalInsights: insights.length,
            averageConfidence: insights.length > 0
                ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
                : 0,
            insightTypes: [...new Set(insights.map(i => i.type))].length,
            personaContributions: [...new Set(insights.map(i => i.persona))].length,
            applicabilityScore: insights.reduce((sum, i) => sum + i.applicability.length, 0) / insights.length
        };
    }
    determineNextPersona(previousResults) {
        return null;
    }
    async getPersonaPriorities(persona) {
        const personaImpl = this.personas.get(persona);
        return personaImpl?.priorityHierarchy || [];
    }
    async generateHandoffRecommendations(fromPersona, toPersona, insights) {
        const recommendations = [];
        if (fromPersona === 'analyzer' && toPersona === 'architect') {
            recommendations.push('Consider architectural implications of analysis findings');
        }
        if (fromPersona === 'architect' && toPersona === 'frontend') {
            recommendations.push('Implement user-facing components following architectural patterns');
        }
        for (const insight of insights) {
            if (insight.type === 'recommendation') {
                recommendations.push(`From ${fromPersona}: ${insight.content}`);
            }
        }
        return recommendations;
    }
    capturePersonaState(persona, context, insights) {
        return {
            persona,
            context: {
                domain: context.domain,
                complexity: context.complexity,
                userIntent: context.userIntent
            },
            insights: insights.map(i => ({
                type: i.type,
                content: i.content,
                confidence: i.confidence
            })),
            timestamp: new Date()
        };
    }
    cleanupChainExecution(chainId) {
        this.activeChains.delete(chainId);
        setTimeout(() => {
            this.contextPreservation.delete(chainId);
        }, 300000);
    }
}
//# sourceMappingURL=ChainModeHandler.js.map