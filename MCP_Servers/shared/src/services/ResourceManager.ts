/**
 * Resource Manager for Shared Services Infrastructure
 * Token allocation, memory management, and resource optimization
 */

import { EventEmitter } from 'events';

export interface TokenAllocation {
  id: string;
  tokens: number;
  operation: string;
  timestamp: Date;
  expiresAt: Date;
  serverId: string;
  priority: AllocationPriority;
}

export interface MemoryAllocation {
  id: string;
  size: number;
  operation: string;
  timestamp: Date;
  expiresAt: Date;
  serverId: string;
  type: MemoryType;
}

export interface ConcurrencySlot {
  id: string;
  operation: string;
  timestamp: Date;
  serverId: string;
  weight: number;
}

export interface TokenBudget {
  serverId: string;
  allocated: number;
  used: number;
  remaining: number;
  dailyLimit: number;
  resetTime: Date;
}

export interface MemoryUsage {
  total: number;
  used: number;
  available: number;
  allocations: MemoryAllocation[];
  fragmentation: number;
}

export interface ConcurrencyStatus {
  maxConcurrency: number;
  currentConcurrency: number;
  availableSlots: number;
  queuedRequests: number;
  averageExecutionTime: number;
}

export interface ResourcePrediction {
  estimatedTokens: number;
  estimatedMemory: number;
  estimatedDuration: number;
  confidence: number;
  basedOnOperations: string[];
}

export interface OptimizationResult {
  success: boolean;
  improvements: ResourceImprovement[];
  estimatedSavings: ResourceSavings;
  implementationEffort: ImplementationEffort;
}

export interface ResourceImprovement {
  type: 'token' | 'memory' | 'concurrency' | 'cache';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimatedSavings: number;
}

export interface ResourceSavings {
  tokenSavings: number;
  memorySavings: number;
  timeSavings: number;
  costSavings: number;
}

export interface ImplementationEffort {
  timeRequired: number;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  risks: string[];
}

export interface QuotaEnforcement {
  enforced: boolean;
  quotaType: 'token' | 'memory' | 'concurrency';
  currentUsage: number;
  limit: number;
  action: 'allowed' | 'throttled' | 'denied';
  retryAfter?: Date;
}

export interface ResourceThreshold {
  type: 'token' | 'memory' | 'concurrency';
  threshold: number;
  action: 'warn' | 'throttle' | 'deny';
  notificationTarget: string;
}

export interface ResourceMetrics {
  tokenUsage: TokenUsageMetrics;
  memoryUsage: MemoryUsageMetrics;
  cpuUsage: CPUUsageMetrics;
  concurrency: ConcurrencyMetrics;
  efficiency: EfficiencyMetrics;
}

export interface TokenUsageMetrics {
  totalAllocated: number;
  totalUsed: number;
  efficiency: number;
  wasteRate: number;
  averageOperationCost: number;
  topConsumers: Array<{ serverId: string; usage: number }>;
}

export interface MemoryUsageMetrics {
  totalAllocated: number;
  peakUsage: number;
  averageUsage: number;
  fragmentation: number;
  leakDetection: MemoryLeak[];
  gcPressure: number;
}

export interface CPUUsageMetrics {
  averageUsage: number;
  peakUsage: number;
  coreUtilization: number[];
  throttlingEvents: number;
}

export interface ConcurrencyMetrics {
  averageConcurrency: number;
  peakConcurrency: number;
  queueLength: number;
  averageWaitTime: number;
  rejectionRate: number;
}

export interface EfficiencyMetrics {
  resourceUtilization: number;
  wasteReduction: number;
  optimizationScore: number;
  predictionAccuracy: number;
}

export interface MemoryLeak {
  allocation: MemoryAllocation;
  suspectedLeak: boolean;
  growth: number;
  duration: number;
}

export interface OperationContext {
  operation: string;
  serverId: string;
  complexity: number;
  estimatedDuration: number;
  dependencies: string[];
  userData?: any;
}

export interface ResourceHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  tokenHealth: 'healthy' | 'warning' | 'critical';
  memoryHealth: 'healthy' | 'warning' | 'critical';
  concurrencyHealth: 'healthy' | 'warning' | 'critical';
  issues: ResourceIssue[];
  recommendations: string[];
}

