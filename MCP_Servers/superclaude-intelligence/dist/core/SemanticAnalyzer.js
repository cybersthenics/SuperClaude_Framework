import { SymbolKind } from 'vscode-languageserver-protocol';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';
export class SemanticAnalyzer {
    lspManager;
    symbolIndexer;
    cacheManager;
    analysisCache = new Map();
    constructor(lspManager, symbolIndexer) {
        this.lspManager = lspManager;
        this.symbolIndexer = symbolIndexer;
        this.cacheManager = new CacheManager({
            maxSize: 1000,
            ttl: 300000
        });
    }
    async analyzeCode(context) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey(context);
        const cached = this.cacheManager.get(cacheKey);
        if (cached) {
            logger.debug(`Semantic analysis cache hit for ${context.fileUri}`);
            return cached;
        }
        try {
            const symbols = await this.getDocumentSymbols(context);
            const dependencies = await this.buildDependencyGraph(context, symbols);
            const patterns = await this.detectPatterns(context, symbols);
            const insights = await this.generateInsights(context, symbols, dependencies, patterns);
            const executionPaths = await this.analyzeExecutionPaths(context, symbols);
            const knowledgeGraph = await this.buildKnowledgeGraph(context, symbols, dependencies);
            const types = await this.extractTypeInformation(symbols);
            const confidence = this.calculateConfidence(symbols, dependencies, patterns);
            const result = {
                symbols,
                types,
                dependencies,
                patterns,
                insights,
                executionPaths,
                knowledgeGraph,
                confidence
            };
            this.cacheManager.set(cacheKey, result);
            logger.info(`Semantic analysis completed for ${context.fileUri}`, {
                duration: Date.now() - startTime,
                symbolCount: symbols.length,
                confidence
            });
            return result;
        }
        catch (error) {
            logger.error(`Semantic analysis failed for ${context.fileUri}`, error);
            throw error;
        }
    }
    async resolveSymbol(uri, position) {
        const language = this.getLanguageForUri(uri);
        try {
            const definitions = await this.lspManager.sendRequest(language, 'textDocument/definition', {
                textDocument: { uri },
                position
            });
            if (!definitions || definitions.length === 0) {
                return null;
            }
            const definition = definitions[0];
            const documentSymbols = await this.lspManager.sendRequest(language, 'textDocument/documentSymbol', {
                textDocument: { uri: definition.uri }
            });
            const symbol = this.findSymbolAtPosition(documentSymbols, definition.range.start);
            if (!symbol) {
                return null;
            }
            const typeInfo = await this.getTypeInformation(definition.uri, definition.range.start);
            const references = await this.lspManager.sendRequest(language, 'textDocument/references', {
                textDocument: { uri: definition.uri },
                position: definition.range.start,
                context: { includeDeclaration: true }
            });
            const implementations = await this.lspManager.sendRequest(language, 'textDocument/implementation', {
                textDocument: { uri: definition.uri },
                position: definition.range.start
            }).catch(() => []);
            const hierarchy = await this.buildSymbolHierarchy(symbol, definition.uri);
            const hover = await this.lspManager.sendRequest(language, 'textDocument/hover', {
                textDocument: { uri: definition.uri },
                position: definition.range.start
            });
            return {
                name: symbol.name,
                kind: symbol.kind,
                location: definition,
                containerName: symbol.containerName,
                typeInformation: typeInfo,
                documentation: hover?.contents ? this.extractDocumentation(hover.contents) : undefined,
                references: references || [],
                implementations: implementations || [],
                hierarchy
            };
        }
        catch (error) {
            logger.error(`Symbol resolution failed for ${uri}:${position.line}:${position.character}`, error);
            return null;
        }
    }
    async findReferences(uri, position) {
        const language = this.getLanguageForUri(uri);
        try {
            const references = await this.lspManager.sendRequest(language, 'textDocument/references', {
                textDocument: { uri },
                position,
                context: { includeDeclaration: true }
            });
            return references || [];
        }
        catch (error) {
            logger.error(`Reference finding failed for ${uri}:${position.line}:${position.character}`, error);
            return [];
        }
    }
    async findImplementations(uri, position) {
        const language = this.getLanguageForUri(uri);
        try {
            const implementations = await this.lspManager.sendRequest(language, 'textDocument/implementation', {
                textDocument: { uri },
                position
            });
            return implementations || [];
        }
        catch (error) {
            logger.debug(`Implementation finding failed for ${uri}:${position.line}:${position.character}`, error);
            return [];
        }
    }
    async getTypeInformation(uri, position) {
        const language = this.getLanguageForUri(uri);
        try {
            const typeDefinitions = await this.lspManager.sendRequest(language, 'textDocument/typeDefinition', {
                textDocument: { uri },
                position
            });
            const hover = await this.lspManager.sendRequest(language, 'textDocument/hover', {
                textDocument: { uri },
                position
            });
            return this.parseTypeInformation(hover?.contents, typeDefinitions);
        }
        catch (error) {
            logger.debug(`Type information retrieval failed for ${uri}:${position.line}:${position.character}`, error);
            return this.getDefaultTypeInformation();
        }
    }
    async getHoverInfo(uri, position) {
        const language = this.getLanguageForUri(uri);
        try {
            return await this.lspManager.sendRequest(language, 'textDocument/hover', {
                textDocument: { uri },
                position
            });
        }
        catch (error) {
            logger.debug(`Hover information retrieval failed for ${uri}:${position.line}:${position.character}`, error);
            return null;
        }
    }
    async getCompletions(uri, position) {
        const language = this.getLanguageForUri(uri);
        try {
            const completions = await this.lspManager.sendRequest(language, 'textDocument/completion', {
                textDocument: { uri },
                position
            });
            return completions?.items || [];
        }
        catch (error) {
            logger.debug(`Completion retrieval failed for ${uri}:${position.line}:${position.character}`, error);
            return [];
        }
    }
    async analyzeReferencePatterns(references, symbol) {
        const readReferences = [];
        const writeReferences = [];
        const usagePatterns = [];
        const hotspots = [];
        const fileGroups = new Map();
        references.forEach(ref => {
            const file = ref.uri;
            if (!fileGroups.has(file)) {
                fileGroups.set(file, []);
            }
            fileGroups.get(file).push(ref);
        });
        for (const [file, refs] of fileGroups) {
            if (refs.length > 10) {
                hotspots.push(...refs);
            }
            refs.forEach(ref => {
                const nearby = refs.filter(other => Math.abs(other.range.start.line - ref.range.start.line) <= 2);
                if (nearby.length > 1) {
                    writeReferences.push(ref);
                }
                else {
                    readReferences.push(ref);
                }
            });
        }
        if (fileGroups.size > 5) {
            usagePatterns.push({
                pattern: 'Widely used symbol',
                frequency: fileGroups.size,
                locations: Array.from(fileGroups.values()).flat(),
                description: `Symbol ${symbol.name} is used across ${fileGroups.size} files`
            });
        }
        return {
            readReferences,
            writeReferences,
            usagePatterns,
            hotspots
        };
    }
    async getDocumentSymbols(context) {
        const language = context.languageId;
        const uri = context.fileUri;
        try {
            const documentSymbols = await this.lspManager.sendRequest(language, 'textDocument/documentSymbol', {
                textDocument: { uri }
            });
            return this.convertToSymbolInformation(documentSymbols, uri);
        }
        catch (error) {
            logger.error(`Failed to get document symbols for ${uri}`, error);
            return [];
        }
    }
    async buildDependencyGraph(context, symbols) {
        const nodes = [];
        const edges = [];
        symbols.forEach(symbol => {
            nodes.push({
                id: `${symbol.location.uri}:${symbol.name}`,
                name: symbol.name,
                type: this.symbolKindToNodeType(symbol.kind),
                location: symbol.location,
                metadata: {
                    kind: symbol.kind,
                    containerName: symbol.containerName
                }
            });
        });
        for (const symbol of symbols) {
            const symbolId = `${symbol.location.uri}:${symbol.name}`;
            for (const ref of symbol.references) {
                const refSymbol = symbols.find(s => s.location.uri === ref.uri &&
                    this.positionInRange(ref.range.start, s.location.range));
                if (refSymbol) {
                    const refId = `${refSymbol.location.uri}:${refSymbol.name}`;
                    edges.push({
                        source: refId,
                        target: symbolId,
                        type: 'references',
                        weight: 1,
                        metadata: {}
                    });
                }
            }
        }
        return {
            nodes,
            edges,
            metrics: {
                nodeCount: nodes.length,
                edgeCount: edges.length,
                cyclomaticComplexity: this.calculateCyclomaticComplexity(nodes, edges),
                couplingMetrics: this.calculateCouplingMetrics(nodes, edges),
                cohesionMetrics: this.calculateCohesionMetrics(nodes, edges)
            }
        };
    }
    async detectPatterns(context, symbols) {
        const patterns = [];
        patterns.push(...this.detectDesignPatterns(symbols));
        patterns.push(...this.detectAntiPatterns(symbols));
        patterns.push(...this.detectLanguagePatterns(context.languageId, symbols));
        return patterns;
    }
    async generateInsights(context, symbols, dependencies, patterns) {
        const insights = [];
        if (dependencies.metrics.cyclomaticComplexity > 10) {
            insights.push({
                type: 'warning',
                title: 'High Cyclomatic Complexity',
                description: `The code has high cyclomatic complexity (${dependencies.metrics.cyclomaticComplexity}). Consider refactoring.`,
                severity: 3,
                actionable: true,
                relatedSymbols: symbols.map(s => s.name)
            });
        }
        if (dependencies.metrics.couplingMetrics.efferentCoupling > 20) {
            insights.push({
                type: 'warning',
                title: 'High Coupling',
                description: 'This module has high outgoing dependencies. Consider reducing coupling.',
                severity: 2,
                actionable: true,
                relatedSymbols: []
            });
        }
        patterns.forEach(pattern => {
            if (pattern.confidence > 0.8) {
                insights.push({
                    type: 'info',
                    title: `Pattern Detected: ${pattern.pattern}`,
                    description: pattern.description,
                    location: pattern.location,
                    severity: 1,
                    actionable: pattern.suggestions.length > 0,
                    relatedSymbols: []
                });
            }
        });
        return insights;
    }
    async analyzeExecutionPaths(context, symbols) {
        const paths = [];
        const functions = symbols.filter(s => s.kind === SymbolKind.Function ||
            s.kind === SymbolKind.Method);
        for (const func of functions) {
            const path = {
                id: `${func.location.uri}:${func.name}`,
                startLocation: func.location,
                endLocation: func.location,
                steps: [],
                complexity: 1,
                conditions: []
            };
            const callSteps = await this.findFunctionCalls(func);
            path.steps = callSteps;
            path.complexity = this.calculatePathComplexity(callSteps);
            paths.push(path);
        }
        return paths;
    }
    async buildKnowledgeGraph(context, symbols, dependencies) {
        return {
            nodes: [],
            edges: [],
            clusters: [],
            metrics: {
                nodeCount: 0,
                edgeCount: 0,
                density: 0,
                averagePathLength: 0,
                clusteringCoefficient: 0,
                centralityDistribution: {
                    betweenness: [],
                    closeness: [],
                    degree: [],
                    eigenvector: []
                }
            }
        };
    }
    async extractTypeInformation(symbols) {
        return symbols.map(s => s.typeInformation);
    }
    calculateConfidence(symbols, dependencies, patterns) {
        let confidence = 0.5;
        const symbolsWithTypes = symbols.filter(s => s.typeInformation.typeName !== 'unknown');
        confidence += (symbolsWithTypes.length / symbols.length) * 0.3;
        if (dependencies.nodes.length > 0) {
            confidence += 0.1;
        }
        const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
        confidence += (highConfidencePatterns.length / Math.max(patterns.length, 1)) * 0.1;
        return Math.min(confidence, 1.0);
    }
    getCacheKey(context) {
        return `analysis:${context.fileUri}:${context.languageId}:${JSON.stringify(context.position)}`;
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
    convertToSymbolInformation(documentSymbols, uri) {
        const symbols = [];
        const processSymbol = (symbol, containerName) => {
            symbols.push({
                name: symbol.name,
                kind: symbol.kind,
                location: {
                    uri,
                    range: symbol.range
                },
                containerName,
                typeInformation: this.getDefaultTypeInformation(),
                references: [],
                implementations: [],
                hierarchy: {
                    children: [],
                    siblings: [],
                    depth: 0
                }
            });
            if (symbol.children) {
                symbol.children.forEach(child => processSymbol(child, symbol.name));
            }
        };
        documentSymbols.forEach(symbol => processSymbol(symbol));
        return symbols;
    }
    findSymbolAtPosition(symbols, position) {
        for (const symbol of symbols) {
            if (this.positionInRange(position, symbol.range)) {
                if (symbol.children) {
                    const childSymbol = this.findSymbolAtPosition(symbol.children, position);
                    if (childSymbol)
                        return childSymbol;
                }
                return symbol;
            }
        }
        return null;
    }
    positionInRange(position, range) {
        return position.line >= range.start.line &&
            position.line <= range.end.line &&
            position.character >= range.start.character &&
            position.character <= range.end.character;
    }
    async buildSymbolHierarchy(symbol, uri) {
        return {
            children: [],
            siblings: [],
            depth: 0
        };
    }
    extractDocumentation(contents) {
        if (typeof contents === 'string') {
            return contents;
        }
        if (Array.isArray(contents)) {
            return contents.map(c => typeof c === 'string' ? c : c.value).join('\n');
        }
        if (contents && typeof contents === 'object' && contents.value) {
            return contents.value;
        }
        return '';
    }
    parseTypeInformation(hoverContents, typeDefinitions) {
        return this.getDefaultTypeInformation();
    }
    getDefaultTypeInformation() {
        return {
            typeName: 'unknown',
            typeParameters: [],
            baseTypes: [],
            interfaces: [],
            properties: [],
            methods: [],
            isGeneric: false,
            isNullable: false
        };
    }
    symbolKindToNodeType(kind) {
        switch (kind) {
            case SymbolKind.File:
                return 'file';
            case SymbolKind.Module:
            case SymbolKind.Namespace:
                return 'module';
            case SymbolKind.Class:
            case SymbolKind.Interface:
                return 'class';
            case SymbolKind.Function:
            case SymbolKind.Method:
                return 'function';
            default:
                return 'variable';
        }
    }
    calculateCyclomaticComplexity(nodes, edges) {
        const connectedComponents = 1;
        return Math.max(edges.length - nodes.length + 2 * connectedComponents, 1);
    }
    calculateCouplingMetrics(nodes, edges) {
        return {
            afferentCoupling: 0,
            efferentCoupling: edges.length,
            instability: 0,
            abstractness: 0
        };
    }
    calculateCohesionMetrics(nodes, edges) {
        return {
            lcom: 0,
            lcom4: 0,
            tcc: 0,
            lcc: 0
        };
    }
    detectDesignPatterns(symbols) {
        const patterns = [];
        const singletonCandidates = symbols.filter(s => s.name.toLowerCase().includes('singleton') ||
            s.name.toLowerCase().includes('instance'));
        singletonCandidates.forEach(candidate => {
            patterns.push({
                pattern: 'Singleton',
                confidence: 0.7,
                location: candidate.location,
                description: `Potential singleton pattern in ${candidate.name}`,
                suggestions: ['Consider dependency injection instead of singleton']
            });
        });
        return patterns;
    }
    detectAntiPatterns(symbols) {
        const patterns = [];
        const largClasses = symbols.filter(s => s.kind === SymbolKind.Class &&
            s.hierarchy.children.length > 20);
        largClasses.forEach(cls => {
            patterns.push({
                pattern: 'God Class',
                confidence: 0.8,
                location: cls.location,
                description: `Class ${cls.name} has too many responsibilities`,
                suggestions: ['Split into smaller, focused classes']
            });
        });
        return patterns;
    }
    detectLanguagePatterns(language, symbols) {
        const patterns = [];
        return patterns;
    }
    async findFunctionCalls(func) {
        return [];
    }
    calculatePathComplexity(steps) {
        return steps.length > 0 ? steps.length : 1;
    }
}
//# sourceMappingURL=SemanticAnalyzer.js.map