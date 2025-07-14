/**
 * SymbolIndexer - Maintain project-wide symbol database with incremental updates
 * Provides fast symbol lookup and cross-file analysis capabilities
 */

import { BloomFilter } from 'bloom-filters';
import { SymbolKind, Location, DocumentSymbol } from 'vscode-languageserver-protocol';
import { 
  SymbolInformation, 
  SymbolIndex, 
  SymbolQuery, 
  SymbolMatch, 
  IndexResult, 
  UpdateResult, 
  FileChange,
  IntelligenceServerConfig
} from '../types/index.js';
import { LSPManager } from './LSPManager.js';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';
import * as fs from 'fs/promises';
import * as path from 'path';

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

export class SymbolIndexer {
  private symbolIndex: SymbolIndex;
  private bloomFilter: BloomFilter;
  private cacheManager: CacheManager;
  private isIndexing = false;
  private indexQueue: Set<string> = new Set();

  constructor(
    private lspManager: LSPManager,
    private config: IntelligenceServerConfig['semantic']
  ) {
    this.symbolIndex = {
      symbols: new Map(),
      byType: new Map(),
      byFile: new Map(),
      bloomFilter: null,
      lastUpdate: new Date(),
      size: 0
    };

    this.bloomFilter = new BloomFilter(this.config.symbolCacheSize, 4);
    this.symbolIndex.bloomFilter = this.bloomFilter;

    this.cacheManager = new CacheManager({
      maxSize: 1000,
      ttl: 600000 // 10 minutes
    });
  }

  async indexProject(projectRoot: string): Promise<IndexResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let symbolCount = 0;
    let fileCount = 0;

    logger.info(`Starting project indexing for ${projectRoot}`);

