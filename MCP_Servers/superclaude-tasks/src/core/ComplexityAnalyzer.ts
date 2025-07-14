// SuperClaude Tasks Server - ComplexityAnalyzer Implementation
// Analyze task complexity for better estimation

import { Task, ComplexityAnalysis, ComplexityLevel } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class ComplexityAnalyzer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async analyzeTask(task: Partial<Task>): Promise<ComplexityAnalysis> {
    const description = task.description?.toLowerCase() || '';
    
    // Simple keyword-based analysis
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

  private analyzeTechnicalComplexity(description: string): number {
    let complexity = 1;
    
    if (description.includes('algorithm') || description.includes('optimization')) complexity = 3;
    else if (description.includes('performance') || description.includes('concurrent')) complexity = 2.5;
    else if (description.includes('database') || description.includes('api')) complexity = 2;
    
    return complexity;
  }

  private analyzeBusinessComplexity(description: string): number {
    let complexity = 1;
    
    if (description.includes('workflow') || description.includes('process')) complexity = 2;
    else if (description.includes('user') || description.includes('interface')) complexity = 1.5;
    
    return complexity;
  }

  private analyzeIntegrationComplexity(description: string): number {
    let complexity = 1;
    
    if (description.includes('external') || description.includes('third-party')) complexity = 3;
    else if (description.includes('service') || description.includes('microservice')) complexity = 2;
    
    return complexity;
  }

  private analyzeTestingComplexity(description: string): number {
    let complexity = 1;
    
    if (description.includes('e2e') || description.includes('integration test')) complexity = 2;
    else if (description.includes('unit test')) complexity = 1;
    
    return complexity;
  }

  private calculateOverallComplexity(
    technical: number,
    business: number,
    integration: number,
    testing: number
  ): ComplexityLevel {
    const average = (technical + business + integration + testing) / 4;
    
    if (average <= 1.2) return 'simple';
    if (average <= 2.0) return 'moderate';
    if (average <= 2.8) return 'complex';
    return 'very_complex';
  }

  private identifyComplexityFactors(description: string): string[] {
    const factors: string[] = [];
    
    if (description.includes('algorithm')) factors.push('algorithmic_complexity');
    if (description.includes('database')) factors.push('data_complexity');
    if (description.includes('api')) factors.push('integration_complexity');
    if (description.includes('user')) factors.push('user_interface_complexity');
    if (description.includes('test')) factors.push('testing_complexity');
    if (description.includes('performance')) factors.push('performance_requirements');
    if (description.includes('security')) factors.push('security_requirements');
    
    return factors;
  }
}