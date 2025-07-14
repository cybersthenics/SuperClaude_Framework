import { Task, RiskAssessment, ComplexityAnalysis } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class RiskAssessor {
    private logger;
    constructor(logger: Logger);
    assessTask(task: Partial<Task>, complexityAnalysis?: ComplexityAnalysis): Promise<RiskAssessment>;
}
//# sourceMappingURL=RiskAssessor.d.ts.map