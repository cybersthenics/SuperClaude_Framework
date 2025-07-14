import { DocsServerConfig, DocumentationTarget } from '../types/index.js';
export declare class IntelligenceClient {
    private logger;
    private config;
    private isEnabled;
    constructor(config: DocsServerConfig);
    analyzeTarget(target: DocumentationTarget): Promise<any>;
    analyzeAPI(apiPath: string): Promise<any>;
    analyzeCodeStructure(codePath: string): Promise<any>;
    extractSemanticInformation(content: string): Promise<any>;
    generateCodeExamples(context: any): Promise<any[]>;
    private getMockAnalysis;
    private getMockAPIAnalysis;
    private getMockCodeStructure;
    private getMockSemanticInfo;
    private getMockCodeExamples;
    private calculateMockComplexity;
    private getMockDirectories;
    private getMockFiles;
    private getMockModules;
    private getMockClasses;
    private getMockFunctions;
    private getMockInterfaces;
    private getMockDependencies;
    private getMockFrameworks;
    private getMockLanguages;
    private getMockAPIEndpoints;
    private getMockComponents;
    private getDetectedFramework;
    private getMockFeatures;
    private getMockRecommendations;
    private detectLanguage;
    isIntegrationEnabled(): boolean;
    getHealth(): Promise<{
        status: string;
        lastCheck: Date;
    }>;
}
//# sourceMappingURL=IntelligenceClient.d.ts.map