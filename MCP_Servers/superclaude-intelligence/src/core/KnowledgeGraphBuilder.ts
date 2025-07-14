/**
 * KnowledgeGraphBuilder - Build semantic-aware knowledge graphs with type relationships
 * Creates comprehensive semantic graphs from code analysis
 */

import { 
  KnowledgeGraph, 
  KnowledgeNode, 
  KnowledgeEdge, 
  SemanticCluster, 
  GraphMetrics,
  SemanticContext,
  SymbolInformation,
  DependencyGraph,
  Relationship,
  SemanticLink,
  GraphQuery,
  GraphResult,
  SemanticChange,
  OptimizationResult
} from '../types/index.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';
import { SymbolIndexer } from './SymbolIndexer.js';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';

export interface GraphQuery {
  nodeId?: string;
  nodeType?: string;
  edgeType?: string;
  maxDepth?: number;
  includeProperties?: boolean;
}

export interface GraphResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  paths: any[];
  metrics: any;
}

export interface Relationship {
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
  weight: number;
}

export interface SemanticLink {
  id: string;
  source: string;
  target: string;
  type: string;
  semanticWeight: number;
  contextualRelevance: number;
}

export interface SemanticChange {
  type: 'add' | 'remove' | 'update';
  nodeId?: string;
  edgeId?: string;
  properties?: Record<string, any>;
}

export interface OptimizationResult {
  nodesOptimized: number;
  edgesOptimized: number;
  clustersCreated: number;
  executionTime: number;
}

export class KnowledgeGraphBuilder {
  private graphCache: Map<string, KnowledgeGraph> = new Map();
  private relationshipCache: Map<string, Relationship[]> = new Map();
  private cacheManager: CacheManager;

  constructor(
    private semanticAnalyzer: SemanticAnalyzer,
    private symbolIndexer: SymbolIndexer
  ) {
    this.cacheManager = new CacheManager({
      maxSize: 100,
      ttl: 600000 // 10 minutes
    });
  }

  async buildKnowledgeGraph(context: SemanticContext): Promise<KnowledgeGraph> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(context);
    
    // Check cache first
    const cached = this.cacheManager.get<KnowledgeGraph>(cacheKey);
    if (cached) {
      logger.debug(`Knowledge graph cache hit for ${context.projectRoot}`);
      return cached;
    }

