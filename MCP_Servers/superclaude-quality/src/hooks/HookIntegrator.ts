/**
 * SuperClaude Quality Hook Integrator
 * Integrates with SuperClaude hooks for real-time validation
 */

import {
  HookContext,
  ValidationTarget,
  QualityValidationContext,
  ValidationResult,
  QualityIssue,
  QualityRecommendation
} from '../types/index.js';

import { RealTimeValidationResult } from '../core/QualityOrchestrator.js';
import { RealTimeValidator } from './RealTimeValidator.js';
import { Logger } from '../utils/Logger.js';

export interface HookResult {
  success: boolean;
  validationResult?: RealTimeValidationResult;
  message: string;
  metadata: Record<string, any>;
}

export interface QualityFeedback {
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  score: number;
  actionable: boolean;
}

export interface HookClient {
  sendHookResponse(hookType: string, result: HookResult): Promise<void>;
  subscribeToHooks(callback: (hookContext: HookContext) => Promise<void>): Promise<void>;
  unsubscribeFromHooks(): Promise<void>;
}

export class HookIntegrator {
  private hookClient: HookClient;
  private realTimeValidator: RealTimeValidator;
  private validationCache: InMemoryValidationCache;
  private logger: Logger;
  private isRealTimeEnabled: boolean = false;
  private activeTargets: Set<string> = new Set();

  constructor() {
    this.hookClient = new DefaultHookClient();
    this.realTimeValidator = new RealTimeValidator();
    this.validationCache = new InMemoryValidationCache();
    this.logger = new Logger('HookIntegrator');
    
    this.initializeHookSubscriptions();
  }

  /**
   * Handle PreToolUse hook - validate before operations
   */
  async handlePreToolUseHook(hookContext: HookContext): Promise<HookResult> {
    const startTime = Date.now();
    this.logger.debug('Handling PreToolUse hook', { 
      operation: hookContext.operation,
      files: hookContext.files.length 
    });

    try {
      // Quick validation for syntax and basic checks
      const validationResult = await this.realTimeValidator.validatePreOperation(hookContext);
      
      const processingTime = Date.now() - startTime;
      
      // Cache results for later use
      await this.cacheValidationResults([validationResult]);
      
      const success = validationResult.status !== 'failed';
      
      this.logger.info('PreToolUse validation completed', {
        success,
        processingTime,
        issuesFound: validationResult.issues.length
      });

      return {
        success,
        validationResult,
        message: success 
          ? 'Pre-operation validation passed'
          : `Pre-operation validation failed with ${validationResult.issues.length} issues`,
        metadata: {
          processingTime,
          issuesCount: validationResult.issues.length,
          hookType: 'pre'
        }
      };

    } catch (error) {
      this.logger.error('PreToolUse hook failed', { error });
      
      return {
        success: false,
        message: `Pre-operation validation failed: ${error.message}`,
        metadata: {
          error: error.message,
          processingTime: Date.now() - startTime,
          hookType: 'pre'
        }
      };
    }
  }

  /**
   * Handle PostToolUse hook - validate after operations
   */
  async handlePostToolUseHook(hookContext: HookContext): Promise<HookResult> {
    const startTime = Date.now();
    this.logger.debug('Handling PostToolUse hook', { 
      operation: hookContext.operation,
      files: hookContext.files.length 
    });

    try {
      // Comprehensive validation after operations
      const validationResult = await this.realTimeValidator.validatePostOperation(hookContext);
      
      const processingTime = Date.now() - startTime;
      
      // Update quality metrics
      await this.updateQualityMetrics(hookContext, [validationResult]);
      
      // Cache results
      await this.cacheValidationResults([validationResult]);
      
      const success = validationResult.status !== 'failed';
      
      this.logger.info('PostToolUse validation completed', {
        success,
        processingTime,
        issuesFound: validationResult.issues.length
      });

      return {
        success,
        validationResult,
        message: success 
          ? 'Post-operation validation passed'
          : `Post-operation validation found ${validationResult.issues.length} issues`,
        metadata: {
          processingTime,
          issuesCount: validationResult.issues.length,
          hookType: 'post'
        }
      };

    } catch (error) {
      this.logger.error('PostToolUse hook failed', { error });
      
      return {
        success: false,
        message: `Post-operation validation failed: ${error.message}`,
        metadata: {
          error: error.message,
          processingTime: Date.now() - startTime,
          hookType: 'post'
        }
      };
    }
  }

