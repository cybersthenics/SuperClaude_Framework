import { DocumentTemplate, RenderContext, RenderedContent, TemplateCustomization, CustomizedTemplate, TemplateValidation, TemplateUsage, OptimizedTemplate, GeneratedSection, DocsServerConfig } from '../types/index.js';
export declare class TemplateEngine {
    private templateRegistry;
    private variableResolver;
    private sectionGenerator;
    private styleApplicator;
    private logger;
    private performanceMonitor;
    private cacheManager;
    private config;
    private handlebars;
    constructor(config: DocsServerConfig);
    loadTemplate(templateId: string): Promise<DocumentTemplate>;
    renderTemplate(template: DocumentTemplate, context: RenderContext): Promise<RenderedContent>;
    customizeTemplate(template: DocumentTemplate, customization: TemplateCustomization): Promise<CustomizedTemplate>;
    validateTemplate(template: DocumentTemplate): Promise<TemplateValidation>;
    optimizeTemplate(template: DocumentTemplate, usage: TemplateUsage): Promise<OptimizedTemplate>;
    private resolveVariables;
    private generateSections;
    private applyStyles;
    private validateRenderedContent;
    private loadTemplateFromFile;
    private initializeTemplateEngine;
    private loadDefaultTemplates;
    private createDefaultTemplate;
    getRegisteredTemplates(): Promise<string[]>;
    getTemplateUsage(templateId: string): Promise<TemplateUsage | null>;
    shutdown(): Promise<void>;
}
interface RenderContext {
    variables?: Record<string, any>;
    target?: any;
    specifications?: any;
    language?: string;
    audience?: string;
}
interface RenderedContent {
    content: string;
    metadata: {
        templateId: string;
        rendered: Date;
        variables: Record<string, any>;
        sections: number;
        processingTime?: number;
        validation?: boolean;
    };
    sections: GeneratedSection[];
    assets: any[];
}
interface GeneratedSection {
    id: string;
    title: string;
    content: string;
    order: number;
    metadata: {
        generated: Date;
        variables: string[];
        contentLength: number;
    };
}
interface TemplateValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validatedAt: Date;
    templateId: string;
}
interface OptimizedTemplate extends DocumentTemplate {
    optimization: {
        appliedAt: Date;
        originalTemplateId: string;
        usageMetrics: TemplateUsage;
        optimizations: string[];
        compiledSections?: Record<string, any>;
    };
}
interface TemplateUsage {
    templateId: string;
    usageCount: number;
    lastUsed: Date;
    averageRenderTime: number;
    sectionUsage: Record<string, {
        usage: number;
        lastUsed: Date;
    }>;
    variableUsage: Record<string, {
        usage: number;
        lastUsed: Date;
    }>;
    styleUsage: Record<string, {
        usage: number;
        lastUsed: Date;
    }>;
}
interface CustomizedTemplate extends DocumentTemplate {
    customization: TemplateCustomization;
    metadata: any;
}
export {};
//# sourceMappingURL=TemplateEngine.d.ts.map