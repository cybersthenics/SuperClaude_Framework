import { LocalizationContext, LocalizationResult, DocumentationContent, DocsServerConfig } from '../types/index.js';
export declare class LocalizationManager {
    private logger;
    private performanceMonitor;
    private config;
    constructor(config: DocsServerConfig);
    localizeContent(content: DocumentationContent, context: LocalizationContext): Promise<LocalizationResult>;
    private mockTranslateContent;
}
//# sourceMappingURL=LocalizationManager.d.ts.map