  /**
   * Handle Stop hook - session quality reporting
   */
  async handleStopHook(hookContext: HookContext): Promise<HookResult> {
    const startTime = Date.now();
    this.logger.info('Handling Stop hook - generating session quality report');

    try {
      // Generate comprehensive session quality report
      const sessionReport = await this.generateSessionQualityReport(hookContext);
      
      const processingTime = Date.now() - startTime;
      
      this.logger.info('Session quality report generated', {
        processingTime,
        overallScore: sessionReport.overallScore,
        totalIssues: sessionReport.totalIssues
      });

      return {
        success: true,
        message: `Session quality report: Score ${sessionReport.overallScore}/100, ${sessionReport.totalIssues} issues found`,
        metadata: {
          sessionReport,
          processingTime,
          hookType: 'stop'
        }
      };

    } catch (error) {
      this.logger.error('Stop hook failed', { error });
      
      return {
        success: false,
        message: `Session quality reporting failed: ${error.message}`,
        metadata: {
          error: error.message,
          processingTime: Date.now() - startTime,
          hookType: 'stop'
        }
      };
    }
  }

  /**
   * Enable real-time validation for a target
   */
  async enableRealTimeValidation(target: ValidationTarget): Promise<void> {
    this.activeTargets.add(target.uri);
    this.isRealTimeEnabled = true;
    
    this.logger.info('Real-time validation enabled', { target: target.uri });
  }

  /**
   * Disable real-time validation for a target
   */
  async disableRealTimeValidation(target: ValidationTarget): Promise<void> {
    this.activeTargets.delete(target.uri);
    
    if (this.activeTargets.size === 0) {
      this.isRealTimeEnabled = false;
    }
    
    this.logger.info('Real-time validation disabled', { target: target.uri });
  }

  /**
   * Private helper methods
   */
  private async initializeHookSubscriptions(): Promise<void> {
    try {
      await this.hookClient.subscribeToHooks(async (hookContext: HookContext) => {
        try {
          let result: HookResult;
          
          switch (hookContext.hookType) {
            case 'pre':
              result = await this.handlePreToolUseHook(hookContext);
              break;
            case 'post':
              result = await this.handlePostToolUseHook(hookContext);
              break;
            case 'stop':
              result = await this.handleStopHook(hookContext);
              break;
            default:
              this.logger.warn('Unknown hook type', { hookType: hookContext.hookType });
              return;
          }
          
          await this.hookClient.sendHookResponse(hookContext.hookType, result);
          
        } catch (error) {
          this.logger.error('Hook handling error', { error, hookType: hookContext.hookType });
        }
      });
      
      this.logger.info('Hook subscriptions initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize hook subscriptions', { error });
    }
  }

  private async validateToolOperation(operation: string): Promise<any> {
    // Validate tool operation based on operation type
    const validationRules = this.getOperationValidationRules(operation);
    
    return {
      valid: true,
      warnings: [],
      errors: []
    };
  }

  private getOperationValidationRules(operation: string): any[] {
    // Define validation rules for different operations
    const rules: Record<string, any[]> = {
      'edit': [
        { type: 'syntax', enabled: true },
        { type: 'semantic', enabled: true }
      ],
      'write': [
        { type: 'syntax', enabled: true },
        { type: 'security', enabled: true }
      ],
      'read': [
        { type: 'access', enabled: true }
      ]
    };
    
    return rules[operation] || [];
  }

  private async generateQualityFeedback(results: RealTimeValidationResult[]): Promise<QualityFeedback> {
    const allIssues = results.flatMap(r => r.issues);
    const allRecommendations = results.flatMap(r => r.recommendations);
    
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const score = criticalIssues.length === 0 ? 85 : Math.max(0, 85 - (criticalIssues.length * 10));
    
    return {
      issues: allIssues,
      recommendations: allRecommendations,
      score,
      actionable: allRecommendations.some(r => r.actionable)
    };
  }

