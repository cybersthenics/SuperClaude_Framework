import { z } from 'zod';
export const TaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().max(2000),
    type: z.enum(['feature', 'bug', 'improvement', 'research', 'documentation', 'maintenance', 'test']),
    status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled', 'decomposed']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    complexity: z.enum(['simple', 'moderate', 'complex', 'very_complex']),
    progress: z.number().min(0).max(100),
    createdAt: z.date(),
    updatedAt: z.date(),
    completedAt: z.date().optional()
});
export const CreateTaskRequestSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000),
    type: z.enum(['feature', 'bug', 'improvement', 'research', 'documentation', 'maintenance', 'test']),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    parentId: z.string().uuid().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    metadata: z.object({
        projectId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        semanticContext: z.record(z.unknown()).optional()
    }).optional()
});
export const DecomposeTaskRequestSchema = z.object({
    taskId: z.string().uuid(),
    strategy: z.object({
        type: z.enum(['functional', 'temporal', 'complexity', 'dependency', 'hybrid']),
        maxDepth: z.number().min(1).max(5).default(3),
        minTaskSize: z.number().min(0.5).default(2)
    }),
    options: z.object({
        preserveOriginalTask: z.boolean().default(true),
        generateDependencies: z.boolean().default(true),
        estimateSubtasks: z.boolean().default(true)
    }).optional()
});
export const DistributeToSubAgentsRequestSchema = z.object({
    taskId: z.string().uuid(),
    strategy: z.object({
        type: z.enum(['files', 'folders', 'tasks', 'capabilities', 'auto']),
        maxConcurrency: z.number().min(1).max(15).default(5),
        loadBalancing: z.boolean().default(true),
        specialization: z.array(z.string()).optional()
    }),
    options: z.object({
        timeout: z.number().default(300000),
        enableRetry: z.boolean().default(true),
        qualityValidation: z.boolean().default(true),
        progressReporting: z.boolean().default(true)
    }).optional()
});
export * from './index';
//# sourceMappingURL=index.js.map