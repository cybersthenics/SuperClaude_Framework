/**
 * SemanticAnalyzer - Provides IDE-like code understanding capabilities
 * Enhanced with LSP semantic data for precise analysis
 */

import { Position, Location, Range, DocumentSymbol, SymbolKind } from 'vscode-languageserver-protocol';
import { 
  SemanticContext, 
  SemanticAnalysisResult, 
  SymbolInformation, 
  TypeInformation,
  SymbolHierarchy,
  DependencyGraph,
  PatternMatch,
  AnalysisInsight,
  ExecutionPath,
  KnowledgeGraph,
  DependencyNode,
  DependencyEdge,
  ExecutionStep,
  ConditionNode,
  UsagePattern,
  ReferenceAnalysis
} from '../types/index.js';
import { LSPManager } from './LSPManager.js';
import { SymbolIndexer } from './SymbolIndexer.js';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';

export class SemanticAnalyzer {
  private cacheManager: CacheManager;
  private analysisCache: Map<string, SemanticAnalysisResult> = new Map();

  constructor(
    private lspManager: LSPManager,
    private symbolIndexer: SymbolIndexer
  ) {
    this.cacheManager = new CacheManager({
      maxSize: 1000,
      ttl: 300000 // 5 minutes
    });
  }

  async analyzeCode(context: SemanticContext): Promise<SemanticAnalysisResult> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(context);
    
    // Check cache first
    const cached = this.cacheManager.get<SemanticAnalysisResult>(cacheKey);
    if (cached) {
      logger.debug(`Semantic analysis cache hit for ${context.fileUri}`);
      return cached;
    }

