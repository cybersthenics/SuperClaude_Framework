/**
 * Delegation Engine - Intelligent task distribution across specialized sub-agents
 * Supports file-based, folder-based, and auto delegation strategies
 */
import { v4 as uuidv4 } from 'uuid';
export class DelegationEngine {
    subAgentManager;
    concurrencyController;
    performanceTracker;
    activeDelegations;
    strategyConfigurations;
    constructor(subAgentManager, concurrencyController, performanceTracker) {
        this.subAgentManager = subAgentManager;
        this.concurrencyController = concurrencyController;
        this.performanceTracker = performanceTracker;
        this.activeDelegations = new Map();
        this.strategyConfigurations = new Map();
        this.initializeDefaultStrategies();
    }
    /**
     * Delegate task to specialized sub-agents
     */
    async delegateToSubAgents(task, strategy) {
        const startTime = Date.now();
        const delegationId = this.generateDelegationId();
        console.log(`🎯 Starting delegation: ${delegationId} (${strategy.type} strategy)`);
        try {
            // Create delegation plan
            const delegationPlan = await this.createDelegationPlan(task, strategy);
            // Create and configure sub-agents
            const subAgents = await this.createSubAgents(delegationPlan);
            // Execute delegation with monitoring
            const executionResult = await this.executeDelegation(delegationPlan, subAgents);
            // Calculate performance metrics
            const setupTime = Date.now() - startTime;
            this.performanceTracker.recordDelegationPerformance(delegationId, subAgents.length, executionResult.executionTime, executionResult.efficiency);
            const result = {
                delegationId,
                subAgentsCreated: subAgents.length,
                strategy,
                estimatedCompletionTime: executionResult.executionTime,
                status: 'completed'
            };
            console.log(`✅ Delegation completed: ${delegationId} (${subAgents.length} agents, ${executionResult.efficiency.toFixed(2)} efficiency)`);
            return result;
        }
        catch (error) {
            console.error(`❌ Delegation failed: ${delegationId}`, error);
            throw new Error(`Delegation failed: ${error}`);
        }
    }
    /**
     * Configure delegation strategy parameters
     */
    configureDelegationStrategy(strategy, configuration) {
        const strategyConfig = {
            type: strategy,
            concurrency: configuration.concurrency || 7,
            specialization: configuration.specialization,
            resourceAllocation: configuration.resourceAllocation || 'dynamic'
        };
        this.strategyConfigurations.set(strategy, strategyConfig);
        console.log(`⚙️  Configured ${strategy} strategy:`, strategyConfig);
    }
    /**
     * Get aggregated results from sub-agents
     */
    async getSubAgentResults(delegationId) {
        const delegation = this.activeDelegations.get(delegationId);
        if (!delegation) {
            throw new Error(`Delegation ${delegationId} not found`);
        }
        // Wait for all sub-agents to complete if still running
        if (delegation.status === 'running') {
            await this.waitForDelegationCompletion(delegationId);
        }
        const results = await this.aggregateSubAgentResults(delegation);
        console.log(`📊 Results aggregated for delegation: ${delegationId}`);
        return results;
    }
    /**
     * Manage concurrent sub-agent execution
     */
    manageConcurrency(maxConcurrent) {
        this.concurrencyController.updateConfiguration({
            maxConcurrent,
            adaptiveScaling: true
        });
        console.log(`🔧 Concurrency updated: max ${maxConcurrent} concurrent sub-agents`);
    }
    /**
     * Get delegation statistics
     */
    getDelegationStatistics() {
        const activeDelegations = Array.from(this.activeDelegations.values());
        const completedDelegations = activeDelegations.filter(d => d.status === 'completed');
        return {
            activeDelegations: activeDelegations.length,
            completedDelegations: completedDelegations.length,
            averageSubAgentCount: completedDelegations.length > 0 ?
                completedDelegations.reduce((sum, d) => sum + d.subAgents.length, 0) / completedDelegations.length : 0,
            averageEfficiency: completedDelegations.length > 0 ?
                completedDelegations.reduce((sum, d) => sum + (d.results?.efficiency || 0), 0) / completedDelegations.length : 0,
            strategyDistribution: this.calculateStrategyDistribution(activeDelegations)
        };
    }
    // Private helper methods
    initializeDefaultStrategies() {
        this.configureDelegationStrategy('files', {
            concurrency: 5,
            specialization: 'quality',
            resourceAllocation: 'equal'
        });
        this.configureDelegationStrategy('folders', {
            concurrency: 8,
            specialization: 'architecture',
            resourceAllocation: 'weighted'
        });
        this.configureDelegationStrategy('auto', {
            concurrency: 7,
            resourceAllocation: 'dynamic'
        });
    }
    async createDelegationPlan(task, strategy) {
        const plan = {
            delegationId: this.generateDelegationId(),
            task,
            strategy,
            subTasks: [],
            estimatedDuration: 0,
            resourceRequirements: {
                memory: 0,
                cpu: 0,
                concurrency: strategy.concurrency,
                timeout: 300000 // 5 minutes default
            }
        };
        // Break down task based on strategy
        switch (strategy.type) {
            case 'files':
                plan.subTasks = await this.createFileBasedSubTasks(task, strategy);
                break;
            case 'folders':
                plan.subTasks = await this.createFolderBasedSubTasks(task, strategy);
                break;
            case 'auto':
                plan.subTasks = await this.createAutoSubTasks(task, strategy);
                break;
            default:
                throw new Error(`Unknown delegation strategy: ${strategy.type}`);
        }
        // Calculate resource requirements
        plan.resourceRequirements.memory = plan.subTasks.length * 256; // 256MB per sub-task
        plan.resourceRequirements.cpu = plan.subTasks.length * 0.5; // 0.5 CPU per sub-task
        plan.estimatedDuration = this.estimateDuration(plan.subTasks, strategy);
        return plan;
    }
    async createFileBasedSubTasks(task, strategy) {
        const subTasks = [];
        // Create one sub-task per file
        for (const file of task.scope) {
            if (this.isFile(file)) {
                subTasks.push({
                    taskId: uuidv4(),
                    agentId: '', // Will be assigned later
                    operation: task.type,
                    scope: [file],
                    priority: this.calculateFilePriority(file)
                });
            }
        }
        console.log(`📄 Created ${subTasks.length} file-based sub-tasks`);
        return subTasks;
    }
    async createFolderBasedSubTasks(task, strategy) {
        const subTasks = [];
        const folderGroups = this.groupFilesByFolder(task.scope);
        // Create one sub-task per folder
        for (const [folder, files] of folderGroups) {
            subTasks.push({
                taskId: uuidv4(),
                agentId: '', // Will be assigned later
                operation: task.type,
                scope: files,
                priority: this.calculateFolderPriority(folder, files.length)
            });
        }
        console.log(`📁 Created ${subTasks.length} folder-based sub-tasks`);
        return subTasks;
    }
    async createAutoSubTasks(task, strategy) {
        // Intelligent sub-task creation based on task characteristics
        const complexity = this.analyzeTaskComplexity(task);
        if (complexity.fileCount > 50) {
            return this.createFolderBasedSubTasks(task, strategy);
        }
        else if (complexity.averageFileSize < 1000) {
            return this.createFileBasedSubTasks(task, strategy);
        }
        else {
            // Mixed strategy based on file types and sizes
            return this.createMixedSubTasks(task, strategy);
        }
    }
    async createMixedSubTasks(task, strategy) {
        const subTasks = [];
        const fileTypes = this.categorizeFilesByType(task.scope);
        // Group similar file types together
        for (const [fileType, files] of fileTypes) {
            const chunkSize = this.calculateOptimalChunkSize(files.length);
            for (let i = 0; i < files.length; i += chunkSize) {
                const chunk = files.slice(i, i + chunkSize);
                subTasks.push({
                    taskId: uuidv4(),
                    agentId: '',
                    operation: task.type,
                    scope: chunk,
                    priority: this.calculateTypePriority(fileType)
                });
            }
        }
        console.log(`🔄 Created ${subTasks.length} mixed sub-tasks`);
        return subTasks;
    }
    async createSubAgents(plan) {
        const subAgents = [];
        for (const subTask of plan.subTasks) {
            const specialization = plan.strategy.specialization || this.determineOptimalSpecialization(subTask);
            const agent = this.subAgentManager.createSpecializedAgent(specialization, subTask.scope);
            // Assign agent to task
            subTask.agentId = agent.agentId;
            subAgents.push(agent);
        }
        console.log(`🤖 Created ${subAgents.length} specialized sub-agents`);
        return subAgents;
    }
    async executeDelegation(plan, subAgents) {
        const startTime = Date.now();
        const execution = {
            delegationId: plan.delegationId,
            plan,
            subAgents,
            status: 'running',
            startTime: new Date(),
            results: null
        };
        this.activeDelegations.set(plan.delegationId, execution);
        try {
            // Execute sub-tasks with concurrency control
            const subAgentResults = await this.concurrencyController.executeWithConcurrency(plan.subTasks, plan.strategy.concurrency);
            // Calculate execution metrics
            const executionTime = Date.now() - startTime;
            const efficiency = this.calculateDelegationEfficiency(subAgentResults, executionTime);
            execution.status = 'completed';
            execution.results = {
                subAgentResults,
                aggregatedResults: await this.aggregateResults(subAgentResults),
                efficiency,
                executionTime
            };
            return {
                executionTime,
                efficiency,
                subAgentResults
            };
        }
        catch (error) {
            execution.status = 'failed';
            execution.error = error;
            throw error;
        }
    }
    async waitForDelegationCompletion(delegationId) {
        const delegation = this.activeDelegations.get(delegationId);
        if (!delegation)
            return;
        // Poll for completion (in real implementation, this would use events)
        while (delegation.status === 'running') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    async aggregateSubAgentResults(delegation) {
        if (!delegation.results) {
            throw new Error('Delegation results not available');
        }
        return {
            delegationId: delegation.delegationId,
            individual: delegation.results.subAgentResults,
            aggregated: delegation.results.aggregatedResults,
            status: 'completed',
            performance: {
                setupTime: 0, // Would be tracked in real implementation
                executionTime: delegation.results.executionTime,
                aggregationTime: 0, // Would be tracked in real implementation
                efficiency: delegation.results.efficiency,
                timeSavings: Math.max(0, 1 - delegation.results.efficiency) // Simplified calculation
            }
        };
    }
    async aggregateResults(subAgentResults) {
        const aggregated = {
            totalSubAgents: subAgentResults.length,
            completedTasks: subAgentResults.filter(r => r.status === 'completed').length,
            failedTasks: subAgentResults.filter(r => r.status === 'failed').length,
            averageExecutionTime: subAgentResults.reduce((sum, r) => sum + (r.metrics?.executionTime || 0), 0) / subAgentResults.length,
            findings: this.mergeFindingsFromResults(subAgentResults),
            recommendations: this.generateAggregatedRecommendations(subAgentResults)
        };
        return aggregated;
    }
    calculateDelegationEfficiency(results, executionTime) {
        const successfulResults = results.filter(r => r.status === 'completed');
        const successRate = successfulResults.length / results.length;
        // Efficiency is based on success rate and time savings
        const baseEfficiency = successRate;
        const timeEfficiency = Math.min(1.0, 60000 / executionTime); // Normalize to 1 minute baseline
        return (baseEfficiency + timeEfficiency) / 2;
    }
    mergeFindingsFromResults(results) {
        const allFindings = [];
        for (const result of results) {
            if (result.output && result.output.findings) {
                allFindings.push(...result.output.findings);
            }
        }
        // Remove duplicates and sort by severity
        return this.deduplicateAndSortFindings(allFindings);
    }
    generateAggregatedRecommendations(results) {
        const recommendations = new Set();
        for (const result of results) {
            if (result.output && result.output.recommendations) {
                result.output.recommendations.forEach((rec) => recommendations.add(rec));
            }
        }
        return Array.from(recommendations);
    }
    deduplicateAndSortFindings(findings) {
        const unique = findings.reduce((acc, finding) => {
            const key = `${finding.type}_${finding.file}_${finding.line}`;
            if (!acc.has(key)) {
                acc.set(key, finding);
            }
            return acc;
        }, new Map());
        return Array.from(unique.values()).sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        });
    }
    // Helper methods for task analysis and creation
    isFile(path) {
        return path.includes('.') && !path.endsWith('/');
    }
    groupFilesByFolder(files) {
        const groups = new Map();
        for (const file of files) {
            const folder = file.substring(0, file.lastIndexOf('/')) || 'root';
            if (!groups.has(folder)) {
                groups.set(folder, []);
            }
            groups.get(folder).push(file);
        }
        return groups;
    }
    categorizeFilesByType(files) {
        const types = new Map();
        for (const file of files) {
            const extension = file.substring(file.lastIndexOf('.') + 1);
            const type = this.getFileTypeCategory(extension);
            if (!types.has(type)) {
                types.set(type, []);
            }
            types.get(type).push(file);
        }
        return types;
    }
    getFileTypeCategory(extension) {
        const categories = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'h': 'cpp',
            'css': 'stylesheet',
            'scss': 'stylesheet',
            'html': 'markup',
            'md': 'documentation',
            'json': 'config',
            'yaml': 'config',
            'yml': 'config'
        };
        return categories[extension.toLowerCase()] || 'other';
    }
    analyzeTaskComplexity(task) {
        return {
            fileCount: task.scope.length,
            averageFileSize: 1000, // Simplified - would analyze actual files
            typeVariety: new Set(task.scope.map(f => this.getFileTypeCategory(f.split('.').pop() || ''))).size,
            estimatedComplexity: Math.min(task.scope.length / 20, 1.0)
        };
    }
    calculateOptimalChunkSize(fileCount) {
        if (fileCount <= 5)
            return fileCount;
        if (fileCount <= 20)
            return Math.ceil(fileCount / 3);
        return Math.ceil(fileCount / 5);
    }
    calculateFilePriority(file) {
        if (file.includes('test') || file.includes('spec'))
            return 'medium';
        if (file.includes('index') || file.includes('main'))
            return 'high';
        if (file.includes('config') || file.includes('setup'))
            return 'critical';
        return 'low';
    }
    calculateFolderPriority(folder, fileCount) {
        if (folder.includes('core') || folder.includes('src'))
            return 'high';
        if (folder.includes('test') || folder.includes('spec'))
            return 'medium';
        if (fileCount > 10)
            return 'high';
        return 'low';
    }
    calculateTypePriority(fileType) {
        const priorities = {
            'typescript': 'high',
            'javascript': 'high',
            'python': 'high',
            'config': 'critical',
            'documentation': 'medium',
            'stylesheet': 'low'
        };
        return priorities[fileType] || 'low';
    }
    determineOptimalSpecialization(task) {
        const operation = task.operation.toLowerCase();
        if (operation.includes('security') || operation.includes('vulnerability'))
            return 'security';
        if (operation.includes('performance') || operation.includes('optimize'))
            return 'performance';
        if (operation.includes('quality') || operation.includes('review'))
            return 'quality';
        if (operation.includes('architecture') || operation.includes('design'))
            return 'architecture';
        return 'quality'; // Default specialization
    }
    estimateDuration(subTasks, strategy) {
        const baseTimePerTask = 30000; // 30 seconds per task
        const totalTasks = subTasks.length;
        const concurrency = strategy.concurrency;
        return Math.ceil(totalTasks / concurrency) * baseTimePerTask;
    }
    calculateStrategyDistribution(delegations) {
        const distribution = {};
        for (const delegation of delegations) {
            const strategy = delegation.plan.strategy.type;
            distribution[strategy] = (distribution[strategy] || 0) + 1;
        }
        return distribution;
    }
    generateDelegationId() {
        return `delegation_${uuidv4()}`;
    }
}
//# sourceMappingURL=DelegationEngine.js.map