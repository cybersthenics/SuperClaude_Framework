import { SymbolReference, RenameOptions, RenameResult, ExtractionOptions, ExtractionResult, InlineOptions, InlineResult, MoveOptions, MoveResult, SignatureOptions, SignatureResult, Signature, CodeSelection, Location, SemanticModification, ValidationResult, DependencyUpdate } from '../types/index.js';
export interface IntelligenceClient {
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
}
export interface TypeChecker {
    validateType(symbol: SymbolReference, newType: any): Promise<ValidationResult>;
    inferType(code: string, context: any): Promise<any>;
}
export interface ImportManager {
    addImport(uri: string, module: string, symbols: string[]): Promise<void>;
    removeImport(uri: string, module: string, symbols: string[]): Promise<void>;
    organizeImports(uri: string): Promise<void>;
}
export interface DependencyTracker {
    trackDependencies(symbol: SymbolReference): Promise<SymbolReference[]>;
    updateDependencies(modification: SemanticModification): Promise<DependencyUpdate[]>;
}
export interface RefactoringEngine {
    startRefactoringTransaction(scope: any): Promise<any>;
    addRefactoringOperation(transaction: any, operation: any): Promise<void>;
    executeRefactoring(transaction: any): Promise<any>;
}
export declare class SymbolEditor {
    private intelligenceClient;
    private typeChecker;
    private importManager;
    private dependencyTracker;
    private refactoringEngine;
    constructor(intelligenceClient: IntelligenceClient, typeChecker: TypeChecker, importManager: ImportManager, dependencyTracker: DependencyTracker, refactoringEngine: RefactoringEngine);
    renameSymbol(symbol: SymbolReference, newName: string, options?: RenameOptions): Promise<RenameResult>;
    extractMethod(selection: CodeSelection, methodName: string, options?: ExtractionOptions): Promise<ExtractionResult>;
    extractFunction(selection: CodeSelection, functionName: string, options?: ExtractionOptions): Promise<ExtractionResult>;
    inlineVariable(symbol: SymbolReference, options?: InlineOptions): Promise<InlineResult>;
    inlineMethod(symbol: SymbolReference, options?: InlineOptions): Promise<InlineResult>;
    moveSymbol(symbol: SymbolReference, targetLocation: Location, options?: MoveOptions): Promise<MoveResult>;
    changeSignature(symbol: SymbolReference, newSignature: Signature, options?: SignatureOptions): Promise<SignatureResult>;
    private validateNewName;
    private analyzeRenameImpact;
    private detectRenameConflicts;
    private updateExportReferences;
    private analyzeSelectedCode;
    private analyzeVariables;
    private inferMethodSignature;
    private validateExtraction;
    private generateMethodCode;
    private generateMethodCall;
    private findMethodInsertionPoint;
    private getVariableValue;
    private getVariableDeclaration;
    private getMethodBody;
    private generateInlinedMethodCode;
    private getMethodCallText;
    private getMethodDeclaration;
    private validateTargetLocation;
    private analyzeImportImplications;
    private getSymbolDeclaration;
    private validateSignature;
    private getCurrentSignatureText;
    private generateSignatureText;
    private updateCallSiteForSignature;
    private getCallSiteText;
}
//# sourceMappingURL=SymbolEditor.d.ts.map