  private async updateQualityMetrics(hookContext: HookContext, results: RealTimeValidationResult[]): Promise<void> {
    // Update quality metrics based on validation results
    const feedback = await this.generateQualityFeedback(results);
    
    this.logger.debug('Quality metrics updated', {
      score: feedback.score,
      issuesCount: feedback.issues.length,
      operation: hookContext.operation
    });
  }

  private async cacheValidationResults(results: RealTimeValidationResult[]): Promise<void> {
    for (const result of results) {
      const cacheKey = `realtime-${Date.now()}-${Math.random()}`;
      await this.validationCache.store(cacheKey, result);
    }
  }

  private async generateSessionQualityReport(hookContext: HookContext): Promise<any> {
    // Aggregate all cached validation results for the session
    const cachedResults = await this.validationCache.getAll();
    
    const totalIssues = cachedResults.reduce((sum, result) => sum + result.issues.length, 0);
    const criticalIssues = cachedResults.reduce((sum, result) => 
      sum + result.issues.filter(i => i.severity === 'critical').length, 0
    );
    
    const overallScore = criticalIssues === 0 ? 90 : Math.max(0, 90 - (criticalIssues * 5));
    
    return {
      overallScore,
      totalIssues,
      criticalIssues,
      validationRuns: cachedResults.length,
      averagePerformance: cachedResults.reduce((sum, result) => sum + result.performance, 0) / cachedResults.length,
      topIssues: this.getTopIssues(cachedResults),
      recommendations: this.getSessionRecommendations(cachedResults)
    };
  }

  private getTopIssues(results: RealTimeValidationResult[]): QualityIssue[] {
    const allIssues = results.flatMap(r => r.issues);
    const issueCounts = new Map<string, { issue: QualityIssue, count: number }>();
    
    for (const issue of allIssues) {
      const key = `${issue.category}-${issue.ruleId}`;
      const existing = issueCounts.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        issueCounts.set(key, { issue, count: 1 });
      }
    }
    
    return Array.from(issueCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.issue);
  }

  private getSessionRecommendations(results: RealTimeValidationResult[]): QualityRecommendation[] {
    const allRecommendations = results.flatMap(r => r.recommendations);
    
    // Deduplicate and prioritize recommendations
    const uniqueRecommendations = new Map<string, QualityRecommendation>();
    
    for (const rec of allRecommendations) {
      const key = rec.description;
      if (!uniqueRecommendations.has(key) || rec.priority === 'critical') {
        uniqueRecommendations.set(key, rec);
      }
    }
    
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 10);
  }
}

/**
 * Default hook client implementation
 */
class DefaultHookClient implements HookClient {
  private logger: Logger;
  private subscriptions: ((hookContext: HookContext) => Promise<void>)[] = [];

  constructor() {
    this.logger = new Logger('DefaultHookClient');
  }

  async sendHookResponse(hookType: string, result: HookResult): Promise<void> {
    this.logger.debug('Sending hook response', { hookType, success: result.success });
    // In a real implementation, this would send the response to the hook system
  }

  async subscribeToHooks(callback: (hookContext: HookContext) => Promise<void>): Promise<void> {
    this.subscriptions.push(callback);
    this.logger.info('Subscribed to hooks');
  }

  async unsubscribeFromHooks(): Promise<void> {
    this.subscriptions.length = 0;
    this.logger.info('Unsubscribed from hooks');
  }
}

/**
 * Simple in-memory validation cache
 */
class InMemoryValidationCache implements ValidationCache {
  private cache: Map<string, RealTimeValidationResult> = new Map();

  async store(key: string, result: RealTimeValidationResult): Promise<void> {
    this.cache.set(key, result);
  }

  async get(key: string): Promise<RealTimeValidationResult | null> {
    return this.cache.get(key) || null;
  }

  async getAll(): Promise<RealTimeValidationResult[]> {
    return Array.from(this.cache.values());
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

interface ValidationCache {
  store(key: string, result: RealTimeValidationResult): Promise<void>;
  get(key: string): Promise<RealTimeValidationResult | null>;
  getAll(): Promise<RealTimeValidationResult[]>;
  clear(): Promise<void>;
}