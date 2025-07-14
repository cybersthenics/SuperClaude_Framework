#!/usr/bin/env node

/**
 * SuperClaude Quality MCP Server
 * 11-step quality validation pipeline with semantic checks and hook integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { QualityTools } from './tools/QualityTools.js';
import { QualityOrchestrator } from './core/QualityOrchestrator.js';
import { HookIntegrator } from './hooks/HookIntegrator.js';
import { Logger, LogLevel } from './utils/Logger.js';

class SuperClaudeQualityServer {
  private server: Server;
  private qualityTools: QualityTools;
  private qualityOrchestrator: QualityOrchestrator;
  private hookIntegrator: HookIntegrator;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: 'superclaude-quality',
        version: '1.0.0',
        description: 'SuperClaude Quality Validation Engine - 11-step quality pipeline with semantic checks'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.qualityTools = new QualityTools();
    this.qualityOrchestrator = new QualityOrchestrator();
    this.hookIntegrator = new HookIntegrator();
    this.logger = new Logger('SuperClaudeQualityServer', LogLevel.INFO);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing available quality tools');
      
      return {
        tools: this.qualityTools.getTools()
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.logger.info('Tool call received', { name: request.params.name });
      
      return await this.qualityTools.handleToolCall(request);
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Listing available resources');
      
      return {
        resources: [
          {
            uri: 'quality://rules',
            name: 'Quality Rules',
            description: 'Quality validation rules and configurations',
            mimeType: 'application/json'
          },
          {
            uri: 'quality://metrics',
            name: 'Quality Metrics',
            description: 'Historical quality metrics and trends',
            mimeType: 'application/json'
          },
          {
            uri: 'quality://reports',
            name: 'Validation Reports',
            description: 'Quality validation reports and analysis',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      this.logger.debug('Resource read requested', { uri: request.params.uri });
      
      const uri = request.params.uri;
      
      switch (uri) {
        case 'quality://rules':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                gates: {
                  syntax: { enabled: true, priority: 'critical', timeout: 20000 },
                  semantic: { enabled: true, priority: 'critical', timeout: 30000 },
                  type: { enabled: true, priority: 'high', timeout: 25000 },
                  import: { enabled: true, priority: 'high', timeout: 15000 },
                  lint: { enabled: true, priority: 'medium', timeout: 20000 },
                  security: { enabled: true, priority: 'critical', timeout: 40000 },
                  test: { enabled: true, priority: 'high', timeout: 50000 },
                  semanticCoverage: { enabled: true, priority: 'medium', timeout: 30000 },
                  performance: { enabled: true, priority: 'medium', timeout: 35000 },
                  documentation: { enabled: true, priority: 'low', timeout: 25000 },
                  integration: { enabled: true, priority: 'high', timeout: 45000 }
                }
              }, null, 2)
            }]
          };

        case 'quality://metrics':
          const metrics = await this.qualityOrchestrator.getQualityMetrics('current-session');
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(metrics, null, 2)
            }]
          };

        case 'quality://reports':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                message: 'No reports available yet. Run quality validation to generate reports.',
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    this.logger.info('Request handlers setup completed');
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    this.logger.info('Starting SuperClaude Quality MCP Server');
    this.logger.info('Quality validation capabilities:', {
      gates: 11,
      hookIntegration: true,
      semanticValidation: true,
      securityScanning: true,
      performanceValidation: true
    });

    try {
      await this.server.connect(transport);
      this.logger.info('SuperClaude Quality MCP Server started successfully');
    } catch (error) {
      this.logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping SuperClaude Quality MCP Server');
    await this.server.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
const server = new SuperClaudeQualityServer();
server.start().catch((error) => {
  console.error('Failed to start SuperClaude Quality MCP Server:', error);
  process.exit(1);
});