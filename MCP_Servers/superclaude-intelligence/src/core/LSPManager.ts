/**
 * LSPManager - Language Server Protocol Manager
 * Manages lifecycle and communication with multiple language servers
 */

import { spawn, ChildProcess } from 'child_process';
import { 
  MessageConnection,
  ProtocolConnection,
  RequestType,
  NotificationType,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  ServerCapabilities,
  Position,
  Range
} from 'vscode-languageserver-protocol';
// Temporary stub for LSP connection creation
function createConnection(transport: any, logger?: any): any {
  return {
    sendRequest: async (method: string, params?: any) => {
      // Stub implementation - will be replaced with actual LSP client
      return {};
    },
    sendNotification: async (method: string, params?: any) => {
      // Stub implementation
    },
    onClose: (handler: () => void) => {
      // Stub implementation
    },
    onError: (handler: (error: any) => void) => {
      // Stub implementation
    }
  };
}

function createClientPipeTransport(stdout: any, stdin: any): any {
  return { stdout, stdin };
}
import { EventEmitter } from 'events';
import { 
  LanguageServerConfig, 
  LanguageServerInstance, 
  ServerStatus, 
  ServerMetrics,
  IntelligenceServerConfig,
  PerformanceMetrics,
  LSPConnectionPool,
  LSPPerformanceMetrics,
  TokenReductionMetrics,
  ConnectionOptimizationResult,
  SemanticAnalysisResult,
  IncrementalUpdateTask,
  DocumentChange,
  SemanticCacheEntry,
  CacheEntryMetadata,
  LSPBatchRequest,
  LSPBatchResult,
  LSPRequestMetrics,
  LSPIntegrationMetrics,
  ConnectionOptimization
} from '../types/index.js';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';

export class LSPManager extends EventEmitter {
  private servers: Map<string, LanguageServerInstance> = new Map();
  private configs: Map<string, LanguageServerConfig> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cacheManager: CacheManager;
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  
  // Enhanced LSP v3.0 features
  private connectionPool: LSPConnectionPool;
  private incrementalUpdates: Map<string, IncrementalUpdateTask[]> = new Map();
  private batchQueue: Map<string, LSPBatchRequest[]> = new Map();
  private tokenReductionEnabled: boolean = true;
  private semanticCache: Map<string, SemanticCacheEntry> = new Map();
  private requestMetrics: Map<string, LSPRequestMetrics> = new Map();

  constructor(private config: IntelligenceServerConfig['lsp']) {
    super();
    this.cacheManager = new CacheManager({
      maxSize: 1000,
      ttl: this.config.enableIncrementalSync ? 300000 : 60000 // 5 min or 1 min
    });
    
    // Initialize connection pool
    this.connectionPool = {
      connections: new Map(),
      activeConnections: new Map(),
      connectionMetrics: new Map(),
      maxPoolSize: this.config.maxConcurrentServers || 8,
      healthCheckInterval: 30000
    };
    
    this.initializeLanguageServerConfigs();
    this.startBatchProcessor();
    this.startIncrementalUpdateProcessor();
  }

