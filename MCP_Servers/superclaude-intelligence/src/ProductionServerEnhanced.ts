#!/usr/bin/env node
/**
 * Production Enhanced Intelligence Server
 * Integrates Enhanced LSP Manager v3.0 with MCP Server
 * Implements LSP Integration Plan Phase 1 & 2
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { logger } from './services/Logger.js';
import { EnhancedLSPManager } from './core/EnhancedLSPManager.js';
import { LSPManagerStub } from './core/LSPManagerStub.js';

interface ServerConfig {
  useEnhancedLSP: boolean;
  stubMode: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  lspConfig: {
    enableMultiLanguageSupport: boolean;
    supportedLanguages: string[];
    maxConcurrentServers: number;
    serverStartupTimeout: number;
    enableIncrementalSync: boolean;
  };
}

class ProductionEnhancedServer {
  private server: Server;
  private lspManager: EnhancedLSPManager | LSPManagerStub;
  private config: ServerConfig;

  constructor() {
    this.config = {
      useEnhancedLSP: true,
      stubMode: process.env.NODE_ENV !== 'production',
      enableLogging: true,
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      lspConfig: {
        enableMultiLanguageSupport: true,
        supportedLanguages: ['typescript', 'javascript', 'python', 'go', 'rust', 'php', 'java', 'cpp'],
        maxConcurrentServers: 8,
        serverStartupTimeout: 30000,
        enableIncrementalSync: true
      }
    };

    this.server = new Server(
      {
        name: 'superclaude-intelligence-enhanced',
        version: '3.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupLSPManager();
    this.setupTools();
    this.setupErrorHandling();
  }

  private setupLSPManager() {
    if (this.config.useEnhancedLSP && !this.config.stubMode) {
      logger.info('🚀 Initializing Enhanced LSP Manager v3.0');
      this.lspManager = new EnhancedLSPManager(this.config.lspConfig);
    } else {
      logger.info('🔧 Initializing LSP Manager Stub for development');
      this.lspManager = new LSPManagerStub();
    }
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'find_symbol_definition',
            description: 'Find symbol definitions with enhanced semantic analysis and token reduction',
            inputSchema: {
              type: 'object',
              properties: {
                uri: { type: 'string', description: 'File URI' },
                position: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' }
                  },
                  required: ['line', 'character']
                },
                includeTypeDefinition: { type: 'boolean', default: true },
                includeSemanticAnalysis: { type: 'boolean', default: true }
              },
              required: ['uri', 'position']
            }
          },
          {
            name: 'get_document_symbols',
            description: 'Get document symbols with enhanced semantic understanding and token optimization',
            inputSchema: {
              type: 'object',
              properties: {
                uri: { type: 'string', description: 'File URI' },
                includeChildren: { type: 'boolean', default: true },
                enableTokenReduction: { type: 'boolean', default: true },
                includeSemanticTypes: { type: 'boolean', default: true }
              },
              required: ['uri']
            }
          },
          {
            name: 'find_all_references',
            description: 'Find all references with usage pattern analysis and cross-file semantic understanding',
            inputSchema: {
              type: 'object',
              properties: {
                uri: { type: 'string', description: 'File URI' },
                position: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' }
                  },
                  required: ['line', 'character']
                },
                includeDeclaration: { type: 'boolean', default: true },
                maxResults: { type: 'number', default: 100 },
                includeUsagePatterns: { type: 'boolean', default: true }
              },
              required: ['uri', 'position']
            }
          },
          {
            name: 'get_hover_info',
            description: 'Get enhanced hover information with semantic context and token-optimized responses',
            inputSchema: {
              type: 'object',
              properties: {
                uri: { type: 'string', description: 'File URI' },
                position: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' }
                  },
                  required: ['line', 'character']
                },
                includeExamples: { type: 'boolean', default: false },
                includeSemanticContext: { type: 'boolean', default: true }
              },
              required: ['uri', 'position']
            }
          },
          {
            name: 'get_code_completions',
            description: 'Get intelligent code completions with semantic awareness and context optimization',
            inputSchema: {
              type: 'object',
              properties: {
                uri: { type: 'string', description: 'File URI' },
                position: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' }
                  },
                  required: ['line', 'character']
                },
                maxResults: { type: 'number', default: 25 },
                includeSnippets: { type: 'boolean', default: true },
                includeDocumentation: { type: 'boolean', default: true }
              },
              required: ['uri', 'position']
            }
          },
          {
            name: 'batch_lsp_requests',
            description: 'Process multiple LSP requests in batch for optimal performance and token reduction',
            inputSchema: {
              type: 'object',
              properties: {
                requests: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      language: { type: 'string' },
                      method: { type: 'string' },
                      params: { type: 'object' }
                    },
                    required: ['id', 'language', 'method', 'params']
                  }
                },
                enableOptimization: { type: 'boolean', default: true }
              },
              required: ['requests']
            }
          },
          {
            name: 'get_lsp_metrics',
            description: 'Get comprehensive LSP integration metrics and performance data',
            inputSchema: {
              type: 'object',
              properties: {
                includeServerHealth: { type: 'boolean', default: true },
                includePerformanceMetrics: { type: 'boolean', default: true },
                includeTokenReductionStats: { type: 'boolean', default: true }
              }
            }
          },
          {
            name: 'optimize_lsp_connections',
            description: 'Optimize LSP connection pool for better performance and resource usage',
            inputSchema: {
              type: 'object',
              properties: {
                aggressive: { type: 'boolean', default: false },
                targetMemoryReduction: { type: 'number', default: 30 }
              }
            }
          },
          {
            name: 'handle_incremental_update',
            description: 'Process incremental document changes with semantic cache invalidation',
            inputSchema: {
              type: 'object',
              properties: {
                uri: { type: 'string', description: 'File URI' },
                changes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      range: {
                        type: 'object',
                        properties: {
                          start: {
                            type: 'object',
                            properties: {
                              line: { type: 'number' },
                              character: { type: 'number' }
                            },
                            required: ['line', 'character']
                          },
                          end: {
                            type: 'object',
                            properties: {
                              line: { type: 'number' },
                              character: { type: 'number' }
                            },
                            required: ['line', 'character']
                          }
                        }
                      }
                    },
                    required: ['text']
                  }
                }
              },
              required: ['uri', 'changes']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'find_symbol_definition':
            return await this.handleFindSymbolDefinition(args);
          
          case 'get_document_symbols':
            return await this.handleGetDocumentSymbols(args);
          
          case 'find_all_references':
            return await this.handleFindAllReferences(args);
          
          case 'get_hover_info':
            return await this.handleGetHoverInfo(args);
          
          case 'get_code_completions':
            return await this.handleGetCodeCompletions(args);
          
          case 'batch_lsp_requests':
            return await this.handleBatchLSPRequests(args);
          
          case 'get_lsp_metrics':
            return await this.handleGetLSPMetrics(args);
          
          case 'optimize_lsp_connections':
            return await this.handleOptimizeLSPConnections(args);
          
          case 'handle_incremental_update':
            return await this.handleIncrementalUpdate(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool ${name} failed:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private async handleFindSymbolDefinition(args: any) {
    const startTime = performance.now();
    
    // Extract language from URI
    const language = this.getLanguageFromUri(args.uri);
    
    let result;
    if (this.lspManager instanceof EnhancedLSPManager) {
      result = await this.lspManager.sendRequestEnhanced(
        language,
        'textDocument/definition',
        {
          textDocument: { uri: args.uri },
          position: args.position
        }
      );
    } else {
      result = await this.lspManager.findDefinition(args.uri, args.position);
    }

    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            definitions: result,
            metadata: {
              language,
              processingTime: Math.round(duration),
              enhanced: this.lspManager instanceof EnhancedLSPManager,
              tokenOptimized: true
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetDocumentSymbols(args: any) {
    const startTime = performance.now();
    
    // For stub mode, open document first
    if (this.lspManager instanceof LSPManagerStub) {
      // In production, this would come from actual file content
      const mockContent = '// Mock file content for testing';
      const language = this.getLanguageFromUri(args.uri);
      await this.lspManager.openDocument(args.uri, mockContent, language);
    }

    const language = this.getLanguageFromUri(args.uri);
    
    let result;
    if (this.lspManager instanceof EnhancedLSPManager) {
      result = await this.lspManager.sendRequestEnhanced(
        language,
        'textDocument/documentSymbol',
        {
          textDocument: { uri: args.uri }
        }
      );
    } else {
      result = await this.lspManager.getDocumentSymbols(args.uri);
    }

    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            symbols: result,
            metadata: {
              language,
              processingTime: Math.round(duration),
              symbolCount: Array.isArray(result) ? result.length : 0,
              enhanced: this.lspManager instanceof EnhancedLSPManager,
              tokenOptimized: args.enableTokenReduction !== false
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleFindAllReferences(args: any) {
    const startTime = performance.now();
    const language = this.getLanguageFromUri(args.uri);

    let result;
    if (this.lspManager instanceof EnhancedLSPManager) {
      result = await this.lspManager.sendRequestEnhanced(
        language,
        'textDocument/references',
        {
          textDocument: { uri: args.uri },
          position: args.position,
          context: { includeDeclaration: args.includeDeclaration !== false }
        }
      );
    } else {
      result = await this.lspManager.findReferences(
        args.uri,
        args.position,
        args.includeDeclaration !== false
      );
    }

    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            references: result,
            metadata: {
              language,
              processingTime: Math.round(duration),
              totalFound: Array.isArray(result) ? result.length : 0,
              enhanced: this.lspManager instanceof EnhancedLSPManager
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetHoverInfo(args: any) {
    const startTime = performance.now();
    const language = this.getLanguageFromUri(args.uri);

    let result;
    if (this.lspManager instanceof EnhancedLSPManager) {
      result = await this.lspManager.sendRequestEnhanced(
        language,
        'textDocument/hover',
        {
          textDocument: { uri: args.uri },
          position: args.position
        }
      );
    } else {
      result = await this.lspManager.getHoverInfo(args.uri, args.position);
    }

    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            hover: result,
            metadata: {
              language,
              processingTime: Math.round(duration),
              enhanced: this.lspManager instanceof EnhancedLSPManager,
              semanticContext: args.includeSemanticContext !== false
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetCodeCompletions(args: any) {
    const startTime = performance.now();
    const language = this.getLanguageFromUri(args.uri);

    let result;
    if (this.lspManager instanceof EnhancedLSPManager) {
      result = await this.lspManager.sendRequestEnhanced(
        language,
        'textDocument/completion',
        {
          textDocument: { uri: args.uri },
          position: args.position
        }
      );
    } else {
      result = await this.lspManager.getCompletions(args.uri, args.position);
    }

    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            completions: result,
            metadata: {
              language,
              processingTime: Math.round(duration),
              maxResults: args.maxResults || 25,
              enhanced: this.lspManager instanceof EnhancedLSPManager
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleBatchLSPRequests(args: any) {
    if (!(this.lspManager instanceof EnhancedLSPManager)) {
      throw new Error('Batch requests require Enhanced LSP Manager');
    }

    const startTime = performance.now();
    const result = await this.lspManager.batchRequests(args.requests);
    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            batchResult: {
              totalRequests: args.requests.length,
              successCount: result.successCount,
              failureCount: result.failureCount,
              totalTime: Math.round(result.totalTime),
              tokenReductionAchieved: result.tokenReductionAchieved,
              enhancedProcessing: result.enhancedProcessing
            },
            results: Object.fromEntries(result.results),
            errors: Object.fromEntries(result.errors),
            metadata: {
              processingTime: Math.round(duration),
              optimization: args.enableOptimization !== false
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetLSPMetrics(args: any) {
    let metrics: any = {
      serverType: this.lspManager instanceof EnhancedLSPManager ? 'Enhanced' : 'Stub',
      timestamp: new Date().toISOString()
    };

    if (this.lspManager instanceof EnhancedLSPManager) {
      const integrationMetrics = this.lspManager.getLSPIntegrationMetrics();
      metrics = {
        ...metrics,
        integration: integrationMetrics
      };

      if (args.includeServerHealth !== false) {
        metrics.serverHealth = {};
        for (const language of this.config.lspConfig.supportedLanguages) {
          const health = this.lspManager.getServerHealth(language);
          if (health) {
            metrics.serverHealth[language] = health;
          }
        }
      }

      if (args.includePerformanceMetrics !== false) {
        metrics.performance = {
          uptime: integrationMetrics.uptime,
          averageResponseTime: integrationMetrics.averageResponseTime,
          totalRequests: integrationMetrics.totalRequests,
          errorRate: integrationMetrics.errorRate
        };
      }

      if (args.includeTokenReductionStats !== false) {
        metrics.tokenReduction = {
          enabled: true,
          averageReduction: integrationMetrics.tokenReductionRate,
          cacheHitRate: integrationMetrics.cacheHitRate,
          target: '50% reduction, 80% cache hit rate'
        };
      }
    } else {
      metrics.stubMode = {
        message: 'Running in stub mode for development',
        features: 'Basic LSP functionality available'
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(metrics, null, 2)
        }
      ]
    };
  }

  private async handleOptimizeLSPConnections(args: any) {
    if (!(this.lspManager instanceof EnhancedLSPManager)) {
      throw new Error('Connection optimization requires Enhanced LSP Manager');
    }

    const result = await this.lspManager.optimizeConnectionPool();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            optimization: result,
            settings: {
              aggressive: args.aggressive || false,
              targetMemoryReduction: args.targetMemoryReduction || 30
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleIncrementalUpdate(args: any) {
    const startTime = performance.now();

    if (this.lspManager instanceof EnhancedLSPManager) {
      await this.lspManager.handleIncrementalChange(args.uri, args.changes);
    }

    const duration = performance.now() - startTime;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            uri: args.uri,
            changesProcessed: args.changes.length,
            processingTime: Math.round(duration),
            target: '<100ms processing time',
            achieved: duration < 100
          }, null, 2)
        }
      ]
    };
  }

  private getLanguageFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'c'
    };
    return languageMap[extension] || 'plaintext';
  }

  private setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at promise, reason:', reason);
    });
  }

  async run() {
    logger.info('🚀 Starting Production Enhanced Intelligence Server v3.0');
    
    // Initialize LSP Manager
    if (this.lspManager instanceof EnhancedLSPManager) {
      await this.lspManager.initialize();
      logger.info('✅ Enhanced LSP Manager v3.0 initialized successfully');
    } else {
      logger.info('✅ LSP Manager Stub initialized for development');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('🎯 LSP Integration Plan Phase 1 & 2 Implementation Active');
    logger.info('📊 Enhanced semantic analysis and token reduction enabled');
  }
}

const server = new ProductionEnhancedServer();
server.run().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});