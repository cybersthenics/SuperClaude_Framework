"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateEngine = void 0;
const index_js_1 = require("../types/index.js");
const Logger_js_1 = require("../utils/Logger.js");
const PerformanceMonitor_js_1 = require("../utils/PerformanceMonitor.js");
const CacheManager_js_1 = require("../utils/CacheManager.js");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const marked_1 = require("marked");
const Handlebars = __importStar(require("handlebars"));
class TemplateEngine {
    constructor(config) {
        this.config = config;
        this.logger = new Logger_js_1.Logger('TemplateEngine');
        this.performanceMonitor = new PerformanceMonitor_js_1.PerformanceMonitor();
        this.cacheManager = new CacheManager_js_1.CacheManager(config.performance.cacheTTL);
        this.templateRegistry = new Map();
        this.variableResolver = new VariableResolverImpl();
        this.sectionGenerator = new SectionGeneratorImpl();
        this.styleApplicator = new StyleApplicatorImpl();
        this.handlebars = Handlebars.create();
        this.initializeTemplateEngine();
        this.logger.info('TemplateEngine initialized');
    }
    async loadTemplate(templateId) {
        const startTime = Date.now();
        this.logger.debug('Loading template', { templateId });
        try {
            const cacheKey = `template:${templateId}`;
            const cachedTemplate = await this.cacheManager.get(cacheKey);
            if (cachedTemplate) {
                this.logger.debug('Template served from cache', { templateId });
                return cachedTemplate;
            }
            if (this.templateRegistry.has(templateId)) {
                const template = this.templateRegistry.get(templateId);
                await this.cacheManager.set(cacheKey, template);
                return template;
            }
            const template = await this.loadTemplateFromFile(templateId);
            const validation = await this.validateTemplate(template);
            if (!validation.isValid) {
                throw new index_js_1.TemplateError(`Template validation failed: ${validation.errors.join(', ')}`, 'TEMPLATE_VALIDATION_ERROR', templateId, validation.errors);
            }
            this.templateRegistry.set(templateId, template);
            await this.cacheManager.set(cacheKey, template);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('template_load', processingTime);
            this.logger.debug('Template loaded successfully', { templateId, processingTime });
            return template;
        }
        catch (error) {
            this.logger.error('Template loading failed', { error, templateId });
            throw error;
        }
    }
    async renderTemplate(template, context) {
        const startTime = Date.now();
        this.logger.debug('Rendering template', { templateId: template.id });
        try {
            const resolvedTemplate = await this.resolveVariables(template, context);
            const generatedSections = await this.generateSections(resolvedTemplate, context);
            const styledContent = await this.applyStyles(generatedSections.map(s => s.content).join('\n\n'), template.styles);
            const validation = await this.validateRenderedContent({
                content: styledContent.content,
                metadata: {
                    templateId: template.id,
                    rendered: new Date(),
                    variables: context.variables || {},
                    sections: generatedSections.length
                },
                sections: generatedSections,
                assets: []
            });
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('template_render', processingTime);
            const result = {
                content: styledContent.content,
                metadata: {
                    templateId: template.id,
                    rendered: new Date(),
                    variables: context.variables || {},
                    sections: generatedSections.length,
                    processingTime,
                    validation: validation.passed
                },
                sections: generatedSections,
                assets: styledContent.assets || []
            };
            this.logger.debug('Template rendered successfully', {
                templateId: template.id,
                processingTime,
                contentLength: result.content.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Template rendering failed', { error, templateId: template.id });
            throw error;
        }
    }
    async customizeTemplate(template, customization) {
        const startTime = Date.now();
        this.logger.debug('Customizing template', { templateId: template.id });
        try {
            const customizedTemplate = {
                ...template,
                id: `${template.id}-customized-${Date.now()}`,
                customization,
                metadata: {
                    ...template.metadata,
                    customizedAt: new Date(),
                    originalTemplateId: template.id
                }
            };
            if (customization.variables) {
                customizedTemplate.variables = template.variables.map(variable => ({
                    ...variable,
                    value: customization.variables[variable.name] || variable.value
                }));
            }
            if (customization.sections) {
                customizedTemplate.sections = template.sections.map(section => {
                    const sectionCustomization = customization.sections.find(sc => sc.sectionId === section.id);
                    if (sectionCustomization) {
                        return {
                            ...section,
                            enabled: sectionCustomization.enabled,
                            order: sectionCustomization.order || section.order,
                            content: sectionCustomization.content || section.content
                        };
                    }
                    return section;
                });
            }
            if (customization.styles) {
                customizedTemplate.styles = [
                    ...template.styles,
                    ...customization.styles.map(style => ({
                        selector: style.selector,
                        properties: style.properties
                    }))
                ];
            }
            const validation = await this.validateTemplate(customizedTemplate);
            if (!validation.isValid) {
                this.logger.warn('Customized template validation failed', {
                    templateId: template.id,
                    errors: validation.errors
                });
            }
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('template_customize', processingTime);
            this.logger.debug('Template customized successfully', {
                templateId: template.id,
                customizedTemplateId: customizedTemplate.id,
                processingTime
            });
            return customizedTemplate;
        }
        catch (error) {
            this.logger.error('Template customization failed', { error, templateId: template.id });
            throw error;
        }
    }
    async validateTemplate(template) {
        this.logger.debug('Validating template', { templateId: template.id });
        const errors = [];
        const warnings = [];
        try {
            if (!template.id || typeof template.id !== 'string') {
                errors.push('Template ID is required and must be a string');
            }
            if (!template.name || typeof template.name !== 'string') {
                errors.push('Template name is required and must be a string');
            }
            if (!template.sections || !Array.isArray(template.sections)) {
                errors.push('Template sections must be an array');
            }
            else {
                template.sections.forEach((section, index) => {
                    if (!section.id) {
                        errors.push(`Section ${index} is missing ID`);
                    }
                    if (!section.title) {
                        errors.push(`Section ${index} is missing title`);
                    }
                    if (typeof section.content !== 'string') {
                        errors.push(`Section ${index} content must be a string`);
                    }
                });
            }
            if (template.variables && Array.isArray(template.variables)) {
                template.variables.forEach((variable, index) => {
                    if (!variable.name) {
                        errors.push(`Variable ${index} is missing name`);
                    }
                    if (!variable.type) {
                        errors.push(`Variable ${index} is missing type`);
                    }
                    if (variable.required && variable.value === undefined) {
                        warnings.push(`Required variable ${variable.name} has no default value`);
                    }
                });
            }
            if (template.styles && Array.isArray(template.styles)) {
                template.styles.forEach((style, index) => {
                    if (!style.selector) {
                        errors.push(`Style ${index} is missing selector`);
                    }
                    if (!style.properties || typeof style.properties !== 'object') {
                        errors.push(`Style ${index} properties must be an object`);
                    }
                });
            }
            if (template.sections) {
                for (const section of template.sections) {
                    try {
                        this.handlebars.compile(section.content);
                    }
                    catch (handlebarsError) {
                        errors.push(`Invalid Handlebars syntax in section ${section.id}: ${handlebarsError.message}`);
                    }
                }
            }
            const result = {
                isValid: errors.length === 0,
                errors,
                warnings,
                validatedAt: new Date(),
                templateId: template.id
            };
            this.logger.debug('Template validation completed', {
                templateId: template.id,
                isValid: result.isValid,
                errorCount: errors.length,
                warningCount: warnings.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Template validation failed', { error, templateId: template.id });
            throw error;
        }
    }
    async optimizeTemplate(template, usage) {
        const startTime = Date.now();
        this.logger.debug('Optimizing template', { templateId: template.id });
        try {
            const optimizedTemplate = {
                ...template,
                id: `${template.id}-optimized-${Date.now()}`,
                optimization: {
                    appliedAt: new Date(),
                    originalTemplateId: template.id,
                    usageMetrics: usage,
                    optimizations: []
                }
            };
            if (usage.sectionUsage) {
                optimizedTemplate.sections = template.sections
                    .filter(section => usage.sectionUsage[section.id]?.usage > 0.1)
                    .sort((a, b) => (usage.sectionUsage[b.id]?.usage || 0) - (usage.sectionUsage[a.id]?.usage || 0));
                optimizedTemplate.optimization.optimizations.push('Filtered and sorted sections by usage');
            }
            if (usage.variableUsage) {
                optimizedTemplate.variables = template.variables.filter(variable => usage.variableUsage[variable.name]?.usage > 0.05);
                optimizedTemplate.optimization.optimizations.push('Removed unused variables');
            }
            if (usage.styleUsage) {
                optimizedTemplate.styles = template.styles.filter(style => usage.styleUsage[style.selector]?.usage > 0.1);
                optimizedTemplate.optimization.optimizations.push('Removed unused styles');
            }
            for (const section of optimizedTemplate.sections) {
                try {
                    const compiled = this.handlebars.compile(section.content);
                    optimizedTemplate.optimization.compiledSections = optimizedTemplate.optimization.compiledSections || {};
                    optimizedTemplate.optimization.compiledSections[section.id] = compiled;
                }
                catch (error) {
                    this.logger.warn('Failed to compile section for optimization', {
                        sectionId: section.id,
                        error
                    });
                }
            }
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('template_optimize', processingTime);
            this.logger.debug('Template optimized successfully', {
                templateId: template.id,
                optimizedTemplateId: optimizedTemplate.id,
                optimizations: optimizedTemplate.optimization.optimizations.length,
                processingTime
            });
            return optimizedTemplate;
        }
        catch (error) {
            this.logger.error('Template optimization failed', { error, templateId: template.id });
            throw error;
        }
    }
    async resolveVariables(template, context) {
        const resolvedTemplate = {
            ...template,
            resolvedVariables: {}
        };
        for (const variable of template.variables) {
            const value = await this.variableResolver.resolve(variable, context);
            resolvedTemplate.resolvedVariables[variable.name] = value;
        }
        if (context.variables) {
            for (const [name, value] of Object.entries(context.variables)) {
                resolvedTemplate.resolvedVariables[name] = value;
            }
        }
        return resolvedTemplate;
    }
    async generateSections(template, context) {
        const sections = [];
        for (const section of template.sections) {
            try {
                const generatedSection = await this.sectionGenerator.generate(section, template.resolvedVariables, context);
                sections.push(generatedSection);
            }
            catch (error) {
                this.logger.error('Section generation failed', {
                    sectionId: section.id,
                    error
                });
                throw error;
            }
        }
        return sections;
    }
    async applyStyles(content, styles) {
        return await this.styleApplicator.apply(content, styles);
    }
    async validateRenderedContent(content) {
        const errors = [];
        const warnings = [];
        if (!content.content || typeof content.content !== 'string') {
            errors.push('Rendered content must be a string');
        }
        if (content.content && content.content.length === 0) {
            warnings.push('Rendered content is empty');
        }
        if (!content.sections || !Array.isArray(content.sections)) {
            errors.push('Rendered content must have sections array');
        }
        if (!content.metadata || typeof content.metadata !== 'object') {
            errors.push('Rendered content must have metadata object');
        }
        return {
            passed: errors.length === 0,
            errors,
            warnings,
            validatedAt: new Date(),
            contentLength: content.content?.length || 0
        };
    }
    async loadTemplateFromFile(templateId) {
        const templatePath = path.join(__dirname, '../../templates', `${templateId}.yaml`);
        try {
            const fileContent = await fs.readFile(templatePath, 'utf-8');
            const templateData = yaml.parse(fileContent);
            return {
                id: templateId,
                name: templateData.name || templateId,
                type: templateData.type || { category: 'technical' },
                structure: templateData.structure || { sections: [], variables: [], styles: [] },
                variables: templateData.variables || [],
                sections: templateData.sections || [],
                styles: templateData.styles || [],
                validation: { rules: [], required: false, errorHandling: 'warn' },
                metadata: {
                    created: new Date(),
                    updated: new Date(),
                    version: templateData.version || '1.0.0',
                    author: templateData.author || 'system',
                    description: templateData.description || '',
                    category: templateData.category || 'technical'
                }
            };
        }
        catch (error) {
            throw new index_js_1.TemplateError(`Failed to load template from file: ${templatePath}`, 'TEMPLATE_FILE_ERROR', templateId, error);
        }
    }
    async initializeTemplateEngine() {
        this.handlebars.registerHelper('formatDate', (date) => {
            return date.toISOString().split('T')[0];
        });
        this.handlebars.registerHelper('capitalize', (str) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        });
        this.handlebars.registerHelper('join', (array, separator) => {
            return array.join(separator);
        });
        this.handlebars.registerHelper('markdown', (text) => {
            return (0, marked_1.marked)(text);
        });
        this.handlebars.registerHelper('if_eq', function (a, b, options) {
            if (a === b) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
        this.handlebars.registerHelper('unless_eq', function (a, b, options) {
            if (a !== b) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
        await this.loadDefaultTemplates();
    }
    async loadDefaultTemplates() {
        const defaultTemplates = [
            'technical-default-technical',
            'technical-default-user',
            'technical-default-api',
            'technical-react-technical',
            'technical-vue-technical',
            'technical-angular-technical',
            'api-openapi-interactive',
            'api-openapi-static',
            'readme-library',
            'readme-application',
            'changelog-keepachangelog',
            'tutorial-beginner',
            'tutorial-intermediate',
            'tutorial-advanced'
        ];
        for (const templateId of defaultTemplates) {
            try {
                const template = await this.createDefaultTemplate(templateId);
                this.templateRegistry.set(templateId, template);
                this.logger.debug('Default template loaded', { templateId });
            }
            catch (error) {
                this.logger.warn('Failed to load default template', { templateId, error });
            }
        }
    }
    async createDefaultTemplate(templateId) {
        const [type, framework, docType] = templateId.split('-');
        return {
            id: templateId,
            name: `${type} ${framework} ${docType}`.replace(/\b\w/g, l => l.toUpperCase()),
            type: { category: docType, subtype: framework, template: templateId, customization: {} },
            structure: {
                sections: [
                    { id: 'overview', title: 'Overview', order: 1, required: true, content: '', variables: [] },
                    { id: 'installation', title: 'Installation', order: 2, required: true, content: '', variables: [] },
                    { id: 'usage', title: 'Usage', order: 3, required: true, content: '', variables: [] }
                ],
                variables: [
                    { name: 'projectName', type: 'string', required: true, default: '', description: 'Project name' },
                    { name: 'version', type: 'string', required: false, default: '1.0.0', description: 'Project version' }
                ],
                styles: [],
                metadata: {
                    created: new Date(),
                    updated: new Date(),
                    version: '1.0.0',
                    author: 'system',
                    description: `Default template for ${type} ${framework} ${docType}`,
                    category: docType
                }
            },
            variables: [
                { name: 'projectName', type: 'string', value: '', description: 'Project name' },
                { name: 'version', type: 'string', value: '1.0.0', description: 'Project version' }
            ],
            sections: [
                {
                    id: 'overview',
                    title: 'Overview',
                    content: '# {{projectName}}\n\nOverview of {{projectName}} version {{version}}.',
                    order: 1,
                    required: true
                },
                {
                    id: 'installation',
                    title: 'Installation',
                    content: '## Installation\n\nInstallation instructions for {{projectName}}.',
                    order: 2,
                    required: true
                },
                {
                    id: 'usage',
                    title: 'Usage',
                    content: '## Usage\n\nUsage examples for {{projectName}}.',
                    order: 3,
                    required: true
                }
            ],
            styles: [],
            validation: { rules: [], required: true, errorHandling: 'warn' },
            metadata: {
                created: new Date(),
                updated: new Date(),
                version: '1.0.0',
                author: 'system',
                description: `Default template for ${type} ${framework} ${docType}`,
                category: docType
            }
        };
    }
    async getRegisteredTemplates() {
        return Array.from(this.templateRegistry.keys());
    }
    async getTemplateUsage(templateId) {
        return null;
    }
    async shutdown() {
        this.logger.info('Shutting down TemplateEngine');
        await this.cacheManager.shutdown();
        this.templateRegistry.clear();
        this.logger.info('TemplateEngine shutdown completed');
    }
}
exports.TemplateEngine = TemplateEngine;
class VariableResolverImpl {
    async resolve(variable, context) {
        if (context.variables && context.variables[variable.name] !== undefined) {
            return context.variables[variable.name];
        }
        if (variable.value !== undefined) {
            return variable.value;
        }
        switch (variable.type) {
            case 'string':
                return '';
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
}
class SectionGeneratorImpl {
    constructor() {
        this.handlebars = Handlebars.create();
    }
    async generate(section, variables, context) {
        const template = this.handlebars.compile(section.content);
        const content = template(variables);
        return {
            id: section.id,
            title: section.title,
            content,
            order: section.order,
            metadata: {
                generated: new Date(),
                variables: Object.keys(variables),
                contentLength: content.length
            }
        };
    }
}
class StyleApplicatorImpl {
    async apply(content, styles) {
        let styledContent = content;
        for (const style of styles) {
            if (style.selector.startsWith('.')) {
                const className = style.selector.substring(1);
                styledContent = styledContent.replace(new RegExp(`<([^>]+)class="([^"]*)"`, 'g'), `<$1class="$2 ${className}"`);
            }
        }
        return {
            content: styledContent,
            appliedStyles: styles.length,
            assets: []
        };
    }
}
//# sourceMappingURL=TemplateEngine.js.map