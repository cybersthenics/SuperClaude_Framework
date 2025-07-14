// SuperClaude Tasks Server - HistoricalDataManager Implementation
// Manage historical task data for estimation improvements

import { Task, HistoricalData } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class HistoricalDataManager {
  private logger: Logger;
  private historicalData: Map<string, HistoricalData[]> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async getSimilarTasks(task: Partial<Task>): Promise<HistoricalData[]> {
    // Simple implementation - would use ML/similarity algorithms in production
    const taskType = task.type || 'feature';
    return this.historicalData.get(taskType) || [];
  }

  async recordTaskCompletion(completedTask: Task, actualEffort: any): Promise<void> {
    const data: HistoricalData = {
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

  private calculateAccuracy(estimated: number, actual: number): number {
    if (estimated === 0 || actual === 0) return 0;
    return 1 - Math.abs(estimated - actual) / Math.max(estimated, actual);
  }
}