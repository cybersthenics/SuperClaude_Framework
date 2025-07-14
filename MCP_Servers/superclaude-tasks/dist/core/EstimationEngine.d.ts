import { Task, TaskEstimation, EffortEstimate, ComplexityAnalysis, RiskAssessment, Risk, ProjectEstimation } from '../types/index.js';
import { HistoricalDataManager } from './HistoricalDataManager.js';
import { ComplexityAnalyzer } from './ComplexityAnalyzer.js';
import { RiskAssessor } from './RiskAssessor.js';
import { Logger } from '../utils/Logger.js';
export declare class EstimationEngine {
    private historicalDataManager;
    private complexityAnalyzer;
    private riskAssessor;
    private logger;
    private readonly baseEstimates;
    private readonly complexityMultipliers;
    constructor(historicalDataManager: HistoricalDataManager, complexityAnalyzer: ComplexityAnalyzer, riskAssessor: RiskAssessor, logger: Logger);
    estimateTaskEffort(task: Partial<Task>): Promise<TaskEstimation>;
    estimateProjectEffort(tasks: Task[]): Promise<ProjectEstimation>;
    analyzeComplexity(task: Partial<Task>): Promise<ComplexityAnalysis>;
    private inferComplexityFromTask;
    private calculateOverallComplexity;
    private identifyComplexityFactors;
    assessRisk(task: Partial<Task>, complexityAnalysis?: ComplexityAnalysis): Promise<RiskAssessment>;
    private simpleRiskAssessment;
    private gatherHistoricalData;
    private calculateBaselineEstimate;
    private applyRiskFactors;
    private calculateConfidence;
    private generateEstimationFactors;
    private analyzeProjectComplexity;
    private complexityToScore;
    private scoreToComplexity;
    private assessProjectRisks;
    private calculateProjectTimeline;
    private calculateResourceRequirements;
    updateEstimationModel(completedTask: Task, actualEffort: any): Promise<void>;
}
interface ProjectEstimation {
    totalEffort: EffortEstimate;
    timeline: any;
    resourceRequirements: any[];
    taskEstimations: TaskEstimation[];
    risks: Risk[];
    metadata: {
        taskCount: number;
        estimatedAt: Date;
        processingTime: number;
    };
}
export {};
//# sourceMappingURL=EstimationEngine.d.ts.map