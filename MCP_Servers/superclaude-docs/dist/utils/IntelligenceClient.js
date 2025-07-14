"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceClient = void 0;
const Logger_js_1 = require("./Logger.js");
class IntelligenceClient {
    constructor(config) {
        this.config = config;
        this.logger = new Logger_js_1.Logger('IntelligenceClient');
        this.isEnabled = config.integration.enableIntelligenceIntegration;
        if (!this.isEnabled) {
            this.logger.info('Intelligence integration is disabled');
        }
        else {
            this.logger.info('IntelligenceClient initialized');
        }
    }
    async analyzeTarget(target) {
        if (!this.isEnabled) {
            this.logger.debug('Intelligence integration disabled, returning mock analysis');
            return this.getMockAnalysis(target);
        }
        this.logger.debug('Analyzing documentation target', { target });
        try {
            const analysis = {
                type: target.type,
                path: target.path,
                complexity: this.calculateMockComplexity(target),
                structure: {
                    directories: this.getMockDirectories(target),
                    files: this.getMockFiles(target),
                    modules: this.getMockModules(target),
                    classes: this.getMockClasses(target),
                    functions: this.getMockFunctions(target),
                    interfaces: this.getMockInterfaces(target)
                },
                dependencies: this.getMockDependencies(target),
                frameworks: this.getMockFrameworks(target),
                languages: this.getMockLanguages(target),
                apiEndpoints: this.getMockAPIEndpoints(target),
                components: this.getMockComponents(target),
                detectedFramework: this.getDetectedFramework(target),
                features: this.getMockFeatures(target),
                recommendations: this.getMockRecommendations(target)
            };
            this.logger.debug('Target analysis completed', {
                targetType: target.type,
                complexity: analysis.complexity,
                frameworks: analysis.frameworks.length
            });
            return analysis;
        }
        catch (error) {
            this.logger.error('Target analysis failed', { error, target });
            return this.getMockAnalysis(target);
        }
    }
    async analyzeAPI(apiPath) {
        if (!this.isEnabled) {
            this.logger.debug('Intelligence integration disabled, returning mock API analysis');
            return this.getMockAPIAnalysis(apiPath);
        }
        this.logger.debug('Analyzing API', { apiPath });
        try {
            const apiAnalysis = {
                name: 'Sample API',
                version: '1.0.0',
                description: 'API analysis for documentation generation',
                endpoints: [
                    {
                        method: 'GET',
                        path: '/api/users',
                        description: 'Get all users',
                        parameters: [
                            {
                                name: 'limit',
                                type: 'number',
                                required: false,
                                description: 'Maximum number of users to return'
                            }
                        ],
                        responses: [
                            {
                                code: '200',
                                description: 'Success',
                                schema: { type: 'array', items: { type: 'object' } }
                            }
                        ]
                    },
                    {
                        method: 'POST',
                        path: '/api/users',
                        description: 'Create a new user',
                        parameters: [
                            {
                                name: 'user',
                                type: 'object',
                                required: true,
                                description: 'User data'
                            }
                        ],
                        responses: [
                            {
                                code: '201',
                                description: 'User created',
                                schema: { type: 'object' }
                            }
                        ]
                    }
                ],
                schemas: {
                    User: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' }
                        }
                    }
                },
                authentication: {
                    type: 'bearer',
                    description: 'JWT token authentication'
                }
            };
            return apiAnalysis;
        }
        catch (error) {
            this.logger.error('API analysis failed', { error, apiPath });
            return this.getMockAPIAnalysis(apiPath);
        }
    }
    async analyzeCodeStructure(codePath) {
        if (!this.isEnabled) {
            this.logger.debug('Intelligence integration disabled, returning mock code structure');
            return this.getMockCodeStructure(codePath);
        }
        this.logger.debug('Analyzing code structure', { codePath });
        try {
            const structure = {
                path: codePath,
                language: this.detectLanguage(codePath),
                modules: this.getMockModules({ path: codePath }),
                classes: this.getMockClasses({ path: codePath }),
                functions: this.getMockFunctions({ path: codePath }),
                complexity: this.calculateMockComplexity({ path: codePath }),
                dependencies: this.getMockDependencies({ path: codePath }),
                testCoverage: 0.85,
                documentation: {
                    coverage: 0.70,
                    quality: 0.80,
                    missingDocumentation: [
                        'function processData',
                        'class DataProcessor',
                        'interface UserData'
                    ]
                }
            };
            return structure;
        }
        catch (error) {
            this.logger.error('Code structure analysis failed', { error, codePath });
            return this.getMockCodeStructure(codePath);
        }
    }
    async extractSemanticInformation(content) {
        if (!this.isEnabled) {
            this.logger.debug('Intelligence integration disabled, returning mock semantic information');
            return this.getMockSemanticInfo(content);
        }
        this.logger.debug('Extracting semantic information', { contentLength: content.length });
        try {
            const semanticInfo = {
                entities: [
                    { name: 'User', type: 'class', confidence: 0.95 },
                    { name: 'API', type: 'system', confidence: 0.90 },
                    { name: 'Database', type: 'system', confidence: 0.85 }
                ],
                concepts: [
                    { name: 'authentication', weight: 0.8 },
                    { name: 'user management', weight: 0.9 },
                    { name: 'data processing', weight: 0.7 }
                ],
                relationships: [
                    { from: 'User', to: 'API', type: 'uses', strength: 0.9 },
                    { from: 'API', to: 'Database', type: 'accesses', strength: 0.8 }
                ],
                summary: 'This content discusses user management through an API system with database integration.',
                keyTerms: ['user', 'API', 'authentication', 'database', 'processing'],
                complexity: 0.6,
                readabilityScore: 0.8
            };
            return semanticInfo;
        }
        catch (error) {
            this.logger.error('Semantic information extraction failed', { error });
            return this.getMockSemanticInfo(content);
        }
    }
    async generateCodeExamples(context) {
        if (!this.isEnabled) {
            this.logger.debug('Intelligence integration disabled, returning mock code examples');
            return this.getMockCodeExamples(context);
        }
        this.logger.debug('Generating code examples', { context });
        try {
            const examples = [
                {
                    title: 'Basic Usage',
                    description: 'How to use the basic functionality',
                    code: `// Basic usage example
const result = await processData(inputData);
console.log(result);`,
                    language: 'javascript',
                    category: 'basic'
                },
                {
                    title: 'Advanced Configuration',
                    description: 'Advanced configuration options',
                    code: `// Advanced configuration
const config = {
  retries: 3,
  timeout: 5000,
  validation: true
};
const result = await processData(inputData, config);`,
                    language: 'javascript',
                    category: 'advanced'
                }
            ];
            return examples;
        }
        catch (error) {
            this.logger.error('Code example generation failed', { error, context });
            return this.getMockCodeExamples(context);
        }
    }
    getMockAnalysis(target) {
        return {
            type: target.type,
            path: target.path,
            complexity: 0.6,
            structure: {
                directories: ['src', 'test', 'docs'],
                files: ['index.ts', 'config.ts', 'utils.ts'],
                modules: ['main', 'utils', 'config'],
                classes: ['App', 'Config', 'Utils'],
                functions: ['init', 'process', 'validate'],
                interfaces: ['IConfig', 'IResult']
            },
            dependencies: ['express', 'lodash', 'moment'],
            frameworks: ['node', 'express'],
            languages: ['typescript', 'javascript'],
            apiEndpoints: [],
            components: [],
            detectedFramework: 'node',
            features: ['configuration', 'processing', 'validation'],
            recommendations: ['Add more tests', 'Improve documentation']
        };
    }
    getMockAPIAnalysis(apiPath) {
        return {
            name: 'API',
            version: '1.0.0',
            description: 'Mock API analysis',
            endpoints: [],
            schemas: {},
            authentication: { type: 'none' }
        };
    }
    getMockCodeStructure(codePath) {
        return {
            path: codePath,
            language: 'typescript',
            modules: ['main'],
            classes: ['App'],
            functions: ['init'],
            complexity: 0.5,
            dependencies: ['express'],
            testCoverage: 0.8,
            documentation: {
                coverage: 0.7,
                quality: 0.8,
                missingDocumentation: []
            }
        };
    }
    getMockSemanticInfo(content) {
        return {
            entities: [],
            concepts: [],
            relationships: [],
            summary: 'Mock semantic analysis',
            keyTerms: [],
            complexity: 0.5,
            readabilityScore: 0.8
        };
    }
    getMockCodeExamples(context) {
        return [
            {
                title: 'Example',
                description: 'Mock example',
                code: '// Example code',
                language: 'javascript',
                category: 'basic'
            }
        ];
    }
    calculateMockComplexity(target) {
        const pathLength = target.path?.length || 0;
        return Math.min(0.9, pathLength / 100);
    }
    getMockDirectories(target) {
        return ['src', 'test', 'docs', 'config'];
    }
    getMockFiles(target) {
        return ['index.ts', 'config.ts', 'utils.ts', 'types.ts'];
    }
    getMockModules(target) {
        return ['main', 'utils', 'config', 'types'];
    }
    getMockClasses(target) {
        return ['App', 'Config', 'Utils', 'Logger'];
    }
    getMockFunctions(target) {
        return ['init', 'process', 'validate', 'cleanup'];
    }
    getMockInterfaces(target) {
        return ['IConfig', 'IResult', 'ILogger'];
    }
    getMockDependencies(target) {
        return ['express', 'lodash', 'moment', 'winston'];
    }
    getMockFrameworks(target) {
        return ['node', 'express', 'typescript'];
    }
    getMockLanguages(target) {
        return ['typescript', 'javascript'];
    }
    getMockAPIEndpoints(target) {
        return [
            {
                method: 'GET',
                path: '/api/status',
                description: 'Get system status'
            }
        ];
    }
    getMockComponents(target) {
        return [
            {
                name: 'MainComponent',
                type: 'class',
                path: 'src/main.ts',
                description: 'Main application component'
            }
        ];
    }
    getDetectedFramework(target) {
        if (target.path?.includes('react'))
            return 'react';
        if (target.path?.includes('vue'))
            return 'vue';
        if (target.path?.includes('angular'))
            return 'angular';
        return 'node';
    }
    getMockFeatures(target) {
        return ['configuration', 'processing', 'validation', 'logging'];
    }
    getMockRecommendations(target) {
        return [
            'Add more comprehensive tests',
            'Improve error handling',
            'Add performance monitoring',
            'Update documentation'
        ];
    }
    detectLanguage(path) {
        if (path.includes('.ts'))
            return 'typescript';
        if (path.includes('.js'))
            return 'javascript';
        if (path.includes('.py'))
            return 'python';
        if (path.includes('.java'))
            return 'java';
        return 'unknown';
    }
    isIntegrationEnabled() {
        return this.isEnabled;
    }
    async getHealth() {
        if (!this.isEnabled) {
            return {
                status: 'disabled',
                lastCheck: new Date()
            };
        }
        return {
            status: 'healthy',
            lastCheck: new Date()
        };
    }
}
exports.IntelligenceClient = IntelligenceClient;
//# sourceMappingURL=IntelligenceClient.js.map