import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock fetch for tests
  global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlString = url.toString();
    
    // Mock health check responses
    if (urlString.includes('/health')) {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Mock metrics responses
    if (urlString.includes('/metrics')) {
      return new Response(JSON.stringify({
        averageResponseTime: 50,
        requestCount: 100,
        errorRate: 0.01
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default mock response
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  };
});

afterAll(async () => {
  // Cleanup after all tests
  delete (global as any).fetch;
});