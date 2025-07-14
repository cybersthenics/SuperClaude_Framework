// SuperClaude Tasks Server - TaskDecompositionEngine Implementation
// Decompose complex tasks into manageable subtasks

import { Task, TaskDecompositionStrategy, TaskType, TaskPriority, ComplexityLevel } from '../types/index.js';
import { EstimationEngine } from './EstimationEngine.js';
import { Logger } from '../utils/Logger.js';

export class TaskDecompositionEngine {
  private estimationEngine: EstimationEngine;
  private logger: Logger;

  constructor(estimationEngine: EstimationEngine, logger: Logger) {
    this.estimationEngine = estimationEngine;
    this.logger = logger;
  }

  async decomposeTask(task: Task, strategy: TaskDecompositionStrategy): Promise<Partial<Task>[]> {
    try {
      this.logger.info('Starting task decomposition', { 
        taskId: task.id, 
        strategy: strategy.type 
      });

      let subtasks: Partial<Task>[] = [];

      switch (strategy.type) {
        case 'functional':
          subtasks = await this.functionalDecomposition(task);
          break;
        case 'temporal':
          subtasks = await this.temporalDecomposition(task);
          break;
        case 'complexity':
          subtasks = await this.complexityBasedDecomposition(task);
          break;
        case 'dependency':
          subtasks = await this.dependencyBasedDecomposition(task);
          break;
        case 'hybrid':
          subtasks = await this.hybridDecomposition(task);
          break;
        default:
          throw new Error(`Unknown decomposition strategy: ${strategy.type}`);
      }

      this.logger.info('Task decomposition completed', { 
        taskId: task.id, 
        subtaskCount: subtasks.length 
      });

      return subtasks;

    } catch (error) {
      this.logger.error('Failed to decompose task', { 
        taskId: task.id, 
        error: error.message 
      });
      throw error;
    }
  }

  private async functionalDecomposition(task: Task): Promise<Partial<Task>[]> {
    const subtasks: Partial<Task>[] = [];
    
    // Based on task type, create functional subtasks
    switch (task.type) {
      case 'feature':
        subtasks.push(
          {
            title: `${task.title} - Design`,
            description: `Design and plan the implementation of ${task.title}`,
            type: 'research',
            priority: task.priority,
            complexity: 'simple'
          },
          {
            title: `${task.title} - Implementation`,
            description: `Implement the core functionality for ${task.title}`,
            type: 'feature',
            priority: task.priority,
            complexity: 'moderate'
          },
          {
            title: `${task.title} - Testing`,
            description: `Create and run tests for ${task.title}`,
            type: 'test',
            priority: task.priority,
            complexity: 'simple'
          }
        );
        break;
        
      case 'bug':
        subtasks.push(
          {
            title: `${task.title} - Investigation`,
            description: `Investigate and reproduce the bug: ${task.title}`,
            type: 'research',
            priority: task.priority,
            complexity: 'simple'
          },
          {
            title: `${task.title} - Fix`,
            description: `Implement the fix for ${task.title}`,
            type: 'bug',
            priority: task.priority,
            complexity: 'moderate'
          },
          {
            title: `${task.title} - Verification`,
            description: `Verify the fix works correctly for ${task.title}`,
            type: 'test',
            priority: task.priority,
            complexity: 'simple'
          }
        );
        break;
        
      default:
        // Generic decomposition
        subtasks.push(
          {
            title: `${task.title} - Analysis`,
            description: `Analyze requirements for ${task.title}`,
            type: 'research',
            priority: task.priority,
            complexity: 'simple'
          },
          {
            title: `${task.title} - Implementation`,
            description: `Implement ${task.title}`,
            type: task.type,
            priority: task.priority,
            complexity: 'moderate'
          }
        );
    }

    return subtasks;
  }