    try {
      // Get semantic analysis for the context
      const analysis = await this.semanticAnalyzer.analyzeCode(context);
      
      // Build nodes from symbols
      const nodes = await this.buildNodes(analysis.symbols, context);
      
      // Build edges from relationships
      const edges = await this.buildEdges(analysis.symbols, analysis.dependencies, context);
      
      // Detect semantic clusters
      const clusters = await this.detectClusters(nodes, edges);
      
      // Calculate graph metrics
      const metrics = await this.calculateGraphMetrics(nodes, edges, clusters);
      
      const knowledgeGraph: KnowledgeGraph = {
        nodes,
        edges,
        clusters,
        metrics
      };

      // Cache the result
      this.cacheManager.set(cacheKey, knowledgeGraph);
      
      logger.info(`Knowledge graph built for ${context.projectRoot}`, {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        clusterCount: clusters.length,
        executionTime: Date.now() - startTime
      });

      return knowledgeGraph;
    } catch (error) {
      logger.error(`Knowledge graph building failed for ${context.projectRoot}`, error);
      throw error;
    }
  }

  async addSemanticRelationships(symbols: SymbolInformation[]): Promise<void> {
    const relationships = await this.identifyRelationships(symbols);
    const semanticLinks = await this.createSemanticLinks(relationships);
    
    // Update existing graphs with new relationships
    for (const [cacheKey, graph] of this.graphCache) {
      const updatedEdges = this.mergeSemanticLinks(graph.edges, semanticLinks);
      graph.edges = updatedEdges;
      this.graphCache.set(cacheKey, graph);
    }
    
    logger.debug(`Added ${semanticLinks.length} semantic relationships`);
  }

  async queryGraph(query: GraphQuery): Promise<GraphResult> {
    const startTime = Date.now();
    const results: GraphResult = {
      nodes: [],
      edges: [],
      paths: [],
      metrics: {}
    };

    try {
      // Search across all cached graphs
      for (const graph of this.graphCache.values()) {
        const matchingNodes = this.findMatchingNodes(graph.nodes, query);
        const matchingEdges = this.findMatchingEdges(graph.edges, query);
        
        results.nodes.push(...matchingNodes);
        results.edges.push(...matchingEdges);
      }

      // Find paths if depth is specified
      if (query.maxDepth && query.nodeId) {
        results.paths = await this.findPaths(query.nodeId, query.maxDepth);
      }

      // Calculate query metrics
      results.metrics = {
        executionTime: Date.now() - startTime,
        nodesFound: results.nodes.length,
        edgesFound: results.edges.length,
        pathsFound: results.paths.length
      };

      logger.debug(`Graph query completed`, results.metrics);
      return results;
    } catch (error) {
      logger.error(`Graph query failed`, error);
      throw error;
    }
  }

  async updateGraph(changes: SemanticChange[]): Promise<void> {
    const startTime = Date.now();
    let changesApplied = 0;

    try {
      for (const change of changes) {
        await this.applyChange(change);
        changesApplied++;
      }

      // Invalidate relevant caches
      this.invalidateRelevantCaches(changes);

      logger.debug(`Applied ${changesApplied} graph changes`, {
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      logger.error(`Graph update failed`, error);
      throw error;
    }
  }

  async optimizeGraph(): Promise<OptimizationResult> {
    const startTime = Date.now();
    let nodesOptimized = 0;
    let edgesOptimized = 0;
    let clustersCreated = 0;

    try {
      // Optimize each cached graph
      for (const [cacheKey, graph] of this.graphCache) {
        // Remove duplicate nodes
        const uniqueNodes = this.removeDuplicateNodes(graph.nodes);
        nodesOptimized += graph.nodes.length - uniqueNodes.length;
        graph.nodes = uniqueNodes;

        // Remove duplicate edges
        const uniqueEdges = this.removeDuplicateEdges(graph.edges);
        edgesOptimized += graph.edges.length - uniqueEdges.length;
        graph.edges = uniqueEdges;

        // Recreate clusters
        const newClusters = await this.detectClusters(graph.nodes, graph.edges);
        clustersCreated += newClusters.length;
        graph.clusters = newClusters;

        // Update metrics
        graph.metrics = await this.calculateGraphMetrics(graph.nodes, graph.edges, graph.clusters);

        this.graphCache.set(cacheKey, graph);
      }

      const result: OptimizationResult = {
        nodesOptimized,
        edgesOptimized,
        clustersCreated,
        executionTime: Date.now() - startTime
      };

      logger.info(`Graph optimization completed`, result);
      return result;
    } catch (error) {
      logger.error(`Graph optimization failed`, error);
      throw error;
    }
  }

  async identifyRelationships(symbols: SymbolInformation[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    for (const symbol of symbols) {
      // Inheritance relationships
      if (symbol.typeInformation.baseTypes.length > 0) {
        for (const baseType of symbol.typeInformation.baseTypes) {
          relationships.push({
            source: symbol.name,
            target: baseType,
            type: 'inherits',
            properties: { symbolKind: symbol.kind },
            weight: 1.0
          });
        }
      }

      // Interface implementation relationships
      if (symbol.typeInformation.interfaces.length > 0) {
        for (const interfaceType of symbol.typeInformation.interfaces) {
          relationships.push({
            source: symbol.name,
            target: interfaceType,
            type: 'implements',
            properties: { symbolKind: symbol.kind },
            weight: 0.8
          });
        }
      }

      // Reference relationships
      for (const reference of symbol.references) {
        const referencedSymbol = await this.findSymbolAtLocation(reference);
        if (referencedSymbol) {
          relationships.push({
            source: symbol.name,
            target: referencedSymbol.name,
            type: 'references',
            properties: { 
              referenceLocation: reference,
              symbolKind: symbol.kind 
            },
            weight: 0.3
          });
        }
      }

      // Containment relationships
      if (symbol.containerName) {
        relationships.push({
          source: symbol.containerName,
          target: symbol.name,
          type: 'contains',
          properties: { symbolKind: symbol.kind },
          weight: 0.9
        });
      }
    }

    return relationships;
  }

  async createSemanticLinks(relationships: Relationship[]): Promise<SemanticLink[]> {
    const semanticLinks: SemanticLink[] = [];

    for (const relationship of relationships) {
      const semanticWeight = this.calculateSemanticWeight(relationship);
      const contextualRelevance = await this.calculateContextualRelevance(relationship);

      semanticLinks.push({
        id: `${relationship.source}-${relationship.type}-${relationship.target}`,
        source: relationship.source,
        target: relationship.target,
        type: relationship.type,
        semanticWeight,
        contextualRelevance
      });
    }

    return semanticLinks;
  }

  async calculateSemanticDistance(symbolA: string, symbolB: string): Promise<number> {
    // Find shortest path between symbols in the knowledge graph
    const paths = await this.findPaths(symbolA, 10, symbolB);
    
    if (paths.length === 0) {
      return Infinity;
    }

    // Return the shortest path length
    return Math.min(...paths.map(path => path.length));
  }

  async detectClusters(): Promise<SemanticCluster[]> {
    const clusters: SemanticCluster[] = [];

    // Simple clustering algorithm based on semantic similarity
    for (const [cacheKey, graph] of this.graphCache) {
      const graphClusters = await this.clusterNodes(graph.nodes, graph.edges);
      clusters.push(...graphClusters);
    }

    return clusters;
  }

  private async buildNodes(symbols: SymbolInformation[], context: SemanticContext): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];

    for (const symbol of symbols) {
      const node: KnowledgeNode = {
        id: this.generateNodeId(symbol),
        type: this.getNodeType(symbol),
        name: symbol.name,
        properties: {
          kind: symbol.kind,
          location: symbol.location,
          containerName: symbol.containerName,
          typeInformation: symbol.typeInformation,
          documentation: symbol.documentation
        },
        semanticWeight: this.calculateNodeSemanticWeight(symbol),
        centrality: 0 // Will be calculated later
      };

      nodes.push(node);
    }

    // Calculate centrality for all nodes
    await this.calculateCentrality(nodes);

    return nodes;
  }

  private async buildEdges(
    symbols: SymbolInformation[], 
    dependencies: DependencyGraph, 
    context: SemanticContext
  ): Promise<KnowledgeEdge[]> {
    const edges: KnowledgeEdge[] = [];

    // Build edges from dependency graph
    for (const depEdge of dependencies.edges) {
      const edge: KnowledgeEdge = {
        source: depEdge.source,
        target: depEdge.target,
        type: this.mapDependencyTypeToSemanticType(depEdge.type),
        weight: depEdge.weight,
        properties: depEdge.metadata
      };

      edges.push(edge);
    }

    // Add semantic relationships
    const relationships = await this.identifyRelationships(symbols);
    for (const relationship of relationships) {
      const edge: KnowledgeEdge = {
        source: relationship.source,
        target: relationship.target,
        type: relationship.type,
        weight: relationship.weight,
        properties: relationship.properties
      };

      edges.push(edge);
    }

    return edges;
  }

  private async calculateGraphMetrics(
    nodes: KnowledgeNode[], 
    edges: KnowledgeEdge[], 
    clusters: SemanticCluster[]
  ): Promise<GraphMetrics> {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
    
    // Calculate average path length (simplified)
    const averagePathLength = await this.calculateAveragePathLength(nodes, edges);
    
    // Calculate clustering coefficient (simplified)
    const clusteringCoefficient = clusters.length > 0 ? 
      clusters.reduce((sum, cluster) => sum + cluster.cohesion, 0) / clusters.length : 0;

    return {
      nodeCount,
      edgeCount,
      density,
      averagePathLength,
      clusteringCoefficient,
      centralityDistribution: {
        betweenness: nodes.map(n => n.centrality),
        closeness: nodes.map(n => n.centrality * 0.8),
        degree: nodes.map(n => n.centrality * 1.2),
        eigenvector: nodes.map(n => n.centrality * 0.9)
      }
    };
  }

  private async findSymbolAtLocation(location: any): Promise<SymbolInformation | null> {
    // Use semantic analyzer to find symbol at location
    return await this.semanticAnalyzer.resolveSymbol(location.uri, location.range.start);
  }

  private calculateSemanticWeight(relationship: Relationship): number {
    // Calculate semantic weight based on relationship type and properties
    const typeWeights: Record<string, number> = {
      'inherits': 1.0,
      'implements': 0.8,
      'contains': 0.9,
      'references': 0.3,
      'calls': 0.4,
      'depends_on': 0.5
    };

    return typeWeights[relationship.type] || 0.1;
  }

  private async calculateContextualRelevance(relationship: Relationship): Promise<number> {
    // Calculate contextual relevance based on usage patterns
    // This is a simplified implementation
    return Math.random() * 0.5 + 0.5; // Random between 0.5 and 1.0
  }

  private generateNodeId(symbol: SymbolInformation): string {
    return `${symbol.location.uri}:${symbol.name}:${symbol.kind}`;
  }

  private getNodeType(symbol: SymbolInformation): 'symbol' | 'type' | 'module' | 'concept' {
    // Map symbol kinds to node types
    switch (symbol.kind) {
      case 1: // File
      case 2: // Module
      case 3: // Namespace
        return 'module';
      case 5: // Class
      case 11: // Interface
        return 'type';
      default:
        return 'symbol';
    }
  }

  private calculateNodeSemanticWeight(symbol: SymbolInformation): number {
    // Calculate semantic weight based on symbol properties
    let weight = 0.5; // Base weight

    // Increase weight for important symbol types
    switch (symbol.kind) {
      case 5: // Class
        weight += 0.3;
        break;
      case 12: // Function
      case 6: // Method
        weight += 0.2;
        break;
      case 11: // Interface
        weight += 0.25;
        break;
    }

    // Increase weight for symbols with documentation
    if (symbol.documentation) {
      weight += 0.1;
    }

    // Increase weight for symbols with many references
    if (symbol.references.length > 5) {
      weight += 0.1;
    }

    return Math.min(weight, 1.0);
  }

  private async calculateCentrality(nodes: KnowledgeNode[]): Promise<void> {
    // Simplified centrality calculation
    // In a full implementation, this would use graph algorithms
    nodes.forEach(node => {
      node.centrality = Math.random(); // Placeholder
    });
  }

  private mapDependencyTypeToSemanticType(depType: string): 'semantic' | 'structural' | 'functional' | 'inheritance' {
    const mapping: Record<string, 'semantic' | 'structural' | 'functional' | 'inheritance'> = {
      'import': 'structural',
      'extends': 'inheritance',
      'implements': 'inheritance',
      'calls': 'functional',
      'references': 'semantic'
    };

    return mapping[depType] || 'semantic';
  }

  private async clusterNodes(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): Promise<SemanticCluster[]> {
    const clusters: SemanticCluster[] = [];

    // Simple clustering by node type
    const typeGroups = new Map<string, KnowledgeNode[]>();
    nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, []);
      }
      typeGroups.get(node.type)!.push(node);
    });

    for (const [type, groupNodes] of typeGroups) {
      if (groupNodes.length > 1) {
        clusters.push({
          id: `cluster-${type}`,
          nodes: groupNodes.map(n => n.id),
          centerNode: groupNodes[0].id,
          cohesion: Math.random() * 0.5 + 0.5,
          description: `Cluster of ${type} nodes`,
          concepts: [type]
        });
      }
    }

    return clusters;
  }

  private async calculateAveragePathLength(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): Promise<number> {
    // Simplified calculation
    if (nodes.length <= 1) return 0;
    
    const estimatedPathLength = Math.log(nodes.length) / Math.log(2);
    return Math.min(estimatedPathLength, 10); // Cap at 10
  }

  private findMatchingNodes(nodes: KnowledgeNode[], query: GraphQuery): KnowledgeNode[] {
    return nodes.filter(node => {
      if (query.nodeId && node.id !== query.nodeId) return false;
      if (query.nodeType && node.type !== query.nodeType) return false;
      return true;
    });
  }

  private findMatchingEdges(edges: KnowledgeEdge[], query: GraphQuery): KnowledgeEdge[] {
    return edges.filter(edge => {
      if (query.edgeType && edge.type !== query.edgeType) return false;
      return true;
    });
  }

  private async findPaths(startNodeId: string, maxDepth: number, endNodeId?: string): Promise<any[]> {
    // Simplified path finding - in a full implementation, this would use graph algorithms
    return [];
  }

  private async applyChange(change: SemanticChange): Promise<void> {
    // Apply semantic change to relevant graphs
    for (const graph of this.graphCache.values()) {
      switch (change.type) {
        case 'add':
          if (change.nodeId) {
            // Add node logic
          }
          break;
        case 'remove':
          if (change.nodeId) {
            graph.nodes = graph.nodes.filter(n => n.id !== change.nodeId);
          }
          break;
        case 'update':
          if (change.nodeId && change.properties) {
            const node = graph.nodes.find(n => n.id === change.nodeId);
            if (node) {
              Object.assign(node.properties, change.properties);
            }
          }
          break;
      }
    }
  }

  private invalidateRelevantCaches(changes: SemanticChange[]): void {
    // Invalidate caches that might be affected by changes
    this.relationshipCache.clear();
    this.cacheManager.clear();
  }

  private removeDuplicateNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
    const seen = new Set<string>();
    return nodes.filter(node => {
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
  }

  private removeDuplicateEdges(edges: KnowledgeEdge[]): KnowledgeEdge[] {
    const seen = new Set<string>();
    return edges.filter(edge => {
      const key = `${edge.source}-${edge.target}-${edge.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private mergeSemanticLinks(existingEdges: KnowledgeEdge[], newLinks: SemanticLink[]): KnowledgeEdge[] {
    const edges = [...existingEdges];
    
    for (const link of newLinks) {
      edges.push({
        source: link.source,
        target: link.target,
        type: link.type,
        weight: link.semanticWeight,
        properties: {
          contextualRelevance: link.contextualRelevance
        }
      });
    }

    return edges;
  }

  private getCacheKey(context: SemanticContext): string {
    return `graph:${context.projectRoot}:${context.languageId}:${context.maxDepth}`;
  }
}