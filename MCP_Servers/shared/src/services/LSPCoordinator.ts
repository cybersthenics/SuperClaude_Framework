/**
 * LSP Coordinator for Shared Services Infrastructure
 * Language Server Protocol connection management and optimization
 */

import { EventEmitter } from 'events';

export interface LSPConnection {
  id: string;
  language: string;
  status: 'starting' | 'ready' | 'busy' | 'error' | 'stopped';
  processId?: number;
  capabilities: LSPCapabilities;
  documents: Set<string>;
  lastActivity: Date;
  stats: LSPConnectionStats;
}

export interface LSPCapabilities {
  textDocumentSync: boolean;
  hoverProvider: boolean;
  completionProvider: boolean;
  signatureHelpProvider: boolean;
  definitionProvider: boolean;
  referencesProvider: boolean;
  documentHighlightProvider: boolean;
  documentSymbolProvider: boolean;
  workspaceSymbolProvider: boolean;
  codeActionProvider: boolean;
  codeLensProvider: boolean;
  documentFormattingProvider: boolean;
  documentRangeFormattingProvider: boolean;
  renameProvider: boolean;
  diagnosticsProvider: boolean;
}

export interface LSPConnectionStats {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequest: Date;
  documentsOpened: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface LSPRequest {
  id: string;
  method: string;
  params: any;
  timestamp: Date;
  language: string;
  uri?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface LSPResult {
  requestId: string;
  success: boolean;
  data?: any;
  error?: LSPError;
  responseTime: number;
  fromCache: boolean;
  metadata?: any;
}

export interface LSPBatchResult {
  success: boolean;
  results: LSPResult[];
  totalTime: number;
  errors: LSPError[];
  cacheUtilization: number;
}

export interface LSPError {
  code: number;
  message: string;
  data?: any;
}

export interface DocumentChange {
  uri: string;
  version: number;
  changes: TextChange[];
}

export interface TextChange {
  range: LSPRange;
  text: string;
}

export interface LSPRange {
  start: LSPPosition;
  end: LSPPosition;
}

export interface LSPPosition {
  line: number;
  character: number;
}

export interface LSPConnectionPool {
  totalConnections: number;
  activeConnections: number;
  availableConnections: number;
  connectionsByLanguage: Record<string, number>;
  poolUtilization: number;
  averageResponseTime: number;
}

export interface LSPMetrics {
  totalConnections: number;
  activeConnections: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  languageMetrics: Record<string, LanguageMetrics>;
  performanceMetrics: LSPPerformanceMetrics;
}

export interface LanguageMetrics {
  connectionCount: number;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  documentsOpen: number;
}

export interface LSPPerformanceMetrics {
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  requestThroughput: number;
  errorRate: number;
  optimizationScore: number;
}

export interface LSPServerStatus {
  language: string;
  running: boolean;
  healthy: boolean;
  version?: string;
  capabilities: LSPCapabilities;
  documentCount: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

export interface LSPServerConfig {
  language: string;
  command: string;
  args: string[];
  workingDirectory: string;
  environment?: Record<string, string>;
  initializationOptions?: any;
  settings?: any;
}

export interface CacheEntry {
  requestKey: string;
  result: any;
  timestamp: Date;
  language: string;
  version: number;
  accessCount: number;
}

export class LSPCoordinator extends EventEmitter {
  private connections = new Map<string, LSPConnection>();
  private connectionPool = new Map<string, LSPConnection[]>();
  private requestCache = new Map<string, CacheEntry>();
  private batchQueue = new Map<string, LSPRequest[]>();
  private config: LSPCoordinatorConfig;
  private metrics: LSPMetrics;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<LSPCoordinatorConfig>) {
    super();
    
    this.config = {
      maxConnectionsPerLanguage: 3,
      maxCacheSize: 10000,
      cacheTimeout: 1800000, // 30 minutes
      batchTimeout: 100, // 100ms
      maxBatchSize: 10,
      connectionTimeout: 30000,
      requestTimeout: 10000,
      enableCaching: true,
      enableBatching: true,
      enableConnectionPooling: true,
      syncInterval: 5000, // 5 seconds
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startSyncInterval();
  }

  async startLanguageServer(language: string, serverConfig?: LSPServerConfig): Promise<LSPConnection> {
    try {
      // Check if we already have a connection for this language
      const existingConnections = this.connectionPool.get(language) || [];
      const availableConnection = existingConnections.find(conn => conn.status === 'ready');
      
      if (availableConnection) {
        this.emit('connectionReused', { language, connectionId: availableConnection.id });
        return availableConnection;
      }

      // Create new connection if under limit
      if (existingConnections.length < this.config.maxConnectionsPerLanguage) {
        const connection = await this.createConnection(language, serverConfig);
        
        // Add to pool
        if (!this.connectionPool.has(language)) {
          this.connectionPool.set(language, []);
        }
        this.connectionPool.get(language)!.push(connection);
        this.connections.set(connection.id, connection);

        this.emit('connectionCreated', { language, connectionId: connection.id });
        return connection;
      }

      // If at limit, wait for an available connection
      return await this.waitForAvailableConnection(language);
    } catch (error) {
      this.emit('connectionError', { language, error });
      throw error;
    }
  }

  async stopLanguageServer(language: string): Promise<void> {
    const connections = this.connectionPool.get(language) || [];
    
    for (const connection of connections) {
      await this.stopConnection(connection);
    }

    this.connectionPool.delete(language);
    this.emit('languageServerStopped', { language });
  }

  async restartLanguageServer(language: string): Promise<void> {
    await this.stopLanguageServer(language);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.startLanguageServer(language);
    
    this.emit('languageServerRestarted', { language });
  }

  async getConnection(language: string): Promise<LSPConnection | null> {
    const connections = this.connectionPool.get(language) || [];
    return connections.find(conn => conn.status === 'ready') || null;
  }

  async poolConnections(): Promise<LSPConnectionPool> {
    const totalConnections = this.connections.size;
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.status === 'ready' || conn.status === 'busy').length;
    
    const connectionsByLanguage: Record<string, number> = {};
    for (const [language, connections] of this.connectionPool) {
      connectionsByLanguage[language] = connections.length;
    }

    const allConnections = Array.from(this.connections.values());
    const averageResponseTime = allConnections.length > 0 
      ? allConnections.reduce((sum, conn) => sum + conn.stats.averageResponseTime, 0) / allConnections.length
      : 0;

    return {
      totalConnections,
      activeConnections,
      availableConnections: totalConnections - activeConnections,
      connectionsByLanguage,
      poolUtilization: totalConnections > 0 ? (activeConnections / totalConnections) * 100 : 0,
      averageResponseTime
    };
  }

  async optimizeConnections(): Promise<void> {
    // Remove idle connections
    const now = Date.now();
    const idleThreshold = 300000; // 5 minutes

    for (const [language, connections] of this.connectionPool) {
      const activeConnections = connections.filter(conn => {
        const idle = now - conn.lastActivity.getTime() > idleThreshold;
        if (idle && conn.status === 'ready' && connections.length > 1) {
          this.stopConnection(conn);
          return false;
        }
        return true;
      });

      this.connectionPool.set(language, activeConnections);
    }

    // Clean up cache
    await this.cleanupCache();

    this.emit('connectionsOptimized');
  }

  async batchRequests(requests: LSPRequest[]): Promise<LSPBatchResult> {
    const startTime = performance.now();
    const results: LSPResult[] = [];
    const errors: LSPError[] = [];
    let cacheHits = 0;

    try {
      // Group requests by language
      const requestsByLanguage = this.groupRequestsByLanguage(requests);

      // Execute batches for each language
      for (const [language, languageRequests] of requestsByLanguage) {
        const connection = await this.getConnection(language);
        if (!connection) {
          const error: LSPError = {
            code: -1,
            message: `No available connection for language: ${language}`
          };
          errors.push(error);
          continue;
        }

        // Process requests
        for (const request of languageRequests) {
          const result = await this.executeRequest(connection, request);
          results.push(result);
          
          if (result.fromCache) {
            cacheHits++;
          }
          
          if (!result.success && result.error) {
            errors.push(result.error);
          }
        }
      }

      const totalTime = performance.now() - startTime;
      const cacheUtilization = requests.length > 0 ? (cacheHits / requests.length) * 100 : 0;

      return {
        success: errors.length === 0,
        results,
        totalTime,
        errors,
        cacheUtilization
      };
    } catch (error) {
      const totalTime = performance.now() - startTime;
      
      return {
        success: false,
        results,
        totalTime,
        errors: [{
          code: -1,
          message: `Batch execution failed: ${(error as Error).message}`
        }],
        cacheUtilization: 0
      };
    }
  }

  async cacheRequest(request: LSPRequest, result: LSPResult): Promise<void> {
    if (!this.config.enableCaching || !result.success) {
      return;
    }

    const cacheKey = this.generateCacheKey(request);
    const entry: CacheEntry = {
      requestKey: cacheKey,
      result: result.data,
      timestamp: new Date(),
      language: request.language,
      version: 1,
      accessCount: 0
    };

    this.requestCache.set(cacheKey, entry);

    // Manage cache size
    if (this.requestCache.size > this.config.maxCacheSize) {
      await this.evictCacheEntries();
    }

    this.emit('requestCached', { requestId: request.id, cacheKey });
  }

  async getCachedResult(request: LSPRequest): Promise<LSPResult | null> {
    if (!this.config.enableCaching) {
      return null;
    }

    const cacheKey = this.generateCacheKey(request);
    const entry = this.requestCache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    const age = Date.now() - entry.timestamp.getTime();
    if (age > this.config.cacheTimeout) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    this.requestCache.set(cacheKey, entry);

    return {
      requestId: request.id,
      success: true,
      data: entry.result,
      responseTime: 0, // Cached result
      fromCache: true,
      metadata: {
        cacheAge: age,
        accessCount: entry.accessCount
      }
    };
  }

  async syncDocument(uri: string, content: string): Promise<void> {
    // Find connections that have this document open
    const relevantConnections = Array.from(this.connections.values())
      .filter(conn => conn.documents.has(uri));

    for (const connection of relevantConnections) {
      await this.sendDocumentSync(connection, uri, content);
    }

    this.emit('documentSynced', { uri, connectionCount: relevantConnections.length });
  }

  async syncProject(projectPath: string): Promise<void> {
    // Sync all documents in the project
    const connections = Array.from(this.connections.values());
    
    for (const connection of connections) {
      await this.sendProjectSync(connection, projectPath);
    }

    this.emit('projectSynced', { projectPath, connectionCount: connections.length });
  }

  async handleIncrementalSync(changes: DocumentChange[]): Promise<void> {
    // Group changes by document
    const changesByDocument = new Map<string, DocumentChange[]>();
    
    for (const change of changes) {
      if (!changesByDocument.has(change.uri)) {
        changesByDocument.set(change.uri, []);
      }
      changesByDocument.get(change.uri)!.push(change);
    }

    // Apply changes to relevant connections
    for (const [uri, documentChanges] of changesByDocument) {
      const relevantConnections = Array.from(this.connections.values())
        .filter(conn => conn.documents.has(uri));

      for (const connection of relevantConnections) {
        await this.sendIncrementalSync(connection, documentChanges);
      }
    }

    this.emit('incrementalSyncCompleted', { 
      documentsChanged: changesByDocument.size,
      totalChanges: changes.length 
    });
  }

  async getLSPMetrics(): Promise<LSPMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  async getLanguageServerStatus(language?: string): Promise<LSPServerStatus | LSPServerStatus[]> {
    if (language) {
      const connections = this.connectionPool.get(language) || [];
      if (connections.length === 0) {
        throw new Error(`No connections found for language: ${language}`);
      }

      const primaryConnection = connections[0];
      return this.generateServerStatus(language, primaryConnection);
    }

    // Return status for all languages
    const statuses: LSPServerStatus[] = [];
    for (const [lang, connections] of this.connectionPool) {
      if (connections.length > 0) {
        const status = this.generateServerStatus(lang, connections[0]);
        statuses.push(status);
      }
    }

    return statuses;
  }

  private async createConnection(language: string, config?: LSPServerConfig): Promise<LSPConnection> {
    const connectionId = `lsp-${language}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    
    const connection: LSPConnection = {
      id: connectionId,
      language,
      status: 'starting',
      capabilities: this.getDefaultCapabilities(),
      documents: new Set(),
      lastActivity: new Date(),
      stats: {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        lastRequest: new Date(),
        documentsOpened: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    };

    // Simulate connection startup (would start actual LSP process)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    connection.status = 'ready';
    connection.capabilities = await this.negotiateCapabilities(language, config);

    return connection;
  }

  private async stopConnection(connection: LSPConnection): Promise<void> {
    connection.status = 'stopped';
    connection.documents.clear();
    this.connections.delete(connection.id);
    
    this.emit('connectionStopped', { connectionId: connection.id, language: connection.language });
  }

  private async waitForAvailableConnection(language: string): Promise<LSPConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for available connection for ${language}`));
      }, this.config.connectionTimeout);

      const checkAvailability = () => {
        const connections = this.connectionPool.get(language) || [];
        const available = connections.find(conn => conn.status === 'ready');
        
        if (available) {
          clearTimeout(timeout);
          resolve(available);
        } else {
          setTimeout(checkAvailability, 100);
        }
      };

      checkAvailability();
    });
  }

  private async executeRequest(connection: LSPConnection, request: LSPRequest): Promise<LSPResult> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = await this.getCachedResult(request);
      if (cached) {
        connection.stats.cacheHits++;
        return cached;
      }

      connection.stats.cacheMisses++;
      connection.status = 'busy';
      
      // Simulate LSP request execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      const responseTime = performance.now() - startTime;
      const result: LSPResult = {
        requestId: request.id,
        success: true,
        data: { method: request.method, response: 'simulated response' },
        responseTime,
        fromCache: false
      };

      // Update connection statistics
      this.updateConnectionStats(connection, result);
      
      // Cache the result
      await this.cacheRequest(request, result);

      connection.status = 'ready';
      connection.lastActivity = new Date();

      return result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      connection.status = 'ready';
      connection.stats.errorCount++;

      return {
        requestId: request.id,
        success: false,
        error: {
          code: -1,
          message: (error as Error).message
        },
        responseTime,
        fromCache: false
      };
    }
  }

  private updateConnectionStats(connection: LSPConnection, result: LSPResult): void {
    connection.stats.requestCount++;
    connection.stats.lastRequest = new Date();

    if (result.success) {
      connection.stats.successCount++;
    } else {
      connection.stats.errorCount++;
    }

    // Update rolling average response time
    const totalTime = connection.stats.averageResponseTime * (connection.stats.requestCount - 1) + result.responseTime;
    connection.stats.averageResponseTime = totalTime / connection.stats.requestCount;
  }

  private groupRequestsByLanguage(requests: LSPRequest[]): Map<string, LSPRequest[]> {
    const grouped = new Map<string, LSPRequest[]>();
    
    for (const request of requests) {
      if (!grouped.has(request.language)) {
        grouped.set(request.language, []);
      }
      grouped.get(request.language)!.push(request);
    }

    return grouped;
  }

  private generateCacheKey(request: LSPRequest): string {
    return `${request.language}:${request.method}:${JSON.stringify(request.params)}`;
  }

  private async evictCacheEntries(): Promise<void> {
    // LRU eviction - remove least recently used entries
    const entries = Array.from(this.requestCache.entries());
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    const toRemove = Math.floor(this.config.maxCacheSize * 0.1); // Remove 10%
    for (let i = 0; i < toRemove && entries.length > 0; i++) {
      const [key] = entries[i];
      this.requestCache.delete(key);
    }
  }

  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.requestCache) {
      if (now - entry.timestamp.getTime() > this.config.cacheTimeout) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.requestCache.delete(key));
    
    this.emit('cacheCleanup', { expiredEntries: expiredKeys.length });
  }

  private async sendDocumentSync(connection: LSPConnection, uri: string, content: string): Promise<void> {
    // Simulate document sync
    connection.documents.add(uri);
    connection.stats.documentsOpened++;
  }

  private async sendProjectSync(connection: LSPConnection, projectPath: string): Promise<void> {
    // Simulate project sync
    // Would send workspace/didChangeWatchedFiles or similar
  }

  private async sendIncrementalSync(connection: LSPConnection, changes: DocumentChange[]): Promise<void> {
    // Simulate incremental sync
    // Would send textDocument/didChange notifications
  }

  private getDefaultCapabilities(): LSPCapabilities {
    return {
      textDocumentSync: true,
      hoverProvider: true,
      completionProvider: true,
      signatureHelpProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentHighlightProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
      codeActionProvider: true,
      codeLensProvider: true,
      documentFormattingProvider: true,
      documentRangeFormattingProvider: true,
      renameProvider: true,
      diagnosticsProvider: true
    };
  }

  private async negotiateCapabilities(language: string, config?: LSPServerConfig): Promise<LSPCapabilities> {
    // Would negotiate actual capabilities with LSP server
    return this.getDefaultCapabilities();
  }

  private generateServerStatus(language: string, connection: LSPConnection): LSPServerStatus {
    return {
      language,
      running: connection.status !== 'stopped',
      healthy: connection.status === 'ready' && connection.stats.errorCount < 10,
      version: '1.0.0', // Would get from actual server
      capabilities: connection.capabilities,
      documentCount: connection.documents.size,
      memoryUsage: Math.random() * 100 + 50, // MB - would get from actual process
      cpuUsage: Math.random() * 50 + 10, // % - would get from actual process
      uptime: Date.now() - connection.lastActivity.getTime()
    };
  }

  private initializeMetrics(): LSPMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      totalRequests: 0,
      successRate: 100,
      averageResponseTime: 0,
      cacheHitRate: 0,
      languageMetrics: {},
      performanceMetrics: {
        responseTimeP50: 0,
        responseTimeP95: 0,
        responseTimeP99: 0,
        requestThroughput: 0,
        errorRate: 0,
        optimizationScore: 100
      }
    };
  }

  private async updateMetrics(): Promise<void> {
    const allConnections = Array.from(this.connections.values());
    
    this.metrics.totalConnections = allConnections.length;
    this.metrics.activeConnections = allConnections.filter(c => c.status === 'ready' || c.status === 'busy').length;

    const totalRequests = allConnections.reduce((sum, conn) => sum + conn.stats.requestCount, 0);
    const totalSuccesses = allConnections.reduce((sum, conn) => sum + conn.stats.successCount, 0);
    const totalResponseTime = allConnections.reduce((sum, conn) => sum + (conn.stats.averageResponseTime * conn.stats.requestCount), 0);
    const totalCacheHits = allConnections.reduce((sum, conn) => sum + conn.stats.cacheHits, 0);
    const totalCacheRequests = allConnections.reduce((sum, conn) => sum + (conn.stats.cacheHits + conn.stats.cacheMisses), 0);

    this.metrics.totalRequests = totalRequests;
    this.metrics.successRate = totalRequests > 0 ? (totalSuccesses / totalRequests) * 100 : 100;
    this.metrics.averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    this.metrics.cacheHitRate = totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0;

    // Update language-specific metrics
    for (const [language, connections] of this.connectionPool) {
      const langRequests = connections.reduce((sum, conn) => sum + conn.stats.requestCount, 0);
      const langSuccesses = connections.reduce((sum, conn) => sum + conn.stats.successCount, 0);
      const langResponseTime = connections.reduce((sum, conn) => sum + (conn.stats.averageResponseTime * conn.stats.requestCount), 0);
      const langCacheHits = connections.reduce((sum, conn) => sum + conn.stats.cacheHits, 0);
      const langCacheRequests = connections.reduce((sum, conn) => sum + (conn.stats.cacheHits + conn.stats.cacheMisses), 0);
      const langDocuments = connections.reduce((sum, conn) => sum + conn.documents.size, 0);

      this.metrics.languageMetrics[language] = {
        connectionCount: connections.length,
        requestCount: langRequests,
        successRate: langRequests > 0 ? (langSuccesses / langRequests) * 100 : 100,
        averageResponseTime: langRequests > 0 ? langResponseTime / langRequests : 0,
        cacheHitRate: langCacheRequests > 0 ? (langCacheHits / langCacheRequests) * 100 : 0,
        documentsOpen: langDocuments
      };
    }

    this.emit('metricsUpdated', this.metrics);
  }

  private startSyncInterval(): void {
    if (this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        this.updateMetrics();
        this.optimizeConnections();
      }, this.config.syncInterval);
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down LSP Coordinator...');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Stop all connections
    for (const connection of this.connections.values()) {
      await this.stopConnection(connection);
    }

    this.connections.clear();
    this.connectionPool.clear();
    this.requestCache.clear();
    this.batchQueue.clear();

    this.removeAllListeners();
    console.log('LSP Coordinator shutdown complete');
  }
}

interface LSPCoordinatorConfig {
  maxConnectionsPerLanguage: number;
  maxCacheSize: number;
  cacheTimeout: number;
  batchTimeout: number;
  maxBatchSize: number;
  connectionTimeout: number;
  requestTimeout: number;
  enableCaching: boolean;
  enableBatching: boolean;
  enableConnectionPooling: boolean;
  syncInterval: number;
}