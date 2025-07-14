/**
 * SuperClaude Quality Progress Tracker
 * Tracks validation progress across gates and operations
 */

import { Logger } from './Logger.js';

export interface ProgressUpdate {
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining: number;
  elapsedTime: number;
}

export interface GateProgress {
  gateName: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export class ProgressTracker {
  private totalSteps: number = 0;
  private completedSteps: number = 0;
  private currentStep: string = '';
  private startTime: Date | null = null;
  private gateProgress: Map<string, GateProgress> = new Map();
  private logger: Logger;
  private progressCallbacks: ((update: ProgressUpdate) => void)[] = [];

  constructor() {
    this.logger = new Logger('ProgressTracker');
  }

  /**
   * Start tracking progress for a validation session
   */
  start(totalSteps: number): void {
    this.totalSteps = totalSteps;
    this.completedSteps = 0;
    this.currentStep = 'Initializing validation';
    this.startTime = new Date();
    this.gateProgress.clear();

    this.logger.info('Progress tracking started', { totalSteps });
    this.notifyProgress();
  }

  /**
   * Update overall progress
   */
  updateProgress(completedSteps: number, currentStep?: string): void {
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

  /**
   * Update progress for a specific gate
   */
  updateGateProgress(gateName: string, progress: number): void {
    const existing = this.gateProgress.get(gateName) || {
      gateName,
      progress: 0,
      status: 'pending'
    };

    const updated: GateProgress = {
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

  /**
   * Mark a gate as started
   */
  startGate(gateName: string): void {
    const gateProgress: GateProgress = {
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

  /**
   * Mark a gate as completed
   */
  completeGate(gateName: string): void {
    const existing = this.gateProgress.get(gateName);
    if (existing) {
      const completed: GateProgress = {
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

  /**
   * Mark a gate as failed
   */
  failGate(gateName: string, error?: string): void {
    const existing = this.gateProgress.get(gateName);
    if (existing) {
      const failed: GateProgress = {
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

  /**
   * Complete the entire validation session
   */
  complete(): void {
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

  /**
   * Fail the entire validation session
   */
  fail(reason: string): void {
    this.currentStep = `Validation failed: ${reason}`;
    
    this.logger.error('Progress tracking failed', { reason });
    this.notifyProgress();
  }

  /**
   * Get current progress update
   */
  getCurrentProgress(): ProgressUpdate {
    return {
      totalSteps: this.totalSteps,
      completedSteps: this.completedSteps,
      currentStep: this.currentStep,
      percentage: this.getPercentage(),
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      elapsedTime: this.getElapsedTime()
    };
  }

  /**
   * Get progress for all gates
   */
  getGateProgress(): GateProgress[] {
    return Array.from(this.gateProgress.values());
  }

  /**
   * Get progress summary
   */
  getProgressSummary(): Record<string, any> {
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

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (update: ProgressUpdate) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  offProgress(callback: (update: ProgressUpdate) => void): void {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Private helper methods
   */
  private getPercentage(): number {
    if (this.totalSteps === 0) return 0;
    return Math.round((this.completedSteps / this.totalSteps) * 100);
  }

  private getElapsedTime(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime.getTime();
  }

  private getEstimatedTimeRemaining(): number {
    if (!this.startTime || this.completedSteps === 0) return 0;
    
    const elapsedTime = this.getElapsedTime();
    const timePerStep = elapsedTime / this.completedSteps;
    const remainingSteps = this.totalSteps - this.completedSteps;
    
    return remainingSteps * timePerStep;
  }

  private notifyProgress(): void {
    const update = this.getCurrentProgress();
    this.progressCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        this.logger.error('Progress callback error', { error });
      }
    });
  }
}