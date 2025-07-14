#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TaskManagerSimple } from './core/TaskManagerSimple.js';
import { ProjectMemoryManager } from './memory/ProjectMemoryManager.js';
import { ContextPreserver } from './memory/ContextPreserver.js';
import { CreateTaskRequestSchema } from './types/working.js';
export class SuperClaudeTasksServerMemory {
    server;
    taskManager;
    memoryManager;
    contextPreserver;
    constructor() {
        this.taskManager = new TaskManagerSimple();
        this.memoryManager = new ProjectMemoryManager();
        this.contextPreserver = new ContextPreserver(this.memoryManager);
        this.server = new Server({
            name: 'superclaude-tasks-memory',
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
                        name: 'update_task_status',
                        description: 'Update task status and progress',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string' },
                                status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'] },
                                progress: { type: 'number', minimum: 0, maximum: 100 }
                            },
                            required: ['taskId', 'status']
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
                        name: 'save_project_memory',
                        description: 'Save current project memory state',
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
                        name: 'add_symbol_info',
                        description: 'Add symbol information to semantic cache',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                symbol: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        type: { type: 'string' },
                                        location: { type: 'string' },
                                        references: { type: 'array', items: { type: 'string' } },
                                        usageCount: { type: 'number' }
                                    },
                                    required: ['name', 'type', 'location', 'references', 'usageCount']
                                }
                            },
                            required: ['projectId', 'symbol']
                        }
                    },
                    {
                        name: 'search_symbols',
                        description: 'Search symbols in project memory',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                query: { type: 'string' }
                            },
                            required: ['projectId', 'query']
                        }
                    },
                    {
                        name: 'search_patterns',
                        description: 'Search patterns in project memory',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                query: { type: 'string' }
                            },
                            required: ['projectId', 'query']
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
                        name: 'list_context_snapshots',
                        description: 'List all context snapshots for a project',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' }
                            },
                            required: ['projectId']
                        }
                    },
                    {
                        name: 'get_snapshot_statistics',
                        description: 'Get snapshot statistics and metrics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' }
                            },
                            required: ['projectId']
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
                        uri: 'memory://project-state',
                        name: 'Project Memory State',
                        description: 'Current project memory and semantic cache state',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'memory://symbol-index',
                        name: 'Symbol Index',
                        description: 'Project symbol index and references',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'memory://performance-baseline',
                        name: 'Performance Baseline',
                        description: 'Historical performance metrics and baselines',
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
                    case 'update_task_status':
                        return await this.handleUpdateTaskStatus(args);
                    case 'search_tasks':
                        return await this.handleSearchTasks(args);
                    case 'get_task_stats':
                        return await this.handleGetTaskStats(args);
                    case 'create_project_memory':
                        return await this.handleCreateProjectMemory(args);
                    case 'save_project_memory':
                        return await this.handleSaveProjectMemory(args);
                    case 'load_project_memory':
                        return await this.handleLoadProjectMemory(args);
                    case 'add_symbol_info':
                        return await this.handleAddSymbolInfo(args);
                    case 'search_symbols':
                        return await this.handleSearchSymbols(args);
                    case 'search_patterns':
                        return await this.handleSearchPatterns(args);
                    case 'create_context_snapshot':
                        return await this.handleCreateContextSnapshot(args);
                    case 'load_context_snapshot':
                        return await this.handleLoadContextSnapshot(args);
                    case 'list_context_snapshots':
                        return await this.handleListContextSnapshots(args);
                    case 'get_snapshot_statistics':
                        return await this.handleGetSnapshotStatistics(args);
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
                    case 'memory://project-state':
                        return await this.handleGetProjectState();
                    case 'memory://symbol-index':
                        return await this.handleGetSymbolIndex();
                    case 'memory://performance-baseline':
                        return await this.handleGetPerformanceBaseline();
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
        if (task.metadata?.projectId) {
            await this.memoryManager.addTaskRecord(task.metadata.projectId, {
                taskId: task.id,
                action: 'updated',
                details: { updates }
            });
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
    async handleDeleteTask(args) {
        const { taskId } = args;
        const task = await this.taskManager.getTask(taskId);
        await this.taskManager.deleteTask(taskId);
        if (task?.metadata?.projectId) {
            await this.memoryManager.addTaskRecord(task.metadata.projectId, {
                taskId: task.id,
                action: 'deleted',
                details: { reason: 'user_request' }
            });
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, taskId }, null, 2)
                }
            ]
        };
    }
    async handleUpdateTaskStatus(args) {
        const { taskId, status, progress } = args;
        await this.taskManager.updateTaskStatus(taskId, status, progress);
        const task = await this.taskManager.getTask(taskId);
        if (task?.metadata?.projectId) {
            await this.memoryManager.addTaskRecord(task.metadata.projectId, {
                taskId: task.id,
                action: 'status_updated',
                details: { status, progress }
            });
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, taskId, status, progress }, null, 2)
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
    async handleSaveProjectMemory(args) {
        const { projectId } = args;
        await this.memoryManager.saveProjectMemory(projectId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, projectId, saved: true }, null, 2)
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
    async handleAddSymbolInfo(args) {
        const { projectId, symbol } = args;
        await this.memoryManager.addSymbolInfo(projectId, symbol);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, projectId, symbolAdded: symbol.name }, null, 2)
                }
            ]
        };
    }
    async handleSearchSymbols(args) {
        const { projectId, query } = args;
        const symbols = await this.memoryManager.searchSymbols(projectId, query);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(symbols, null, 2)
                }
            ]
        };
    }
    async handleSearchPatterns(args) {
        const { projectId, query } = args;
        const patterns = await this.memoryManager.searchPatterns(projectId, query);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(patterns, null, 2)
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
    async handleListContextSnapshots(args) {
        const { projectId } = args;
        const snapshots = await this.contextPreserver.listContextSnapshots(projectId);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(snapshots, null, 2)
                }
            ]
        };
    }
    async handleGetSnapshotStatistics(args) {
        const { projectId } = args;
        const stats = await this.contextPreserver.getSnapshotStatistics(projectId);
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
    async handleGetProjectState() {
        const projectState = {
            message: 'Project state endpoint - requires projectId parameter',
            example: 'Use create_project_memory or load_project_memory tools'
        };
        return {
            contents: [
                {
                    uri: 'memory://project-state',
                    mimeType: 'application/json',
                    text: JSON.stringify(projectState, null, 2)
                }
            ]
        };
    }
    async handleGetSymbolIndex() {
        const symbolIndex = {
            message: 'Symbol index endpoint - requires projectId parameter',
            example: 'Use search_symbols tool with projectId'
        };
        return {
            contents: [
                {
                    uri: 'memory://symbol-index',
                    mimeType: 'application/json',
                    text: JSON.stringify(symbolIndex, null, 2)
                }
            ]
        };
    }
    async handleGetPerformanceBaseline() {
        const performanceBaseline = {
            message: 'Performance baseline endpoint - requires projectId parameter',
            example: 'Use load_project_memory tool to get performance baseline'
        };
        return {
            contents: [
                {
                    uri: 'memory://performance-baseline',
                    mimeType: 'application/json',
                    text: JSON.stringify(performanceBaseline, null, 2)
                }
            ]
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SuperClaude Tasks Server (Memory-Enhanced) running on stdio');
    }
}
async function main() {
    try {
        const server = new SuperClaudeTasksServerMemory();
        await server.run();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=MCPServerMemory.js.map