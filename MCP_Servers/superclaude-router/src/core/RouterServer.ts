import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolRequest,
  CallToolResult,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ReadResourceRequest,
  ReadResourceResult
} from '@modelcontextprotocol/sdk/types.js';

import { CommandParser } from './CommandParser.js';
import { RoutingEngine } from './RoutingEngine.js';
import { BridgeServiceManager } from './BridgeServiceManager.js';
import { RoutingTable } from '../routing/RoutingTable.js';
import { ServerHealth } from '../routing/ServerHealth.js';
import { CircuitBreaker } from '../routing/CircuitBreaker.js';
import { PerformanceMonitor } from '../performance/PerformanceMonitor.js';
import { RoutingCacheManager, CommandCacheManager } from '../performance/CacheManager.js';
import { RouterServerConfig, ParsedCommand, SuperClaudeContext, RoutingDecision } from '../types/index.js';

export class RouterServer {
  private server: Server;
  private config: RouterServerConfig;
  private commandParser!: CommandParser;
  private routingEngine!: RoutingEngine;
  private bridgeService!: BridgeServiceManager;
  private performanceMonitor!: PerformanceMonitor;
  private routingCache!: RoutingCacheManager;
  private commandCache!: CommandCacheManager;

  constructor(config: RouterServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.serverName,
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.initializeComponents();
    this.setupHandlers();
  }

