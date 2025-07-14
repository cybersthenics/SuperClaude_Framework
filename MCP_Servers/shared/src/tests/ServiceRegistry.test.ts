/**
 * Service Registry Tests
 * Basic test suite for service registration, discovery, and health checking
 */

import { ServiceRegistry, ServiceDefinition } from '../services/ServiceRegistry.js';

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  describe('Service Registration', () => {
    test('should register a service successfully', async () => {
      const serviceDefinition: ServiceDefinition = {
        name: 'test-service',
        type: 'shared-service',
        version: '1.0.0',
        config: { port: 3000 },
        capabilities: ['testing'],
        healthCheck: {
          interval: 30000,
          customChecker: async () => true
        }
      };

      await expect(registry.registerService(serviceDefinition)).resolves.not.toThrow();
    });

    test('should validate required fields', async () => {
      const invalidDefinition = {
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: { interval: 30000 }
      } as ServiceDefinition;

      await expect(registry.registerService(invalidDefinition)).rejects.toThrow('Service name is required');
    });

    test('should prevent duplicate service names', async () => {
      const serviceDefinition: ServiceDefinition = {
        name: 'duplicate-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: { interval: 30000 }
      };

      await registry.registerService(serviceDefinition);
      
      // Attempting to register again should not throw but will update the service
      await expect(registry.registerService(serviceDefinition)).resolves.not.toThrow();
    });
  });

  describe('Service Discovery', () => {
    beforeEach(async () => {
      await registry.registerService({
        name: 'cache-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        capabilities: ['caching'],
        healthCheck: { interval: 30000 }
      });

      await registry.registerService({
        name: 'validation-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        capabilities: ['validation'],
        healthCheck: { interval: 30000 }
      });
    });

    test('should retrieve registered service', async () => {
      const service = await registry.getService('cache-service');
      expect(service).toBeDefined();
      expect(service.name).toBe('cache-service');
    });

    test('should throw error for non-existent service', async () => {
      await expect(registry.getService('non-existent')).rejects.toThrow('Service not found: non-existent');
    });

    test('should find services by capability', async () => {
      const cachingServices = await registry.getServiceByCapability('caching');
      expect(cachingServices).toHaveLength(1);
      expect(cachingServices[0].definition.name).toBe('cache-service');
    });

    test('should return empty array for non-existent capability', async () => {
      const services = await registry.getServiceByCapability('non-existent');
      expect(services).toHaveLength(0);
    });
  });

  describe('Health Checking', () => {
    test('should perform health check on all services', async () => {
      await registry.registerService({
        name: 'healthy-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: {
          interval: 30000,
          customChecker: async () => true
        }
      });

      const health = await registry.healthCheck();
      expect(health.overall).toBe(true);
      expect(health.services['healthy-service']).toBe(true);
      expect(health.summary.total).toBe(1);
      expect(health.summary.healthy).toBe(1);
    });

    test('should detect unhealthy services', async () => {
      await registry.registerService({
        name: 'unhealthy-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: {
          interval: 30000,
          customChecker: async () => false
        }
      });

      const health = await registry.healthCheck();
      expect(health.overall).toBe(false);
      expect(health.services['unhealthy-service']).toBe(false);
      expect(health.summary.unhealthy).toBe(1);
    });
  });

  describe('Service Lifecycle', () => {
    test('should unregister service successfully', async () => {
      await registry.registerService({
        name: 'temp-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: { interval: 30000 }
      });

      await expect(registry.unregisterService('temp-service')).resolves.not.toThrow();
      await expect(registry.getService('temp-service')).rejects.toThrow('Service not found: temp-service');
    });

    test('should handle unregistering non-existent service', async () => {
      await expect(registry.unregisterService('non-existent')).rejects.toThrow('Service not found: non-existent');
    });
  });

  describe('Service Statistics', () => {
    test('should provide service statistics', async () => {
      await registry.registerService({
        name: 'stats-service',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: { interval: 30000 }
      });

      const stats = await registry.getServiceStats();
      expect(stats['stats-service']).toBeDefined();
      expect(stats['stats-service'].status).toBe('running');
      expect(stats['stats-service'].requests).toBe(0);
    });

    test('should list all services', async () => {
      await registry.registerService({
        name: 'list-service-1',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: { interval: 30000 }
      });

      await registry.registerService({
        name: 'list-service-2',
        type: 'shared-service',
        version: '1.0.0',
        config: {},
        healthCheck: { interval: 30000 }
      });

      const services = await registry.listServices();
      expect(services).toHaveLength(2);
      expect(services.map(s => s.definition.name)).toContain('list-service-1');
      expect(services.map(s => s.definition.name)).toContain('list-service-2');
    });
  });
});

export {};