// Jest setup file for SuperClaude Hooks Integration tests

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.BRIDGE_SERVICE_PORT = '8080';

// Global test helpers
global.testHelpers = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createMockHookContext: (operation = 'test-operation', sessionId = 'test-session') => ({
    sessionId,
    operation,
    parameters: { test: true },
    metadata: {
      timestamp: Date.now(),
      correlationId: `test-correlation-${Date.now()}`,
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
  })
};

// Clean up after tests
afterEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
});