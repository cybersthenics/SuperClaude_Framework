export class ComplexityAnalyzer {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async analyzeTask(task) {
        const description = task.description?.toLowerCase() || '';
        const technical = this.analyzeTechnicalComplexity(description);
        const business = this.analyzeBusinessComplexity(description);
        const integration = this.analyzeIntegrationComplexity(description);
        const testing = this.analyzeTestingComplexity(description);
        const overall = this.calculateOverallComplexity(technical, business, integration, testing);
        return {
            overall,
            technical,
            business,
            integration,
            testing,
            factors: this.identifyComplexityFactors(description)
        };
    }
    analyzeTechnicalComplexity(description) {
        let complexity = 1;
        if (description.includes('algorithm') || description.includes('optimization'))
            complexity = 3;
        else if (description.includes('performance') || description.includes('concurrent'))
            complexity = 2.5;
        else if (description.includes('database') || description.includes('api'))
            complexity = 2;
        return complexity;
    }
    analyzeBusinessComplexity(description) {
        let complexity = 1;
        if (description.includes('workflow') || description.includes('process'))
            complexity = 2;
        else if (description.includes('user') || description.includes('interface'))
            complexity = 1.5;
        return complexity;
    }
    analyzeIntegrationComplexity(description) {
        let complexity = 1;
        if (description.includes('external') || description.includes('third-party'))
            complexity = 3;
        else if (description.includes('service') || description.includes('microservice'))
            complexity = 2;
        return complexity;
    }
    analyzeTestingComplexity(description) {
        let complexity = 1;
        if (description.includes('e2e') || description.includes('integration test'))
            complexity = 2;
        else if (description.includes('unit test'))
            complexity = 1;
        return complexity;
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
}
//# sourceMappingURL=ComplexityAnalyzer.js.map