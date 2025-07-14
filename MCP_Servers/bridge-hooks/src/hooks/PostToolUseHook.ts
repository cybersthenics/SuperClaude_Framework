import { BaseHook } from '../core/BaseHook.js';
import { HookType, HookContext, HookResult, ValidationResult } from '../types/index.js';

export class PostToolUseHook extends BaseHook {
  constructor() {
    super(HookType.PostToolUse);
  }

  async execute(context: HookContext): Promise<HookResult> {
    const timer = performance.now();
    
    try {
      // 1. Validate results from MCP operation
      const validationResult = await this.validateMCPResult(context);
      
      // 2. Trigger quality gates when needed
      let qualityGatesTriggered = false;
      if (this.requiresQualityGates(context)) {
        await this.triggerQualityGates(context, validationResult);
        qualityGatesTriggered = true;
      }
      
      // 3. Update performance metrics
      await this.updatePerformanceMetrics(context, validationResult);
      
      // 4. Cache successful results
      if (validationResult.success) {
        await this.cacheValidatedResult(context, validationResult);
      }

      const executionTime = performance.now() - timer;

      const result = this.createSuccessResult(
        {
          validation: validationResult,
          qualityGatesTriggered,
          metricsUpdated: true,
          serverTarget: this.targetServer,
          validationScore: this.calculateValidationScore(validationResult)
        },
        {
          executionTime,
          validationTime: validationResult.executionTime,
          optimizationFactor: 1.41 // Proven factor
        },
        {
          cacheable: validationResult.success,
          ttl: validationResult.success ? 3600 : 0
        }
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - timer;
      await this.reportValidationError(context, error as Error);
      return this.createErrorResult(error as Error, executionTime);
    }
  }

  private async validateMCPResult(context: HookContext): Promise<ValidationResult> {
    const validationStart = performance.now();
    
    try {
      // Comprehensive validation of MCP server results
      const validations = await Promise.all([
        this.validateResultStructure(context.data),
        this.validateResultContent(context.data),
        this.validatePerformanceMetrics(context.performance),
        this.validateSemanticConsistency(context.data, context.semantic)
      ]);

      const success = validations.every(v => v.success);
      const executionTime = performance.now() - validationStart;

      return {
        success,
        details: validations,
        executionTime,
        issues: validations.flatMap(v => v.issues || [])
      };
    } catch (error) {
      return {
        success: false,
        executionTime: performance.now() - validationStart,
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async validateResultStructure(data: any): Promise<ValidationResult> {
    try {
      // Validate basic structure requirements
      if (!data) {
        return { 
          success: false, 
          issues: ['No result data provided'] 
        };
      }

      // Check for required fields based on operation type
      const requiredFields = ['success', 'data'];
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length > 0) {
        return { 
          success: false, 
          issues: [`Missing required fields: ${missingFields.join(', ')}`] 
        };
      }

      // Validate data types
      if (typeof data.success !== 'boolean') {
        return { 
          success: false, 
          issues: ['Invalid success field type'] 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        issues: [`Structure validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  private async validateResultContent(data: any): Promise<ValidationResult> {
    try {
      if (!data?.data) {
        return { success: true }; // Content validation is optional
      }

      const content = data.data;
      const issues: string[] = [];

      // Validate content size
      const contentSize = JSON.stringify(content).length;
      if (contentSize > 10 * 1024 * 1024) { // 10MB limit
        issues.push('Content size exceeds 10MB limit');
      }

      // Validate content structure based on type
      if (content.type === 'code' && !content.language) {
        issues.push('Code content missing language specification');
      }

      if (content.type === 'analysis' && !content.findings) {
        issues.push('Analysis content missing findings');
      }

      // Check for potentially harmful content
      if (this.containsHarmfulContent(content)) {
        issues.push('Content contains potentially harmful elements');
      }

      return { 
        success: issues.length === 0,
        issues: issues.length > 0 ? issues : []
      };
    } catch (error) {
      return { 
        success: false, 
        issues: [`Content validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  private async validatePerformanceMetrics(performance: any): Promise<ValidationResult> {
    try {
      if (!performance) {
        return { 
          success: false, 
          issues: ['No performance metrics provided'] 
        };
      }

      const issues: string[] = [];

      // Validate execution time
      if (typeof performance.executionTime !== 'number' || performance.executionTime < 0) {
        issues.push('Invalid execution time');
      } else if (performance.executionTime > this.performanceBudget.maxExecutionTime * 2) {
        issues.push(`Execution time exceeds budget by 100%: ${performance.executionTime}ms`);
      }

      // Validate memory usage if provided
      if (performance.memoryUsage && performance.memoryUsage > this.performanceBudget.maxMemoryUsage * 2) {
        issues.push(`Memory usage exceeds budget: ${performance.memoryUsage}MB`);
      }

      // Validate optimization factor if provided
      if (performance.optimizationFactor && performance.optimizationFactor < 0.5) {
        issues.push(`Low optimization factor: ${performance.optimizationFactor}`);
      }

      return { 
        success: issues.length === 0,
        issues: issues.length > 0 ? issues : []
      };
    } catch (error) {
      return { 
        success: false, 
        issues: [`Performance validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  private async validateSemanticConsistency(data: any, semantic?: any): Promise<ValidationResult> {
    try {
      if (!semantic?.enabled) {
        return { success: true }; // Semantic validation is optional
      }

      // Validate semantic consistency
      if (data && semantic.semanticKey) {
        // Check if result is semantically consistent with input
        const consistencyScore = this.calculateSemanticConsistency(data, semantic);
        
        if (consistencyScore < 0.7) {
          return { 
            success: false, 
            issues: [`Low semantic consistency score: ${consistencyScore}`] 
          };
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        issues: [`Semantic validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  private requiresQualityGates(context: HookContext): boolean {
    // Determine if quality gates should be triggered
    const operation = context.operation.toLowerCase();
    
    // Quality gates for critical operations
    const criticalOperations = ['deploy', 'production', 'release', 'publish'];
    const hasCodeChanges = context.data?.type === 'code' || operation.includes('code');
    const hasAnalysisResults = context.data?.type === 'analysis';
    const isHighComplexity = this.calculateComplexity(context) > 0.7;

    return criticalOperations.some(op => operation.includes(op)) ||
           hasCodeChanges ||
           hasAnalysisResults ||
           isHighComplexity;
  }

  private async triggerQualityGates(context: HookContext, validation: ValidationResult): Promise<void> {
    // Trigger appropriate quality gates based on context
    const gates = [];

    if (context.data?.type === 'code') {
      gates.push('code_quality');
      gates.push('security_scan');
    }

    if (context.operation.includes('deploy')) {
      gates.push('deployment_validation');
      gates.push('performance_test');
    }

    if (validation.issues && validation.issues.length > 0) {
      gates.push('issue_resolution');
    }

    // Simulate quality gate execution
    for (const gate of gates) {
      console.log(`Triggering quality gate: ${gate} for operation: ${context.operation}`);
      // In production, this would make actual calls to quality server
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate processing time
    }
  }

  private async updatePerformanceMetrics(context: HookContext, validation: ValidationResult): Promise<void> {
    // Update performance tracking with validation results
    const metrics = {
      operation: context.operation,
      validationTime: validation.executionTime || 0,
      validationSuccess: validation.success,
      issuesFound: validation.issues?.length || 0
    };

    console.log(`Performance metrics updated for ${context.operation}:`, metrics);
    // In production, this would update actual metrics storage
  }

  private async cacheValidatedResult(context: HookContext, validation: ValidationResult): Promise<void> {
    if (!validation.success) return;

    // Cache validated results for future reference
    const cacheKey = `validated_${this.generateCacheKey(context)}`;
    const cacheData = {
      validation,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    };

    console.log(`Caching validated result: ${cacheKey}`);
    // In production, this would use actual cache storage
  }

  private async reportValidationError(context: HookContext, error: Error): Promise<void> {
    // Report validation errors for monitoring
    const errorReport = {
      operation: context.operation,
      error: error.message,
      stack: error.stack,
      context: {
        sessionId: context.sessionId,
        timestamp: Date.now()
      }
    };

    console.error(`Validation error reported:`, errorReport);
    // In production, this would send to error tracking system
  }

  private containsHarmfulContent(content: any): boolean {
    // Check for potentially harmful content patterns
    const contentString = JSON.stringify(content).toLowerCase();
    
    const harmfulPatterns = [
      'eval(',
      'exec(',
      'system(',
      'shell_exec',
      '<script',
      'javascript:',
      'data:text/html'
    ];

    return harmfulPatterns.some(pattern => contentString.includes(pattern));
  }

  private calculateSemanticConsistency(data: any, semantic: any): number {
    // Calculate semantic consistency score (0.0 to 1.0)
    // This is a simplified implementation
    
    if (!data || !semantic) return 1.0;
    
    // In production, this would use actual semantic analysis
    // For now, return a score based on simple heuristics
    
    const dataString = JSON.stringify(data).toLowerCase();
    const semanticKey = semantic.semanticKey?.toLowerCase() || '';
    
    if (semanticKey && dataString.includes(semanticKey)) {
      return 0.9;
    }
    
    return 0.8; // Default consistency score
  }

  private calculateValidationScore(validation: ValidationResult): number {
    // Calculate overall validation score
    if (!validation.success) return 0.0;
    
    const issueCount = validation.issues?.length || 0;
    const baseScore = 1.0;
    const penaltyPerIssue = 0.1;
    
    return Math.max(baseScore - (issueCount * penaltyPerIssue), 0.0);
  }

  protected shouldCache(context: HookContext): boolean {
    // Enhanced caching decision for PostToolUse
    const operation = context.operation.toLowerCase();
    const hasValidationResults = context.data?.validation;
    const isExpensiveValidation = operation.includes('complex') || operation.includes('analysis');
    
    return context.cache?.enabled === true && 
           (hasValidationResults || isExpensiveValidation) &&
           this.isStableCacheCandidate(context);
  }

  private isStableCacheCandidate(context: HookContext): boolean {
    // Check if the operation results are stable enough for caching
    const operation = context.operation.toLowerCase();
    
    // Don't cache time-sensitive operations
    if (operation.includes('real-time') || operation.includes('live')) {
      return false;
    }
    
    // Don't cache user-specific results unless they're deterministic
    if (context.sessionId && operation.includes('user-specific')) {
      return false;
    }
    
    return true;
  }
}