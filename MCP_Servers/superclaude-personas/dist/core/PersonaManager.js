export class PersonaManager {
    personas = new Map();
    activationEngine;
    collaborationCoordinator;
    chainModeHandler;
    logger;
    performanceMonitor;
    cache;
    personaState = {
        activePersona: null,
        personaStack: [],
        collaborationContext: {
            activeCollaboration: null,
            participants: [],
            mode: "parallel",
            sharedExpertise: [],
            conflictResolutions: []
        },
        decisionHistory: [],
        performanceMetrics: {
            activationCount: 0,
            averageActivationTime: 0,
            decisionAccuracy: 0,
            collaborationSuccess: 0,
            performanceScore: 0,
            userSatisfaction: 0
        }
    };
    constructor(personas, activationEngine, collaborationCoordinator, chainModeHandler, logger, performanceMonitor, cache) {
        this.personas = personas;
        this.activationEngine = activationEngine;
        this.collaborationCoordinator = collaborationCoordinator;
        this.chainModeHandler = chainModeHandler;
        this.logger = logger;
        this.performanceMonitor = performanceMonitor;
        this.cache = cache;
        this.logger.info('PersonaManager initialized with personas:', Array.from(personas.keys()));
    }
    async activatePersona(persona, context, options = {}) {
        const startTime = Date.now();
        try {
            const personaImpl = this.personas.get(persona);
            if (!personaImpl) {
                throw new Error(`Unknown persona: ${persona}`);
            }
            this.logger.debug(`Activating persona: ${persona}`, { context, options });
            if (this.personaState.activePersona === persona && !options.forceActivation) {
                this.logger.debug(`Persona ${persona} already active, returning cached result`);
                return await this.getCachedActivationResult(persona, context);
            }
            const behaviorResult = await personaImpl.applyBehavior(context);
            if (!options.preserveStack) {
                this.personaState.personaStack = [];
            }
            const stackEntry = {
                persona,
                activatedAt: new Date(),
                context,
                expertise: [],
                handoffPreparation: null
            };
            this.personaState.activePersona = persona;
            this.personaState.personaStack.push(stackEntry);
            const activationTime = Date.now() - startTime;
            this.updatePerformanceMetrics(activationTime);
            const result = {
                success: true,
                persona,
                behaviorTransformations: behaviorResult.transformations,
                mcpPreferences: personaImpl.mcpPreferences,
                qualityStandards: personaImpl.qualityStandards,
                metadata: {
                    activationTime,
                    confidenceScore: behaviorResult.confidence
                }
            };
            this.cache.set(`activation:${persona}:${this.hashContext(context)}`, result, 300);
            this.logger.info(`Persona ${persona} activated successfully`, {
                activationTime,
                confidence: behaviorResult.confidence
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to activate persona ${persona}:`, error);
            throw error;
        }
    }
    async getPersonaRecommendation(context, options = {}) {
        try {
            this.logger.debug('Getting persona recommendation', { context, options });
            const cacheKey = `recommendation:${this.hashContext(context)}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached recommendation');
                return cached;
            }
            const analysis = await this.activationEngine.analyzeContext(context);
            const scores = await this.activationEngine.calculatePersonaScores(context);
            const recommendations = scores
                .filter(score => !options.excludePersonas?.includes(score.persona))
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, options.maxRecommendations || 3)
                .map(score => ({
                persona: score.persona,
                confidence: score.confidence,
                reasoning: this.generateRecommendationReasoning(score, analysis),
                expectedBehaviors: this.getExpectedBehaviors(score.persona),
                breakdown: options.includeConfidenceBreakdown ? score.breakdown : undefined
            }));
            this.cache.set(cacheKey, recommendations, 180);
            this.logger.info('Generated persona recommendations', {
                count: recommendations.length,
                topPersona: recommendations[0]?.persona
            });
            return recommendations;
        }
        catch (error) {
            this.logger.error('Failed to generate persona recommendation:', error);
            throw error;
        }
    }
    async coordinateMultiPersona(personas, operation, coordinationMode = "parallel") {
        try {
            this.logger.info(`Coordinating ${personas.length} personas in ${coordinationMode} mode`);
            this.personaState.collaborationContext = {
                activeCollaboration: `coordination-${Date.now()}`,
                participants: personas,
                mode: coordinationMode,
                sharedExpertise: [],
                conflictResolutions: []
            };
            const result = await this.collaborationCoordinator.coordinatePersonas(personas, operation, coordinationMode);
            this.logger.info('Multi-persona coordination completed', {
                mode: coordinationMode,
                conflicts: result.conflictResolutions.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Multi-persona coordination failed:', error);
            throw error;
        }
    }
    async executeChainMode(steps, context) {
        try {
            this.logger.info(`Executing chain mode with ${steps.length} steps`);
            this.personaState.collaborationContext = {
                activeCollaboration: context.chainId,
                participants: steps.map(step => step.persona),
                mode: "sequential",
                sharedExpertise: [],
                conflictResolutions: []
            };
            const results = await this.chainModeHandler.executeChain(steps, context);
            this.logger.info('Chain mode execution completed', {
                chainId: context.chainId,
                steps: steps.length
            });
            return results;
        }
        catch (error) {
            this.logger.error('Chain mode execution failed:', error);
            throw error;
        }
    }
    getPersonaState() {
        return { ...this.personaState };
    }
    getActivePersona() {
        return this.personaState.activePersona;
    }
    getPersonaStack() {
        return [...this.personaState.personaStack];
    }
    clearPersonaStack() {
        this.personaState.personaStack = [];
        this.personaState.activePersona = null;
        this.logger.debug('Persona stack cleared');
    }
    getPersona(name) {
        return this.personas.get(name);
    }
    getAllPersonas() {
        return Array.from(this.personas.keys());
    }
    async shareExpertise(fromPersona, toPersona, expertise) {
        try {
            const result = await this.collaborationCoordinator.shareExpertise(fromPersona, toPersona, expertise);
            this.personaState.collaborationContext.sharedExpertise.push(expertise);
            this.logger.info(`Expertise shared from ${fromPersona} to ${toPersona}`);
            return result.success;
        }
        catch (error) {
            this.logger.error('Expertise sharing failed:', error);
            return false;
        }
    }
    async getPersonaPriorities(persona, context) {
        const personaImpl = this.personas.get(persona);
        if (!personaImpl) {
            throw new Error(`Unknown persona: ${persona}`);
        }
        const priorities = personaImpl.priorityHierarchy;
        if (context && personaImpl.applyContextToPriorities) {
            return await personaImpl.applyContextToPriorities(priorities, context);
        }
        return priorities;
    }
    recordDecision(decision) {
        this.personaState.decisionHistory.push(decision);
        if (this.personaState.decisionHistory.length > 100) {
            this.personaState.decisionHistory = this.personaState.decisionHistory.slice(-100);
        }
        this.logger.debug('Persona decision recorded', {
            persona: decision.persona,
            type: decision.decisionType
        });
    }
    getDecisionHistory(persona) {
        if (persona) {
            return this.personaState.decisionHistory.filter(d => d.persona === persona);
        }
        return [...this.personaState.decisionHistory];
    }
    async getCachedActivationResult(persona, context) {
        const cacheKey = `activation:${persona}:${this.hashContext(context)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const personaImpl = this.personas.get(persona);
        const behaviorResult = await personaImpl.applyBehavior(context);
        return {
            success: true,
            persona,
            behaviorTransformations: behaviorResult.transformations,
            mcpPreferences: personaImpl.mcpPreferences,
            qualityStandards: personaImpl.qualityStandards,
            metadata: {
                activationTime: 0,
                confidenceScore: behaviorResult.confidence
            }
        };
    }
    updatePerformanceMetrics(activationTime) {
        const metrics = this.personaState.performanceMetrics;
        metrics.activationCount++;
        metrics.averageActivationTime =
            (metrics.averageActivationTime * (metrics.activationCount - 1) + activationTime) /
                metrics.activationCount;
        this.performanceMonitor.recordMetric('persona_activation_time', activationTime);
    }
    generateRecommendationReasoning(score, analysis) {
        return `Recommended based on ${(score.confidence * 100).toFixed(1)}% confidence. ` +
            `Strong match for ${analysis.primaryDomain} domain with complexity ${analysis.complexity}.`;
    }
    getExpectedBehaviors(persona) {
        const personaImpl = this.personas.get(persona);
        if (!personaImpl)
            return [];
        return personaImpl.coreStrategies.map(strategy => `${strategy.domain}: ${strategy.approach}`);
    }
    hashContext(context) {
        return Buffer.from(JSON.stringify(context)).toString('base64').substring(0, 16);
    }
}
//# sourceMappingURL=PersonaManager.js.map