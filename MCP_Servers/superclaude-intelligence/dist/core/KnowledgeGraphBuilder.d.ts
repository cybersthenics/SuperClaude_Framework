import { KnowledgeGraph, KnowledgeNode, KnowledgeEdge, SemanticCluster, SemanticContext, SymbolInformation, Relationship, SemanticLink, GraphQuery, GraphResult, SemanticChange, OptimizationResult } from '../types/index.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';
import { SymbolIndexer } from './SymbolIndexer.js';
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
export declare class KnowledgeGraphBuilder {
    private semanticAnalyzer;
    private symbolIndexer;
    private graphCache;
    private relationshipCache;
    private cacheManager;
    constructor(semanticAnalyzer: SemanticAnalyzer, symbolIndexer: SymbolIndexer);
    buildKnowledgeGraph(context: SemanticContext): Promise<KnowledgeGraph>;
    addSemanticRelationships(symbols: SymbolInformation[]): Promise<void>;
    queryGraph(query: GraphQuery): Promise<GraphResult>;
    updateGraph(changes: SemanticChange[]): Promise<void>;
    optimizeGraph(): Promise<OptimizationResult>;
    identifyRelationships(symbols: SymbolInformation[]): Promise<Relationship[]>;
    createSemanticLinks(relationships: Relationship[]): Promise<SemanticLink[]>;
    calculateSemanticDistance(symbolA: string, symbolB: string): Promise<number>;
    detectClusters(): Promise<SemanticCluster[]>;
    private buildNodes;
    private buildEdges;
    private calculateGraphMetrics;
    private findSymbolAtLocation;
    private calculateSemanticWeight;
    private calculateContextualRelevance;
    private generateNodeId;
    private getNodeType;
    private calculateNodeSemanticWeight;
    private calculateCentrality;
    private mapDependencyTypeToSemanticType;
    private clusterNodes;
    private calculateAveragePathLength;
    private findMatchingNodes;
    private findMatchingEdges;
    private findPaths;
    private applyChange;
    private invalidateRelevantCaches;
    private removeDuplicateNodes;
    private removeDuplicateEdges;
    private mergeSemanticLinks;
    private getCacheKey;
}
//# sourceMappingURL=KnowledgeGraphBuilder.d.ts.map