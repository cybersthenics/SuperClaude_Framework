import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoutingEngine } from '../../src/core/RoutingEngine.js';
import { RoutingTable } from '../../src/routing/RoutingTable.js';
import { ServerHealth } from '../../src/routing/ServerHealth.js';
import { CircuitBreaker } from '../../src/routing/CircuitBreaker.js';

// Mock dependencies
vi.mock('../../src/routing/RoutingTable.js');
vi.mock('../../src/routing/ServerHealth.js');
vi.mock('../../src/routing/CircuitBreaker.js');

describe('RoutingEngine', () => {
  let engine: RoutingEngine;
  let mockRoutingTable: any;
  let mockServerHealth: any;
  let mockCircuitBreaker: any;

  beforeEach(() => {
    mockRoutingTable = {
      getRoutingRule: vi.fn(),
      getExternalMCPPatterns: vi.fn(() => ({
        context7Patterns: ['documentation', 'patterns'],
        sequentialPatterns: ['complex', 'analysis'],
        magicPatterns: ['component', 'ui'],
        playwrightPatterns: ['test', 'e2e']
      }))
    };

    mockServerHealth = {
      checkServerHealth: vi.fn(),
      isServerHealthy: vi.fn(() => true),
      getHealthStatus: vi.fn(() => ({
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 50,
        metrics: {
          averageResponseTime: 50,
          requestCount: 100,
          errorRate: 0.01
        }
      }))
    };

    mockCircuitBreaker = {
      checkServerAvailability: vi.fn(() => true)
    };

    engine = new RoutingEngine(mockRoutingTable, mockServerHealth, mockCircuitBreaker);
  });

  describe('determineTargetServer', () => {
    it('should route analyze commands to intelligence server', async () => {
      const command = { 
        command: '/analyze', 
        arguments: [], 
        flags: [],
        rawInput: '/analyze'
      };
      const context = {};

      mockRoutingTable.getRoutingRule.mockReturnValue({
        command: '/analyze',
        primary: 'superclaude-intelligence',
        fallback: ['superclaude-orchestrator'],
        personas: ['analyzer', 'architect'],
        complexityThreshold: 0.6
      });

      const result = await engine.determineTargetServer(command, context);

      expect(result.targetServer).toBe('superclaude-intelligence');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.routingReason).toContain('superclaude-intelligence');
    });

    it('should handle fallback when primary server is unavailable', async () => {
      const command = { 
        command: '/build', 
        arguments: [], 
        flags: [],
        rawInput: '/build'
      };
      const context = {};

      mockRoutingTable.getRoutingRule.mockReturnValue({
        command: '/build',
        primary: 'superclaude-builder',
        fallback: ['superclaude-orchestrator'],
        personas: ['frontend', 'backend']
      });

      mockCircuitBreaker.checkServerAvailability.mockImplementation((server: string) => {
        return server !== 'superclaude-builder'; // Primary is unavailable
      });

      const result = await engine.determineTargetServer(command, context);

      expect(result.fallbackServers).toContain('superclaude-orchestrator');
    });

    it('should create fallback decision when no routing rule exists', async () => {
      const command = { 
        command: '/unknown', 
        arguments: [], 
        flags: [],
        rawInput: '/unknown'
      };
      const context = {};

      mockRoutingTable.getRoutingRule.mockReturnValue(null);

      const result = await engine.determineTargetServer(command, context);

      expect(result.targetServer).toBe('superclaude-orchestrator');
      expect(result.confidence).toBe(0.5);
      expect(result.routingReason).toContain('Fallback routing');
    });
  });

  describe('evaluateRoutingRules', () => {
    it('should return server matches for valid command', () => {
      mockRoutingTable.getRoutingRule.mockReturnValue({
        command: '/scan',
        primary: 'superclaude-quality',
        fallback: ['superclaude-orchestrator'],
        personas: ['security', 'qa']
      });

      const matches = engine.evaluateRoutingRules('/scan', ['--focus=security']);

      expect(matches).toHaveLength(2);
      expect(matches[0].serverName).toBe('superclaude-quality');
      expect(matches[0].score).toBeGreaterThan(matches[1].score);
    });

    it('should return empty array for invalid command', () => {
      mockRoutingTable.getRoutingRule.mockReturnValue(null);

      const matches = engine.evaluateRoutingRules('/invalid', []);

      expect(matches).toHaveLength(0);
    });
  });

  describe('selectOptimalServer', () => {
    it('should select preferred server when healthy', async () => {
      const matches = [
        { serverName: 'superclaude-intelligence', score: 1.0, reason: 'Primary' },
        { serverName: 'superclaude-orchestrator', score: 0.8, reason: 'Fallback' }
      ];

      const result = await engine.selectOptimalServer(matches, 'superclaude-intelligence');

      expect(result).toBe('superclaude-intelligence');
    });

    it('should fallback to next best server when preferred is unhealthy', async () => {
      const matches = [
        { serverName: 'superclaude-intelligence', score: 1.0, reason: 'Primary' },
        { serverName: 'superclaude-orchestrator', score: 0.8, reason: 'Fallback' }
      ];

      mockServerHealth.isServerHealthy.mockImplementation((server: string) => {
        return server !== 'superclaude-intelligence'; // Primary is unhealthy
      });

      const result = await engine.selectOptimalServer(matches, 'superclaude-intelligence');

      expect(result).toBe('superclaude-orchestrator');
    });

    it('should return first match when no preferred server specified', async () => {
      const matches = [
        { serverName: 'superclaude-quality', score: 1.0, reason: 'Primary' }
      ];

      const result = await engine.selectOptimalServer(matches);

      expect(result).toBe('superclaude-quality');
    });
  });

  describe('shouldUseExternalMCP', () => {
    it('should detect context7 patterns', () => {
      const command = { 
        command: '/explain', 
        arguments: ['documentation', 'patterns'], 
        flags: [],
        rawInput: '/explain documentation patterns'
      };

      const result = engine.shouldUseExternalMCP(command, []);

      expect(result.context7).toBe(true);
    });

    it('should detect sequential patterns', () => {
      const command = { 
        command: '/analyze', 
        arguments: ['complex', 'analysis'], 
        flags: [],
        rawInput: '/analyze complex analysis'
      };

      const result = engine.shouldUseExternalMCP(command, []);

      expect(result.sequential).toBe(true);
    });

    it('should detect magic patterns', () => {
      const command = { 
        command: '/build', 
        arguments: ['component'], 
        flags: [],
        rawInput: '/build component'
      };

      const result = engine.shouldUseExternalMCP(command, []);

      expect(result.magic).toBe(true);
    });

    it('should detect playwright patterns', () => {
      const command = { 
        command: '/test', 
        arguments: ['e2e'], 
        flags: [],
        rawInput: '/test e2e'
      };

      const result = engine.shouldUseExternalMCP(command, []);

      expect(result.playwright).toBe(true);
    });

    it('should detect MCP flags', () => {
      const command = { 
        command: '/analyze', 
        arguments: [], 
        flags: [],
        rawInput: '/analyze'
      };

      const flags = ['--c7', '--seq', '--magic', '--play'];
      const result = engine.shouldUseExternalMCP(command, flags);

      expect(result.context7).toBe(true);
      expect(result.sequential).toBe(true);
      expect(result.magic).toBe(true);
      expect(result.playwright).toBe(true);
    });

    it('should detect thinking flags for sequential', () => {
      const command = { 
        command: '/analyze', 
        arguments: [], 
        flags: [],
        rawInput: '/analyze'
      };

      const flags = ['--think-hard'];
      const result = engine.shouldUseExternalMCP(command, flags);

      expect(result.sequential).toBe(true);
    });
  });

  describe('checkServerHealth', () => {
    it('should delegate to ServerHealth', async () => {
      const mockHealth = {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 50
      };

      mockServerHealth.checkServerHealth.mockResolvedValue(mockHealth);

      const result = await engine.checkServerHealth('superclaude-intelligence');

      expect(result).toEqual(mockHealth);
      expect(mockServerHealth.checkServerHealth).toHaveBeenCalledWith('superclaude-intelligence');
    });
  });
});