#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TaskManagerSimple } from './core/TaskManagerSimple.js';
import { ProjectMemoryManager } from './memory/ProjectMemoryManager.js';
import { ContextPreserver } from './memory/ContextPreserver.js';
import { SubAgentCoordinator } from './coordination/SubAgentCoordinator.js';
import { WorkflowOrchestrator } from './coordination/WorkflowOrchestrator.js';
import { CreateTaskRequestSchema, DistributeToSubAgentsRequestSchema } from './types/working.js';
export class SuperClaudeTasksServerCoordination {
    server;
    taskManager;
    memoryManager;
    contextPreserver;
    subAgentCoordinator;
    workflowOrchestrator;
    constructor() {
        this.taskManager = new TaskManagerSimple();
        this.memoryManager = new ProjectMemoryManager();
        this.contextPreserver = new ContextPreserver(this.memoryManager);
        this.subAgentCoordinator = new SubAgentCoordinator();
        this.workflowOrchestrator = new WorkflowOrchestrator(this.subAgentCoordinator);
        this.server = new Server({
            name: 'superclaude-tasks-coordination',
            version: '3.0.0',
            capabilities: {
                tools: {},
                resources: {}
            }
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'create_task',
                        description: 'Create a new task with metadata and estimation',
                        inputSchema: CreateTaskRequestSchema
                    },
                    {
                        name: 'get_task',
                        description: 'Retrieve task details by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string' }
                            },
                            required: ['taskId']
                        }
                    },
                    {
                        name: 'update_task',
                        description: 'Update task properties',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string' },
                                updates: { type: 'object' }
                            },
                            required: ['taskId', 'updates']
                        }
                    },
                    {
                        name: 'delete_task',
                        description: 'Delete a task',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string' }
                            },
                            required: ['taskId']
                        }
                    },
                    {
                        name: 'search_tasks',
                        description: 'Search tasks by query and filters',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string' },
                                filters: { type: 'object' }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'get_task_stats',
                        description: 'Get task statistics and analytics',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'create_project_memory',
                        description: 'Create project memory for semantic context preservation',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' }
                            },
                            required: ['projectId']
                        }
                    },
                    {
                        name: 'load_project_memory',
                        description: 'Load project memory state',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' }
                            },
                            required: ['projectId']
                        }
                    },
                    {
                        name: 'create_context_snapshot',
                        description: 'Create a context snapshot for later restoration',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                contextData: { type: 'array' },
                                description: { type: 'string' }
                            },
                            required: ['projectId', 'contextData']
                        }
                    },
                    {
                        name: 'load_context_snapshot',
                        description: 'Load context snapshot by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                snapshotId: { type: 'string' }
                            },
                            required: ['projectId', 'snapshotId']
                        }
                    },
                    {
                        name: 'register_agent',
                        description: 'Register a new sub-agent for task distribution',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                agentInfo: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        name: { type: 'string' },
                                        capabilities: { type: 'array', items: { type: 'string' } },
                                        status: { type: 'string', enum: ['idle', 'busy', 'offline', 'error'] },
                                        performanceMetrics: {
                                            type: 'object',
                                            properties: {
                                                tasksCompleted: { type: 'number' },
                                                averageTaskTime: { type: 'number' },
                                                successRate: { type: 'number' },
                                                errorRate: { type: 'number' },
                                                loadAverage: { type: 'number' }
                                            },
                                            required: ['tasksCompleted', 'averageTaskTime', 'successRate', 'errorRate', 'loadAverage']
                                        }
                                    },
                                    required: ['id', 'name', 'capabilities', 'status', 'performanceMetrics']
                                }
                            },
                            required: ['agentInfo']
                        }
                    },
                    {
                        name: 'get_available_agents',
                        description: 'Get list of available sub-agents',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'distribute_to_sub_agents',
                        description: 'Distribute task to sub-agents with specified strategy',
                        inputSchema: DistributeToSubAgentsRequestSchema
                    },
                    {
                        name: 'get_coordination_metrics',
                        description: 'Get coordination and performance metrics',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'create_workflow_schedule',
                        description: 'Create workflow schedule from distribution plan',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                distributionPlan: { type: 'object' },
                                strategy: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['sequential', 'parallel', 'hybrid'] },
                                        maxConcurrency: { type: 'number' },
                                        failureStrategy: { type: 'string', enum: ['stop', 'continue', 'retry'] },
                                        retryCount: { type: 'number' },
                                        timeout: { type: 'number' }
                                    },
                                    required: ['type', 'maxConcurrency', 'failureStrategy', 'retryCount', 'timeout']
                                }
                            },
                            required: ['distributionPlan', 'strategy']
                        }
                    },
                    {
                        name: 'coordinate_workflow',
                        description: 'Coordinate workflow execution with specified strategy',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workflowId: { type: 'string' },
                                strategy: { type: 'string', enum: ['sequential', 'parallel', 'hybrid'] },
                                maxConcurrency: { type: 'number' },
                                timeout: { type: 'number' },
                                failureStrategy: { type: 'string', enum: ['stop', 'continue', 'retry'] }
                            },
                            required: ['workflowId', 'strategy', 'maxConcurrency', 'timeout', 'failureStrategy']
                        }
                    },
                    {
                        name: 'get_workflow_schedule',
                        description: 'Get workflow schedule by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workflowId: { type: 'string' }
                            },
                            required: ['workflowId']
                        }
                    },
                    {
                        name: 'get_active_workflows',
                        description: 'Get all active workflow executions',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'cancel_workflow',
                        description: 'Cancel workflow execution by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                executionId: { type: 'string' }
                            },
                            required: ['executionId']
                        }
                    }
                ]
            };
        });
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: 'tasks://templates',
                        name: 'Task Templates',
                        description: 'Predefined task templates and decomposition patterns',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'tasks://analytics',
                        name: 'Task Analytics',
                        description: 'Task performance metrics and trends',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'coordination://agents',
                        name: 'Sub-Agent Registry',
                        description: 'Registry of available sub-agents and their capabilities',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'coordination://workflows',
                        name: 'Workflow Executions',
                        description: 'Active and completed workflow executions',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'coordination://metrics',
                        name: 'Coordination Metrics',
                        description: 'Performance metrics for task coordination and distribution',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'create_task':
                        return await this.handleCreateTask(args);
                    case 'get_task':
                        return await this.handleGetTask(args);
                    case 'update_task':
                        return await this.handleUpdateTask(args);
                    case 'delete_task':
                        return await this.handleDeleteTask(args);
                    case 'search_tasks':
                        return await this.handleSearchTasks(args);
                    case 'get_task_stats':
                        return await this.handleGetTaskStats(args);
                    case 'create_project_memory':
                        return await this.handleCreateProjectMemory(args);
                    case 'load_project_memory':
                        return await this.handleLoadProjectMemory(args);
                    case 'create_context_snapshot':
                        return await this.handleCreateContextSnapshot(args);
                    case 'load_context_snapshot':
                        return await this.handleLoadContextSnapshot(args);
                    case 'register_agent':
                        return await this.handleRegisterAgent(args);
                    case 'get_available_agents':
                        return await this.handleGetAvailableAgents(args);
                    case 'distribute_to_sub_agents':
                        return await this.handleDistributeToSubAgents(args);
                    case 'get_coordination_metrics':
                        return await this.handleGetCoordinationMetrics(args);
                    case 'create_workflow_schedule':
                        return await this.handleCreateWorkflowSchedule(args);
                    case 'coordinate_workflow':
                        return await this.handleCoordinateWorkflow(args);
                    case 'get_workflow_schedule':
                        return await this.handleGetWorkflowSchedule(args);
                    case 'get_active_workflows':
                        return await this.handleGetActiveWorkflows(args);
                    case 'cancel_workflow':
                        return await this.handleCancelWorkflow(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
            }
        });
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            try {
                switch (uri) {
                    case 'tasks://templates':
                        return await this.handleGetTaskTemplates();
                    case 'tasks://analytics':
                        return await this.handleGetTaskAnalytics();
                    case 'coordination://agents':
                        return await this.handleGetAgentRegistry();
                    case 'coordination://workflows':
                        return await this.handleGetWorkflowExecutions();
                    case 'coordination://metrics':
                        return await this.handleGetCoordinationMetrics({});
                    default:
                        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
                }
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `Resource read failed: ${error.message}`);
            }
        });
    }
    async handleCreateTask(args) {
        const result = await this.taskManager.createTask(args);
        if (args.metadata?.projectId) {
            await this.memoryManager.addTaskRecord(args.metadata.projectId, {
                taskId: result.task.id,
                action: 'created',
                details: {
                    type: result.task.type,
                    priority: result.task.priority,
                    estimatedHours: result.task.estimatedEffort?.hours
                }
            });
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    async handleGetTask(args) {
        const { taskId } = args;
        const task = await this.taskManager.getTask(taskId);
        if (!task) {
            throw new McpError(ErrorCode.InvalidRequest, `Task not found: ${taskId}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(task, null, 2)
                }
            ]
        };
    }
    async handleUpdateTask(args) {
        const { taskId, updates } = args;
        const task = await this.taskManager.updateTask(taskId, updates);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(task, null, 2)
                }
            ]
        };
    }
    async handleDeleteTask(args) {
        const { taskId } = args;
        await this.taskManager.deleteTask(taskId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, taskId }, null, 2)
                }
            ]
        };
    }
    async handleSearchTasks(args) {
        const { query, filters } = args;
        const tasks = await this.taskManager.searchTasks(query, filters);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(tasks, null, 2)
                }
            ]
        };
    }
    async handleGetTaskStats(args) {
        const stats = await this.taskManager.getTaskStats();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(stats, null, 2)
                }
            ]
        };
    }
    async handleCreateProjectMemory(args) {
        const { projectId } = args;
        const memoryState = await this.memoryManager.createProjectMemory(projectId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(memoryState, null, 2)
                }
            ]
        };
    }
    async handleLoadProjectMemory(args) {
        const { projectId } = args;
        const memoryState = await this.memoryManager.loadProjectMemory(projectId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(memoryState, null, 2)
                }
            ]
        };
    }
    async handleCreateContextSnapshot(args) {
        const { projectId, contextData, description } = args;
        const snapshot = await this.contextPreserver.createContextSnapshot(projectId, contextData, description);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(snapshot, null, 2)
                }
            ]
        };
    }
    async handleLoadContextSnapshot(args) {
        const { projectId, snapshotId } = args;
        const contextData = await this.contextPreserver.loadContextSnapshot(projectId, snapshotId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(contextData, null, 2)
                }
            ]
        };
    }
    async handleRegisterAgent(args) {
        const { agentInfo } = args;
        agentInfo.performanceMetrics.lastUpdated = new Date();
        await this.subAgentCoordinator.registerAgent(agentInfo);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, agentId: agentInfo.id }, null, 2)
                }
            ]
        };
    }
    async handleGetAvailableAgents(args) {
        const agents = this.subAgentCoordinator.getAvailableAgents();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(agents, null, 2)
                }
            ]
        };
    }
    async handleDistributeToSubAgents(args) {
        const result = await this.subAgentCoordinator.distributeTask(args);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    async handleGetCoordinationMetrics(args) {
        const metrics = this.subAgentCoordinator.getCoordinationMetrics();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(metrics, null, 2)
                }
            ]
        };
    }
    async handleCreateWorkflowSchedule(args) {
        const { distributionPlan, strategy } = args;
        const schedule = await this.workflowOrchestrator.createWorkflowSchedule(distributionPlan, strategy);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(schedule, null, 2)
                }
            ]
        };
    }
    async handleCoordinateWorkflow(args) {
        const result = await this.workflowOrchestrator.coordinateWorkflow(args);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    async handleGetWorkflowSchedule(args) {
        const { workflowId } = args;
        const schedule = this.workflowOrchestrator.getWorkflowSchedule(workflowId);
        if (!schedule) {
            throw new McpError(ErrorCode.InvalidRequest, `Workflow schedule not found: ${workflowId}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(schedule, null, 2)
                }
            ]
        };
    }
    async handleGetActiveWorkflows(args) {
        const workflows = this.workflowOrchestrator.getActiveWorkflows();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(workflows, null, 2)
                }
            ]
        };
    }
    async handleCancelWorkflow(args) {
        const { executionId } = args;
        await this.workflowOrchestrator.cancelWorkflow(executionId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, executionId }, null, 2)
                }
            ]
        };
    }
    async handleGetTaskTemplates() {
        const templates = {
            feature: {
                title: 'New Feature Template',
                description: 'Template for feature development tasks',
                subtasks: ['design', 'implementation', 'testing', 'documentation']
            },
            bug: {
                title: 'Bug Fix Template',
                description: 'Template for bug fix tasks',
                subtasks: ['investigation', 'fix', 'verification', 'documentation']
            },
            research: {
                title: 'Research Task Template',
                description: 'Template for research and analysis tasks',
                subtasks: ['literature_review', 'experimentation', 'analysis', 'recommendations']
            }
        };
        return {
            contents: [
                {
                    uri: 'tasks://templates',
                    mimeType: 'application/json',
                    text: JSON.stringify(templates, null, 2)
                }
            ]
        };
    }
    async handleGetTaskAnalytics() {
        const analytics = {
            summary: 'Task analytics and performance metrics',
            metrics: await this.taskManager.getTaskStats(),
            coordination: this.subAgentCoordinator.getCoordinationMetrics(),
            workflows: this.workflowOrchestrator.getActiveWorkflows().length
        };
        return {
            contents: [
                {
                    uri: 'tasks://analytics',
                    mimeType: 'application/json',
                    text: JSON.stringify(analytics, null, 2)
                }
            ]
        };
    }
    async handleGetAgentRegistry() {
        const agents = this.subAgentCoordinator.getAvailableAgents();
        return {
            contents: [
                {
                    uri: 'coordination://agents',
                    mimeType: 'application/json',
                    text: JSON.stringify(agents, null, 2)
                }
            ]
        };
    }
    async handleGetWorkflowExecutions() {
        const workflows = this.workflowOrchestrator.getActiveWorkflows();
        return {
            contents: [
                {
                    uri: 'coordination://workflows',
                    mimeType: 'application/json',
                    text: JSON.stringify(workflows, null, 2)
                }
            ]
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SuperClaude Tasks Server (Full Coordination) running on stdio');
    }
}
async function main() {
    try {
        const server = new SuperClaudeTasksServerCoordination();
        await server.run();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=MCPServerCoordination.js.map