    try {
      // Get document symbols
      const symbols = await this.getDocumentSymbols(context);
      
      // Build dependency graph
      const dependencies = await this.buildDependencyGraph(context, symbols);
      
      // Detect patterns
      const patterns = await this.detectPatterns(context, symbols);
      
      // Generate insights
      const insights = await this.generateInsights(context, symbols, dependencies, patterns);
      
      // Analyze execution paths
      const executionPaths = await this.analyzeExecutionPaths(context, symbols);
      
      // Build knowledge graph
      const knowledgeGraph = await this.buildKnowledgeGraph(context, symbols, dependencies);
      
      // Get type information
      const types = await this.extractTypeInformation(symbols);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(symbols, dependencies, patterns);

      const result: SemanticAnalysisResult = {
        symbols,
        types,
        dependencies,
        patterns,
        insights,
        executionPaths,
        knowledgeGraph,
        confidence
      };

      // Cache the result
      this.cacheManager.set(cacheKey, result);
      
      logger.info(`Semantic analysis completed for ${context.fileUri}`, {
        duration: Date.now() - startTime,
        symbolCount: symbols.length,
        confidence
      });

      return result;
    } catch (error) {
      logger.error(`Semantic analysis failed for ${context.fileUri}`, error);
      throw error;
    }
  }

  async resolveSymbol(uri: string, position: Position): Promise<SymbolInformation | null> {
    const language = this.getLanguageForUri(uri);
    
    try {
      // Get symbol definition
      const definitions = await this.lspManager.sendRequest(
        language,
        'textDocument/definition',
        {
          textDocument: { uri },
          position
        }
      );

      if (!definitions || definitions.length === 0) {
        return null;
      }

      const definition = definitions[0];
      
      // Get symbol information
      const documentSymbols = await this.lspManager.sendRequest(
        language,
        'textDocument/documentSymbol',
        {
          textDocument: { uri: definition.uri }
        }
      );

      // Find matching symbol
      const symbol = this.findSymbolAtPosition(documentSymbols, definition.range.start);
      if (!symbol) {
        return null;
      }

      // Get type information
      const typeInfo = await this.getTypeInformation(definition.uri, definition.range.start);
      
      // Get references
      const references = await this.lspManager.sendRequest(
        language,
        'textDocument/references',
        {
          textDocument: { uri: definition.uri },
          position: definition.range.start,
          context: { includeDeclaration: true }
        }
      );

      // Get implementations
      const implementations = await this.lspManager.sendRequest(
        language,
        'textDocument/implementation',
        {
          textDocument: { uri: definition.uri },
          position: definition.range.start
        }
      ).catch(() => []); // Not all languages support this

      // Build symbol hierarchy
      const hierarchy = await this.buildSymbolHierarchy(symbol, definition.uri);

      // Get documentation
      const hover = await this.lspManager.sendRequest(
        language,
        'textDocument/hover',
        {
          textDocument: { uri: definition.uri },
          position: definition.range.start
        }
      );

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
    } catch (error) {
      logger.error(`Symbol resolution failed for ${uri}:${position.line}:${position.character}`, error);
      return null;
    }
  }

  async findReferences(uri: string, position: Position): Promise<Location[]> {
    const language = this.getLanguageForUri(uri);
    
    try {
      const references = await this.lspManager.sendRequest(
        language,
        'textDocument/references',
        {
          textDocument: { uri },
          position,
          context: { includeDeclaration: true }
        }
      );

      return references || [];
    } catch (error) {
      logger.error(`Reference finding failed for ${uri}:${position.line}:${position.character}`, error);
      return [];
    }
  }

  async findImplementations(uri: string, position: Position): Promise<Location[]> {
    const language = this.getLanguageForUri(uri);
    
    try {
      const implementations = await this.lspManager.sendRequest(
        language,
        'textDocument/implementation',
        {
          textDocument: { uri },
          position
        }
      );

      return implementations || [];
    } catch (error) {
      logger.debug(`Implementation finding failed for ${uri}:${position.line}:${position.character}`, error);
      return [];
    }
  }

  async getTypeInformation(uri: string, position: Position): Promise<TypeInformation> {
    const language = this.getLanguageForUri(uri);
    
    try {
      // Get type definition
      const typeDefinitions = await this.lspManager.sendRequest(
        language,
        'textDocument/typeDefinition',
        {
          textDocument: { uri },
          position
        }
      );

      // Get hover information for type details
      const hover = await this.lspManager.sendRequest(
        language,
        'textDocument/hover',
        {
          textDocument: { uri },
          position
        }
      );

      return this.parseTypeInformation(hover?.contents, typeDefinitions);
    } catch (error) {
      logger.debug(`Type information retrieval failed for ${uri}:${position.line}:${position.character}`, error);
      return this.getDefaultTypeInformation();
    }
  }

  async getHoverInfo(uri: string, position: Position): Promise<any> {
    const language = this.getLanguageForUri(uri);
    
    try {
      return await this.lspManager.sendRequest(
        language,
        'textDocument/hover',
        {
          textDocument: { uri },
          position
        }
      );
    } catch (error) {
      logger.debug(`Hover information retrieval failed for ${uri}:${position.line}:${position.character}`, error);
      return null;
    }
  }

  async getCompletions(uri: string, position: Position): Promise<any[]> {
    const language = this.getLanguageForUri(uri);
    
    try {
      const completions = await this.lspManager.sendRequest(
        language,
        'textDocument/completion',
        {
          textDocument: { uri },
          position
        }
      );

      return completions?.items || [];
    } catch (error) {
      logger.debug(`Completion retrieval failed for ${uri}:${position.line}:${position.character}`, error);
      return [];
    }
  }

  async analyzeReferencePatterns(references: Location[], symbol: SymbolInformation): Promise<ReferenceAnalysis> {
    const readReferences: Location[] = [];
    const writeReferences: Location[] = [];
    const usagePatterns: UsagePattern[] = [];
    const hotspots: Location[] = [];

    // Group references by file
    const fileGroups = new Map<string, Location[]>();
    references.forEach(ref => {
      const file = ref.uri;
      if (!fileGroups.has(file)) {
        fileGroups.set(file, []);
      }
      fileGroups.get(file)!.push(ref);
    });

    // Analyze each file group
    for (const [file, refs] of fileGroups) {
      if (refs.length > 10) {
        hotspots.push(...refs);
      }

      // Simple heuristic: assume single references are reads, multiple in close proximity might be writes
      refs.forEach(ref => {
        const nearby = refs.filter(other => 
          Math.abs(other.range.start.line - ref.range.start.line) <= 2
        );
        
        if (nearby.length > 1) {
          writeReferences.push(ref);
        } else {
          readReferences.push(ref);
        }
      });
    }

    // Detect usage patterns
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

  private async getDocumentSymbols(context: SemanticContext): Promise<SymbolInformation[]> {
    const language = context.languageId;
    const uri = context.fileUri;
    
    try {
      const documentSymbols = await this.lspManager.sendRequest(
        language,
        'textDocument/documentSymbol',
        {
          textDocument: { uri }
        }
      );

      return this.convertToSymbolInformation(documentSymbols, uri);
    } catch (error) {
      logger.error(`Failed to get document symbols for ${uri}`, error);
      return [];
    }
  }

  private async buildDependencyGraph(context: SemanticContext, symbols: SymbolInformation[]): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];

    // Convert symbols to nodes
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

    // Build edges from references
    for (const symbol of symbols) {
      const symbolId = `${symbol.location.uri}:${symbol.name}`;
      
      for (const ref of symbol.references) {
        const refSymbol = symbols.find(s => 
          s.location.uri === ref.uri && 
          this.positionInRange(ref.range.start, s.location.range)
        );
        
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

  private async detectPatterns(context: SemanticContext, symbols: SymbolInformation[]): Promise<PatternMatch[]> {
    const patterns: PatternMatch[] = [];

    // Design pattern detection
    patterns.push(...this.detectDesignPatterns(symbols));
    
    // Anti-pattern detection
    patterns.push(...this.detectAntiPatterns(symbols));
    
    // Language-specific patterns
    patterns.push(...this.detectLanguagePatterns(context.languageId, symbols));

    return patterns;
  }

  private async generateInsights(
    context: SemanticContext, 
    symbols: SymbolInformation[], 
    dependencies: DependencyGraph, 
    patterns: PatternMatch[]
  ): Promise<AnalysisInsight[]> {
    const insights: AnalysisInsight[] = [];

    // Complexity insights
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

    // Coupling insights
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

    // Pattern-based insights
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

  private async analyzeExecutionPaths(context: SemanticContext, symbols: SymbolInformation[]): Promise<ExecutionPath[]> {
    const paths: ExecutionPath[] = [];
    
    // Find function symbols
    const functions = symbols.filter(s => 
      s.kind === SymbolKind.Function || 
      s.kind === SymbolKind.Method
    );

    for (const func of functions) {
      const path: ExecutionPath = {
        id: `${func.location.uri}:${func.name}`,
        startLocation: func.location,
        endLocation: func.location, // Simplified
        steps: [],
        complexity: 1,
        conditions: []
      };

      // Analyze function calls within this function
      const callSteps = await this.findFunctionCalls(func);
      path.steps = callSteps;
      path.complexity = this.calculatePathComplexity(callSteps);

      paths.push(path);
    }

    return paths;
  }

  private async buildKnowledgeGraph(
    context: SemanticContext, 
    symbols: SymbolInformation[], 
    dependencies: DependencyGraph
  ): Promise<KnowledgeGraph> {
    // This is a simplified implementation
    // In a full implementation, this would build a comprehensive semantic graph
    
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

  private async extractTypeInformation(symbols: SymbolInformation[]): Promise<TypeInformation[]> {
    return symbols.map(s => s.typeInformation);
  }

  private calculateConfidence(
    symbols: SymbolInformation[], 
    dependencies: DependencyGraph, 
    patterns: PatternMatch[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on symbol completeness
    const symbolsWithTypes = symbols.filter(s => s.typeInformation.typeName !== 'unknown');
    confidence += (symbolsWithTypes.length / symbols.length) * 0.3;
    
    // Increase confidence based on dependency completeness
    if (dependencies.nodes.length > 0) {
      confidence += 0.1;
    }
    
    // Increase confidence based on pattern detection
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    confidence += (highConfidencePatterns.length / Math.max(patterns.length, 1)) * 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private getCacheKey(context: SemanticContext): string {
    return `analysis:${context.fileUri}:${context.languageId}:${JSON.stringify(context.position)}`;
  }

  private getLanguageForUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    const extensionMap: Record<string, string> = {
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

  private convertToSymbolInformation(documentSymbols: DocumentSymbol[], uri: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    
    const processSymbol = (symbol: DocumentSymbol, containerName?: string): void => {
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

      // Process children
      if (symbol.children) {
        symbol.children.forEach(child => processSymbol(child, symbol.name));
      }
    };

    documentSymbols.forEach(symbol => processSymbol(symbol));
    return symbols;
  }

  private findSymbolAtPosition(symbols: DocumentSymbol[], position: Position): DocumentSymbol | null {
    for (const symbol of symbols) {
      if (this.positionInRange(position, symbol.range)) {
        // Check children first
        if (symbol.children) {
          const childSymbol = this.findSymbolAtPosition(symbol.children, position);
          if (childSymbol) return childSymbol;
        }
        return symbol;
      }
    }
    return null;
  }

  private positionInRange(position: Position, range: Range): boolean {
    return position.line >= range.start.line && 
           position.line <= range.end.line &&
           position.character >= range.start.character &&
           position.character <= range.end.character;
  }

  private async buildSymbolHierarchy(symbol: DocumentSymbol, uri: string): Promise<SymbolHierarchy> {
    // Simplified hierarchy building
    return {
      children: [],
      siblings: [],
      depth: 0
    };
  }

  private extractDocumentation(contents: any): string {
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

  private parseTypeInformation(hoverContents: any, typeDefinitions: Location[]): TypeInformation {
    // This is a simplified implementation
    // In a full implementation, this would parse the hover contents and type definitions
    // to extract comprehensive type information
    
    return this.getDefaultTypeInformation();
  }

  private getDefaultTypeInformation(): TypeInformation {
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

  private symbolKindToNodeType(kind: SymbolKind): 'file' | 'module' | 'class' | 'function' | 'variable' {
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

  private calculateCyclomaticComplexity(nodes: DependencyNode[], edges: DependencyEdge[]): number {
    // Simplified cyclomatic complexity calculation
    // M = E - N + 2P where E=edges, N=nodes, P=connected components
    const connectedComponents = 1; // Simplified
    return Math.max(edges.length - nodes.length + 2 * connectedComponents, 1);
  }

  private calculateCouplingMetrics(nodes: DependencyNode[], edges: DependencyEdge[]): any {
    // Simplified coupling metrics
    return {
      afferentCoupling: 0,
      efferentCoupling: edges.length,
      instability: 0,
      abstractness: 0
    };
  }

  private calculateCohesionMetrics(nodes: DependencyNode[], edges: DependencyEdge[]): any {
    // Simplified cohesion metrics
    return {
      lcom: 0,
      lcom4: 0,
      tcc: 0,
      lcc: 0
    };
  }

  private detectDesignPatterns(symbols: SymbolInformation[]): PatternMatch[] {
    const patterns: PatternMatch[] = [];
    
    // Singleton pattern detection
    const singletonCandidates = symbols.filter(s => 
      s.name.toLowerCase().includes('singleton') ||
      s.name.toLowerCase().includes('instance')
    );
    
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

  private detectAntiPatterns(symbols: SymbolInformation[]): PatternMatch[] {
    const patterns: PatternMatch[] = [];
    
    // God class detection
    const largClasses = symbols.filter(s => 
      s.kind === SymbolKind.Class && 
      s.hierarchy.children.length > 20
    );
    
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

  private detectLanguagePatterns(language: string, symbols: SymbolInformation[]): PatternMatch[] {
    const patterns: PatternMatch[] = [];
    
    // Language-specific pattern detection would go here
    // For now, return empty array
    
    return patterns;
  }

  private async findFunctionCalls(func: SymbolInformation): Promise<ExecutionStep[]> {
    // Simplified function call detection
    return [];
  }

  private calculatePathComplexity(steps: ExecutionStep[]): number {
    // Simplified path complexity calculation
    return steps.length > 0 ? steps.length : 1;
  }
}