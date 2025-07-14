#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { PersonaManager } from './core/PersonaManager.js';
import { ActivationEngine } from './core/ActivationEngine.js';
import { CollaborationCoordinator } from './core/CollaborationCoordinator.js';
import { ChainModeHandler } from './core/ChainModeHandler.js';
import { Logger } from './utils/Logger.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { CacheManager } from './utils/CacheManager.js';
import { personaRegistry } from './personas/PersonaRegistry.js';
import { tools, schemas } from './tools/index.js';
const config = {
    serverName: 'superclaude-personas',
    capabilities: ['tools', 'resources', 'prompts'],
    personas: {
        enableAutoActivation: true,
        enableMultiPersonaMode: true,
        enableChainMode: true,
        maxConcurrentPersonas: 3,
        contextPreservationThreshold: 0.95
    },
    collaboration: {
        enableExpertiseSharing: true,
        enablePriorityResolution: true,
        conflictResolutionStrategy: 'hierarchy_based',
        handoffProtocol: 'context_enriched'
    },
    performance: {
        maxActivationTime: 50,
        cachePersonaDecisions: true,
        cacheTTL: 300,
        enableBatchActivation: true
    },
    integration: {
        enableHookEnrichment: true,
        enableOrchestratorChains: true,
        enableRouterFeedback: true,
        enableQualityValidation: true
    }
};
class SuperClaudePersonasServer {
    server;
    logger;
    performanceMonitor;
    cache;
    personaManager;
    activationEngine;
    collaborationCoordinator;
    chainModeHandler;
    constructor() {
        this.server = new Server({
            name: config.serverName,
            version: '1.0.0',
            description: 'SuperClaude Personas - Behavioral Intelligence Engine for MCP ecosystem'
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            }
        });
        this.logger = new Logger('SuperClaudePersonasServer');
        this.performanceMonitor = new PerformanceMonitor(this.logger);
        this.cache = new CacheManager(this.logger);
        this.activationEngine = new ActivationEngine(this.logger, this.cache);
        this.collaborationCoordinator = new CollaborationCoordinator(personaRegistry.getAllPersonas(), this.logger, this.performanceMonitor);
        this.chainModeHandler = new ChainModeHandler(personaRegistry.getAllPersonas(), this.logger, this.performanceMonitor, this.collaborationCoordinator);
        this.personaManager = new PersonaManager(personaRegistry.getAllPersonas(), this.activationEngine, this.collaborationCoordinator, this.chainModeHandler, this.logger, this.performanceMonitor, this.cache);
        this.setupHandlers();
        this.logger.info('SuperClaude Personas server initialized', {
            personas: personaRegistry.getPersonaNames(),
            implemented: personaRegistry.getImplementedPersonas(),
            placeholders: personaRegistry.getPlaceholderPersonas()
        });
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.logger.debug('Listing available tools');
            return { tools };
        });
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            this.logger.debug('Listing available resources');
            return {
                resources: [
                    {
                        uri: 'personas://definitions',
                        name: 'Persona Definitions',
                        description: 'Complete definitions of all 11 SuperClaude personas',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'personas://collaboration-patterns',
                        name: 'Collaboration Patterns',
                        description: 'Cross-persona collaboration patterns and protocols',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'personas://activation-triggers',
                        name: 'Activation Triggers',
                        description: 'Auto-activation triggers and confidence scoring rules',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'personas://performance-metrics',
                        name: 'Performance Metrics',
                        description: 'Server performance metrics and statistics',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            this.logger.debug('Reading resource', { uri });
            switch (uri) {
                case 'personas://definitions':
                    return {
                        contents: [{
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(personaRegistry.getPersonaDefinitions(), null, 2)
                            }]
                    };
                case 'personas://collaboration-patterns':
                    return {
                        contents: [{
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(this.getCollaborationPatterns(), null, 2)
                            }]
                    };
                case 'personas://activation-triggers':
                    return {
                        contents: [{
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(this.getActivationTriggers(), null, 2)
                            }]
                    };
                case 'personas://performance-metrics':
                    return {
                        contents: [{
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(this.performanceMonitor.exportMetrics(), null, 2)
                            }]
                    };
                default:
                    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
            }
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const startTime = Date.now();
            try {
                this.logger.debug('Tool call received', { name, args });
                let result;
                switch (name) {
                    case 'activate_persona':
                        result = await this.handleActivatePersona(args);
                        break;
                    case 'get_persona_recommendation':
                        result = await this.handleGetPersonaRecommendation(args);
                        break;
                    case 'apply_persona_behavior':
                        result = await this.handleApplyPersonaBehavior(args);
                        break;
                    case 'coordinate_personas':
                        result = await this.handleCoordinatePersonas(args);
                        break;
                    case 'get_persona_priorities':
                        result = await this.handleGetPersonaPriorities(args);
                        break;
                    case 'share_expertise':
                        result = await this.handleShareExpertise(args);
                        break;
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                const executionTime = Date.now() - startTime;
                this.logger.info('Tool executed successfully', { name, executionTime });
                this.performanceMonitor.recordMetric(`tool_${name}_time`, executionTime);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            catch (error) {
                const executionTime = Date.now() - startTime;
                this.logger.error('Tool execution failed', error, { name, executionTime });
                this.performanceMonitor.recordMetric(`tool_${name}_error`, 1);
                throw error;
            }
        });
    }
    async handleActivatePersona(args) {
        const validated = schemas.ActivatePersonaSchema.parse(args);
        const result = await this.personaManager.activatePersona(validated.persona, validated.context, validated.options);
        this.performanceMonitor.recordPersonaActivation(validated.persona, result.metadata.activationTime, result.metadata.confidenceScore, result.success);
        return result;
    }
    async handleGetPersonaRecommendation(args) {
        const validated = schemas.GetPersonaRecommendationSchema.parse(args);
        const context = {
            content: validated.taskDescription,
            command: 'get_recommendation',
            arguments: [],
            flags: [],
            projectContext: validated.projectContext || {
                projectType: 'unknown',
                framework: 'unknown',
                language: 'unknown',
                environment: 'development',
                phase: 'development',
                constraints: []
            },
            userHistory: validated.userHistory || {
                recentCommands: [],
                personaPreferences: [],
                successfulPatterns: [],
                feedbackHistory: []
            },
            systemState: validated.systemState || {
                performance: {
                    responseTime: 0,
                    throughput: 0,
                    errorRate: 0,
                    cpuUsage: 0,
                    memoryUsage: 0
                },
                resourceUsage: {
                    cpu: 0,
                    memory: 0,
                    disk: 0,
                    network: 0
                },
                errorRate: 0,
                activeConnections: 0
            }
        };
        const recommendations = await this.personaManager.getPersonaRecommendation(context, validated.options);
        return {
            recommendations,
            analysis: {
                detectedDomain: 'general',
                complexityLevel: 0.5,
                suggestedCollaboration: []
            }
        };
    }
    async handleApplyPersonaBehavior(args) {
        const validated = schemas.ApplyPersonaBehaviorSchema.parse(args);
        const persona = personaRegistry.getPersona(validated.persona);
        if (!persona) {
            throw new McpError(ErrorCode.InvalidRequest, `Persona ${validated.persona} not found`);
        }
        const context = validated.context || {
            domain: validated.operation.type || 'general',
            complexity: 0.5,
            userIntent: validated.operation.description,
            projectContext: {
                projectType: 'unknown',
                framework: 'unknown',
                language: 'unknown',
                environment: 'development',
                phase: 'development',
                constraints: []
            },
            sessionHistory: [],
            qualityRequirements: []
        };
        const behaviorResult = await persona.applyBehavior(context);
        const transformedOperation = await persona.transformOperation(validated.operation, behaviorResult);
        let optimizations = [];
        if (validated.options?.applyOptimizations) {
            optimizations = await persona.generateOptimizations(transformedOperation);
        }
        return {
            transformedOperation,
            optimizations,
            qualityAdjustments: behaviorResult.qualityAdjustments,
            mcpRoutingPreferences: persona.mcpPreferences,
            explanation: validated.options?.generateExplanation
                ? `Applied ${validated.persona} persona behavior with ${behaviorResult.transformations.length} transformations`
                : undefined,
            metadata: {
                transformationCount: behaviorResult.transformations.length
            }
        };
    }
    async handleCoordinatePersonas(args) {
        const validated = schemas.CoordinatePersonasSchema.parse(args);
        const result = await this.personaManager.coordinateMultiPersona(validated.personas, validated.operation, validated.coordinationMode);
        this.performanceMonitor.recordCollaboration(validated.personas, validated.coordinationMode || 'parallel', result.metadata.executionTime, result.conflictResolutions.length, true);
        return result;
    }
    async handleGetPersonaPriorities(args) {
        const validated = schemas.GetPersonaPrioritiesSchema.parse(args);
        const priorities = await this.personaManager.getPersonaPriorities(validated.persona, validated.decisionContext);
        let reasoning;
        if (validated.options?.includeReasoning) {
            reasoning = `${validated.persona} persona priorities based on ${validated.persona} values and decision framework`;
        }
        let comparison;
        if (validated.options?.comparativeAnalysis) {
            comparison = await this.generatePersonaComparison(validated.persona, validated.options.comparativeAnalysis);
        }
        return {
            persona: validated.persona,
            priorities,
            reasoning,
            comparison,
            metadata: {
                contextApplied: !!validated.decisionContext,
                priorityCount: priorities.length
            }
        };
    }
    async handleShareExpertise(args) {
        const validated = schemas.ShareExpertiseSchema.parse(args);
        const expertise = {
            ...validated.expertise,
            timestamp: validated.expertise.timestamp || new Date()
        };
        const result = await this.personaManager.shareExpertise(validated.fromPersona, validated.toPersona, expertise);
        this.performanceMonitor.recordMetric('expertise_sharing', result ? 1 : 0);
        return {
            success: result,
            metadata: {
                expertiseType: expertise.domain,
                sharingTime: Date.now()
            }
        };
    }
    getCollaborationPatterns() {
        const patterns = {};
        for (const [name, persona] of personaRegistry.getAllPersonas()) {
            patterns[name] = persona.collaborationPatterns;
        }
        return patterns;
    }
    getActivationTriggers() {
        const triggers = {};
        for (const [name, persona] of personaRegistry.getAllPersonas()) {
            triggers[name] = persona.autoActivationTriggers;
        }
        return triggers;
    }
    async generatePersonaComparison(persona, compareWith) {
        const basePersona = personaRegistry.getPersona(persona);
        if (!basePersona) {
            throw new McpError(ErrorCode.InvalidRequest, `Persona ${persona} not found`);
        }
        const comparisons = {};
        for (const otherPersona of compareWith) {
            const other = personaRegistry.getPersona(otherPersona);
            if (other) {
                comparisons[otherPersona] = {
                    priorityDifferences: this.comparePriorities(basePersona.priorityHierarchy, other.priorityHierarchy),
                    mcpPreferences: this.compareMcpPreferences(basePersona.mcpPreferences, other.mcpPreferences),
                    domains: this.compareDomains(basePersona.coreStrategies, other.coreStrategies)
                };
            }
        }
        return comparisons;
    }
    comparePriorities(priorities1, priorities2) {
        const differences = {};
        for (let i = 0; i < Math.max(priorities1.length, priorities2.length); i++) {
            const p1 = priorities1[i];
            const p2 = priorities2[i];
            if (p1 !== p2) {
                differences[i] = {
                    persona1: p1 || 'N/A',
                    persona2: p2 || 'N/A',
                    significance: Math.abs((priorities1.indexOf(p1) || 0) - (priorities2.indexOf(p2) || 0))
                };
            }
        }
        return differences;
    }
    compareMcpPreferences(prefs1, prefs2) {
        const comparison = {};
        const servers1 = prefs1.map(p => p.serverName);
        const servers2 = prefs2.map(p => p.serverName);
        const allServers = [...new Set([...servers1, ...servers2])];
        for (const server of allServers) {
            const pref1 = prefs1.find(p => p.serverName === server);
            const pref2 = prefs2.find(p => p.serverName === server);
            comparison[server] = {
                persona1: pref1?.preference || 'none',
                persona2: pref2?.preference || 'none',
                different: pref1?.preference !== pref2?.preference
            };
        }
        return comparison;
    }
    compareDomains(strategies1, strategies2) {
        const domains1 = strategies1.map(s => s.domain);
        const domains2 = strategies2.map(s => s.domain);
        return {
            common: domains1.filter(d => domains2.includes(d)),
            unique_to_first: domains1.filter(d => !domains2.includes(d)),
            unique_to_second: domains2.filter(d => !domains1.includes(d))
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('SuperClaude Personas server started', {
            serverName: config.serverName,
            personas: personaRegistry.getPersonaNames().length,
            tools: tools.length
        });
    }
}
const server = new SuperClaudePersonasServer();
server.run().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map