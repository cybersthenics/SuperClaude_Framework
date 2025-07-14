import { DesignPattern, ValidationResult } from '../types/index.js';
export interface MagicClient {
    generateComponent(specs: MagicComponentSpecs): Promise<MagicComponentResult>;
    getDesignSystem(framework: string): Promise<DesignSystemInfo>;
    validateDesign(component: string, constraints: any): Promise<ValidationResult>;
    optimizeComponent(component: string, target: string): Promise<string>;
}
export interface MagicComponentSpecs {
    framework: string;
    name: string;
    requirements: any;
    includeAccessibility: boolean;
    designSystem?: string;
    theme?: string;
}
export interface MagicComponentResult {
    success: boolean;
    component: string;
    styles: string;
    tests?: string;
    documentation?: string;
    accessibility: {
        score: number;
        issues: string[];
        recommendations: string[];
    };
    performance: {
        score: number;
        metrics: any;
        optimizations: string[];
    };
}
export interface DesignSystemInfo {
    name: string;
    version: string;
    tokens: {
        [key: string]: any;
    };
    components: string[];
    patterns: string[];
    guidelines: string[];
}
export declare class MagicIntegration implements MagicClient {
    private serverUrl;
    private timeout;
    private apiKey?;
    constructor(serverUrl?: string, apiKey?: string);
    generateComponent(specs: MagicComponentSpecs): Promise<MagicComponentResult>;
    getDesignSystem(framework: string): Promise<DesignSystemInfo>;
    validateDesign(component: string, constraints: any): Promise<ValidationResult>;
    optimizeComponent(component: string, target: string): Promise<string>;
    private makeRequest;
}
export interface Context7Client {
    getPatternDocumentation(patternName: string): Promise<PatternDocumentation>;
    getFrameworkPatterns(framework: string): Promise<DesignPattern[]>;
    getBestPractices(domain: string): Promise<BestPractices>;
    searchPatterns(query: string): Promise<PatternSearchResult[]>;
    getLibraryDocumentation(libraryName: string): Promise<LibraryDocumentation>;
}
export interface PatternDocumentation {
    name: string;
    description: string;
    category: string;
    intent: string;
    structure: any;
    participants: string[];
    collaborations: string[];
    consequences: string[];
    implementation: {
        code: string;
        language: string;
        framework?: string;
    }[];
    examples: {
        title: string;
        code: string;
        explanation: string;
    }[];
    relatedPatterns: string[];
    benefits: string[];
    drawbacks: string[];
    whenToUse: string[];
    whenNotToUse: string[];
}
export interface BestPractices {
    domain: string;
    practices: {
        title: string;
        description: string;
        category: string;
        importance: 'high' | 'medium' | 'low';
        examples: string[];
        antiPatterns: string[];
    }[];
    guidelines: string[];
    resources: string[];
}
export interface PatternSearchResult {
    name: string;
    description: string;
    category: string;
    relevance: number;
    framework?: string;
    language?: string;
}
export interface LibraryDocumentation {
    name: string;
    version: string;
    description: string;
    installation: string;
    usage: {
        quickStart: string;
        examples: {
            title: string;
            code: string;
            description: string;
        }[];
    };
    api: {
        functions: any[];
        classes: any[];
        interfaces: any[];
        types: any[];
    };
    patterns: DesignPattern[];
    bestPractices: string[];
}
export declare class Context7Integration implements Context7Client {
    private serverUrl;
    private timeout;
    private apiKey?;
    constructor(serverUrl?: string, apiKey?: string);
    getPatternDocumentation(patternName: string): Promise<PatternDocumentation>;
    getFrameworkPatterns(framework: string): Promise<DesignPattern[]>;
    getBestPractices(domain: string): Promise<BestPractices>;
    searchPatterns(query: string): Promise<PatternSearchResult[]>;
    getLibraryDocumentation(libraryName: string): Promise<LibraryDocumentation>;
    private makeRequest;
}
export declare class ExternalIntegrations {
    private magicClient;
    private context7Client;
    constructor(config?: {
        magic?: {
            url?: string;
            apiKey?: string;
        };
        context7?: {
            url?: string;
            apiKey?: string;
        };
    });
    getMagicClient(): MagicClient;
    getContext7Client(): Context7Client;
    healthCheck(): Promise<{
        magic: boolean;
        context7: boolean;
    }>;
    private checkMagicHealth;
    private checkContext7Health;
}
//# sourceMappingURL=ExternalIntegrations.d.ts.map