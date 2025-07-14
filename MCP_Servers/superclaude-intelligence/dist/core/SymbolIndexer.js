import { BloomFilter } from 'bloom-filters';
import { SymbolKind } from 'vscode-languageserver-protocol';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class SymbolIndexer {
    lspManager;
    config;
    symbolIndex;
    bloomFilter;
    cacheManager;
    isIndexing = false;
    indexQueue = new Set();
    constructor(lspManager, config) {
        this.lspManager = lspManager;
        this.config = config;
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
            ttl: 600000
        });
    }
    async indexProject(projectRoot) {
        const startTime = Date.now();
        const errors = [];
        let symbolCount = 0;
        let fileCount = 0;
        logger.info(`Starting project indexing for ${projectRoot}`);
        try {
            this.isIndexing = true;
            this.clearIndex();
            const files = await this.findSourceFiles(projectRoot);
            fileCount = files.length;
            const batchSize = this.config.indexUpdateBatchSize;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const batchResults = await Promise.allSettled(batch.map(file => this.indexFile(file)));
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        symbolCount += result.value.length;
                    }
                    else {
                        errors.push(`Failed to index ${batch[index]}: ${result.reason}`);
                    }
                });
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
        }
        catch (error) {
            logger.error(`Project indexing failed for ${projectRoot}`, error);
            throw error;
        }
        finally {
            this.isIndexing = false;
        }
    }
    async updateIndex(changes) {
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
                        oldSymbols.forEach(symbol => {
                            this.removeSymbolFromIndex(symbol);
                            removedSymbols++;
                        });
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
        }
        catch (error) {
            logger.error(`Index update failed`, error);
            throw error;
        }
    }
    async findSymbols(query) {
        const cacheKey = this.getQueryCacheKey(query);
        const cached = this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const matches = [];
        const maxResults = query.maxResults || 100;
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
        matches.sort((a, b) => b.score - a.score);
        this.cacheManager.set(cacheKey, matches);
        return matches;
    }
    async getSymbolInfo(symbolId) {
        return this.symbolIndex.symbols.get(symbolId) || null;
    }
    async invalidateIndex(uri) {
        const symbols = this.symbolIndex.byFile.get(uri) || [];
        symbols.forEach(symbol => this.removeSymbolFromIndex(symbol));
        this.symbolIndex.byFile.delete(uri);
        this.cacheManager.clear();
        logger.debug(`Invalidated index for ${uri}`);
    }
    async rebuildIndex(uri) {
        await this.invalidateIndex(uri);
        await this.indexFile(uri);
        logger.debug(`Rebuilt index for ${uri}`);
    }
    getFullIndex() {
        return { ...this.symbolIndex };
    }
    async restoreIndex(index) {
        this.symbolIndex = index;
        this.bloomFilter = index.bloomFilter;
        this.cacheManager.clear();
        logger.info(`Restored symbol index with ${index.size} symbols`);
    }
    async findSourceFiles(rootPath) {
        const files = [];
        const supportedExtensions = ['.py', '.ts', '.js', '.go', '.rs', '.php', '.java', '.cpp', '.c', '.h'];
        const traverse = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
                            await traverse(fullPath);
                        }
                    }
                    else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (supportedExtensions.includes(ext)) {
                            files.push(`file://${fullPath}`);
                        }
                    }
                }
            }
            catch (error) {
                logger.warn(`Failed to read directory ${dir}`, error);
            }
        };
        await traverse(rootPath);
        return files;
    }
    async indexFile(uri) {
        const language = this.getLanguageForUri(uri);
        const symbols = [];
        try {
            const documentSymbols = await this.lspManager.sendRequest(language, 'textDocument/documentSymbol', {
                textDocument: { uri }
            });
            if (documentSymbols) {
                const symbolInfos = this.convertDocumentSymbols(documentSymbols, uri);
                symbols.push(...symbolInfos);
                symbols.forEach(symbol => this.addSymbolToIndex(symbol));
                this.symbolIndex.byFile.set(uri, symbols);
            }
        }
        catch (error) {
            logger.warn(`Failed to index file ${uri}`, error);
        }
        return symbols;
    }
    convertDocumentSymbols(documentSymbols, uri) {
        const symbols = [];
        const processSymbol = (symbol, containerName) => {
            const symbolInfo = {
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
            if (symbol.children) {
                symbol.children.forEach(child => processSymbol(child, symbol.name));
            }
        };
        documentSymbols.forEach(symbol => processSymbol(symbol));
        return symbols;
    }
    addSymbolToIndex(symbol) {
        const symbolId = this.generateSymbolId(symbol);
        this.symbolIndex.symbols.set(symbolId, symbol);
        this.bloomFilter.add(symbol.name);
        if (!this.symbolIndex.byType.has(symbol.kind)) {
            this.symbolIndex.byType.set(symbol.kind, []);
        }
        this.symbolIndex.byType.get(symbol.kind).push(symbol);
    }
    removeSymbolFromIndex(symbol) {
        const symbolId = this.generateSymbolId(symbol);
        this.symbolIndex.symbols.delete(symbolId);
        const typeSymbols = this.symbolIndex.byType.get(symbol.kind);
        if (typeSymbols) {
            const index = typeSymbols.findIndex(s => this.generateSymbolId(s) === symbolId);
            if (index !== -1) {
                typeSymbols.splice(index, 1);
            }
        }
    }
    generateSymbolId(symbol) {
        return `${symbol.location.uri}:${symbol.location.range.start.line}:${symbol.location.range.start.character}:${symbol.name}`;
    }
    matchSymbol(symbol, query) {
        let score = 0;
        let matchType = 'fuzzy';
        if (query.name) {
            if (symbol.name === query.name) {
                score += 100;
                matchType = 'exact';
            }
            else if (symbol.name.startsWith(query.name)) {
                score += 50;
                matchType = 'prefix';
            }
            else if (query.fuzzy && this.fuzzyMatch(symbol.name, query.name)) {
                score += 25;
                matchType = 'fuzzy';
            }
            else {
                return null;
            }
        }
        if (query.kind && symbol.kind !== query.kind) {
            return null;
        }
        if (query.fileUri && symbol.location.uri !== query.fileUri) {
            return null;
        }
        if (symbol.kind === SymbolKind.Class)
            score += 10;
        if (symbol.kind === SymbolKind.Function)
            score += 5;
        if (symbol.kind === SymbolKind.Method)
            score += 5;
        return {
            symbol,
            score,
            matchType
        };
    }
    fuzzyMatch(text, pattern) {
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
    getLanguageForUri(uri) {
        const extension = uri.split('.').pop()?.toLowerCase();
        const extensionMap = {
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
    clearIndex() {
        this.symbolIndex.symbols.clear();
        this.symbolIndex.byType.clear();
        this.symbolIndex.byFile.clear();
        this.bloomFilter = new BloomFilter(this.config.symbolCacheSize, 4);
        this.symbolIndex.bloomFilter = this.bloomFilter;
        this.symbolIndex.size = 0;
        this.cacheManager.clear();
    }
    optimizeIndex() {
        for (const [kind, symbols] of this.symbolIndex.byType) {
            if (symbols.length === 0) {
                this.symbolIndex.byType.delete(kind);
            }
        }
        if (this.symbolIndex.size > this.config.symbolCacheSize * 0.8) {
            this.bloomFilter = new BloomFilter(this.config.symbolCacheSize * 2, 4);
            for (const symbol of this.symbolIndex.symbols.values()) {
                this.bloomFilter.add(symbol.name);
            }
            this.symbolIndex.bloomFilter = this.bloomFilter;
        }
    }
    getQueryCacheKey(query) {
        return `query:${JSON.stringify(query)}`;
    }
}
//# sourceMappingURL=SymbolIndexer.js.map