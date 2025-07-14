import { DocumentationRequest, DocumentationResult, DocumentationContent, DocumentationUpdate, UpdateResult, ValidationResult, LocalizationContext, LocalizationResult, IndexingResult, DocsServerConfig } from '../types/index.js';
export declare class DocumentationOrchestrator {
    private templateEngine;
    private contentGenerator;
    private localizationManager;
    private qualityValidator;
    private knowledgeManager;
    private logger;
    private performanceMonitor;
    private cacheManager;
    private config;
    constructor(config: DocsServerConfig);
    generateDocumentation(request: DocumentationRequest): Promise<DocumentationResult>;
    updateDocumentation(documentId: string, updates: DocumentationUpdate): Promise<UpdateResult>;
    validateDocumentation(content: DocumentationContent): Promise<ValidationResult>;
    localizeDocumentation(content: DocumentationContent, context: LocalizationContext): Promise<LocalizationResult>;
    indexDocumentation(content: DocumentationContent): Promise<IndexingResult>;
    private buildGenerationPlan;
    private orchestrateGeneration;
    private validateQuality;
    private optimizeContent;
    private analyzeTarget;
    private loadTemplate;
    private generateContent;
    private validateContent;
    private applyUpdates;
    private removeRedundancy;
    private improveReadability;
    private optimizeStructure;
    private generateCacheKey;
    private generateContentHash;
    getHealth(): Promise<{
        status: string;
        metrics: any;
    }>;
    shutdown(): Promise<void>;
}
interface DocumentationUpdate {
    content?: string;
    metadata?: Partial<any>;
    structure?: any;
}
interface UpdateResult {
    success: boolean;
    documentId: string;
    updatedAt: Date;
    qualityScore: number;
    processingTime: number;
}
export {};
//# sourceMappingURL=DocumentationOrchestrator.d.ts.map