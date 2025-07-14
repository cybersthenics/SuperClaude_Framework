export class ProgressMonitor {
    logger;
    progressData = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    async initializeTracking(taskId) {
        const report = {
            taskId,
            overallProgress: 0,
            phaseProgress: [],
            milestones: [],
            timeTracking: {
                totalTime: 0,
                activeTime: 0,
                idleTime: 0,
                sessions: []
            },
            blockers: []
        };
        this.progressData.set(taskId, report);
        this.logger.debug('Progress tracking initialized', { taskId });
    }
    async updateTaskProgress(taskId, progress) {
        const report = this.progressData.get(taskId);
        if (report) {
            report.overallProgress = progress;
            this.progressData.set(taskId, report);
            this.logger.debug('Progress updated', { taskId, progress });
        }
    }
    async getProgressReport(taskId) {
        const report = this.progressData.get(taskId);
        if (!report) {
            throw new Error(`Progress tracking not found for task: ${taskId}`);
        }
        return report;
    }
    async removeTracking(taskId) {
        this.progressData.delete(taskId);
        this.logger.debug('Progress tracking removed', { taskId });
    }
}
//# sourceMappingURL=ProgressMonitor.js.map