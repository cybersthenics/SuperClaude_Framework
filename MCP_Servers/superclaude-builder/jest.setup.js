// Jest setup file for SuperClaude Builder tests

// Mock console methods to reduce test noise
const originalConsole = { ...console };

beforeEach(() => {
  // Mock console.error to avoid noise in tests
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // Keep console.log for debugging
  console.log = originalConsole.log;
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
});

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({
      success: true,
      data: {}
    }),
  })
);

// Mock process.exit
const originalExit = process.exit;
process.exit = jest.fn();

afterAll(() => {
  process.exit = originalExit;
});

// Mock setTimeout for consistent testing
jest.useFakeTimers();

// Common test utilities
global.createMockSymbolReference = (overrides = {}) => ({
  symbolId: 'test-symbol',
  location: {
    uri: 'file:///test.ts',
    range: {
      start: { line: 10, character: 5 },
      end: { line: 10, character: 15 }
    }
  },
  type: { name: 'string', kind: 'primitive' },
  scope: { 
    kind: 'function', 
    name: 'testFunction', 
    range: { 
      start: { line: 8, character: 0 }, 
      end: { line: 20, character: 1 } 
    } 
  },
  dependencies: [],
  usages: [],
  name: 'testSymbol',
  kind: 'variable',
  ...overrides
});

global.createMockCodeSelection = (overrides = {}) => ({
  uri: 'file:///test.ts',
  range: {
    start: { line: 10, character: 0 },
    end: { line: 15, character: 10 }
  },
  text: 'const result = test();\nreturn result;',
  ...overrides
});

global.createMockFramework = (overrides = {}) => ({
  name: 'react',
  version: '18.0.0',
  conventions: {
    naming: { component: 'PascalCase' },
    structure: { props: 'interface' },
    patterns: {}
  },
  patterns: [],
  generators: [],
  validators: [],
  ...overrides
});

// Error matchers
expect.extend({
  toThrowWithMessage(received, expectedMessage) {
    try {
      if (typeof received === 'function') {
        received();
      } else {
        // Handle promises
        return received.then(
          () => ({ pass: false, message: () => 'Expected function to throw' }),
          (error) => ({
            pass: error.message.includes(expectedMessage),
            message: () => `Expected error message to contain "${expectedMessage}", got "${error.message}"`
          })
        );
      }
      return { pass: false, message: () => 'Expected function to throw' };
    } catch (error) {
      return {
        pass: error.message.includes(expectedMessage),
        message: () => `Expected error message to contain "${expectedMessage}", got "${error.message}"`
      };
    }
  }
});