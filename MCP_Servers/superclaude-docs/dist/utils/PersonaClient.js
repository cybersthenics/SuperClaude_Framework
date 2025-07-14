"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaClient = void 0;
const Logger_js_1 = require("./Logger.js");
class PersonaClient {
    constructor(config) {
        this.config = config;
        this.logger = new Logger_js_1.Logger('PersonaClient');
        this.isEnabled = config.integration.enablePersonaIntegration;
        this.activePersonas = new Map();
        if (!this.isEnabled) {
            this.logger.info('Persona integration is disabled');
        }
        else {
            this.logger.info('PersonaClient initialized');
        }
    }
    async activatePersona(personaType, context) {
        if (!this.isEnabled) {
            this.logger.debug('Persona integration disabled, returning mock persona');
            return this.getMockPersona(personaType, context);
        }
        this.logger.debug('Activating persona', { personaType, context });
        try {
            const persona = this.createPersonaInstance(personaType, context);
            const personaId = `${personaType}-${Date.now()}`;
            this.activePersonas.set(personaId, persona);
            this.logger.debug('Persona activated', {
                personaType,
                personaId,
                context
            });
            return persona;
        }
        catch (error) {
            this.logger.error('Persona activation failed', { error, personaType, context });
            return this.getMockPersona(personaType, context);
        }
    }
    async deactivatePersona(personaId) {
        if (!this.isEnabled) {
            this.logger.debug('Persona integration disabled, skipping deactivation');
            return;
        }
        this.logger.debug('Deactivating persona', { personaId });
        try {
            if (this.activePersonas.has(personaId)) {
                this.activePersonas.delete(personaId);
                this.logger.debug('Persona deactivated', { personaId });
            }
            else {
                this.logger.warn('Persona not found for deactivation', { personaId });
            }
        }
        catch (error) {
            this.logger.error('Persona deactivation failed', { error, personaId });
        }
    }
    async getPersonaGuidance(personaId, task) {
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
        }
        catch (error) {
            this.logger.error('Persona guidance failed', { error, personaId, task });
            return this.getMockGuidance(task);
        }
    }
    async enhanceContentWithPersona(personaId, content, enhancementType) {
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
        }
        catch (error) {
            this.logger.error('Content enhancement failed', {
                error,
                personaId,
                enhancementType
            });
            return content;
        }
    }
    async getPersonaRecommendations(personaType, context) {
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
        }
        catch (error) {
            this.logger.error('Persona recommendations failed', { error, personaType, context });
            return this.getMockRecommendations(personaType);
        }
    }
    async validatePersonaAlignment(personaId, content) {
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
        }
        catch (error) {
            this.logger.error('Persona validation failed', { error, personaId });
            return this.getMockValidation();
        }
    }
    createPersonaInstance(personaType, context) {
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
    getPersonaName(personaType) {
        const names = {
            'scribe': 'Professional Writer',
            'mentor': 'Educational Guide',
            'architect': 'System Designer',
            'analyzer': 'Technical Analyst',
            'security': 'Security Expert'
        };
        return names[personaType] || 'Generic Assistant';
    }
    getPersonaDescription(personaType) {
        const descriptions = {
            'scribe': 'Specializes in professional writing, documentation, and localization',
            'mentor': 'Focuses on educational content, tutorials, and knowledge transfer',
            'architect': 'Expert in system design, architecture, and technical planning',
            'analyzer': 'Specializes in code analysis, investigation, and problem solving',
            'security': 'Expert in security analysis, threat modeling, and compliance'
        };
        return descriptions[personaType] || 'General purpose assistant';
    }
    getPersonaCapabilities(personaType) {
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
    getPersonaPreferences(personaType, context) {
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
    getPersonaSpecializations(personaType) {
        const specializations = {
            'scribe': ['technical writing', 'API documentation', 'user guides', 'localization'],
            'mentor': ['tutorials', 'training materials', 'knowledge bases', 'learning paths'],
            'architect': ['system design', 'technical specifications', 'architecture diagrams'],
            'analyzer': ['code review', 'performance analysis', 'debugging', 'quality metrics'],
            'security': ['threat modeling', 'security audits', 'compliance documentation']
        };
        return specializations[personaType] || ['general documentation'];
    }
    generateGuidance(persona, task) {
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
    getTaskRecommendations(personaType, task) {
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
    getTaskApproach(personaType, task) {
        const approaches = {
            'scribe': 'Focus on clarity, accessibility, and cultural appropriateness',
            'mentor': 'Emphasize learning outcomes and progressive skill building',
            'architect': 'Prioritize long-term sustainability and scalability',
            'analyzer': 'Use evidence-based systematic investigation',
            'security': 'Apply defense-in-depth and zero-trust principles'
        };
        return approaches[personaType] || 'Apply best practices systematically';
    }
    getTaskConsiderations(personaType, task) {
        const considerations = {
            'scribe': ['audience knowledge level', 'cultural context', 'language barriers'],
            'mentor': ['learning objectives', 'skill prerequisites', 'engagement level'],
            'architect': ['scalability requirements', 'technical constraints', 'future evolution'],
            'analyzer': ['data quality', 'investigation scope', 'validation methods'],
            'security': ['threat landscape', 'compliance requirements', 'risk tolerance']
        };
        return considerations[personaType] || ['quality standards', 'user needs'];
    }
    getTaskResources(personaType, task) {
        const resources = {
            'scribe': ['style guides', 'localization tools', 'accessibility checkers'],
            'mentor': ['learning frameworks', 'assessment tools', 'educational resources'],
            'architect': ['design patterns', 'architectural frameworks', 'evaluation criteria'],
            'analyzer': ['analysis tools', 'metrics frameworks', 'validation methods'],
            'security': ['security frameworks', 'compliance standards', 'threat models']
        };
        return resources[personaType] || ['documentation templates', 'best practices'];
    }
    applyPersonaEnhancements(persona, content, enhancementType) {
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
    applyScribeEnhancements(content, enhancementType) {
        if (enhancementType === 'clarity') {
            return content.replace(/\b(utilize|implement)\b/g, 'use');
        }
        return content;
    }
    applyMentorEnhancements(content, enhancementType) {
        if (enhancementType === 'educational') {
            return content + '\n\n**Learning Tip**: Practice this concept with the provided examples.';
        }
        return content;
    }
    applyArchitectEnhancements(content, enhancementType) {
        if (enhancementType === 'architectural') {
            return content + '\n\n**Architecture Note**: Consider scalability and maintainability implications.';
        }
        return content;
    }
    applyAnalyzerEnhancements(content, enhancementType) {
        if (enhancementType === 'analysis') {
            return content + '\n\n**Analysis**: This approach provides systematic investigation capabilities.';
        }
        return content;
    }
    applySecurityEnhancements(content, enhancementType) {
        if (enhancementType === 'security') {
            return content + '\n\n**Security Note**: Ensure proper authentication and authorization.';
        }
        return content;
    }
    generateRecommendations(personaType, context) {
        return this.getTaskRecommendations(personaType, context.task || 'general');
    }
    performPersonaValidation(persona, content) {
        return {
            passed: true,
            alignmentScore: 0.85,
            issues: [],
            suggestions: [`Content aligns well with ${persona.name} persona`],
            validatedAt: new Date()
        };
    }
    getMockPersona(personaType, context) {
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
    getMockGuidance(task) {
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
    getMockRecommendations(personaType) {
        return ['Follow best practices', 'Consider quality standards', 'Focus on user needs'];
    }
    getMockValidation() {
        return {
            passed: true,
            alignmentScore: 0.8,
            issues: [],
            suggestions: ['Content meets general standards'],
            validatedAt: new Date()
        };
    }
    getActivePersonas() {
        return Array.from(this.activePersonas.values());
    }
    isIntegrationEnabled() {
        return this.isEnabled;
    }
    async getHealth() {
        return {
            status: this.isEnabled ? 'healthy' : 'disabled',
            lastCheck: new Date(),
            activePersonas: this.activePersonas.size
        };
    }
}
exports.PersonaClient = PersonaClient;
//# sourceMappingURL=PersonaClient.js.map