// SuperClaude Tasks Server - RiskAssessor Implementation
// Assess risks for task estimation and planning

import { Task, RiskAssessment, Risk, ComplexityAnalysis } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export class RiskAssessor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async assessTask(task: Partial<Task>, complexityAnalysis?: ComplexityAnalysis): Promise<RiskAssessment> {
    const risks: Risk[] = [];
    
    // Technical risks
    if (complexityAnalysis?.technical && complexityAnalysis.technical >= 2.5) {
      risks.push({
        id: 'high_technical_complexity',
        description: 'High technical complexity may lead to implementation challenges',
        probability: 0.6,
        impact: 0.7,
        category: 'technical'
      });
    }

    // Resource risks
    if (task.type === 'research') {
      risks.push({
        id: 'research_uncertainty',
        description: 'Research tasks have inherent uncertainty in scope and timeline',
        probability: 0.4,
        impact: 0.6,
        category: 'resource'
      });
    }

    // Timeline risks
    if (task.priority === 'critical') {
      risks.push({
        id: 'critical_timeline',
        description: 'Critical priority tasks may face timeline pressure',
        probability: 0.3,
        impact: 0.8,
        category: 'timeline'
      });
    }

    // Dependency risks
    if (complexityAnalysis?.integration && complexityAnalysis.integration >= 2) {
      risks.push({
        id: 'integration_dependencies',
        description: 'Integration requirements may introduce dependencies',
        probability: 0.3,
        impact: 0.5,
        category: 'dependency'
      });
    }

    // Calculate risk scores by category
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
}