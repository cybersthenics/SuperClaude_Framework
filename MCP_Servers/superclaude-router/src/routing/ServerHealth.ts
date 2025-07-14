import { 
  ServerHealthInterface, 
  HealthStatus, 
  PerformanceMetrics 
} from '../types/index.js';

export class ServerHealth implements ServerHealthInterface {
  private healthCache: Map<string, HealthStatus> = new Map();
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.startHealthChecks();
  }

  async checkServerHealth(serverName: string): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.performHealthCheck(serverName);
      const responseTime = Date.now() - startTime;
      
      const healthStatus: HealthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime,
        metrics: await this.collectMetrics(serverName)
      };

      this.updateHealthStatus(serverName, healthStatus);
      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthStatus: HealthStatus = {
        status: 'unknown',
        lastCheck: new Date(),
        responseTime
      };

      this.updateHealthStatus(serverName, healthStatus);
      return healthStatus;
    }
  }

  updateHealthStatus(serverName: string, status: HealthStatus): void {
    this.healthCache.set(serverName, status);
  }

  getHealthStatus(serverName: string): HealthStatus | null {
    return this.healthCache.get(serverName) || null;
  }

  isServerHealthy(serverName: string): boolean {
    const status = this.getHealthStatus(serverName);
    return status?.status === 'healthy';
  }

  getAllHealthStatuses(): Map<string, HealthStatus> {
    return new Map(this.healthCache);
  }

  setHealthCheckInterval(intervalMs: number): void {
    this.healthCheckInterval = intervalMs;
  }

  private async performHealthCheck(serverName: string): Promise<boolean> {
    try {
      switch (serverName) {
        case 'superclaude-orchestrator':
        case 'superclaude-intelligence':
        case 'superclaude-builder':
        case 'superclaude-quality':
        case 'superclaude-personas':
        case 'superclaude-tasks':
        case 'superclaude-docs':
        case 'superclaude-ui':
        case 'superclaude-performance':
          return await this.checkMCPServerHealth(serverName);
        
        default:
          return await this.checkExternalServerHealth(serverName);
      }
    } catch (error) {
      console.error(`Health check failed for ${serverName}:`, error);
      return false;
    }
  }

  private async checkMCPServerHealth(serverName: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://localhost:${this.getServerPort(serverName)}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkExternalServerHealth(serverName: string): Promise<boolean> {
    switch (serverName) {
      case 'context7':
        return await this.checkContext7Health();
      case 'sequential':
        return await this.checkSequentialHealth();
      case 'magic':
        return await this.checkMagicHealth();
      case 'playwright':
        return await this.checkPlaywrightHealth();
      default:
        return false;
    }
  }

  private async checkContext7Health(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }

  private async checkSequentialHealth(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }

  private async checkMagicHealth(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }

  private async checkPlaywrightHealth(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }

  private async collectMetrics(serverName: string): Promise<PerformanceMetrics> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`http://localhost:${this.getServerPort(serverName)}/metrics`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const metrics = await response.json();
        return {
          averageResponseTime: metrics.averageResponseTime || 0,
          requestCount: metrics.requestCount || 0,
          errorRate: metrics.errorRate || 0,
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage
        };
      }
    } catch (error) {
    }

    return {
      averageResponseTime: 0,
      requestCount: 0,
      errorRate: 0
    };
  }

  private getServerPort(serverName: string): number {
    const portMap: Record<string, number> = {
      'superclaude-orchestrator': 8081,
      'superclaude-intelligence': 8082,
      'superclaude-builder': 8083,
      'superclaude-quality': 8084,
      'superclaude-personas': 8085,
      'superclaude-tasks': 8086,
      'superclaude-docs': 8087,
      'superclaude-ui': 8088,
      'superclaude-performance': 8089
    };

    return portMap[serverName] || 8000;
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      const servers = [
        'superclaude-orchestrator',
        'superclaude-intelligence',
        'superclaude-builder',
        'superclaude-quality',
        'superclaude-personas',
        'superclaude-tasks',
        'superclaude-docs',
        'superclaude-ui',
        'superclaude-performance'
      ];

      for (const server of servers) {
        try {
          await this.checkServerHealth(server);
        } catch (error) {
          console.error(`Scheduled health check failed for ${server}:`, error);
        }
      }
    }, this.healthCheckInterval);
  }
}