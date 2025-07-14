/**
 * Validation Framework for Shared Services Infrastructure
 * Schema validation, type checking, and quality gates
 */

import { EventEmitter } from 'events';

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
  custom?: (value: any) => boolean | string;
}

export interface TypeDefinition {
  name: string;
  properties: Record<string, TypeProperty>;
  extends?: string;
  implements?: string[];
}

export interface TypeProperty {
  type: string;
  optional?: boolean;
  default?: any;
  validation?: ValidationSchema;
}

export interface InterfaceDefinition {
  name: string;
  methods: Record<string, MethodDefinition>;
  properties?: Record<string, TypeProperty>;
}

export interface MethodDefinition {
  parameters: Record<string, TypeProperty>;
  returnType: string;
  async?: boolean;
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (data: any, context?: any) => Promise<ValidationResult> | ValidationResult;
  severity: 'error' | 'warning' | 'info';
  category: string;
  dependencies?: string[];
}

export interface RuleSet {
  name: string;
  rules: ValidationRule[];
  mode: 'strict' | 'lenient';
  stopOnFirstError: boolean;
}

export interface QualityCriteria {
  rules: Record<string, any>;
  thresholds: Record<string, number>;
  requirements: string[];
  weights?: Record<string, number>;
}

export interface QualityGate {
  name: string;
  criteria: QualityCriteria;
  threshold: number;
  severity: 'error' | 'warning' | 'info';
  timeout?: number;
  dependencies?: string[];
}

export interface QualityGateResult {
  passed: boolean;
  score: number;
  threshold: number;
  criteria: QualityCriteriaResult[];
  issues: ValidationIssue[];
  recommendations: string[];
  executionTime: number;
  metadata: any;
}

export interface QualityCriteriaResult {
  name: string;
  passed: boolean;
  score: number;
  weight: number;
  details: any;
}

export interface QualityGateStatus {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'timeout';
  lastExecution: Date;
  successRate: number;
  averageExecutionTime: number;
  failureReasons: string[];
}

export interface ValidationStep {
  name: string;
  order: number;
  validator: ValidationRule | string; // Rule name or rule object
  required: boolean;
  skipOn?: 'error' | 'warning';
  timeout?: number;
}

export interface ValidationPipeline {
  name: string;
  steps: ValidationStep[];
  mode: 'sequential' | 'parallel';
  onError: 'stop' | 'continue' | 'skipRemaining';
  timeout: number;
}

export interface PipelineResult {
  pipelineName: string;
  success: boolean;
  stepResults: StepResult[];
  overallScore: number;
  executionTime: number;
  issues: ValidationIssue[];
}

export interface StepResult {
  stepName: string;
  success: boolean;
  result: ValidationResult;
  executionTime: number;
  skipped: boolean;
  error?: Error;
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
  score?: number;
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
  code: string;
  severity: 'error' | 'critical';
  rule?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  value: any;
  code: string;
  rule?: string;
  suggestion?: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  code: string;
  rule?: string;
  severity: number; // 1-10
  fixable: boolean;
  suggestion?: string;
}

export interface ValidationMetadata {
  validatedAt: Date;
  validationTime: number;
  rulesApplied: string[];
  schemaVersion?: string;
  context?: any;
}

export interface ValidationFilter {
  severity?: ('error' | 'warning' | 'info')[];
  rules?: string[];
  dateRange?: { start: Date; end: Date };
  categories?: string[];
}

export interface ValidationReport {
  summary: ValidationSummary;
  details: ValidationDetail[];
  trends: ValidationTrend[];
  recommendations: ValidationRecommendation[];
  generatedAt: Date;
}

export interface ValidationSummary {
  totalValidations: number;
  successRate: number;
  averageScore: number;
  commonIssues: CommonIssue[];
  ruleEffectiveness: RuleEffectiveness[];
}

export interface ValidationDetail {
  timestamp: Date;
  target: string;
  result: ValidationResult;
  rules: string[];
  executionTime: number;
}

