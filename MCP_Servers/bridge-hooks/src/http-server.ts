/**
 * Enhanced HTTP Server for Bridge Hooks
 * Provides HTTP endpoints for Python hooks with connection pooling and caching
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createSuperClaudeBridge } from './index.js';
import { logger } from '@superclaude/shared';
import { ClaudeCodeEvent } from './types.js';

const app = express();

// Performance and security middleware
app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for DDoS protection
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Response caching middleware
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function cacheMiddleware(ttlMs: number = 60000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(cached.data);
    }
    
    const originalJson = res.json;
    res.json = function(data: any) {
      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Initialize bridge with enhanced configuration
const bridge = createSuperClaudeBridge({
  enableMetrics: true,
  enableCaching: true,
  performanceTarget: 50, // Enhanced target
  logLevel: 'info',
  caching: {
    enableResultCaching: true,
    cacheTTL: 300000, // 5 minutes
    maxCacheSize: 1000,
  },
  performance: {
    enableConnectionPooling: true,
    maxConcurrentConnections: 50,
    connectionTimeout: 5000,
    enableCircuitBreaker: true,
  },
});

// Connection pool metrics
const connectionMetrics = {
  activeConnections: 0,
  totalRequests: 0,
  cachedResponses: 0,
  averageResponseTime: 0,
};

// Request tracking middleware
app.use((req, res, next) => {
  connectionMetrics.activeConnections++;
  connectionMetrics.totalRequests++;
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    connectionMetrics.activeConnections--;
    const responseTime = Date.now() - startTime;
    connectionMetrics.averageResponseTime = 
      (connectionMetrics.averageResponseTime * 0.9) + (responseTime * 0.1);
  });
  
  next();
});

// Health check endpoint with enhanced metrics
app.get('/health', cacheMiddleware(30000), (req, res) => {
  const status = bridge.getSystemStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    systemStatus: status,
    connectionMetrics,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// Pre-tool hook endpoint
app.post('/pre-tool', async (req, res) => {
  try {
    const {
      toolName,
      toolArgs,
      sessionId,
      executionId,
      persona,
      complexity,
      flags,
      environment,
    } = req.body;

    const result = await bridge.handleToolEvent(
      'pre_tool_use',
      toolName,
      toolArgs,
      sessionId
    );

    res.json({
      allow: result.success,
      modifiedArgs: toolArgs, // Could be modified by bridge
      metadata: result.metadata,
      performance: result.performance,
      mcpRoute: result.metadata?.routing?.serversUsed?.[0],
      bridgeResponse: true,
    });
  } catch (error) {
    logger.error('Pre-tool hook error', { error });
    res.status(500).json({
      allow: true, // Fail open
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
    });
  }
});

// Post-tool hook endpoint
app.post('/post-tool', async (req, res) => {
  try {
    const {
      toolName,
      toolResult,
      toolError,
      sessionId,
      executionId,
      executionTime,
    } = req.body;

    const result = await bridge.handleToolEvent(
      'post_tool_use',
      toolName,
      { result: toolResult },
      sessionId,
      toolResult,
      toolError
    );

    const response: any = {
      processed: true,
      performance: result.performance,
    };

    // Check if validation should be triggered
    if (result.metadata?.shouldValidate) {
      response.triggerValidation = true;
      response.validationRules = result.metadata.validationRules;
    }

    // Check for context updates
    if (result.sessionStateUpdates) {
      response.contextUpdates = result.sessionStateUpdates;
    }

    res.json(response);
  } catch (error) {
    logger.error('Post-tool hook error', { error });
    res.status(500).json({
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Enhanced notification metrics endpoint
app.post('/notification-metrics', async (req, res) => {
  try {
    const { type, sessionId, timestamp, metadata } = req.body;
    
    // Log metrics with enhanced information
    logger.info('Notification metric', {
      type,
      sessionId,
      timestamp,
      metadata,
      connectionInfo: {
        activeConnections: connectionMetrics.activeConnections,
        totalRequests: connectionMetrics.totalRequests,
      }
    });

    res.json({ 
      received: true,
      processed: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Notification metrics error', { error });
    res.status(500).json({ error: 'Failed to process metrics' });
  }
});

// Session stop endpoint
app.post('/session-stop', async (req, res) => {
  try {
    const {
      sessionId,
      performance,
      cleanup,
      recommendations,
      environment
    } = req.body;

    logger.info('Session stop received', {
      sessionId,
      performanceSummary: performance?.sessionSummary,
      cleanupResults: cleanup?.tempFilesRemoved || 0,
      recommendationCount: recommendations?.length || 0
    });

    // Process session end with bridge
    const result = await bridge.handleToolEvent(
      'session_stop',
      'stop',
      { 
        sessionId,
        performance,
        cleanup,
        recommendations 
      },
      sessionId
    );

    res.json({
      acknowledged: true,
      sessionId,
      processed: true,
      cleanup: result.metadata?.cleanup || false,
      performance: result.performance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Session stop error', { error });
    res.status(500).json({
      acknowledged: true, // Still acknowledge to prevent hanging
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
});

// Subagent completed endpoint
app.post('/subagent-completed', async (req, res) => {
  try {
    const {
      subagentId,
      parentSessionId,
      taskResults,
      coordination,
      resourceUsage
    } = req.body;

    logger.info('Subagent completion received', {
      subagentId,
      parentSessionId,
      hasResults: !!taskResults,
      parallelAgents: coordination?.parallelSubagents?.length || 0,
      aggregationNeeded: coordination?.aggregationNeeded?.required || false
    });

    // Process subagent completion
    const result = await bridge.handleToolEvent(
      'subagent_stop',
      'subagent_completed',
      {
        subagentId,
        taskResults,
        coordination,
        resourceUsage
      },
      parentSessionId
    );

    res.json({
      acknowledged: true,
      parentSessionId,
      subagentId,
      aggregated: result.metadata?.resultsAggregated || false,
      dependenciesResolved: result.metadata?.dependenciesResolved || false,
      nextActions: result.metadata?.nextActions || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Subagent completion error', { error });
    res.status(500).json({
      acknowledged: true, // Still acknowledge
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    });
  }
});

// Pre-compaction endpoint  
app.post('/pre-compaction', async (req, res) => {
  try {
    const {
      sessionId,
      contextInfo,
      preservationPlan,
      timestamp
    } = req.body;

    logger.info('Pre-compaction received', {
      sessionId,
      tokenCount: contextInfo?.tokenCount || 0,
      messageCount: contextInfo?.messageCount || 0,
      optimizationOpportunities: preservationPlan?.optimizationActions?.length || 0,
      preservationPriorities: preservationPlan?.preservationCheckpoints?.length || 0
    });

    // Process pre-compaction analysis
    const result = await bridge.handleToolEvent(
      'pre_compact',
      'pre_compaction',
      {
        sessionId,
        contextInfo,
        preservationPlan
      },
      sessionId
    );

    res.json({
      acknowledged: true,
      sessionId,
      contextAnalyzed: true,
      preservationPlan: result.metadata?.enhancedPreservationPlan || preservationPlan,
      optimizationRecommendations: result.metadata?.optimizationRecommendations || [],
      criticalDataPreserved: result.metadata?.criticalDataPreserved || true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Pre-compaction error', { error });
    res.status(500).json({
      acknowledged: true, // Allow compaction to proceed
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true,
      preservationPlan: {
        preservationStrategy: 'safe_default',
        note: 'Using safe default due to bridge error'
      }
    });
  }
});

// MCP server status endpoint
app.get('/mcp-status', (req, res) => {
  const status = bridge.getSystemStatus();
  res.json({
    mcpServers: status.mcp?.serverHealth || {},
    externalServers: status.mcp?.externalServers || {},
  });
});

// Performance recommendations endpoint
app.get('/recommendations', (req, res) => {
  const recommendations = bridge.getOptimizationRecommendations();
  res.json({ recommendations });
});

// Start server
const PORT = process.env.BRIDGE_HTTP_PORT || 8080;
const HOST = process.env.BRIDGE_HTTP_HOST || 'localhost';

app.listen(PORT as number, HOST, () => {
  logger.info(`Enhanced Bridge hooks HTTP server running on http://${HOST}:${PORT}`);
  logger.info('Available endpoints:');
  logger.info('  GET  /health - Health check with enhanced metrics');
  logger.info('  POST /pre-tool - Pre-tool hook with intelligent routing');
  logger.info('  POST /post-tool - Post-tool hook with validation');
  logger.info('  POST /notification-metrics - Enhanced notification metrics');
  logger.info('  POST /session-stop - Session cleanup and reporting');
  logger.info('  POST /subagent-completed - Subagent coordination');
  logger.info('  POST /pre-compaction - Context optimization');
  logger.info('  GET  /mcp-status - MCP server status');
  logger.info('  GET  /recommendations - Performance recommendations');
  logger.info('');
  logger.info('Performance features:');
  logger.info('  - Connection pooling and rate limiting');
  logger.info('  - Response caching with TTL');
  logger.info('  - Request compression and security headers');
  logger.info('  - Real-time metrics and monitoring');
  logger.info('  - Circuit breaker for reliability');
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down bridge hooks HTTP server...');
  bridge.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down bridge hooks HTTP server...');
  bridge.cleanup();
  process.exit(0);
});