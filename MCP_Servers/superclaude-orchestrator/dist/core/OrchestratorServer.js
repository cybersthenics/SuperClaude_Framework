/**
 * SuperClaude Orchestrator Server - Main MCP server implementation
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { WaveOrchestratorEngine } from '../wave/WaveOrchestratorEngine.js';
import { DelegationEngine } from '../delegation/DelegationEngine.js';
import { SubAgentManager } from '../delegation/SubAgentManager.js';
import { ConcurrencyController } from '../delegation/ConcurrencyController.js';
import { LoopModeController } from '../loop/LoopModeController.js';
import { ChainModeManager } from '../chain/ChainModeManager.js';
import { ResourceManager } from '../shared/ResourceManager.js';
import { ContextPreserver } from '../shared/ContextPreserver.js';
import { PerformanceTracker } from '../shared/PerformanceTracker.js';
export class OrchestratorServer {
    server;
    waveEngine;
    delegationEngine;
    loopController;
    chainManager;
    subAgentManager;
    concurrencyController;
    resourceManager;
    contextPreserver;
    performanceTracker;
    constructor() {
        this.server = new Server({
            name: 'superclaude-orchestrator',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
        });
        // Initialize components
        this.resourceManager = new ResourceManager();
        this.contextPreserver = new ContextPreserver();
        this.performanceTracker = new PerformanceTracker();
        this.subAgentManager = new SubAgentManager();
        this.concurrencyController = new ConcurrencyController();
        this.waveEngine = new WaveOrchestratorEngine(this.resourceManager, this.contextPreserver, this.performanceTracker);
        this.delegationEngine = new DelegationEngine(this.subAgentManager, this.concurrencyController, this.performanceTracker);
        this.loopController = new LoopModeController(this.performanceTracker, this.contextPreserver);
        this.chainManager = new ChainModeManager(this.performanceTracker, this.contextPreserver);
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'create_wave_plan',
                    description: 'Create execution plan for wave orchestration',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            operation: {
                                type: 'object',
                                description: 'Operation to orchestrate'
                            },
                            strategy: {
                                type: 'string',
                                enum: ['progressive', 'systematic', 'adaptive', 'enterprise'],
                                description: 'Wave orchestration strategy'
                            }
                        },
                        required: ['operation']
                    }
                },
                {
                    name: 'execute_wave',
                    description: 'Execute a wave plan with checkpoints',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            waveId: {
                                type: 'string',
                                description: 'Wave plan ID to execute'
                            }
                        },
                        required: ['waveId']
                    }
                },
                {
                    name: 'delegate_to_subagents',
                    description: 'Create and manage sub-agent tasks',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            task: {
                                type: 'object',
                                description: 'Task to delegate'
                            },
                            strategy: {
                                type: 'string',
                                enum: ['files', 'folders', 'auto'],
                                description: 'Delegation strategy'
                            }
                        },
                        required: ['task', 'strategy']
                    }
                },
                {
                    name: 'start_loop',
                    description: 'Start iterative refinement loop with convergence detection',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            configuration: {
                                type: 'object',
                                description: 'Loop configuration'
                            },
                            context: {
                                type: 'object',
                                description: 'Initial execution context'
                            }
                        },
                        required: ['configuration', 'context']
                    }
                },
                {
                    name: 'execute_loop_iteration',
                    description: 'Execute next iteration in active loop',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            loopId: {
                                type: 'string',
                                description: 'Loop ID to execute'
                            },
                            input: {
                                type: 'object',
                                description: 'Optional iteration input'
                            }
                        },
                        required: ['loopId']
                    }
                },
                {
                    name: 'start_chain',
                    description: 'Start persona chain execution with context handoff',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            configuration: {
                                type: 'object',
                                description: 'Chain configuration'
                            },
                            context: {
                                type: 'object',
                                description: 'Initial execution context'
                            }
                        },
                        required: ['configuration', 'context']
                    }
                },
                {
                    name: 'execute_chain',
                    description: 'Execute complete persona chain',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            chainId: {
                                type: 'string',
                                description: 'Chain ID to execute'
                            }
                        },
                        required: ['chainId']
                    }
                }
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'create_wave_plan':
                        return await this.handleCreateWavePlan(args);
                    case 'execute_wave':
                        return await this.handleExecuteWave(args);
                    case 'delegate_to_subagents':
                        return await this.handleDelegateToSubAgents(args);
                    case 'start_loop':
                        return await this.handleStartLoop(args);
                    case 'execute_loop_iteration':
                        return await this.handleExecuteLoopIteration(args);
                    case 'start_chain':
                        return await this.handleStartChain(args);
                    case 'execute_chain':
                        return await this.handleExecuteChain(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    async handleCreateWavePlan(args) {
        const { operation, strategy } = args;
        const plan = await this.waveEngine.createWavePlan(operation, strategy);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        waveId: plan.waveId,
                        strategy: plan.strategy,
                        phases: plan.phases.length,
                        estimatedDuration: plan.totalEstimatedTime,
                        resourceRequirements: plan.resourceRequirements
                    }, null, 2)
                }
            ]
        };
    }
    async handleExecuteWave(args) {
        const { waveId } = args;
        // For demo purposes, create a simple plan and execute it
        const mockPlan = {
            waveId,
            strategy: 'progressive',
            phases: [],
            totalEstimatedTime: 30000,
            resourceRequirements: {
                memory: 512,
                cpu: 1.0,
                concurrency: 2,
                timeout: 30000
            },
            checkpoints: []
        };
        const result = await this.waveEngine.executeWave(mockPlan);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        waveId: result.waveId,
                        status: result.status,
                        completedPhases: result.completedPhases.length,
                        performance: result.performanceMetrics
                    }, null, 2)
                }
            ]
        };
    }
    async handleDelegateToSubAgents(args) {
        const { task, strategy } = args;
        const strategyConfig = {
            type: strategy,
            concurrency: 5,
            resourceAllocation: 'dynamic'
        };
        const result = await this.delegationEngine.delegateToSubAgents(task, strategyConfig);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        delegationId: result.delegationId,
                        subAgentsCreated: result.subAgentsCreated,
                        strategy: result.strategy,
                        status: result.status
                    }, null, 2)
                }
            ]
        };
    }
    async handleStartLoop(args) {
        const { configuration, context } = args;
        const loopId = await this.loopController.startLoop(configuration, context);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        loopId,
                        mode: configuration.mode,
                        maxIterations: configuration.maxIterations,
                        status: 'started'
                    }, null, 2)
                }
            ]
        };
    }
    async handleExecuteLoopIteration(args) {
        const { loopId, input } = args;
        const iteration = await this.loopController.executeIteration(loopId, input);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        iterationId: iteration.iterationId,
                        iterationNumber: iteration.iterationNumber,
                        status: iteration.status,
                        qualityScore: iteration.metrics.qualityScore,
                        improvementScore: iteration.metrics.improvementScore
                    }, null, 2)
                }
            ]
        };
    }
    async handleStartChain(args) {
        const { configuration, context } = args;
        const chainId = await this.chainManager.startChain(configuration, context);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        chainId,
                        personas: configuration.personas,
                        strategy: configuration.strategy,
                        status: 'started'
                    }, null, 2)
                }
            ]
        };
    }
    async handleExecuteChain(args) {
        const { chainId } = args;
        const result = await this.chainManager.executeChain(chainId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        chainId: result.chainId,
                        totalLinks: result.totalLinks,
                        completedLinks: result.completedLinks,
                        totalExecutionTime: result.performance.totalExecutionTime,
                        averageLinkTime: result.performance.averageLinkTime
                    }, null, 2)
                }
            ]
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SuperClaude Orchestrator MCP server running on stdio');
    }
}
//# sourceMappingURL=OrchestratorServer.js.map