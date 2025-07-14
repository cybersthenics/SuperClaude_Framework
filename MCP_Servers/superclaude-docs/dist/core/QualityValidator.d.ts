import { DocumentationContent, ValidationResult, DocsServerConfig } from '../types/index.js';
export declare class QualityValidator {
    private logger;
    private performanceMonitor;
    private config;
    constructor(config: DocsServerConfig);
    validateQuality(content: DocumentationContent): Promise<ValidationResult>;
    validateAPIDocumentation(content: any): Promise<ValidationResult>;
}
//# sourceMappingURL=QualityValidator.d.ts.map