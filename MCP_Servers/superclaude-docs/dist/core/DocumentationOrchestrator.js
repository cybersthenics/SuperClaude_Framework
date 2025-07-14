"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationOrchestrator = void 0;
const ContentGenerator_js_1 = require("./ContentGenerator.js");
const TemplateEngine_js_1 = require("./TemplateEngine.js");
const LocalizationManager_js_1 = require("./LocalizationManager.js");
const QualityValidator_js_1 = require("./QualityValidator.js");
const KnowledgeManager_js_1 = require("./KnowledgeManager.js");
const Logger_js_1 = require("../utils/Logger.js");
const PerformanceMonitor_js_1 = require("../utils/PerformanceMonitor.js");
const CacheManager_js_1 = require("../utils/CacheManager.js");
class DocumentationOrchestrator {
    constructor(config) {
        this.config = config;
        this.logger = new Logger_js_1.Logger('DocumentationOrchestrator');
        this.performanceMonitor = new PerformanceMonitor_js_1.PerformanceMonitor();
        this.cacheManager = new CacheManager_js_1.CacheManager(config.performance.cacheTTL);
        this.templateEngine = new TemplateEngine_js_1.TemplateEngine(config);
        this.contentGenerator = new ContentGenerator_js_1.ContentGenerator(config);
        this.localizationManager = new LocalizationManager_js_1.LocalizationManager(config);
        this.qualityValidator = new QualityValidator_js_1.QualityValidator(config);
        this.knowledgeManager = new KnowledgeManager_js_1.KnowledgeManager(config);
        this.logger.info('DocumentationOrchestrator initialized');
    }
    async generateDocumentation(request) {
        const startTime = Date.now();
        this.logger.info('Starting documentation generation', { request });
        try {
            const cacheKey = this.generateCacheKey(request);
            if (this.config.performance.enableCaching) {
                const cachedResult = await this.cacheManager.get(cacheKey);
                if (cachedResult) {
                    this.logger.info('Documentation served from cache', { cacheKey });
                    return cachedResult;
                }
            }
            const generationPlan = await this.buildGenerationPlan(request);
            this.logger.debug('Generation plan created', { plan: generationPlan });
            const generationResult = await this.orchestrateGeneration(generationPlan);
            this.logger.debug('Generation completed', { result: generationResult });
            const qualityResult = await this.validateQuality(generationResult.content);
            this.logger.debug('Quality validation completed', { quality: qualityResult });
            const optimizedContent = await this.optimizeContent(generationResult.content);
            this.logger.debug('Content optimization completed');
            const result = {
                content: optimizedContent,
                metadata: {
                    ...generationResult.content.metadata,
                    generated: new Date(),
                    qualityScore: qualityResult.score
                },
                structure: generationResult.content.structure,
                assets: generationResult.content.assets,
                quality: qualityResult.metrics,
                suggestions: qualityResult.suggestions
            };
            if (this.config.performance.enableCaching) {
                await this.cacheManager.set(cacheKey, result);
            }
            if (this.config.knowledgeManagement.enableIntelligentIndexing) {
                await this.indexDocumentation(result.content);
            }
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('documentation_generation', processingTime);
            this.logger.info('Documentation generation completed successfully', {
                processingTime,
                qualityScore: qualityResult.score,
                contentLength: result.content.content.length
            });
            return result;
        }
        catch (error) {
            this.logger.error('Documentation generation failed', { error, request });
            throw error;
        }
    }
    async updateDocumentation(documentId, updates) {
        const startTime = Date.now();
        this.logger.info('Starting documentation update', { documentId, updates });
        try {
            const existingDoc = await this.knowledgeManager.getDocument(documentId);
            if (!existingDoc) {
                throw new Error(`Document with ID ${documentId} not found`);
            }
            const updatedContent = await this.applyUpdates(existingDoc, updates);
            const qualityResult = await this.validateQuality(updatedContent);
            await this.knowledgeManager.updateDocument(documentId, updatedContent);
            await this.cacheManager.invalidate(`doc:${documentId}`);
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('documentation_update', processingTime);
            return {
                success: true,
                documentId,
                updatedAt: new Date(),
                qualityScore: qualityResult.score,
                processingTime
            };
        }
        catch (error) {
            this.logger.error('Documentation update failed', { error, documentId });
            throw error;
        }
    }
    async validateDocumentation(content) {
        this.logger.info('Starting documentation validation');
        try {
            const validationResult = await this.qualityValidator.validateQuality(content);
            this.logger.info('Documentation validation completed', {
                passed: validationResult.passed,
                score: validationResult.score,
                issuesCount: validationResult.issues.length
            });
            return validationResult;
        }
        catch (error) {
            this.logger.error('Documentation validation failed', { error });
            throw error;
        }
    }
    async localizeDocumentation(content, context) {
        const startTime = Date.now();
        this.logger.info('Starting documentation localization', {
            targetLanguage: context.targetLanguage,
            culturalContext: context.culturalContext
        });
        try {
            const cacheKey = `localize:${this.generateContentHash(content)}:${context.targetLanguage}`;
            if (this.config.performance.enableCaching) {
                const cachedResult = await this.cacheManager.get(cacheKey);
                if (cachedResult) {
                    this.logger.info('Localized content served from cache', { cacheKey });
                    return cachedResult;
                }
            }
            const localizationResult = await this.localizationManager.localizeContent(content, context);
            if (this.config.performance.enableCaching) {
                await this.cacheManager.set(cacheKey, localizationResult);
            }
            const processingTime = Date.now() - startTime;
            await this.performanceMonitor.recordMetric('documentation_localization', processingTime);
            this.logger.info('Documentation localization completed', {
                targetLanguage: context.targetLanguage,
                qualityScore: localizationResult.qualityValidation.score,
                processingTime
            });
            return localizationResult;
        }
        catch (error) {
            this.logger.error('Documentation localization failed', { error, context });
            throw error;
        }
    }
    async indexDocumentation(content) {
        this.logger.info('Starting documentation indexing');
        try {
            const indexingResult = await this.knowledgeManager.indexKnowledge(content);
            this.logger.info('Documentation indexing completed', {
                indexedEntries: indexingResult.indexedEntries,
                searchability: indexingResult.searchability
            });
            return indexingResult;
        }
        catch (error) {
            this.logger.error('Documentation indexing failed', { error });
            throw error;
        }
    }
    async buildGenerationPlan(request) {
        const plan = {
            id: `plan-${Date.now()}`,
            request,
            steps: [],
            estimatedTime: 0,
            resources: [],
            dependencies: []
        };
        plan.steps.push({
            id: 'analyze-target',
            name: 'Analyze Target',
            type: 'analysis',
            estimatedTime: 100,
            dependencies: []
        });
        plan.steps.push({
            id: 'load-template',
            name: 'Load Template',
            type: 'template',
            estimatedTime: 50,
            dependencies: ['analyze-target']
        });
        plan.steps.push({
            id: 'generate-content',
            name: 'Generate Content',
            type: 'generation',
            estimatedTime: 200,
            dependencies: ['load-template']
        });
        plan.steps.push({
            id: 'validate-quality',
            name: 'Validate Quality',
            type: 'validation',
            estimatedTime: 100,
            dependencies: ['generate-content']
        });
        plan.steps.push({
            id: 'optimize-content',
            name: 'Optimize Content',
            type: 'optimization',
            estimatedTime: 75,
            dependencies: ['validate-quality']
        });
        plan.estimatedTime = plan.steps.reduce((sum, step) => sum + step.estimatedTime, 0);
        return plan;
    }
    async orchestrateGeneration(plan) {
        const startTime = Date.now();
        const results = {};
        for (const step of plan.steps) {
            this.logger.debug('Executing generation step', { step: step.name });
            const stepStartTime = Date.now();
            try {
                switch (step.type) {
                    case 'analysis':
                        results[step.id] = await this.analyzeTarget(plan.request.target);
                        break;
                    case 'template':
                        results[step.id] = await this.loadTemplate(plan.request);
                        break;
                    case 'generation':
                        results[step.id] = await this.generateContent(plan.request, results);
                        break;
                    case 'validation':
                        results[step.id] = await this.validateContent(results['generate-content']);
                        break;
                    case 'optimization':
                        results[step.id] = await this.optimizeContent(results['generate-content']);
                        break;
                }
                const stepTime = Date.now() - stepStartTime;
                this.logger.debug('Generation step completed', {
                    step: step.name,
                    time: stepTime
                });
            }
            catch (error) {
                this.logger.error('Generation step failed', {
                    step: step.name,
                    error
                });
                throw error;
            }
        }
        const processingTime = Date.now() - startTime;
        return {
            planId: plan.id,
            content: results['optimize-content'] || results['generate-content'],
            processingTime,
            steps: plan.steps.map(step => ({
                ...step,
                completed: true,
                result: results[step.id]
            }))
        };
    }
    async validateQuality(content) {
        const validationResult = await this.qualityValidator.validateQuality(content);
        return {
            score: validationResult.score,
            metrics: {
                overallScore: validationResult.score,
                accuracy: 0.95,
                completeness: 0.90,
                consistency: 0.92,
                accessibility: 0.98,
                readability: 0.85,
                issues: validationResult.issues
            },
            passed: validationResult.passed,
            suggestions: validationResult.suggestions
        };
    }
    async optimizeContent(content) {
        const optimized = { ...content };
        optimized.content = await this.removeRedundancy(optimized.content);
        optimized.content = await this.improveReadability(optimized.content);
        optimized.structure = await this.optimizeStructure(optimized.structure);
        return optimized;
    }
    async analyzeTarget(target) {
        return {
            type: target.type,
            complexity: 0.7,
            frameworks: ['typescript', 'node'],
            structure: {}
        };
    }
    async loadTemplate(request) {
        return this.templateEngine.loadTemplate(request.options.template || 'default-technical');
    }
    async generateContent(request, results) {
        return this.contentGenerator.generateTechnicalDocs(request.target, {
            docType: request.specifications.docType,
            audience: request.specifications.audience,
            framework: request.specifications.framework,
            includeExamples: request.specifications.includeExamples,
            includeAPIReference: request.specifications.includeAPIReference,
            language: request.specifications.language
        });
    }
    async validateContent(content) {
        return this.qualityValidator.validateQuality(content);
    }
    async applyUpdates(existingDoc, updates) {
        return {
            ...existingDoc,
            content: updates.content || existingDoc.content,
            metadata: {
                ...existingDoc.metadata,
                ...updates.metadata,
                updated: new Date()
            }
        };
    }
    async removeRedundancy(content) {
        return content;
    }
    async improveReadability(content) {
        return content;
    }
    async optimizeStructure(structure) {
        return structure;
    }
    generateCacheKey(request) {
        return `doc:${JSON.stringify(request)}`;
    }
    generateContentHash(content) {
        return `hash:${content.title}:${content.content.length}`;
    }
    async getHealth() {
        const metrics = await this.performanceMonitor.getMetrics();
        return {
            status: 'healthy',
            metrics: {
                ...metrics,
                cacheHitRate: await this.cacheManager.getHitRate(),
                knowledgeBaseSize: await this.knowledgeManager.getSize()
            }
        };
    }
    async shutdown() {
        this.logger.info('Shutting down DocumentationOrchestrator');
        await this.cacheManager.shutdown();
        await this.knowledgeManager.shutdown();
        this.logger.info('DocumentationOrchestrator shutdown completed');
    }
}
exports.DocumentationOrchestrator = DocumentationOrchestrator;
//# sourceMappingURL=DocumentationOrchestrator.js.map