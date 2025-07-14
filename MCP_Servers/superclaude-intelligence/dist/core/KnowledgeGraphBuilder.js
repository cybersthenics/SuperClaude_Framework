import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';
export class KnowledgeGraphBuilder {
    semanticAnalyzer;
    symbolIndexer;
    graphCache = new Map();
    relationshipCache = new Map();
    cacheManager;
    constructor(semanticAnalyzer, symbolIndexer) {
        this.semanticAnalyzer = semanticAnalyzer;
        this.symbolIndexer = symbolIndexer;
        this.cacheManager = new CacheManager({
            maxSize: 100,
            ttl: 600000
        });
    }
    async buildKnowledgeGraph(context) {
        const startTime = Date.now();
        const cacheKey = this.getCacheKey(context);
        const cached = this.cacheManager.get(cacheKey);
        if (cached) {
            logger.debug(`Knowledge graph cache hit for ${context.projectRoot}`);
            return cached;
        }
        try {
            const analysis = await this.semanticAnalyzer.analyzeCode(context);
            const nodes = await this.buildNodes(analysis.symbols, context);
            const edges = await this.buildEdges(analysis.symbols, analysis.dependencies, context);
            const clusters = await this.detectClusters(nodes, edges);
            const metrics = await this.calculateGraphMetrics(nodes, edges, clusters);
            const knowledgeGraph = {
                nodes,
                edges,
                clusters,
                metrics
            };
            this.cacheManager.set(cacheKey, knowledgeGraph);
            logger.info(`Knowledge graph built for ${context.projectRoot}`, {
                nodeCount: nodes.length,
                edgeCount: edges.length,
                clusterCount: clusters.length,
                executionTime: Date.now() - startTime
            });
            return knowledgeGraph;
        }
        catch (error) {
            logger.error(`Knowledge graph building failed for ${context.projectRoot}`, error);
            throw error;
        }
    }
    async addSemanticRelationships(symbols) {
        const relationships = await this.identifyRelationships(symbols);
        const semanticLinks = await this.createSemanticLinks(relationships);
        for (const [cacheKey, graph] of this.graphCache) {
            const updatedEdges = this.mergeSemanticLinks(graph.edges, semanticLinks);
            graph.edges = updatedEdges;
            this.graphCache.set(cacheKey, graph);
        }
        logger.debug(`Added ${semanticLinks.length} semantic relationships`);
    }
    async queryGraph(query) {
        const startTime = Date.now();
        const results = {
            nodes: [],
            edges: [],
            paths: [],
            metrics: {}
        };
        try {
            for (const graph of this.graphCache.values()) {
                const matchingNodes = this.findMatchingNodes(graph.nodes, query);
                const matchingEdges = this.findMatchingEdges(graph.edges, query);
                results.nodes.push(...matchingNodes);
                results.edges.push(...matchingEdges);
            }
            if (query.maxDepth && query.nodeId) {
                results.paths = await this.findPaths(query.nodeId, query.maxDepth);
            }
            results.metrics = {
                executionTime: Date.now() - startTime,
                nodesFound: results.nodes.length,
                edgesFound: results.edges.length,
                pathsFound: results.paths.length
            };
            logger.debug(`Graph query completed`, results.metrics);
            return results;
        }
        catch (error) {
            logger.error(`Graph query failed`, error);
            throw error;
        }
    }
    async updateGraph(changes) {
        const startTime = Date.now();
        let changesApplied = 0;
        try {
            for (const change of changes) {
                await this.applyChange(change);
                changesApplied++;
            }
            this.invalidateRelevantCaches(changes);
            logger.debug(`Applied ${changesApplied} graph changes`, {
                executionTime: Date.now() - startTime
            });
        }
        catch (error) {
            logger.error(`Graph update failed`, error);
            throw error;
        }
    }
    async optimizeGraph() {
        const startTime = Date.now();
        let nodesOptimized = 0;
        let edgesOptimized = 0;
        let clustersCreated = 0;
        try {
            for (const [cacheKey, graph] of this.graphCache) {
                const uniqueNodes = this.removeDuplicateNodes(graph.nodes);
                nodesOptimized += graph.nodes.length - uniqueNodes.length;
                graph.nodes = uniqueNodes;
                const uniqueEdges = this.removeDuplicateEdges(graph.edges);
                edgesOptimized += graph.edges.length - uniqueEdges.length;
                graph.edges = uniqueEdges;
                const newClusters = await this.detectClusters(graph.nodes, graph.edges);
                clustersCreated += newClusters.length;
                graph.clusters = newClusters;
                graph.metrics = await this.calculateGraphMetrics(graph.nodes, graph.edges, graph.clusters);
                this.graphCache.set(cacheKey, graph);
            }
            const result = {
                nodesOptimized,
                edgesOptimized,
                clustersCreated,
                executionTime: Date.now() - startTime
            };
            logger.info(`Graph optimization completed`, result);
            return result;
        }
        catch (error) {
            logger.error(`Graph optimization failed`, error);
            throw error;
        }
    }
    async identifyRelationships(symbols) {
        const relationships = [];
        for (const symbol of symbols) {
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
    async createSemanticLinks(relationships) {
        const semanticLinks = [];
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
    async calculateSemanticDistance(symbolA, symbolB) {
        const paths = await this.findPaths(symbolA, 10, symbolB);
        if (paths.length === 0) {
            return Infinity;
        }
        return Math.min(...paths.map(path => path.length));
    }
    async detectClusters() {
        const clusters = [];
        for (const [cacheKey, graph] of this.graphCache) {
            const graphClusters = await this.clusterNodes(graph.nodes, graph.edges);
            clusters.push(...graphClusters);
        }
        return clusters;
    }
    async buildNodes(symbols, context) {
        const nodes = [];
        for (const symbol of symbols) {
            const node = {
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
                centrality: 0
            };
            nodes.push(node);
        }
        await this.calculateCentrality(nodes);
        return nodes;
    }
    async buildEdges(symbols, dependencies, context) {
        const edges = [];
        for (const depEdge of dependencies.edges) {
            const edge = {
                source: depEdge.source,
                target: depEdge.target,
                type: this.mapDependencyTypeToSemanticType(depEdge.type),
                weight: depEdge.weight,
                properties: depEdge.metadata
            };
            edges.push(edge);
        }
        const relationships = await this.identifyRelationships(symbols);
        for (const relationship of relationships) {
            const edge = {
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
    async calculateGraphMetrics(nodes, edges, clusters) {
        const nodeCount = nodes.length;
        const edgeCount = edges.length;
        const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
        const averagePathLength = await this.calculateAveragePathLength(nodes, edges);
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
    async findSymbolAtLocation(location) {
        return await this.semanticAnalyzer.resolveSymbol(location.uri, location.range.start);
    }
    calculateSemanticWeight(relationship) {
        const typeWeights = {
            'inherits': 1.0,
            'implements': 0.8,
            'contains': 0.9,
            'references': 0.3,
            'calls': 0.4,
            'depends_on': 0.5
        };
        return typeWeights[relationship.type] || 0.1;
    }
    async calculateContextualRelevance(relationship) {
        return Math.random() * 0.5 + 0.5;
    }
    generateNodeId(symbol) {
        return `${symbol.location.uri}:${symbol.name}:${symbol.kind}`;
    }
    getNodeType(symbol) {
        switch (symbol.kind) {
            case 1:
            case 2:
            case 3:
                return 'module';
            case 5:
            case 11:
                return 'type';
            default:
                return 'symbol';
        }
    }
    calculateNodeSemanticWeight(symbol) {
        let weight = 0.5;
        switch (symbol.kind) {
            case 5:
                weight += 0.3;
                break;
            case 12:
            case 6:
                weight += 0.2;
                break;
            case 11:
                weight += 0.25;
                break;
        }
        if (symbol.documentation) {
            weight += 0.1;
        }
        if (symbol.references.length > 5) {
            weight += 0.1;
        }
        return Math.min(weight, 1.0);
    }
    async calculateCentrality(nodes) {
        nodes.forEach(node => {
            node.centrality = Math.random();
        });
    }
    mapDependencyTypeToSemanticType(depType) {
        const mapping = {
            'import': 'structural',
            'extends': 'inheritance',
            'implements': 'inheritance',
            'calls': 'functional',
            'references': 'semantic'
        };
        return mapping[depType] || 'semantic';
    }
    async clusterNodes(nodes, edges) {
        const clusters = [];
        const typeGroups = new Map();
        nodes.forEach(node => {
            if (!typeGroups.has(node.type)) {
                typeGroups.set(node.type, []);
            }
            typeGroups.get(node.type).push(node);
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
    async calculateAveragePathLength(nodes, edges) {
        if (nodes.length <= 1)
            return 0;
        const estimatedPathLength = Math.log(nodes.length) / Math.log(2);
        return Math.min(estimatedPathLength, 10);
    }
    findMatchingNodes(nodes, query) {
        return nodes.filter(node => {
            if (query.nodeId && node.id !== query.nodeId)
                return false;
            if (query.nodeType && node.type !== query.nodeType)
                return false;
            return true;
        });
    }
    findMatchingEdges(edges, query) {
        return edges.filter(edge => {
            if (query.edgeType && edge.type !== query.edgeType)
                return false;
            return true;
        });
    }
    async findPaths(startNodeId, maxDepth, endNodeId) {
        return [];
    }
    async applyChange(change) {
        for (const graph of this.graphCache.values()) {
            switch (change.type) {
                case 'add':
                    if (change.nodeId) {
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
    invalidateRelevantCaches(changes) {
        this.relationshipCache.clear();
        this.cacheManager.clear();
    }
    removeDuplicateNodes(nodes) {
        const seen = new Set();
        return nodes.filter(node => {
            if (seen.has(node.id))
                return false;
            seen.add(node.id);
            return true;
        });
    }
    removeDuplicateEdges(edges) {
        const seen = new Set();
        return edges.filter(edge => {
            const key = `${edge.source}-${edge.target}-${edge.type}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    mergeSemanticLinks(existingEdges, newLinks) {
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
    getCacheKey(context) {
        return `graph:${context.projectRoot}:${context.languageId}:${context.maxDepth}`;
    }
}
//# sourceMappingURL=KnowledgeGraphBuilder.js.map