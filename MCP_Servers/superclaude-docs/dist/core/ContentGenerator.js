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
exports.ContentGenerator = void 0;
const TemplateEngine_js_1 = require("./TemplateEngine.js");
const Context7Client_js_1 = require("../utils/Context7Client.js");
const IntelligenceClient_js_1 = require("../utils/IntelligenceClient.js");
const PersonaClient_js_1 = require("../utils/PersonaClient.js");
const Logger_js_1 = require("../utils/Logger.js");
const PerformanceMonitor_js_1 = require("../utils/PerformanceMonitor.js");
const marked_1 = require("marked");
const cheerio = __importStar(require("cheerio"));
class ContentGenerator {
    constructor(config) {
        this.config = config;
        this.logger = new Logger_js_1.Logger('ContentGenerator');
        this.performanceMonitor = new PerformanceMonitor_js_1.PerformanceMonitor();
        this.templateEngine = new TemplateEngine_js_1.TemplateEngine(config);
        this.context7Client = new Context7Client_js_1.Context7Client(config);
        this.intelligenceClient = new IntelligenceClient_js_1.IntelligenceClient(config);
        this.personaClient = new PersonaClient_js_1.PersonaClient(config);
        this.logger.info('ContentGenerator initialized');
    }
    async generateTechnicalDocs(target, specs) {
        const startTime = Date.now();
        this.logger.info('Starting technical documentation generation', { target, specs });
        try {
            const analysis = await this.analyzeTarget(target);
            this.logger.debug('Target analysis completed', { analysis });
            const patterns = await this.getDocumentationPatterns(specs.framework || analysis.detectedFramework);
            this.logger.debug('Documentation patterns retrieved', { patterns: patterns.length });
            const context = {
                target,
                analysis,
                patterns,
                specifications: specs,
                language: specs.language || "en",
                audience: specs.audience || "developer",
                framework: specs.framework,
                detectedFramework: analysis.detectedFramework
            };
            const template = await this.selectTechnicalTemplate(context);
            this.logger.debug('Template selected', { templateId: template.id });
            const sections = await this.generateTechnicalSections(context);
            this.logger.debug('Content sections generated', { sectionCount: sections.length });
            const documentation = await this.assembleDocumentation(template, sections, context);
            this.logger.debug('Documentation assembled');
            const validation = await this.validateGeneratedContent(documentation);
            if (!validation.passed) {
                this.logger.warn('Generated content validation failed', { issues: validation.issues });
            }
            documentation.content = await this.ensureAccessibility(documentation.content);
            this.logger.debug('Accessibility standards applied');
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('technical_docs_generation', processingTime);
            const result = {
                content: documentation.content,
                metadata: {
                    ...documentation.metadata,
                    generated: new Date(),
                    processingTime
                },
                structure: documentation.structure,
                assets: documentation.assets,
                quality: validation,
                analysis
            };
            this.logger.info('Technical documentation generation completed', {
                processingTime,
                contentLength: result.content.length,
                qualityScore: validation.score
            });
            return result;
        }
        catch (error) {
            this.logger.error('Technical documentation generation failed', { error, target, specs });
            throw error;
        }
    }
    async generateAPIDocumentation(apiSpec) {
        const startTime = Date.now();
        this.logger.info('Starting API documentation generation', { apiSpec: apiSpec.info });
        try {
            const validation = await this.validateAPISpecification(apiSpec);
            if (!validation.isValid) {
                throw new Error(`Invalid API specification: ${validation.errors.join(', ')}`);
            }
            const sections = await Promise.all([
                this.generateAPIOverview(apiSpec),
                this.generateAuthenticationDocs(apiSpec),
                this.generateEndpointDocs(apiSpec),
                this.generateSchemasDocs(apiSpec),
                this.generateAPIExamples(apiSpec),
                this.generateErrorHandling(apiSpec)
            ]);
            const documentation = await this.assembleAPIDocumentation(sections, apiSpec);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('api_docs_generation', processingTime);
            const result = {
                content: documentation.content,
                metadata: {
                    generated: new Date(),
                    apiVersion: apiSpec.info.version,
                    endpointCount: Object.keys(apiSpec.paths).length,
                    processingTime
                },
                structure: documentation.structure,
                apiSpec,
                interactive: await this.generateInteractiveFeatures(apiSpec)
            };
            this.logger.info('API documentation generation completed', {
                processingTime,
                endpointCount: result.metadata.endpointCount
            });
            return result;
        }
        catch (error) {
            this.logger.error('API documentation generation failed', { error, apiSpec });
            throw error;
        }
    }
    async generateUserGuide(product, audience) {
        const startTime = Date.now();
        this.logger.info('Starting user guide generation', { product, audience });
        try {
            const mentorPersona = await this.personaClient.activatePersona('mentor', {
                audience: audience.level,
                language: audience.language,
                context: 'user_guide'
            });
            const sections = await this.generateUserGuideSections(product, audience, mentorPersona);
            const userGuide = await this.assembleUserGuide(sections, product, audience);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('user_guide_generation', processingTime);
            const result = {
                content: userGuide.content,
                metadata: {
                    generated: new Date(),
                    product: product.name,
                    audience: audience.level,
                    language: audience.language,
                    processingTime
                },
                structure: userGuide.structure,
                exercises: userGuide.exercises,
                resources: userGuide.resources
            };
            this.logger.info('User guide generation completed', {
                processingTime,
                sectionCount: sections.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('User guide generation failed', { error, product, audience });
            throw error;
        }
    }
    async generateTutorial(topic, learningPath) {
        const startTime = Date.now();
        this.logger.info('Starting tutorial generation', { topic, learningPath });
        try {
            const mentorPersona = await this.personaClient.activatePersona('mentor', {
                audience: learningPath.level,
                language: learningPath.language,
                context: 'tutorial'
            });
            const sections = await this.generateTutorialSections(topic, learningPath, mentorPersona);
            const interactiveElements = await this.generateInteractiveElements(topic, learningPath);
            const tutorial = await this.assembleTutorial(sections, interactiveElements, topic, learningPath);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('tutorial_generation', processingTime);
            const result = {
                content: tutorial.content,
                metadata: {
                    generated: new Date(),
                    topic: topic.name,
                    level: learningPath.level,
                    language: learningPath.language,
                    processingTime
                },
                structure: tutorial.structure,
                exercises: tutorial.exercises,
                assessments: tutorial.assessments,
                resources: tutorial.resources
            };
            this.logger.info('Tutorial generation completed', {
                processingTime,
                exerciseCount: result.exercises.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Tutorial generation failed', { error, topic, learningPath });
            throw error;
        }
    }
    async generateREADME(project) {
        const startTime = Date.now();
        this.logger.info('Starting README generation', { project });
        try {
            const projectAnalysis = await this.analyzeProject(project);
            const patterns = await this.getREADMEPatterns(projectAnalysis.type);
            const sections = await this.generateREADMESections(project, projectAnalysis, patterns);
            const readme = await this.assembleREADME(sections, project, projectAnalysis);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('readme_generation', processingTime);
            const result = {
                content: readme.content,
                metadata: {
                    generated: new Date(),
                    project: project.name,
                    type: projectAnalysis.type,
                    processingTime
                },
                structure: readme.structure,
                badges: readme.badges,
                assets: readme.assets
            };
            this.logger.info('README generation completed', {
                processingTime,
                contentLength: result.content.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('README generation failed', { error, project });
            throw error;
        }
    }
    async generateChangelog(changes, format) {
        const startTime = Date.now();
        this.logger.info('Starting changelog generation', { changeCount: changes.length, format });
        try {
            const groupedChanges = this.groupChangesByVersion(changes);
            const sections = await this.generateChangelogSections(groupedChanges, format);
            const changelog = await this.assembleChangelog(sections, format);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('changelog_generation', processingTime);
            const result = {
                content: changelog.content,
                metadata: {
                    generated: new Date(),
                    format: format.type,
                    versionCount: Object.keys(groupedChanges).length,
                    processingTime
                },
                structure: changelog.structure,
                versions: changelog.versions
            };
            this.logger.info('Changelog generation completed', {
                processingTime,
                versionCount: result.metadata.versionCount
            });
            return result;
        }
        catch (error) {
            this.logger.error('Changelog generation failed', { error, changes, format });
            throw error;
        }
    }
    async analyzeTarget(target) {
        this.logger.debug('Analyzing documentation target', { target });
        try {
            const analysis = await this.intelligenceClient.analyzeTarget(target);
            return {
                ...analysis,
                detectedFramework: analysis.frameworks?.[0] || 'unknown',
                complexity: this.calculateComplexity(analysis),
                recommendations: this.generateRecommendations(analysis)
            };
        }
        catch (error) {
            this.logger.error('Target analysis failed', { error, target });
            throw error;
        }
    }
    async getDocumentationPatterns(framework) {
        if (!this.config.integration.enableContext7Integration) {
            return [];
        }
        try {
            const patterns = await this.context7Client.getDocumentationPatterns(framework);
            return patterns || [];
        }
        catch (error) {
            this.logger.warn('Failed to get documentation patterns', { error, framework });
            return [];
        }
    }
    async selectTechnicalTemplate(context) {
        const templateId = this.determineTemplateId(context);
        return await this.templateEngine.loadTemplate(templateId);
    }
    async generateTechnicalSections(context) {
        const sections = [];
        sections.push(await this.generateOverview(context));
        sections.push(await this.generateArchitecture(context));
        sections.push(await this.generateInstallation(context));
        sections.push(await this.generateUsage(context));
        if (context.specifications.includeAPIReference) {
            sections.push(await this.generateAPIReference(context));
        }
        if (context.specifications.includeExamples) {
            sections.push(await this.generateExamples(context));
        }
        sections.push(await this.generateTroubleshooting(context));
        sections.push(await this.generateContributing(context));
        return sections;
    }
    async generateOverview(context) {
        const content = await this.generateSectionContent('overview', context);
        return {
            title: 'Overview',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'overview',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.3
            }
        };
    }
    async generateArchitecture(context) {
        const content = await this.generateSectionContent('architecture', context);
        return {
            title: 'Architecture',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'architecture',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.7
            }
        };
    }
    async generateInstallation(context) {
        const content = await this.generateSectionContent('installation', context);
        return {
            title: 'Installation',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'installation',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.4
            }
        };
    }
    async generateUsage(context) {
        const content = await this.generateSectionContent('usage', context);
        return {
            title: 'Usage',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'usage',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.5
            }
        };
    }
    async generateAPIReference(context) {
        const apiInfo = await this.intelligenceClient.analyzeAPI(context.target.path);
        const content = await this.generateAPIReferenceContent(apiInfo);
        return {
            title: 'API Reference',
            content,
            level: 1,
            subsections: apiInfo.endpoints?.map(endpoint => ({
                title: `${endpoint.method} ${endpoint.path}`,
                content: this.formatEndpointDocumentation(endpoint),
                level: 2
            })),
            metadata: {
                level: 1,
                anchor: 'api-reference',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.8
            }
        };
    }
    async generateExamples(context) {
        const content = await this.generateSectionContent('examples', context);
        return {
            title: 'Examples',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'examples',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.6
            }
        };
    }
    async generateTroubleshooting(context) {
        const content = await this.generateSectionContent('troubleshooting', context);
        return {
            title: 'Troubleshooting',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'troubleshooting',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.5
            }
        };
    }
    async generateContributing(context) {
        const content = await this.generateSectionContent('contributing', context);
        return {
            title: 'Contributing',
            content,
            level: 1,
            metadata: {
                level: 1,
                anchor: 'contributing',
                generated: new Date(),
                wordCount: content.split(' ').length,
                complexity: 0.4
            }
        };
    }
    async generateSectionContent(sectionType, context) {
        const template = await this.getSectionTemplate(sectionType, context);
        const variables = await this.extractTemplateVariables(context);
        const rendered = await this.templateEngine.renderTemplate(template, { ...context, ...variables });
        return rendered.content;
    }
    async getSectionTemplate(sectionType, context) {
        const templateId = `${sectionType}-${context.specifications.docType}`;
        return await this.templateEngine.loadTemplate(templateId);
    }
    async extractTemplateVariables(context) {
        return {
            projectName: context.target.path.split('/').pop() || 'Project',
            framework: context.framework || context.detectedFramework || 'Unknown',
            language: context.language,
            audience: context.audience,
            complexity: context.analysis.complexity,
            features: context.analysis.features || [],
            dependencies: context.analysis.dependencies || []
        };
    }
    async assembleDocumentation(template, sections, context) {
        const content = sections.map(section => {
            const level = '#'.repeat(section.level);
            let sectionContent = `${level} ${section.title}\n\n${section.content}\n\n`;
            if (section.subsections) {
                sectionContent += section.subsections.map(subsection => {
                    const subLevel = '#'.repeat(subsection.level);
                    return `${subLevel} ${subsection.title}\n\n${subsection.content}\n\n`;
                }).join('');
            }
            return sectionContent;
        }).join('');
        return {
            title: `${context.target.path} Documentation`,
            content,
            metadata: {
                generated: new Date(),
                target: context.target,
                specifications: context.specifications,
                template: template.id,
                language: context.language,
                qualityScore: 0.9,
                type: 'technical'
            },
            structure: {
                sections,
                tableOfContents: this.generateTableOfContents(sections),
                crossReferences: [],
                assets: []
            },
            assets: [],
            translations: [],
            quality: {
                overallScore: 0.9,
                accuracy: 0.95,
                completeness: 0.85,
                consistency: 0.9,
                accessibility: 0.95,
                readability: 0.8,
                issues: []
            }
        };
    }
    generateTableOfContents(sections) {
        return sections.map(section => ({
            title: section.title,
            level: section.level,
            anchor: section.metadata?.anchor || section.title.toLowerCase().replace(/\s+/g, '-'),
            subsections: section.subsections?.map(subsection => ({
                title: subsection.title,
                level: subsection.level,
                anchor: subsection.title.toLowerCase().replace(/\s+/g, '-')
            })) || []
        }));
    }
    async validateGeneratedContent(content) {
        const issues = [];
        if (content.content.length < 100) {
            issues.push({
                rule: 'minimum-length',
                message: 'Content is too short',
                location: { startLine: 1, endLine: 1, startColumn: 1, endColumn: 1, context: 'content' },
                severity: 'warning',
                autoFixable: false
            });
        }
        return {
            passed: issues.length === 0,
            issues,
            score: Math.max(0, 1 - (issues.length * 0.1)),
            suggestions: issues.length > 0 ? ['Consider expanding the content'] : []
        };
    }
    async ensureAccessibility(content) {
        const $ = cheerio.load((0, marked_1.marked)(content));
        $('img').each((i, img) => {
            const $img = $(img);
            if (!$img.attr('alt')) {
                $img.attr('alt', 'Documentation image');
            }
        });
        this.fixHeadingHierarchy($);
        return $.html();
    }
    fixHeadingHierarchy($) {
        const headings = $('h1, h2, h3, h4, h5, h6');
        let currentLevel = 0;
        headings.each((i, heading) => {
            const $heading = $(heading);
            const level = parseInt(heading.tagName.substring(1));
            if (level > currentLevel + 1) {
                $heading.replaceWith(`<h${currentLevel + 1}>${$heading.html()}</h${currentLevel + 1}>`);
                currentLevel = currentLevel + 1;
            }
            else {
                currentLevel = level;
            }
        });
    }
    calculateComplexity(analysis) {
        let complexity = 0;
        if (analysis.files?.length > 100)
            complexity += 0.3;
        if (analysis.dependencies?.length > 50)
            complexity += 0.2;
        if (analysis.frameworks?.length > 3)
            complexity += 0.2;
        if (analysis.languages?.length > 2)
            complexity += 0.1;
        return Math.min(complexity, 1);
    }
    generateRecommendations(analysis) {
        const recommendations = [];
        if (analysis.complexity > 0.7) {
            recommendations.push('Consider breaking down complex sections');
        }
        if (analysis.dependencies?.length > 50) {
            recommendations.push('Document key dependencies');
        }
        return recommendations;
    }
    determineTemplateId(context) {
        if (context.framework) {
            return `technical-${context.framework}-${context.specifications.docType}`;
        }
        return `technical-default-${context.specifications.docType}`;
    }
    formatEndpointDocumentation(endpoint) {
        return `**${endpoint.method.toUpperCase()}** \`${endpoint.path}\`

${endpoint.description || 'No description available'}

**Parameters:**
${endpoint.parameters?.map((param) => `- ${param.name} (${param.type}): ${param.description}`).join('\n') || 'None'}

**Responses:**
${endpoint.responses?.map((resp) => `- ${resp.code}: ${resp.description}`).join('\n') || 'None'}`;
    }
    async validateAPISpecification(apiSpec) {
        return { isValid: true, errors: [] };
    }
    async generateAPIOverview(apiSpec) {
        return {
            title: 'API Overview',
            content: `# ${apiSpec.info.title}\n\n${apiSpec.info.description}\n\n**Version:** ${apiSpec.info.version}`,
            level: 1
        };
    }
    async generateAuthenticationDocs(apiSpec) {
        return {
            title: 'Authentication',
            content: 'Authentication information...',
            level: 1
        };
    }
    async generateEndpointDocs(apiSpec) {
        return {
            title: 'Endpoints',
            content: 'Endpoint documentation...',
            level: 1
        };
    }
    async generateSchemasDocs(apiSpec) {
        return {
            title: 'Schemas',
            content: 'Schema documentation...',
            level: 1
        };
    }
    async generateAPIExamples(apiSpec) {
        return {
            title: 'Examples',
            content: 'API examples...',
            level: 1
        };
    }
    async generateErrorHandling(apiSpec) {
        return {
            title: 'Error Handling',
            content: 'Error handling documentation...',
            level: 1
        };
    }
    async assembleAPIDocumentation(sections, apiSpec) {
        return {
            content: sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n'),
            structure: { sections }
        };
    }
    async generateInteractiveFeatures(apiSpec) {
        return {
            tryItOut: true,
            codeExamples: [],
            playground: null
        };
    }
    async generateAPIReferenceContent(apiInfo) {
        return `API Reference for ${apiInfo.name || 'API'}\n\nThis section contains detailed information about all available endpoints.`;
    }
    async generateUserGuideSections(product, audience, persona) {
        return [
            {
                title: 'Getting Started',
                content: `Welcome to ${product.name}! This guide will help you get started.`,
                level: 1
            }
        ];
    }
    async assembleUserGuide(sections, product, audience) {
        return {
            content: sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n'),
            structure: { sections },
            exercises: [],
            resources: []
        };
    }
    async generateTutorialSections(topic, learningPath, persona) {
        return [
            {
                title: 'Introduction',
                content: `Welcome to the ${topic.name} tutorial!`,
                level: 1
            }
        ];
    }
    async generateInteractiveElements(topic, learningPath) {
        return {
            exercises: [],
            quizzes: [],
            demos: []
        };
    }
    async assembleTutorial(sections, interactiveElements, topic, learningPath) {
        return {
            content: sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n'),
            structure: { sections },
            exercises: interactiveElements.exercises,
            assessments: interactiveElements.quizzes,
            resources: []
        };
    }
    async analyzeProject(project) {
        return {
            type: 'library',
            framework: 'typescript',
            complexity: 0.5
        };
    }
    async getREADMEPatterns(projectType) {
        return [];
    }
    async generateREADMESections(project, analysis, patterns) {
        return [
            {
                title: project.name,
                content: `# ${project.name}\n\n${project.description || 'Project description'}`,
                level: 1
            }
        ];
    }
    async assembleREADME(sections, project, analysis) {
        return {
            content: sections.map(s => s.content).join('\n\n'),
            structure: { sections },
            badges: [],
            assets: []
        };
    }
    groupChangesByVersion(changes) {
        return changes.reduce((acc, change) => {
            if (!acc[change.version]) {
                acc[change.version] = [];
            }
            acc[change.version].push(change);
            return acc;
        }, {});
    }
    async generateChangelogSections(groupedChanges, format) {
        return Object.entries(groupedChanges).map(([version, changes]) => ({
            title: `Version ${version}`,
            content: changes.map(change => `- ${change.type}: ${change.description}`).join('\n'),
            level: 2
        }));
    }
    async assembleChangelog(sections, format) {
        return {
            content: `# Changelog\n\n${sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n')}`,
            structure: { sections },
            versions: sections.map(s => s.title.replace('Version ', ''))
        };
    }
}
exports.ContentGenerator = ContentGenerator;
//# sourceMappingURL=ContentGenerator.js.map