export interface ResourceIssue {
  type: 'token' | 'memory' | 'concurrency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServices: string[];
  suggestedActions: string[];
}

type AllocationPriority = 'low' | 'medium' | 'high' | 'critical';
type MemoryType = 'cache' | 'buffer' | 'workspace' | 'temporary';

export class ResourceManager extends EventEmitter {
  private tokenAllocations = new Map<string, TokenAllocation>();
  private memoryAllocations = new Map<string, MemoryAllocation>();
  private concurrencySlots = new Map<string, ConcurrencySlot>();
  private tokenBudgets = new Map<string, TokenBudget>();
  private resourceThresholds: ResourceThreshold[] = [];
  private operationHistory: Map<string, ResourcePrediction[]> = new Map();
  
  private config = {
    maxTokensPerServer: 100000,
    maxMemoryPerServer: 1024 * 1024 * 1024, // 1GB
    maxConcurrencyPerServer: 10,
    globalTokenLimit: 1000000,
    globalMemoryLimit: 8 * 1024 * 1024 * 1024, // 8GB
    globalConcurrencyLimit: 100,
    allocationTimeout: 300000, // 5 minutes
    predictionWindow: 3600000, // 1 hour
    cleanupInterval: 60000 // 1 minute
  };

  private metrics: ResourceMetrics;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  async allocateTokens(operation: string, estimatedTokens: number, serverId?: string): Promise<TokenAllocation> {
    const id = this.generateId();
    const server = serverId || 'default';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.allocationTimeout);

    // Check quotas
    const quotaCheck = await this.enforceQuotas(server, 'token', estimatedTokens);
    if (quotaCheck.action === 'denied') {
      throw new Error(`Token allocation denied: quota exceeded for ${server}`);
    }

    // Predict if allocation is reasonable
    const prediction = await this.predictResourceNeeds(operation, { 
      operation, 
      serverId: server, 
      complexity: 1, 
      estimatedDuration: 60000, 
      dependencies: [] 
    });

    if (estimatedTokens > prediction.estimatedTokens * 2) {
      this.emit('suspiciousAllocation', {
        operation,
        requested: estimatedTokens,
        predicted: prediction.estimatedTokens,
        serverId: server
      });
    }

    const allocation: TokenAllocation = {
      id,
      tokens: estimatedTokens,
      operation,
      timestamp: now,
      expiresAt,
      serverId: server,
      priority: this.determinePriority(operation)
    };

    this.tokenAllocations.set(id, allocation);
    await this.updateTokenBudget(server, estimatedTokens);

