import { DesignPattern, ValidationResult, Location } from '../types/index.js';
export interface PatternLibrary {
    getPattern(name: string): Promise<DesignPattern | null>;
    searchPatterns(query: string): Promise<DesignPattern[]>;
    addPattern(pattern: DesignPattern): Promise<void>;
    listPatterns(): Promise<DesignPattern[]>;
}
export interface Context7Client {
    getPatternDocumentation(patternName: string): Promise<any>;
    getFrameworkPatterns(framework: string): Promise<DesignPattern[]>;
    getBestPractices(domain: string): Promise<any>;
}
export interface SemanticMatcher {
    matchPattern(code: string, pattern: DesignPattern): Promise<number>;
    findPatternOpportunities(code: string): Promise<PatternOpportunity[]>;
    validatePatternFit(code: string, pattern: DesignPattern): Promise<ValidationResult>;
}
export interface PatternOptions {
    targetLanguage?: string;
    framework?: string;
    preserveExisting?: boolean;
    generateComments?: boolean;
    includeTests?: boolean;
}
export interface CodeTarget {
    uri: string;
    range: Location['range'];
    symbolName?: string;
    symbolType?: 'class' | 'function' | 'module';
}
export interface PatternResult {
    success: boolean;
    generatedCode: string;
    appliedPattern: DesignPattern;
    changes: any[];
    rollbackId?: string;
    recommendations?: string[];
}
export interface PatternOpportunity {
    pattern: DesignPattern;
    location: Location;
    confidence: number;
    description: string;
    benefits: string[];
    effort: 'low' | 'medium' | 'high';
}
export interface ExistingCode {
    uri: string;
    content: string;
    symbols: any[];
    dependencies: string[];
}
export interface RefactoringResult {
    success: boolean;
    changes: any[];
    rollbackId: string;
    appliedPattern: DesignPattern;
}
export interface PatternDefinition {
    name: string;
    description: string;
    structure: any;
    implementation: any;
    constraints: string[];
    examples: any[];
}
export interface AdaptedPattern {
    original: DesignPattern;
    adapted: DesignPattern;
    adaptations: string[];
    constraints: string[];
}
export interface SemanticValidation {
    isValid: boolean;
    semanticPreservation: number;
    issues: string[];
    recommendations: string[];
}
export interface CodeAnalysis {
    structure: any;
    patterns: DesignPattern[];
    complexity: number;
    maintainability: number;
    opportunities: PatternOpportunity[];
}
export interface PatternValidation {
    isValid: boolean;
    compliance: number;
    violations: string[];
    improvements: string[];
}
export declare class PatternApplicator {
    private patternLibrary;
    private context7Client;
    private semanticMatcher;
    constructor(patternLibrary: PatternLibrary, context7Client: Context7Client, semanticMatcher: SemanticMatcher);
    applyDesignPattern(pattern: DesignPattern, target: CodeTarget, options?: PatternOptions): Promise<PatternResult>;
    detectPatternOpportunities(code: CodeAnalysis): Promise<PatternOpportunity[]>;
    refactorToPattern(existing: ExistingCode, pattern: DesignPattern): Promise<RefactoringResult>;
    validatePatternImplementation(code: string, pattern: DesignPattern): Promise<PatternValidation>;
    private validatePatternApplicability;
    private loadEnhancedPattern;
    private analyzeTargetCode;
    private buildContextFromTarget;
    private adaptPatternToContext;
    private generatePatternImplementation;
    private applyImplementation;
    private extractBenefits;
    private estimateEffort;
    private calculateImpactScore;
    private analyzeExistingCode;
    private checkPatternCompatibility;
    private planPatternRefactoring;
    private executePatternRefactoring;
    private validateRefactoredCode;
    private checkStructuralCompliance;
    private checkSemanticCompliance;
    private generateImprovementSuggestions;
    private checkConstraint;
    loadPatternFromContext7(patternName: string): Promise<PatternDefinition | null>;
    ensurePatternSemantics(implementation: string, pattern: DesignPattern): Promise<SemanticValidation>;
    getAvailablePatterns(): Promise<DesignPattern[]>;
    searchPatterns(query: string): Promise<DesignPattern[]>;
}
//# sourceMappingURL=PatternApplicator.d.ts.map