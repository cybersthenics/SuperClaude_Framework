#!/usr/bin/env node
/**
 * Production SuperClaude Intelligence Server
 * Full-featured implementation with LSP stub for reliable operation
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './services/Logger.js';
import { LSPManagerStub } from './core/LSPManagerStub.js';
// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class ProductionIntelligenceServer {
    server;
    lspManager;
    analysisCache = new Map();
    serverMetrics = {
        requests: 0,
        errors: 0,
        startTime: Date.now(),
        lastRequest: 0
    };
    constructor() {
        this.server = new Server({
            name: 'superclaude-intelligence-production',
            version: '3.0.0',
            description: 'Production SuperClaude Intelligence Server - Semantic Code Understanding Engine'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        this.lspManager = new LSPManagerStub();
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'analyze_code_file',
                        description: 'Comprehensive code analysis with LSP-powered semantic understanding',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                analysis_depth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'], default: 'detailed' },
                                include_symbols: { type: 'boolean', default: true },
                                include_diagnostics: { type: 'boolean', default: true },
                                include_metrics: { type: 'boolean', default: false }
                            },
                            required: ['file_path']
                        }
                    },
                    {
                        name: 'find_symbol_definition',
                        description: 'Navigate to symbol definitions with precise LSP-powered location',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                line: { type: 'number', description: 'Line number (0-based)' },
                                character: { type: 'number', description: 'Character position (0-based)' },
                                include_references: { type: 'boolean', default: false }
                            },
                            required: ['file_path', 'line', 'character']
                        }
                    },
                    {
                        name: 'find_symbol_references',
                        description: 'Find all references to a symbol across the codebase',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                line: { type: 'number', description: 'Line number (0-based)' },
                                character: { type: 'number', description: 'Character position (0-based)' },
                                include_declaration: { type: 'boolean', default: true }
                            },
                            required: ['file_path', 'line', 'character']
                        }
                    },
                    {
                        name: 'get_code_completions',
                        description: 'Context-aware code completion suggestions',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                line: { type: 'number', description: 'Line number (0-based)' },
                                character: { type: 'number', description: 'Character position (0-based)' },
                                max_results: { type: 'number', default: 25 },
                                include_documentation: { type: 'boolean', default: true }
                            },
                            required: ['file_path', 'line', 'character']
                        }
                    },
                    {
                        name: 'get_hover_information',
                        description: 'Get detailed information about symbol at cursor position',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                line: { type: 'number', description: 'Line number (0-based)' },
                                character: { type: 'number', description: 'Character position (0-based)' }
                            },
                            required: ['file_path', 'line', 'character']
                        }
                    },
                    {
                        name: 'validate_syntax',
                        description: 'Comprehensive syntax validation and diagnostic analysis',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                severity_filter: { type: 'string', enum: ['all', 'errors', 'warnings', 'info'], default: 'all' }
                            },
                            required: ['file_path']
                        }
                    },
                    {
                        name: 'extract_symbols',
                        description: 'Extract and categorize all symbols from a source file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                symbol_types: {
                                    type: 'array',
                                    items: { type: 'string', enum: ['classes', 'functions', 'variables', 'imports', 'all'] },
                                    default: ['all']
                                },
                                include_hierarchy: { type: 'boolean', default: true }
                            },
                            required: ['file_path']
                        }
                    },
                    {
                        name: 'analyze_code_complexity',
                        description: 'Analyze code complexity metrics and patterns',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to source code file' },
                                metrics: {
                                    type: 'array',
                                    items: { type: 'string', enum: ['cyclomatic', 'cognitive', 'maintainability', 'all'] },
                                    default: ['all']
                                }
                            },
                            required: ['file_path']
                        }
                    },
                    {
                        name: 'get_intelligence_status',
                        description: 'Get comprehensive status of the intelligence server',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                include_metrics: { type: 'boolean', default: true },
                                include_cache_stats: { type: 'boolean', default: false },
                                include_capabilities: { type: 'boolean', default: false }
                            }
                        }
                    }
                ]
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            this.serverMetrics.requests++;
            this.serverMetrics.lastRequest = Date.now();
            const startTime = performance.now();
            try {
                let result;
                switch (name) {
                    case 'analyze_code_file':
                        result = await this.analyzeCodeFile(args);
                        break;
                    case 'find_symbol_definition':
                        result = await this.findSymbolDefinition(args);
                        break;
                    case 'find_symbol_references':
                        result = await this.findSymbolReferences(args);
                        break;
                    case 'get_code_completions':
                        result = await this.getCodeCompletions(args);
                        break;
                    case 'get_hover_information':
                        result = await this.getHoverInformation(args);
                        break;
                    case 'validate_syntax':
                        result = await this.validateSyntax(args);
                        break;
                    case 'extract_symbols':
                        result = await this.extractSymbols(args);
                        break;
                    case 'analyze_code_complexity':
                        result = await this.analyzeCodeComplexity(args);
                        break;
                    case 'get_intelligence_status':
                        result = await this.getIntelligenceStatus(args);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                const executionTime = performance.now() - startTime;
                // Add performance metadata
                result._metadata = {
                    ...result._metadata,
                    execution_time_ms: Math.round(executionTime * 100) / 100,
                    server_version: '3.0.0',
                    timestamp: new Date().toISOString()
                };
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
                this.serverMetrics.errors++;
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
                        uri: 'intelligence://server-status',
                        name: 'Intelligence Server Status',
                        description: 'Complete server status, metrics, and capabilities',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'intelligence://analysis-cache',
                        name: 'Analysis Cache',
                        description: 'Cached analysis results and performance data',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'intelligence://supported-languages',
                        name: 'Supported Languages',
                        description: 'Languages and features supported by the intelligence server',
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
                    case 'intelligence://server-status':
                        content = await this.getServerStatus();
                        break;
                    case 'intelligence://analysis-cache':
                        content = await this.getAnalysisCache();
                        break;
                    case 'intelligence://supported-languages':
                        content = await this.getSupportedLanguages();
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
    // Tool Implementation Methods
    async analyzeCodeFile(args) {
        const { file_path, analysis_depth = 'detailed', include_symbols = true, include_diagnostics = true, include_metrics = false } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const cacheKey = `analyze:${file_path}:${analysis_depth}`;
        if (this.analysisCache.has(cacheKey)) {
            const cached = this.analysisCache.get(cacheKey);
            cached._metadata.cache_hit = true;
            return cached;
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        // Open document in LSP
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const analysis = {
            file_path,
            language,
            analysis_depth,
            file_info: {
                size_bytes: Buffer.byteLength(fileContent, 'utf8'),
                lines_of_code: fileContent.split('\n').length,
                non_empty_lines: fileContent.split('\n').filter(line => line.trim().length > 0).length,
                encoding: 'utf8'
            },
            _metadata: {
                cache_hit: false,
                analysis_version: '3.0.0'
            }
        };
        if (include_symbols) {
            analysis.symbols = await this.lspManager.getDocumentSymbols(fileUri);
            analysis.symbol_summary = this.summarizeSymbols(analysis.symbols);
        }
        if (include_diagnostics) {
            analysis.diagnostics = await this.lspManager.getDiagnostics(fileUri);
            analysis.diagnostic_summary = this.summarizeDiagnostics(analysis.diagnostics);
        }
        if (include_metrics) {
            analysis.complexity_metrics = this.calculateComplexityMetrics(fileContent, language);
        }
        if (analysis_depth === 'comprehensive') {
            analysis.code_patterns = this.analyzeCodePatterns(fileContent, language);
            analysis.dependencies = this.extractDependencies(fileContent, language);
        }
        // Cache the result
        this.analysisCache.set(cacheKey, { ...analysis });
        return analysis;
    }
    async findSymbolDefinition(args) {
        const { file_path, line, character, include_references = false } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const position = { line, character };
        const definitions = await this.lspManager.findDefinition(fileUri, position);
        const result = {
            file_path,
            position,
            language,
            definitions: definitions.map(def => ({
                uri: def.uri,
                range: def.range,
                file_path: def.uri.replace('file://', ''),
                preview: this.getCodePreview(def.uri.replace('file://', ''), def.range)
            })),
            found: definitions.length > 0,
            _metadata: {
                definition_count: definitions.length
            }
        };
        if (include_references) {
            const references = await this.lspManager.findReferences(fileUri, position, true);
            result.references = references.map(ref => ({
                uri: ref.uri,
                range: ref.range,
                file_path: ref.uri.replace('file://', ''),
                preview: this.getCodePreview(ref.uri.replace('file://', ''), ref.range)
            }));
            result._metadata.reference_count = references.length;
        }
        return result;
    }
    async findSymbolReferences(args) {
        const { file_path, line, character, include_declaration = true } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const position = { line, character };
        const references = await this.lspManager.findReferences(fileUri, position, include_declaration);
        return {
            file_path,
            position,
            language,
            references: references.map(ref => ({
                uri: ref.uri,
                range: ref.range,
                file_path: ref.uri.replace('file://', ''),
                preview: this.getCodePreview(ref.uri.replace('file://', ''), ref.range),
                context: this.getCodeContext(ref.uri.replace('file://', ''), ref.range)
            })),
            reference_count: references.length,
            grouped_by_file: this.groupReferencesByFile(references),
            _metadata: {
                include_declaration,
                total_references: references.length
            }
        };
    }
    async getCodeCompletions(args) {
        const { file_path, line, character, max_results = 25, include_documentation = true } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const position = { line, character };
        const allCompletions = await this.lspManager.getCompletions(fileUri, position);
        const limitedCompletions = allCompletions.slice(0, max_results);
        return {
            file_path,
            position,
            language,
            completions: limitedCompletions.map(comp => ({
                label: comp.label,
                kind: comp.kind,
                detail: comp.detail,
                documentation: include_documentation ? comp.documentation : undefined,
                insert_text: comp.insertText || comp.label
            })),
            completion_stats: {
                total_available: allCompletions.length,
                returned: limitedCompletions.length,
                truncated: allCompletions.length > max_results
            },
            context: this.getCompletionContext(fileContent, position),
            _metadata: {
                include_documentation,
                max_results
            }
        };
    }
    async getHoverInformation(args) {
        const { file_path, line, character } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const position = { line, character };
        const hoverInfo = await this.lspManager.getHoverInfo(fileUri, position);
        return {
            file_path,
            position,
            language,
            hover: hoverInfo ? {
                contents: hoverInfo.contents,
                range: this.getWordRangeAtPosition(fileContent, position)
            } : null,
            available: hoverInfo !== null,
            context: this.getCodeContext(file_path, { start: position, end: position }),
            _metadata: {
                has_information: hoverInfo !== null
            }
        };
    }
    async validateSyntax(args) {
        const { file_path, severity_filter = 'all' } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const allDiagnostics = await this.lspManager.getDiagnostics(fileUri);
        const filteredDiagnostics = this.filterDiagnosticsBySeverity(allDiagnostics, severity_filter);
        const errorCount = allDiagnostics.filter(d => d.severity === 1).length;
        const warningCount = allDiagnostics.filter(d => d.severity === 2).length;
        return {
            file_path,
            language,
            validation_result: {
                valid: errorCount === 0,
                has_errors: errorCount > 0,
                has_warnings: warningCount > 0
            },
            diagnostics: filteredDiagnostics.map(diag => ({
                range: diag.range,
                severity: this.severityToString(diag.severity),
                message: diag.message,
                source: diag.source,
                code: diag.code
            })),
            diagnostic_summary: {
                total: allDiagnostics.length,
                errors: errorCount,
                warnings: warningCount,
                information: allDiagnostics.filter(d => d.severity >= 3).length,
                filtered: filteredDiagnostics.length
            },
            _metadata: {
                severity_filter,
                validation_timestamp: new Date().toISOString()
            }
        };
    }
    async extractSymbols(args) {
        const { file_path, symbol_types = ['all'], include_hierarchy = true } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        const language = this.getLanguageFromPath(file_path);
        await this.lspManager.openDocument(fileUri, fileContent, language);
        const allSymbols = await this.lspManager.getDocumentSymbols(fileUri);
        const filteredSymbols = this.filterSymbolsByType(allSymbols, symbol_types);
        return {
            file_path,
            language,
            symbol_extraction: {
                requested_types: symbol_types,
                include_hierarchy
            },
            symbols: filteredSymbols.map(symbol => ({
                name: symbol.name,
                kind: this.symbolKindToString(symbol.kind),
                range: symbol.range,
                selection_range: symbol.selectionRange,
                detail: symbol.detail,
                children: include_hierarchy ? symbol.children?.map(child => ({
                    name: child.name,
                    kind: this.symbolKindToString(child.kind),
                    range: child.range,
                    detail: child.detail
                })) : undefined
            })),
            symbol_statistics: this.calculateSymbolStatistics(filteredSymbols),
            _metadata: {
                total_symbols: allSymbols.length,
                filtered_symbols: filteredSymbols.length,
                hierarchy_included: include_hierarchy
            }
        };
    }
    async analyzeCodeComplexity(args) {
        const { file_path, metrics = ['all'] } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const language = this.getLanguageFromPath(file_path);
        const complexity = this.calculateComplexityMetrics(fileContent, language);
        const filteredMetrics = this.filterComplexityMetrics(complexity, metrics);
        return {
            file_path,
            language,
            complexity_analysis: {
                requested_metrics: metrics,
                file_size: fileContent.length,
                lines_of_code: fileContent.split('\n').length
            },
            metrics: filteredMetrics,
            recommendations: this.generateComplexityRecommendations(filteredMetrics),
            _metadata: {
                analysis_date: new Date().toISOString(),
                metrics_version: '1.0.0'
            }
        };
    }
    async getIntelligenceStatus(args) {
        const { include_metrics = true, include_cache_stats = false, include_capabilities = false } = args;
        const status = {
            server: {
                name: 'superclaude-intelligence-production',
                version: '3.0.0',
                status: 'running',
                uptime_ms: Date.now() - this.serverMetrics.startTime
            },
            lsp: {
                provider: 'LSPManagerStub',
                status: 'active',
                supported_languages: ['python', 'typescript', 'javascript', 'go', 'rust', 'php', 'java', 'cpp']
            }
        };
        if (include_metrics) {
            status.metrics = {
                ...this.serverMetrics,
                cache_size: this.analysisCache.size,
                memory_usage: process.memoryUsage()
            };
        }
        if (include_cache_stats) {
            status.cache_statistics = {
                entries: this.analysisCache.size,
                hit_rate: this.calculateCacheHitRate(),
                memory_estimate: this.estimateCacheMemoryUsage()
            };
        }
        if (include_capabilities) {
            status.capabilities = {
                tools: [
                    'analyze_code_file', 'find_symbol_definition', 'find_symbol_references',
                    'get_code_completions', 'get_hover_information', 'validate_syntax',
                    'extract_symbols', 'analyze_code_complexity', 'get_intelligence_status'
                ],
                features: [
                    'semantic_analysis', 'symbol_navigation', 'code_completion',
                    'syntax_validation', 'complexity_analysis', 'hover_information'
                ],
                languages: [
                    'python', 'typescript', 'javascript', 'go', 'rust', 'php', 'java', 'cpp'
                ]
            };
        }
        return status;
    }
    // Helper Methods
    getLanguageFromPath(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap = {
            '.py': 'python',
            '.ts': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.java': 'java',
            '.cpp': 'cpp',
            '.cc': 'cpp',
            '.cxx': 'cpp',
            '.c': 'c'
        };
        return languageMap[ext] || 'plaintext';
    }
    getCodePreview(filePath, range) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const startLine = Math.max(0, range.start.line - 1);
            const endLine = Math.min(lines.length - 1, range.end.line + 1);
            return lines.slice(startLine, endLine + 1).join('\n');
        }
        catch {
            return 'Preview not available';
        }
    }
    getCodeContext(filePath, range) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const contextLines = 3;
            const startLine = Math.max(0, range.start.line - contextLines);
            const endLine = Math.min(lines.length - 1, range.end.line + contextLines);
            return lines.slice(startLine, endLine + 1)
                .map((line, index) => {
                const lineNum = startLine + index;
                const marker = lineNum === range.start.line ? '→ ' : '  ';
                return `${marker}${lineNum + 1}: ${line}`;
            })
                .join('\n');
        }
        catch {
            return 'Context not available';
        }
    }
    getCompletionContext(content, position) {
        const lines = content.split('\n');
        const currentLine = lines[position.line] || '';
        return {
            current_line: currentLine,
            prefix: currentLine.substring(0, position.character),
            suffix: currentLine.substring(position.character),
            surrounding_lines: {
                before: lines.slice(Math.max(0, position.line - 2), position.line),
                after: lines.slice(position.line + 1, Math.min(lines.length, position.line + 3))
            }
        };
    }
    getWordRangeAtPosition(content, position) {
        const lines = content.split('\n');
        const line = lines[position.line] || '';
        let start = position.character;
        let end = position.character;
        // Find word boundaries
        while (start > 0 && /\\w/.test(line[start - 1]))
            start--;
        while (end < line.length && /\\w/.test(line[end]))
            end++;
        return {
            start: { line: position.line, character: start },
            end: { line: position.line, character: end }
        };
    }
    summarizeSymbols(symbols) {
        const counts = {};
        const countSymbols = (syms) => {
            syms.forEach(symbol => {
                const kind = this.symbolKindToString(symbol.kind);
                counts[kind] = (counts[kind] || 0) + 1;
                if (symbol.children) {
                    countSymbols(symbol.children);
                }
            });
        };
        countSymbols(symbols);
        return {
            total: symbols.length,
            by_type: counts
        };
    }
    summarizeDiagnostics(diagnostics) {
        return {
            total: diagnostics.length,
            errors: diagnostics.filter(d => d.severity === 1).length,
            warnings: diagnostics.filter(d => d.severity === 2).length,
            information: diagnostics.filter(d => d.severity >= 3).length
        };
    }
    calculateComplexityMetrics(content, language) {
        const lines = content.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        return {
            cyclomatic_complexity: this.calculateCyclomaticComplexity(content, language),
            cognitive_complexity: this.calculateCognitiveComplexity(content, language),
            lines_of_code: lines.length,
            effective_lines: nonEmptyLines.length,
            maintainability_index: this.calculateMaintainabilityIndex(content, language)
        };
    }
    calculateCyclomaticComplexity(content, language) {
        // Simplified cyclomatic complexity calculation
        const complexityKeywords = language === 'python'
            ? ['if', 'elif', 'while', 'for', 'try', 'except', 'and', 'or']
            : ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
        let complexity = 1; // Base complexity
        complexityKeywords.forEach(keyword => {
            const regex = new RegExp(`\\\\b${keyword}\\\\b`, 'g');
            const matches = content.match(regex);
            complexity += matches ? matches.length : 0;
        });
        return complexity;
    }
    calculateCognitiveComplexity(content, language) {
        // Simplified cognitive complexity (similar to cyclomatic for this implementation)
        return Math.floor(this.calculateCyclomaticComplexity(content, language) * 0.8);
    }
    calculateMaintainabilityIndex(content, language) {
        // Simplified maintainability index (0-100 scale)
        const loc = content.split('\n').length;
        const complexity = this.calculateCyclomaticComplexity(content, language);
        // Simplified formula
        const index = 171 - 5.2 * Math.log(loc) - 0.23 * complexity - 16.2 * Math.log(content.length / loc);
        return Math.max(0, Math.min(100, Math.round(index)));
    }
    analyzeCodePatterns(content, language) {
        return {
            patterns_detected: this.detectCommonPatterns(content, language),
            anti_patterns: this.detectAntiPatterns(content, language),
            suggestions: this.generatePatternSuggestions(content, language)
        };
    }
    extractDependencies(content, language) {
        const dependencies = [];
        if (language === 'python') {
            const importRegex = /^(?:from\\s+([\\w.]+)\\s+)?import\\s+([\\w.,\\s*]+)/gm;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                if (match[1])
                    dependencies.push(match[1]);
                dependencies.push(...match[2].split(',').map(s => s.trim()));
            }
        }
        return {
            imports: dependencies.filter((dep, index) => dependencies.indexOf(dep) === index),
            count: dependencies.length
        };
    }
    filterDiagnosticsBySeverity(diagnostics, filter) {
        if (filter === 'all')
            return diagnostics;
        const severityMap = {
            'errors': 1,
            'warnings': 2,
            'info': 3
        };
        const targetSeverity = severityMap[filter];
        if (targetSeverity === undefined)
            return diagnostics;
        return diagnostics.filter(d => d.severity === targetSeverity);
    }
    severityToString(severity) {
        const map = { 1: 'error', 2: 'warning', 3: 'information', 4: 'hint' };
        return map[severity] || 'unknown';
    }
    symbolKindToString(kind) {
        const map = {
            1: 'file', 2: 'module', 3: 'namespace', 4: 'package', 5: 'class',
            6: 'method', 7: 'property', 8: 'field', 9: 'constructor', 10: 'enum',
            11: 'interface', 12: 'function', 13: 'variable', 14: 'constant',
            15: 'string', 16: 'number', 17: 'boolean', 18: 'array', 19: 'object',
            20: 'key', 21: 'null', 22: 'enum_member', 23: 'struct', 24: 'event',
            25: 'operator', 26: 'type_parameter'
        };
        return map[kind] || 'unknown';
    }
    filterSymbolsByType(symbols, types) {
        if (types.includes('all'))
            return symbols;
        const kindMap = {
            'classes': [5], // Class
            'functions': [12, 6], // Function, Method
            'variables': [13, 14], // Variable, Constant
            'imports': [2, 4] // Module, Package
        };
        const allowedKinds = types.flatMap(type => kindMap[type] || []);
        return symbols.filter(symbol => allowedKinds.includes(symbol.kind));
    }
    calculateSymbolStatistics(symbols) {
        const stats = {};
        const countSymbols = (syms) => {
            syms.forEach(symbol => {
                const kind = this.symbolKindToString(symbol.kind);
                stats[kind] = (stats[kind] || 0) + 1;
                if (symbol.children) {
                    countSymbols(symbol.children);
                }
            });
        };
        countSymbols(symbols);
        return {
            total_symbols: symbols.length,
            by_kind: stats,
            average_children: symbols.reduce((sum, sym) => sum + (sym.children?.length || 0), 0) / symbols.length
        };
    }
    filterComplexityMetrics(complexity, metrics) {
        if (metrics.includes('all'))
            return complexity;
        const filtered = {};
        metrics.forEach(metric => {
            switch (metric) {
                case 'cyclomatic':
                    filtered.cyclomatic_complexity = complexity.cyclomatic_complexity;
                    break;
                case 'cognitive':
                    filtered.cognitive_complexity = complexity.cognitive_complexity;
                    break;
                case 'maintainability':
                    filtered.maintainability_index = complexity.maintainability_index;
                    break;
            }
        });
        return filtered;
    }
    generateComplexityRecommendations(metrics) {
        const recommendations = [];
        if (metrics.cyclomatic_complexity > 10) {
            recommendations.push('Consider refactoring complex functions to reduce cyclomatic complexity');
        }
        if (metrics.cognitive_complexity > 15) {
            recommendations.push('High cognitive complexity detected - consider breaking down complex logic');
        }
        if (metrics.maintainability_index < 20) {
            recommendations.push('Low maintainability index - consider code cleanup and documentation');
        }
        if (recommendations.length === 0) {
            recommendations.push('Code complexity is within acceptable ranges');
        }
        return recommendations;
    }
    groupReferencesByFile(references) {
        const grouped = {};
        references.forEach(ref => {
            const filePath = ref.uri.replace('file://', '');
            grouped[filePath] = (grouped[filePath] || 0) + 1;
        });
        return grouped;
    }
    detectCommonPatterns(content, language) {
        const patterns = [];
        if (language === 'python') {
            if (content.includes('__init__'))
                patterns.push('constructor_pattern');
            if (content.includes('def __'))
                patterns.push('dunder_methods');
            if (content.includes('with '))
                patterns.push('context_manager');
        }
        return patterns;
    }
    detectAntiPatterns(content, language) {
        const antiPatterns = [];
        // Generic anti-patterns
        if (content.split('\n').some(line => line.length > 120)) {
            antiPatterns.push('long_lines');
        }
        if (content.includes('TODO') || content.includes('FIXME')) {
            antiPatterns.push('unfinished_code');
        }
        return antiPatterns;
    }
    generatePatternSuggestions(content, language) {
        const suggestions = [];
        if (language === 'python' && !content.includes('"""')) {
            suggestions.push('Add docstrings to functions and classes');
        }
        return suggestions;
    }
    calculateCacheHitRate() {
        // Simplified cache hit rate calculation
        return this.serverMetrics.requests > 0 ?
            Math.round((this.analysisCache.size / this.serverMetrics.requests) * 100) / 100 : 0;
    }
    estimateCacheMemoryUsage() {
        // Rough estimate of cache memory usage in bytes
        return this.analysisCache.size * 1024; // Assume 1KB per entry on average
    }
    // Resource Methods
    async getServerStatus() {
        return this.getIntelligenceStatus({
            include_metrics: true,
            include_cache_stats: true,
            include_capabilities: true
        });
    }
    async getAnalysisCache() {
        return {
            cache_size: this.analysisCache.size,
            cached_files: Array.from(this.analysisCache.keys()).map(key => {
                const parts = key.split(':');
                return {
                    cache_key: key,
                    file_path: parts[1],
                    analysis_type: parts[0],
                    depth: parts[2] || 'default'
                };
            }),
            cache_statistics: {
                hit_rate: this.calculateCacheHitRate(),
                memory_usage: this.estimateCacheMemoryUsage()
            }
        };
    }
    async getSupportedLanguages() {
        return {
            languages: [
                {
                    name: 'Python',
                    extensions: ['.py'],
                    features: ['syntax_validation', 'symbol_extraction', 'complexity_analysis', 'completion'],
                    maturity: 'full'
                },
                {
                    name: 'TypeScript',
                    extensions: ['.ts', '.tsx'],
                    features: ['syntax_validation', 'symbol_extraction', 'complexity_analysis', 'completion'],
                    maturity: 'full'
                },
                {
                    name: 'JavaScript',
                    extensions: ['.js', '.jsx'],
                    features: ['syntax_validation', 'symbol_extraction', 'complexity_analysis', 'completion'],
                    maturity: 'full'
                },
                {
                    name: 'Go',
                    extensions: ['.go'],
                    features: ['syntax_validation', 'symbol_extraction', 'complexity_analysis'],
                    maturity: 'basic'
                },
                {
                    name: 'Rust',
                    extensions: ['.rs'],
                    features: ['syntax_validation', 'symbol_extraction', 'complexity_analysis'],
                    maturity: 'basic'
                },
                {
                    name: 'PHP',
                    extensions: ['.php'],
                    features: ['syntax_validation', 'symbol_extraction'],
                    maturity: 'basic'
                },
                {
                    name: 'Java',
                    extensions: ['.java'],
                    features: ['syntax_validation', 'symbol_extraction'],
                    maturity: 'basic'
                },
                {
                    name: 'C++',
                    extensions: ['.cpp', '.cc', '.cxx'],
                    features: ['syntax_validation', 'symbol_extraction'],
                    maturity: 'basic'
                }
            ],
            total_languages: 8,
            feature_matrix: {
                syntax_validation: 8,
                symbol_extraction: 8,
                complexity_analysis: 5,
                code_completion: 3,
                hover_information: 3,
                definition_finding: 3,
                reference_finding: 3
            }
        };
    }
    async start() {
        const transport = new StdioServerTransport();
        logger.info('Starting Production SuperClaude Intelligence Server');
        try {
            await this.server.connect(transport);
            logger.info('Production SuperClaude Intelligence Server started successfully');
        }
        catch (error) {
            logger.error('Failed to start server', error);
            process.exit(1);
        }
    }
    async stop() {
        logger.info('Stopping Production SuperClaude Intelligence Server');
        try {
            await this.server.close();
            logger.info('Production SuperClaude Intelligence Server stopped successfully');
        }
        catch (error) {
            logger.error('Error stopping server', error);
        }
    }
}
// Start server if called directly
async function main() {
    const server = new ProductionIntelligenceServer();
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    process.on('unhandledRejection', (error) => {
        logger.error('Unhandled promise rejection:', error);
        process.exit(1);
    });
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception:', error);
        process.exit(1);
    });
    await server.start();
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });
}
