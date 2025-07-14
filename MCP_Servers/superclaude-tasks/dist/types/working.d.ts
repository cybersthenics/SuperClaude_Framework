export interface Task {
    id: string;
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'improvement' | 'research' | 'documentation' | 'maintenance' | 'test';
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled' | 'decomposed';
    priority: 'critical' | 'high' | 'medium' | 'low';
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    progress: number;
    estimatedEffort?: EffortEstimate;
    actualEffort?: EffortActual;
    parentId?: string;
    childrenIds: string[];
    dependencies: TaskDependency[];
    assignedTo?: string;
    metadata: TaskMetadata;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface EffortEstimate {
    hours: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    confidence: number;
    factors: string[];
}
export interface EffortActual {
    hours: number;
    startTime: Date;
    endTime: Date;
    timeLog: TimeLogEntry[];
    efficiency: number;
}
export interface TimeLogEntry {
    startTime: Date;
    endTime: Date;
    description: string;
    assignedTo?: string;
}
export interface TaskDependency {
    dependentTaskId: string;
    dependencyTaskId: string;
    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
    constraint: 'hard' | 'soft' | 'preferred';
    metadata: DependencyMetadata;
}
export interface DependencyMetadata {
    createdAt: Date;
    createdBy: string;
    reason?: string;
    estimatedDelay?: number;
}
export interface TaskMetadata {
    projectId: string;
    sessionId: string;
    createdBy: string;
    tags: string[];
    semanticContext?: Record<string, any>;
    performanceMetrics?: Record<string, any>;
    qualityMetrics?: Record<string, any>;
    customFields?: Record<string, any>;
}
export interface TaskEstimation {
    effort: EffortEstimate;
    confidence: number;
    factors: EstimationFactor[];
    historicalBasis: HistoricalData[];
    complexityAnalysis: ComplexityAnalysis;
    riskAssessment: RiskAssessment;
}
export interface EstimationFactor {
    name: string;
    impact: number;
    confidence: number;
    description: string;
}
export interface HistoricalData {
    taskId: string;
    similarityScore: number;
    actualEffort: number;
    estimatedEffort: number;
    accuracy: number;
    context: Record<string, any>;
}
export interface ComplexityAnalysis {
    overall: 'simple' | 'moderate' | 'complex' | 'very_complex';
    technical: number;
    business: number;
    integration: number;
    testing: number;
    factors: string[];
}
export interface RiskAssessment {
    overall: number;
    technical: number;
    resource: number;
    timeline: number;
    dependency: number;
    risks: Risk[];
}
export interface Risk {
    id: string;
    description: string;
    probability: number;
    impact: number;
    mitigation?: string;
    category: 'technical' | 'resource' | 'timeline' | 'dependency' | 'business';
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
export declare class ValidationError extends Error {
    code: string;
    details: Record<string, any>;
    suggestions: string[];
    constructor(message: string, code?: string, details?: Record<string, any>);
}
export interface CreateTaskRequest {
    title: string;
    description: string;
    type: 'feature' | 'bug' | 'improvement' | 'research' | 'documentation' | 'maintenance' | 'test';
    priority?: 'critical' | 'high' | 'medium' | 'low';
    estimatedEffort?: Partial<EffortEstimate>;
    parentId?: string;
    dependencies?: string[];
    metadata?: Partial<TaskMetadata>;
}
export interface CreateTaskResult {
    task: Task;
    estimationDetails: TaskEstimation;
    dependencyValidation: ValidationResult;
    metadata: {
        createdAt: Date;
        estimationAccuracy: number;
        suggestedDecomposition: boolean;
    };
}
export interface TaskDecompositionStrategy {
    type: 'functional' | 'temporal' | 'complexity' | 'dependency' | 'hybrid';
    maxDepth: number;
    minTaskSize: EffortEstimate;
    decompositionRules: any[];
}
export interface DecomposeTaskRequest {
    taskId: string;
    strategy: TaskDecompositionStrategy;
    options?: {
        preserveOriginalTask?: boolean;
        generateDependencies?: boolean;
        estimateSubtasks?: boolean;
    };
}
export interface DecomposeTaskResult {
    parentTask: Task;
    subtasks: Task[];
    decompositionSummary: {
        strategy: string;
        subtaskCount: number;
        totalEstimatedEffort: number;
        maxDepth: number;
        dependencies: number;
    };
    executionPlan: TaskExecutionPlan;
    metadata: {
        decomposedAt: Date;
        analysisComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
        decompositionTime: number;
    };
}
export interface TaskExecutionPlan {
    taskId: string;
    executionOrder: string[];
    parallelGroups: string[][];
    criticalPath: string[];
    estimatedDuration: number;
    resourceRequirements: any[];
}
export interface ProgressReport {
    taskId: string;
    overallProgress: number;
    phaseProgress: any[];
    milestones: any[];
    timeTracking: any;
    blockers: any[];
}
export interface TaskTree {
    task: Task;
    children: TaskTree[];
}
export interface TaskSchedule {
    tasks: Task[];
    schedule: any;
}
export declare const CreateTaskRequestSchema: {
    type: string;
    properties: {
        title: {
            type: string;
            minLength: number;
            maxLength: number;
        };
        description: {
            type: string;
            maxLength: number;
        };
        type: {
            type: string;
            enum: string[];
        };
        priority: {
            type: string;
            enum: string[];
            default: string;
        };
        parentId: {
            type: string;
            format: string;
        };
        dependencies: {
            type: string;
            items: {
                type: string;
                format: string;
            };
        };
        metadata: {
            type: string;
            properties: {
                projectId: {
                    type: string;
                };
                tags: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                semanticContext: {
                    type: string;
                };
            };
        };
    };
    required: string[];
};
export declare const DecomposeTaskRequestSchema: {
    type: string;
    properties: {
        taskId: {
            type: string;
            format: string;
        };
        strategy: {
            type: string;
            properties: {
                type: {
                    type: string;
                    enum: string[];
                };
                maxDepth: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                };
                minTaskSize: {
                    type: string;
                    minimum: number;
                    default: number;
                };
            };
            required: string[];
        };
        options: {
            type: string;
            properties: {
                preserveOriginalTask: {
                    type: string;
                    default: boolean;
                };
                generateDependencies: {
                    type: string;
                    default: boolean;
                };
                estimateSubtasks: {
                    type: string;
                    default: boolean;
                };
            };
        };
    };
    required: string[];
};
export declare const DistributeToSubAgentsRequestSchema: {
    type: string;
    properties: {
        taskId: {
            type: string;
            format: string;
        };
        strategy: {
            type: string;
            properties: {
                type: {
                    type: string;
                    enum: string[];
                };
                maxConcurrency: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                };
            };
            required: string[];
        };
    };
    required: string[];
};
export interface ProjectMemoryState {
    projectId: string;
    lastUpdated: Date;
    version: string;
    semanticCache: SemanticCache;
    symbolIndex: SymbolIndex;
    analysisHistory: AnalysisRecord[];
    taskHistory: TaskRecord[];
    performanceBaseline: PerformanceBaseline;
    contextSnapshots: ContextSnapshot[];
}
export interface SemanticCache {
    symbols: Map<string, SymbolInfo>;
    dependencies: Map<string, DependencyInfo>;
    patterns: Map<string, PatternInfo>;
    lastUpdated: Date;
}
export interface SymbolInfo {
    name: string;
    type: string;
    location: string;
    references: string[];
    lastModified: Date;
    usageCount: number;
}
export interface DependencyInfo {
    source: string;
    target: string;
    type: string;
    strength: number;
    lastUpdated: Date;
}
export interface PatternInfo {
    name: string;
    description: string;
    occurrences: string[];
    confidence: number;
    lastDetected: Date;
}
export interface SymbolIndex {
    files: Map<string, FileInfo>;
    symbols: Map<string, SymbolInfo>;
    lastUpdated: Date;
    version: string;
}
export interface FileInfo {
    path: string;
    lastModified: Date;
    symbols: string[];
    dependencies: string[];
    size: number;
}
export interface AnalysisRecord {
    id: string;
    type: string;
    timestamp: Date;
    findings: Record<string, unknown>;
    confidence: number;
    metadata: Record<string, unknown>;
}
export interface TaskRecord {
    taskId: string;
    action: string;
    timestamp: Date;
    details: Record<string, unknown>;
    userId?: string;
}
export interface PerformanceBaseline {
    averageTaskTime: number;
    estimationAccuracy: number;
    resourceUtilization: number;
    throughput: number;
    lastUpdated: Date;
}
export interface ContextSnapshot {
    id: string;
    projectId: string;
    description: string;
    timestamp: Date;
    size: number;
    compressed: boolean;
    metadata: Record<string, any>;
}
export type AgentId = string;
export interface SubAgentInfo {
    id: AgentId;
    name: string;
    capabilities: string[];
    status: 'idle' | 'busy' | 'offline' | 'error';
    currentTask?: string;
    performanceMetrics: AgentPerformanceMetrics;
    lastHeartbeat: Date;
}
export interface AgentPerformanceMetrics {
    tasksCompleted: number;
    averageTaskTime: number;
    successRate: number;
    errorRate: number;
    loadAverage: number;
    lastUpdated: Date;
}
export interface DistributionStrategy {
    type: 'files' | 'folders' | 'tasks' | 'capabilities' | 'auto';
    maxConcurrency: number;
    loadBalancing: boolean;
    specialization: string[];
    timeout: number;
}
export interface DistributionPlan {
    taskId: string;
    subTasks: SubTaskDistribution[];
    estimatedCompletion: Date;
    resourceAllocation: ResourceAllocation[];
    fallbackPlan: FallbackPlan;
}
export interface SubTaskDistribution {
    subTaskId: string;
    agentId: AgentId;
    estimatedEffort: number;
    priority: number;
    dependencies: string[];
    deadline?: Date;
}
export interface ResourceAllocation {
    agentId: AgentId;
    resourceType: 'cpu' | 'memory' | 'storage' | 'network';
    allocated: number;
    maximum: number;
    unit: string;
}
export interface FallbackPlan {
    triggers: string[];
    actions: FallbackAction[];
    maxRetries: number;
    timeoutMs: number;
}
export interface FallbackAction {
    type: 'redistribute' | 'retry' | 'escalate' | 'abort';
    parameters: Record<string, any>;
    condition: string;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    progress: number;
    results: WorkflowResult[];
    errors: WorkflowError[];
}
export interface WorkflowResult {
    taskId: string;
    agentId: AgentId;
    status: 'success' | 'failure' | 'timeout';
    result: any;
    duration: number;
    metadata: Record<string, any>;
}
export interface WorkflowError {
    taskId: string;
    agentId: AgentId;
    error: string;
    timestamp: Date;
    recoverable: boolean;
    retryCount: number;
}
export interface CoordinationMetrics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
    resourceUtilization: number;
    agentEfficiency: Record<AgentId, number>;
    throughput: number;
    lastUpdated: Date;
}
export interface DistributeToSubAgentsRequest {
    taskId: string;
    strategy: DistributionStrategy;
    agents?: AgentId[];
    priority?: number;
    deadline?: Date;
}
export interface DistributeToSubAgentsResult {
    distributionPlan: DistributionPlan;
    workflowExecution: WorkflowExecution;
    coordinationMetrics: CoordinationMetrics;
    estimatedCompletion: Date;
}
export interface CoordinateWorkflowRequest {
    workflowId: string;
    strategy: 'sequential' | 'parallel' | 'hybrid';
    maxConcurrency: number;
    timeout: number;
    failureStrategy: 'stop' | 'continue' | 'retry';
}
export interface CoordinateWorkflowResult {
    workflowExecution: WorkflowExecution;
    completedTasks: number;
    failedTasks: number;
    totalDuration: number;
    resourcesUsed: ResourceAllocation[];
}
//# sourceMappingURL=working.d.ts.map