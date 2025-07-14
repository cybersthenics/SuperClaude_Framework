// SuperClaude Tasks Server - DependencyTracker Implementation
// Track and manage task dependencies

import { TaskDependency, ValidationResult } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class DependencyTracker {
  private logger: Logger;
  private dependencies: Map<string, TaskDependency[]> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async updateDependencies(taskId: string, dependencies: TaskDependency[]): Promise<void> {
    this.dependencies.set(taskId, dependencies);
    this.logger.debug('Dependencies updated', { taskId, count: dependencies.length });
  }

  async removeDependencies(taskId: string): Promise<void> {
    this.dependencies.delete(taskId);
    this.logger.debug('Dependencies removed', { taskId });
  }

  async getDependencies(taskId: string): Promise<TaskDependency[]> {
    return this.dependencies.get(taskId) || [];
  }

  async validateDependencies(dependencies: TaskDependency[]): Promise<ValidationResult> {
    const errors: string[] = [];
    
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