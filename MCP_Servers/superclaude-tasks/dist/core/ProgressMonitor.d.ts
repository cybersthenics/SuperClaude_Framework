import { ProgressReport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class ProgressMonitor {
    private logger;
    private progressData;
    constructor(logger: Logger);
    initializeTracking(taskId: string): Promise<void>;
    updateTaskProgress(taskId: string, progress: number): Promise<void>;
    getProgressReport(taskId: string): Promise<ProgressReport>;
    removeTracking(taskId: string): Promise<void>;
}
//# sourceMappingURL=ProgressMonitor.d.ts.map