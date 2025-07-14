import { Task, HistoricalData } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class HistoricalDataManager {
    private logger;
    private historicalData;
    constructor(logger: Logger);
    getSimilarTasks(task: Partial<Task>): Promise<HistoricalData[]>;
    recordTaskCompletion(completedTask: Task, actualEffort: any): Promise<void>;
    private calculateAccuracy;
}
//# sourceMappingURL=HistoricalDataManager.d.ts.map