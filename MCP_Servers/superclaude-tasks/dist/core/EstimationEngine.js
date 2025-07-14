export class EstimationEngine {
    historicalDataManager;
    complexityAnalyzer;
    riskAssessor;
    logger;
    baseEstimates = {
        'feature': { hours: 8, complexity: 'moderate' },
        'bug': { hours: 4, complexity: 'simple' },
        'improvement': { hours: 6, complexity: 'moderate' },
        'research': { hours: 12, complexity: 'complex' },
        'documentation': { hours: 3, complexity: 'simple' },
        'maintenance': { hours: 2, complexity: 'simple' },
        'test': { hours: 4, complexity: 'simple' }
    };
    complexityMultipliers = {
        'simple': 1.0,
        'moderate': 1.5,
        'complex': 2.5,
        'very_complex': 4.0
    };
    constructor(historicalDataManager, complexityAnalyzer, riskAssessor, logger) {
        this.historicalDataManager = historicalDataManager;
        this.complexityAnalyzer = complexityAnalyzer;
        this.riskAssessor = riskAssessor;
        this.logger = logger;
    }
    async estimateTaskEffort(task) {
        const startTime = Date.now();
        try {
            this.logger.info('Starting task effort estimation', {
                taskId: task.id,
                type: task.type,
                title: task.title
            });
            const complexityAnalysis = await this.analyzeComplexity(task);
            const historicalData = await this.gatherHistoricalData(task);
            const baselineEstimate = await this.calculateBaselineEstimate(task, complexityAnalysis);
            const riskAssessment = await this.assessRisk(task, complexityAnalysis);
            const adjustedEstimate = await this.applyRiskFactors(baselineEstimate, riskAssessment.risks);
            const confidence = await this.calculateConfidence(task, historicalData, complexityAnalysis);
            const factors = await this.generateEstimationFactors(task, complexityAnalysis, riskAssessment);
            const effortEstimate = {
                hours: adjustedEstimate.hours,
                complexity: complexityAnalysis.overall,
                confidence,
                factors: factors.map(f => f.name)
            };
            const estimation = {
                effort: effortEstimate,
                confidence,
                factors,
                historicalBasis: historicalData,
                complexityAnalysis,
                riskAssessment
            };
            this.logger.info('Task effort estimation completed', {
                taskId: task.id,
                estimatedHours: effortEstimate.hours,
                complexity: complexityAnalysis.overall,
                confidence,
                processingTime: Date.now() - startTime
            });
            return estimation;
        }
        catch (error) {
            this.logger.error('Failed to estimate task effort', {
                taskId: task.id,
                error: error.message
            });
            throw error;
        }
    }
    async estimateProjectEffort(tasks) {
        const startTime = Date.now();
        try {
            this.logger.info('Starting project effort estimation', { taskCount: tasks.length });
            const taskEstimations = await Promise.all(tasks.map(task => this.estimateTaskEffort(task)));
            const totalHours = taskEstimations.reduce((sum, est) => sum + est.effort.hours, 0);
            const averageConfidence = taskEstimations.reduce((sum, est) => sum + est.confidence, 0) / taskEstimations.length;
            const projectComplexity = await this.analyzeProjectComplexity(tasks);
            const projectRisks = await this.assessProjectRisks(tasks, taskEstimations);
            const timeline = await this.calculateProjectTimeline(tasks, taskEstimations);
            const resourceRequirements = await this.calculateResourceRequirements(tasks, taskEstimations);
            const projectEstimation = {
                totalEffort: {
                    hours: totalHours,
                    complexity: projectComplexity,
                    confidence: averageConfidence,
                    factors: ['project_aggregation']
                },
                timeline,
                resourceRequirements,
                taskEstimations,
                risks: projectRisks,
                metadata: {
                    taskCount: tasks.length,
                    estimatedAt: new Date(),
                    processingTime: Date.now() - startTime
                }
            };
            this.logger.info('Project effort estimation completed', {
                taskCount: tasks.length,
                totalHours,
                averageConfidence,
                processingTime: Date.now() - startTime
            });
            return projectEstimation;
        }
        catch (error) {
            this.logger.error('Failed to estimate project effort', {
                taskCount: tasks.length,
                error: error.message
            });
            throw error;
        }
    }
    async analyzeComplexity(task) {
        try {
            const analysis = await this.complexityAnalyzer.analyzeTask(task);
            if (!analysis) {
                return this.inferComplexityFromTask(task);
            }
            return analysis;
        }
        catch (error) {
            this.logger.error('Failed to analyze complexity', {
                taskId: task.id,
                error: error.message
            });
            return this.inferComplexityFromTask(task);
        }
    }
    inferComplexityFromTask(task) {
        let technicalComplexity = 1;
        let businessComplexity = 1;
        let integrationComplexity = 1;
        let testingComplexity = 1;
        const description = task.description?.toLowerCase() || '';
        if (description.includes('algorithm') || description.includes('optimization')) {
            technicalComplexity = 3;
        }
        else if (description.includes('integration') || description.includes('api')) {
            technicalComplexity = 2;
        }
        if (description.includes('workflow') || description.includes('process')) {
            businessComplexity = 2;
        }
        else if (description.includes('user') || description.includes('interface')) {
            businessComplexity = 1.5;
        }
        if (description.includes('database') || description.includes('service')) {
            integrationComplexity = 2;
        }
        else if (description.includes('external') || description.includes('third-party')) {
            integrationComplexity = 3;
        }
        if (description.includes('e2e') || description.includes('integration test')) {
            testingComplexity = 2;
        }
        else if (description.includes('unit test')) {
            testingComplexity = 1;
        }
        const overall = this.calculateOverallComplexity(technicalComplexity, businessComplexity, integrationComplexity, testingComplexity);
        return {
            overall,
            technical: technicalComplexity,
            business: businessComplexity,
            integration: integrationComplexity,
            testing: testingComplexity,
            factors: this.identifyComplexityFactors(description)
        };
    }
    calculateOverallComplexity(technical, business, integration, testing) {
        const average = (technical + business + integration + testing) / 4;
        if (average <= 1.2)
            return 'simple';
        if (average <= 2.0)
            return 'moderate';
        if (average <= 2.8)
            return 'complex';
        return 'very_complex';
    }
    identifyComplexityFactors(description) {
        const factors = [];
        if (description.includes('algorithm'))
            factors.push('algorithmic_complexity');
        if (description.includes('database'))
            factors.push('data_complexity');
        if (description.includes('api'))
            factors.push('integration_complexity');
        if (description.includes('user'))
            factors.push('user_interface_complexity');
        if (description.includes('test'))
            factors.push('testing_complexity');
        if (description.includes('performance'))
            factors.push('performance_requirements');
        if (description.includes('security'))
            factors.push('security_requirements');
        return factors;
    }
    async assessRisk(task, complexityAnalysis) {
        try {
            return await this.riskAssessor.assessTask(task, complexityAnalysis);
        }
        catch (error) {
            this.logger.error('Failed to assess risk', {
                taskId: task.id,
                error: error.message
            });
            return this.simpleRiskAssessment(task, complexityAnalysis);
        }
    }
    simpleRiskAssessment(task, complexityAnalysis) {
        const risks = [];
        if (complexityAnalysis?.technical && complexityAnalysis.technical >= 2.5) {
            risks.push({
                id: 'high_technical_complexity',
                description: 'High technical complexity may lead to implementation challenges',
                probability: 0.6,
                impact: 0.7,
                category: 'technical'
            });
        }
        if (task.type === 'research') {
            risks.push({
                id: 'research_uncertainty',
                description: 'Research tasks have inherent uncertainty in scope and timeline',
                probability: 0.4,
                impact: 0.6,
                category: 'resource'
            });
        }
        if (task.type === 'feature' && complexityAnalysis?.integration && complexityAnalysis.integration >= 2) {
            risks.push({
                id: 'integration_dependencies',
                description: 'Integration requirements may introduce dependencies',
                probability: 0.3,
                impact: 0.5,
                category: 'dependency'
            });
        }
        const technical = risks.filter(r => r.category === 'technical').reduce((sum, r) => sum + r.probability * r.impact, 0);
        const resource = risks.filter(r => r.category === 'resource').reduce((sum, r) => sum + r.probability * r.impact, 0);
        const timeline = risks.filter(r => r.category === 'timeline').reduce((sum, r) => sum + r.probability * r.impact, 0);
        const dependency = risks.filter(r => r.category === 'dependency').reduce((sum, r) => sum + r.probability * r.impact, 0);
        return {
            overall: (technical + resource + timeline + dependency) / 4,
            technical,
            resource,
            timeline,
            dependency,
            risks
        };
    }
    async gatherHistoricalData(task) {
        try {
            return await this.historicalDataManager.getSimilarTasks(task);
        }
        catch (error) {
            this.logger.warn('Failed to gather historical data', {
                taskId: task.id,
                error: error.message
            });
            return [];
        }
    }
    async calculateBaselineEstimate(task, complexityAnalysis) {
        const baseHours = this.baseEstimates[task.type || 'feature'].hours;
        const complexityMultiplier = this.complexityMultipliers[complexityAnalysis.overall];
        return {
            hours: baseHours * complexityMultiplier,
            factors: ['base_estimate', 'complexity_multiplier'],
            confidence: 0.7
        };
    }
    async applyRiskFactors(baselineEstimate, risks) {
        let riskMultiplier = 1.0;
        for (const risk of risks) {
            const riskImpact = risk.probability * risk.impact;
            riskMultiplier += riskImpact * 0.3;
        }
        riskMultiplier = Math.min(riskMultiplier, 2.0);
        return {
            hours: baselineEstimate.hours * riskMultiplier,
            factors: [...baselineEstimate.factors, 'risk_adjustment'],
            confidence: baselineEstimate.confidence * (1 / riskMultiplier)
        };
    }
    async calculateConfidence(task, historicalData, complexityAnalysis) {
        let confidence = 0.7;
        if (historicalData.length > 0) {
            const avgAccuracy = historicalData.reduce((sum, data) => sum + data.accuracy, 0) / historicalData.length;
            confidence = Math.max(confidence, avgAccuracy);
        }
        const complexityPenalty = {
            'simple': 0.0,
            'moderate': 0.1,
            'complex': 0.2,
            'very_complex': 0.3
        };
        confidence -= complexityPenalty[complexityAnalysis.overall];
        return Math.max(0.3, Math.min(0.95, confidence));
    }
    async generateEstimationFactors(task, complexityAnalysis, riskAssessment) {
        const factors = [];
        factors.push({
            name: 'task_type',
            impact: 1.0,
            confidence: 0.9,
            description: `Base estimate for ${task.type} tasks`
        });
        if (complexityAnalysis.overall !== 'simple') {
            factors.push({
                name: 'complexity',
                impact: this.complexityMultipliers[complexityAnalysis.overall],
                confidence: 0.8,
                description: `${complexityAnalysis.overall} complexity multiplier`
            });
        }
        if (riskAssessment.overall > 0.3) {
            factors.push({
                name: 'risk_adjustment',
                impact: 1 + (riskAssessment.overall * 0.5),
                confidence: 0.6,
                description: 'Risk-based adjustment factor'
            });
        }
        return factors;
    }
    async analyzeProjectComplexity(tasks) {
        const complexities = await Promise.all(tasks.map(task => this.analyzeComplexity(task)));
        const complexityScores = complexities.map(c => this.complexityToScore(c.overall));
        const averageScore = complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;
        return this.scoreToComplexity(averageScore);
    }
    complexityToScore(complexity) {
        const scores = { 'simple': 1, 'moderate': 2, 'complex': 3, 'very_complex': 4 };
        return scores[complexity];
    }
    scoreToComplexity(score) {
        if (score <= 1.5)
            return 'simple';
        if (score <= 2.5)
            return 'moderate';
        if (score <= 3.5)
            return 'complex';
        return 'very_complex';
    }
    async assessProjectRisks(tasks, estimations) {
        const risks = [];
        const taskRisks = estimations.flatMap(est => est.riskAssessment.risks);
        const hasHighComplexityTasks = estimations.some(est => est.complexityAnalysis.overall === 'complex' || est.complexityAnalysis.overall === 'very_complex');
        if (hasHighComplexityTasks) {
            risks.push({
                id: 'project_complexity',
                description: 'Project contains high-complexity tasks that may impact timeline',
                probability: 0.4,
                impact: 0.6,
                category: 'timeline'
            });
        }
        return [...taskRisks, ...risks];
    }
    async calculateProjectTimeline(tasks, estimations) {
        const totalHours = estimations.reduce((sum, est) => sum + est.effort.hours, 0);
        const workingDays = Math.ceil(totalHours / 8);
        const calendarDays = Math.ceil(workingDays * 1.4);
        return {
            estimatedDays: workingDays,
            calendarDays,
            startDate: new Date(),
            endDate: new Date(Date.now() + calendarDays * 24 * 60 * 60 * 1000)
        };
    }
    async calculateResourceRequirements(tasks, estimations) {
        const totalHours = estimations.reduce((sum, est) => sum + est.effort.hours, 0);
        return [
            {
                type: 'developer',
                amount: Math.ceil(totalHours / 40),
                unit: 'person-weeks'
            }
        ];
    }
    async updateEstimationModel(completedTask, actualEffort) {
        try {
            await this.historicalDataManager.recordTaskCompletion(completedTask, actualEffort);
            this.logger.info('Estimation model updated', {
                taskId: completedTask.id,
                actualHours: actualEffort.hours
            });
        }
        catch (error) {
            this.logger.error('Failed to update estimation model', {
                taskId: completedTask.id,
                error: error.message
            });
        }
    }
}
//# sourceMappingURL=EstimationEngine.js.map