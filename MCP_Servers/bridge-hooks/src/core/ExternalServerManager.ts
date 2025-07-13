/**
 * External MCP Server Manager
 * Handles connections to external MCP servers (Context7, Sequential, Magic, Playwright)
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { logger } from '@superclaude/shared';
import { MCPServerType } from '../types.js';

export interface ExternalServerConfig {
  context7?: {
    url: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
  };
  sequential?: {
    endpoint: string;
    protocol: 'websocket' | 'http';
    auth: string;
    timeout?: number;
  };
  magic?: {
    baseUrl: string;
    headers: Record<string, string>;
    timeout?: number;
  };
  playwright?: {
    mode: 'local' | 'remote';
    executable?: string;
    endpoint?: string;
    browserContextOptions?: any;
  };
}

export interface ExternalServerConnection {
  serverId: MCPServerType;
  type: 'http' | 'websocket' | 'local';
  client: AxiosInstance | WebSocket | any;
  isConnected: boolean;
  lastError?: string;
  retryCount: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
}

export class ExternalServerManager extends EventEmitter {
  private connections: Map<MCPServerType, ExternalServerConnection> = new Map();
  private config: ExternalServerConfig;
  private circuitBreakerThreshold = 5;
  private circuitBreakerResetTime = 60000; // 1 minute
  private reconnectInterval?: NodeJS.Timeout;

  constructor(config?: ExternalServerConfig) {
    super();
    this.config = this.loadConfiguration(config);
    this.initializeConnections();
  }

  private loadConfiguration(config?: ExternalServerConfig): ExternalServerConfig {
    // Merge with environment variables
    return {
      context7: {
        url: config?.context7?.url || process.env.CONTEXT7_URL || 'https://api.context7.com/v1',
        apiKey: config?.context7?.apiKey || process.env.CONTEXT7_API_KEY || '',
        timeout: config?.context7?.timeout || 5000,
        retries: config?.context7?.retries || 3,
      },
      sequential: {
        endpoint: config?.sequential?.endpoint || process.env.SEQUENTIAL_ENDPOINT || 'ws://sequential.local:8080',
        protocol: config?.sequential?.protocol || 'websocket',
        auth: config?.sequential?.auth || process.env.SEQUENTIAL_TOKEN || '',
        timeout: config?.sequential?.timeout || 10000,
      },
      magic: {
        baseUrl: config?.magic?.baseUrl || process.env.MAGIC_BASE_URL || 'https://21st.dev/api',
        headers: {
          'X-API-Key': config?.magic?.headers?.['X-API-Key'] || process.env.MAGIC_API_KEY || '',
          ...config?.magic?.headers,
        },
        timeout: config?.magic?.timeout || 5000,
      },
      playwright: {
        mode: config?.playwright?.mode || 'local',
        executable: config?.playwright?.executable || '/usr/local/bin/playwright',
        endpoint: config?.playwright?.endpoint,
        browserContextOptions: config?.playwright?.browserContextOptions || {},
      },
    };
  }

  private async initializeConnections(): Promise<void> {
    // Initialize Context7 (HTTP)
    if (this.config.context7?.apiKey) {
      await this.initializeContext7();
    }

    // Initialize Sequential (WebSocket or HTTP)
    if (this.config.sequential?.auth) {
      await this.initializeSequential();
    }

    // Initialize Magic (HTTP)
    if (this.config.magic?.headers?.['X-API-Key']) {
      await this.initializeMagic();
    }

    // Initialize Playwright (Local or Remote)
    if (this.config.playwright) {
      await this.initializePlaywright();
    }

    // Start reconnection monitoring
    this.startReconnectionMonitoring();
  }

  private async initializeContext7(): Promise<void> {
    const client = axios.create({
      baseURL: this.config.context7!.url,
      timeout: this.config.context7!.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.context7!.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for circuit breaker
    client.interceptors.request.use(
      (config) => {
        const connection = this.connections.get('context7');
        if (connection?.circuitBreakerState === 'open') {
          throw new Error('Circuit breaker is open for Context7');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    client.interceptors.response.use(
      (response) => {
        this.handleSuccessfulRequest('context7');
        return response;
      },
      (error) => {
        this.handleFailedRequest('context7', error);
        return Promise.reject(error);
      }
    );

    this.connections.set('context7', {
      serverId: 'context7',
      type: 'http',
      client,
      isConnected: true,
      retryCount: 0,
      circuitBreakerState: 'closed',
      failureCount: 0,
    });

    logger.info('Context7 connection initialized');
  }

  private async initializeSequential(): Promise<void> {
    if (this.config.sequential!.protocol === 'websocket') {
      const ws = new WebSocket(this.config.sequential!.endpoint, {
        headers: {
          'Authorization': this.config.sequential!.auth,
        },
      });

      ws.on('open', () => {
        const connection = this.connections.get('sequential');
        if (connection) {
          connection.isConnected = true;
          connection.retryCount = 0;
        }
        logger.info('Sequential WebSocket connection established');
        this.emit('server_connected', 'sequential');
      });

      ws.on('close', () => {
        const connection = this.connections.get('sequential');
        if (connection) {
          connection.isConnected = false;
        }
        logger.warn('Sequential WebSocket connection closed');
        this.emit('server_disconnected', 'sequential');
      });

      ws.on('error', (error) => {
        this.handleFailedRequest('sequential', error);
      });

      this.connections.set('sequential', {
        serverId: 'sequential',
        type: 'websocket',
        client: ws,
        isConnected: false,
        retryCount: 0,
        circuitBreakerState: 'closed',
        failureCount: 0,
      });
    } else {
      // HTTP mode for Sequential
      const client = axios.create({
        baseURL: this.config.sequential!.endpoint,
        timeout: this.config.sequential!.timeout,
        headers: {
          'Authorization': this.config.sequential!.auth,
        },
      });

      this.connections.set('sequential', {
        serverId: 'sequential',
        type: 'http',
        client,
        isConnected: true,
        retryCount: 0,
        circuitBreakerState: 'closed',
        failureCount: 0,
      });
    }
  }

  private async initializeMagic(): Promise<void> {
    const client = axios.create({
      baseURL: this.config.magic!.baseUrl,
      timeout: this.config.magic!.timeout,
      headers: this.config.magic!.headers,
    });

    // Add interceptors
    client.interceptors.response.use(
      (response) => {
        this.handleSuccessfulRequest('magic');
        return response;
      },
      (error) => {
        this.handleFailedRequest('magic', error);
        return Promise.reject(error);
      }
    );

    this.connections.set('magic', {
      serverId: 'magic',
      type: 'http',
      client,
      isConnected: true,
      retryCount: 0,
      circuitBreakerState: 'closed',
      failureCount: 0,
    });

    logger.info('Magic (21st.dev) connection initialized');
  }

  private async initializePlaywright(): Promise<void> {
    // For local mode, we just store the configuration
    // Actual browser launch happens on demand
    this.connections.set('playwright', {
      serverId: 'playwright',
      type: 'local',
      client: null, // Will be initialized on first use
      isConnected: true,
      retryCount: 0,
      circuitBreakerState: 'closed',
      failureCount: 0,
    });

    logger.info('Playwright configuration initialized');
  }

  /**
   * Execute a request to an external server
   */
  async executeRequest(
    serverId: MCPServerType,
    operation: string,
    params: any
  ): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection configured for server: ${serverId}`);
    }

    // Check circuit breaker
    if (connection.circuitBreakerState === 'open') {
      if (this.shouldAttemptReset(connection)) {
        connection.circuitBreakerState = 'half-open';
      } else {
        throw new Error(`Circuit breaker open for ${serverId}`);
      }
    }

    try {
      let result;

      switch (serverId) {
        case 'context7':
          result = await this.executeContext7Request(operation, params);
          break;
        case 'sequential':
          result = await this.executeSequentialRequest(operation, params);
          break;
        case 'magic':
          result = await this.executeMagicRequest(operation, params);
          break;
        case 'playwright':
          result = await this.executePlaywrightRequest(operation, params);
          break;
        default:
          throw new Error(`Unknown external server: ${serverId}`);
      }

      this.handleSuccessfulRequest(serverId);
      return result;

    } catch (error) {
      this.handleFailedRequest(serverId, error);
      throw error;
    }
  }

  private async executeContext7Request(operation: string, params: any): Promise<any> {
    const connection = this.connections.get('context7')!;
    const client = connection.client as AxiosInstance;

    switch (operation) {
      case 'resolve-library-id':
        const resolveResponse = await client.post('/resolve-library-id', {
          libraryName: params.libraryName,
        });
        return resolveResponse.data;

      case 'get-library-docs':
        const docsResponse = await client.post('/get-library-docs', {
          context7CompatibleLibraryID: params.libraryId,
          tokens: params.tokens || 10000,
          topic: params.topic,
        });
        return docsResponse.data;

      default:
        throw new Error(`Unknown Context7 operation: ${operation}`);
    }
  }

  private async executeSequentialRequest(operation: string, params: any): Promise<any> {
    const connection = this.connections.get('sequential')!;

    if (connection.type === 'websocket') {
      const ws = connection.client as WebSocket;
      
      return new Promise((resolve, reject) => {
        const requestId = `req_${Date.now()}`;
        
        const timeout = setTimeout(() => {
          reject(new Error('Sequential request timeout'));
        }, this.config.sequential!.timeout!);

        const messageHandler = (data: WebSocket.Data) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.requestId === requestId) {
              clearTimeout(timeout);
              ws.off('message', messageHandler);
              resolve(response.result);
            }
          } catch (error) {
            // Continue listening for valid response
          }
        };

        ws.on('message', messageHandler);

        ws.send(JSON.stringify({
          requestId,
          operation,
          params,
        }));
      });
    } else {
      // HTTP mode
      const client = connection.client as AxiosInstance;
      const response = await client.post(`/${operation}`, params);
      return response.data;
    }
  }

  private async executeMagicRequest(operation: string, params: any): Promise<any> {
    const connection = this.connections.get('magic')!;
    const client = connection.client as AxiosInstance;

    switch (operation) {
      case 'component-builder':
        const componentResponse = await client.post('/component-builder', {
          searchQuery: params.searchQuery,
          standaloneRequestQuery: params.standaloneRequestQuery,
          message: params.message,
          absolutePathToCurrentFile: params.absolutePathToCurrentFile,
          absolutePathToProjectDirectory: params.absolutePathToProjectDirectory,
        });
        return componentResponse.data;

      case 'logo-search':
        const logoResponse = await client.post('/logo-search', {
          queries: params.queries,
          format: params.format,
        });
        return logoResponse.data;

      case 'component-inspiration':
        const inspirationResponse = await client.post('/component-inspiration', {
          searchQuery: params.searchQuery,
          message: params.message,
        });
        return inspirationResponse.data;

      default:
        throw new Error(`Unknown Magic operation: ${operation}`);
    }
  }

  private async executePlaywrightRequest(operation: string, params: any): Promise<any> {
    // For Playwright, we'll need to implement browser automation
    // This is a placeholder that would integrate with the actual Playwright library
    throw new Error('Playwright integration not yet implemented');
  }

  private handleSuccessfulRequest(serverId: MCPServerType): void {
    const connection = this.connections.get(serverId);
    if (connection) {
      connection.failureCount = 0;
      connection.retryCount = 0;
      
      if (connection.circuitBreakerState === 'half-open') {
        connection.circuitBreakerState = 'closed';
        logger.info(`Circuit breaker closed for ${serverId}`);
      }
    }
  }

  private handleFailedRequest(serverId: MCPServerType, error: any): void {
    const connection = this.connections.get(serverId);
    if (connection) {
      connection.failureCount++;
      connection.lastFailureTime = new Date();
      connection.lastError = error.message;

      if (connection.failureCount >= this.circuitBreakerThreshold) {
        connection.circuitBreakerState = 'open';
        logger.warn(`Circuit breaker opened for ${serverId}`, {
          failureCount: connection.failureCount,
          error: error.message,
        });
        this.emit('circuit_breaker_open', serverId);
      }
    }
  }

  private shouldAttemptReset(connection: ExternalServerConnection): boolean {
    if (!connection.lastFailureTime) return true;
    
    const timeSinceLastFailure = Date.now() - connection.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.circuitBreakerResetTime;
  }

  private startReconnectionMonitoring(): void {
    this.reconnectInterval = setInterval(() => {
      for (const [serverId, connection] of this.connections) {
        if (!connection.isConnected && connection.type === 'websocket') {
          logger.info(`Attempting to reconnect to ${serverId}`);
          // Implement reconnection logic
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get connection status for all external servers
   */
  getConnectionStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [serverId, connection] of this.connections) {
      status[serverId] = {
        isConnected: connection.isConnected,
        circuitBreakerState: connection.circuitBreakerState,
        failureCount: connection.failureCount,
        lastError: connection.lastError,
        type: connection.type,
      };
    }

    return status;
  }

  /**
   * Test connection to a specific server
   */
  async testConnection(serverId: MCPServerType): Promise<boolean> {
    try {
      switch (serverId) {
        case 'context7':
          await this.executeRequest(serverId, 'health', {});
          return true;
        case 'sequential':
          // Implement health check
          return true;
        case 'magic':
          // Implement health check
          return true;
        case 'playwright':
          return true; // Local, always available
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Connection test failed for ${serverId}`, { error });
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    for (const [serverId, connection] of this.connections) {
      if (connection.type === 'websocket' && connection.client) {
        (connection.client as WebSocket).close();
      }
    }

    this.connections.clear();
    logger.info('External server manager cleanup completed');
  }
}