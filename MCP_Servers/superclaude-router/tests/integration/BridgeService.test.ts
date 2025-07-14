import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { BridgeServiceManager } from '../../src/core/BridgeServiceManager.js';

describe('Bridge Service Integration', () => {
  let bridgeService: BridgeServiceManager;

  beforeAll(async () => {
    bridgeService = new BridgeServiceManager(8081); // Use different port for tests
    await bridgeService.startBridgeService();
  });

  afterAll(async () => {
    await bridgeService.stop();
  });

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(bridgeService.getApp())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.metrics).toBeDefined();
    });

    it('should return server health', async () => {
      const response = await request(bridgeService.getApp())
        .get('/health/servers')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.bridgeService).toBe(true);
    });
  });

  describe('Hook Endpoints', () => {
    it('should handle PreToolUse hooks', async () => {
      const hookRequest = {
        hookType: 'PreToolUse',
        tool: 'route_command',
        args: { command: '/analyze @test' },
        context: {},
        metadata: {
          timestamp: new Date().toISOString(),
          correlationId: 'test-123'
        }
      };

      const response = await request(bridgeService.getApp())
        .post('/hooks/pretooluse')
        .send(hookRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.optimizationApplied).toBe(true);
      expect(response.body.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle PostToolUse hooks', async () => {
      const hookRequest = {
        hookType: 'PostToolUse',
        tool: 'route_command',
        args: { result: 'success' },
        context: {},
        metadata: {
          timestamp: new Date().toISOString(),
          correlationId: 'test-456'
        }
      };

      const response = await request(bridgeService.getApp())
        .post('/hooks/posttooluse')
        .send(hookRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle invalid hook requests', async () => {
      const invalidRequest = {
        // Missing required fields
        args: {},
        context: {}
      };

      const response = await request(bridgeService.getApp())
        .post('/hooks/pretooluse')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('Performance Endpoints', () => {
    it('should return performance metrics', async () => {
      const response = await request(bridgeService.getApp())
        .get('/metrics/performance')
        .expect(200);

      expect(response.body.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(response.body.requestCount).toBeGreaterThanOrEqual(0);
      expect(response.body.errorRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Administrative Endpoints', () => {
    it('should return routing table', async () => {
      const response = await request(bridgeService.getApp())
        .get('/routing/table')
        .expect(200);

      expect(response.body.message).toBe('Routing table endpoint');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle routing rules updates', async () => {
      const updateRequest = {
        rules: [
          {
            command: '/test',
            primary: 'test-server',
            fallback: ['backup-server']
          }
        ]
      };

      const response = await request(bridgeService.getApp())
        .post('/routing/rules')
        .send(updateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.rulesUpdated).toBe(1);
    });

    it('should return connection status', async () => {
      const response = await request(bridgeService.getApp())
        .get('/status/connections')
        .expect(200);

      expect(response.body.totalConnections).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.body.connections)).toBe(true);
    });
  });

  describe('Circuit Breaker Endpoints', () => {
    it('should handle circuit breaker toggle', async () => {
      const toggleRequest = {
        serverName: 'test-server',
        enabled: true
      };

      const response = await request(bridgeService.getApp())
        .post('/circuit-breaker/toggle')
        .send(toggleRequest)
        .expect(200);

      expect(response.body.serverName).toBe('test-server');
      expect(response.body.enabled).toBe(true);
    });
  });

  describe('Hook Coordination', () => {
    it('should coordinate hooks correctly', async () => {
      const operation = 'route_command';
      const context = {
        args: { command: '/analyze @test' },
        userId: 'test-user'
      };

      const result = await bridgeService.coordinateHooks(operation, context);

      expect(result.success).toBe(true);
      expect(result.optimizationApplied).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle hook coordination errors gracefully', async () => {
      const operation = 'invalid_operation';
      const context = null; // Invalid context

      const result = await bridgeService.coordinateHooks(operation, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const metrics = bridgeService.monitorPerformance();

      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.requestCount).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
    });

    it('should maintain connection count', () => {
      const connectionCount = bridgeService.getConnectionCount();
      expect(connectionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Management', () => {
    it('should report service running status', () => {
      const isRunning = bridgeService.isServiceRunning();
      expect(isRunning).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(bridgeService.getApp())
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(bridgeService.getApp())
        .post('/hooks/pretooluse')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express returns different error formats for malformed JSON
      // We just need to ensure it returns a 400 status
      expect(response.status).toBe(400);
    });

    it('should handle large payloads', async () => {
      const largePayload = {
        hookType: 'PreToolUse',
        tool: 'test_tool',
        args: {
          data: 'x'.repeat(1000000) // 1MB of data
        },
        context: {},
        metadata: {
          timestamp: new Date().toISOString(),
          correlationId: 'large-payload-test'
        }
      };

      const response = await request(bridgeService.getApp())
        .post('/hooks/pretooluse')
        .send(largePayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});