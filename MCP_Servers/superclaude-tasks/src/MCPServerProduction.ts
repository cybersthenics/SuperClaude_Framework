#!/usr/bin/env node

// SuperClaude Tasks Server - Production-Ready MCP Server Implementation
// Complete integration with all components: Tasks, Memory, Coordination, Integration, Optimization, Recovery, Monitoring

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';

import { TaskManagerSimple } from './core/TaskManagerSimple.js';
import { ProjectMemoryManager } from './memory/ProjectMemoryManager.js';
import { ContextPreserver } from './memory/ContextPreserver.js';
import { SubAgentCoordinator } from './coordination/SubAgentCoordinator.js';
import { WorkflowOrchestrator } from './coordination/WorkflowOrchestrator.js';
import { SuperClaudeIntegration } from './integration/SuperClaudeIntegration.js';
import { PerformanceOptimizer } from './optimization/PerformanceOptimizer.js';
import { ErrorRecoverySystem } from './recovery/ErrorRecoverySystem.js';
import { HealthMonitor } from './monitoring/HealthMonitor.js';
import { 
  CreateTaskRequestSchema, 
  DecomposeTaskRequestSchema, 
  DistributeToSubAgentsRequestSchema,
  ValidationError
} from './types/working.js';

export class SuperClaudeTasksServerProduction {
  private server: Server;
  private taskManager: TaskManagerSimple;
  private memoryManager: ProjectMemoryManager;
  private contextPreserver: ContextPreserver;
  private subAgentCoordinator: SubAgentCoordinator;
  private workflowOrchestrator: WorkflowOrchestrator;
  private superClaudeIntegration: SuperClaudeIntegration;
  private performanceOptimizer: PerformanceOptimizer;
  private errorRecoverySystem: ErrorRecoverySystem;
  private healthMonitor: HealthMonitor;
  private shutdownHandler: (() => Promise<void>) | null = null;

