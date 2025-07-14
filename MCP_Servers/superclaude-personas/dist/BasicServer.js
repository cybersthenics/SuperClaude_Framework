#!/usr/bin/env node
"use strict";
// SuperClaude Personas - Basic Working Server
// Minimal implementation for immediate deployment
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// Simple persona definitions
const PERSONAS = {
    architect: {
        identity: "Systems architecture specialist, long-term thinking focus, scalability expert",
        priorityHierarchy: ["Long-term maintainability", "Scalability", "Performance", "Security", "Short-term gains"],
        triggers: ["architecture", "design", "scalability", "system", "structure", "patterns"],
        mcpPreferences: [
            { serverName: "sequential", preference: "primary" },
            { serverName: "context7", preference: "secondary" }
        ]
    },
    frontend: {
        identity: "UX specialist, accessibility advocate, performance-conscious developer",
        priorityHierarchy: ["User needs", "Accessibility", "Performance", "Visual design", "Technical elegance"],
        triggers: ["component", "responsive", "accessibility", "ui", "ux", "user", "interface"],
        mcpPreferences: [
            { serverName: "magic", preference: "primary" },
            { serverName: "playwright", preference: "secondary" }
        ]
    },
    analyzer: {
        identity: "Root cause specialist, evidence-based investigator, systematic analyst",
        priorityHierarchy: ["Evidence", "Systematic approach", "Thoroughness", "Accuracy", "Speed"],
        triggers: ["analyze", "investigate", "root cause", "debug", "troubleshoot", "examine"],
        mcpPreferences: [
            { serverName: "sequential", preference: "primary" },
            { serverName: "context7", preference: "secondary" }
        ]
    },
    backend: {
        identity: "Reliability engineer, API specialist, data integrity focus",
        priorityHierarchy: ["Reliability", "Security", "Performance", "Features", "Convenience"],
        triggers: ["api", "database", "service", "reliability", "server", "endpoint"],
        mcpPreferences: [
            { serverName: "context7", preference: "primary" },
            { serverName: "sequential", preference: "secondary" }
        ]
    },
    security: {
        identity: "Threat modeler, compliance expert, vulnerability specialist",
        priorityHierarchy: ["Security", "Compliance", "Reliability", "Performance", "Convenience"],
        triggers: ["vulnerability", "threat", "compliance", "secure", "authentication"],
        mcpPreferences: [
            { serverName: "sequential", preference: "primary" },
            { serverName: "context7", preference: "secondary" }
        ]
    },
    performance: {
        identity: "Optimization specialist, bottleneck elimination expert, metrics-driven analyst",
        priorityHierarchy: ["Measurement", "Critical path optimization", "User experience", "Avoid premature optimization"],
        triggers: ["optimize", "performance", "bottleneck", "speed", "slow", "memory"],
        mcpPreferences: [
            { serverName: "playwright", preference: "primary" },
            { serverName: "sequential", preference: "secondary" }
        ]
    },
    qa: {
        identity: "Quality advocate, testing specialist, edge case detective",
        priorityHierarchy: ["Prevention", "Detection", "Correction", "Comprehensive coverage"],
        triggers: ["test", "quality", "validation", "edge case", "coverage", "regression"],
        mcpPreferences: [
            { serverName: "playwright", preference: "primary" },
            { serverName: "sequential", preference: "secondary" }
        ]
    },
    refactorer: {
        identity: "Code quality specialist, technical debt manager, clean code advocate",
        priorityHierarchy: ["Simplicity", "Maintainability", "Readability", "Performance", "Cleverness"],
        triggers: ["refactor", "cleanup", "technical debt", "maintainability", "simplify"],
        mcpPreferences: [
            { serverName: "sequential", preference: "primary" },
            { serverName: "context7", preference: "secondary" }
        ]
    },
    devops: {
        identity: "Infrastructure specialist, deployment expert, reliability engineer",
        priorityHierarchy: ["Automation", "Observability", "Reliability", "Scalability", "Manual processes"],
        triggers: ["deploy", "infrastructure", "ci/cd", "docker", "kubernetes", "monitoring"],
        mcpPreferences: [
            { serverName: "sequential", preference: "primary" },
            { serverName: "context7", preference: "secondary" }
        ]
    },
    mentor: {
        identity: "Knowledge transfer specialist, educator, documentation advocate",
        priorityHierarchy: ["Understanding", "Knowledge transfer", "Teaching", "Task completion"],
        triggers: ["explain", "learn", "understand", "guide", "teach", "documentation"],
        mcpPreferences: [
            { serverName: "context7", preference: "primary" },
            { serverName: "sequential", preference: "secondary" }
        ]
    },
    scribe: {
        identity: "Professional writer, documentation specialist, localization expert",
        priorityHierarchy: ["Clarity", "Audience needs", "Cultural sensitivity", "Completeness", "Brevity"],
        triggers: ["document", "write", "guide", "readme", "wiki", "manual"],
        mcpPreferences: [
            { serverName: "context7", preference: "primary" },
            { serverName: "sequential", preference: "secondary" }
        ]
    }
};
class BasicPersonasServer {
    constructor() {
        this.server = new index_js_1.Server({
            name: 'superclaude-personas',
            version: '1.0.0',
            description: 'SuperClaude Personas - Behavioral Intelligence Engine'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        this.setupHandlers();
    }
    setupHandlers() {
        // List tools handler
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'activate_persona',
                        description: 'Activate specific persona with context for behavioral transformation',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                persona: {
                                    type: 'string',
                                    enum: Object.keys(PERSONAS),
                                    description: 'Persona to activate'
                                },
                                context: {
                                    type: 'object',
                                    properties: {
                                        domain: { type: 'string', description: 'Domain of the task' },
                                        complexity: { type: 'number', minimum: 0, maximum: 1, description: 'Complexity level' },
                                        userIntent: { type: 'string', description: 'User intent description' }
                                    },
                                    required: ['domain', 'complexity', 'userIntent'],
                                    description: 'Context for persona activation'
                                }
                            },
                            required: ['persona', 'context']
                        }
                    },
                    {
                        name: 'get_persona_recommendation',
                        description: 'Get recommended persona for task with confidence scoring',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskDescription: {
                                    type: 'string',
                                    description: 'Description of the task to get persona recommendation for'
                                },
                                maxRecommendations: {
                                    type: 'number',
                                    minimum: 1,
                                    maximum: 5,
                                    default: 3,
                                    description: 'Maximum number of recommendations to return'
                                }
                            },
                            required: ['taskDescription']
                        }
                    },
                    {
                        name: 'get_persona_priorities',
                        description: 'Get priority hierarchy for persona decision making',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                persona: {
                                    type: 'string',
                                    enum: Object.keys(PERSONAS),
                                    description: 'Persona to get priorities for'
                                }
                            },
                            required: ['persona']
                        }
                    },
                    {
                        name: 'coordinate_personas',
                        description: 'Coordinate multiple personas for complex tasks',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                personas: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: Object.keys(PERSONAS)
                                    },
                                    description: 'List of personas to coordinate'
                                },
                                task: {
                                    type: 'string',
                                    description: 'Task description for coordination'
                                },
                                mode: {
                                    type: 'string',
                                    enum: ['parallel', 'sequential', 'hierarchical'],
                                    default: 'parallel',
                                    description: 'Coordination mode'
                                }
                            },
                            required: ['personas', 'task']
                        }
                    }
                ]
            };
        });
        // List resources handler
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: 'personas://definitions',
                        name: 'Persona Definitions',
                        description: 'Complete definitions of all 11 SuperClaude personas',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'personas://personas-summary',
                        name: 'Personas Summary',
                        description: 'Summary of all available personas with their key characteristics',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        // Read resource handler
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            switch (uri) {
                case 'personas://definitions':
                    return {
                        contents: [{
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(PERSONAS, null, 2)
                            }]
                    };
                case 'personas://personas-summary':
                    const summary = Object.entries(PERSONAS).map(([name, persona]) => ({
                        name,
                        identity: persona.identity,
                        topPriority: persona.priorityHierarchy[0],
                        keyTriggers: persona.triggers.slice(0, 3),
                        primaryMCP: persona.mcpPreferences[0]?.serverName
                    }));
                    return {
                        contents: [{
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(summary, null, 2)
                            }]
                    };
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
            }
        });
        // Call tool handler
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'activate_persona':
                        result = await this.handleActivatePersona(args);
                        break;
                    case 'get_persona_recommendation':
                        result = await this.handleGetPersonaRecommendation(args);
                        break;
                    case 'get_persona_priorities':
                        result = await this.handleGetPersonaPriorities(args);
                        break;
                    case 'coordinate_personas':
                        result = await this.handleCoordinatePersonas(args);
                        break;
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            catch (error) {
                console.error('Tool execution failed:', error);
                throw error;
            }
        });
    }
    async handleActivatePersona(args) {
        const { persona, context } = args;
        const personaData = PERSONAS[persona];
        if (!personaData) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Persona ${persona} not found`);
        }
        // Generate behavior transformations based on persona
        const transformations = [
            {
                type: 'priority_alignment',
                description: `Apply ${persona} priority hierarchy: ${personaData.priorityHierarchy.join(' > ')}`,
                impact: `Operations prioritized according to ${persona} values`,
                priority: 1
            },
            {
                type: 'domain_optimization',
                description: `Optimize for ${persona} domain expertise`,
                impact: `Enhanced effectiveness in ${persona} specialty areas`,
                priority: 2
            }
        ];
        // Calculate confidence based on context matching
        let confidence = 0.5;
        for (const trigger of personaData.triggers) {
            if (context.domain.toLowerCase().includes(trigger) ||
                context.userIntent.toLowerCase().includes(trigger)) {
                confidence += 0.1;
            }
        }
        confidence = Math.min(confidence, 1);
        return {
            success: true,
            persona,
            identity: personaData.identity,
            behaviorTransformations: transformations,
            mcpPreferences: personaData.mcpPreferences,
            recommendations: [
                `Follow ${persona} priority hierarchy`,
                `Leverage ${persona} domain expertise`,
                `Consider ${persona} perspective in decisions`
            ],
            metadata: {
                activationTime: Date.now(),
                confidenceScore: confidence,
                contextMatch: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low'
            }
        };
    }
    async handleGetPersonaRecommendation(args) {
        const { taskDescription, maxRecommendations = 3 } = args;
        const recommendations = [];
        for (const [personaName, personaData] of Object.entries(PERSONAS)) {
            let confidence = 0.3; // Base confidence
            // Check trigger matches
            for (const trigger of personaData.triggers) {
                if (taskDescription.toLowerCase().includes(trigger)) {
                    confidence += 0.15;
                }
            }
            // Check direct persona name mention
            if (taskDescription.toLowerCase().includes(personaName)) {
                confidence += 0.2;
            }
            // Check priority alignment
            for (const priority of personaData.priorityHierarchy) {
                if (taskDescription.toLowerCase().includes(priority.toLowerCase())) {
                    confidence += 0.1;
                }
            }
            confidence = Math.min(confidence, 1);
            if (confidence > 0.4) {
                recommendations.push({
                    persona: personaName,
                    confidence: Math.round(confidence * 100) / 100,
                    reasoning: `Matches ${personaName} triggers and priorities`,
                    identity: personaData.identity,
                    expectedBehaviors: [
                        `Prioritize ${personaData.priorityHierarchy[0]}`,
                        `Apply ${personaName} domain expertise`,
                        `Follow ${personaName} decision framework`
                    ]
                });
            }
        }
        // Sort by confidence and limit results
        recommendations.sort((a, b) => b.confidence - a.confidence);
        return {
            recommendations: recommendations.slice(0, maxRecommendations),
            analysis: {
                detectedKeywords: this.extractKeywords(taskDescription),
                totalPersonasEvaluated: Object.keys(PERSONAS).length,
                highConfidenceMatches: recommendations.filter(r => r.confidence > 0.7).length
            }
        };
    }
    async handleGetPersonaPriorities(args) {
        const { persona } = args;
        const personaData = PERSONAS[persona];
        if (!personaData) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Persona ${persona} not found`);
        }
        return {
            persona,
            identity: personaData.identity,
            priorities: personaData.priorityHierarchy,
            explanation: `${persona} persona prioritizes ${personaData.priorityHierarchy[0]} above all else, followed by ${personaData.priorityHierarchy[1]} and ${personaData.priorityHierarchy[2]}`,
            mcpPreferences: personaData.mcpPreferences,
            metadata: {
                priorityCount: personaData.priorityHierarchy.length,
                topPriority: personaData.priorityHierarchy[0],
                primaryMCP: personaData.mcpPreferences[0]?.serverName
            }
        };
    }
    async handleCoordinatePersonas(args) {
        const { personas, task, mode = 'parallel' } = args;
        // Validate all personas exist
        for (const persona of personas) {
            if (!PERSONAS[persona]) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Persona ${persona} not found`);
            }
        }
        const results = [];
        for (const persona of personas) {
            const personaData = PERSONAS[persona];
            // Simple coordination logic
            let confidence = 0.6;
            for (const trigger of personaData.triggers) {
                if (task.toLowerCase().includes(trigger)) {
                    confidence += 0.1;
                }
            }
            confidence = Math.min(confidence, 1);
            results.push({
                persona,
                identity: personaData.identity,
                contribution: `${persona} perspective on the task`,
                confidence: Math.round(confidence * 100) / 100,
                recommendations: [
                    `Apply ${persona} priority: ${personaData.priorityHierarchy[0]}`,
                    `Leverage ${persona} expertise`,
                    `Consider ${persona} decision framework`
                ],
                mcpPreferences: personaData.mcpPreferences
            });
        }
        // Generate coordination summary
        const topPersona = results.reduce((prev, current) => prev.confidence > current.confidence ? prev : current);
        return {
            mode,
            participants: personas,
            results,
            coordination: {
                primaryPersona: topPersona.persona,
                overallConfidence: Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100) / 100,
                recommendedApproach: `Lead with ${topPersona.persona} perspective, incorporate insights from other personas`,
                potentialConflicts: this.identifyPotentialConflicts(results)
            },
            metadata: {
                executionTime: Date.now(),
                participantCount: personas.length,
                coordinationMode: mode
            }
        };
    }
    extractKeywords(text) {
        // Simple keyword extraction
        const keywords = [];
        for (const [persona, data] of Object.entries(PERSONAS)) {
            for (const trigger of data.triggers) {
                if (text.toLowerCase().includes(trigger)) {
                    keywords.push(trigger);
                }
            }
        }
        return [...new Set(keywords)];
    }
    identifyPotentialConflicts(results) {
        const conflicts = [];
        // Check for priority conflicts
        const priorities = results.map(r => PERSONAS[r.persona].priorityHierarchy[0]);
        const uniquePriorities = [...new Set(priorities)];
        if (uniquePriorities.length > 1) {
            conflicts.push(`Priority differences: ${uniquePriorities.join(' vs ')}`);
        }
        // Check for MCP server conflicts
        const mcpServers = results.flatMap(r => PERSONAS[r.persona].mcpPreferences.map(p => p.serverName));
        const serverCounts = mcpServers.reduce((acc, server) => {
            acc[server] = (acc[server] || 0) + 1;
            return acc;
        }, {});
        const highDemandServers = Object.entries(serverCounts)
            .filter(([_, count]) => count > 1)
            .map(([server, _]) => server);
        if (highDemandServers.length > 0) {
            conflicts.push(`MCP server contention: ${highDemandServers.join(', ')}`);
        }
        return conflicts;
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('SuperClaude Personas server started successfully');
        console.error(`Available personas: ${Object.keys(PERSONAS).join(', ')}`);
    }
}
// Start the server
const server = new BasicPersonasServer();
server.run().catch((error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
});
