import { QualityOrchestrator } from '../core/QualityOrchestrator.js';
import { Logger } from '../utils/Logger.js';
export class QualityTools {
    orchestrator;
    logger;
    constructor() {
        this.orchestrator = new QualityOrchestrator();
        this.logger = new Logger('QualityTools');
    }
    getTools() {
        return [
            {
                name: 'execute_quality_gates',
                description: 'Run full 11-step validation with semantic checks',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['file', 'directory', 'project'] },
                                path: { type: 'string' },
                                excludePatterns: { type: 'array', items: { type: 'string' } }
                            },
                            required: ['type', 'path']
                        },
                        gates: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['syntax', 'semantic', 'type', 'import', 'lint', 'security', 'test', 'semanticCoverage', 'performance', 'documentation', 'integration']
                            },
                            default: ['syntax', 'semantic', 'type', 'import', 'lint', 'security', 'test', 'semanticCoverage', 'performance', 'documentation', 'integration']
                        },
                        options: {
                            type: 'object',
                            properties: {
                                parallelExecution: { type: 'boolean', default: true },
                                earlyTermination: { type: 'boolean', default: true },
                                generateReport: { type: 'boolean', default: true },
                                includeRecommendations: { type: 'boolean', default: true }
                            }
                        }
                    },
                    required: ['target']
                }
            },
            {
                name: 'validate_semantic',
                description: 'LSP-based semantic validation',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'object',
                            properties: {
                                files: { type: 'array', items: { type: 'string' } },
                                language: { type: 'string' }
                            },
                            required: ['files']
                        },
                        checks: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['type_consistency', 'symbol_usage', 'references', 'api_contracts', 'unused_symbols']
                            },
                            default: ['type_consistency', 'symbol_usage', 'references', 'api_contracts', 'unused_symbols']
                        },
                        options: {
                            type: 'object',
                            properties: {
                                includeUnused: { type: 'boolean', default: true },
                                validateContracts: { type: 'boolean', default: true },
                                checkCrossFile: { type: 'boolean', default: true }
                            }
                        }
                    },
                    required: ['target']
                }
            },
            {
                name: 'scan_security',
                description: 'Security vulnerability scanning',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                type: { type: 'string', enum: ['file', 'directory', 'project'] },
                                includeDependencies: { type: 'boolean', default: true }
                            },
                            required: ['path', 'type']
                        },
                        frameworks: {
                            type: 'array',
                            items: { type: 'string', enum: ['owasp', 'sans', 'nist', 'pci-dss', 'iso27001'] },
                            default: ['owasp']
                        },
                        severity: {
                            type: 'string',
                            enum: ['critical', 'high', 'medium', 'low', 'all'],
                            default: 'medium'
                        },
                        options: {
                            type: 'object',
                            properties: {
                                includeCompliance: { type: 'boolean', default: true },
                                scanDependencies: { type: 'boolean', default: true },
                                generateReport: { type: 'boolean', default: true }
                            }
                        }
                    },
                    required: ['target']
                }
            },
            {
                name: 'run_tests',
                description: 'Execute test suites',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'object',
                            properties: {
                                testPath: { type: 'string' },
                                testPattern: { type: 'string', default: '**/*.test.*' },
                                framework: { type: 'string', enum: ['jest', 'mocha', 'playwright', 'cypress'] }
                            },
                            required: ['testPath']
                        },
                        coverage: {
                            type: 'object',
                            properties: {
                                enabled: { type: 'boolean', default: true },
                                threshold: { type: 'number', default: 80 },
                                includeUntested: { type: 'boolean', default: true }
                            }
                        },
                        options: {
                            type: 'object',
                            properties: {
                                parallel: { type: 'boolean', default: true },
                                verbose: { type: 'boolean', default: false },
                                bail: { type: 'boolean', default: false },
                                generateReport: { type: 'boolean', default: true }
                            }
                        }
                    },
                    required: ['target']
                }
            },
            {
                name: 'measure_performance',
                description: 'Performance benchmarking',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                type: { type: 'string', enum: ['function', 'module', 'application'] },
                                benchmarks: { type: 'array', items: { type: 'string' } }
                            },
                            required: ['path', 'type']
                        },
                        metrics: {
                            type: 'array',
                            items: { type: 'string', enum: ['execution_time', 'memory_usage', 'cpu_usage', 'throughput', 'latency'] },
                            default: ['execution_time', 'memory_usage']
                        },
                        options: {
                            type: 'object',
                            properties: {
                                iterations: { type: 'number', default: 100 },
                                warmup: { type: 'number', default: 10 },
                                baseline: { type: 'string' },
                                generateReport: { type: 'boolean', default: true }
                            }
                        }
                    },
                    required: ['target']
                }
            },
            {
                name: 'check_documentation',
                description: 'Validate docs completeness',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                patterns: { type: 'array', items: { type: 'string' }, default: ['**/*.md', '**/README*', '**/docs/**'] },
                                codeFiles: { type: 'array', items: { type: 'string' } }
                            },
                            required: ['path']
                        },
                        checks: {
                            type: 'array',
                            items: { type: 'string', enum: ['completeness', 'accuracy', 'style', 'links', 'code_examples', 'api_docs'] },
                            default: ['completeness', 'accuracy', 'style', 'links']
                        },
                        options: {
                            type: 'object',
                            properties: {
                                includeInlineComments: { type: 'boolean', default: true },
                                validateLinks: { type: 'boolean', default: true },
                                checkCodeExamples: { type: 'boolean', default: true },
                                generateReport: { type: 'boolean', default: true }
                            }
                        }
                    },
                    required: ['target']
                }
            }
        ];
    }
    async handleToolCall(request) {
        this.logger.info('Handling tool call', { name: request.params.name });
        try {
            switch (request.params.name) {
                case 'execute_quality_gates':
                    return await this.executeQualityGates(request.params.arguments);
                case 'validate_semantic':
                    return await this.validateSemantic(request.params.arguments);
                case 'scan_security':
                    return await this.scanSecurity(request.params.arguments);
                case 'run_tests':
                    return await this.runTests(request.params.arguments);
                case 'measure_performance':
                    return await this.measurePerformance(request.params.arguments);
                case 'check_documentation':
                    return await this.checkDocumentation(request.params.arguments);
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        }
        catch (error) {
            this.logger.error('Tool call failed', { name: request.params.name, error });
            return {
                content: [{
                        type: 'text',
                        text: `Tool execution failed: ${error.message}`
                    }]
            };
        }
    }
    async executeQualityGates(args) {
        const { target, gates = [], options = {} } = args;
        const context = {
            target: await this.buildValidationTarget(target),
            scope: this.determineValidationScope(target),
            gates: await this.loadQualityGates(gates.length > 0 ? gates : this.getAllGateTypes()),
            requirements: await this.loadQualityRequirements(target),
            constraints: { timeout: 60000 }
        };
        const result = await this.orchestrator.executeQualityPipeline(context);
        const report = options.generateReport
            ? await this.orchestrator.generateQualityReport([result])
            : null;
        const responseText = this.formatQualityGatesResult(result, report, options);
        return {
            content: [{
                    type: 'text',
                    text: responseText
                }]
        };
    }
    async validateSemantic(args) {
        const { target, checks = [], options = {} } = args;
        const context = {
            target: {
                type: 'file',
                uri: '',
                files: target.files,
                language: target.language || undefined,
                excludePatterns: []
            },
            scope: { depth: options.checkCrossFile ? 'project' : 'file' },
            gates: await this.loadQualityGates(['semantic']),
            requirements: { semanticChecks: checks },
            constraints: { timeout: 30000 }
        };
        const result = await this.orchestrator.executeQualityPipeline(context);
        const responseText = this.formatSemanticValidationResult(result, options);
        return {
            content: [{
                    type: 'text',
                    text: responseText
                }]
        };
    }
    async scanSecurity(args) {
        const { target, frameworks = ['owasp'], severity = 'medium', options = {} } = args;
        const context = {
            target: await this.buildValidationTarget(target),
            scope: { depth: 'project', includeExternal: options.scanDependencies || false },
            gates: await this.loadQualityGates(['security']),
            requirements: {
                securityFrameworks: frameworks,
                minSeverity: severity,
                compliance: options.includeCompliance || false
            },
            constraints: { timeout: 60000 }
        };
        const result = await this.orchestrator.executeQualityPipeline(context);
        const responseText = this.formatSecurityScanResult(result, options);
        return {
            content: [{
                    type: 'text',
                    text: responseText
                }]
        };
    }
    async runTests(args) {
        const { target, coverage = {}, options = {} } = args;
        const context = {
            target: {
                type: 'directory',
                uri: target.testPath,
                files: [],
                excludePatterns: []
            },
            scope: { depth: 'module' },
            gates: await this.loadQualityGates(['test']),
            requirements: { coverageThreshold: coverage.threshold || 80 },
            constraints: { timeout: 120000 }
        };
        const result = await this.orchestrator.executeQualityPipeline(context);
        return {
            content: [{
                    type: 'text',
                    text: `Test execution completed.\nStatus: ${result.overallResult}\nCoverage: ${result.metrics.testCoverage}%\nIssues: ${result.issues.length}`
                }]
        };
    }
    async measurePerformance(args) {
        const { target, metrics = ['execution_time', 'memory_usage'], options = {} } = args;
        const context = {
            target: await this.buildValidationTarget(target),
            scope: { depth: 'file' },
            gates: await this.loadQualityGates(['performance']),
            requirements: { performanceThresholds: {} },
            constraints: { timeout: 60000 }
        };
        const result = await this.orchestrator.executeQualityPipeline(context);
        return {
            content: [{
                    type: 'text',
                    text: `Performance measurement completed.\nScore: ${result.metrics.performanceScore}/100\nIssues: ${result.issues.length}`
                }]
        };
    }
    async checkDocumentation(args) {
        const { target, checks = ['completeness', 'accuracy'], options = {} } = args;
        const context = {
            target: await this.buildValidationTarget(target),
            scope: { depth: 'project' },
            gates: await this.loadQualityGates(['documentation']),
            requirements: {},
            constraints: { timeout: 30000 }
        };
        const result = await this.orchestrator.executeQualityPipeline(context);
        return {
            content: [{
                    type: 'text',
                    text: `Documentation check completed.\nScore: ${result.metrics.documentationScore}/100\nIssues: ${result.issues.length}`
                }]
        };
    }
    async buildValidationTarget(target) {
        return {
            type: target.type,
            uri: target.path,
            files: await this.resolveTargetFiles(target),
            excludePatterns: target.excludePatterns || []
        };
    }
    async resolveTargetFiles(target) {
        return [target.path];
    }
    determineValidationScope(target) {
        return { depth: target.type === 'file' ? 'file' : 'project' };
    }
    async loadQualityGates(gateTypes) {
        return gateTypes.map(type => ({ name: type, type, enabled: true }));
    }
    async loadQualityRequirements(target) {
        return {};
    }
    getAllGateTypes() {
        return ['syntax', 'semantic', 'type', 'import', 'lint', 'security', 'test', 'semanticCoverage', 'performance', 'documentation', 'integration'];
    }
    formatQualityGatesResult(result, report, options) {
        let output = `Quality Gates Execution Result\n`;
        output += `================================\n\n`;
        output += `Overall Status: ${result.overallResult}\n`;
        output += `Overall Score: ${result.metrics.overallScore}/100\n`;
        output += `Total Issues: ${result.issues.length}\n`;
        output += `Processing Time: ${result.performance.totalTime}ms\n\n`;
        if (result.gateResults.length > 0) {
            output += `Gate Results:\n`;
            for (const gate of result.gateResults) {
                output += `- ${gate.gate}: ${gate.status} (${gate.score}/100)\n`;
            }
            output += `\n`;
        }
        if (result.issues.length > 0) {
            output += `Issues Found:\n`;
            const criticalIssues = result.issues.filter((i) => i.severity === 'critical');
            if (criticalIssues.length > 0) {
                output += `Critical: ${criticalIssues.length}\n`;
            }
            output += `Total: ${result.issues.length}\n\n`;
        }
        if (options.includeRecommendations && result.recommendations.length > 0) {
            output += `Recommendations:\n`;
            for (const rec of result.recommendations.slice(0, 3)) {
                output += `- ${rec.description}\n`;
            }
        }
        return output;
    }
    formatSemanticValidationResult(result, options) {
        return `Semantic Validation Result\n` +
            `=========================\n\n` +
            `Status: ${result.overallResult}\n` +
            `Semantic Score: ${result.metrics.semanticScore}/100\n` +
            `Issues: ${result.issues.length}\n`;
    }
    formatSecurityScanResult(result, options) {
        return `Security Scan Result\n` +
            `===================\n\n` +
            `Status: ${result.overallResult}\n` +
            `Security Score: ${result.metrics.securityScore}/100\n` +
            `Vulnerabilities: ${result.issues.filter((i) => i.category === 'security').length}\n`;
    }
}
//# sourceMappingURL=QualityTools.js.map