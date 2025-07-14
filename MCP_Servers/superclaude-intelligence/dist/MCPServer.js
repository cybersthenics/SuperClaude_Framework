import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { LSPManager } from './core/LSPManager.js';
import { SemanticAnalyzer } from './core/SemanticAnalyzer.js';
import { SymbolIndexer } from './core/SymbolIndexer.js';
import { KnowledgeGraphBuilder } from './core/KnowledgeGraphBuilder.js';
import { ProjectMemoryManager } from './core/ProjectMemoryManager.js';
import { ReasoningEngine } from './core/ReasoningEngine.js';
import { logger } from './services/Logger.js';
import { PerformanceMonitor, CacheManager } from './services/SharedStubs.js';
export class IntelligenceServer {
    server;
    lspManager;
    semanticAnalyzer;
    symbolIndexer;
    knowledgeGraphBuilder;
    projectMemoryManager;
    reasoningEngine;
    performanceMonitor;
    cacheManager;
    config;
    constructor() {
        this.server = new Server({
            name: 'superclaude-intelligence',
            version: '3.0.0',
            description: 'SuperClaude Intelligence Server - Semantic Code Understanding Engine with LSP Integration'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        this.initializeConfiguration();
        this.initializeComponents();
        this.setupHandlers();
    }
    initializeConfiguration() {
        this.config = {
            serverName: 'superclaude-intelligence',
            capabilities: ['tools', 'resources', 'prompts'],
            lsp: {
                enableMultiLanguageSupport: true,
                supportedLanguages: ['python', 'typescript', 'javascript', 'go', 'rust', 'php', 'java', 'cpp'],
                maxConcurrentServers: 5,
                serverStartupTimeout: 10000,
                enableIncrementalSync: true
            },
            semantic: {
                enableSymbolIndexing: true,
                enableTypeInference: true,
                enableCrossFileAnalysis: true,
                symbolCacheSize: 100000,
                indexUpdateBatchSize: 100
            },
            performance: {
                maxAnalysisTime: 300,
                enableResultCaching: true,
                cacheTTL: 600,
                enableBatchOperations: true,
                maxMemoryUsage: 512
            },
            projectMemory: {
                enablePersistence: true,
                persistenceInterval: 30000,
                maxContextSize: 50000,
                enableIncrementalUpdates: true
            }
        };
    }
    initializeComponents() {
        this.performanceMonitor = new PerformanceMonitor();
        this.cacheManager = new CacheManager({
            maxSize: 10000,
            ttl: this.config.performance.cacheTTL * 1000
        });
        this.lspManager = new LSPManager(this.config.lsp);
        this.symbolIndexer = new SymbolIndexer(this.lspManager, this.config.semantic);
        this.semanticAnalyzer = new SemanticAnalyzer(this.lspManager, this.symbolIndexer);
        this.knowledgeGraphBuilder = new KnowledgeGraphBuilder(this.semanticAnalyzer, this.symbolIndexer);
        this.projectMemoryManager = new ProjectMemoryManager(this.config.projectMemory);
        this.reasoningEngine = new ReasoningEngine(this.semanticAnalyzer, this.knowledgeGraphBuilder);
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'find_symbol_definition',
                        description: 'Navigate to symbol definitions across files with LSP precision',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                position: {
                                    type: 'object',
                                    properties: {
                                        line: { type: 'number' },
                                        character: { type: 'number' }
                                    },
                                    required: ['line', 'character']
                                },
                                includeDeclaration: { type: 'boolean', default: true },
                                includeTypeDefinition: { type: 'boolean', default: false }
                            },
                            required: ['uri', 'position']
                        }
                    },
                    {
                        name: 'find_all_references',
                        description: 'Locate all usages of a symbol project-wide with semantic context',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                position: {
                                    type: 'object',
                                    properties: {
                                        line: { type: 'number' },
                                        character: { type: 'number' }
                                    },
                                    required: ['line', 'character']
                                },
                                includeDeclaration: { type: 'boolean', default: true },
                                includeWriteAccess: { type: 'boolean', default: true },
                                maxResults: { type: 'number', default: 1000 }
                            },
                            required: ['uri', 'position']
                        }
                    },
                    {
                        name: 'get_symbol_type_info',
                        description: 'Retrieve comprehensive type information and signatures',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                position: {
                                    type: 'object',
                                    properties: {
                                        line: { type: 'number' },
                                        character: { type: 'number' }
                                    },
                                    required: ['line', 'character']
                                },
                                includeHierarchy: { type: 'boolean', default: true },
                                includeMembers: { type: 'boolean', default: true },
                                includeDocumentation: { type: 'boolean', default: true }
                            },
                            required: ['uri', 'position']
                        }
                    },
                    {
                        name: 'get_hover_info',
                        description: 'Get documentation and type info for symbols at cursor',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                position: {
                                    type: 'object',
                                    properties: {
                                        line: { type: 'number' },
                                        character: { type: 'number' }
                                    },
                                    required: ['line', 'character']
                                },
                                includeExamples: { type: 'boolean', default: false },
                                includeRelated: { type: 'boolean', default: false }
                            },
                            required: ['uri', 'position']
                        }
                    },
                    {
                        name: 'get_code_completions',
                        description: 'Context-aware code completion suggestions via LSP',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                position: {
                                    type: 'object',
                                    properties: {
                                        line: { type: 'number' },
                                        character: { type: 'number' }
                                    },
                                    required: ['line', 'character']
                                },
                                maxResults: { type: 'number', default: 50 },
                                includeSnippets: { type: 'boolean', default: true },
                                includeDocumentation: { type: 'boolean', default: true }
                            },
                            required: ['uri', 'position']
                        }
                    },
                    {
                        name: 'analyze_code_structure',
                        description: 'Deep AST + semantic analysis via LSP with pattern detection',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                includeSemantics: { type: 'boolean', default: true },
                                includeDependencies: { type: 'boolean', default: true },
                                includePatterns: { type: 'boolean', default: true },
                                maxDepth: { type: 'number', default: 10 }
                            },
                            required: ['uri']
                        }
                    },
                    {
                        name: 'build_knowledge_graph',
                        description: 'Semantic-aware knowledge graph with type relationships',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectRoot: { type: 'string' },
                                includeTypes: { type: 'boolean', default: true },
                                includeInheritance: { type: 'boolean', default: true },
                                includeUsage: { type: 'boolean', default: true },
                                maxNodes: { type: 'number', default: 1000 },
                                maxDepth: { type: 'number', default: 5 }
                            },
                            required: ['projectRoot']
                        }
                    },
                    {
                        name: 'analyze_execution_paths',
                        description: 'Analyze code execution paths and control flow',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                uri: { type: 'string', format: 'uri' },
                                startFunction: { type: 'string' },
                                maxDepth: { type: 'number', default: 5 },
                                includeConditions: { type: 'boolean', default: true }
                            },
                            required: ['uri']
                        }
                    },
                    {
                        name: 'search_symbols',
                        description: 'Fast symbol search across project with fuzzy matching',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string' },
                                symbolKind: { type: 'string' },
                                fuzzy: { type: 'boolean', default: true },
                                maxResults: { type: 'number', default: 100 },
                                includeReferences: { type: 'boolean', default: false }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'index_project',
                        description: 'Build comprehensive symbol index for project',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectRoot: { type: 'string' },
                                languages: { type: 'array', items: { type: 'string' } },
                                includeTests: { type: 'boolean', default: false },
                                incremental: { type: 'boolean', default: true }
                            },
                            required: ['projectRoot']
                        }
                    },
                    {
                        name: 'save_project_context',
                        description: 'Persist semantic analysis state for future sessions',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                context: { type: 'object' },
                                options: {
                                    type: 'object',
                                    properties: {
                                        compressionLevel: { type: 'number', enum: [1, 2, 3], default: 2 },
                                        includeSymbolIndex: { type: 'boolean', default: true },
                                        includeTypeCache: { type: 'boolean', default: true },
                                        includeDependencyGraph: { type: 'boolean', default: true }
                                    }
                                }
                            },
                            required: ['projectId', 'context']
                        }
                    },
                    {
                        name: 'load_project_context',
                        description: 'Restore previous semantic analysis state',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                projectId: { type: 'string' },
                                options: {
                                    type: 'object',
                                    properties: {
                                        validateIntegrity: { type: 'boolean', default: true },
                                        updateIndexes: { type: 'boolean', default: true },
                                        maxAge: { type: 'number', default: 604800000 }
                                    }
                                }
                            },
                            required: ['projectId']
                        }
                    },
                    {
                        name: 'execute_reasoning_chain',
                        description: 'Complex multi-step reasoning with Sequential integration',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                problem: { type: 'object' },
                                context: { type: 'object' },
                                constraints: { type: 'array', items: { type: 'object' } },
                                goals: { type: 'array', items: { type: 'object' } }
                            },
                            required: ['problem', 'context']
                        }
                    },
                    {
                        name: 'generate_insights',
                        description: 'Generate actionable insights from semantic analysis',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                analysisResults: { type: 'array', items: { type: 'object' } },
                                focusAreas: { type: 'array', items: { type: 'string' } },
                                priorityLevel: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' }
                            },
                            required: ['analysisResults']
                        }
                    },
                    {
                        name: 'get_performance_metrics',
                        description: 'Retrieve LSP and analysis performance metrics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                includeLanguageServers: { type: 'boolean', default: true },
                                includeAnalysisMetrics: { type: 'boolean', default: true },
                                includeMemoryUsage: { type: 'boolean', default: true },
                                timeRange: { type: 'string', enum: ['1h', '24h', '7d'], default: '1h' }
                            }
                        }
                    },
                    {
                        name: 'optimize_performance',
                        description: 'Optimize caches and indexes for better performance',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                clearCaches: { type: 'boolean', default: false },
                                rebuildIndexes: { type: 'boolean', default: false },
                                compactMemory: { type: 'boolean', default: true }
                            }
                        }
                    }
                ]
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const startTime = Date.now();
            this.performanceMonitor.startOperation(name);
            try {
                let result;
                switch (name) {
                    case 'find_symbol_definition':
                        result = await this.handleFindSymbolDefinition(args);
                        break;
                    case 'find_all_references':
                        result = await this.handleFindAllReferences(args);
                        break;
                    case 'get_symbol_type_info':
                        result = await this.handleGetSymbolTypeInfo(args);
                        break;
                    case 'get_hover_info':
                        result = await this.handleGetHoverInfo(args);
                        break;
                    case 'get_code_completions':
                        result = await this.handleGetCodeCompletions(args);
                        break;
                    case 'analyze_code_structure':
                        result = await this.handleAnalyzeCodeStructure(args);
                        break;
                    case 'build_knowledge_graph':
                        result = await this.handleBuildKnowledgeGraph(args);
                        break;
                    case 'save_project_context':
                        result = await this.handleSaveProjectContext(args);
                        break;
                    case 'load_project_context':
                        result = await this.handleLoadProjectContext(args);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                this.performanceMonitor.endOperation(name, Date.now() - startTime);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                this.performanceMonitor.recordError(name, error);
                logger.error(`Tool execution failed: ${name}`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ],
                    isError: true
                };
            }
        });
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: 'intelligence://project-analysis-state',
                        name: 'Project Analysis State',
                        description: 'Current semantic analysis state for the project',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'intelligence://symbol-index',
                        name: 'Symbol Index',
                        description: 'Project-wide symbol index with semantic information',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'intelligence://knowledge-graph',
                        name: 'Knowledge Graph',
                        description: 'Semantic relationships and type hierarchies',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'intelligence://performance-metrics',
                        name: 'Performance Metrics',
                        description: 'LSP and analysis performance metrics',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            try {
                let content;
                switch (uri) {
                    case 'intelligence://project-analysis-state':
                        content = await this.getProjectAnalysisState();
                        break;
                    case 'intelligence://symbol-index':
                        content = await this.getSymbolIndex();
                        break;
                    case 'intelligence://knowledge-graph':
                        content = await this.getKnowledgeGraph();
                        break;
                    case 'intelligence://performance-metrics':
                        content = await this.getPerformanceMetrics();
                        break;
                    default:
                        throw new Error(`Unknown resource: ${uri}`);
                }
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(content, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                logger.error(`Resource read failed: ${uri}`, error);
                throw error;
            }
        });
    }
    async handleFindSymbolDefinition(args) {
        const { uri, position, includeDeclaration = true, includeTypeDefinition = false } = args;
        const language = this.getLanguageForUri(uri);
        await this.lspManager.synchronizeDocument(uri, await this.readFileContent(uri), language);
        const definitions = await this.lspManager.sendRequest(language, 'textDocument/definition', {
            textDocument: { uri },
            position
        });
        const typeDefinitions = includeTypeDefinition
            ? await this.lspManager.sendRequest(language, 'textDocument/typeDefinition', { textDocument: { uri }, position })
            : [];
        const enhancedDefinitions = await Promise.all(definitions.map(async (def) => {
            const symbolInfo = await this.semanticAnalyzer.resolveSymbol(def.uri, def.range.start);
            return {
                location: def,
                symbolInfo,
                typeInformation: symbolInfo?.typeInformation,
                documentation: symbolInfo?.documentation
            };
        }));
        return {
            definitions: enhancedDefinitions,
            typeDefinitions,
            metadata: {
                language,
                processingTime: Date.now(),
                symbolCount: enhancedDefinitions.length
            }
        };
    }
    async handleFindAllReferences(args) {
        const { uri, position, includeDeclaration = true, maxResults = 1000 } = args;
        const language = this.getLanguageForUri(uri);
        await this.lspManager.synchronizeDocument(uri, await this.readFileContent(uri), language);
        const references = await this.lspManager.sendRequest(language, 'textDocument/references', {
            textDocument: { uri },
            position,
            context: { includeDeclaration }
        });
        const limitedReferences = references.slice(0, maxResults);
        const groupedReferences = this.groupReferencesByFile(limitedReferences);
        const symbolInfo = await this.semanticAnalyzer.resolveSymbol(uri, position);
        const referenceAnalysis = await this.semanticAnalyzer.analyzeReferencePatterns(limitedReferences, symbolInfo);
        return {
            symbol: symbolInfo,
            references: limitedReferences,
            groupedByFile: groupedReferences,
            analysis: referenceAnalysis,
            metadata: {
                totalFound: references.length,
                returned: limitedReferences.length,
                truncated: references.length > maxResults
            }
        };
    }
    async handleGetSymbolTypeInfo(args) {
        const { uri, position, includeHierarchy = true, includeMembers = true, includeDocumentation = true } = args;
        const language = this.getLanguageForUri(uri);
        await this.lspManager.synchronizeDocument(uri, await this.readFileContent(uri), language);
        const symbolInfo = await this.semanticAnalyzer.resolveSymbol(uri, position);
        const typeDefinition = await this.lspManager.sendRequest(language, 'textDocument/typeDefinition', { textDocument: { uri }, position });
        return {
            symbol: symbolInfo,
            typeDefinition: typeDefinition[0],
            metadata: {
                language,
                processingTime: Date.now()
            }
        };
    }
    async handleGetHoverInfo(args) {
        const { uri, position, includeExamples = false, includeRelated = false } = args;
        const language = this.getLanguageForUri(uri);
        await this.lspManager.synchronizeDocument(uri, await this.readFileContent(uri), language);
        const hoverInfo = await this.lspManager.sendRequest(language, 'textDocument/hover', { textDocument: { uri }, position });
        if (!hoverInfo) {
            return { symbol: null, hover: null, metadata: { found: false } };
        }
        const symbolInfo = await this.semanticAnalyzer.resolveSymbol(uri, position);
        return {
            symbol: symbolInfo,
            hover: hoverInfo,
            metadata: {
                language,
                hasDocumentation: !!symbolInfo?.documentation,
                processingTime: Date.now()
            }
        };
    }
    async handleGetCodeCompletions(args) {
        const { uri, position, maxResults = 50, includeSnippets = true, includeDocumentation = true } = args;
        const language = this.getLanguageForUri(uri);
        await this.lspManager.synchronizeDocument(uri, await this.readFileContent(uri), language);
        const completions = await this.lspManager.sendRequest(language, 'textDocument/completion', { textDocument: { uri }, position });
        if (!completions) {
            return { completions: [], metadata: { found: false } };
        }
        const limitedCompletions = completions.items.slice(0, maxResults);
        return {
            completions: limitedCompletions,
            metadata: {
                language,
                totalAvailable: completions.items.length,
                returned: limitedCompletions.length,
                hasMore: completions.items.length > maxResults
            }
        };
    }
    async handleAnalyzeCodeStructure(args) {
        const { uri, includeSemantics = true, includeDependencies = true, includePatterns = true, maxDepth = 10 } = args;
        const context = {
            projectRoot: this.getProjectRoot(uri),
            languageId: this.getLanguageForUri(uri),
            fileUri: uri,
            includeReferences: true,
            includeImplementations: true,
            maxDepth
        };
        return await this.semanticAnalyzer.analyzeCode(context);
    }
    async handleBuildKnowledgeGraph(args) {
        const { projectRoot, includeTypes = true, includeInheritance = true, includeUsage = true, maxNodes = 1000, maxDepth = 5 } = args;
        const context = {
            projectRoot,
            languageId: 'multi',
            fileUri: projectRoot,
            includeReferences: includeUsage,
            includeImplementations: includeInheritance,
            maxDepth
        };
        return await this.knowledgeGraphBuilder.buildKnowledgeGraph(context);
    }
    async handleSaveProjectContext(args) {
        const { projectId, context, options = {} } = args;
        return await this.projectMemoryManager.saveProjectContext(projectId, context, options);
    }
    async handleLoadProjectContext(args) {
        const { projectId, options = {} } = args;
        return await this.projectMemoryManager.loadProjectContext(projectId, options);
    }
    async getProjectAnalysisState() {
        return {
            serverStatus: 'running',
            languageServers: this.lspManager.getAllServerStatuses(),
            symbolIndexSize: this.symbolIndexer.getFullIndex().size,
            cacheStats: this.cacheManager.getStats(),
            timestamp: new Date().toISOString()
        };
    }
    async getSymbolIndex() {
        return this.symbolIndexer.getFullIndex();
    }
    async getKnowledgeGraph() {
        return {
            nodes: [],
            edges: [],
            clusters: [],
            timestamp: new Date().toISOString()
        };
    }
    async getPerformanceMetrics() {
        return {
            lspPerformance: this.lspManager.getPerformanceMetrics(),
            operationMetrics: this.performanceMonitor.getMetrics(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }
    getLanguageForUri(uri) {
        const extension = uri.split('.').pop()?.toLowerCase();
        const extensionMap = {
            'py': 'python',
            'ts': 'typescript',
            'js': 'javascript',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'java': 'java',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'c': 'cpp'
        };
        return extensionMap[extension || ''] || 'unknown';
    }
    getProjectRoot(uri) {
        return uri.substring(0, uri.lastIndexOf('/'));
    }
    async readFileContent(uri) {
        return '';
    }
    groupReferencesByFile(references) {
        const grouped = new Map();
        references.forEach(ref => {
            const file = ref.uri;
            if (!grouped.has(file)) {
                grouped.set(file, []);
            }
            grouped.get(file).push(ref);
        });
        return grouped;
    }
    async start() {
        const transport = { readable: process.stdin, writable: process.stdout };
        logger.info('Starting SuperClaude Intelligence Server');
        try {
            await this.server.connect(transport);
            logger.info('SuperClaude Intelligence Server started successfully');
        }
        catch (error) {
            logger.error('Failed to start server', error);
            process.exit(1);
        }
    }
    async stop() {
        logger.info('Stopping SuperClaude Intelligence Server');
        try {
            await this.lspManager.shutdownAll();
            await this.server.close();
            logger.info('SuperClaude Intelligence Server stopped successfully');
        }
        catch (error) {
            logger.error('Error stopping server', error);
        }
    }
}
//# sourceMappingURL=MCPServer.js.map