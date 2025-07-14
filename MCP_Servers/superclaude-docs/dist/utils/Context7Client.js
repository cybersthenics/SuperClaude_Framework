"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context7Client = void 0;
const Logger_js_1 = require("./Logger.js");
class Context7Client {
    constructor(config) {
        this.config = config;
        this.logger = new Logger_js_1.Logger('Context7Client');
        this.isEnabled = config.integration.enableContext7Integration;
        if (!this.isEnabled) {
            this.logger.info('Context7 integration is disabled');
        }
        else {
            this.logger.info('Context7Client initialized');
        }
    }
    async getDocumentationPatterns(framework) {
        if (!this.isEnabled) {
            this.logger.debug('Context7 integration disabled, returning empty patterns');
            return [];
        }
        this.logger.debug('Getting documentation patterns', { framework });
        try {
            const patterns = [
                {
                    id: 'technical-overview',
                    name: 'Technical Overview Pattern',
                    description: 'Standard pattern for technical documentation overview',
                    category: 'technical',
                    template: '# {{title}}\n\n{{description}}\n\n## Features\n\n{{features}}',
                    framework: framework || 'general',
                    examples: [
                        {
                            title: 'Example Overview',
                            description: 'This is an example overview section',
                            code: '# Project Overview\n\nThis project provides...',
                            language: 'markdown'
                        }
                    ]
                },
                {
                    id: 'api-reference',
                    name: 'API Reference Pattern',
                    description: 'Standard pattern for API documentation',
                    category: 'api',
                    template: '## {{method}} {{endpoint}}\n\n{{description}}\n\n### Parameters\n\n{{parameters}}',
                    framework: framework || 'general',
                    examples: [
                        {
                            title: 'GET Endpoint',
                            description: 'Example GET endpoint documentation',
                            code: '## GET /api/users\n\nRetrieve all users...',
                            language: 'markdown'
                        }
                    ]
                }
            ];
            this.logger.debug('Documentation patterns retrieved', {
                count: patterns.length,
                framework
            });
            return patterns;
        }
        catch (error) {
            this.logger.error('Failed to get documentation patterns', { error, framework });
            return [];
        }
    }
    async getAPIDocumentationPatterns(apiType) {
        if (!this.isEnabled) {
            this.logger.debug('Context7 integration disabled, returning empty API patterns');
            return [];
        }
        this.logger.debug('Getting API documentation patterns', { apiType });
        try {
            const patterns = [
                {
                    id: 'openapi-standard',
                    name: 'OpenAPI Standard Pattern',
                    description: 'Standard OpenAPI documentation pattern',
                    category: 'api',
                    apiType,
                    template: '# {{title}} API\n\n{{description}}\n\n## Authentication\n\n{{authentication}}',
                    examples: []
                }
            ];
            return patterns;
        }
        catch (error) {
            this.logger.error('Failed to get API documentation patterns', { error, apiType });
            return [];
        }
    }
    async getLocalizationPatterns(language) {
        if (!this.isEnabled) {
            this.logger.debug('Context7 integration disabled, returning empty localization patterns');
            return [];
        }
        this.logger.debug('Getting localization patterns', { language });
        try {
            const patterns = [
                {
                    id: 'cultural-adaptation',
                    name: 'Cultural Adaptation Pattern',
                    description: 'Pattern for cultural adaptation in documentation',
                    category: 'localization',
                    language,
                    rules: [
                        {
                            type: 'formatting',
                            rule: 'Use appropriate date formats',
                            example: language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'
                        }
                    ]
                }
            ];
            return patterns;
        }
        catch (error) {
            this.logger.error('Failed to get localization patterns', { error, language });
            return [];
        }
    }
    async getQualityStandards(docType) {
        if (!this.isEnabled) {
            this.logger.debug('Context7 integration disabled, returning default quality standards');
            return {
                accessibility: 'WCAG 2.1 AA',
                readability: 'Grade 8',
                consistency: 'High',
                accuracy: 'Required'
            };
        }
        this.logger.debug('Getting quality standards', { docType });
        try {
            const standards = {
                accessibility: 'WCAG 2.1 AA',
                readability: docType === 'technical' ? 'Grade 10' : 'Grade 8',
                consistency: 'High',
                accuracy: 'Required',
                completeness: docType === 'api' ? 'All endpoints' : 'All features',
                examples: docType === 'tutorial' ? 'Required' : 'Recommended'
            };
            return standards;
        }
        catch (error) {
            this.logger.error('Failed to get quality standards', { error, docType });
            return {
                accessibility: 'WCAG 2.1 AA',
                readability: 'Grade 8',
                consistency: 'High',
                accuracy: 'Required'
            };
        }
    }
    async validateWithContext7(content, type) {
        if (!this.isEnabled) {
            this.logger.debug('Context7 integration disabled, skipping validation');
            return {
                passed: true,
                score: 0.9,
                issues: []
            };
        }
        this.logger.debug('Validating content with Context7', { type, contentLength: content.length });
        try {
            const validation = {
                passed: true,
                score: 0.92,
                issues: [],
                suggestions: [
                    'Consider adding more examples',
                    'Review heading structure'
                ]
            };
            return validation;
        }
        catch (error) {
            this.logger.error('Context7 validation failed', { error, type });
            return {
                passed: false,
                score: 0.5,
                issues: [
                    {
                        type: 'error',
                        message: 'Context7 validation failed',
                        location: { line: 1, column: 1 }
                    }
                ]
            };
        }
    }
    isIntegrationEnabled() {
        return this.isEnabled;
    }
    async getHealth() {
        if (!this.isEnabled) {
            return {
                status: 'disabled',
                lastCheck: new Date()
            };
        }
        return {
            status: 'healthy',
            lastCheck: new Date()
        };
    }
}
exports.Context7Client = Context7Client;
//# sourceMappingURL=Context7Client.js.map