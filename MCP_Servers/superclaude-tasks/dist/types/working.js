// SuperClaude Tasks Server - Working Types
// Simplified types for the working implementation
export class ValidationError extends Error {
    constructor(message, code = 'VALIDATION_ERROR', details = {}) {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
        this.details = details;
        this.suggestions = [];
    }
}
// Schema definitions
export const CreateTaskRequestSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', maxLength: 2000 },
        type: { type: 'string', enum: ['feature', 'bug', 'improvement', 'research', 'documentation', 'maintenance', 'test'] },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
        parentId: { type: 'string', format: 'uuid' },
        dependencies: { type: 'array', items: { type: 'string', format: 'uuid' } },
        metadata: {
            type: 'object',
            properties: {
                projectId: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                semanticContext: { type: 'object' }
            }
        }
    },
    required: ['title', 'description', 'type']
};
export const DecomposeTaskRequestSchema = {
    type: 'object',
    properties: {
        taskId: { type: 'string', format: 'uuid' },
        strategy: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['functional', 'temporal', 'complexity', 'dependency', 'hybrid'] },
                maxDepth: { type: 'number', minimum: 1, maximum: 5, default: 3 },
                minTaskSize: { type: 'number', minimum: 0.5, default: 2 }
            },
            required: ['type']
        },
        options: {
            type: 'object',
            properties: {
                preserveOriginalTask: { type: 'boolean', default: true },
                generateDependencies: { type: 'boolean', default: true },
                estimateSubtasks: { type: 'boolean', default: true }
            }
        }
    },
    required: ['taskId', 'strategy']
};
export const DistributeToSubAgentsRequestSchema = {
    type: 'object',
    properties: {
        taskId: { type: 'string', format: 'uuid' },
        strategy: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['files', 'folders', 'tasks', 'capabilities', 'auto'] },
                maxConcurrency: { type: 'number', minimum: 1, maximum: 15, default: 5 }
            },
            required: ['type']
        }
    },
    required: ['taskId', 'strategy']
};