    this.emit('tokensAllocated', allocation);
    return allocation;
  }

  async releaseTokens(allocation: TokenAllocation): Promise<void> {
    const existing = this.tokenAllocations.get(allocation.id);
    if (!existing) {
      throw new Error(`Token allocation not found: ${allocation.id}`);
    }

    this.tokenAllocations.delete(allocation.id);
    await this.updateTokenBudget(existing.serverId, -existing.tokens);

    this.emit('tokensReleased', existing);
  }

  async getTokenBudget(serverId: string): Promise<TokenBudget> {
    const budget = this.tokenBudgets.get(serverId);
    if (!budget) {
      const newBudget: TokenBudget = {
        serverId,
        allocated: 0,
        used: 0,
        remaining: this.config.maxTokensPerServer,
        dailyLimit: this.config.maxTokensPerServer,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      this.tokenBudgets.set(serverId, newBudget);
      return newBudget;
    }
    return budget;
  }

  async allocateMemory(size: number, operation: string, serverId?: string, type: MemoryType = 'workspace'): Promise<MemoryAllocation> {
    const id = this.generateId();
    const server = serverId || 'default';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.allocationTimeout);

    // Check quotas
    const quotaCheck = await this.enforceQuotas(server, 'memory', size);
    if (quotaCheck.action === 'denied') {
      throw new Error(`Memory allocation denied: quota exceeded for ${server}`);
    }

    const allocation: MemoryAllocation = {
      id,
      size,
      operation,
      timestamp: now,
      expiresAt,
      serverId: server,
      type
    };

    this.memoryAllocations.set(id, allocation);

    this.emit('memoryAllocated', allocation);
    return allocation;
  }

  async releaseMemory(allocation: MemoryAllocation): Promise<void> {
    const existing = this.memoryAllocations.get(allocation.id);
    if (!existing) {
      throw new Error(`Memory allocation not found: ${allocation.id}`);
    }

    this.memoryAllocations.delete(allocation.id);
    this.emit('memoryReleased', existing);
  }

  async getMemoryUsage(): Promise<MemoryUsage> {
    const allocations = Array.from(this.memoryAllocations.values());
    const totalUsed = allocations.reduce((sum, alloc) => sum + alloc.size, 0);

    return {
      total: this.config.globalMemoryLimit,
      used: totalUsed,
      available: this.config.globalMemoryLimit - totalUsed,
      allocations,
      fragmentation: this.calculateFragmentation(allocations)
    };
  }

  async acquireConcurrencySlot(operation: string, serverId?: string, weight: number = 1): Promise<ConcurrencySlot> {
    const server = serverId || 'default';
    const currentSlots = Array.from(this.concurrencySlots.values())
      .filter(slot => slot.serverId === server);

    if (currentSlots.length >= this.config.maxConcurrencyPerServer) {
      throw new Error(`Concurrency limit exceeded for ${server}`);
    }

    const id = this.generateId();
    const slot: ConcurrencySlot = {
      id,
      operation,
      timestamp: new Date(),
      serverId: server,
      weight
    };

    this.concurrencySlots.set(id, slot);
    this.emit('concurrencySlotAcquired', slot);
    return slot;
  }

  async releaseConcurrencySlot(slot: ConcurrencySlot): Promise<void> {
    const existing = this.concurrencySlots.get(slot.id);
    if (!existing) {
      throw new Error(`Concurrency slot not found: ${slot.id}`);
    }

    this.concurrencySlots.delete(slot.id);
    this.emit('concurrencySlotReleased', existing);
  }

  async getConcurrencyStatus(): Promise<ConcurrencyStatus> {
    const slots = Array.from(this.concurrencySlots.values());
    const averageExecutionTime = this.calculateAverageExecutionTime(slots);

    return {
      maxConcurrency: this.config.globalConcurrencyLimit,
      currentConcurrency: slots.length,
      availableSlots: this.config.globalConcurrencyLimit - slots.length,
      queuedRequests: 0, // Would be implemented with actual queue
      averageExecutionTime
    };
  }

  async optimizeResourceAllocation(): Promise<OptimizationResult> {
    const improvements: ResourceImprovement[] = [];
    
    // Analyze token usage patterns
    const tokenWaste = this.analyzeTokenWaste();
    if (tokenWaste.wasteRate > 20) {
      improvements.push({
        type: 'token',
        description: 'Implement better token estimation to reduce waste',
        impact: 'high',
        effort: 'medium',
        estimatedSavings: tokenWaste.potentialSavings
      });
    }

    // Analyze memory usage patterns
    const memoryLeaks = await this.detectMemoryLeaks();
    if (memoryLeaks.length > 0) {
      improvements.push({
        type: 'memory',
        description: 'Fix detected memory leaks',
        impact: 'high',
        effort: 'high',
        estimatedSavings: memoryLeaks.reduce((sum, leak) => sum + leak.allocation.size, 0)
      });
    }

    // Analyze concurrency patterns
    const concurrencyOptimization = this.analyzeConcurrencyPatterns();
    if (concurrencyOptimization.improvementPotential > 0) {
      improvements.push({
        type: 'concurrency',
        description: 'Optimize concurrency allocation patterns',
        impact: 'medium',
        effort: 'low',
        estimatedSavings: concurrencyOptimization.improvementPotential
      });
    }

    const estimatedSavings: ResourceSavings = {
      tokenSavings: improvements.filter(i => i.type === 'token').reduce((sum, i) => sum + i.estimatedSavings, 0),
      memorySavings: improvements.filter(i => i.type === 'memory').reduce((sum, i) => sum + i.estimatedSavings, 0),
      timeSavings: improvements.filter(i => i.type === 'concurrency').reduce((sum, i) => sum + i.estimatedSavings, 0),
      costSavings: 0 // Would calculate based on pricing
    };

    return {
      success: improvements.length > 0,
      improvements,
      estimatedSavings,
      implementationEffort: this.calculateImplementationEffort(improvements)
    };
  }

  async predictResourceNeeds(operation: string, context: OperationContext): Promise<ResourcePrediction> {
    const history = this.operationHistory.get(operation) || [];
    
    if (history.length === 0) {
      // Default prediction for unknown operations
      return {
        estimatedTokens: 1000,
        estimatedMemory: 10 * 1024 * 1024, // 10MB
        estimatedDuration: 30000, // 30 seconds
        confidence: 0.1,
        basedOnOperations: []
      };
    }

    // Calculate averages from historical data
    const avgTokens = history.reduce((sum, h) => sum + h.estimatedTokens, 0) / history.length;
    const avgMemory = history.reduce((sum, h) => sum + h.estimatedMemory, 0) / history.length;
    const avgDuration = history.reduce((sum, h) => sum + h.estimatedDuration, 0) / history.length;

    // Adjust based on complexity
    const complexityMultiplier = 1 + (context.complexity - 1) * 0.5;

    return {
      estimatedTokens: Math.round(avgTokens * complexityMultiplier),
      estimatedMemory: Math.round(avgMemory * complexityMultiplier),
      estimatedDuration: Math.round(avgDuration * complexityMultiplier),
      confidence: Math.min(0.9, history.length / 10), // Increase confidence with more data
      basedOnOperations: history.slice(-5).map((_, i) => `${operation}_${i}`)
    };
  }

  async enforceQuotas(serverId: string, operation: string): Promise<QuotaEnforcement>;
  async enforceQuotas(serverId: string, quotaType: 'token' | 'memory' | 'concurrency', requestedAmount: number): Promise<QuotaEnforcement>;
  async enforceQuotas(serverId: string, operationOrQuotaType: string, requestedAmount?: number): Promise<QuotaEnforcement> {
    if (requestedAmount !== undefined) {
      // New signature with quotaType and requestedAmount
      const quotaType = operationOrQuotaType as 'token' | 'memory' | 'concurrency';
      return this.checkQuota(serverId, quotaType, requestedAmount);
    } else {
      // Legacy signature with operation
      const operation = operationOrQuotaType;
      // Default quota enforcement for general operations
      return {
        enforced: true,
        quotaType: 'token',
        currentUsage: 0,
        limit: this.config.maxTokensPerServer,
        action: 'allowed'
      };
    }
  }

  private async checkQuota(serverId: string, quotaType: 'token' | 'memory' | 'concurrency', requestedAmount: number): Promise<QuotaEnforcement> {
    let currentUsage = 0;
    let limit = 0;

    switch (quotaType) {
      case 'token':
        const budget = await this.getTokenBudget(serverId);
        currentUsage = budget.used;
        limit = budget.dailyLimit;
        break;
      case 'memory':
        const memoryUsage = await this.getMemoryUsage();
        currentUsage = memoryUsage.used;
        limit = this.config.maxMemoryPerServer;
        break;
      case 'concurrency':
        const concurrencyStatus = await this.getConcurrencyStatus();
        currentUsage = concurrencyStatus.currentConcurrency;
        limit = this.config.maxConcurrencyPerServer;
        break;
    }

    const wouldExceed = currentUsage + requestedAmount > limit;
    const utilizationRate = currentUsage / limit;

    let action: 'allowed' | 'throttled' | 'denied' = 'allowed';
    let retryAfter: Date | undefined;

    if (wouldExceed) {
      action = 'denied';
    } else if (utilizationRate > 0.9) {
      action = 'throttled';
      retryAfter = new Date(Date.now() + 5000); // Retry in 5 seconds
    }

    return {
      enforced: true,
      quotaType,
      currentUsage,
      limit,
      action,
      retryAfter
    };
  }

  async getResourceMetrics(): Promise<ResourceMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  async setResourceAlert(threshold: ResourceThreshold): Promise<void> {
    this.resourceThresholds.push(threshold);
    this.emit('thresholdSet', threshold);
  }

  async checkResourceHealth(): Promise<ResourceHealthStatus> {
    const issues: ResourceIssue[] = [];
    const recommendations: string[] = [];

    // Check token health
    const tokenBudgets = Array.from(this.tokenBudgets.values());
    const highTokenUsage = tokenBudgets.filter(b => b.used / b.dailyLimit > 0.9);
    if (highTokenUsage.length > 0) {
      issues.push({
        type: 'token',
        severity: 'high',
        description: `${highTokenUsage.length} services approaching token limits`,
        affectedServices: highTokenUsage.map(b => b.serverId),
        suggestedActions: ['Implement token optimization', 'Review usage patterns']
      });
    }

    // Check memory health
    const memoryUsage = await this.getMemoryUsage();
    if (memoryUsage.used / memoryUsage.total > 0.85) {
      issues.push({
        type: 'memory',
        severity: 'critical',
        description: 'Memory usage exceeds 85% of available capacity',
        affectedServices: ['global'],
        suggestedActions: ['Free unused allocations', 'Increase memory limits']
      });
    }

    // Check concurrency health
    const concurrencyStatus = await this.getConcurrencyStatus();
    if (concurrencyStatus.currentConcurrency / concurrencyStatus.maxConcurrency > 0.9) {
      issues.push({
        type: 'concurrency',
        severity: 'medium',
        description: 'High concurrency utilization detected',
        affectedServices: ['global'],
        suggestedActions: ['Review operation duration', 'Implement queuing']
      });
    }

    const tokenHealth = highTokenUsage.length === 0 ? 'healthy' : 'warning';
    const memoryHealth = memoryUsage.used / memoryUsage.total < 0.85 ? 'healthy' : 'critical';
    const concurrencyHealth = concurrencyStatus.currentConcurrency / concurrencyStatus.maxConcurrency < 0.9 ? 'healthy' : 'warning';

    const overall = issues.some(i => i.severity === 'critical') ? 'critical' : 
                   issues.some(i => i.severity === 'high') ? 'warning' : 'healthy';

    return {
      overall,
      tokenHealth,
      memoryHealth,
      concurrencyHealth,
      issues,
      recommendations
    };
  }

  private generateId(): string {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determinePriority(operation: string): AllocationPriority {
    if (operation.includes('critical') || operation.includes('emergency')) return 'critical';
    if (operation.includes('priority') || operation.includes('important')) return 'high';
    if (operation.includes('background') || operation.includes('cleanup')) return 'low';
    return 'medium';
  }

  private async updateTokenBudget(serverId: string, tokens: number): Promise<void> {
    const budget = await this.getTokenBudget(serverId);
    budget.allocated += tokens;
    budget.remaining = Math.max(0, budget.dailyLimit - budget.allocated);
    
    if (tokens > 0) {
      budget.used += tokens;
    }

    this.tokenBudgets.set(serverId, budget);
  }

  private calculateFragmentation(allocations: MemoryAllocation[]): number {
    // Simplified fragmentation calculation
    if (allocations.length === 0) return 0;
    
    const sizes = allocations.map(a => a.size).sort((a, b) => a - b);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const averageSize = totalSize / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - averageSize, 2), 0) / sizes.length;
    
    return Math.min(100, variance / averageSize);
  }

  private calculateAverageExecutionTime(slots: ConcurrencySlot[]): number {
    if (slots.length === 0) return 0;
    
    const now = Date.now();
    const executionTimes = slots.map(slot => now - slot.timestamp.getTime());
    return executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
  }

  private analyzeTokenWaste(): { wasteRate: number; potentialSavings: number } {
    const allocations = Array.from(this.tokenAllocations.values());
    if (allocations.length === 0) return { wasteRate: 0, potentialSavings: 0 };

    // Simplified waste analysis - assume 20% waste on average
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.tokens, 0);
    const wasteRate = 20; // Would be calculated from actual usage
    const potentialSavings = totalAllocated * (wasteRate / 100);

    return { wasteRate, potentialSavings };
  }

  private async detectMemoryLeaks(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const allocation of this.memoryAllocations.values()) {
      const age = now - allocation.timestamp.getTime();
      if (age > oneDayAgo) {
        leaks.push({
          allocation,
          suspectedLeak: true,
          growth: allocation.size, // Simplified
          duration: age
        });
      }
    }

    return leaks;
  }

  private analyzeConcurrencyPatterns(): { improvementPotential: number } {
    const slots = Array.from(this.concurrencySlots.values());
    // Simplified analysis - assume 10% improvement potential
    return { improvementPotential: slots.length * 0.1 };
  }

  private calculateImplementationEffort(improvements: ResourceImprovement[]): ImplementationEffort {
    const totalEffort = improvements.reduce((sum, imp) => {
      const effortScore = imp.effort === 'low' ? 1 : imp.effort === 'medium' ? 3 : 5;
      return sum + effortScore;
    }, 0);

    return {
      timeRequired: totalEffort * 8, // 8 hours per effort point
      complexity: totalEffort > 10 ? 'high' : totalEffort > 5 ? 'medium' : 'low',
      dependencies: ['monitoring', 'alerting'],
      risks: ['performance impact', 'compatibility issues']
    };
  }

  private initializeMetrics(): ResourceMetrics {
    return {
      tokenUsage: {
        totalAllocated: 0,
        totalUsed: 0,
        efficiency: 0,
        wasteRate: 0,
        averageOperationCost: 0,
        topConsumers: []
      },
      memoryUsage: {
        totalAllocated: 0,
        peakUsage: 0,
        averageUsage: 0,
        fragmentation: 0,
        leakDetection: [],
        gcPressure: 0
      },
      cpuUsage: {
        averageUsage: 0,
        peakUsage: 0,
        coreUtilization: [],
        throttlingEvents: 0
      },
      concurrency: {
        averageConcurrency: 0,
        peakConcurrency: 0,
        queueLength: 0,
        averageWaitTime: 0,
        rejectionRate: 0
      },
      efficiency: {
        resourceUtilization: 0,
        wasteReduction: 0,
        optimizationScore: 0,
        predictionAccuracy: 0
      }
    };
  }

  private async updateMetrics(): Promise<void> {
    // Update token metrics
    const allocations = Array.from(this.tokenAllocations.values());
    this.metrics.tokenUsage.totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.tokens, 0);

    // Update memory metrics
    const memoryUsage = await this.getMemoryUsage();
    this.metrics.memoryUsage.totalAllocated = memoryUsage.used;
    this.metrics.memoryUsage.fragmentation = memoryUsage.fragmentation;

    // Update concurrency metrics
    const concurrencyStatus = await this.getConcurrencyStatus();
    this.metrics.concurrency.averageConcurrency = concurrencyStatus.currentConcurrency;

    this.emit('metricsUpdated', this.metrics);
  }

  private cleanup(): void {
    const now = Date.now();

    // Clean up expired token allocations
    for (const [id, allocation] of this.tokenAllocations) {
      if (allocation.expiresAt.getTime() < now) {
        this.tokenAllocations.delete(id);
        this.emit('allocationExpired', { type: 'token', allocation });
      }
    }

    // Clean up expired memory allocations
    for (const [id, allocation] of this.memoryAllocations) {
      if (allocation.expiresAt.getTime() < now) {
        this.memoryAllocations.delete(id);
        this.emit('allocationExpired', { type: 'memory', allocation });
      }
    }

    // Clean up old operation history
    const oneHourAgo = now - this.config.predictionWindow;
    for (const [operation, history] of this.operationHistory) {
      const validHistory = history.filter(h => h.estimatedDuration > oneHourAgo);
      if (validHistory.length === 0) {
        this.operationHistory.delete(operation);
      } else {
        this.operationHistory.set(operation, validHistory);
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Resource Manager...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Release all allocations
    this.tokenAllocations.clear();
    this.memoryAllocations.clear();
    this.concurrencySlots.clear();
    this.tokenBudgets.clear();

    this.removeAllListeners();
    console.log('Resource Manager shutdown complete');
  }
}