export interface ValidationTrend {
  period: string;
  successRate: number;
  averageScore: number;
  issueCount: number;
  improvement: number;
}

export interface ValidationRecommendation {
  type: 'rule' | 'schema' | 'process';
  priority: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  effort: string;
}

export interface CommonIssue {
  rule: string;
  message: string;
  frequency: number;
  impact: number;
  examples: string[];
}

export interface RuleEffectiveness {
  rule: string;
  timesApplied: number;
  issuesFound: number;
  falsePositives: number;
  effectiveness: number;
}

export interface ValidationMetrics {
  totalValidations: number;
  successRate: number;
  averageExecutionTime: number;
  ruleUtilization: Record<string, number>;
  errorPatterns: Record<string, number>;
  qualityGateMetrics: QualityGateMetrics;
}

export interface QualityGateMetrics {
  totalExecutions: number;
  passRate: number;
  averageScore: number;
  timeoutRate: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
}

export class ValidationFramework extends EventEmitter {
  private schemas = new Map<string, ValidationSchema>();
  private rules = new Map<string, ValidationRule>();
  private ruleSets = new Map<string, RuleSet>();
  private qualityGates = new Map<string, QualityGate>();
  private pipelines = new Map<string, ValidationPipeline>();
  private validationHistory: ValidationDetail[] = [];
  private metrics: ValidationMetrics;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.setupBuiltInRules();
    this.setupBuiltInSchemas();
  }

  async validateSchema<T>(data: any, schema: ValidationSchema): Promise<ValidationResult<T>> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const result = await this.performSchemaValidation(data, schema, '');
      const validatedData = result.isValid ? data as T : undefined;
      
      const executionTime = performance.now() - startTime;
      
      return {
        isValid: result.isValid,
        data: validatedData,
        errors: result.errors,
        warnings: result.warnings,
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: ['schema-validation'],
          schemaVersion: '1.0'
        }
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `Schema validation failed: ${error.message}`,
          value: data,
          code: 'SCHEMA_VALIDATION_ERROR',
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: ['schema-validation']
        }
      };
    }
  }

  async registerSchema(name: string, schema: ValidationSchema): Promise<void> {
    this.schemas.set(name, schema);
    this.emit('schemaRegistered', { name, schema });
  }

  async getSchema(name: string): Promise<ValidationSchema | null> {
    return this.schemas.get(name) || null;
  }

  async validateTypes(data: any, typeDefinition: TypeDefinition): Promise<ValidationResult> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate each property against its type definition
      for (const [propName, propDef] of Object.entries(typeDefinition.properties)) {
        const value = data[propName];
        
        if (value === undefined && !propDef.optional) {
          errors.push({
            path: propName,
            message: `Required property '${propName}' is missing`,
            value: undefined,
            code: 'MISSING_REQUIRED_PROPERTY',
            severity: 'error'
          });
          continue;
        }

        if (value !== undefined && propDef.validation) {
          const propResult = await this.performSchemaValidation(value, propDef.validation, propName);
          errors.push(...propResult.errors);
          warnings.push(...propResult.warnings);
        }
      }

      const executionTime = performance.now() - startTime;
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: ['type-validation']
        }
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `Type validation failed: ${error.message}`,
          value: data,
          code: 'TYPE_VALIDATION_ERROR',
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: ['type-validation']
        }
      };
    }
  }

  async validateInterface(object: any, interfaceDefinition: InterfaceDefinition): Promise<ValidationResult> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Check if object has required methods
      for (const [methodName, methodDef] of Object.entries(interfaceDefinition.methods)) {
        if (typeof object[methodName] !== 'function') {
          errors.push({
            path: methodName,
            message: `Method '${methodName}' is not implemented`,
            value: object[methodName],
            code: 'MISSING_METHOD',
            severity: 'error'
          });
        }
      }

      // Check properties if defined
      if (interfaceDefinition.properties) {
        for (const [propName, propDef] of Object.entries(interfaceDefinition.properties)) {
          const value = object[propName];
          
          if (value === undefined && !propDef.optional) {
            errors.push({
              path: propName,
              message: `Required property '${propName}' is missing`,
              value: undefined,
              code: 'MISSING_REQUIRED_PROPERTY',
              severity: 'error'
            });
          }
        }
      }

      const executionTime = performance.now() - startTime;
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: ['interface-validation']
        }
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `Interface validation failed: ${error.message}`,
          value: object,
          code: 'INTERFACE_VALIDATION_ERROR',
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: ['interface-validation']
        }
      };
    }
  }

  async registerRule(name: string, rule: ValidationRule): Promise<void> {
    this.rules.set(name, rule);
    this.emit('ruleRegistered', { name, rule });
  }

  async validateWithRules(data: any, ruleNames: string[]): Promise<ValidationResult> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const appliedRules: string[] = [];

    try {
      for (const ruleName of ruleNames) {
        const rule = this.rules.get(ruleName);
        if (!rule) {
          warnings.push({
            path: '',
            message: `Rule '${ruleName}' not found`,
            value: data,
            code: 'RULE_NOT_FOUND',
            rule: ruleName
          });
          continue;
        }

        // Check dependencies
        if (rule.dependencies) {
          const missingDeps = rule.dependencies.filter(dep => !this.rules.has(dep));
          if (missingDeps.length > 0) {
            errors.push({
              path: '',
              message: `Rule '${ruleName}' has missing dependencies: ${missingDeps.join(', ')}`,
              value: data,
              code: 'MISSING_RULE_DEPENDENCIES',
              severity: 'error',
              rule: ruleName
            });
            continue;
          }
        }

        const ruleResult = await rule.validate(data);
        appliedRules.push(ruleName);

        // Convert rule result errors/warnings to our format
        for (const error of ruleResult.errors) {
          errors.push({
            ...error,
            rule: ruleName,
            severity: rule.severity === 'error' ? 'error' : 'critical'
          });
        }

        for (const warning of ruleResult.warnings) {
          warnings.push({
            ...warning,
            rule: ruleName
          });
        }
      }

      const executionTime = performance.now() - startTime;
      
      return {
        isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: appliedRules
        }
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `Rule validation failed: ${error.message}`,
          value: data,
          code: 'RULE_VALIDATION_ERROR',
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: appliedRules
        }
      };
    }
  }

  async createRuleSet(rules: ValidationRule[]): Promise<RuleSet> {
    const ruleSet: RuleSet = {
      name: `ruleset_${Date.now()}`,
      rules,
      mode: 'strict',
      stopOnFirstError: false
    };

    this.ruleSets.set(ruleSet.name, ruleSet);
    return ruleSet;
  }

  async createQualityGate(name: string, criteria: QualityCriteria): Promise<QualityGate> {
    const qualityGate: QualityGate = {
      name,
      criteria,
      threshold: 80, // Default threshold
      severity: 'error',
      timeout: 30000 // 30 seconds
    };

    this.qualityGates.set(name, qualityGate);
    this.emit('qualityGateCreated', { name, qualityGate });
    return qualityGate;
  }

  async executeQualityGate(gate: QualityGate, data: any): Promise<QualityGateResult> {
    const startTime = performance.now();
    const criteriaResults: QualityCriteriaResult[] = [];
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    try {
      let totalScore = 0;
      let totalWeight = 0;

      // Execute each criteria
      for (const [criteriaName, criteriaValue] of Object.entries(gate.criteria.rules)) {
        const weight = gate.criteria.weights?.[criteriaName] || 1;
        let criteriaScore = 0;
        let criteriaPassed = false;

        // Determine how to evaluate this criteria
        if (typeof criteriaValue === 'string' && this.rules.has(criteriaValue)) {
          // It's a rule name
          const rule = this.rules.get(criteriaValue)!;
          const ruleResult = await rule.validate(data);
          criteriaPassed = ruleResult.isValid;
          criteriaScore = criteriaPassed ? 100 : 0;
        } else if (typeof criteriaValue === 'function') {
          // It's a custom validation function
          const result = await criteriaValue(data);
          criteriaPassed = typeof result === 'boolean' ? result : result.isValid;
          criteriaScore = criteriaPassed ? 100 : 0;
        } else {
          // It's a simple value check
          criteriaPassed = data[criteriaName] === criteriaValue;
          criteriaScore = criteriaPassed ? 100 : 0;
        }

        criteriaResults.push({
          name: criteriaName,
          passed: criteriaPassed,
          score: criteriaScore,
          weight,
          details: { value: criteriaValue, actual: data[criteriaName] }
        });

        totalScore += criteriaScore * weight;
        totalWeight += weight;

        if (!criteriaPassed) {
          issues.push({
            type: 'error',
            message: `Quality criteria '${criteriaName}' failed`,
            code: 'QUALITY_CRITERIA_FAILED',
            rule: criteriaName,
            severity: 8,
            fixable: true,
            suggestion: `Review and fix ${criteriaName} to meet quality standards`
          });
        }
      }

      const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      const passed = overallScore >= gate.threshold;

      if (!passed) {
        recommendations.push(`Improve overall quality score from ${overallScore.toFixed(1)} to at least ${gate.threshold}`);
        recommendations.push('Focus on failed criteria to increase quality gate score');
      }

      const executionTime = performance.now() - startTime;

      return {
        passed,
        score: overallScore,
        threshold: gate.threshold,
        criteria: criteriaResults,
        issues,
        recommendations,
        executionTime,
        metadata: {
          gateName: gate.name,
          executedAt: new Date(),
          timeout: gate.timeout
        }
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        passed: false,
        score: 0,
        threshold: gate.threshold,
        criteria: criteriaResults,
        issues: [{
          type: 'error',
          message: `Quality gate execution failed: ${error.message}`,
          code: 'QUALITY_GATE_ERROR',
          severity: 10,
          fixable: false
        }],
        recommendations: ['Fix quality gate execution errors before retrying'],
        executionTime,
        metadata: {
          gateName: gate.name,
          executedAt: new Date(),
          error: error.message
        }
      };
    }
  }

  async getQualityGateStatus(gateName: string): Promise<QualityGateStatus> {
    const gate = this.qualityGates.get(gateName);
    if (!gate) {
      throw new Error(`Quality gate not found: ${gateName}`);
    }

    // This would be enhanced with actual execution history tracking
    return {
      name: gateName,
      status: 'pending',
      lastExecution: new Date(),
      successRate: 85,
      averageExecutionTime: 1500,
      failureReasons: ['Low code coverage', 'Performance threshold exceeded']
    };
  }

  async createValidationPipeline(steps: ValidationStep[]): Promise<ValidationPipeline> {
    const pipeline: ValidationPipeline = {
      name: `pipeline_${Date.now()}`,
      steps: steps.sort((a, b) => a.order - b.order),
      mode: 'sequential',
      onError: 'stop',
      timeout: 60000 // 1 minute
    };

    this.pipelines.set(pipeline.name, pipeline);
    return pipeline;
  }

  async executePipeline(pipeline: ValidationPipeline, data: any): Promise<PipelineResult> {
    const startTime = performance.now();
    const stepResults: StepResult[] = [];
    const issues: ValidationIssue[] = [];
    let overallSuccess = true;

    try {
      if (pipeline.mode === 'sequential') {
        for (const step of pipeline.steps) {
          const stepResult = await this.executeValidationStep(step, data);
          stepResults.push(stepResult);

          if (!stepResult.success) {
            overallSuccess = false;
            issues.push(...this.convertValidationResultToIssues(stepResult.result));

            if (pipeline.onError === 'stop') {
              break;
            }
          }
        }
      } else {
        // Parallel execution
        const promises = pipeline.steps.map(step => this.executeValidationStep(step, data));
        const results = await Promise.all(promises);
        stepResults.push(...results);
        
        overallSuccess = results.every(r => r.success);
        results.forEach(r => {
          if (!r.success) {
            issues.push(...this.convertValidationResultToIssues(r.result));
          }
        });
      }

      const executionTime = performance.now() - startTime;
      const overallScore = this.calculatePipelineScore(stepResults);

      return {
        pipelineName: pipeline.name,
        success: overallSuccess,
        stepResults,
        overallScore,
        executionTime,
        issues
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        pipelineName: pipeline.name,
        success: false,
        stepResults,
        overallScore: 0,
        executionTime,
        issues: [{
          type: 'error',
          message: `Pipeline execution failed: ${error.message}`,
          code: 'PIPELINE_EXECUTION_ERROR',
          severity: 10,
          fixable: false
        }]
      };
    }
  }

  async getValidationMetrics(): Promise<ValidationMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  async generateValidationReport(filter?: ValidationFilter): Promise<ValidationReport> {
    let filteredHistory = this.validationHistory;

    // Apply filters
    if (filter) {
      if (filter.dateRange) {
        filteredHistory = filteredHistory.filter(h => 
          h.timestamp >= filter.dateRange!.start && h.timestamp <= filter.dateRange!.end
        );
      }
      
      if (filter.rules) {
        filteredHistory = filteredHistory.filter(h =>
          h.rules.some(rule => filter.rules!.includes(rule))
        );
      }
    }

    const summary = this.generateValidationSummary(filteredHistory);
    const trends = this.generateValidationTrends(filteredHistory);
    const recommendations = this.generateValidationRecommendations(summary);

    return {
      summary,
      details: filteredHistory.slice(-100), // Last 100 validations
      trends,
      recommendations,
      generatedAt: new Date()
    };
  }

  private async performSchemaValidation(
    data: any, 
    schema: ValidationSchema, 
    path: string
  ): Promise<{ isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type validation
    if (!this.validateType(data, schema.type)) {
      errors.push({
        path,
        message: `Expected type '${schema.type}' but got '${typeof data}'`,
        value: data,
        code: 'TYPE_MISMATCH',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        const value = data[key];
        const keyPath = path ? `${path}.${key}` : key;

        if (value !== undefined) {
          const subResult = await this.performSchemaValidation(value, subSchema, keyPath);
          errors.push(...subResult.errors);
          warnings.push(...subResult.warnings);
        }
      }

      // Check required fields
      if (schema.required) {
        for (const requiredField of schema.required) {
          if (data[requiredField] === undefined) {
            errors.push({
              path: path ? `${path}.${requiredField}` : requiredField,
              message: `Required field '${requiredField}' is missing`,
              value: undefined,
              code: 'MISSING_REQUIRED_FIELD',
              severity: 'error'
            });
          }
        }
      }
    }

    // Array validation
    if (schema.type === 'array' && schema.items) {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const itemPath = `${path}[${i}]`;
          const itemResult = await this.performSchemaValidation(data[i], schema.items, itemPath);
          errors.push(...itemResult.errors);
          warnings.push(...itemResult.warnings);
        }
      }
    }

    // String validation
    if (schema.type === 'string') {
      if (schema.minLength && data.length < schema.minLength) {
        errors.push({
          path,
          message: `String length ${data.length} is less than minimum ${schema.minLength}`,
          value: data,
          code: 'STRING_TOO_SHORT',
          severity: 'error'
        });
      }

      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push({
          path,
          message: `String length ${data.length} exceeds maximum ${schema.maxLength}`,
          value: data,
          code: 'STRING_TOO_LONG',
          severity: 'error'
        });
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        errors.push({
          path,
          message: `String does not match pattern: ${schema.pattern}`,
          value: data,
          code: 'PATTERN_MISMATCH',
          severity: 'error'
        });
      }
    }

    // Number validation
    if (schema.type === 'number') {
      if (schema.minimum && data < schema.minimum) {
        errors.push({
          path,
          message: `Value ${data} is less than minimum ${schema.minimum}`,
          value: data,
          code: 'VALUE_TOO_SMALL',
          severity: 'error'
        });
      }

      if (schema.maximum && data > schema.maximum) {
        errors.push({
          path,
          message: `Value ${data} exceeds maximum ${schema.maximum}`,
          value: data,
          code: 'VALUE_TOO_LARGE',
          severity: 'error'
        });
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value: data,
        code: 'INVALID_ENUM_VALUE',
        severity: 'error'
      });
    }

    // Custom validation
    if (schema.custom) {
      const customResult = schema.custom(data);
      if (customResult !== true) {
        const message = typeof customResult === 'string' ? customResult : 'Custom validation failed';
        errors.push({
          path,
          message,
          value: data,
          code: 'CUSTOM_VALIDATION_FAILED',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateType(data: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof data === 'string';
      case 'number':
        return typeof data === 'number' && !isNaN(data);
      case 'boolean':
        return typeof data === 'boolean';
      case 'object':
        return typeof data === 'object' && data !== null && !Array.isArray(data);
      case 'array':
        return Array.isArray(data);
      case 'null':
        return data === null;
      default:
        return true;
    }
  }

  private async executeValidationStep(step: ValidationStep, data: any): Promise<StepResult> {
    const startTime = performance.now();

    try {
      let validator: ValidationRule;
      
      if (typeof step.validator === 'string') {
        const rule = this.rules.get(step.validator);
        if (!rule) {
          throw new Error(`Validation rule not found: ${step.validator}`);
        }
        validator = rule;
      } else {
        validator = step.validator;
      }

      const result = await validator.validate(data);
      const executionTime = performance.now() - startTime;

      return {
        stepName: step.name,
        success: result.isValid,
        result,
        executionTime,
        skipped: false
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      const failedResult: ValidationResult = {
        isValid: false,
        errors: [{
          path: '',
          message: `Step execution failed: ${error.message}`,
          value: data,
          code: 'STEP_EXECUTION_ERROR',
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validationTime: executionTime,
          rulesApplied: [step.name]
        }
      };

      return {
        stepName: step.name,
        success: false,
        result: failedResult,
        executionTime,
        skipped: false,
        error: error as Error
      };
    }
  }

  private convertValidationResultToIssues(result: ValidationResult): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const error of result.errors) {
      issues.push({
        type: 'error',
        message: error.message,
        path: error.path,
        code: error.code,
        rule: error.rule,
        severity: error.severity === 'critical' ? 10 : 8,
        fixable: true,
        suggestion: `Fix ${error.code.toLowerCase().replace(/_/g, ' ')}`
      });
    }

    for (const warning of result.warnings) {
      issues.push({
        type: 'warning',
        message: warning.message,
        path: warning.path,
        code: warning.code,
        rule: warning.rule,
        severity: 4,
        fixable: true,
        suggestion: warning.suggestion
      });
    }

    return issues;
  }

  private calculatePipelineScore(stepResults: StepResult[]): number {
    if (stepResults.length === 0) return 0;
    
    const successCount = stepResults.filter(r => r.success).length;
    return (successCount / stepResults.length) * 100;
  }

  private generateValidationSummary(history: ValidationDetail[]): ValidationSummary {
    if (history.length === 0) {
      return {
        totalValidations: 0,
        successRate: 0,
        averageScore: 0,
        commonIssues: [],
        ruleEffectiveness: []
      };
    }

    const successCount = history.filter(h => h.result.isValid).length;
    const successRate = (successCount / history.length) * 100;

    // Calculate average score (simplified)
    const scores = history.map(h => h.result.score || (h.result.isValid ? 100 : 0));
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      totalValidations: history.length,
      successRate,
      averageScore,
      commonIssues: [], // Would analyze error patterns
      ruleEffectiveness: [] // Would analyze rule performance
    };
  }

  private generateValidationTrends(history: ValidationDetail[]): ValidationTrend[] {
    // Simplified trend analysis
    return [{
      period: 'last_week',
      successRate: 85,
      averageScore: 78,
      issueCount: 15,
      improvement: 5
    }];
  }

  private generateValidationRecommendations(summary: ValidationSummary): ValidationRecommendation[] {
    const recommendations: ValidationRecommendation[] = [];

    if (summary.successRate < 80) {
      recommendations.push({
        type: 'process',
        priority: 'high',
        description: 'Improve validation success rate through better data quality',
        impact: 'Reduces errors and improves system reliability',
        effort: 'Medium - requires process improvements'
      });
    }

    if (summary.averageScore < 70) {
      recommendations.push({
        type: 'rule',
        priority: 'medium',
        description: 'Review and optimize validation rules for better scoring',
        impact: 'Improves quality metrics and reduces false positives',
        effort: 'Low - rule configuration changes'
      });
    }

    return recommendations;
  }

  private setupBuiltInRules(): void {
    // Register common validation rules
    this.rules.set('not-empty', {
      name: 'not-empty',
      description: 'Validates that value is not empty',
      validate: (data) => ({
        isValid: data !== null && data !== undefined && data !== '',
        errors: data === null || data === undefined || data === '' ? [{
          path: '',
          message: 'Value cannot be empty',
          value: data,
          code: 'EMPTY_VALUE',
          severity: 'error' as const
        }] : [],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validationTime: 0,
          rulesApplied: ['not-empty']
        }
      }),
      severity: 'error',
      category: 'basic'
    });

    this.rules.set('is-email', {
      name: 'is-email',
      description: 'Validates email format',
      validate: (data) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = typeof data === 'string' && emailRegex.test(data);
        
        return {
          isValid,
          errors: !isValid ? [{
            path: '',
            message: 'Invalid email format',
            value: data,
            code: 'INVALID_EMAIL',
            severity: 'error' as const
          }] : [],
          warnings: [],
          metadata: {
            validatedAt: new Date(),
            validationTime: 0,
            rulesApplied: ['is-email']
          }
        };
      },
      severity: 'error',
      category: 'format'
    });
  }

  private setupBuiltInSchemas(): void {
    // Register common schemas
    this.schemas.set('email', {
      type: 'string',
      format: 'email',
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
    });

    this.schemas.set('positive-number', {
      type: 'number',
      minimum: 0
    });

    this.schemas.set('non-empty-string', {
      type: 'string',
      minLength: 1
    });
  }

  private initializeMetrics(): ValidationMetrics {
    return {
      totalValidations: 0,
      successRate: 0,
      averageExecutionTime: 0,
      ruleUtilization: {},
      errorPatterns: {},
      qualityGateMetrics: {
        totalExecutions: 0,
        passRate: 0,
        averageScore: 0,
        timeoutRate: 0,
        topFailureReasons: []
      }
    };
  }

  private async updateMetrics(): Promise<void> {
    this.metrics.totalValidations = this.validationHistory.length;
    
    if (this.validationHistory.length > 0) {
      const successCount = this.validationHistory.filter(h => h.result.isValid).length;
      this.metrics.successRate = (successCount / this.validationHistory.length) * 100;

      const totalTime = this.validationHistory.reduce((sum, h) => sum + h.executionTime, 0);
      this.metrics.averageExecutionTime = totalTime / this.validationHistory.length;
    }

    this.emit('metricsUpdated', this.metrics);
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Validation Framework...');
    
    this.schemas.clear();
    this.rules.clear();
    this.ruleSets.clear();
    this.qualityGates.clear();
    this.pipelines.clear();
    this.validationHistory = [];
    
    this.removeAllListeners();
    console.log('Validation Framework shutdown complete');
  }
}