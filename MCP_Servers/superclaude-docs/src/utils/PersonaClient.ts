import { Logger } from './Logger.js';
import { DocsServerConfig } from '../types/index.js';

export class PersonaClient {
  private logger: Logger;
  private config: DocsServerConfig;
  private isEnabled: boolean;
  private activePersonas: Map<string, PersonaInstance>;

  constructor(config: DocsServerConfig) {
    this.config = config;
    this.logger = new Logger('PersonaClient');
    this.isEnabled = config.integration.enablePersonaIntegration;
    this.activePersonas = new Map();
    
    if (!this.isEnabled) {
      this.logger.info('Persona integration is disabled');
    } else {
      this.logger.info('PersonaClient initialized');
    }
  }

  async activatePersona(personaType: string, context: any): Promise<PersonaInstance> {
    if (!this.isEnabled) {
      this.logger.debug('Persona integration disabled, returning mock persona');
      return this.getMockPersona(personaType, context);
    }

    this.logger.debug('Activating persona', { personaType, context });
    
    try {
      // Mock implementation - would connect to actual Persona server
      const persona = this.createPersonaInstance(personaType, context);
      const personaId = `${personaType}-${Date.now()}`;
      
      this.activePersonas.set(personaId, persona);
      
      this.logger.debug('Persona activated', { 
        personaType,
        personaId,
        context 
      });

      return persona;
    } catch (error) {
      this.logger.error('Persona activation failed', { error, personaType, context });
      return this.getMockPersona(personaType, context);
    }
  }

  async deactivatePersona(personaId: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug('Persona integration disabled, skipping deactivation');
      return;
    }

    this.logger.debug('Deactivating persona', { personaId });
    
