// SuperClaude Tasks Server - ProgressMonitor Implementation
// Monitor and track task progress

import { ProgressReport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class ProgressMonitor {
  private logger: Logger;
  private progressData: Map<string, ProgressReport> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async initializeTracking(taskId: string): Promise<void> {
    const report: ProgressReport = {
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

  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    const report = this.progressData.get(taskId);
    if (report) {
      report.overallProgress = progress;
      this.progressData.set(taskId, report);
      this.logger.debug('Progress updated', { taskId, progress });
    }
  }

  async getProgressReport(taskId: string): Promise<ProgressReport> {
    const report = this.progressData.get(taskId);
    if (!report) {
      throw new Error(`Progress tracking not found for task: ${taskId}`);
    }
    return report;
  }

  async removeTracking(taskId: string): Promise<void> {
    this.progressData.delete(taskId);
    this.logger.debug('Progress tracking removed', { taskId });
  }
}