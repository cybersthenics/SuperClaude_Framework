#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TaskManagerSimple } from './core/TaskManagerSimple.js';
import { CreateTaskRequestSchema } from './types/working.js';
export class SuperClaudeTasksServerWorking {
    server;
    taskManager;
    constructor() {
        this.taskManager = new TaskManagerSimple();
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
                    case 'update_task_status':
                        return await this.handleUpdateTaskStatus(args);
                    case 'search_tasks':
                        return await this.handleSearchTasks(args);
                    case 'get_task_stats':
                        return await this.handleGetTaskStats(args);
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
    async handleUpdateTaskStatus(args) {
        const { taskId, status, progress } = args;
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
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SuperClaude Tasks Server running on stdio');
    }
}
async function main() {
    try {
        const server = new SuperClaudeTasksServerWorking();
        await server.run();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=MCPServerWorking.js.map