import { Task, ComplexityAnalysis } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class ComplexityAnalyzer {
    private logger;
    constructor(logger: Logger);
    analyzeTask(task: Partial<Task>): Promise<ComplexityAnalysis>;
    private analyzeTechnicalComplexity;
    private analyzeBusinessComplexity;
    private analyzeIntegrationComplexity;
    private analyzeTestingComplexity;
    private calculateOverallComplexity;
    private identifyComplexityFactors;
}
//# sourceMappingURL=ComplexityAnalyzer.d.ts.map