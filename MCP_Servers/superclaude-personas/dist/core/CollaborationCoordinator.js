export class CollaborationCoordinator {
    expertiseRegistry;
    personas;
    logger;
    performanceMonitor;
    collaborationPatterns = [
        {
            name: "frontend_performance",
            personas: ["frontend", "performance"],
            sequenceType: "parallel",
            handoffCriteria: [{
                    trigger: "performance_issue",
                    fromPersona: "frontend",
                    toPersona: "performance",
                    contextRequirements: ["metrics", "user_experience"],
                    validationRules: ["performance_budgets", "user_impact"]
                }],
            contextMergeStrategy: "synthesize"
        },
        {
            name: "security_backend",
            personas: ["security", "backend"],
            sequenceType: "hierarchical",
            handoffCriteria: [{
                    trigger: "security_concern",
                    fromPersona: "security",
                    toPersona: "backend",
                    contextRequirements: ["threat_assessment", "compliance"],
                    validationRules: ["security_standards", "data_protection"]
                }],
            contextMergeStrategy: "prioritize"
        },
        {
            name: "architect_analyzer",
            personas: ["architect", "analyzer"],
            sequenceType: "sequential",
            handoffCriteria: [{
                    trigger: "system_analysis",
                    fromPersona: "analyzer",
                    toPersona: "architect",
                    contextRequirements: ["root_cause", "system_state"],
                    validationRules: ["architectural_impact", "scalability"]
                }],
            contextMergeStrategy: "accumulate"
        }
    ];
    constructor(personas, logger, performanceMonitor) {
        this.personas = personas;
        this.logger = logger;
        this.performanceMonitor = performanceMonitor;
        this.expertiseRegistry = {
            contributions: new Map(),
            sharingLog: [],
            compatibilityMatrix: new Map()
        };
        this.initializeCompatibilityMatrix();
    }
    async coordinatePersonas(personas, operation, coordinationMode) {
        const startTime = Date.now();
        try {
            this.logger.info(`Coordinating ${personas.length} personas in ${coordinationMode} mode`);
            const pattern = this.findCollaborationPattern(personas, coordinationMode);
            let results = [];
            let conflictResolutions = [];
            let synthesis = null;
            switch (coordinationMode) {
                case "parallel":
                    results = await this.coordinateParallelPersonas(personas, operation, pattern);
                    break;
                case "sequential":
                    results = await this.coordinateSequentialPersonas(personas, operation, pattern);
                    break;
                case "hierarchical":
                    results = await this.coordinateHierarchicalPersonas(personas, operation, pattern);
                    break;
            }
            await this.facilitateExpertiseSharing(personas, results);
            const conflicts = this.identifyPriorityConflicts(results);
            if (conflicts.length > 0) {
                conflictResolutions = await this.resolvePriorityConflicts(conflicts);
            }
            synthesis = await this.synthesizePersonaResults(results, conflictResolutions);
            const executionTime = Date.now() - startTime;
            this.performanceMonitor.recordMetric('collaboration_coordination_time', executionTime);
            return {
                mode: coordinationMode,
                results,
                expertiseSharing: this.getExpertiseSharingLog(),
                conflictResolutions,
                synthesis,
                metadata: {
                    executionTime,
                    conflictCount: conflicts.length
                }
            };
        }
        catch (error) {
            this.logger.error('Persona coordination failed:', error);
            throw error;
        }
    }
    async shareExpertise(fromPersona, toPersona, expertise) {
        try {
            this.logger.debug(`Sharing expertise from ${fromPersona} to ${toPersona}`);
            const fromImpl = this.personas.get(fromPersona);
            const toImpl = this.personas.get(toPersona);
            if (!fromImpl || !toImpl) {
                return {
                    success: false,
                    reason: "Invalid persona specified"
                };
            }
            const compatibility = await this.checkExpertiseCompatibility(fromPersona, toPersona, expertise);
            if (!compatibility.isCompatible) {
                return {
                    success: false,
                    reason: "Expertise incompatible with target persona",
                    compatibility
                };
            }
            const translatedExpertise = await this.translateExpertise(expertise, fromPersona, toPersona);
            const applicationResult = await toImpl.receiveExpertise(translatedExpertise, fromPersona);
            this.logExpertiseSharing({
                from: fromPersona,
                to: toPersona,
                expertise: translatedExpertise,
                timestamp: new Date(),
                success: true
            });
            this.updateExpertiseRegistry(fromPersona, toPersona, translatedExpertise);
            return {
                success: true,
                translatedExpertise,
                applicationResult,
                compatibility
            };
        }
        catch (error) {
            this.logger.error('Expertise sharing failed:', error);
            return {
                success: false,
                reason: error.message || 'Unknown error occurred'
            };
        }
    }
    async resolvePriorityConflicts(conflicts) {
        const resolutions = [];
        for (const conflict of conflicts) {
            try {
                const resolution = await this.resolveSingleConflict(conflict);
                resolutions.push(resolution.resolution);
                this.logger.info(`Resolved conflict ${conflict.conflictId}`, {
                    satisfaction: resolution.satisfactionScore,
                    participants: conflict.participants
                });
            }
            catch (error) {
                this.logger.error(`Failed to resolve conflict ${conflict.conflictId}:`, error);
            }
        }
        return resolutions;
    }
    async managePersonaHandoff(fromPersona, toPersona, context, insights) {
        try {
            this.logger.debug(`Managing handoff from ${fromPersona} to ${toPersona}`);
            const handoffPackage = {
                fromPersona,
                toPersona,
                context,
                insights,
                recommendations: await this.generateHandoffRecommendations(fromPersona, toPersona, context),
                priorities: await this.getPersonaPriorities(toPersona),
                state: this.capturePersonaState(fromPersona)
            };
            const validation = await this.validateHandoffReadiness(handoffPackage);
            if (!validation.isReady) {
                throw new Error(`Handoff not ready: ${validation.issues.join(', ')}`);
            }
            await this.executeHandoff(handoffPackage);
            return handoffPackage;
        }
        catch (error) {
            this.logger.error('Persona handoff failed:', error);
            throw error;
        }
    }
    async coordinateParallelPersonas(personas, operation, pattern) {
        this.logger.debug(`Executing parallel coordination for ${personas.length} personas`);
        const results = await Promise.all(personas.map(async (persona) => {
            const personaImpl = this.personas.get(persona);
            if (!personaImpl) {
                throw new Error(`Persona ${persona} not found`);
            }
            try {
                const context = this.buildPersonaContext(persona, operation);
                const result = await personaImpl.applyBehavior(context);
                return {
                    persona,
                    result,
                    timestamp: new Date(),
                    success: true
                };
            }
            catch (error) {
                this.logger.error(`Persona ${persona} failed in parallel execution:`, error);
                return {
                    persona,
                    result: null,
                    timestamp: new Date(),
                    success: false,
                    error: error.message
                };
            }
        }));
        return results;
    }
    async coordinateSequentialPersonas(personas, operation, pattern) {
        this.logger.debug(`Executing sequential coordination for ${personas.length} personas`);
        const results = [];
        let currentContext = this.buildPersonaContext(personas[0], operation);
        for (const persona of personas) {
            const personaImpl = this.personas.get(persona);
            if (!personaImpl) {
                throw new Error(`Persona ${persona} not found`);
            }
            try {
                const result = await personaImpl.applyBehavior(currentContext);
                const personaResult = {
                    persona,
                    result,
                    timestamp: new Date(),
                    success: true
                };
                results.push(personaResult);
                currentContext = this.updateContextForNextPersona(currentContext, personaResult);
            }
            catch (error) {
                this.logger.error(`Persona ${persona} failed in sequential execution:`, error);
                results.push({
                    persona,
                    result: null,
                    timestamp: new Date(),
                    success: false,
                    error: error.message
                });
            }
        }
        return results;
    }
    async coordinateHierarchicalPersonas(personas, operation, pattern) {
        this.logger.debug(`Executing hierarchical coordination for ${personas.length} personas`);
        const sortedPersonas = this.establishHierarchy(personas, operation);
        const results = [];
        let currentDecision = operation;
        for (const persona of sortedPersonas) {
            const personaImpl = this.personas.get(persona);
            if (!personaImpl) {
                throw new Error(`Persona ${persona} not found`);
            }
            try {
                const context = this.buildPersonaContext(persona, currentDecision);
                const result = await personaImpl.applyBehavior(context);
                const personaResult = {
                    persona,
                    result,
                    timestamp: new Date(),
                    success: true,
                    hierarchyLevel: sortedPersonas.indexOf(persona)
                };
                results.push(personaResult);
                currentDecision = this.updateDecisionFromHierarchy(currentDecision, personaResult);
            }
            catch (error) {
                this.logger.error(`Persona ${persona} failed in hierarchical execution:`, error);
                results.push({
                    persona,
                    result: null,
                    timestamp: new Date(),
                    success: false,
                    error: error.message,
                    hierarchyLevel: sortedPersonas.indexOf(persona)
                });
            }
        }
        return results;
    }
    async facilitateExpertiseSharing(personas, results) {
        this.logger.debug('Facilitating expertise sharing between personas');
        const sharingOpportunities = this.identifyExpertiseSharingOpportunities(personas, results);
        for (const opportunity of sharingOpportunities) {
            try {
                await this.shareExpertise(opportunity.fromPersona, opportunity.toPersona, opportunity.expertise);
            }
            catch (error) {
                this.logger.error('Expertise sharing opportunity failed:', error);
            }
        }
    }
    identifyPriorityConflicts(results) {
        const conflicts = [];
        for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
                const conflict = this.detectPriorityConflict(results[i], results[j]);
                if (conflict) {
                    conflicts.push(conflict);
                }
            }
        }
        return conflicts;
    }
    async resolveSingleConflict(conflict) {
        const strategy = this.determineResolutionStrategy(conflict);
        switch (strategy) {
            case 'hierarchy':
                return this.resolveByHierarchy(conflict);
            case 'consensus':
                return this.resolveByConsensus(conflict);
            case 'expertise':
                return this.resolveByExpertise(conflict);
            default:
                return this.resolveByDefault(conflict);
        }
    }
    async synthesizePersonaResults(results, conflictResolutions) {
        this.logger.debug('Synthesizing persona results');
        const synthesis = {
            combinedRecommendations: [],
            mergedInsights: [],
            resolvedConflicts: conflictResolutions.length,
            confidenceScore: 0,
            actionItems: [],
            qualityMetrics: {}
        };
        for (const result of results) {
            if (result.success && result.result) {
                synthesis.combinedRecommendations.push(...(result.result.recommendations || []));
                synthesis.mergedInsights.push(...(result.result.insights || []));
            }
        }
        const successfulResults = results.filter(r => r.success);
        synthesis.confidenceScore = successfulResults.length > 0
            ? successfulResults.reduce((sum, r) => sum + (r.result?.confidence || 0), 0) / successfulResults.length
            : 0;
        synthesis.actionItems = this.generateActionItems(results, conflictResolutions);
        return synthesis;
    }
    findCollaborationPattern(personas, coordinationMode) {
        for (const pattern of this.collaborationPatterns) {
            if (pattern.personas.every(p => personas.includes(p)) &&
                pattern.sequenceType === coordinationMode) {
                return pattern;
            }
        }
        return {
            name: `custom_${personas.join('_')}`,
            personas,
            sequenceType: coordinationMode,
            handoffCriteria: [],
            contextMergeStrategy: "synthesize"
        };
    }
    buildPersonaContext(persona, operation) {
        return {
            domain: operation.type || 'general',
            complexity: 0.5,
            userIntent: operation.description || 'general_operation',
            projectContext: operation.context?.projectContext || {
                projectType: 'unknown',
                framework: 'unknown',
                language: 'unknown',
                environment: 'development',
                phase: 'development',
                constraints: []
            },
            sessionHistory: [],
            qualityRequirements: operation.requirements?.map(req => ({
                category: 'general',
                requirement: req,
                priority: 1,
                validationMethod: 'manual'
            })) || []
        };
    }
    initializeCompatibilityMatrix() {
        const compatibilityData = {
            'architect:analyzer': 0.9,
            'architect:security': 0.8,
            'architect:performance': 0.7,
            'frontend:performance': 0.9,
            'frontend:qa': 0.8,
            'backend:security': 0.9,
            'backend:performance': 0.8,
            'security:devops': 0.8,
            'qa:analyzer': 0.8,
            'mentor:scribe': 0.9,
            'refactorer:architect': 0.7,
            'refactorer:performance': 0.8
        };
        for (const [key, score] of Object.entries(compatibilityData)) {
            this.expertiseRegistry.compatibilityMatrix.set(key, score);
            const [p1, p2] = key.split(':');
            this.expertiseRegistry.compatibilityMatrix.set(`${p2}:${p1}`, score);
        }
    }
    async checkExpertiseCompatibility(fromPersona, toPersona, expertise) {
        const key = `${fromPersona}:${toPersona}`;
        const score = this.expertiseRegistry.compatibilityMatrix.get(key) || 0.5;
        const reasons = [];
        if (score > 0.7) {
            reasons.push('High persona compatibility');
        }
        if (expertise.confidence > 0.8) {
            reasons.push('High expertise confidence');
        }
        return {
            isCompatible: score > 0.6,
            score,
            reasons
        };
    }
    async translateExpertise(expertise, fromPersona, toPersona) {
        const translated = { ...expertise };
        if (toPersona === 'frontend' && fromPersona === 'backend') {
            translated.insights = expertise.insights.map(insight => insight.replace(/server/g, 'client').replace(/database/g, 'component state'));
        }
        return translated;
    }
    logExpertiseSharing(sharingEvent) {
        this.expertiseRegistry.sharingLog.push(sharingEvent);
        if (this.expertiseRegistry.sharingLog.length > 1000) {
            this.expertiseRegistry.sharingLog = this.expertiseRegistry.sharingLog.slice(-1000);
        }
    }
    updateExpertiseRegistry(fromPersona, toPersona, expertise) {
        const key = `${fromPersona}:${toPersona}`;
        if (!this.expertiseRegistry.contributions.has(key)) {
            this.expertiseRegistry.contributions.set(key, []);
        }
        this.expertiseRegistry.contributions.get(key).push(expertise);
    }
    getExpertiseSharingLog() {
        return [...this.expertiseRegistry.sharingLog];
    }
    updateContextForNextPersona(context, result) {
        return {
            ...context,
            sessionHistory: [...context.sessionHistory, {
                    timestamp: new Date(),
                    eventType: 'persona_result',
                    data: result,
                    persona: result.persona
                }]
        };
    }
    establishHierarchy(personas, operation) {
        const hierarchyMap = {
            'security': ['security', 'architect', 'backend', 'devops'],
            'performance': ['performance', 'architect', 'frontend', 'backend'],
            'analysis': ['analyzer', 'architect', 'security', 'performance'],
            'design': ['architect', 'frontend', 'backend', 'performance']
        };
        const hierarchy = hierarchyMap[operation.type] || personas;
        return personas.sort((a, b) => {
            const aIndex = hierarchy.indexOf(a);
            const bIndex = hierarchy.indexOf(b);
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
    }
    updateDecisionFromHierarchy(decision, result) {
        return {
            ...decision,
            context: {
                ...decision.context,
                hierarchicalInput: result
            }
        };
    }
    identifyExpertiseSharingOpportunities(personas, results) {
        const opportunities = [];
        for (const result of results) {
            if (result.success && result.result?.insights) {
                const fromPersona = result.persona;
                for (const otherPersona of personas) {
                    if (otherPersona !== fromPersona) {
                        const compatibility = this.expertiseRegistry.compatibilityMatrix.get(`${fromPersona}:${otherPersona}`);
                        if (compatibility && compatibility > 0.7) {
                            opportunities.push({
                                fromPersona,
                                toPersona: otherPersona,
                                expertise: {
                                    fromPersona,
                                    domain: result.result.domain || 'general',
                                    insights: result.result.insights,
                                    recommendations: result.result.recommendations || [],
                                    confidence: result.result.confidence || 0.5,
                                    timestamp: new Date()
                                }
                            });
                        }
                    }
                }
            }
        }
        return opportunities;
    }
    detectPriorityConflict(result1, result2) {
        if (!result1.success || !result2.success) {
            return null;
        }
        const conflictingRecommendations = this.findConflictingRecommendations(result1.result?.recommendations || [], result2.result?.recommendations || []);
        if (conflictingRecommendations.length > 0) {
            return {
                conflictId: `conflict_${Date.now()}`,
                participants: [result1.persona, result2.persona],
                conflictType: 'recommendation_conflict',
                options: conflictingRecommendations,
                priorities: {
                    [result1.persona]: result1.result?.priorities || [],
                    [result2.persona]: result2.result?.priorities || []
                },
                context: { result1, result2 }
            };
        }
        return null;
    }
    findConflictingRecommendations(rec1, rec2) {
        const conflicts = [];
        for (let i = 0; i < rec1.length; i++) {
            for (let j = 0; j < rec2.length; j++) {
                if (this.areRecommendationsConflicting(rec1[i], rec2[j])) {
                    conflicts.push({
                        id: `option_${i}_${j}`,
                        description: `${rec1[i]} vs ${rec2[j]}`,
                        pros: [rec1[i]],
                        cons: [rec2[j]],
                        riskLevel: 0.5,
                        implementationComplexity: 0.5
                    });
                }
            }
        }
        return conflicts;
    }
    areRecommendationsConflicting(rec1, rec2) {
        const conflictPatterns = [
            ['synchronous', 'asynchronous'],
            ['monolithic', 'microservices'],
            ['sql', 'nosql'],
            ['cache', 'no-cache']
        ];
        for (const [pattern1, pattern2] of conflictPatterns) {
            if (rec1.toLowerCase().includes(pattern1) && rec2.toLowerCase().includes(pattern2)) {
                return true;
            }
        }
        return false;
    }
    determineResolutionStrategy(conflict) {
        if (conflict.participants.includes('security')) {
            return 'hierarchy';
        }
        if (conflict.participants.includes('architect')) {
            return 'expertise';
        }
        return 'consensus';
    }
    async resolveByHierarchy(conflict) {
        const hierarchy = ['security', 'architect', 'analyzer', 'performance', 'backend', 'frontend', 'qa', 'devops', 'refactorer', 'mentor', 'scribe'];
        const topPersona = conflict.participants.sort((a, b) => {
            const aIndex = hierarchy.indexOf(a);
            const bIndex = hierarchy.indexOf(b);
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        })[0];
        return {
            conflictId: conflict.conflictId,
            resolution: {
                conflictType: conflict.conflictType,
                participantPersonas: conflict.participants,
                resolution: `Resolved by ${topPersona} hierarchy`,
                reasoning: `${topPersona} has priority in this domain`,
                timestamp: new Date()
            },
            satisfactionScore: 0.7,
            reasoning: `Hierarchy-based resolution favoring ${topPersona}`
        };
    }
    async resolveByConsensus(conflict) {
        return {
            conflictId: conflict.conflictId,
            resolution: {
                conflictType: conflict.conflictType,
                participantPersonas: conflict.participants,
                resolution: 'Consensus-based compromise',
                reasoning: 'Balanced approach considering all perspectives',
                timestamp: new Date()
            },
            satisfactionScore: 0.8,
            reasoning: 'Consensus-based resolution balancing all viewpoints'
        };
    }
    async resolveByExpertise(conflict) {
        return {
            conflictId: conflict.conflictId,
            resolution: {
                conflictType: conflict.conflictType,
                participantPersonas: conflict.participants,
                resolution: 'Expertise-based decision',
                reasoning: 'Resolution based on domain expertise',
                timestamp: new Date()
            },
            satisfactionScore: 0.9,
            reasoning: 'Expertise-based resolution leveraging domain knowledge'
        };
    }
    async resolveByDefault(conflict) {
        return {
            conflictId: conflict.conflictId,
            resolution: {
                conflictType: conflict.conflictType,
                participantPersonas: conflict.participants,
                resolution: 'Default resolution',
                reasoning: 'No specific resolution strategy applied',
                timestamp: new Date()
            },
            satisfactionScore: 0.5,
            reasoning: 'Default resolution strategy'
        };
    }
    generateActionItems(results, conflictResolutions) {
        const actionItems = [];
        for (const result of results) {
            if (result.success && result.result?.recommendations) {
                actionItems.push(...result.result.recommendations);
            }
        }
        for (const resolution of conflictResolutions) {
            actionItems.push(`Implement resolution: ${resolution.resolution}`);
        }
        return [...new Set(actionItems)];
    }
    async generateHandoffRecommendations(fromPersona, toPersona, context) {
        const recommendations = [];
        if (fromPersona === 'analyzer' && toPersona === 'architect') {
            recommendations.push('Consider architectural implications of analysis findings');
            recommendations.push('Evaluate long-term maintainability of proposed solutions');
        }
        if (fromPersona === 'architect' && toPersona === 'frontend') {
            recommendations.push('Implement user-facing components following architectural patterns');
            recommendations.push('Ensure accessibility and performance requirements are met');
        }
        return recommendations;
    }
    async getPersonaPriorities(persona) {
        const personaImpl = this.personas.get(persona);
        return personaImpl?.priorityHierarchy || [];
    }
    capturePersonaState(persona) {
        return {
            persona,
            timestamp: new Date(),
            context: 'handoff_preparation'
        };
    }
    async validateHandoffReadiness(handoffPackage) {
        const issues = [];
        if (!handoffPackage.context) {
            issues.push('Missing context for handoff');
        }
        if (!handoffPackage.insights || handoffPackage.insights.length === 0) {
            issues.push('No insights available for handoff');
        }
        return {
            isReady: issues.length === 0,
            issues
        };
    }
    async executeHandoff(handoffPackage) {
        this.logger.info(`Executing handoff from ${handoffPackage.fromPersona} to ${handoffPackage.toPersona}`);
        this.performanceMonitor.recordMetric('persona_handoff', 1);
    }
}
//# sourceMappingURL=CollaborationCoordinator.js.map