import { BaseHook } from '../core/BaseHook.js';
import { HookType } from '../types/index.js';
export class PrePromptHook extends BaseHook {
    constructor() {
        super(HookType.PrePrompt);
    }
    async execute(context) {
        const timer = performance.now();
        try {
            const personaAnalysis = await this.analyzePersonaNeeds(context);
            const enhancedContext = await this.enhanceContextForPersona(context, personaAnalysis);
            const optimizations = await this.applyPromptOptimizations(enhancedContext);
            const preservationStrategy = await this.prepareContextPreservation(context);
            const executionTime = performance.now() - timer;
            const result = this.createSuccessResult({
                personaAnalysis,
                enhancedContext,
                optimizations,
                preservationStrategy,
                serverTarget: this.targetServer,
                promptComplexity: this.calculatePromptComplexity(context)
            }, {
                executionTime,
                optimizationFactor: 4.66
            }, {
                cacheable: true,
                ttl: this.calculateOptimalTTL(context)
            });
            await this.cacheResult(context, result);
            return result;
        }
        catch (error) {
            const executionTime = performance.now() - timer;
            return this.createErrorResult(error, executionTime);
        }
    }
    async analyzePersonaNeeds(context) {
        const operation = context.operation.toLowerCase();
        const parameters = context.parameters || {};
        const personaIndicators = {
            architect: ['architecture', 'design', 'system', 'scalability'],
            frontend: ['ui', 'component', 'responsive', 'accessibility'],
            backend: ['api', 'database', 'server', 'performance'],
            security: ['security', 'vulnerability', 'audit', 'compliance'],
            analyzer: ['analyze', 'investigate', 'debug', 'troubleshoot'],
            qa: ['test', 'quality', 'validation', 'verification']
        };
        const suggestedPersonas = [];
        const confidence = {};
        for (const [persona, indicators] of Object.entries(personaIndicators)) {
            const matches = indicators.filter(indicator => operation.includes(indicator) ||
                JSON.stringify(parameters).toLowerCase().includes(indicator));
            if (matches.length > 0) {
                suggestedPersonas.push(persona);
                confidence[persona] = matches.length / indicators.length;
            }
        }
        return {
            suggestedPersonas,
            confidence,
            primaryPersona: suggestedPersonas[0] || 'default',
            contextComplexity: this.calculatePromptComplexity(context)
        };
    }
    async enhanceContextForPersona(context, personaAnalysis) {
        const enhancements = {
            priorityAdjustments: {},
            additionalContext: {},
            optimizationHints: ['default']
        };
        const primaryPersona = personaAnalysis.primaryPersona;
        switch (primaryPersona) {
            case 'architect':
                enhancements.priorityAdjustments = {
                    'Long-term maintainability': 'high',
                    'Scalability': 'high',
                    'System design': 'high'
                };
                enhancements.additionalContext = {
                    systemPerspective: true,
                    architecturalPatterns: true
                };
                break;
            case 'frontend':
                enhancements.priorityAdjustments = {
                    'User experience': 'high',
                    'Accessibility': 'high',
                    'Performance': 'high'
                };
                enhancements.additionalContext = {
                    userFocused: true,
                    performanceMetrics: true
                };
                break;
            case 'security':
                enhancements.priorityAdjustments = {
                    'Security': 'critical',
                    'Compliance': 'high',
                    'Risk assessment': 'high'
                };
                enhancements.additionalContext = {
                    securityFirst: true,
                    threatModel: true
                };
                break;
            default:
                enhancements.optimizationHints = ['general_optimization'];
        }
        return enhancements;
    }
    async applyPromptOptimizations(enhancedContext) {
        const optimizations = {
            contextCompression: false,
            priorityReordering: false,
            redundancyRemoval: false,
            focusEnhancement: false
        };
        const contextSize = JSON.stringify(enhancedContext).length;
        if (contextSize > 5000) {
            optimizations.contextCompression = true;
            optimizations.redundancyRemoval = true;
        }
        if (enhancedContext.priorityAdjustments) {
            optimizations.priorityReordering = true;
        }
        optimizations.focusEnhancement = true;
        return optimizations;
    }
    async prepareContextPreservation(context) {
        return {
            preservePersonaState: true,
            preserveOptimizations: true,
            sessionCaching: true,
            contextKey: `session_${context.sessionId}_${Date.now()}`
        };
    }
    calculatePromptComplexity(context) {
        let complexity = this.calculateComplexity(context);
        const operation = context.operation.toLowerCase();
        const parameters = context.parameters || {};
        if (operation.includes('multi') || operation.includes('chain')) {
            complexity += 0.3;
        }
        if (operation.includes('creative') || operation.includes('generate')) {
            complexity += 0.2;
        }
        const paramCount = Object.keys(parameters).length;
        complexity += Math.min(paramCount / 20, 0.2);
        return Math.min(complexity, 1.0);
    }
    calculateOptimalTTL(context) {
        const basePersonaTTL = 1800;
        const operation = context.operation.toLowerCase();
        if (operation.includes('session')) {
            return basePersonaTTL / 2;
        }
        if (operation.includes('creative')) {
            return basePersonaTTL / 3;
        }
        return basePersonaTTL;
    }
}
export class PostPromptHook extends BaseHook {
    constructor() {
        super(HookType.PostPrompt);
    }
    async execute(context) {
        const timer = performance.now();
        try {
            const responseAnalysis = await this.analyzeResponseQuality(context);
            const optimizedResponse = await this.optimizeResponseForPersona(context, responseAnalysis);
            await this.updatePersonaLearning(context, responseAnalysis);
            const cachingStrategy = await this.prepareCachingStrategy(context, optimizedResponse);
            const executionTime = performance.now() - timer;
            const result = this.createSuccessResult({
                responseAnalysis,
                optimizedResponse,
                personaLearningUpdated: true,
                cachingStrategy,
                serverTarget: this.targetServer,
                responseQualityScore: responseAnalysis.qualityScore
            }, {
                executionTime,
                optimizationFactor: 4.66
            }, {
                cacheable: optimizedResponse.cacheable,
                ttl: cachingStrategy.ttl
            });
            return result;
        }
        catch (error) {
            const executionTime = performance.now() - timer;
            return this.createErrorResult(error, executionTime);
        }
    }
    async analyzeResponseQuality(context) {
        const response = context.data;
        if (!response) {
            return {
                qualityScore: 0.0,
                issues: ['No response data provided'],
                recommendations: ['Generate valid response']
            };
        }
        const analysis = {
            qualityScore: 0.0,
            completeness: 0.0,
            relevance: 0.0,
            clarity: 0.0,
            personaAlignment: 0.0,
            issues: [],
            recommendations: []
        };
        analysis.completeness = this.assessCompleteness(response);
        analysis.relevance = this.assessRelevance(response, context);
        analysis.clarity = this.assessClarity(response);
        analysis.personaAlignment = this.assessPersonaAlignment(response, context);
        analysis.qualityScore = (analysis.completeness * 0.3 +
            analysis.relevance * 0.3 +
            analysis.clarity * 0.2 +
            analysis.personaAlignment * 0.2);
        if (analysis.qualityScore < 0.7) {
            analysis.issues.push('Response quality below threshold');
            analysis.recommendations.push('Review and enhance response');
        }
        return analysis;
    }
    async optimizeResponseForPersona(context, analysis) {
        const optimizations = {
            applied: [],
            cacheable: true,
            personaSpecific: true
        };
        if (analysis.clarity < 0.8) {
            optimizations.applied.push('clarity_enhancement');
        }
        if (analysis.personaAlignment < 0.8) {
            optimizations.applied.push('persona_alignment');
        }
        if (analysis.completeness < 0.8) {
            optimizations.applied.push('completeness_improvement');
        }
        const operation = context.operation.toLowerCase();
        if (operation.includes('architect')) {
            optimizations.applied.push('system_perspective');
        }
        else if (operation.includes('frontend')) {
            optimizations.applied.push('user_focus');
        }
        else if (operation.includes('security')) {
            optimizations.applied.push('security_emphasis');
        }
        return optimizations;
    }
    async updatePersonaLearning(context, analysis) {
        const learningUpdate = {
            sessionId: context.sessionId,
            qualityScore: analysis.qualityScore,
            personaEffectiveness: analysis.personaAlignment,
            timestamp: Date.now()
        };
        console.log(`Persona learning updated:`, learningUpdate);
    }
    async prepareCachingStrategy(context, optimizedResponse) {
        const strategy = {
            ttl: 1800,
            cacheable: optimizedResponse.cacheable,
            cacheKey: this.generateResponseCacheKey(context),
            invalidationTriggers: []
        };
        const operation = context.operation.toLowerCase();
        if (operation.includes('creative')) {
            strategy.ttl = 600;
        }
        else if (operation.includes('analysis')) {
            strategy.ttl = 3600;
        }
        if (context.parameters?.version) {
            strategy.invalidationTriggers.push('version_change');
        }
        return strategy;
    }
    assessCompleteness(response) {
        if (!response)
            return 0.0;
        const responseString = JSON.stringify(response);
        const length = responseString.length;
        if (length < 100)
            return 0.3;
        if (length < 500)
            return 0.6;
        if (length < 1000)
            return 0.8;
        return 1.0;
    }
    assessRelevance(response, context) {
        if (!response || !context.operation)
            return 0.5;
        const responseString = JSON.stringify(response).toLowerCase();
        const operation = context.operation.toLowerCase();
        const operationWords = operation.split(/\s+/);
        const relevantWords = operationWords.filter(word => responseString.includes(word));
        return Math.min(relevantWords.length / operationWords.length, 1.0);
    }
    assessClarity(response) {
        if (!response)
            return 0.0;
        const hasStructure = typeof response === 'object' && response !== null;
        const hasDescription = response.description || response.content;
        const hasOrganization = response.sections || response.steps || response.items;
        let clarityScore = 0.5;
        if (hasStructure)
            clarityScore += 0.2;
        if (hasDescription)
            clarityScore += 0.2;
        if (hasOrganization)
            clarityScore += 0.1;
        return Math.min(clarityScore, 1.0);
    }
    assessPersonaAlignment(response, context) {
        if (!response)
            return 0.0;
        const operation = context.operation.toLowerCase();
        const responseString = JSON.stringify(response).toLowerCase();
        if (operation.includes('architect')) {
            const architectTerms = ['system', 'design', 'scalability', 'architecture'];
            const matches = architectTerms.filter(term => responseString.includes(term));
            return matches.length / architectTerms.length;
        }
        if (operation.includes('security')) {
            const securityTerms = ['security', 'vulnerability', 'risk', 'compliance'];
            const matches = securityTerms.filter(term => responseString.includes(term));
            return matches.length / securityTerms.length;
        }
        return 0.8;
    }
    generateResponseCacheKey(context) {
        return `response_${context.sessionId}_${context.operation}_${Date.now()}`;
    }
}
//# sourceMappingURL=PromptHooks.js.map