    try {
      if (this.activePersonas.has(personaId)) {
        this.activePersonas.delete(personaId);
        this.logger.debug('Persona deactivated', { personaId });
      } else {
        this.logger.warn('Persona not found for deactivation', { personaId });
      }
    } catch (error) {
      this.logger.error('Persona deactivation failed', { error, personaId });
    }
  }

  async getPersonaGuidance(personaId: string, task: string): Promise<PersonaGuidance> {
    if (!this.isEnabled) {
      this.logger.debug('Persona integration disabled, returning mock guidance');
      return this.getMockGuidance(task);
    }

    this.logger.debug('Getting persona guidance', { personaId, task });
    
    try {
      const persona = this.activePersonas.get(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      const guidance = this.generateGuidance(persona, task);
      
      this.logger.debug('Persona guidance generated', { 
        personaId,
        task,
        guidanceType: guidance.type
      });

      return guidance;
    } catch (error) {
      this.logger.error('Persona guidance failed', { error, personaId, task });
      return this.getMockGuidance(task);
    }
  }

  async enhanceContentWithPersona(
    personaId: string, 
    content: string, 
    enhancementType: string
  ): Promise<string> {
    if (!this.isEnabled) {
      this.logger.debug('Persona integration disabled, returning original content');
      return content;
    }

    this.logger.debug('Enhancing content with persona', { 
      personaId,
      enhancementType,
      contentLength: content.length
    });
    
    try {
      const persona = this.activePersonas.get(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      const enhancedContent = this.applyPersonaEnhancements(persona, content, enhancementType);
      
      this.logger.debug('Content enhanced with persona', { 
        personaId,
        enhancementType,
        originalLength: content.length,
        enhancedLength: enhancedContent.length
      });

      return enhancedContent;
    } catch (error) {
      this.logger.error('Content enhancement failed', { 
        error, 
        personaId, 
        enhancementType 
      });
      return content; // Return original content on failure
    }
  }

  async getPersonaRecommendations(personaType: string, context: any): Promise<string[]> {
    if (!this.isEnabled) {
      this.logger.debug('Persona integration disabled, returning mock recommendations');
      return this.getMockRecommendations(personaType);
    }

    this.logger.debug('Getting persona recommendations', { personaType, context });
    
    try {
      const recommendations = this.generateRecommendations(personaType, context);
      
      this.logger.debug('Persona recommendations generated', { 
        personaType,
        recommendationCount: recommendations.length
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Persona recommendations failed', { error, personaType, context });
      return this.getMockRecommendations(personaType);
    }
  }

  async validatePersonaAlignment(personaId: string, content: string): Promise<PersonaValidation> {
    if (!this.isEnabled) {
      this.logger.debug('Persona integration disabled, returning mock validation');
      return this.getMockValidation();
    }

    this.logger.debug('Validating persona alignment', { personaId, contentLength: content.length });
    
    try {
      const persona = this.activePersonas.get(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      const validation = this.performPersonaValidation(persona, content);
      
      this.logger.debug('Persona validation completed', { 
        personaId,
        alignmentScore: validation.alignmentScore,
        passed: validation.passed
      });

      return validation;
    } catch (error) {
      this.logger.error('Persona validation failed', { error, personaId });
      return this.getMockValidation();
    }
  }

  // Private helper methods
  private createPersonaInstance(personaType: string, context: any): PersonaInstance {
    const basePersona = {
      id: `${personaType}-${Date.now()}`,
      type: personaType,
      name: this.getPersonaName(personaType),
      description: this.getPersonaDescription(personaType),
      context,
      activatedAt: new Date(),
      capabilities: this.getPersonaCapabilities(personaType),
      preferences: this.getPersonaPreferences(personaType, context),
      specializations: this.getPersonaSpecializations(personaType)
    };

    return basePersona;
  }

  private getPersonaName(personaType: string): string {
    const names = {
      'scribe': 'Professional Writer',
      'mentor': 'Educational Guide',
      'architect': 'System Designer',
      'analyzer': 'Technical Analyst',
      'security': 'Security Expert'
    };
    return names[personaType] || 'Generic Assistant';
  }

  private getPersonaDescription(personaType: string): string {
    const descriptions = {
      'scribe': 'Specializes in professional writing, documentation, and localization',
      'mentor': 'Focuses on educational content, tutorials, and knowledge transfer',
      'architect': 'Expert in system design, architecture, and technical planning',
      'analyzer': 'Specializes in code analysis, investigation, and problem solving',
      'security': 'Expert in security analysis, threat modeling, and compliance'
    };
    return descriptions[personaType] || 'General purpose assistant';
  }

  private getPersonaCapabilities(personaType: string): string[] {
    const capabilities = {
      'scribe': [
        'professional writing',
        'multi-language support',
        'cultural adaptation',
        'technical documentation',
        'content localization'
      ],
      'mentor': [
        'educational content creation',
        'tutorial development',
        'knowledge transfer',
        'learning path design',
        'skill assessment'
      ],
      'architect': [
        'system design',
        'architecture planning',
        'technical specifications',
        'scalability analysis',
        'technology selection'
      ],
      'analyzer': [
        'code analysis',
        'problem investigation',
        'root cause analysis',
        'performance evaluation',
        'quality assessment'
      ],
      'security': [
        'security analysis',
        'threat modeling',
        'vulnerability assessment',
        'compliance checking',
        'security documentation'
      ]
    };
    return capabilities[personaType] || ['general assistance'];
  }

  private getPersonaPreferences(personaType: string, context: any): any {
    const basePreferences = {
      language: context.language || 'en',
      audience: context.audience || 'general',
      formality: context.formality || 'neutral',
      style: context.style || 'professional'
    };

    const typeSpecificPreferences = {
      'scribe': {
        ...basePreferences,
        writingStyle: 'clear and concise',
        culturalSensitivity: 'high',
        localizationDepth: 'comprehensive'
      },
      'mentor': {
        ...basePreferences,
        teachingApproach: 'progressive',
        explanationDepth: 'detailed',
        exampleRatio: 'high'
      },
      'architect': {
        ...basePreferences,
        designPhilosophy: 'scalable and maintainable',
        detailLevel: 'comprehensive',
        futureProofing: 'essential'
      },
      'analyzer': {
        ...basePreferences,
        investigationDepth: 'thorough',
        evidenceRequirement: 'high',
        systematicApproach: 'mandatory'
      },
      'security': {
        ...basePreferences,
        securityStance: 'defensive',
        complianceLevel: 'strict',
        riskTolerance: 'low'
      }
    };

    return typeSpecificPreferences[personaType] || basePreferences;
  }

  private getPersonaSpecializations(personaType: string): string[] {
    const specializations = {
      'scribe': ['technical writing', 'API documentation', 'user guides', 'localization'],
      'mentor': ['tutorials', 'training materials', 'knowledge bases', 'learning paths'],
      'architect': ['system design', 'technical specifications', 'architecture diagrams'],
      'analyzer': ['code review', 'performance analysis', 'debugging', 'quality metrics'],
      'security': ['threat modeling', 'security audits', 'compliance documentation']
    };
    return specializations[personaType] || ['general documentation'];
  }

  private generateGuidance(persona: PersonaInstance, task: string): PersonaGuidance {
    return {
      type: 'guidance',
      personaId: persona.id,
      task,
      recommendations: this.getTaskRecommendations(persona.type, task),
      approach: this.getTaskApproach(persona.type, task),
      considerations: this.getTaskConsiderations(persona.type, task),
      resources: this.getTaskResources(persona.type, task),
      generatedAt: new Date()
    };
  }

  private getTaskRecommendations(personaType: string, task: string): string[] {
    // Mock recommendations based on persona type and task
    const recommendations = {
      'scribe': [
        'Use clear, concise language',
        'Structure content logically',
        'Consider cultural context',
        'Include relevant examples'
      ],
      'mentor': [
        'Start with fundamentals',
        'Build knowledge progressively',
        'Provide hands-on examples',
        'Include practice exercises'
      ],
      'architect': [
        'Consider scalability requirements',
        'Design for maintainability',
        'Document architectural decisions',
        'Plan for future growth'
      ],
      'analyzer': [
        'Gather comprehensive evidence',
        'Use systematic approach',
        'Document investigation process',
        'Validate findings thoroughly'
      ],
      'security': [
        'Apply security-first mindset',
        'Follow compliance requirements',
        'Document security measures',
        'Consider threat landscape'
      ]
    };
    return recommendations[personaType] || ['Follow best practices'];
  }

  private getTaskApproach(personaType: string, task: string): string {
    const approaches = {
      'scribe': 'Focus on clarity, accessibility, and cultural appropriateness',
      'mentor': 'Emphasize learning outcomes and progressive skill building',
      'architect': 'Prioritize long-term sustainability and scalability',
      'analyzer': 'Use evidence-based systematic investigation',
      'security': 'Apply defense-in-depth and zero-trust principles'
    };
    return approaches[personaType] || 'Apply best practices systematically';
  }

  private getTaskConsiderations(personaType: string, task: string): string[] {
    const considerations = {
      'scribe': ['audience knowledge level', 'cultural context', 'language barriers'],
      'mentor': ['learning objectives', 'skill prerequisites', 'engagement level'],
      'architect': ['scalability requirements', 'technical constraints', 'future evolution'],
      'analyzer': ['data quality', 'investigation scope', 'validation methods'],
      'security': ['threat landscape', 'compliance requirements', 'risk tolerance']
    };
    return considerations[personaType] || ['quality standards', 'user needs'];
  }

  private getTaskResources(personaType: string, task: string): string[] {
    const resources = {
      'scribe': ['style guides', 'localization tools', 'accessibility checkers'],
      'mentor': ['learning frameworks', 'assessment tools', 'educational resources'],
      'architect': ['design patterns', 'architectural frameworks', 'evaluation criteria'],
      'analyzer': ['analysis tools', 'metrics frameworks', 'validation methods'],
      'security': ['security frameworks', 'compliance standards', 'threat models']
    };
    return resources[personaType] || ['documentation templates', 'best practices'];
  }

  private applyPersonaEnhancements(
    persona: PersonaInstance,
    content: string,
    enhancementType: string
  ): string {
    // Mock enhancement - would apply actual persona-specific improvements
    let enhancedContent = content;
    
    switch (persona.type) {
      case 'scribe':
        enhancedContent = this.applyScribeEnhancements(content, enhancementType);
        break;
      case 'mentor':
        enhancedContent = this.applyMentorEnhancements(content, enhancementType);
        break;
      case 'architect':
        enhancedContent = this.applyArchitectEnhancements(content, enhancementType);
        break;
      case 'analyzer':
        enhancedContent = this.applyAnalyzerEnhancements(content, enhancementType);
        break;
      case 'security':
        enhancedContent = this.applySecurityEnhancements(content, enhancementType);
        break;
      default:
        enhancedContent = content;
    }

    return enhancedContent;
  }

  private applyScribeEnhancements(content: string, enhancementType: string): string {
    // Mock scribe enhancements
    if (enhancementType === 'clarity') {
      return content.replace(/\b(utilize|implement)\b/g, 'use');
    }
    return content;
  }

  private applyMentorEnhancements(content: string, enhancementType: string): string {
    // Mock mentor enhancements
    if (enhancementType === 'educational') {
      return content + '\n\n**Learning Tip**: Practice this concept with the provided examples.';
    }
    return content;
  }

  private applyArchitectEnhancements(content: string, enhancementType: string): string {
    // Mock architect enhancements
    if (enhancementType === 'architectural') {
      return content + '\n\n**Architecture Note**: Consider scalability and maintainability implications.';
    }
    return content;
  }

  private applyAnalyzerEnhancements(content: string, enhancementType: string): string {
    // Mock analyzer enhancements
    if (enhancementType === 'analysis') {
      return content + '\n\n**Analysis**: This approach provides systematic investigation capabilities.';
    }
    return content;
  }

  private applySecurityEnhancements(content: string, enhancementType: string): string {
    // Mock security enhancements
    if (enhancementType === 'security') {
      return content + '\n\n**Security Note**: Ensure proper authentication and authorization.';
    }
    return content;
  }

  private generateRecommendations(personaType: string, context: any): string[] {
    return this.getTaskRecommendations(personaType, context.task || 'general');
  }

  private performPersonaValidation(persona: PersonaInstance, content: string): PersonaValidation {
    // Mock validation
    return {
      passed: true,
      alignmentScore: 0.85,
      issues: [],
      suggestions: [`Content aligns well with ${persona.name} persona`],
      validatedAt: new Date()
    };
  }

  // Mock implementations for disabled integration
  private getMockPersona(personaType: string, context: any): PersonaInstance {
    return {
      id: `mock-${personaType}-${Date.now()}`,
      type: personaType,
      name: this.getPersonaName(personaType),
      description: this.getPersonaDescription(personaType),
      context,
      activatedAt: new Date(),
      capabilities: this.getPersonaCapabilities(personaType),
      preferences: this.getPersonaPreferences(personaType, context),
      specializations: this.getPersonaSpecializations(personaType)
    };
  }

  private getMockGuidance(task: string): PersonaGuidance {
    return {
      type: 'guidance',
      personaId: 'mock-persona',
      task,
      recommendations: ['Follow best practices', 'Consider user needs'],
      approach: 'Apply systematic methodology',
      considerations: ['quality standards', 'user experience'],
      resources: ['documentation templates', 'style guides'],
      generatedAt: new Date()
    };
  }

  private getMockRecommendations(personaType: string): string[] {
    return ['Follow best practices', 'Consider quality standards', 'Focus on user needs'];
  }

  private getMockValidation(): PersonaValidation {
    return {
      passed: true,
      alignmentScore: 0.8,
      issues: [],
      suggestions: ['Content meets general standards'],
      validatedAt: new Date()
    };
  }

  getActivePersonas(): PersonaInstance[] {
    return Array.from(this.activePersonas.values());
  }

  isIntegrationEnabled(): boolean {
    return this.isEnabled;
  }

  async getHealth(): Promise<{ status: string; lastCheck: Date; activePersonas: number }> {
    return {
      status: this.isEnabled ? 'healthy' : 'disabled',
      lastCheck: new Date(),
      activePersonas: this.activePersonas.size
    };
  }
}

// Supporting interfaces
interface PersonaInstance {
  id: string;
  type: string;
  name: string;
  description: string;
  context: any;
  activatedAt: Date;
  capabilities: string[];
  preferences: any;
  specializations: string[];
}

interface PersonaGuidance {
  type: 'guidance';
  personaId: string;
  task: string;
  recommendations: string[];
  approach: string;
  considerations: string[];
  resources: string[];
  generatedAt: Date;
}

interface PersonaValidation {
  passed: boolean;
  alignmentScore: number;
  issues: string[];
  suggestions: string[];
  validatedAt: Date;
}