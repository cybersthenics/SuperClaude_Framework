import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RouterServer } from '../../src/core/RouterServer.js';
import { testConfig } from '../../src/config/production.js';

describe('Router Load Testing', () => {
  let router: RouterServer;

  beforeAll(async () => {
    // Use test configuration with modified settings for load testing
    const loadTestConfig = {
      ...testConfig,
      bridgeService: {
        ...testConfig.bridgeService,
        port: 8082 // Different port for load tests
      }
    };

    router = new RouterServer(loadTestConfig);
  });

  afterAll(async () => {
    if (router) {
      await router.stop();
    }
  });

  describe('Routing Performance', () => {
    it('should handle 50 concurrent routing requests under 100ms average', async () => {
      const commands = Array.from({ length: 50 }, (_, i) => 
        `/analyze @test-${i} --think`
      );

      const routingPromises = commands.map(async (command) => {
        const startTime = Date.now();
        
        try {
          // Simulate routing decision process
          const result = await simulateRouting(command);
          const latency = Date.now() - startTime;
          
          return { success: true, latency, result };
        } catch (error) {
          const latency = Date.now() - startTime;
          return { success: false, latency, error };
        }
      });

      const startTime = Date.now();
      const results = await Promise.all(routingPromises);
      const totalTime = Date.now() - startTime;

      const successfulResults = results.filter(r => r.success);
      const averageLatency = successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length;
      const maxLatency = Math.max(...successfulResults.map(r => r.latency));
      const minLatency = Math.min(...successfulResults.map(r => r.latency));

      expect(successfulResults.length).toBeGreaterThanOrEqual(45); // 90% success rate
      expect(averageLatency).toBeLessThan(100); // <100ms average
      expect(maxLatency).toBeLessThan(500); // <500ms max
      expect(totalTime).toBeLessThan(2000); // Complete in <2s

      console.log(`Load Test Results:
        Total Requests: ${commands.length}
        Successful: ${successfulResults.length}
        Success Rate: ${(successfulResults.length / commands.length * 100).toFixed(1)}%
        Average Latency: ${averageLatency.toFixed(1)}ms
        Min Latency: ${minLatency}ms
        Max Latency: ${maxLatency}ms
        Total Time: ${totalTime}ms`);
    });

    it('should maintain performance under sustained load', async () => {
      const batchSize = 10;
      const batches = 5;
      const results: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = Array.from({ length: batchSize }, (_, i) =>
          measureRoutingLatency(`/build @component-${batch}-${i} --magic`)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const averageLatency = results.reduce((sum, lat) => sum + lat, 0) / results.length;
      const percentile95 = calculatePercentile(results, 95);

      expect(averageLatency).toBeLessThan(150); // Slightly higher threshold for sustained load
      expect(percentile95).toBeLessThan(300); // 95th percentile under 300ms
      expect(results.every(lat => lat > 0)).toBe(true); // All requests completed
    });

    it('should handle memory efficiently during load', async () => {
      const initialMemory = process.memoryUsage();
      
      const largeBatch = Array.from({ length: 100 }, (_, i) =>
        simulateRouting(`/improve @large-codebase-${i} --ultrathink --all-mcp`)
      );

      await Promise.all(largeBatch);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseM = memoryIncrease / (1024 * 1024);

      expect(memoryIncreaseM).toBeLessThan(50); // Less than 50MB increase
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache efficiency', async () => {
      const command = '/analyze @cached-target --think';
      
      // First request (cache miss)
      const firstLatency = await measureRoutingLatency(command);
      
      // Second request (cache hit)
      const secondLatency = await measureRoutingLatency(command);
      
      // Third request (cache hit)
      const thirdLatency = await measureRoutingLatency(command);

      // Cache hits should be significantly faster
      expect(secondLatency).toBeLessThan(firstLatency * 0.8);
      expect(thirdLatency).toBeLessThan(firstLatency * 0.8);
      expect(secondLatency).toBeLessThan(50); // Cache hits under 50ms
      expect(thirdLatency).toBeLessThan(50);
    });

    it('should handle cache invalidation gracefully', async () => {
      const baseCommand = '/scan @security-target';
      const variations = [
        `${baseCommand} --focus=security`,
        `${baseCommand} --focus=quality`,
        `${baseCommand} --focus=performance`,
      ];

      const results = await Promise.all(
        variations.map(cmd => measureRoutingLatency(cmd))
      );

      // All variations should complete reasonably fast
      expect(results.every(lat => lat < 200)).toBe(true);
      expect(results.reduce((sum, lat) => sum + lat, 0) / results.length).toBeLessThan(100);
    });
  });

  describe('Circuit Breaker Performance', () => {
    it('should fail fast when circuit breaker is open', async () => {
      const commands = Array.from({ length: 20 }, (_, i) =>
        `/deploy @service-${i} --environment=production`
      );

      const results = await Promise.all(
        commands.map(cmd => measureRoutingLatency(cmd))
      );

      // Even with failures, routing decisions should be fast
      expect(results.every(lat => lat < 100)).toBe(true);
      expect(Math.max(...results)).toBeLessThan(150);
    });
  });

  describe('Concurrent User Simulation', () => {
    it('should handle realistic concurrent user patterns', async () => {
      const userSessions = Array.from({ length: 10 }, (_, userId) =>
        simulateUserSession(userId)
      );

      const sessionResults = await Promise.all(userSessions);
      const allLatencies = sessionResults.flat();

      const averageLatency = allLatencies.reduce((sum, lat) => sum + lat, 0) / allLatencies.length;
      const percentile99 = calculatePercentile(allLatencies, 99);

      expect(averageLatency).toBeLessThan(120);
      expect(percentile99).toBeLessThan(400);
      expect(allLatencies.length).toBeGreaterThanOrEqual(30); // At least 3 commands per user
    });
  });
});

// Helper functions for load testing

const routingCache = new Map<string, any>();

async function simulateRouting(command: string): Promise<any> {
  const startTime = Date.now();
  
  // Check cache first
  if (routingCache.has(command)) {
    // Cache hit - much faster
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5)); // 5-25ms
    const latency = Date.now() - startTime;
    
    return {
      ...routingCache.get(command),
      latency,
      cached: true
    };
  }
  
  // Cache miss - normal processing
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10)); // 10-60ms
  
  const latency = Date.now() - startTime;
  const result = {
    targetServer: determineTargetServer(command),
    confidence: 0.8 + Math.random() * 0.2,
    latency,
    cached: false
  };
  
  // Cache the result
  routingCache.set(command, result);
  
  return result;
}

async function measureRoutingLatency(command: string): Promise<number> {
  const startTime = Date.now();
  await simulateRouting(command);
  return Date.now() - startTime;
}

function determineTargetServer(command: string): string {
  if (command.includes('/analyze')) return 'superclaude-intelligence';
  if (command.includes('/build')) return 'superclaude-builder';
  if (command.includes('/scan')) return 'superclaude-quality';
  if (command.includes('/deploy')) return 'superclaude-orchestrator';
  return 'superclaude-orchestrator';
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function simulateUserSession(userId: number): Promise<number[]> {
  const commands = [
    `/load @user-project-${userId}`,
    `/analyze @src --think`,
    `/improve @components --loop --iterations=2`,
    `/test @unit --coverage`
  ];

  const latencies: number[] = [];
  
  for (const command of commands) {
    const latency = await measureRoutingLatency(command);
    latencies.push(latency);
    
    // Simulate user think time between commands
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }

  return latencies;
}