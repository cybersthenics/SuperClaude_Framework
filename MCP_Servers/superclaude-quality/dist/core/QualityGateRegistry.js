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
export class QualityGateRegistry {
    gates = new Map();
    validators = new Map();
    logger;
    config;
    constructor(config) {
        this.logger = new Logger('QualityGateRegistry');
        this.config = this.mergeWithDefaults(config || {});
        this.initializeValidators();
        this.registerGates();
    }
    async getAllGates() {
        return Array.from(this.gates.values()).filter(gate => gate.enabled);
    }
    async getGate(type) {
        return this.gates.get(type);
    }
    async getGatesByPriority(priority) {
        return Array.from(this.gates.values()).filter(gate => gate.priority === priority && gate.enabled);
    }
    async getGatesByNames(names) {
        return Array.from(this.gates.values()).filter(gate => names.includes(gate.name) && gate.enabled);
    }
    async setGateEnabled(type, enabled) {
        const gate = this.gates.get(type);
        if (gate) {
            gate.enabled = enabled;
            this.logger.info(`Gate ${type} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    async updateGateConfiguration(type, config) {
        const gate = this.gates.get(type);
        if (gate) {
            gate.configuration = { ...gate.configuration, ...config };
            this.logger.info(`Updated configuration for gate ${type}`);
        }
    }
    async getGateStatistics() {
        const stats = {};
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
    mergeWithDefaults(config) {
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
    getDefaultGateConfigurations() {
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
    initializeValidators() {
        this.logger.info('Initializing quality validators');
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
    registerGates() {
        this.logger.info('Registering quality gates');
        this.registerGate({
            name: 'syntax',
            type: 'syntax',
            priority: 'critical',
            validator: this.validators.get('syntax'),
            timeout: this.config.gateConfigurations.syntax.timeout,
            dependencies: [],
            configuration: this.config.gateConfigurations.syntax,
            enabled: this.config.enabledGates.includes('syntax')
        });
        this.registerGate({
            name: 'semantic',
            type: 'semantic',
            priority: 'critical',
            validator: this.validators.get('semantic'),
            timeout: this.config.gateConfigurations.semantic.timeout,
            dependencies: ['syntax'],
            configuration: this.config.gateConfigurations.semantic,
            enabled: this.config.enabledGates.includes('semantic')
        });
        this.registerGate({
            name: 'type',
            type: 'type',
            priority: 'high',
            validator: this.validators.get('type'),
            timeout: this.config.gateConfigurations.type.timeout,
            dependencies: ['syntax', 'semantic'],
            configuration: this.config.gateConfigurations.type,
            enabled: this.config.enabledGates.includes('type')
        });
        this.registerGate({
            name: 'import',
            type: 'import',
            priority: 'high',
            validator: this.validators.get('import'),
            timeout: this.config.gateConfigurations.import.timeout,
            dependencies: ['syntax'],
            configuration: this.config.gateConfigurations.import,
            enabled: this.config.enabledGates.includes('import')
        });
        this.registerGate({
            name: 'lint',
            type: 'lint',
            priority: 'medium',
            validator: this.validators.get('lint'),
            timeout: this.config.gateConfigurations.lint.timeout,
            dependencies: ['syntax'],
            configuration: this.config.gateConfigurations.lint,
            enabled: this.config.enabledGates.includes('lint')
        });
        this.registerGate({
            name: 'security',
            type: 'security',
            priority: 'critical',
            validator: this.validators.get('security'),
            timeout: this.config.gateConfigurations.security.timeout,
            dependencies: ['syntax', 'semantic'],
            configuration: this.config.gateConfigurations.security,
            enabled: this.config.enabledGates.includes('security')
        });
        this.registerGate({
            name: 'test',
            type: 'test',
            priority: 'high',
            validator: this.validators.get('test'),
            timeout: this.config.gateConfigurations.test.timeout,
            dependencies: ['syntax', 'lint'],
            configuration: this.config.gateConfigurations.test,
            enabled: this.config.enabledGates.includes('test')
        });
        this.registerGate({
            name: 'semanticCoverage',
            type: 'semanticCoverage',
            priority: 'medium',
            validator: this.validators.get('semanticCoverage'),
            timeout: this.config.gateConfigurations.semanticCoverage.timeout,
            dependencies: ['semantic', 'test'],
            configuration: this.config.gateConfigurations.semanticCoverage,
            enabled: this.config.enabledGates.includes('semanticCoverage')
        });
        this.registerGate({
            name: 'performance',
            type: 'performance',
            priority: 'medium',
            validator: this.validators.get('performance'),
            timeout: this.config.gateConfigurations.performance.timeout,
            dependencies: ['test'],
            configuration: this.config.gateConfigurations.performance,
            enabled: this.config.enabledGates.includes('performance')
        });
        this.registerGate({
            name: 'documentation',
            type: 'documentation',
            priority: 'low',
            validator: this.validators.get('documentation'),
            timeout: this.config.gateConfigurations.documentation.timeout,
            dependencies: ['syntax', 'semantic'],
            configuration: this.config.gateConfigurations.documentation,
            enabled: this.config.enabledGates.includes('documentation')
        });
        this.registerGate({
            name: 'integration',
            type: 'integration',
            priority: 'high',
            validator: this.validators.get('integration'),
            timeout: this.config.gateConfigurations.integration.timeout,
            dependencies: ['test', 'security', 'performance'],
            configuration: this.config.gateConfigurations.integration,
            enabled: this.config.enabledGates.includes('integration')
        });
        this.logger.info(`Registered ${this.gates.size} quality gates`);
    }
    registerGate(gate) {
        this.gates.set(gate.type, gate);
        this.logger.debug(`Registered gate: ${gate.name}`, {
            type: gate.type,
            priority: gate.priority,
            enabled: gate.enabled,
            dependencies: gate.dependencies
        });
    }
    validateDependencies() {
        const gateNames = new Set(Array.from(this.gates.keys()));
        for (const gate of this.gates.values()) {
            for (const dependency of gate.dependencies) {
                if (!gateNames.has(dependency)) {
                    this.logger.error(`Invalid dependency: ${dependency} for gate ${gate.name}`);
                    return false;
                }
            }
        }
        return true;
    }
    async getExecutionOrder() {
        const gates = Array.from(this.gates.values()).filter(g => g.enabled);
        const visited = new Set();
        const order = [];
        const visit = (gateName) => {
            if (visited.has(gateName))
                return;
            visited.add(gateName);
            const gate = Array.from(this.gates.values()).find(g => g.name === gateName);
            if (!gate)
                return;
            gate.dependencies.forEach(dep => visit(dep));
            order.push(gate.type);
        };
        gates.forEach(gate => visit(gate.name));
        return order;
    }
    async getParallelGroups() {
        const gates = Array.from(this.gates.values()).filter(g => g.enabled);
        const groups = [];
        const processed = new Set();
        for (const gate of gates) {
            if (processed.has(gate.type))
                continue;
            const group = [gate.type];
            processed.add(gate.type);
            for (const otherGate of gates) {
                if (processed.has(otherGate.type))
                    continue;
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
//# sourceMappingURL=QualityGateRegistry.js.map