  constructor() {
    // Initialize all components
    this.taskManager = new TaskManagerSimple();
    this.memoryManager = new ProjectMemoryManager();
    this.contextPreserver = new ContextPreserver(this.memoryManager);
    this.subAgentCoordinator = new SubAgentCoordinator();
    this.workflowOrchestrator = new WorkflowOrchestrator(this.subAgentCoordinator);
    this.superClaudeIntegration = new SuperClaudeIntegration();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.errorRecoverySystem = new ErrorRecoverySystem();
    this.healthMonitor = new HealthMonitor();
    
    this.server = new Server({
      name: 'superclaude-tasks-production',
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
    this.setupGracefulShutdown();
    
    this.healthMonitor.log('info', 'SuperClaude Tasks Server initialized', 'server', {
      version: '3.0.0',
      components: [
        'TaskManager', 'MemoryManager', 'ContextPreserver', 'SubAgentCoordinator',
        'WorkflowOrchestrator', 'SuperClaudeIntegration', 'PerformanceOptimizer',
        'ErrorRecoverySystem', 'HealthMonitor'
      ]
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Task Management Tools
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
          
          // Memory Management Tools
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
          
          // Sub-Agent Coordination Tools
          {
            name: 'register_agent',
            description: 'Register a new sub-agent for task distribution',
            inputSchema: {
              type: 'object',
              properties: {
                agentInfo: { type: 'object' }
              },
              required: ['agentInfo']
            }
          },
          {
            name: 'distribute_to_sub_agents',
            description: 'Distribute task to sub-agents with specified strategy',
            inputSchema: DistributeToSubAgentsRequestSchema
          },
          {
            name: 'coordinate_workflow',
            description: 'Coordinate workflow execution with specified strategy',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: { type: 'string' },
                strategy: { type: 'string' },
                maxConcurrency: { type: 'number' },
                timeout: { type: 'number' },
                failureStrategy: { type: 'string' }
              },
              required: ['workflowId', 'strategy', 'maxConcurrency', 'timeout', 'failureStrategy']
            }
          },
          
          // SuperClaude Integration Tools
          {
            name: 'make_cross_server_request',
            description: 'Make request to another SuperClaude server',
            inputSchema: {
              type: 'object',
              properties: {
                targetServer: { type: 'string' },
                operation: { type: 'string' },
                data: { type: 'object' },
                timeout: { type: 'number' }
              },
              required: ['targetServer', 'operation', 'data']
            }
          },
          {
            name: 'get_server_health',
            description: 'Get health status of SuperClaude servers',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          
          // Performance & Monitoring Tools
          {
            name: 'get_performance_metrics',
            description: 'Get system performance metrics',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'get_system_health',
            description: 'Get overall system health status',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'get_error_statistics',
            description: 'Get error and recovery statistics',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'acknowledge_alert',
            description: 'Acknowledge a system alert',
            inputSchema: {
              type: 'object',
              properties: {
                alertId: { type: 'string' },
                acknowledgedBy: { type: 'string' }
              },
              required: ['alertId', 'acknowledgedBy']
            }
          },
          
          // Administrative Tools
          {
            name: 'generate_system_report',
            description: 'Generate comprehensive system report',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'clear_caches',
            description: 'Clear all system caches',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'system://health',
            name: 'System Health',
            description: 'Overall system health and component status',
            mimeType: 'application/json'
          },
          {
            uri: 'system://metrics',
            name: 'System Metrics',
            description: 'Performance metrics and system statistics',
            mimeType: 'application/json'
          },
          {
            uri: 'system://logs',
            name: 'System Logs',
            description: 'Recent system logs and events',
            mimeType: 'application/json'
          },
          {
            uri: 'system://alerts',
            name: 'System Alerts',
            description: 'Active system alerts and notifications',
            mimeType: 'application/json'
          },
          {
            uri: 'integration://servers',
            name: 'SuperClaude Servers',
            description: 'Status and information about connected SuperClaude servers',
            mimeType: 'application/json'
          },
          {
            uri: 'coordination://workflows',
            name: 'Active Workflows',
            description: 'Currently running workflows and their status',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const correlationId = this.generateCorrelationId();
      
      this.healthMonitor.log('info', `Tool call: ${name}`, 'server', { args }, correlationId);

      try {
        // Use performance optimizer for caching
        const result = await this.performanceOptimizer.cacheOperation(
          `tool:${name}:${JSON.stringify(args)}`,
          async () => {
            switch (name) {
              // Task Management Tools
              case 'create_task':
                return await this.handleCreateTask(args, correlationId);
              case 'get_task':
                return await this.handleGetTask(args, correlationId);
              case 'search_tasks':
                return await this.handleSearchTasks(args, correlationId);
              case 'get_task_stats':
                return await this.handleGetTaskStats(args, correlationId);
              
              // Memory Management Tools
              case 'create_project_memory':
                return await this.handleCreateProjectMemory(args, correlationId);
              case 'create_context_snapshot':
                return await this.handleCreateContextSnapshot(args, correlationId);
              
              // Sub-Agent Coordination Tools
              case 'register_agent':
                return await this.handleRegisterAgent(args, correlationId);
              case 'distribute_to_sub_agents':
                return await this.handleDistributeToSubAgents(args, correlationId);
              case 'coordinate_workflow':
                return await this.handleCoordinateWorkflow(args, correlationId);
              
              // SuperClaude Integration Tools
              case 'make_cross_server_request':
                return await this.handleMakeCrossServerRequest(args, correlationId);
              case 'get_server_health':
                return await this.handleGetServerHealth(args, correlationId);
              
              // Performance & Monitoring Tools
              case 'get_performance_metrics':
                return await this.handleGetPerformanceMetrics(args, correlationId);
              case 'get_system_health':
                return await this.handleGetSystemHealth(args, correlationId);
              case 'get_error_statistics':
                return await this.handleGetErrorStatistics(args, correlationId);
              case 'acknowledge_alert':
                return await this.handleAcknowledgeAlert(args, correlationId);
              
              // Administrative Tools
              case 'generate_system_report':
                return await this.handleGenerateSystemReport(args, correlationId);
              case 'clear_caches':
                return await this.handleClearCaches(args, correlationId);
              
              default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
          }
        );
        
        this.healthMonitor.log('info', `Tool call completed: ${name}`, 'server', { success: true }, correlationId);
        return result;
        
      } catch (error) {
        // Handle error with recovery system
        const recovered = await this.errorRecoverySystem.handleError(
          error as Error,
          {
            operation: name,
            component: 'server',
            timestamp: new Date(),
            requestId: correlationId,
            metadata: { args }
          },
          'medium',
          'business'
        );
        
        this.healthMonitor.log('error', `Tool call failed: ${name}`, 'server', { 
          error: (error as Error).message,
          recovered
        }, correlationId);
        
        if (!recovered) {
          throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${(error as Error).message}`);
        }
        
        // Return error response if not recovered
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Tool execution failed',
                message: (error as Error).message,
                recovered: false
              }, null, 2)
            }
          ]
        };
      }
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const correlationId = this.generateCorrelationId();
      
      this.healthMonitor.log('info', `Resource read: ${uri}`, 'server', {}, correlationId);

      try {
        switch (uri) {
          case 'system://health':
            return await this.handleGetSystemHealthResource();
          case 'system://metrics':
            return await this.handleGetSystemMetricsResource();
          case 'system://logs':
            return await this.handleGetSystemLogsResource();
          case 'system://alerts':
            return await this.handleGetSystemAlertsResource();
          case 'integration://servers':
            return await this.handleGetIntegrationServersResource();
          case 'coordination://workflows':
            return await this.handleGetCoordinationWorkflowsResource();
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
        }
      } catch (error) {
        this.healthMonitor.log('error', `Resource read failed: ${uri}`, 'server', { 
          error: (error as Error).message
        }, correlationId);
        throw new McpError(ErrorCode.InternalError, `Resource read failed: ${(error as Error).message}`);
      }
    });
  }

  // Tool handler implementations
  private async handleCreateTask(args: any, correlationId: string): Promise<any> {
    const result = await this.taskManager.createTask(args);
    
    // Add to project memory if available
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

  private async handleGetTask(args: any, correlationId: string): Promise<any> {
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

  private async handleSearchTasks(args: any, correlationId: string): Promise<any> {
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

  private async handleGetTaskStats(args: any, correlationId: string): Promise<any> {
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

  private async handleCreateProjectMemory(args: any, correlationId: string): Promise<any> {
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

  private async handleCreateContextSnapshot(args: any, correlationId: string): Promise<any> {
    const { projectId, contextData, description } = args;
    const snapshot = await this.contextPreserver.createContextSnapshot(
      projectId, 
      contextData, 
      description
    );
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(snapshot, null, 2)
        }
      ]
    };
  }

  private async handleRegisterAgent(args: any, correlationId: string): Promise<any> {
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

  private async handleDistributeToSubAgents(args: any, correlationId: string): Promise<any> {
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

  private async handleCoordinateWorkflow(args: any, correlationId: string): Promise<any> {
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

  private async handleMakeCrossServerRequest(args: any, correlationId: string): Promise<any> {
    const { targetServer, operation, data, timeout = 5000 } = args;
    
    const response = await this.superClaudeIntegration.makeRequest({
      sourceServer: 'superclaude-tasks',
      targetServer,
      operation,
      data,
      timeout,
      retries: 1
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }

  private async handleGetServerHealth(args: any, correlationId: string): Promise<any> {
    const healthChecks = this.superClaudeIntegration.getHealthChecks();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(healthChecks, null, 2)
        }
      ]
    };
  }

  private async handleGetPerformanceMetrics(args: any, correlationId: string): Promise<any> {
    const metrics = this.performanceOptimizer.getMetrics();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(metrics, null, 2)
        }
      ]
    };
  }

  private async handleGetSystemHealth(args: any, correlationId: string): Promise<any> {
    const health = this.healthMonitor.getSystemHealth();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(health, null, 2)
        }
      ]
    };
  }

  private async handleGetErrorStatistics(args: any, correlationId: string): Promise<any> {
    const stats = this.errorRecoverySystem.getErrorStatistics();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2)
        }
      ]
    };
  }

  private async handleAcknowledgeAlert(args: any, correlationId: string): Promise<any> {
    const { alertId, acknowledgedBy } = args;
    this.healthMonitor.acknowledgeAlert(alertId, acknowledgedBy);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, alertId, acknowledgedBy }, null, 2)
        }
      ]
    };
  }

  private async handleGenerateSystemReport(args: any, correlationId: string): Promise<any> {
    const report = {
      timestamp: new Date(),
      systemHealth: this.healthMonitor.getSystemHealth(),
      performanceMetrics: this.performanceOptimizer.getMetrics(),
      errorStatistics: this.errorRecoverySystem.getErrorStatistics(),
      integrationMetrics: this.superClaudeIntegration.getIntegrationMetrics(),
      coordinationMetrics: this.subAgentCoordinator.getCoordinationMetrics(),
      monitoringStatistics: this.healthMonitor.getMonitoringStatistics()
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }
      ]
    };
  }

  private async handleClearCaches(args: any, correlationId: string): Promise<any> {
    this.performanceOptimizer.clearAllCaches();
    this.superClaudeIntegration.clearCache();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, message: 'All caches cleared' }, null, 2)
        }
      ]
    };
  }

  // Resource handler implementations
  private async handleGetSystemHealthResource(): Promise<any> {
    const health = this.healthMonitor.getSystemHealth();
    
    return {
      contents: [
        {
          uri: 'system://health',
          mimeType: 'application/json',
          text: JSON.stringify(health, null, 2)
        }
      ]
    };
  }

  private async handleGetSystemMetricsResource(): Promise<any> {
    const metrics = this.performanceOptimizer.getMetrics();
    
    return {
      contents: [
        {
          uri: 'system://metrics',
          mimeType: 'application/json',
          text: JSON.stringify(metrics, null, 2)
        }
      ]
    };
  }

  private async handleGetSystemLogsResource(): Promise<any> {
    const logs = this.healthMonitor.getLogs(100);
    
    return {
      contents: [
        {
          uri: 'system://logs',
          mimeType: 'application/json',
          text: JSON.stringify(logs, null, 2)
        }
      ]
    };
  }

  private async handleGetSystemAlertsResource(): Promise<any> {
    const alerts = this.healthMonitor.getAlerts(50);
    
    return {
      contents: [
        {
          uri: 'system://alerts',
          mimeType: 'application/json',
          text: JSON.stringify(alerts, null, 2)
        }
      ]
    };
  }

  private async handleGetIntegrationServersResource(): Promise<any> {
    const servers = this.superClaudeIntegration.getAllServers();
    
    return {
      contents: [
        {
          uri: 'integration://servers',
          mimeType: 'application/json',
          text: JSON.stringify(servers, null, 2)
        }
      ]
    };
  }

  private async handleGetCoordinationWorkflowsResource(): Promise<any> {
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

  // Utility methods
  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup graceful shutdown
  private setupGracefulShutdown(): void {
    this.shutdownHandler = async () => {
      this.healthMonitor.log('info', 'Graceful shutdown initiated', 'server');
      
      try {
        // Shutdown all components in reverse order
        await this.healthMonitor.shutdown();
        await this.errorRecoverySystem.shutdown();
        await this.performanceOptimizer.shutdown();
        await this.superClaudeIntegration.shutdown();
        await this.workflowOrchestrator.shutdown();
        await this.subAgentCoordinator.shutdown();
        
        this.healthMonitor.log('info', 'Graceful shutdown completed', 'server');
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
    };

    // Handle shutdown signals
    process.on('SIGINT', this.shutdownHandler);
    process.on('SIGTERM', this.shutdownHandler);
    process.on('SIGQUIT', this.shutdownHandler);
  }

  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.healthMonitor.log('info', 'SuperClaude Tasks Server (Production) running on stdio', 'server', {
        version: '3.0.0',
        timestamp: new Date()
      });
      
      console.error('SuperClaude Tasks Server (Production) running on stdio');
    } catch (error) {
      this.healthMonitor.log('error', 'Failed to start server', 'server', { error: (error as Error).message });
      throw error;
    }
  }
}

// Run the server
async function main() {
  try {
    const server = new SuperClaudeTasksServerProduction();
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error);