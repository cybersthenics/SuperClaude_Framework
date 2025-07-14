import { Logger } from './Logger.js';
export class ProgressTracker {
    totalSteps = 0;
    completedSteps = 0;
    currentStep = '';
    startTime = null;
    gateProgress = new Map();
    logger;
    progressCallbacks = [];
    constructor() {
        this.logger = new Logger('ProgressTracker');
    }
    start(totalSteps) {
        this.totalSteps = totalSteps;
        this.completedSteps = 0;
        this.currentStep = 'Initializing validation';
        this.startTime = new Date();
        this.gateProgress.clear();
        this.logger.info('Progress tracking started', { totalSteps });
        this.notifyProgress();
    }
    updateProgress(completedSteps, currentStep) {
        this.completedSteps = completedSteps;
        if (currentStep) {
            this.currentStep = currentStep;
        }
        this.logger.debug('Progress updated', {
            completedSteps,
            totalSteps: this.totalSteps,
            percentage: this.getPercentage()
        });
        this.notifyProgress();
    }
    updateGateProgress(gateName, progress) {
        const existing = this.gateProgress.get(gateName) || {
            gateName,
            progress: 0,
            status: 'pending'
        };
        const updated = {
            ...existing,
            progress,
            status: progress >= 100 ? 'completed' : 'running'
        };
        if (existing.status === 'pending' && updated.status === 'running') {
            updated.startTime = new Date();
        }
        if (updated.status === 'completed' && !updated.endTime) {
            updated.endTime = new Date();
            if (updated.startTime) {
                updated.duration = updated.endTime.getTime() - updated.startTime.getTime();
            }
        }
        this.gateProgress.set(gateName, updated);
        this.logger.debug('Gate progress updated', {
            gateName,
            progress,
            status: updated.status
        });
    }
    startGate(gateName) {
        const gateProgress = {
            gateName,
            progress: 0,
            status: 'running',
            startTime: new Date()
        };
        this.gateProgress.set(gateName, gateProgress);
        this.currentStep = `Running ${gateName} validation`;
        this.logger.debug('Gate started', { gateName });
        this.notifyProgress();
    }
    completeGate(gateName) {
        const existing = this.gateProgress.get(gateName);
        if (existing) {
            const completed = {
                ...existing,
                progress: 100,
                status: 'completed',
                endTime: new Date()
            };
            if (completed.startTime && completed.endTime) {
                completed.duration = completed.endTime.getTime() - completed.startTime.getTime();
            }
            this.gateProgress.set(gateName, completed);
            this.logger.debug('Gate completed', {
                gateName,
                duration: completed.duration
            });
        }
    }
    failGate(gateName, error) {
        const existing = this.gateProgress.get(gateName);
        if (existing) {
            const failed = {
                ...existing,
                status: 'failed',
                endTime: new Date()
            };
            if (failed.startTime && failed.endTime) {
                failed.duration = failed.endTime.getTime() - failed.startTime.getTime();
            }
            this.gateProgress.set(gateName, failed);
            this.logger.warn('Gate failed', { gateName, error });
        }
    }
    complete() {
        this.completedSteps = this.totalSteps;
        this.currentStep = 'Validation completed';
        const elapsedTime = this.getElapsedTime();
        this.logger.info('Progress tracking completed', {
            totalSteps: this.totalSteps,
            elapsedTime,
            averageTimePerStep: elapsedTime / this.totalSteps
        });
        this.notifyProgress();
    }
    fail(reason) {
        this.currentStep = `Validation failed: ${reason}`;
        this.logger.error('Progress tracking failed', { reason });
        this.notifyProgress();
    }
    getCurrentProgress() {
        return {
            totalSteps: this.totalSteps,
            completedSteps: this.completedSteps,
            currentStep: this.currentStep,
            percentage: this.getPercentage(),
            estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
            elapsedTime: this.getElapsedTime()
        };
    }
    getGateProgress() {
        return Array.from(this.gateProgress.values());
    }
    getProgressSummary() {
        const gates = this.getGateProgress();
        const completed = gates.filter(g => g.status === 'completed');
        const failed = gates.filter(g => g.status === 'failed');
        const running = gates.filter(g => g.status === 'running');
        const avgDuration = completed.length > 0
            ? completed.reduce((sum, g) => sum + (g.duration || 0), 0) / completed.length
            : 0;
        return {
            overall: this.getCurrentProgress(),
            gates: {
                total: gates.length,
                completed: completed.length,
                failed: failed.length,
                running: running.length,
                pending: gates.length - completed.length - failed.length - running.length
            },
            timing: {
                averageGateDuration: avgDuration,
                totalElapsed: this.getElapsedTime(),
                estimatedRemaining: this.getEstimatedTimeRemaining()
            }
        };
    }
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }
    offProgress(callback) {
        const index = this.progressCallbacks.indexOf(callback);
        if (index > -1) {
            this.progressCallbacks.splice(index, 1);
        }
    }
    getPercentage() {
        if (this.totalSteps === 0)
            return 0;
        return Math.round((this.completedSteps / this.totalSteps) * 100);
    }
    getElapsedTime() {
        if (!this.startTime)
            return 0;
        return Date.now() - this.startTime.getTime();
    }
    getEstimatedTimeRemaining() {
        if (!this.startTime || this.completedSteps === 0)
            return 0;
        const elapsedTime = this.getElapsedTime();
        const timePerStep = elapsedTime / this.completedSteps;
        const remainingSteps = this.totalSteps - this.completedSteps;
        return remainingSteps * timePerStep;
    }
    notifyProgress() {
        const update = this.getCurrentProgress();
        this.progressCallbacks.forEach(callback => {
            try {
                callback(update);
            }
            catch (error) {
                this.logger.error('Progress callback error', { error });
            }
        });
    }
}
//# sourceMappingURL=ProgressTracker.js.map