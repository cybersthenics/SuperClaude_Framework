import { TaskDependency, ValidationResult } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class DependencyTracker {
    private logger;
    private dependencies;
    constructor(logger: Logger);
    updateDependencies(taskId: string, dependencies: TaskDependency[]): Promise<void>;
    removeDependencies(taskId: string): Promise<void>;
    getDependencies(taskId: string): Promise<TaskDependency[]>;
    validateDependencies(dependencies: TaskDependency[]): Promise<ValidationResult>;
}
//# sourceMappingURL=DependencyTracker.d.ts.map