  private async temporalDecomposition(task: Task): Promise<Partial<Task>[]> {
    const subtasks: Partial<Task>[] = [];
    
    // Create time-based phases
    const phases = [
      { name: 'Planning', duration: 0.2 },
      { name: 'Development', duration: 0.6 },
      { name: 'Testing', duration: 0.2 }
    ];

    for (const phase of phases) {
      subtasks.push({
        title: `${task.title} - ${phase.name}`,
        description: `${phase.name} phase for ${task.title}`,
        type: this.getPhaseType(phase.name),
        priority: task.priority,
        complexity: this.getPhaseComplexity(phase.name, task.complexity)
      });
    }

    return subtasks;
  }

  private async complexityBasedDecomposition(task: Task): Promise<Partial<Task>[]> {
    const subtasks: Partial<Task>[] = [];
    
    // Break down based on complexity level
    switch (task.complexity) {
      case 'complex':
        subtasks.push(
          {
            title: `${task.title} - Core Component`,
            description: `Core implementation of ${task.title}`,
            type: task.type,
            priority: task.priority,
            complexity: 'moderate'
          },
          {
            title: `${task.title} - Integration`,
            description: `Integration work for ${task.title}`,
            type: 'improvement',
            priority: task.priority,
            complexity: 'moderate'
          }
        );
        break;
        
      case 'very_complex':
        subtasks.push(
          {
            title: `${task.title} - Research`,
            description: `Research and proof of concept for ${task.title}`,
            type: 'research',
            priority: task.priority,
            complexity: 'moderate'
          },
          {
            title: `${task.title} - Core Implementation`,
            description: `Core functionality for ${task.title}`,
            type: task.type,
            priority: task.priority,
            complexity: 'complex'
          },
          {
            title: `${task.title} - Testing & Integration`,
            description: `Testing and integration for ${task.title}`,
            type: 'test',
            priority: task.priority,
            complexity: 'moderate'
          }
        );
        break;
        
      default:
        // For simple/moderate, don't decompose or create minimal subtasks
        subtasks.push({
          title: `${task.title} - Implementation`,
          description: `Implement ${task.title}`,
          type: task.type,
          priority: task.priority,
          complexity: 'simple'
        });
    }

    return subtasks;
  }

  private async dependencyBasedDecomposition(task: Task): Promise<Partial<Task>[]> {
    const subtasks: Partial<Task>[] = [];
    
    // Create subtasks based on dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      subtasks.push({
        title: `${task.title} - Dependencies`,
        description: `Handle dependencies for ${task.title}`,
        type: 'improvement',
        priority: task.priority,
        complexity: 'simple'
      });
    }

    subtasks.push({
      title: `${task.title} - Main Work`,
      description: `Main implementation work for ${task.title}`,
      type: task.type,
      priority: task.priority,
      complexity: task.complexity
    });

    return subtasks;
  }

  private async hybridDecomposition(task: Task): Promise<Partial<Task>[]> {
    // Combine multiple strategies
    const functionalSubtasks = await this.functionalDecomposition(task);
    const complexitySubtasks = await this.complexityBasedDecomposition(task);
    
    // Merge and deduplicate
    const allSubtasks = [...functionalSubtasks, ...complexitySubtasks];
    const uniqueSubtasks = this.deduplicateSubtasks(allSubtasks);
    
    return uniqueSubtasks;
  }

  private getPhaseType(phaseName: string): TaskType {
    const phaseTypes: Record<string, TaskType> = {
      'Planning': 'research',
      'Development': 'feature',
      'Testing': 'test',
      'Documentation': 'documentation',
      'Deployment': 'maintenance'
    };
    
    return phaseTypes[phaseName] || 'feature';
  }

  private getPhaseComplexity(phaseName: string, baseComplexity: ComplexityLevel): ComplexityLevel {
    const complexityMap: Record<string, ComplexityLevel> = {
      'Planning': 'simple',
      'Development': baseComplexity,
      'Testing': 'simple',
      'Documentation': 'simple',
      'Deployment': 'moderate'
    };
    
    return complexityMap[phaseName] || 'simple';
  }

  private deduplicateSubtasks(subtasks: Partial<Task>[]): Partial<Task>[] {
    const seen = new Set<string>();
    const unique: Partial<Task>[] = [];
    
    for (const subtask of subtasks) {
      const key = `${subtask.title}-${subtask.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(subtask);
      }
    }
    
    return unique;
  }
}