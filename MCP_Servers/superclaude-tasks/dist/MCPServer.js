import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TaskManager } from './core/TaskManager.js';
import { EstimationEngine } from './core/EstimationEngine.js';
import { TaskStore } from './storage/TaskStore.js';
import { DependencyTracker } from './core/DependencyTracker.js';
import { ProgressMonitor } from './core/ProgressMonitor.js';
import { HistoricalDataManager } from './core/HistoricalDataManager.js';
import { ComplexityAnalyzer } from './core/ComplexityAnalyzer.js';
import { RiskAssessor } from './core/RiskAssessor.js';
import { Logger } from './utils/Logger.js';
import { CreateTaskRequestSchema, DecomposeTaskRequestSchema } from './types/index.js';
export class SuperClaudeTasksServer {
    server;
    taskManager;
    taskStore;
    logger;
    constructor() {
        this.logger = new Logger('superclaude-tasks');
        this.server = new Server({
            name: 'superclaude-tasks',
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
                                taskId: { type: 'string', format: 'uuid' }
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
                                taskId: { type: 'string', format: 'uuid' },
                                updates: { type: 'object' }
                            },
                            required: ['taskId', 'updates']
                        }
                    },
                    {
                        name: 'delete_task',
                        description: 'Delete a task and its dependencies',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string', format: 'uuid' }
                            },
                            required: ['taskId']
                        }
                    },
                    {
                        name: 'decompose_task',
                        description: 'Break down a complex task into subtasks',
                        inputSchema: DecomposeTaskRequestSchema
                    },
                    {
                        name: 'update_task_status',
                        description: 'Update task status and progress',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string', format: 'uuid' },
                                status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'] },
                                progress: { type: 'number', minimum: 0, maximum: 100 }
                            },
                            required: ['taskId', 'status']
                        }
                    },
                    {
                        name: 'get_task_progress',
                        description: 'Get detailed progress report for a task',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string', format: 'uuid' }
                            },
                            required: ['taskId']
                        }
                    },
                    {
                        name: 'get_task_tree',
                        description: 'Get hierarchical task tree',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                rootTaskId: { type: 'string', format: 'uuid' }
                            },
                            required: ['rootTaskId']
                        }
                    },
                    {
                        name: 'estimate_task_effort',
                        description: 'Get detailed effort estimation for a task',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string', format: 'uuid' }
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
                                filters: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'array', items: { type: 'string' } },
                                        type: { type: 'array', items: { type: 'string' } },
                                        priority: { type: 'array', items: { type: 'string' } },
                                        projectId: { type: 'string' }
                                    }
                                }
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
                    case 'decompose_task':
                        return await this.handleDecomposeTask(args);
                    case 'update_task_status':
                        return await this.handleUpdateTaskStatus(args);
                    case 'get_task_progress':
                        return await this.handleGetTaskProgress(args);
                    case 'get_task_tree':
                        return await this.handleGetTaskTree(args);
                    case 'estimate_task_effort':
                        return await this.handleEstimateTaskEffort(args);
                    case 'search_tasks':
                        return await this.handleSearchTasks(args);
                    case 'get_task_stats':
                        return await this.handleGetTaskStats(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                this.logger.error(`Tool call failed: ${name}`, { error: error.message, args });
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
                    default:
                        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
                }
            }
            catch (error) {
                this.logger.error(`Resource read failed: ${uri}`, { error: error.message });
                throw new McpError(ErrorCode.InternalError, `Resource read failed: ${error.message}`);
            }
        });
    }
    async handleCreateTask(args) {
        this.logger.info('Creating task', { args });
        const result = await this.taskManager.createTask(args);
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
        this.logger.info('Getting task', { taskId });
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
        this.logger.info('Updating task', { taskId, updates });
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
        this.logger.info('Deleting task', { taskId });
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
    async handleDecomposeTask(args) {
        this.logger.info('Decomposing task', { args });
        const result = await this.taskManager.decomposeTask(args);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }
    async handleUpdateTaskStatus(args) {
        const { taskId, status, progress } = args;
        this.logger.info('Updating task status', { taskId, status, progress });
        await this.taskManager.updateTaskStatus(taskId, status, progress);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, taskId, status, progress }, null, 2)
                }
            ]
        };
    }
    async handleGetTaskProgress(args) {
        const { taskId } = args;
        this.logger.info('Getting task progress', { taskId });
        const progress = await this.taskManager.getTaskProgress(taskId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(progress, null, 2)
                }
            ]
        };
    }
    async handleGetTaskTree(args) {
        const { rootTaskId } = args;
        this.logger.info('Getting task tree', { rootTaskId });
        const tree = await this.taskManager.getTaskTree(rootTaskId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(tree, null, 2)
                }
            ]
        };
    }
    async handleEstimateTaskEffort(args) {
        const { taskId } = args;
        this.logger.info('Estimating task effort', { taskId });
        const task = await this.taskManager.getTask(taskId);
        if (!task) {
            throw new McpError(ErrorCode.InvalidRequest, `Task not found: ${taskId}`);
        }
        const estimation = await this.taskManager.estimateEffort(task);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(estimation, null, 2)
                }
            ]
        };
    }
    async handleSearchTasks(args) {
        const { query, filters } = args;
        this.logger.info('Searching tasks', { query, filters });
        const tasks = await this.taskStore.searchTasks(query, filters);
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
        this.logger.info('Getting task stats');
        const stats = await this.taskStore.getTaskStats();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(stats, null, 2)
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
            metrics: {
                totalTasks: 0,
                completedTasks: 0,
                averageCompletionTime: 0,
                estimationAccuracy: 0
            },
            trends: {
                productivity: 'stable',
                quality: 'improving',
                velocity: 'increasing'
            }
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
    async initialize() {
        try {
            this.logger.info('Initializing SuperClaude Tasks Server');
            this.taskStore = new TaskStore('./data/tasks.db', this.logger);
            await this.taskStore.initialize();
            const dependencyTracker = new DependencyTracker(this.logger);
            const progressMonitor = new ProgressMonitor(this.logger);
            const historicalDataManager = new HistoricalDataManager(this.logger);
            const complexityAnalyzer = new ComplexityAnalyzer(this.logger);
            const riskAssessor = new RiskAssessor(this.logger);
            const estimationEngine = new EstimationEngine(historicalDataManager, complexityAnalyzer, riskAssessor, this.logger);
            this.taskManager = new TaskManager(this.taskStore, dependencyTracker, progressMonitor, estimationEngine, this.logger);
            this.logger.info('SuperClaude Tasks Server initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize server', { error: error.message });
            throw error;
        }
    }
    async run() {
        await this.initialize();
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('SuperClaude Tasks Server running on stdio');
    }
    async shutdown() {
        try {
            this.logger.info('Shutting down SuperClaude Tasks Server');
            if (this.taskStore) {
                await this.taskStore.close();
            }
            this.logger.info('SuperClaude Tasks Server shutdown complete');
        }
        catch (error) {
            this.logger.error('Error during shutdown', { error: error.message });
            throw error;
        }
    }
}
//# sourceMappingURL=MCPServer.js.map