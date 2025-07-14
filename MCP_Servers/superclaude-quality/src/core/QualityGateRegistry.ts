/**
 * SuperClaude Quality Gate Registry
 * Manages all 11 quality validation gates
 */

import {
  QualityGate,
  QualityGateType,
  QualityValidator,
  QualityGateConfig
} from '../types/index.js';

import { SyntaxValidator } from '../validators/SyntaxValidator.js';
import { SemanticValidator } from '../validators/SemanticValidator.js';
import { TypeValidator } from '../validators/TypeValidator.js';
import { ImportValidator } from '../validators/ImportValidator.js';
import { LintValidator } from '../validators/LintValidator.js';
import { SecurityValidator } from '../validators/SecurityValidator.js';
import { TestValidator } from '../validators/TestValidator.js';
import { SemanticCoverageValidator } from '../validators/SemanticCoverageValidator.js';
import { PerformanceValidator } from '../validators/PerformanceValidator.js';
import { DocumentationValidator } from '../validators/DocumentationValidator.js';
import { IntegrationValidator } from '../validators/IntegrationValidator.js';
import { Logger } from '../utils/Logger.js';

export interface QualityGateRegistryConfig {
  enabledGates: QualityGateType[];
  gateConfigurations: Record<QualityGateType, QualityGateConfig>;
  defaultTimeout: number;
  enableCaching: boolean;
}

export class QualityGateRegistry {
  private gates: Map<QualityGateType, QualityGate> = new Map();
  private validators: Map<QualityGateType, QualityValidator> = new Map();
  private logger: Logger;
  private config: QualityGateRegistryConfig;

  constructor(config?: Partial<QualityGateRegistryConfig>) {
    this.logger = new Logger('QualityGateRegistry');
    this.config = this.mergeWithDefaults(config || {});
    this.initializeValidators();
    this.registerGates();
  }

  /**
   * Get all registered quality gates
   */
  async getAllGates(): Promise<QualityGate[]> {
    return Array.from(this.gates.values()).filter(gate => gate.enabled);
  }

  /**
   * Get specific quality gate by type
   */
  async getGate(type: QualityGateType): Promise<QualityGate | undefined> {
    return this.gates.get(type);
  }

  /**
   * Get gates by priority
   */
  async getGatesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<QualityGate[]> {
    return Array.from(this.gates.values()).filter(gate => 
      gate.priority === priority && gate.enabled
    );
  }

  /**
   * Get gates by names
   */
  async getGatesByNames(names: string[]): Promise<QualityGate[]> {
    return Array.from(this.gates.values()).filter(gate => 
      names.includes(gate.name) && gate.enabled
    );
  }

