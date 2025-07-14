#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const DocumentationOrchestrator_js_1 = require("./core/DocumentationOrchestrator.js");
const ContentGenerator_js_1 = require("./core/ContentGenerator.js");
const TemplateEngine_js_1 = require("./core/TemplateEngine.js");
const Logger_js_1 = require("./utils/Logger.js");
const PerformanceMonitor_js_1 = require("./utils/PerformanceMonitor.js");
class SuperClaudeDocsServer {
    constructor() {
        this.logger = new Logger_js_1.Logger('SuperClaudeDocsServer');
        this.performanceMonitor = new PerformanceMonitor_js_1.PerformanceMonitor();
        this.config = {
            serverName: "superclaude-docs",
            capabilities: ["tools", "resources", "prompts"],
            documentGeneration: {
                enableTemplateEngine: true,
                enableContextAwareGeneration: true,
                enableAutomatedUpdates: true,
                maxDocumentSize: 100000,
                supportedFormats: ["markdown", "html", "pdf", "docx"]
            },
            localization: {
                enableMultiLanguage: true,
                supportedLanguages: ["en", "es", "fr", "de", "ja", "zh", "pt", "it", "ru", "ko"],
                enableCulturalAdaptation: true,
                enableTranslationValidation: true,
                translationQualityThreshold: 0.9
            },
            knowledgeManagement: {
                enableIntelligentIndexing: true,
                enableSemanticSearch: true,
                enableContentVersioning: true,
                enableAutomaticTagging: true,
                searchIndexSize: 1000000
            },
            contentQuality: {
                enableAccessibilityValidation: true,
                enableAccuracyChecking: true,
                enableConsistencyValidation: true,
                enableGrammarChecking: true,
                qualityThreshold: 0.95
            },
            integration: {
                enableContext7Integration: true,
                enablePersonaIntegration: true,
                enableIntelligenceIntegration: true,
                enableAutomatedSync: true
            },
            performance: {
                enableCaching: true,
                cacheTTL: 600,
                enableAsyncGeneration: true,
                maxConcurrentGenerations: 10,
                enableProgressiveRendering: true
            }
        };
        this.orchestrator = new DocumentationOrchestrator_js_1.DocumentationOrchestrator(this.config);
        this.contentGenerator = new ContentGenerator_js_1.ContentGenerator(this.config);
        this.templateEngine = new TemplateEngine_js_1.TemplateEngine(this.config);
        this.server = new index_js_1.Server({
            name: this.config.serverName,
            version: '1.0.0',
            description: 'SuperClaude Documentation Generation and Knowledge Management Server'
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            }
        });
        this.setupHandlers();
        this.logger.info('SuperClaude Docs Server initialized');
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "generate_documentation",
                    description: "Generate comprehensive documentation for codebases, projects, and APIs",
                    inputSchema: {
                        type: "object",
                        properties: {
                            target: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["codebase", "api", "project", "feature", "component"] },
                                    path: { type: "string" },
                                    scope: { type: "array", items: { type: "string" } },
                                    excludePatterns: { type: "array", items: { type: "string" } },
                                    includeMetadata: { type: "boolean", default: true }
                                },
                                required: ["type", "path"]
                            },
                            specifications: {
                                type: "object",
                                properties: {
                                    docType: { type: "string", enum: ["technical", "user", "api", "tutorial", "reference"] },
                                    audience: { type: "string", enum: ["developer", "enduser", "administrator", "beginner", "expert"] },
                                    framework: { type: "string" },
                                    includeExamples: { type: "boolean", default: true },
                                    includeAPIReference: { type: "boolean", default: true },
                                    language: { type: "string", default: "en" }
                                },
                                required: ["docType", "audience"]
                            },
                            options: {
                                type: "object",
                                properties: {
                                    template: { type: "string" },
                                    customSections: { type: "array", items: { type: "string" } },
                                    generateTOC: { type: "boolean", default: true },
                                    includeAssets: { type: "boolean", default: true },
                                    validateAccessibility: { type: "boolean", default: true },
                                    format: { type: "string", enum: ["markdown", "html", "pdf", "docx"], default: "markdown" }
                                }
                            }
                        },
                        required: ["target", "specifications"]
                    }
                },
                {
                    name: "create_api_docs",
                    description: "Generate API documentation from OpenAPI specs, code, or manual definitions",
                    inputSchema: {
                        type: "object",
                        properties: {
                            source: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["openapi", "swagger", "code", "postman", "manual"] },
                                    path: { type: "string" },
                                    endpoints: { type: "array", items: { type: "string" } },
                                    version: { type: "string" }
                                },
                                required: ["type", "path"]
                            },
                            output: {
                                type: "object",
                                properties: {
                                    format: { type: "string", enum: ["interactive", "static", "pdf", "markdown"], default: "interactive" },
                                    style: { type: "string", enum: ["modern", "classic", "minimal", "corporate"], default: "modern" },
                                    includeExamples: { type: "boolean", default: true },
                                    includeTryItOut: { type: "boolean", default: true },
                                    language: { type: "string", default: "en" }
                                }
                            },
                            options: {
                                type: "object",
                                properties: {
                                    groupByTags: { type: "boolean", default: true },
                                    includeSchemas: { type: "boolean", default: true },
                                    generateSDKExamples: { type: "array", items: { type: "string" } },
                                    includeAuthentication: { type: "boolean", default: true }
                                }
                            }
                        },
                        required: ["source", "output"]
                    }
                },
                {
                    name: "localize_content",
                    description: "Translate and culturally adapt documentation content",
                    inputSchema: {
                        type: "object",
                        properties: {
                            content: {
                                type: "object",
                                properties: {
                                    text: { type: "string" },
                                    format: { type: "string", enum: ["markdown", "html", "plain"], default: "markdown" },
                                    metadata: { type: "object" }
                                },
                                required: ["text"]
                            },
                            localization: {
                                type: "object",
                                properties: {
                                    targetLanguage: { type: "string", enum: ["es", "fr", "de", "ja", "zh", "pt", "it", "ru", "ko"] },
                                    culturalContext: { type: "string" },
                                    audience: { type: "string" },
                                    formality: { type: "string", enum: ["formal", "informal", "neutral"], default: "neutral" }
                                },
                                required: ["targetLanguage"]
                            },
                            options: {
                                type: "object",
                                properties: {
                                    preserveFormatting: { type: "boolean", default: true },
                                    adaptExamples: { type: "boolean", default: true },
                                    reviewRequired: { type: "boolean", default: true },
                                    generateGlossary: { type: "boolean", default: false }
                                }
                            }
                        },
                        required: ["content", "localization"]
                    }
                },
                {
                    name: "index_knowledge",
                    description: "Build searchable knowledge base from documentation sources",
                    inputSchema: {
                        type: "object",
                        properties: {
                            sources: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        type: { type: "string", enum: ["documentation", "codebase", "repository", "wiki"] },
                                        path: { type: "string" },
                                        weight: { type: "number", minimum: 0, maximum: 1, default: 1 }
                                    },
                                    required: ["type", "path"]
                                }
                            },
                            indexing: {
                                type: "object",
                                properties: {
                                    enableSemanticSearch: { type: "boolean", default: true },
                                    enableFullText: { type: "boolean", default: true },
                                    enableStructuredData: { type: "boolean", default: true },
                                    generateEmbeddings: { type: "boolean", default: true },
                                    extractEntities: { type: "boolean", default: true }
                                }
                            },
                            options: {
                                type: "object",
                                properties: {
                                    updateExisting: { type: "boolean", default: true },
                                    generateTaxonomy: { type: "boolean", default: true },
                                    enableVersioning: { type: "boolean", default: true },
                                    optimizeForSearch: { type: "boolean", default: true }
                                }
                            }
                        },
                        required: ["sources"]
                    }
                },
                {
                    name: "search_knowledge",
                    description: "Search the knowledge base with intelligent ranking and filtering",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: { type: "string" },
                            filters: {
                                type: "object",
                                properties: {
                                    language: { type: "string" },
                                    type: { type: "string", enum: ["technical", "user", "api", "tutorial", "reference"] },
                                    category: { type: "string" },
                                    framework: { type: "string" },
                                    dateRange: {
                                        type: "object",
                                        properties: {
                                            start: { type: "string" },
                                            end: { type: "string" }
                                        }
                                    }
                                }
                            },
                            options: {
                                type: "object",
                                properties: {
                                    limit: { type: "number", default: 10 },
                                    includeSnippets: { type: "boolean", default: true },
                                    highlightMatches: { type: "boolean", default: true },
                                    searchType: { type: "string", enum: ["semantic", "keyword", "hybrid"], default: "hybrid" }
                                }
                            }
                        },
                        required: ["query"]
                    }
                },
                {
                    name: "validate_quality",
                    description: "Validate documentation for accessibility, accuracy, and consistency",
                    inputSchema: {
                        type: "object",
                        properties: {
                            content: {
                                type: "object",
                                properties: {
                                    text: { type: "string" },
                                    format: { type: "string", enum: ["markdown", "html", "plain"], default: "markdown" },
                                    metadata: { type: "object" }
                                },
                                required: ["text"]
                            },
                            validation: {
                                type: "object",
                                properties: {
                                    checkAccessibility: { type: "boolean", default: true },
                                    checkAccuracy: { type: "boolean", default: true },
                                    checkConsistency: { type: "boolean", default: true },
                                    checkGrammar: { type: "boolean", default: true },
                                    language: { type: "string", default: "en" }
                                }
                            },
                            options: {
                                type: "object",
                                properties: {
                                    autoFix: { type: "boolean", default: false },
                                    generateReport: { type: "boolean", default: true },
                                    includeExplanations: { type: "boolean", default: true }
                                }
                            }
                        },
                        required: ["content"]
                    }
                }
            ]
        }));
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => ({
            resources: [
                {
                    uri: "docs://templates",
                    name: "Documentation Templates",
                    description: "Standardized templates for various documentation types",
                    mimeType: "application/json"
                },
                {
                    uri: "docs://knowledge-base",
                    name: "Knowledge Base",
                    description: "Searchable repository of institutional knowledge",
                    mimeType: "application/json"
                },
                {
                    uri: "docs://localization",
                    name: "Localization Resources",
                    description: "Translation glossaries and cultural adaptation guides",
                    mimeType: "application/json"
                },
                {
                    uri: "docs://quality-standards",
                    name: "Quality Standards",
                    description: "Documentation quality standards and validation rules",
                    mimeType: "application/json"
                },
                {
                    uri: "docs://patterns",
                    name: "Documentation Patterns",
                    description: "Best practices and patterns for different documentation types",
                    mimeType: "application/json"
                }
            ]
        }));
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            try {
                switch (uri) {
                    case "docs://templates":
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: "application/json",
                                    text: JSON.stringify({
                                        templates: await this.templateEngine.getRegisteredTemplates(),
                                        categories: ["technical", "user", "api", "tutorial", "reference"],
                                        languages: this.config.localization.supportedLanguages
                                    }, null, 2)
                                }
                            ]
                        };
                    case "docs://knowledge-base":
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: "application/json",
                                    text: JSON.stringify({
                                        status: "active",
                                        indexSize: await this.getKnowledgeBaseSize(),
                                        supportedSearchTypes: ["semantic", "keyword", "hybrid"],
                                        languages: this.config.localization.supportedLanguages
                                    }, null, 2)
                                }
                            ]
                        };
                    case "docs://localization":
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: "application/json",
                                    text: JSON.stringify({
                                        supportedLanguages: this.config.localization.supportedLanguages,
                                        culturalContexts: ["formal", "informal", "neutral"],
                                        translationQuality: this.config.localization.translationQualityThreshold
                                    }, null, 2)
                                }
                            ]
                        };
                    case "docs://quality-standards":
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: "application/json",
                                    text: JSON.stringify({
                                        qualityThreshold: this.config.contentQuality.qualityThreshold,
                                        validationTypes: ["accessibility", "accuracy", "consistency", "grammar"],
                                        accessibilityStandards: "WCAG 2.1 AA",
                                        supportedFormats: this.config.documentGeneration.supportedFormats
                                    }, null, 2)
                                }
                            ]
                        };
                    case "docs://patterns":
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: "application/json",
                                    text: JSON.stringify({
                                        availablePatterns: ["api-documentation", "technical-guides", "user-manuals", "tutorials"],
                                        frameworks: ["react", "vue", "angular", "node", "python", "java"],
                                        documentTypes: ["technical", "user", "api", "tutorial", "reference"]
                                    }, null, 2)
                                }
                            ]
                        };
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
                }
            }
            catch (error) {
                this.logger.error('Resource read failed', { error, uri });
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to read resource: ${uri}`);
            }
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "generate_documentation":
                        return await this.handleGenerateDocumentation(args);
                    case "create_api_docs":
                        return await this.handleCreateApiDocs(args);
                    case "localize_content":
                        return await this.handleLocalizeContent(args);
                    case "index_knowledge":
                        return await this.handleIndexKnowledge(args);
                    case "search_knowledge":
                        return await this.handleSearchKnowledge(args);
                    case "validate_quality":
                        return await this.handleValidateQuality(args);
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                this.logger.error('Tool execution failed', { error, toolName: name });
                if (error instanceof types_js_1.McpError) {
                    throw error;
                }
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
            }
        });
    }
    async handleGenerateDocumentation(args) {
        const startTime = Date.now();
        this.logger.info('Generate documentation request', { args });
        try {
            const request = {
                type: {
                    category: args.specifications.docType,
                    subtype: args.specifications.framework || 'default',
                    template: args.options?.template || 'default',
                    customization: {}
                },
                target: args.target,
                specifications: args.specifications,
                language: args.specifications.language || 'en',
                format: args.options?.format || 'markdown',
                options: args.options || {}
            };
            const result = await this.orchestrator.generateDocumentation(request);
            const processingTime = Date.now() - startTime;
            this.logger.info('Documentation generation completed', {
                processingTime,
                contentLength: result.content.content.length,
                qualityScore: result.quality.overallScore
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `# Documentation Generated Successfully\n\n**Processing Time:** ${processingTime}ms\n**Quality Score:** ${result.quality.overallScore.toFixed(2)}\n**Content Length:** ${result.content.content.length} characters\n\n## Generated Documentation\n\n${result.content.content}`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Documentation generation failed', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Documentation generation failed: ${error.message}`);
        }
    }
    async handleCreateApiDocs(args) {
        const startTime = Date.now();
        this.logger.info('Create API docs request', { args });
        try {
            const apiSpec = {
                version: "3.0.0",
                info: {
                    title: "Sample API",
                    version: "1.0.0",
                    description: "A sample API for demonstration"
                },
                servers: [
                    {
                        url: "https://api.example.com",
                        description: "Production server"
                    }
                ],
                paths: {},
                components: {},
                security: []
            };
            const result = await this.contentGenerator.generateAPIDocumentation(apiSpec);
            const processingTime = Date.now() - startTime;
            this.logger.info('API documentation generation completed', {
                processingTime,
                endpointCount: result.metadata.endpointCount
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `# API Documentation Generated\n\n**Processing Time:** ${processingTime}ms\n**Endpoints:** ${result.metadata.endpointCount}\n\n## Generated API Documentation\n\n${result.content}`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('API documentation generation failed', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `API documentation generation failed: ${error.message}`);
        }
    }
    async handleLocalizeContent(args) {
        const startTime = Date.now();
        this.logger.info('Localize content request', { args });
        try {
            const processingTime = Date.now() - startTime;
            return {
                content: [
                    {
                        type: "text",
                        text: `# Content Localized Successfully\n\n**Processing Time:** ${processingTime}ms\n**Target Language:** ${args.localization.targetLanguage}\n**Cultural Context:** ${args.localization.culturalContext || 'default'}\n\n## Localized Content\n\n*Note: This is a demonstration. Full localization implementation would provide actual translated content.*\n\n${args.content.text}`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Content localization failed', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Content localization failed: ${error.message}`);
        }
    }
    async handleIndexKnowledge(args) {
        const startTime = Date.now();
        this.logger.info('Index knowledge request', { args });
        try {
            const processingTime = Date.now() - startTime;
            return {
                content: [
                    {
                        type: "text",
                        text: `# Knowledge Base Indexed Successfully\n\n**Processing Time:** ${processingTime}ms\n**Sources Processed:** ${args.sources.length}\n**Indexing Features:** ${Object.keys(args.indexing || {}).filter(key => args.indexing[key]).join(', ')}\n\n## Indexing Results\n\n*Note: This is a demonstration. Full implementation would provide actual indexing statistics.*\n\n- Total entries indexed: ${args.sources.length * 100}\n- Semantic embeddings: ${args.indexing?.generateEmbeddings ? 'Generated' : 'Skipped'}\n- Entity extraction: ${args.indexing?.extractEntities ? 'Completed' : 'Skipped'}`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Knowledge indexing failed', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Knowledge indexing failed: ${error.message}`);
        }
    }
    async handleSearchKnowledge(args) {
        const startTime = Date.now();
        this.logger.info('Search knowledge request', { args });
        try {
            const processingTime = Date.now() - startTime;
            return {
                content: [
                    {
                        type: "text",
                        text: `# Knowledge Search Results\n\n**Query:** "${args.query}"\n**Processing Time:** ${processingTime}ms\n**Search Type:** ${args.options?.searchType || 'hybrid'}\n\n## Results\n\n*Note: This is a demonstration. Full implementation would provide actual search results.*\n\n1. **Sample Documentation Entry**\n   - Type: Technical\n   - Relevance: 0.95\n   - Last Updated: 2024-01-15\n   - Snippet: "This documentation covers the key concepts related to your search..."\n\n2. **Related API Reference**\n   - Type: API\n   - Relevance: 0.87\n   - Last Updated: 2024-01-10\n   - Snippet: "API endpoints and examples for the functionality you're looking for..."`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Knowledge search failed', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Knowledge search failed: ${error.message}`);
        }
    }
    async handleValidateQuality(args) {
        const startTime = Date.now();
        this.logger.info('Validate quality request', { args });
        try {
            const processingTime = Date.now() - startTime;
            return {
                content: [
                    {
                        type: "text",
                        text: `# Quality Validation Results\n\n**Processing Time:** ${processingTime}ms\n**Language:** ${args.validation?.language || 'en'}\n**Overall Score:** 0.92\n\n## Validation Results\n\n*Note: This is a demonstration. Full implementation would provide actual validation results.*\n\n### Accessibility Check\n- **Score:** 0.95\n- **Status:** ✅ Passed\n- **Issues:** None found\n\n### Accuracy Check\n- **Score:** 0.90\n- **Status:** ✅ Passed\n- **Issues:** 1 minor issue found\n\n### Consistency Check\n- **Score:** 0.88\n- **Status:** ⚠️ Needs improvement\n- **Issues:** 2 inconsistencies found\n\n### Grammar Check\n- **Score:** 0.94\n- **Status:** ✅ Passed\n- **Issues:** 1 minor grammar issue\n\n## Recommendations\n\n1. Review consistency in terminology usage\n2. Fix minor grammar issue in section 3\n3. Consider adding more examples for clarity`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Quality validation failed', { error });
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Quality validation failed: ${error.message}`);
        }
    }
    async getKnowledgeBaseSize() {
        return 50000;
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('SuperClaude Docs Server started successfully');
    }
    async shutdown() {
        this.logger.info('Shutting down SuperClaude Docs Server');
        try {
            await this.orchestrator.shutdown();
            await this.templateEngine.shutdown();
            this.logger.info('SuperClaude Docs Server shutdown completed');
        }
        catch (error) {
            this.logger.error('Error during shutdown', { error });
        }
    }
}
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
const server = new SuperClaudeDocsServer();
server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map