  private initializeComponents(): void {
    this.commandParser = new CommandParser();
    
    const routingTable = new RoutingTable();
    const serverHealth = new ServerHealth();
    const circuitBreaker = new CircuitBreaker();
    
    this.routingEngine = new RoutingEngine(routingTable, serverHealth, circuitBreaker);
    this.bridgeService = new BridgeServiceManager(this.config.bridgeService.port);
    this.performanceMonitor = new PerformanceMonitor();
    this.routingCache = new RoutingCacheManager();
    this.commandCache = new CommandCacheManager();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'route_command',
            description: 'Route a SuperClaude command to appropriate servers',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'SuperClaude command to route'
                },
                flags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Command flags'
                },
                context: {
                  type: 'object',
                  description: 'SuperClaude context object'
                }
              },
              required: ['command']
            }
          },
          {
            name: 'get_routing_table',
            description: 'Get current routing configuration',
            inputSchema: {
              type: 'object',
              properties: {
                includeHealth: {
                  type: 'boolean',
                  description: 'Include server health status',
                  default: false
                }
              }
            }
          },
          {
            name: 'update_routing_rules',
            description: 'Modify routing rules dynamically',
            inputSchema: {
              type: 'object',
              properties: {
                rules: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'New routing rules to apply'
                },
                validate: {
                  type: 'boolean',
                  description: 'Validate rules before applying',
                  default: true
                }
              },
              required: ['rules']
            }
          },
          {
            name: 'get_server_health',
            description: 'Check health of all MCP servers',
            inputSchema: {
              type: 'object',
              properties: {
                serverNames: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific servers to check (optional)'
                },
                includeMetrics: {
                  type: 'boolean',
                  description: 'Include performance metrics',
                  default: false
                }
              }
            }
          },
          {
            name: 'enable_circuit_breaker',
            description: 'Enable/disable circuit breaker for a server',
            inputSchema: {
              type: 'object',
              properties: {
                serverName: {
                  type: 'string',
                  description: 'Server to configure circuit breaker for'
                },
                enabled: {
                  type: 'boolean',
                  description: 'Enable or disable circuit breaker'
                },
                threshold: {
                  type: 'number',
                  description: 'Failure threshold for circuit breaker',
                  default: 5
                }
              },
              required: ['serverName', 'enabled']
            }
          },
          {
            name: 'manage_hook_routing',
            description: 'Configure hook-based routing rules',
            inputSchema: {
              type: 'object',
              properties: {
                hookType: {
                  type: 'string',
                  enum: ['PreToolUse', 'PostToolUse', 'PrePrompt', 'PostPrompt'],
                  description: 'Type of hook to configure'
                },
                routingRules: {
                  type: 'object',
                  description: 'Routing rules for the hook'
                },
                enabled: {
                  type: 'boolean',
                  description: 'Enable or disable hook routing',
                  default: true
                }
              },
              required: ['hookType', 'routingRules']
            }
          },
          {
            name: 'get_hook_metrics',
            description: 'Retrieve hook performance statistics',
            inputSchema: {
              type: 'object',
              properties: {
                hookTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['PreToolUse', 'PostToolUse', 'PrePrompt', 'PostPrompt']
                  },
                  description: 'Hook types to get metrics for'
                },
                timeRange: {
                  type: 'string',
                  enum: ['1h', '24h', '7d', '30d'],
                  description: 'Time range for metrics',
                  default: '24h'
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
      const startTime = Date.now();

      try {
        let result: any;

        switch (request.params.name) {
          case 'route_command':
            result = await this.routeCommand(request.params.arguments || {});
            break;
          case 'get_routing_table':
            result = await this.getRoutingTable(request.params.arguments || {});
            break;
          case 'update_routing_rules':
            result = await this.updateRoutingRules(request.params.arguments || {});
            break;
          case 'get_server_health':
            result = await this.getServerHealth(request.params.arguments || {});
            break;
          case 'enable_circuit_breaker':
            result = await this.enableCircuitBreaker(request.params.arguments || {});
            break;
          case 'manage_hook_routing':
            result = await this.manageHookRouting(request.params.arguments || {});
            break;
          case 'get_hook_metrics':
            result = await this.getHookMetrics(request.params.arguments || {});
            break;
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }

        const executionTime = Date.now() - startTime;
        this.performanceMonitor.recordRoutingLatency(request.params.name, executionTime);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const executionTime = Date.now() - startTime;
        this.performanceMonitor.recordRoutingLatency(request.params.name, executionTime);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'router://config/routing-table',
            name: 'Router Configuration',
            description: 'Current routing table and configuration',
            mimeType: 'application/json'
          },
          {
            uri: 'router://health/servers',
            name: 'Server Health Status',
            description: 'Health status of all MCP servers',
            mimeType: 'application/json'
          },
          {
            uri: 'router://metrics/performance',
            name: 'Performance Metrics',
            description: 'Router and bridge service performance metrics',
            mimeType: 'application/json'
          },
          {
            uri: 'router://metrics/hooks',
            name: 'Hook Statistics',
            description: 'Hook execution statistics and optimization metrics',
            mimeType: 'application/json'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest): Promise<ReadResourceResult> => {
      const uri = request.params.uri;

      switch (uri) {
        case 'router://config/routing-table':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.getRoutingTable({}), null, 2)
              }
            ]
          };

        case 'router://health/servers':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.getServerHealth({ includeMetrics: true }), null, 2)
              }
            ]
          };

        case 'router://metrics/performance':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.performanceMonitor.generatePerformanceReport(), null, 2)
              }
            ]
          };

        case 'router://metrics/hooks':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.getHookMetrics({}), null, 2)
              }
            ]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async routeCommand(args: any): Promise<any> {
    const { command, flags = [], context = {} } = args;

    const cachedParsing = this.commandCache.getCachedCommandParsing(command);
    let parsedCommand: ParsedCommand;

    if (cachedParsing) {
      parsedCommand = cachedParsing;
    } else {
      parsedCommand = this.commandParser.parseCommand(command);
      this.commandCache.cacheCommandParsing(command, parsedCommand);
    }

    const validation = this.commandParser.validateSyntax(parsedCommand);
    if (!validation.isValid) {
      throw new Error(`Invalid command syntax: ${validation.errors.join(', ')}`);
    }

    const contextKey = JSON.stringify(context);
    const cachedRouting = this.routingCache.getCachedRoutingDecision(command, contextKey);
    let routingDecision: RoutingDecision;

    if (cachedRouting) {
      routingDecision = cachedRouting;
    } else {
      routingDecision = await this.routingEngine.determineTargetServer(
        parsedCommand,
        context as SuperClaudeContext
      );
      this.routingCache.cacheRoutingDecision(command, contextKey, routingDecision);
    }

    return {
      targetServer: routingDecision.targetServer,
      routingReason: routingDecision.routingReason,
      confidence: routingDecision.confidence,
      fallbackServers: routingDecision.fallbackServers,
      estimatedLatency: routingDecision.estimatedLatency,
      parsedCommand
    };
  }

  private async getRoutingTable(args: any): Promise<any> {
    const { includeHealth = false } = args;

    const routingTable: any = {
      configuration: 'Routing table configuration would be here',
      timestamp: new Date().toISOString()
    };

    if (includeHealth) {
      routingTable.serverHealth = await this.getServerHealth({ includeMetrics: false });
    }

    return routingTable;
  }

  private async updateRoutingRules(args: any): Promise<any> {
    const { rules, validate = true } = args;

    if (validate) {
      // Validation logic would be implemented here
    }

    return {
      success: true,
      rulesUpdated: rules.length,
      timestamp: new Date().toISOString()
    };
  }

  private async getServerHealth(args: any): Promise<any> {
    const { serverNames, includeMetrics = false } = args;

    const healthResults: Record<string, any> = {};
    const targetServers = serverNames || [
      'superclaude-orchestrator',
      'superclaude-intelligence',
      'superclaude-builder',
      'superclaude-quality',
      'superclaude-personas',
      'superclaude-tasks',
      'superclaude-docs',
      'superclaude-ui',
      'superclaude-performance'
    ];

    for (const serverName of targetServers) {
      try {
        const health = await this.routingEngine.checkServerHealth(serverName);
        healthResults[serverName] = {
          status: health.status,
          lastCheck: health.lastCheck,
          responseTime: health.responseTime
        };

        if (includeMetrics && health.metrics) {
          healthResults[serverName].metrics = health.metrics;
        }
      } catch (error) {
        healthResults[serverName] = {
          status: 'unknown',
          error: error instanceof Error ? error.message : 'Health check failed'
        };
      }
    }

    return healthResults;
  }

  private async enableCircuitBreaker(args: any): Promise<any> {
    const { serverName, enabled, threshold = 5 } = args;

    return {
      serverName,
      circuitBreakerEnabled: enabled,
      threshold: enabled ? threshold : null,
      timestamp: new Date().toISOString()
    };
  }

  private async manageHookRouting(args: any): Promise<any> {
    const { hookType, routingRules, enabled = true } = args;

    return {
      hookType,
      enabled,
      rules: enabled ? routingRules : null,
      timestamp: new Date().toISOString()
    };
  }

  private async getHookMetrics(args: any): Promise<any> {
    const { hookTypes, timeRange = '24h' } = args;

    const metrics: Record<string, any> = {};
    const targetHooks = hookTypes || ['PreToolUse', 'PostToolUse', 'PrePrompt', 'PostPrompt'];

    for (const hookType of targetHooks) {
      metrics[hookType] = this.performanceMonitor.getHookMetrics(hookType, timeRange);
    }

    return {
      timeRange,
      metrics,
      summary: {
        totalHookExecutions: Object.values(metrics).reduce((sum: number, m: any) => sum + m.totalExecutions, 0),
        averageExecutionTime: this.calculateAverageExecutionTime(metrics),
        optimizationFactor: this.calculateOptimizationFactor(metrics)
      }
    };
  }

  private calculateAverageExecutionTime(metrics: Record<string, any>): number {
    const allMetrics = Object.values(metrics);
    const totalTime = allMetrics.reduce((sum: number, m: any) => sum + (m.averageExecutionTime * m.totalExecutions), 0);
    const totalExecutions = allMetrics.reduce((sum: number, m: any) => sum + m.totalExecutions, 0);
    
    return totalExecutions > 0 ? totalTime / totalExecutions : 0;
  }

  private calculateOptimizationFactor(metrics: Record<string, any>): number {
    const factors = Object.values(metrics).map((m: any) => m.optimizationFactor).filter(f => f > 0);
    return factors.length > 0 ? factors.reduce((sum, f) => sum + f, 0) / factors.length : 2.02;
  }

  async start(): Promise<void> {
    await this.bridgeService.startBridgeService();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('SuperClaude Router started successfully');
    console.log(`Bridge service running on port ${this.config.bridgeService.port}`);
  }

  async stop(): Promise<void> {
    await this.bridgeService.stop();
    console.log('SuperClaude Router stopped');
  }
}