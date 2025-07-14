export class HistoricalDataManager {
    logger;
    historicalData = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    async getSimilarTasks(task) {
        const taskType = task.type || 'feature';
        return this.historicalData.get(taskType) || [];
    }
    async recordTaskCompletion(completedTask, actualEffort) {
        const data = {
            taskId: completedTask.id,
            similarityScore: 1.0,
            actualEffort: actualEffort.hours,
            estimatedEffort: completedTask.estimatedEffort?.hours || 0,
            accuracy: this.calculateAccuracy(completedTask.estimatedEffort?.hours || 0, actualEffort.hours),
            context: {
                type: completedTask.type,
                complexity: completedTask.complexity,
                priority: completedTask.priority
            }
        };
        const existing = this.historicalData.get(completedTask.type) || [];
        existing.push(data);
        this.historicalData.set(completedTask.type, existing);
        this.logger.debug('Historical data recorded', { taskId: completedTask.id });
    }
    calculateAccuracy(estimated, actual) {
        if (estimated === 0 || actual === 0)
            return 0;
        return 1 - Math.abs(estimated - actual) / Math.max(estimated, actual);
    }
}
//# sourceMappingURL=HistoricalDataManager.js.map