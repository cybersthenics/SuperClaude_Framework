#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuid } from 'uuid';
class SimpleTasksServer {
    server;
    tasks = new Map();
    constructor() {
        this.server = new Server({
            name: 'superclaude-tasks-simple',
            version: '3.0.0',
            capabilities: {
                tools: {}
            }
        }, {
            capabilities: {
                tools: {}
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
                        description: 'Create a new task',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
                                estimatedHours: { type: 'number' },
                                parentId: { type: 'string' }
                            },
                            required: ['title', 'description']
                        }
                    },
                    {
                        name: 'get_task',
                        description: 'Get task by ID',
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
                        description: 'Update task status',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                taskId: { type: 'string' },
                                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
                                actualHours: { type: 'number' }
                            },
                            required: ['taskId']
                        }
                    },
                    {
                        name: 'list_tasks',
                        description: 'List all tasks',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] }
                            }
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
                    }
                ]
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case 'create_task':
                    return this.createTask(args);
                case 'get_task':
                    return this.getTask(args);
                case 'update_task':
                    return this.updateTask(args);
                case 'list_tasks':
                    return this.listTasks(args);
                case 'delete_task':
                    return this.deleteTask(args);
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        });
    }
    createTask(args) {
        const { title, description, priority = 'medium', estimatedHours, parentId } = args;
        const task = {
            id: uuid(),
            title,
            description,
            status: 'pending',
            priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedHours,
            parentId,
            childrenIds: []
        };
        this.tasks.set(task.id, task);
        if (parentId) {
            const parent = this.tasks.get(parentId);
            if (parent) {
                parent.childrenIds.push(task.id);
                parent.updatedAt = new Date().toISOString();
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Task created successfully:\n${JSON.stringify(task, null, 2)}`
                }
            ]
        };
    }
    getTask(args) {
        const { taskId } = args;
        const task = this.tasks.get(taskId);
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
    updateTask(args) {
        const { taskId, status, actualHours } = args;
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new McpError(ErrorCode.InvalidRequest, `Task not found: ${taskId}`);
        }
        if (status) {
            task.status = status;
        }
        if (actualHours !== undefined) {
            task.actualHours = actualHours;
        }
        task.updatedAt = new Date().toISOString();
        return {
            content: [
                {
                    type: 'text',
                    text: `Task updated successfully:\n${JSON.stringify(task, null, 2)}`
                }
            ]
        };
    }
    listTasks(args) {
        const { status } = args;
        let tasks = Array.from(this.tasks.values());
        if (status) {
            tasks = tasks.filter(task => task.status === status);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${tasks.length} tasks:\n${JSON.stringify(tasks, null, 2)}`
                }
            ]
        };
    }
    deleteTask(args) {
        const { taskId } = args;
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new McpError(ErrorCode.InvalidRequest, `Task not found: ${taskId}`);
        }
        if (task.parentId) {
            const parent = this.tasks.get(task.parentId);
            if (parent) {
                parent.childrenIds = parent.childrenIds.filter(id => id !== taskId);
                parent.updatedAt = new Date().toISOString();
            }
        }
        this.tasks.delete(taskId);
        return {
            content: [
                {
                    type: 'text',
                    text: `Task deleted successfully: ${taskId}`
                }
            ]
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SuperClaude Tasks Simple Server running on stdio');
    }
}
async function main() {
    try {
        const server = new SimpleTasksServer();
        await server.run();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=MCPServerSimple.js.map