import { DocsServerConfig } from '../types/index.js';
export declare class Context7Client {
    private logger;
    private config;
    private isEnabled;
    constructor(config: DocsServerConfig);
    getDocumentationPatterns(framework?: string): Promise<any[]>;
    getAPIDocumentationPatterns(apiType: string): Promise<any[]>;
    getLocalizationPatterns(language: string): Promise<any[]>;
    getQualityStandards(docType: string): Promise<any>;
    validateWithContext7(content: string, type: string): Promise<any>;
    isIntegrationEnabled(): boolean;
    getHealth(): Promise<{
        status: string;
        lastCheck: Date;
    }>;
}
//# sourceMappingURL=Context7Client.d.ts.map