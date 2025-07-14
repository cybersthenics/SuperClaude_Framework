export class TaskDecompositionEngine {
    estimationEngine;
    logger;
    constructor(estimationEngine, logger) {
        this.estimationEngine = estimationEngine;
        this.logger = logger;
    }
    async decomposeTask(task, strategy) {
        try {
            this.logger.info('Starting task decomposition', {
                taskId: task.id,
                strategy: strategy.type
            });
            let subtasks = [];
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
        }
        catch (error) {
            this.logger.error('Failed to decompose task', {
                taskId: task.id,
                error: error.message
            });
            throw error;
        }
    }
    async functionalDecomposition(task) {
        const subtasks = [];
        switch (task.type) {
            case 'feature':
                subtasks.push({
                    title: `${task.title} - Design`,
                    description: `Design and plan the implementation of ${task.title}`,
                    type: 'research',
                    priority: task.priority,
                    complexity: 'simple'
                }, {
                    title: `${task.title} - Implementation`,
                    description: `Implement the core functionality for ${task.title}`,
                    type: 'feature',
                    priority: task.priority,
                    complexity: 'moderate'
                }, {
                    title: `${task.title} - Testing`,
                    description: `Create and run tests for ${task.title}`,
                    type: 'test',
                    priority: task.priority,
                    complexity: 'simple'
                });
                break;
            case 'bug':
                subtasks.push({
                    title: `${task.title} - Investigation`,
                    description: `Investigate and reproduce the bug: ${task.title}`,
                    type: 'research',
                    priority: task.priority,
                    complexity: 'simple'
                }, {
                    title: `${task.title} - Fix`,
                    description: `Implement the fix for ${task.title}`,
                    type: 'bug',
                    priority: task.priority,
                    complexity: 'moderate'
                }, {
                    title: `${task.title} - Verification`,
                    description: `Verify the fix works correctly for ${task.title}`,
                    type: 'test',
                    priority: task.priority,
                    complexity: 'simple'
                });
                break;
            default:
                subtasks.push({
                    title: `${task.title} - Analysis`,
                    description: `Analyze requirements for ${task.title}`,
                    type: 'research',
                    priority: task.priority,
                    complexity: 'simple'
                }, {
                    title: `${task.title} - Implementation`,
                    description: `Implement ${task.title}`,
                    type: task.type,
                    priority: task.priority,
                    complexity: 'moderate'
                });
        }
        return subtasks;
    }
    async temporalDecomposition(task) {
        const subtasks = [];
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
    async complexityBasedDecomposition(task) {
        const subtasks = [];
        switch (task.complexity) {
            case 'complex':
                subtasks.push({
                    title: `${task.title} - Core Component`,
                    description: `Core implementation of ${task.title}`,
                    type: task.type,
                    priority: task.priority,
                    complexity: 'moderate'
                }, {
                    title: `${task.title} - Integration`,
                    description: `Integration work for ${task.title}`,
                    type: 'improvement',
                    priority: task.priority,
                    complexity: 'moderate'
                });
                break;
            case 'very_complex':
                subtasks.push({
                    title: `${task.title} - Research`,
                    description: `Research and proof of concept for ${task.title}`,
                    type: 'research',
                    priority: task.priority,
                    complexity: 'moderate'
                }, {
                    title: `${task.title} - Core Implementation`,
                    description: `Core functionality for ${task.title}`,
                    type: task.type,
                    priority: task.priority,
                    complexity: 'complex'
                }, {
                    title: `${task.title} - Testing & Integration`,
                    description: `Testing and integration for ${task.title}`,
                    type: 'test',
                    priority: task.priority,
                    complexity: 'moderate'
                });
                break;
            default:
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
    async dependencyBasedDecomposition(task) {
        const subtasks = [];
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
    async hybridDecomposition(task) {
        const functionalSubtasks = await this.functionalDecomposition(task);
        const complexitySubtasks = await this.complexityBasedDecomposition(task);
        const allSubtasks = [...functionalSubtasks, ...complexitySubtasks];
        const uniqueSubtasks = this.deduplicateSubtasks(allSubtasks);
        return uniqueSubtasks;
    }
    getPhaseType(phaseName) {
        const phaseTypes = {
            'Planning': 'research',
            'Development': 'feature',
            'Testing': 'test',
            'Documentation': 'documentation',
            'Deployment': 'maintenance'
        };
        return phaseTypes[phaseName] || 'feature';
    }
    getPhaseComplexity(phaseName, baseComplexity) {
        const complexityMap = {
            'Planning': 'simple',
            'Development': baseComplexity,
            'Testing': 'simple',
            'Documentation': 'simple',
            'Deployment': 'moderate'
        };
        return complexityMap[phaseName] || 'simple';
    }
    deduplicateSubtasks(subtasks) {
        const seen = new Set();
        const unique = [];
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
//# sourceMappingURL=TaskDecompositionEngine.js.map