  /**
   * Enable/disable a specific gate
   */
  async setGateEnabled(type: QualityGateType, enabled: boolean): Promise<void> {
    const gate = this.gates.get(type);
    if (gate) {
      gate.enabled = enabled;
      this.logger.info(`Gate ${type} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Update gate configuration
   */
  async updateGateConfiguration(type: QualityGateType, config: Partial<QualityGateConfig>): Promise<void> {
    const gate = this.gates.get(type);
    if (gate) {
      gate.configuration = { ...gate.configuration, ...config };
      this.logger.info(`Updated configuration for gate ${type}`);
    }
  }

  /**
   * Get gate execution statistics
   */
  async getGateStatistics(): Promise<Record<QualityGateType, any>> {
    const stats: Record<string, any> = {};
    
    for (const [type, gate] of this.gates.entries()) {
      stats[type] = {
        enabled: gate.enabled,
        priority: gate.priority,
        timeout: gate.timeout,
        dependencies: gate.dependencies.length,
        validatorType: gate.validator.constructor.name
      };
    }

    return stats;
  }

  /**
   * Private initialization methods
   */
  private mergeWithDefaults(config: Partial<QualityGateRegistryConfig>): QualityGateRegistryConfig {
    return {
      enabledGates: config.enabledGates || [
        'syntax', 'semantic', 'type', 'import', 'lint', 'security', 
        'test', 'semanticCoverage', 'performance', 'documentation', 'integration'
      ],
      gateConfigurations: config.gateConfigurations || this.getDefaultGateConfigurations(),
      defaultTimeout: config.defaultTimeout || 30000,
      enableCaching: config.enableCaching !== undefined ? config.enableCaching : true
    };
  }

  private getDefaultGateConfigurations(): Record<QualityGateType, QualityGateConfig> {
    return {
      syntax: { enabled: true, priority: 'critical', timeout: 20000 },
      semantic: { enabled: true, priority: 'critical', timeout: 30000 },
      type: { enabled: true, priority: 'high', timeout: 25000 },
      import: { enabled: true, priority: 'high', timeout: 15000 },
      lint: { enabled: true, priority: 'medium', timeout: 20000 },
      security: { enabled: true, priority: 'critical', timeout: 40000 },
      test: { enabled: true, priority: 'high', timeout: 50000 },
      semanticCoverage: { enabled: true, priority: 'medium', timeout: 30000 },
      performance: { enabled: true, priority: 'medium', timeout: 35000 },
      documentation: { enabled: true, priority: 'low', timeout: 25000 },
      integration: { enabled: true, priority: 'high', timeout: 45000 }
    };
  }

  private initializeValidators(): void {
    this.logger.info('Initializing quality validators');

    // Initialize all validators
    this.validators.set('syntax', new SyntaxValidator());
    this.validators.set('semantic', new SemanticValidator());
    this.validators.set('type', new TypeValidator());
    this.validators.set('import', new ImportValidator());
    this.validators.set('lint', new LintValidator());
    this.validators.set('security', new SecurityValidator());
    this.validators.set('test', new TestValidator());
    this.validators.set('semanticCoverage', new SemanticCoverageValidator());
    this.validators.set('performance', new PerformanceValidator());
    this.validators.set('documentation', new DocumentationValidator());
    this.validators.set('integration', new IntegrationValidator());

    this.logger.info(`Initialized ${this.validators.size} validators`);
  }

  private registerGates(): void {
    this.logger.info('Registering quality gates');

    // Register Syntax Gate
    this.registerGate({
      name: 'syntax',
      type: 'syntax',
      priority: 'critical',
      validator: this.validators.get('syntax')!,
      timeout: this.config.gateConfigurations.syntax.timeout,
      dependencies: [],
      configuration: this.config.gateConfigurations.syntax,
      enabled: this.config.enabledGates.includes('syntax')
    });

    // Register Semantic Gate
    this.registerGate({
      name: 'semantic',
      type: 'semantic',
      priority: 'critical',
      validator: this.validators.get('semantic')!,
      timeout: this.config.gateConfigurations.semantic.timeout,
      dependencies: ['syntax'], // Depends on syntax validation
      configuration: this.config.gateConfigurations.semantic,
      enabled: this.config.enabledGates.includes('semantic')
    });

    // Register Type Gate
    this.registerGate({
      name: 'type',
      type: 'type',
      priority: 'high',
      validator: this.validators.get('type')!,
      timeout: this.config.gateConfigurations.type.timeout,
      dependencies: ['syntax', 'semantic'],
      configuration: this.config.gateConfigurations.type,
      enabled: this.config.enabledGates.includes('type')
    });

    // Register Import Gate
    this.registerGate({
      name: 'import',
      type: 'import',
      priority: 'high',
      validator: this.validators.get('import')!,
      timeout: this.config.gateConfigurations.import.timeout,
      dependencies: ['syntax'],
      configuration: this.config.gateConfigurations.import,
      enabled: this.config.enabledGates.includes('import')
    });

    // Register Lint Gate
    this.registerGate({
      name: 'lint',
      type: 'lint',
      priority: 'medium',
      validator: this.validators.get('lint')!,
      timeout: this.config.gateConfigurations.lint.timeout,
      dependencies: ['syntax'],
      configuration: this.config.gateConfigurations.lint,
      enabled: this.config.enabledGates.includes('lint')
    });

    // Register Security Gate
    this.registerGate({
      name: 'security',
      type: 'security',
      priority: 'critical',
      validator: this.validators.get('security')!,
      timeout: this.config.gateConfigurations.security.timeout,
      dependencies: ['syntax', 'semantic'],
      configuration: this.config.gateConfigurations.security,
      enabled: this.config.enabledGates.includes('security')
    });

    // Register Test Gate
    this.registerGate({
      name: 'test',
      type: 'test',
      priority: 'high',
      validator: this.validators.get('test')!,
      timeout: this.config.gateConfigurations.test.timeout,
      dependencies: ['syntax', 'lint'],
      configuration: this.config.gateConfigurations.test,
      enabled: this.config.enabledGates.includes('test')
    });

    // Register Semantic Coverage Gate
    this.registerGate({
      name: 'semanticCoverage',
      type: 'semanticCoverage',
      priority: 'medium',
      validator: this.validators.get('semanticCoverage')!,
      timeout: this.config.gateConfigurations.semanticCoverage.timeout,
      dependencies: ['semantic', 'test'],
      configuration: this.config.gateConfigurations.semanticCoverage,
      enabled: this.config.enabledGates.includes('semanticCoverage')
    });

    // Register Performance Gate
    this.registerGate({
      name: 'performance',
      type: 'performance',
      priority: 'medium',
      validator: this.validators.get('performance')!,
      timeout: this.config.gateConfigurations.performance.timeout,
      dependencies: ['test'],
      configuration: this.config.gateConfigurations.performance,
      enabled: this.config.enabledGates.includes('performance')
    });

    // Register Documentation Gate
    this.registerGate({
      name: 'documentation',
      type: 'documentation',
      priority: 'low',
      validator: this.validators.get('documentation')!,
      timeout: this.config.gateConfigurations.documentation.timeout,
      dependencies: ['syntax', 'semantic'],
      configuration: this.config.gateConfigurations.documentation,
      enabled: this.config.enabledGates.includes('documentation')
    });

    // Register Integration Gate
    this.registerGate({
      name: 'integration',
      type: 'integration',
      priority: 'high',
      validator: this.validators.get('integration')!,
      timeout: this.config.gateConfigurations.integration.timeout,
      dependencies: ['test', 'security', 'performance'], // Depends on other validations
      configuration: this.config.gateConfigurations.integration,
      enabled: this.config.enabledGates.includes('integration')
    });

    this.logger.info(`Registered ${this.gates.size} quality gates`);
  }

  private registerGate(gate: QualityGate): void {
    this.gates.set(gate.type, gate);
    this.logger.debug(`Registered gate: ${gate.name}`, {
      type: gate.type,
      priority: gate.priority,
      enabled: gate.enabled,
      dependencies: gate.dependencies
    });
  }

  /**
   * Validate gate dependencies
   */
  private validateDependencies(): boolean {
    const gateNames = new Set(Array.from(this.gates.keys()));
    
    for (const gate of this.gates.values()) {
      for (const dependency of gate.dependencies) {
        if (!gateNames.has(dependency as QualityGateType)) {
          this.logger.error(`Invalid dependency: ${dependency} for gate ${gate.name}`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get gate execution order based on dependencies
   */
  async getExecutionOrder(): Promise<QualityGateType[]> {
    const gates = Array.from(this.gates.values()).filter(g => g.enabled);
    const visited = new Set<string>();
    const order: QualityGateType[] = [];

    const visit = (gateName: string) => {
      if (visited.has(gateName)) return;
      visited.add(gateName);

      const gate = Array.from(this.gates.values()).find(g => g.name === gateName);
      if (!gate) return;

      // Visit dependencies first
      gate.dependencies.forEach(dep => visit(dep));
      order.push(gate.type);
    };

    gates.forEach(gate => visit(gate.name));
    return order;
  }

  /**
   * Get parallel execution groups
   */
  async getParallelGroups(): Promise<QualityGateType[][]> {
    const gates = Array.from(this.gates.values()).filter(g => g.enabled);
    const groups: QualityGateType[][] = [];
    const processed = new Set<QualityGateType>();

    for (const gate of gates) {
      if (processed.has(gate.type)) continue;

      const group = [gate.type];
      processed.add(gate.type);

      // Find other gates that can run in parallel
      for (const otherGate of gates) {
        if (processed.has(otherGate.type)) continue;
        
        const hasConflict = gate.dependencies.includes(otherGate.name) ||
                           otherGate.dependencies.includes(gate.name);
        
        if (!hasConflict) {
          group.push(otherGate.type);
          processed.add(otherGate.type);
        }
      }

      groups.push(group);
    }

    return groups;
  }
}