  private initializeLanguageServerConfigs(): void {
    // Python Language Server Configuration
    this.configs.set('python', {
      language: 'python',
      serverId: 'pylsp',
      command: 'pylsp',
      args: [],
      initializationOptions: {
        settings: {
          pylsp: {
            plugins: {
              pycodestyle: { enabled: true },
              pyflakes: { enabled: true },
              pylint: { enabled: true },
              rope_completion: { enabled: true },
              jedi_completion: { enabled: true },
              jedi_hover: { enabled: true },
              jedi_references: { enabled: true },
              jedi_signature_help: { enabled: true },
              jedi_symbols: { enabled: true }
            }
          }
        }
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });

    // TypeScript Language Server Configuration
    this.configs.set('typescript', {
      language: 'typescript',
      serverId: 'typescript-language-server',
      command: 'typescript-language-server',
      args: ['--stdio'],
      initializationOptions: {
        preferences: {
          includeInlayParameterNameHints: 'all',
          includeInlayParameterNameHintsWhenArgumentMatchesName: false,
          includeInlayFunctionParameterTypeHints: true,
          includeInlayVariableTypeHints: true,
          includeInlayPropertyDeclarationTypeHints: true,
          includeInlayFunctionLikeReturnTypeHints: true
        }
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: {
          triggerCharacters: ['.', '/', '@']
        },
        signatureHelpProvider: {
          triggerCharacters: ['(', ',']
        },
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true,
        renameProvider: true,
        codeActionProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });

    // JavaScript (uses same as TypeScript)
    this.configs.set('javascript', {
      ...this.configs.get('typescript')!,
      language: 'javascript',
      serverId: 'javascript-typescript-language-server'
    });

    // Go Language Server Configuration
    this.configs.set('go', {
      language: 'go',
      serverId: 'gopls',
      command: 'gopls',
      args: ['-remote=auto'],
      initializationOptions: {
        usePlaceholders: true,
        completeUnimported: true,
        deepCompletion: true,
        matcher: 'fuzzy'
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true,
        renameProvider: true,
        codeActionProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });

    // Rust Language Server Configuration  
    this.configs.set('rust', {
      language: 'rust',
      serverId: 'rust-analyzer',
      command: 'rust-analyzer',
      args: [],
      initializationOptions: {
        cargo: {
          buildScripts: {
            enable: true
          }
        },
        procMacro: {
          enable: true
        },
        diagnostics: {
          enable: true,
          experimental: {
            enable: true
          }
        }
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true,
        renameProvider: true,
        codeActionProvider: true,
        inlayHintProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });

    // PHP Language Server Configuration
    this.configs.set('php', {
      language: 'php',
      serverId: 'intelephense',
      command: 'intelephense',
      args: ['--stdio'],
      initializationOptions: {
        storagePath: '/tmp/intelephense',
        clearCache: false
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true,
        renameProvider: true,
        codeActionProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });

    // Java Language Server Configuration
    this.configs.set('java', {
      language: 'java',
      serverId: 'eclipse.jdt.ls',
      command: 'java',
      args: [
        '-Declipse.application=org.eclipse.jdt.ls.core.id1',
        '-Dosgi.bundles.defaultStartLevel=4',
        '-Declipse.product=org.eclipse.jdt.ls.core.product',
        '-jar',
        '/path/to/jdtls/plugins/org.eclipse.equinox.launcher_*.jar',
        '-configuration',
        '/path/to/jdtls/config_linux',
        '-data',
        '/tmp/jdtls-workspace'
      ],
      initializationOptions: {
        workspaceFolders: null,
        settings: {
          java: {
            configuration: {
              updateBuildConfiguration: 'interactive'
            }
          }
        }
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true,
        renameProvider: true,
        codeActionProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });

    // C++ Language Server Configuration
    this.configs.set('cpp', {
      language: 'cpp',
      serverId: 'clangd',
      command: 'clangd',
      args: ['--header-insertion=never', '--completion-style=detailed'],
      initializationOptions: {
        clangdFileStatus: true,
        usePlaceholders: true,
        completeUnimported: true,
        semanticHighlighting: true
      },
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        completionProvider: true,
        signatureHelpProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        implementationProvider: true,
        typeDefinitionProvider: true,
        renameProvider: true,
        codeActionProvider: true
      },
      healthCheckInterval: 30000,
      maxRestartAttempts: 3
    });
  }

  async initializeLanguageServer(language: string): Promise<LanguageServerInstance> {
    const existingServer = this.servers.get(language);
    if (existingServer && existingServer.status.state === 'running') {
      return existingServer;
    }

    const config = this.configs.get(language);
    if (!config) {
      throw new Error(`Language server configuration not found for: ${language}`);
    }

    try {
      const server = await this.startServer(config);
      this.servers.set(language, server);
      this.startHealthCheck(language);
      
      logger.info(`Language server initialized for ${language}`, {
        serverId: server.serverId,
        pid: server.process?.pid
      });

      this.emit('serverInitialized', { language, server });
      return server;
    } catch (error) {
      logger.error(`Failed to initialize language server for ${language}`, error);
      throw error;
    }
  }

  async sendRequest<T>(language: string, method: string, params: any): Promise<T> {
    // Use the enhanced request method for better performance and token reduction
    return this.sendRequestEnhanced<T>(language, method, params);
  }

  async sendNotification(language: string, method: string, params: any): Promise<void> {
    const server = await this.getOrInitializeServer(language);
    
    try {
      await server.connection.sendNotification(method, params);
      this.updateServerMetrics(language, 'notification');
    } catch (error) {
      this.updateServerMetrics(language, 'error');
      logger.error(`LSP notification failed for ${language}:${method}`, error);
      throw error;
    }
  }

  async getServerCapabilities(language: string): Promise<ServerCapabilities> {
    const server = await this.getOrInitializeServer(language);
    return server.capabilities;
  }

  async synchronizeDocument(uri: string, content: string, language: string): Promise<void> {
    if (!this.config.enableIncrementalSync) {
      return;
    }

    const cacheKey = `sync:${uri}`;
    const lastContent = this.cacheManager.get<string>(cacheKey);
    
    if (lastContent === content) {
      return; // No changes
    }

    await this.sendNotification(language, 'textDocument/didChange', {
      textDocument: { uri, version: Date.now() },
      contentChanges: [{
        text: content
      }]
    });

    this.cacheManager.set(cacheKey, content);
  }

  async shutdownServer(language: string): Promise<void> {
    const server = this.servers.get(language);
    if (!server) {
      return;
    }

    try {
      // Clear health check
      const interval = this.healthCheckIntervals.get(language);
      if (interval) {
        clearInterval(interval);
        this.healthCheckIntervals.delete(language);
      }

      // Send shutdown request
      await server.connection.sendRequest('shutdown');
      await server.connection.sendNotification('exit');

      // Kill process if still running
      if (server.process && !server.process.killed) {
        server.process.kill();
      }

      // Update status
      server.status.state = 'stopped';
      this.servers.delete(language);

      logger.info(`Language server shutdown for ${language}`);
      this.emit('serverStopped', { language });
    } catch (error) {
      logger.error(`Error shutting down language server for ${language}`, error);
      throw error;
    }
  }

  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.servers.keys()).map(language => 
      this.shutdownServer(language)
    );

    await Promise.allSettled(shutdownPromises);
  }

  getServerStatus(language: string): ServerStatus | null {
    const server = this.servers.get(language);
    return server ? server.status : null;
  }

  getServerMetrics(language: string): ServerMetrics | null {
    const server = this.servers.get(language);
    return server ? server.metrics : null;
  }

  getAllServerStatuses(): Map<string, ServerStatus> {
    const statuses = new Map<string, ServerStatus>();
    for (const [language, server] of this.servers) {
      statuses.set(language, server.status);
    }
    return statuses;
  }

  private async startServer(config: LanguageServerConfig): Promise<LanguageServerInstance> {
    const serverProcess = spawn(config.command, config.args, {
      stdio: 'pipe',
      env: { ...process.env }
    });

    const connection = createConnection(
      createClientPipeTransport(serverProcess.stdout, serverProcess.stdin),
      null as any
    );

    const server: LanguageServerInstance = {
      serverId: config.serverId,
      process: serverProcess,
      connection,
      capabilities: {},
      status: {
        state: 'starting',
        pid: serverProcess.pid,
        startTime: new Date(),
        restartCount: 0
      },
      metrics: {
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      lastHeartbeat: new Date()
    };

    // Setup connection handlers
    connection.onClose(() => {
      server.status.state = 'stopped';
      this.emit('serverStopped', { language: config.language });
    });

    connection.onError((error) => {
      server.status.state = 'error';
      server.status.lastError = error;
      this.emit('serverError', { language: config.language, error });
    });

    // Initialize the server
    const initializeParams: InitializeParams = {
      processId: serverProcess.pid || null,
      rootUri: null,
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: true,
            willSave: true,
            willSaveWaitUntil: true,
            didSave: true
          },
          completion: {
            dynamicRegistration: true,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ['markdown', 'plaintext']
            }
          }
        }
      },
      initializationOptions: config.initializationOptions,
      workspaceFolders: null
    };

    try {
      await connection.sendRequest('initialize', initializeParams);
      await connection.sendNotification('initialized', {});
      
      server.status.state = 'running';
      server.capabilities = config.capabilities;
      
      return server;
    } catch (error) {
      server.status.state = 'error';
      server.status.lastError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  private async getOrInitializeServer(language: string): Promise<LanguageServerInstance> {
    // Use the enhanced pooled connection system
    return this.getPooledConnection(language);
  }

  private startHealthCheck(language: string): void {
    const config = this.configs.get(language);
    if (!config) return;

    const interval = setInterval(async () => {
      await this.performHealthCheck(language);
    }, config.healthCheckInterval);

    this.healthCheckIntervals.set(language, interval);
  }

  private async performHealthCheck(language: string): Promise<void> {
    const server = this.servers.get(language);
    if (!server) return;

    try {
      // Simple health check - send a lightweight request
      await server.connection.sendRequest('textDocument/documentSymbol', {
        textDocument: { uri: 'file:///tmp/healthcheck.tmp' }
      });
      
      server.lastHeartbeat = new Date();
      
      if (server.status.state === 'error') {
        server.status.state = 'running';
        this.emit('serverRecovered', { language });
      }
    } catch (error) {
      server.status.state = 'error';
      server.status.lastError = error instanceof Error ? error : new Error(String(error));
      
      logger.warn(`Health check failed for ${language}`, error);
      this.emit('serverHealthCheckFailed', { language, error });
      
      // Attempt restart if within limits
      const config = this.configs.get(language);
      if (config && server.status.restartCount < config.maxRestartAttempts) {
        await this.restartServer(language);
      }
    }
  }

  private async restartServer(language: string): Promise<void> {
    const server = this.servers.get(language);
    if (!server) return;

    logger.info(`Restarting language server for ${language}`);
    
    try {
      await this.shutdownServer(language);
      server.status.restartCount++;
      await this.initializeLanguageServer(language);
      
      this.emit('serverRestarted', { language });
    } catch (error) {
      logger.error(`Failed to restart language server for ${language}`, error);
      this.emit('serverRestartFailed', { language, error });
    }
  }

  private shouldCacheResult(method: string): boolean {
    const cacheableMethods = [
      'textDocument/hover',
      'textDocument/completion',
      'textDocument/documentSymbol',
      'textDocument/definition',
      'textDocument/typeDefinition'
    ];
    
    return cacheableMethods.includes(method);
  }

  private updatePerformanceMetrics(language: string, duration: number, cacheHit: boolean): void {
    const metrics = this.performanceMetrics.get(language) || {
      duration: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      operationCount: 0,
      errors: 0
    };

    metrics.operationCount++;
    metrics.duration = (metrics.duration + duration) / metrics.operationCount;
    
    if (cacheHit) {
      metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.operationCount - 1) + 1) / metrics.operationCount;
    } else {
      metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.operationCount - 1)) / metrics.operationCount;
    }

    this.performanceMetrics.set(language, metrics);
  }

  private updateServerMetrics(language: string, type: 'request' | 'notification' | 'error'): void {
    const server = this.servers.get(language);
    if (!server) return;

    switch (type) {
      case 'request':
        server.metrics.requestCount++;
        break;
      case 'error':
        server.metrics.errorCount++;
        break;
    }
  }

  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  // Enhanced LSP v3.0 Methods

  /**
   * Get or create a connection from the pool
   */
  private async getPooledConnection(language: string): Promise<LanguageServerInstance> {
    // Try to get an active connection first
    let connection = this.connectionPool.activeConnections.get(language);
    
    if (!connection || !await this.isConnectionHealthy(connection)) {
      // Get from pool or create new
      connection = await this.getOrCreatePooledConnection(language);
      this.connectionPool.activeConnections.set(language, connection);
    }

    await this.updateConnectionMetrics(language, connection);
    return connection;
  }

  private async getOrCreatePooledConnection(language: string): Promise<LanguageServerInstance> {
    const pool = this.connectionPool.connections.get(language) || [];
    
    // Find healthy connection in pool
    for (const connection of pool) {
      if (await this.isConnectionHealthy(connection)) {
        return connection;
      }
    }

    // Create new connection if pool has capacity
    if (pool.length < this.connectionPool.maxPoolSize) {
      const newConnection = await this.createConnection(language);
      pool.push(newConnection);
      this.connectionPool.connections.set(language, pool);
      return newConnection;
    }

    // Pool is full, reuse least recently used connection
    const lruConnection = this.findLRUConnection(pool);
    await this.resetConnection(lruConnection, language);
    return lruConnection;
  }

  private async createConnection(language: string): Promise<LanguageServerInstance> {
    const config = this.configs.get(language);
    if (!config) {
      throw new Error(`Language server configuration not found for: ${language}`);
    }

    const server = await this.startServer(config);
    
    // Initialize connection metrics
    this.connectionPool.connectionMetrics.set(`${language}:${server.serverId}`, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      averageUsage: 0,
      lastUsed: new Date(),
      connectionAge: 0
    });

    return server;
  }

  private async isConnectionHealthy(connection: LanguageServerInstance): Promise<boolean> {
    try {
      if (connection.status.state !== 'running') {
        return false;
      }

      // Simple health check - send a lightweight request
      await connection.connection.sendRequest('textDocument/documentSymbol', {
        textDocument: { uri: 'file:///tmp/healthcheck.tmp' }
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private findLRUConnection(pool: LanguageServerInstance[]): LanguageServerInstance {
    let lru = pool[0];
    let oldestTime = lru.lastHeartbeat.getTime();

    for (const connection of pool) {
      if (connection.lastHeartbeat.getTime() < oldestTime) {
        lru = connection;
        oldestTime = connection.lastHeartbeat.getTime();
      }
    }

    return lru;
  }

  private async resetConnection(connection: LanguageServerInstance, language: string): Promise<void> {
    // Gracefully shutdown and restart the connection
    try {
      await connection.connection.sendRequest('shutdown');
      await connection.connection.sendNotification('exit');
    } catch (error) {
      logger.warn(`Error during connection reset for ${language}`, error);
    }

    // Kill process if still running
    if (connection.process && !connection.process.killed) {
      connection.process.kill();
    }

    // Restart the connection
    const config = this.configs.get(language)!;
    const newProcess = spawn(config.command, config.args, {
      stdio: 'pipe',
      env: { ...process.env }
    });

    const newConnection = createConnection(
      createClientPipeTransport(newProcess.stdout, newProcess.stdin),
      null as any
    );

    // Update the connection instance
    connection.process = newProcess;
    connection.connection = newConnection;
    connection.status.state = 'starting';
    connection.status.restartCount++;
    
    // Re-initialize
    await this.initializeConnection(connection, config);
  }

  private async initializeConnection(server: LanguageServerInstance, config: LanguageServerConfig): Promise<void> {
    const initializeParams: InitializeParams = {
      processId: server.process?.pid || null,
      rootUri: null,
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: true,
            willSave: true,
            willSaveWaitUntil: true,
            didSave: true
          },
          completion: {
            dynamicRegistration: true,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ['markdown', 'plaintext']
            }
          }
        }
      },
      initializationOptions: config.initializationOptions,
      workspaceFolders: null
    };

    await server.connection.sendRequest('initialize', initializeParams);
    await server.connection.sendNotification('initialized', {});
    
    server.status.state = 'running';
    server.capabilities = config.capabilities;
  }

  /**
   * Enhanced send request with token reduction and performance optimization
   */
  async sendRequestEnhanced<T>(language: string, method: string, params: any): Promise<T> {
    const startTime = performance.now();
    const requestId = `${language}:${method}:${Date.now()}`;
    
    // Check semantic cache first
    const cacheKey = this.generateSemanticCacheKey(language, method, params);
    const cached = this.getFromSemanticCache(cacheKey);
    if (cached) {
      await this.recordCacheHit(language, method, performance.now() - startTime);
      return cached as T;
    }

    const server = await this.getPooledConnection(language);
    
    try {
      const result = await server.connection.sendRequest(method, params);
      
      const duration = performance.now() - startTime;
      
      // Calculate token reduction if applicable
      const tokenReduction = this.calculateTokenReduction(method, params, result);
      
      // Cache the result if appropriate
      if (this.shouldCacheSemanticResult(method)) {
        await this.storeInSemanticCache(cacheKey, result, {
          language,
          fileUri: params.textDocument?.uri || '',
          symbolCount: this.extractSymbolCount(result),
          analysisTime: duration,
          tokenReduction: tokenReduction.reductionPercentage,
          dependencies: this.extractDependencies(result)
        });
      }

      // Update metrics
      await this.updateRequestMetrics(language, method, duration, true);
      await this.updateConnectionMetrics(language, server);

      logger.debug(`LSP request completed`, {
        language,
        method,
        duration,
        tokenReduction: tokenReduction.reductionPercentage,
        cached: false
      });

      return result;
    } catch (error) {
      await this.updateRequestMetrics(language, method, performance.now() - startTime, false);
      logger.error(`Enhanced LSP request failed for ${language}:${method}`, error);
      throw error;
    }
  }

  /**
   * Batch request processing for improved efficiency
   */
  async batchRequests(requests: LSPBatchRequest[]): Promise<LSPBatchResult> {
    const startTime = performance.now();
    const results = new Map<string, any>();
    const errors = new Map<string, Error>();
    
    // Group requests by language for better batching
    const requestsByLanguage = new Map<string, LSPBatchRequest[]>();
    for (const request of requests) {
      const languageRequests = requestsByLanguage.get(request.language) || [];
      languageRequests.push(request);
      requestsByLanguage.set(request.language, languageRequests);
    }

    // Process each language group in parallel
    const batchPromises = Array.from(requestsByLanguage.entries()).map(
      async ([language, languageRequests]) => {
        const server = await this.getPooledConnection(language);
        
        // Process requests for this language
        const promises = languageRequests.map(async (request) => {
          try {
            const result = await server.connection.sendRequest(request.method, request.params);
            results.set(request.id, result);
          } catch (error) {
            errors.set(request.id, error as Error);
          }
        });

        await Promise.all(promises);
      }
    );

    await Promise.all(batchPromises);

    const totalTime = performance.now() - startTime;
    
    return {
      results,
      errors,
      totalTime,
      successCount: results.size,
      failureCount: errors.size
    };
  }

  /**
   * Handle incremental document changes
   */
  async handleIncrementalChange(uri: string, changes: DocumentChange[]): Promise<void> {
    if (!this.config.enableIncrementalSync) {
      return;
    }

    const language = this.getLanguageFromUri(uri);
    const task: IncrementalUpdateTask = {
      uri,
      changes,
      priority: this.calculateUpdatePriority(uri, changes),
      timestamp: new Date(),
      processed: false
    };

    // Add to incremental update queue
    const queue = this.incrementalUpdates.get(language) || [];
    queue.push(task);
    this.incrementalUpdates.set(language, queue);

    // Invalidate related semantic cache entries
    await this.invalidateSemanticCache(uri);
  }

  /**
   * Token reduction calculation
   */
  private calculateTokenReduction(method: string, params: any, result: any): TokenReductionMetrics {
    if (!this.tokenReductionEnabled) {
      return {
        originalTokens: 0,
        reducedTokens: 0,
        reductionPercentage: 0,
        symbolsExtracted: 0,
        structuralAnalysisGain: 0
      };
    }

    const originalContent = params.textDocument?.text || JSON.stringify(params);
    const originalTokens = this.estimateTokenCount(originalContent);
    
    let reducedTokens = originalTokens;
    let symbolsExtracted = 0;
    let structuralAnalysisGain = 0;

    if (method === 'textDocument/documentSymbol' && result) {
      // Semantic analysis allows significant token reduction
      symbolsExtracted = this.countSymbols(result);
      reducedTokens = symbolsExtracted * 10; // Approximate tokens per symbol
      structuralAnalysisGain = Math.max(0, originalTokens - reducedTokens);
    }

    const reductionPercentage = originalTokens > 0 ? 
      ((originalTokens - reducedTokens) / originalTokens) * 100 : 0;

    return {
      originalTokens,
      reducedTokens,
      reductionPercentage,
      symbolsExtracted,
      structuralAnalysisGain
    };
  }

  /**
   * Connection pool optimization
   */
  async optimizeConnectionPool(): Promise<ConnectionOptimizationResult> {
    const optimizations: ConnectionOptimization[] = [];
    let memoryReduced = 0;
    let performanceImprovement = 0;

    for (const [language, pool] of this.connectionPool.connections.entries()) {
      // Remove unhealthy connections
      const healthyConnections = [];
      for (const connection of pool) {
        if (await this.isConnectionHealthy(connection)) {
          healthyConnections.push(connection);
        } else {
          await this.shutdownConnection(connection);
          optimizations.push({
            type: 'removed_unhealthy',
            language,
            connectionId: connection.serverId
          });
          memoryReduced += 50; // Estimated MB per connection
        }
      }
      
      // Optimize pool size based on usage patterns
      const metrics = this.connectionPool.connectionMetrics.get(`${language}:${healthyConnections[0]?.serverId}`);
      if (metrics && metrics.averageUsage < 0.3 && healthyConnections.length > 1) {
        // Remove excess connections
        const excessConnections = healthyConnections.splice(1);
        for (const connection of excessConnections) {
          await this.shutdownConnection(connection);
          optimizations.push({
            type: 'removed_excess',
            language,
            connectionId: connection.serverId
          });
          memoryReduced += 30; // Estimated MB per excess connection
          performanceImprovement += 5; // Estimated performance gain
        }
      }
      
      this.connectionPool.connections.set(language, healthyConnections);
    }

    return {
      optimizations,
      totalConnectionsAfter: this.getTotalConnections(),
      memoryReduced,
      performanceImprovement
    };
  }

  private async shutdownConnection(connection: LanguageServerInstance): Promise<void> {
    try {
      await connection.connection.sendRequest('shutdown');
      await connection.connection.sendNotification('exit');
      
      if (connection.process && !connection.process.killed) {
        connection.process.kill();
      }
    } catch (error) {
      logger.warn(`Error shutting down connection ${connection.serverId}`, error);
    }
  }

  private getTotalConnections(): number {
    let total = 0;
    for (const pool of this.connectionPool.connections.values()) {
      total += pool.length;
    }
    return total;
  }

  /**
   * Batch processing management
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      this.processBatchQueues();
    }, 100); // Process every 100ms
  }

  private async processBatchQueues(): Promise<void> {
    for (const [language, requests] of this.batchQueue.entries()) {
      if (requests.length === 0) continue;

      // Take up to 10 requests for batching
      const batch = requests.splice(0, 10);
      this.batchQueue.set(language, requests);

      try {
        await this.batchRequests(batch);
      } catch (error) {
        logger.error(`Batch processing failed for ${language}`, error);
      }
    }
  }

  /**
   * Incremental update processing
   */
  private startIncrementalUpdateProcessor(): void {
    setInterval(() => {
      this.processIncrementalUpdates();
    }, 50); // Process every 50ms for responsiveness
  }

  private async processIncrementalUpdates(): Promise<void> {
    for (const [language, tasks] of this.incrementalUpdates.entries()) {
      const unprocessedTasks = tasks.filter(t => !t.processed);
      if (unprocessedTasks.length === 0) continue;

      // Sort by priority and process highest priority first
      unprocessedTasks.sort((a, b) => b.priority - a.priority);
      
      const task = unprocessedTasks[0];
      try {
        await this.processIncrementalUpdate(language, task);
        task.processed = true;
      } catch (error) {
        logger.error(`Incremental update failed for ${task.uri}`, error);
        task.processed = true; // Mark as processed to avoid retrying
      }
    }

    // Clean up processed tasks
    for (const [language, tasks] of this.incrementalUpdates.entries()) {
      const remainingTasks = tasks.filter(t => !t.processed);
      this.incrementalUpdates.set(language, remainingTasks);
    }
  }

  private async processIncrementalUpdate(language: string, task: IncrementalUpdateTask): Promise<void> {
    const startTime = performance.now();
    
    try {
      const server = await this.getPooledConnection(language);
      
      // Send incremental changes to LSP server
      await server.connection.sendNotification('textDocument/didChange', {
        textDocument: { uri: task.uri, version: Date.now() },
        contentChanges: task.changes
      });

      const duration = performance.now() - startTime;
      
      if (duration > 100) { // Target: <100ms
        logger.warn(`Incremental update took ${duration}ms for ${task.uri}`);
      }
    } catch (error) {
      logger.error(`Failed to process incremental update for ${task.uri}`, error);
    }
  }

  private calculateUpdatePriority(uri: string, changes: DocumentChange[]): number {
    let priority = 0.5; // Base priority
    
    // Higher priority for files currently being analyzed
    if (this.semanticCache.has(uri)) priority += 0.3;
    
    // Higher priority for structural changes
    if (this.hasStructuralChanges(changes)) priority += 0.2;
    
    // Higher priority for frequently accessed files
    if (this.isFrequentlyAccessed(uri)) priority += 0.1;
    
    return Math.min(1.0, priority);
  }

  private hasStructuralChanges(changes: DocumentChange[]): boolean {
    return changes.some(change => 
      change.text.includes('function ') ||
      change.text.includes('class ') ||
      change.text.includes('interface ') ||
      change.text.includes('def ') ||
      change.text.includes('fn ')
    );
  }

  private isFrequentlyAccessed(uri: string): boolean {
    // Check if file has been accessed recently and frequently
    const recentAccess = Array.from(this.semanticCache.values())
      .filter(entry => entry.metadata.fileUri === uri)
      .filter(entry => Date.now() - entry.lastAccessed.getTime() < 300000) // 5 minutes
      .length;
    
    return recentAccess > 3;
  }

  /**
   * Semantic caching methods
   */
  private generateSemanticCacheKey(language: string, method: string, params: any): string {
    const uri = params.textDocument?.uri || '';
    const position = params.position ? `${params.position.line}:${params.position.character}` : '';
    return `${language}:${method}:${uri}:${position}`;
  }

  private getFromSemanticCache(key: string): any | null {
    const entry = this.semanticCache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.created.getTime() > entry.ttl) {
      this.semanticCache.delete(key);
      return null;
    }

    entry.lastAccessed = new Date();
    return entry.result;
  }

  private async storeInSemanticCache(key: string, result: any, metadata: CacheEntryMetadata): Promise<void> {
    const entry: SemanticCacheEntry = {
      key,
      result,
      metadata,
      ttl: 300000, // 5 minutes
      created: new Date(),
      lastAccessed: new Date()
    };

    this.semanticCache.set(key, entry);

    // Implement cache size management
    if (this.semanticCache.size > 1000) {
      await this.evictOldestCacheEntries();
    }
  }

  private async evictOldestCacheEntries(): Promise<void> {
    const entries = Array.from(this.semanticCache.entries());
    entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());
    
    // Remove oldest 10% of entries
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.semanticCache.delete(entries[i][0]);
    }
  }

  private shouldCacheSemanticResult(method: string): boolean {
    const cacheableMethods = [
      'textDocument/hover',
      'textDocument/completion',
      'textDocument/documentSymbol',
      'textDocument/definition',
      'textDocument/typeDefinition',
      'textDocument/references'
    ];
    
    return cacheableMethods.includes(method);
  }

  private async invalidateSemanticCache(uri: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.semanticCache.entries()) {
      if (entry.metadata.fileUri === uri || entry.metadata.dependencies.includes(uri)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.semanticCache.delete(key);
    }
  }

  /**
   * Utility methods
   */
  private getLanguageFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    const extensionMap: Record<string, string> = {
      'py': 'python',
      'ts': 'typescript',
      'js': 'javascript',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'cpp'
    };

    return extensionMap[extension || ''] || 'unknown';
  }

  private estimateTokenCount(content: string): number {
    // Rough estimation: 1 token per 4 characters on average
    return Math.ceil(content.length / 4);
  }

  private countSymbols(result: any): number {
    if (!result || !Array.isArray(result)) return 0;
    
    let count = 0;
    const countRecursively = (symbols: any[]) => {
      for (const symbol of symbols) {
        count++;
        if (symbol.children && Array.isArray(symbol.children)) {
          countRecursively(symbol.children);
        }
      }
    };
    
    countRecursively(result);
    return count;
  }

  private extractSymbolCount(result: any): number {
    return this.countSymbols(result);
  }

  private extractDependencies(result: any): string[] {
    // Simplified dependency extraction
    // In a full implementation, this would analyze the result to find dependencies
    return [];
  }

  private async updateConnectionMetrics(language: string, connection: LanguageServerInstance): Promise<void> {
    const key = `${language}:${connection.serverId}`;
    const metrics = this.connectionPool.connectionMetrics.get(key);
    
    if (metrics) {
      metrics.lastUsed = new Date();
      metrics.connectionAge = Date.now() - connection.status.startTime!.getTime();
    }
  }

  private async updateRequestMetrics(language: string, method: string, duration: number, success: boolean): Promise<void> {
    const key = `${language}:${method}`;
    let metrics = this.requestMetrics.get(key);
    
    if (!metrics) {
      metrics = {
        method,
        language,
        requestCount: 0,
        averageTime: 0,
        successRate: 0,
        lastUsed: new Date()
      };
      this.requestMetrics.set(key, metrics);
    }

    metrics.requestCount++;
    metrics.averageTime = (metrics.averageTime + duration) / metrics.requestCount;
    metrics.successRate = success ? 
      (metrics.successRate * (metrics.requestCount - 1) + 1) / metrics.requestCount :
      (metrics.successRate * (metrics.requestCount - 1)) / metrics.requestCount;
    metrics.lastUsed = new Date();
  }

  private async recordCacheHit(language: string, method: string, duration: number): Promise<void> {
    await this.updateRequestMetrics(language, method, duration, true);
    
    // Update cache hit metrics
    const performanceMetrics = this.performanceMetrics.get(language);
    if (performanceMetrics) {
      performanceMetrics.cacheHitRate = (performanceMetrics.cacheHitRate * performanceMetrics.operationCount + 1) / (performanceMetrics.operationCount + 1);
      performanceMetrics.operationCount++;
    }
  }

  /**
   * Get enhanced LSP performance metrics
   */
  getLSPIntegrationMetrics(): LSPIntegrationMetrics {
    const totalServers = this.servers.size;
    const activeServers = Array.from(this.servers.values()).filter(s => s.status.state === 'running').length;
    
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalSuccessRate = 0;
    let errorCount = 0;

    for (const metrics of this.requestMetrics.values()) {
      totalRequests += metrics.requestCount;
      totalResponseTime += metrics.averageTime * metrics.requestCount;
      totalSuccessRate += metrics.successRate * metrics.requestCount;
    }

    for (const server of this.servers.values()) {
      errorCount += server.metrics.errorCount;
    }

    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const averageSuccessRate = totalRequests > 0 ? totalSuccessRate / totalRequests : 0;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    // Calculate cache hit rate
    let totalCacheHits = 0;
    let totalCacheRequests = 0;
    for (const metrics of this.performanceMetrics.values()) {
      totalCacheHits += metrics.cacheHitRate * metrics.operationCount;
      totalCacheRequests += metrics.operationCount;
    }
    const cacheHitRate = totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0;

    // Calculate token reduction rate
    const tokenReductionRate = this.tokenReductionEnabled ? 50 : 0; // Target 50% reduction

    // Calculate uptime
    const oldestServer = Array.from(this.servers.values())
      .filter(s => s.status.startTime)
      .sort((a, b) => a.status.startTime!.getTime() - b.status.startTime!.getTime())[0];
    
    const uptime = oldestServer && oldestServer.status.startTime ? 
      Date.now() - oldestServer.status.startTime.getTime() : 0;

    return {
      totalServers,
      activeServers,
      totalRequests,
      averageResponseTime,
      cacheHitRate,
      tokenReductionRate,
      errorRate,
      uptime
    };
  }
}