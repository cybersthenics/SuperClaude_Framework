import { AgentId, WorkflowExecution, CoordinateWorkflowRequest, CoordinateWorkflowResult, DistributionPlan } from '../types/working.js';
import { SubAgentCoordinator } from './SubAgentCoordinator.js';
export interface WorkflowStrategy {
    type: 'sequential' | 'parallel' | 'hybrid';
    maxConcurrency: number;
    failureStrategy: 'stop' | 'continue' | 'retry';
    retryCount: number;
    timeout: number;
}
export interface WorkflowStep {
    id: string;
    taskId: string;
    agentId: AgentId;
    dependencies: string[];
    estimatedDuration: number;
    actualDuration?: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    startTime?: Date;
    endTime?: Date;
}
export interface WorkflowSchedule {
    workflowId: string;
    steps: WorkflowStep[];
    executionOrder: string[];
    parallelGroups: string[][];
    criticalPath: string[];
    estimatedDuration: number;
}
export declare class WorkflowOrchestrator {
    private logger;
    private coordinator;
    private activeWorkflows;
    private workflowSchedules;
    private workflowStrategies;
    constructor(coordinator: SubAgentCoordinator);
    createWorkflowSchedule(plan: DistributionPlan, strategy: WorkflowStrategy): Promise<WorkflowSchedule>;
    coordinateWorkflow(request: CoordinateWorkflowRequest): Promise<CoordinateWorkflowResult>;
    private createWorkflowSteps;
    private createExecutionOrder;
    private createSequentialOrder;
    private createParallelOrder;
    private createHybridOrder;
    private groupStepsByDependencies;
    private chunkArray;
    private calculateCriticalPath;
    private calculateEstimatedDuration;
    private createWorkflowExecution;
    private executeWorkflow;
    private executeWorkflowStrategy;
    private executeSequentialStrategy;
    private executeParallelStrategy;
    private executeHybridStrategy;
    private executeStep;
    private simulateStepExecution;
    private calculateResourceUsage;
    getWorkflowSchedule(workflowId: string): WorkflowSchedule | undefined;
    getWorkflowExecution(executionId: string): WorkflowExecution | undefined;
    getActiveWorkflows(): WorkflowExecution[];
    cancelWorkflow(executionId: string): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=WorkflowOrchestrator.d.ts.map