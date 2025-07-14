export interface Position {
    line: number;
    character: number;
}
export interface Range {
    start: Position;
    end: Position;
}
export interface Location {
    uri: string;
    range: Range;
}
export interface DocumentSymbol {
    name: string;
    kind: number;
    range: Range;
    selectionRange: Range;
    detail?: string;
    children?: DocumentSymbol[];
}
export interface CompletionItem {
    label: string;
    kind: number;
    detail?: string;
    documentation?: string;
    insertText?: string;
}
export interface Diagnostic {
    range: Range;
    severity: number;
    code?: string | number;
    message: string;
    source?: string;
}
export declare class LSPManagerStub {
    private openDocuments;
    private diagnosticsCache;
    constructor();
    openDocument(uri: string, content: string, languageId: string): Promise<void>;
    closeDocument(uri: string): Promise<void>;
    getDocumentSymbols(uri: string): Promise<DocumentSymbol[]>;
    findDefinition(uri: string, position: Position): Promise<Location[]>;
    findReferences(uri: string, position: Position, includeDeclaration?: boolean): Promise<Location[]>;
    getCompletions(uri: string, position: Position): Promise<CompletionItem[]>;
    getHoverInfo(uri: string, position: Position): Promise<{
        contents: string;
    } | null>;
    getDiagnostics(uri: string): Promise<Diagnostic[]>;
    private getLanguageFromUri;
    private getWordAtPosition;
    private parsePythonSymbols;
    private parseJavaScriptSymbols;
    private parseGenericSymbols;
    private findClassMethods;
    private findWordDefinitions;
    private findWordReferences;
    private getPythonCompletions;
    private getJavaScriptCompletions;
    private getGenericCompletions;
    private extractSymbolNames;
    private generateHoverInfo;
    private generateDiagnostics;
}
//# sourceMappingURL=LSPManagerStub.d.ts.map