export class DependencyTracker {
    logger;
    dependencies = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    async updateDependencies(taskId, dependencies) {
        this.dependencies.set(taskId, dependencies);
        this.logger.debug('Dependencies updated', { taskId, count: dependencies.length });
    }
    async removeDependencies(taskId) {
        this.dependencies.delete(taskId);
        this.logger.debug('Dependencies removed', { taskId });
    }
    async getDependencies(taskId) {
        return this.dependencies.get(taskId) || [];
    }
    async validateDependencies(dependencies) {
        const errors = [];
        for (const dep of dependencies) {
            if (dep.dependentTaskId === dep.dependencyTaskId) {
                errors.push('Task cannot depend on itself');
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings: [],
            suggestions: []
        };
    }
}
//# sourceMappingURL=DependencyTracker.js.map