import { HookCoordinator } from '../core/HookCoordinator.js';
import { BridgeService } from '../core/BridgeService.js';
import { HookType, HookContext, SYSTEM_PERFORMANCE_TARGETS } from '../types/index.js';

describe('SuperClaude Hooks Integration', () => {
  let hookCoordinator: HookCoordinator;
  let bridgeService: BridgeService;

  beforeAll(async () => {
    hookCoordinator = new HookCoordinator();
    bridgeService = new BridgeService('test-secret');
  });

  afterAll(async () => {
    await bridgeService.stopService();
  });

  describe('Hook Coordinator', () => {
    test('should register all 7 hook types', () => {
      const registeredHooks = hookCoordinator.getRegisteredHooks();
      expect(registeredHooks).toHaveLength(7);
      
      const expectedHooks = [
        HookType.PreToolUse,
        HookType.PostToolUse,
        HookType.PrePrompt,
        HookType.PostPrompt,
        HookType.PreCompact,
        HookType.Stop,
        HookType.SubagentStop
      ];
      
      expectedHooks.forEach(hookType => {
        expect(registeredHooks).toContain(hookType);
      });
    });

    test('should have correct server mappings', () => {
      expect(hookCoordinator.getServerMapping(HookType.PreToolUse)).toBe('superclaude-router');
      expect(hookCoordinator.getServerMapping(HookType.PostToolUse)).toBe('superclaude-quality');
      expect(hookCoordinator.getServerMapping(HookType.PrePrompt)).toBe('superclaude-personas');
      expect(hookCoordinator.getServerMapping(HookType.PostPrompt)).toBe('superclaude-personas');
      expect(hookCoordinator.getServerMapping(HookType.PreCompact)).toBe('superclaude-intelligence');
      expect(hookCoordinator.getServerMapping(HookType.Stop)).toBe('superclaude-orchestrator');
      expect(hookCoordinator.getServerMapping(HookType.SubagentStop)).toBe('superclaude-orchestrator');
    });
  });

  describe('Hook Execution Performance', () => {
    const createTestContext = (operation: string): HookContext => ({
      sessionId: 'test-session-001',
      operation,
      parameters: { test: true },
      metadata: {
        timestamp: Date.now(),
        correlationId: 'test-correlation-001',
        priority: 'medium'
      },
      performance: {
        budget: {
          maxExecutionTime: 100,
          maxMemoryUsage: 100,
          maxCPUUsage: 50,
          cacheHitRateTarget: 80,
          optimizationFactor: 2.0
        },
        trackingEnabled: true
      },
      cache: {
        enabled: true,
        strategy: {
          useSemanticCache: false,
          useLSPCache: false,
          cacheHookResult: true,
          ttl: 3600
        }
      }
    });

    test('PreToolUse hook should execute within performance budget', async () => {
      const context = createTestContext('test-operation');
      const startTime = performance.now();
      
      const result = await hookCoordinator.executeHook(HookType.PreToolUse, context);
      const executionTime = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(74 * 1.5); // 50% tolerance
      expect(result.performance.optimizationFactor).toBeGreaterThan(1.0);
    });

    test('PostToolUse hook should execute within performance budget', async () => {
      const context = createTestContext('test-validation');
      context.data = { success: true, test: 'data' };
      
      const startTime = performance.now();
      const result = await hookCoordinator.executeHook(HookType.PostToolUse, context);
      const executionTime = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(71 * 1.5); // 50% tolerance
      expect(result.performance.optimizationFactor).toBeGreaterThan(1.0);
    });

    test('PrePrompt hook should execute within performance budget', async () => {
      const context = createTestContext('analyze-architecture');
      
      const startTime = performance.now();
      const result = await hookCoordinator.executeHook(HookType.PrePrompt, context);
      const executionTime = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(25 * 1.5); // 50% tolerance
      expect(result.performance.optimizationFactor).toBeGreaterThan(4.0);
    });

    test('PreCompact hook should execute within performance budget', async () => {
      const context = createTestContext('complex-reasoning');
      context.semantic = {
        enabled: true,
        projectContext: 'test-project',
        semanticKey: 'test-semantic-key',
        lspEnabled: true
      };
      
      const startTime = performance.now();
      const result = await hookCoordinator.executeHook(HookType.PreCompact, context);
      const executionTime = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(72 * 1.5); // 50% tolerance
      expect(result.performance.optimizationFactor).toBeGreaterThan(4.0);
    });
  });

  describe('System Performance Targets', () => {
    test('should meet overall system performance targets', async () => {
      const systemHealth = await hookCoordinator.getSystemHealth();
      
      expect(systemHealth.registeredHooks).toBe(7);
      expect(systemHealth.systemHealth.withinBudget).toBe(true);
      expect(systemHealth.systemHealth.optimizationTarget).toBe(true);
      expect(systemHealth.systemHealth.reliabilityTarget).toBe(true);
    });

    test('performance targets should match proven values', () => {
      expect(SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME).toBe(62);
      expect(SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR).toBe(2.84);
      expect(SYSTEM_PERFORMANCE_TARGETS.CACHE_HIT_RATE_MINIMUM).toBe(0.8);
      expect(SYSTEM_PERFORMANCE_TARGETS.RELIABILITY_TARGET).toBe(1.0);
    });
  });

  describe('Bridge Service', () => {
    test('should start and stop successfully', async () => {
      const testPort = 8081; // Use different port for testing
      
      await bridgeService.startService(testPort);
      const status = await bridgeService.getServiceStatus();
      
      expect(status.status).toBe('running');
      expect(status.connections).toBe(0);
      
      await bridgeService.stopService();
      const finalStatus = await bridgeService.getServiceStatus();
      expect(finalStatus.status).toBe('stopped');
    });

    test('should pass health checks', async () => {
      const testPort = 8082;
      await bridgeService.startService(testPort);
      
      const health = await bridgeService.healthCheck();
      
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('healthy');
      expect(health.checks.length).toBeGreaterThan(0);
      
      await bridgeService.stopService();
    });
  });

  describe('Hook Chain Execution', () => {
    test('should execute hook chain successfully', async () => {
      const context = createTestContext('chain-test-operation');
      const hookChain = [
        HookType.PrePrompt,
        HookType.PreToolUse,
        HookType.PostToolUse
      ];
      
      const results = await hookCoordinator.executeHookChain(hookChain, context);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  // Helper function to create test context
  function createTestContext(operation: string): HookContext {
    return {
      sessionId: 'test-session-001',
      operation,
      parameters: { test: true },
      metadata: {
        timestamp: Date.now(),
        correlationId: 'test-correlation-001',
        priority: 'medium'
      },
      performance: {
        budget: {
          maxExecutionTime: 100,
          maxMemoryUsage: 100,
          maxCPUUsage: 50,
          cacheHitRateTarget: 80,
          optimizationFactor: 2.0
        },
        trackingEnabled: true
      },
      cache: {
        enabled: true,
        strategy: {
          useSemanticCache: false,
          useLSPCache: false,
          cacheHookResult: true,
          ttl: 3600
        }
      }
    };
  }
});