    try {
      this.isIndexing = true;
      this.clearIndex();

      const files = await this.findSourceFiles(projectRoot);
      fileCount = files.length;

      // Process files in batches
      const batchSize = this.config.indexUpdateBatchSize;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(file => this.indexFile(file))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            symbolCount += result.value.length;
          } else {
            errors.push(`Failed to index ${batch[index]}: ${result.reason}`);
          }
        });

        // Update progress
        logger.debug(`Indexed ${i + batch.length}/${files.length} files`);
      }

      this.optimizeIndex();
      this.symbolIndex.lastUpdate = new Date();
      this.symbolIndex.size = symbolCount;

      logger.info(`Project indexing completed`, {
        symbolCount,
        fileCount,
        duration: Date.now() - startTime,
        errors: errors.length
      });

      return {
        symbolCount,
        fileCount,
        duration: Date.now() - startTime,
        errors
      };
    } catch (error) {
      logger.error(`Project indexing failed for ${projectRoot}`, error);
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  async updateIndex(changes: FileChange[]): Promise<UpdateResult> {
    const startTime = Date.now();
    let updatedSymbols = 0;
    let removedSymbols = 0;
    let addedSymbols = 0;

    logger.debug(`Updating index with ${changes.length} changes`);

    try {
      for (const change of changes) {
        switch (change.type) {
          case 'created':
          case 'modified':
            const oldSymbols = this.symbolIndex.byFile.get(change.uri) || [];
            const newSymbols = await this.indexFile(change.uri);
            
            // Remove old symbols
            oldSymbols.forEach(symbol => {
              this.removeSymbolFromIndex(symbol);
              removedSymbols++;
            });

            // Add new symbols
            newSymbols.forEach(symbol => {
              this.addSymbolToIndex(symbol);
              addedSymbols++;
            });

            updatedSymbols += newSymbols.length;
            break;

          case 'deleted':
            const symbolsToRemove = this.symbolIndex.byFile.get(change.uri) || [];
            symbolsToRemove.forEach(symbol => {
              this.removeSymbolFromIndex(symbol);
              removedSymbols++;
            });
            this.symbolIndex.byFile.delete(change.uri);
            break;
        }
      }

      this.symbolIndex.lastUpdate = new Date();
      this.symbolIndex.size = this.symbolIndex.symbols.size;

      logger.debug(`Index update completed`, {
        updatedSymbols,
        removedSymbols,
        addedSymbols,
        duration: Date.now() - startTime
      });

      return {
        updatedSymbols,
        removedSymbols,
        addedSymbols,
        duration: Date.now() - startTime
      };
    } catch (error) {
      logger.error(`Index update failed`, error);
      throw error;
    }
  }

  async findSymbols(query: SymbolQuery): Promise<SymbolMatch[]> {
    const cacheKey = this.getQueryCacheKey(query);
    const cached = this.cacheManager.get<SymbolMatch[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const matches: SymbolMatch[] = [];
    const maxResults = query.maxResults || 100;

    // Quick bloom filter check for name queries
    if (query.name && !this.bloomFilter.has(query.name)) {
      return matches;
    }

    for (const [symbolId, symbol] of this.symbolIndex.symbols) {
      const match = this.matchSymbol(symbol, query);
      if (match) {
        matches.push(match);
        if (matches.length >= maxResults) {
          break;
        }
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    // Cache the results
    this.cacheManager.set(cacheKey, matches);

    return matches;
  }

  async getSymbolInfo(symbolId: string): Promise<SymbolInformation | null> {
    return this.symbolIndex.symbols.get(symbolId) || null;
  }

  async invalidateIndex(uri: string): Promise<void> {
    const symbols = this.symbolIndex.byFile.get(uri) || [];
    symbols.forEach(symbol => this.removeSymbolFromIndex(symbol));
    this.symbolIndex.byFile.delete(uri);
    
    // Clear related caches
    this.cacheManager.clear();
    
    logger.debug(`Invalidated index for ${uri}`);
  }

  async rebuildIndex(uri: string): Promise<void> {
    await this.invalidateIndex(uri);
    await this.indexFile(uri);
    
    logger.debug(`Rebuilt index for ${uri}`);
  }

  getFullIndex(): SymbolIndex {
    return { ...this.symbolIndex };
  }

  async restoreIndex(index: SymbolIndex): Promise<void> {
    this.symbolIndex = index;
    this.bloomFilter = index.bloomFilter as BloomFilter;
    this.cacheManager.clear();
    
    logger.info(`Restored symbol index with ${index.size} symbols`);
  }

  private async findSourceFiles(rootPath: string): Promise<string[]> {
    const files: string[] = [];
    const supportedExtensions = ['.py', '.ts', '.js', '.go', '.rs', '.php', '.java', '.cpp', '.c', '.h'];

    const traverse = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip common directories to ignore
            if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
              await traverse(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (supportedExtensions.includes(ext)) {
              files.push(`file://${fullPath}`);
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to read directory ${dir}`, error);
      }
    };

    await traverse(rootPath);
    return files;
  }

  private async indexFile(uri: string): Promise<SymbolInformation[]> {
    const language = this.getLanguageForUri(uri);
    const symbols: SymbolInformation[] = [];

    try {
      // Get document symbols from LSP
      const documentSymbols = await this.lspManager.sendRequest(
        language,
        'textDocument/documentSymbol',
        {
          textDocument: { uri }
        }
      );

      if (documentSymbols) {
        const symbolInfos = this.convertDocumentSymbols(documentSymbols, uri);
        symbols.push(...symbolInfos);

        // Add to index
        symbols.forEach(symbol => this.addSymbolToIndex(symbol));
        
        // Update file mapping
        this.symbolIndex.byFile.set(uri, symbols);
      }
    } catch (error) {
      logger.warn(`Failed to index file ${uri}`, error);
    }

    return symbols;
  }

  private convertDocumentSymbols(documentSymbols: DocumentSymbol[], uri: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];

    const processSymbol = (symbol: DocumentSymbol, containerName?: string): void => {
      const symbolInfo: SymbolInformation = {
        name: symbol.name,
        kind: symbol.kind,
        location: {
          uri,
          range: symbol.range
        },
        containerName,
        typeInformation: {
          typeName: 'unknown',
          typeParameters: [],
          baseTypes: [],
          interfaces: [],
          properties: [],
          methods: [],
          isGeneric: false,
          isNullable: false
        },
        references: [],
        implementations: [],
        hierarchy: {
          children: [],
          siblings: [],
          depth: 0
        }
      };

      symbols.push(symbolInfo);

      // Process children
      if (symbol.children) {
        symbol.children.forEach(child => processSymbol(child, symbol.name));
      }
    };

    documentSymbols.forEach(symbol => processSymbol(symbol));
    return symbols;
  }

  private addSymbolToIndex(symbol: SymbolInformation): void {
    const symbolId = this.generateSymbolId(symbol);
    
    // Add to main index
    this.symbolIndex.symbols.set(symbolId, symbol);
    
    // Add to bloom filter
    this.bloomFilter.add(symbol.name);
    
    // Add to type index
    if (!this.symbolIndex.byType.has(symbol.kind)) {
      this.symbolIndex.byType.set(symbol.kind, []);
    }
    this.symbolIndex.byType.get(symbol.kind)!.push(symbol);
  }

  private removeSymbolFromIndex(symbol: SymbolInformation): void {
    const symbolId = this.generateSymbolId(symbol);
    
    // Remove from main index
    this.symbolIndex.symbols.delete(symbolId);
    
    // Remove from type index
    const typeSymbols = this.symbolIndex.byType.get(symbol.kind);
    if (typeSymbols) {
      const index = typeSymbols.findIndex(s => this.generateSymbolId(s) === symbolId);
      if (index !== -1) {
        typeSymbols.splice(index, 1);
      }
    }
  }

  private generateSymbolId(symbol: SymbolInformation): string {
    return `${symbol.location.uri}:${symbol.location.range.start.line}:${symbol.location.range.start.character}:${symbol.name}`;
  }

  private matchSymbol(symbol: SymbolInformation, query: SymbolQuery): SymbolMatch | null {
    let score = 0;
    let matchType: 'exact' | 'prefix' | 'fuzzy' = 'fuzzy';

    // Name matching
    if (query.name) {
      if (symbol.name === query.name) {
        score += 100;
        matchType = 'exact';
      } else if (symbol.name.startsWith(query.name)) {
        score += 50;
        matchType = 'prefix';
      } else if (query.fuzzy && this.fuzzyMatch(symbol.name, query.name)) {
        score += 25;
        matchType = 'fuzzy';
      } else {
        return null;
      }
    }

    // Kind matching
    if (query.kind && symbol.kind !== query.kind) {
      return null;
    }

    // File matching
    if (query.fileUri && symbol.location.uri !== query.fileUri) {
      return null;
    }

    // Boost score based on symbol importance
    if (symbol.kind === SymbolKind.Class) score += 10;
    if (symbol.kind === SymbolKind.Function) score += 5;
    if (symbol.kind === SymbolKind.Method) score += 5;

    return {
      symbol,
      score,
      matchType
    };
  }

  private fuzzyMatch(text: string, pattern: string): boolean {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    let textIndex = 0;
    let patternIndex = 0;
    
    while (textIndex < textLower.length && patternIndex < patternLower.length) {
      if (textLower[textIndex] === patternLower[patternIndex]) {
        patternIndex++;
      }
      textIndex++;
    }
    
    return patternIndex === patternLower.length;
  }

  private getLanguageForUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    const extensionMap: Record<string, string> = {
      'py': 'python',
      'ts': 'typescript',
      'js': 'javascript',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'cpp'
    };

    return extensionMap[extension || ''] || 'unknown';
  }

  private clearIndex(): void {
    this.symbolIndex.symbols.clear();
    this.symbolIndex.byType.clear();
    this.symbolIndex.byFile.clear();
    this.bloomFilter = new BloomFilter(this.config.symbolCacheSize, 4);
    this.symbolIndex.bloomFilter = this.bloomFilter;
    this.symbolIndex.size = 0;
    this.cacheManager.clear();
  }

  private optimizeIndex(): void {
    // Remove empty type entries
    for (const [kind, symbols] of this.symbolIndex.byType) {
      if (symbols.length === 0) {
        this.symbolIndex.byType.delete(kind);
      }
    }

    // Update bloom filter if needed
    if (this.symbolIndex.size > this.config.symbolCacheSize * 0.8) {
      this.bloomFilter = new BloomFilter(this.config.symbolCacheSize * 2, 4);
      for (const symbol of this.symbolIndex.symbols.values()) {
        this.bloomFilter.add(symbol.name);
      }
      this.symbolIndex.bloomFilter = this.bloomFilter;
    }
  }

  private getQueryCacheKey(query: SymbolQuery): string {
    return `query:${JSON.stringify(query)}`;
  }
}