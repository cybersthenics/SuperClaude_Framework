import { SymbolReference, Location, ValidationResult } from '../types/index.js';
export interface IntelligenceServerResponse {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        processingTime: number;
        confidence: number;
        source: string;
    };
}
export interface SymbolInfo {
    symbol: SymbolReference;
    references: Location[];
    definition: Location;
    type: string;
    scope: string;
    documentation?: string;
}
export interface SemanticAnalysis {
    symbols: SymbolReference[];
    dependencies: {
        [key: string]: string[];
    };
    types: {
        [key: string]: any;
    };
    issues: {
        type: 'error' | 'warning' | 'info';
        message: string;
        location: Location;
    }[];
}
export interface TypeInference {
    inferredType: string;
    confidence: number;
    alternatives: string[];
    reasoning: string;
}
export interface CodeContext {
    uri: string;
    range: Location['range'];
    surroundingCode: string;
    imports: string[];
    exports: string[];
    localVariables: string[];
    parentScope: string;
}
export declare class IntelligenceClient {
    private serverUrl;
    private timeout;
    private retryCount;
    constructor(serverUrl?: string, timeout?: number);
    getSymbolInfo(uri: string, position: {
        line: number;
        character: number;
    }): Promise<SymbolReference | null>;
    findAllReferences(uri: string, position: {
        line: number;
        character: number;
    }): Promise<Location[]>;
    getInterfaceMembers(symbol: SymbolReference): Promise<any>;
    validateSymbolName(name: string, kind: string, scope: any): Promise<ValidationResult>;
    analyzeCode(uri: string, content?: string): Promise<SemanticAnalysis>;
    inferType(expression: string, context: CodeContext): Promise<TypeInference>;
    validateSemantics(uri: string, content: string): Promise<ValidationResult>;
    getDefinition(uri: string, position: {
        line: number;
        character: number;
    }): Promise<Location | null>;
    getHover(uri: string, position: {
        line: number;
        character: number;
    }): Promise<string | null>;
    getCompletions(uri: string, position: {
        line: number;
        character: number;
    }): Promise<any[]>;
    getSignatureHelp(uri: string, position: {
        line: number;
        character: number;
    }): Promise<any | null>;
    getDiagnostics(uri: string): Promise<any[]>;
    private makeRequest;
    private parseSymbolReference;
    private delay;
    isHealthy(): Promise<boolean>;
    getServerInfo(): Promise<any>;
    setServerUrl(url: string): void;
    setTimeout(timeout: number): void;
    setRetryCount(count: number): void;
    clearCache(): Promise<void>;
    getCacheStats(): Promise<any>;
}
//# sourceMappingURL=IntelligenceClient.d.ts.map