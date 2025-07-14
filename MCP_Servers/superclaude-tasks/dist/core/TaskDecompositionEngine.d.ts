import { Task, TaskDecompositionStrategy } from '../types/index.js';
import { EstimationEngine } from './EstimationEngine.js';
import { Logger } from '../utils/Logger.js';
export declare class TaskDecompositionEngine {
    private estimationEngine;
    private logger;
    constructor(estimationEngine: EstimationEngine, logger: Logger);
    decomposeTask(task: Task, strategy: TaskDecompositionStrategy): Promise<Partial<Task>[]>;
    private functionalDecomposition;
    private temporalDecomposition;
    private complexityBasedDecomposition;
    private dependencyBasedDecomposition;
    private hybridDecomposition;
    private getPhaseType;
    private getPhaseComplexity;
    private deduplicateSubtasks;
}
//# sourceMappingURL=TaskDecompositionEngine.d.ts.map