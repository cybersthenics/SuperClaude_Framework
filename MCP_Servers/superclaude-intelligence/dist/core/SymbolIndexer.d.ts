import { SymbolKind } from 'vscode-languageserver-protocol';
import { SymbolInformation, SymbolIndex, SymbolQuery, SymbolMatch, IndexResult, UpdateResult, FileChange, IntelligenceServerConfig } from '../types/index.js';
import { LSPManager } from './LSPManager.js';
export interface SymbolQuery {
    name?: string;
    kind?: SymbolKind;
    fileUri?: string;
    fuzzy?: boolean;
    maxResults?: number;
    includeReferences?: boolean;
}
export interface SymbolMatch {
    symbol: SymbolInformation;
    score: number;
    matchType: 'exact' | 'prefix' | 'fuzzy';
}
export interface IndexResult {
    symbolCount: number;
    fileCount: number;
    duration: number;
    errors: string[];
}
export interface UpdateResult {
    updatedSymbols: number;
    removedSymbols: number;
    addedSymbols: number;
    duration: number;
}
export interface FileChange {
    uri: string;
    type: 'created' | 'modified' | 'deleted';
    content?: string;
}
export declare class SymbolIndexer {
    private lspManager;
    private config;
    private symbolIndex;
    private bloomFilter;
    private cacheManager;
    private isIndexing;
    private indexQueue;
    constructor(lspManager: LSPManager, config: IntelligenceServerConfig['semantic']);
    indexProject(projectRoot: string): Promise<IndexResult>;
    updateIndex(changes: FileChange[]): Promise<UpdateResult>;
    findSymbols(query: SymbolQuery): Promise<SymbolMatch[]>;
    getSymbolInfo(symbolId: string): Promise<SymbolInformation | null>;
    invalidateIndex(uri: string): Promise<void>;
    rebuildIndex(uri: string): Promise<void>;
    getFullIndex(): SymbolIndex;
    restoreIndex(index: SymbolIndex): Promise<void>;
    private findSourceFiles;
    private indexFile;
    private convertDocumentSymbols;
    private addSymbolToIndex;
    private removeSymbolFromIndex;
    private generateSymbolId;
    private matchSymbol;
    private fuzzyMatch;
    private getLanguageForUri;
    private clearIndex;
    private optimizeIndex;
    private getQueryCacheKey;
}
//# sourceMappingURL=SymbolIndexer.d.ts.map