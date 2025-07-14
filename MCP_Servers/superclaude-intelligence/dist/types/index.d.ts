import { Position, Location, Range, SymbolKind } from 'vscode-languageserver-protocol';
export interface IntelligenceServerConfig {
    serverName: "superclaude-intelligence";
    capabilities: ["tools", "resources", "prompts"];
    lsp: {
        enableMultiLanguageSupport: boolean;
        supportedLanguages: string[];
        maxConcurrentServers: number;
        serverStartupTimeout: number;
        enableIncrementalSync: boolean;
    };
    semantic: {
        enableSymbolIndexing: boolean;
        enableTypeInference: boolean;
        enableCrossFileAnalysis: boolean;
        symbolCacheSize: number;
        indexUpdateBatchSize: number;
    };
    performance: {
        maxAnalysisTime: number;
        enableResultCaching: boolean;
        cacheTTL: number;
        enableBatchOperations: boolean;
        maxMemoryUsage: number;
    };
    projectMemory: {
        enablePersistence: boolean;
        persistenceInterval: number;
        maxContextSize: number;
        enableIncrementalUpdates: boolean;
    };
}
export interface SemanticContext {
    projectRoot: string;
    languageId: string;
    fileUri: string;
    position?: Position;
    includeReferences: boolean;
    includeImplementations: boolean;
    maxDepth: number;
}
export interface TypeInformation {
    typeName: string;
    typeParameters: TypeParameter[];
    baseTypes: string[];
    interfaces: string[];
    properties: PropertyInformation[];
    methods: MethodInformation[];
    isGeneric: boolean;
    isNullable: boolean;
}
export interface TypeParameter {
    name: string;
    constraints: string[];
    defaultValue?: string;
}
export interface PropertyInformation {
    name: string;
    type: string;
    isOptional: boolean;
    isReadonly: boolean;
    documentation?: string;
}
export interface MethodInformation {
    name: string;
    parameters: ParameterInformation[];
    returnType: string;
    isAsync: boolean;
    isStatic: boolean;
    documentation?: string;
}
export interface ParameterInformation {
    name: string;
    type: string;
    isOptional: boolean;
    defaultValue?: string;
    documentation?: string;
}
export interface SymbolInformation {
    name: string;
    kind: SymbolKind;
    location: Location;
    containerName?: string;
    typeInformation: TypeInformation;
    documentation?: string;
    references: Location[];
    implementations: Location[];
    hierarchy: SymbolHierarchy;
}
export interface SymbolHierarchy {
    parent?: SymbolInformation;
    children: SymbolInformation[];
    siblings: SymbolInformation[];
    depth: number;
}
export interface SemanticAnalysisResult {
    symbols: SymbolInformation[];
    types: TypeInformation[];
    dependencies: DependencyGraph;
    patterns: PatternMatch[];
    insights: AnalysisInsight[];
    executionPaths: ExecutionPath[];
    knowledgeGraph: KnowledgeGraph;
    confidence: number;
}
export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
    metrics: DependencyMetrics;
}
export interface DependencyNode {
    id: string;
    name: string;
    type: 'file' | 'module' | 'class' | 'function' | 'variable';
    location: Location;
    metadata: Record<string, any>;
}
export interface DependencyEdge {
    source: string;
    target: string;
    type: 'import' | 'extends' | 'implements' | 'calls' | 'references';
    weight: number;
    metadata: Record<string, any>;
}
export interface DependencyMetrics {
    nodeCount: number;
    edgeCount: number;
    cyclomaticComplexity: number;
    couplingMetrics: CouplingMetrics;
    cohesionMetrics: CohesionMetrics;
}
export interface CouplingMetrics {
    afferentCoupling: number;
    efferentCoupling: number;
    instability: number;
    abstractness: number;
}
export interface CohesionMetrics {
    lcom: number;
    lcom4: number;
    tcc: number;
    lcc: number;
}
export interface PatternMatch {
    pattern: string;
    confidence: number;
    location: Location;
    description: string;
    suggestions: string[];
}
export interface AnalysisInsight {
    type: 'warning' | 'info' | 'error' | 'suggestion';
    title: string;
    description: string;
    location?: Location;
    severity: number;
    actionable: boolean;
    relatedSymbols: string[];
}
export interface ExecutionPath {
    id: string;
    startLocation: Location;
    endLocation: Location;
    steps: ExecutionStep[];
    complexity: number;
    conditions: ConditionNode[];
}
export interface ExecutionStep {
    location: Location;
    type: 'call' | 'assignment' | 'condition' | 'loop' | 'return';
    description: string;
    symbolsInvolved: string[];
}
export interface ConditionNode {
    location: Location;
    condition: string;
    truePath: string[];
    falsePath: string[];
    probability: number;
}
export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    clusters: SemanticCluster[];
    metrics: GraphMetrics;
}
export interface KnowledgeNode {
    id: string;
    type: 'symbol' | 'type' | 'module' | 'concept';
    name: string;
    properties: Record<string, any>;
    semanticWeight: number;
    centrality: number;
}
export interface KnowledgeEdge {
    source: string;
    target: string;
    type: 'semantic' | 'structural' | 'functional' | 'inheritance';
    weight: number;
    properties: Record<string, any>;
}
export interface SemanticCluster {
    id: string;
    nodes: string[];
    centerNode: string;
    cohesion: number;
    description: string;
    concepts: string[];
}
export interface GraphMetrics {
    nodeCount: number;
    edgeCount: number;
    density: number;
    averagePathLength: number;
    clusteringCoefficient: number;
    centralityDistribution: CentralityDistribution;
}
export interface CentralityDistribution {
    betweenness: number[];
    closeness: number[];
    degree: number[];
    eigenvector: number[];
}
export interface LanguageServerConfig {
    language: string;
    serverId: string;
    command: string;
    args: string[];
    initializationOptions: any;
    capabilities: LanguageServerCapabilities;
    healthCheckInterval: number;
    maxRestartAttempts: number;
}
export interface LanguageServerCapabilities {
    textDocumentSync: any;
    hoverProvider: boolean;
    completionProvider: any;
    signatureHelpProvider: any;
    definitionProvider: boolean;
    referencesProvider: boolean;
    documentSymbolProvider: boolean;
    workspaceSymbolProvider: boolean;
    implementationProvider: boolean;
    typeDefinitionProvider: boolean;
    renameProvider?: boolean;
    codeActionProvider?: boolean;
    inlayHintProvider?: boolean;
}
export interface LanguageServerInstance {
    serverId: string;
    process: any;
    connection: any;
    capabilities: any;
    status: ServerStatus;
    metrics: ServerMetrics;
    lastHeartbeat: Date;
}
export interface ServerStatus {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    pid?: number;
    startTime?: Date;
    lastError?: Error;
    restartCount: number;
}
export interface ServerMetrics {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface ProjectMemoryState {
    projectId: string;
    lastUpdated: Date;
    symbolIndex: SymbolIndex | null;
    typeCache: TypeCache | null;
    dependencyGraph: DependencyGraph | null;
    analysisHistory: AnalysisRecord[];
    contextPreservation: ContextSnapshot[];
}
export interface SymbolIndex {
    symbols: Map<string, SymbolInformation>;
    byType: Map<SymbolKind, SymbolInformation[]>;
    byFile: Map<string, SymbolInformation[]>;
    bloomFilter: any;
    lastUpdate: Date;
    size: number;
}
export interface TypeCache {
    types: Map<string, TypeInformation>;
    hierarchies: Map<string, TypeHierarchy>;
    lastUpdate: Date;
    size: number;
}
export interface TypeHierarchy {
    baseType: string;
    derivedTypes: string[];
    interfaces: string[];
    depth: number;
}
export interface AnalysisRecord {
    id: string;
    timestamp: Date;
    type: string;
    context: SemanticContext;
    result: SemanticAnalysisResult;
    performance: PerformanceMetrics;
}
export interface ContextSnapshot {
    timestamp: Date;
    context: Record<string, any>;
    compressedData: Buffer;
    metadata: SnapshotMetadata;
}
export interface SnapshotMetadata {
    version: string;
    compressionType: string;
    originalSize: number;
    compressedSize: number;
    checksum: string;
}
export interface PerformanceMetrics {
    duration: number;
    memoryUsage: number;
    cacheHitRate: number;
    operationCount: number;
    errors: number;
}
export interface FindSymbolDefinitionArgs {
    uri: string;
    position: Position;
    includeDeclaration?: boolean;
    includeTypeDefinition?: boolean;
}
export interface DefinitionResult {
    definitions: EnhancedDefinition[];
    typeDefinitions: Location[];
    metadata: OperationMetadata;
}
export interface EnhancedDefinition {
    location: Location;
    symbolInfo: SymbolInformation;
    typeInformation: TypeInformation;
    documentation?: string;
}
export interface FindAllReferencesArgs {
    uri: string;
    position: Position;
    includeDeclaration?: boolean;
    includeWriteAccess?: boolean;
    maxResults?: number;
}
export interface ReferencesResult {
    symbol: SymbolInformation;
    references: Location[];
    groupedByFile: Map<string, Location[]>;
    analysis: ReferenceAnalysis;
    metadata: OperationMetadata;
}
export interface ReferenceAnalysis {
    readReferences: Location[];
    writeReferences: Location[];
    usagePatterns: UsagePattern[];
    hotspots: Location[];
}
export interface UsagePattern {
    pattern: string;
    frequency: number;
    locations: Location[];
    description: string;
}
export interface OperationMetadata {
    language?: string;
    processingTime: number;
    symbolCount?: number;
    totalFound?: number;
    returned?: number;
    truncated?: boolean;
    found?: boolean;
    hasDocumentation?: boolean;
    hasMore?: boolean;
    fileSize?: number;
    complexity?: number;
}
export interface ReasoningContext {
    problem: Problem;
    evidence: Evidence[];
    constraints: Constraint[];
    goals: Goal[];
    assumptions: Assumption[];
}
export interface Problem {
    id: string;
    type: string;
    description: string;
    context: SemanticContext;
    complexity: number;
    domain: string[];
}
export interface Evidence {
    id: string;
    type: 'code' | 'documentation' | 'test' | 'metric' | 'pattern';
    source: Location;
    content: any;
    reliability: number;
    timestamp: Date;
}
export interface Constraint {
    id: string;
    type: string;
    description: string;
    weight: number;
    enforced: boolean;
}
export interface Goal {
    id: string;
    description: string;
    priority: number;
    measurable: boolean;
    criteria: string[];
}
export interface Assumption {
    id: string;
    description: string;
    confidence: number;
    dependencies: string[];
    validationMethod: string;
}
export interface ReasoningResult {
    hypotheses: Hypothesis[];
    selectedHypothesis: Hypothesis;
    reasoning: ReasoningChain;
    confidence: number;
    recommendations: Recommendation[];
    evidence: Evidence[];
}
export interface Hypothesis {
    id: string;
    description: string;
    confidence: number;
    evidence: Evidence[];
    implications: string[];
    testable: boolean;
}
export interface ReasoningChain {
    steps: ReasoningStep[];
    totalConfidence: number;
    reasoning: string;
    alternativePaths: ReasoningStep[][];
}
export interface ReasoningStep {
    id: string;
    type: string;
    description: string;
    input: any;
    output: any;
    confidence: number;
    reasoning: string;
}
export interface Recommendation {
    id: string;
    type: string;
    description: string;
    priority: number;
    effort: number;
    impact: number;
    actions: Action[];
}
export interface Action {
    id: string;
    type: string;
    description: string;
    parameters: Record<string, any>;
    dependencies: string[];
    estimatedTime: number;
}
export interface AnalyzeCodeStructureArgs {
    uri: string;
    includeSemantics?: boolean;
    includeDependencies?: boolean;
    includePatterns?: boolean;
    maxDepth?: number;
}
export interface BuildKnowledgeGraphArgs {
    projectRoot: string;
    includeTypes?: boolean;
    includeInheritance?: boolean;
    includeUsage?: boolean;
    maxNodes?: number;
    maxDepth?: number;
}
export interface SaveProjectContextArgs {
    projectId: string;
    context: any;
    options?: {
        compressionLevel?: number;
        includeSymbolIndex?: boolean;
        includeTypeCache?: boolean;
        includeDependencyGraph?: boolean;
    };
}
export interface LoadProjectContextArgs {
    projectId: string;
    options?: {
        validateIntegrity?: boolean;
        updateIndexes?: boolean;
        maxAge?: number;
    };
}
export interface GetSymbolTypeInfoArgs {
    uri: string;
    position: Position;
    includeHierarchy?: boolean;
    includeMembers?: boolean;
    includeDocumentation?: boolean;
}
export interface GetHoverInfoArgs {
    uri: string;
    position: Position;
    includeExamples?: boolean;
    includeRelated?: boolean;
}
export interface GetCodeCompletionsArgs {
    uri: string;
    position: Position;
    maxResults?: number;
    includeSnippets?: boolean;
    includeDocumentation?: boolean;
}
export interface Insight {
    type: 'warning' | 'info' | 'error' | 'suggestion';
    title: string;
    description: string;
    location?: Location;
    severity: number;
    actionable: boolean;
    relatedSymbols: string[];
}
export interface SymbolQuery {
    name?: string;
    kind?: SymbolKind;
    fileUri?: string;
    fuzzy?: boolean;
    maxResults?: number;
    includeReferences?: boolean;
}
export interface SymbolMatch {
    symbol: SymbolInformation;
    score: number;
    matchType: 'exact' | 'prefix' | 'fuzzy';
}
export interface IndexResult {
    symbolCount: number;
    fileCount: number;
    duration: number;
    errors: string[];
}
export interface UpdateResult {
    updatedSymbols: number;
    removedSymbols: number;
    addedSymbols: number;
    duration: number;
}
export interface FileChange {
    uri: string;
    type: 'created' | 'modified' | 'deleted';
    content?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface MemoryChange {
    type: 'symbol_added' | 'symbol_removed' | 'symbol_updated' | 'analysis_added' | 'context_updated';
    data: any;
    timestamp: Date;
}
export interface ProjectInsight {
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    timestamp: Date;
    metadata: Record<string, any>;
}
export interface RetentionPolicy {
    maxAgeMs: number;
    maxSize: number;
    cleanupThreshold: number;
}
export interface SerializedContext {
    version: string;
    data: Buffer;
    metadata: Record<string, any>;
}
export interface CompressedState {
    originalSize: number;
    compressedSize: number;
    data: Buffer;
    checksum: string;
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
export interface LSPConnectionPool {
    connections: Map<string, LanguageServerInstance[]>;
    activeConnections: Map<string, LanguageServerInstance>;
    connectionMetrics: Map<string, ConnectionMetrics>;
    maxPoolSize: number;
    healthCheckInterval: number;
}
export interface ConnectionMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    averageUsage: number;
    lastUsed: Date;
    connectionAge: number;
}
export interface LSPPerformanceMetrics {
    tokenReduction: TokenReductionMetrics;
    cachePerformance: CachePerformanceMetrics;
    analysisTime: AnalysisTimeMetrics;
    resourceUsage: ResourceUsageMetrics;
}
export interface TokenReductionMetrics {
    originalTokens: number;
    reducedTokens: number;
    reductionPercentage: number;
    symbolsExtracted: number;
    structuralAnalysisGain: number;
}
export interface CachePerformanceMetrics {
    hitRate: number;
    missRate: number;
    totalLookups: number;
    averageLookupTime: number;
    cacheSize: number;
    evictionCount: number;
}
export interface AnalysisTimeMetrics {
    semanticAnalysisTime: number;
    symbolResolutionTime: number;
    typeInferenceTime: number;
    crossReferenceTime: number;
    totalAnalysisTime: number;
}
export interface ResourceUsageMetrics {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
    concurrentConnections: number;
}
export interface ConnectionOptimizationResult {
    optimizations: ConnectionOptimization[];
    totalConnectionsAfter: number;
    memoryReduced: number;
    performanceImprovement: number;
}
export interface ConnectionOptimization {
    type: 'removed_unhealthy' | 'removed_excess' | 'pooled_connection' | 'reused_connection';
    language: string;
    connectionId: string;
    improvement?: number;
}
export interface IncrementalUpdateTask {
    uri: string;
    changes: DocumentChange[];
    priority: number;
    timestamp: Date;
    processed: boolean;
}
export interface DocumentChange {
    range?: Range;
    text: string;
    rangeLength?: number;
}
export interface SemanticCacheEntry {
    key: string;
    result: SemanticAnalysisResult;
    metadata: CacheEntryMetadata;
    ttl: number;
    created: Date;
    lastAccessed: Date;
}
export interface CacheEntryMetadata {
    language: string;
    fileUri: string;
    symbolCount: number;
    analysisTime: number;
    tokenReduction: number;
    dependencies: string[];
}
export interface LSPBatchRequest {
    id: string;
    language: string;
    method: string;
    params: any;
    priority: number;
}
export interface LSPBatchResult {
    results: Map<string, any>;
    errors: Map<string, Error>;
    totalTime: number;
    successCount: number;
    failureCount: number;
}
export interface SymbolIndexingResult {
    indexedSymbols: number;
    indexingTime: number;
    cacheHits: number;
    cacheMisses: number;
    errors: IndexingError[];
}
export interface IndexingError {
    file: string;
    error: string;
    severity: 'warning' | 'error';
    line?: number;
    column?: number;
}
export interface LanguageServerHealth {
    language: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    uptime: number;
}
export interface LSPRequestMetrics {
    method: string;
    language: string;
    requestCount: number;
    averageTime: number;
    successRate: number;
    lastUsed: Date;
}
export interface SemanticAnalysisConfig {
    enableTokenReduction: boolean;
    tokenReductionTarget: number;
    enableIncrementalUpdates: boolean;
    incrementalUpdateTimeout: number;
    enableSymbolCaching: boolean;
    symbolCacheTTL: number;
    enableBatchProcessing: boolean;
    batchSize: number;
}
export interface LSPIntegrationMetrics {
    totalServers: number;
    activeServers: number;
    totalRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    tokenReductionRate: number;
    errorRate: number;
    uptime: number;
}
//# sourceMappingURL=index.d.ts.map