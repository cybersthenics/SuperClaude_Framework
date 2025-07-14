/**
 * LSP Manager Stub Implementation
 * Provides LSP-like functionality without external language server dependencies
 * Perfect for demonstration and progressive enhancement
 */
import * as path from 'path';
import { logger } from '../services/Logger.js';
export class LSPManagerStub {
    openDocuments = new Map();
    diagnosticsCache = new Map();
    constructor() {
        logger.info('LSPManagerStub initialized - providing stub LSP functionality');
    }
    // Document Management
    async openDocument(uri, content, languageId) {
        this.openDocuments.set(uri, content);
        // Generate diagnostics for the document
        await this.generateDiagnostics(uri, content, languageId);
        logger.debug(`Document opened: ${uri} (${languageId})`);
    }
    async closeDocument(uri) {
        this.openDocuments.delete(uri);
        this.diagnosticsCache.delete(uri);
        logger.debug(`Document closed: ${uri}`);
    }
    // Symbol Analysis
    async getDocumentSymbols(uri) {
        const content = this.openDocuments.get(uri);
        if (!content) {
            throw new Error(`Document not open: ${uri}`);
        }
        const language = this.getLanguageFromUri(uri);
        switch (language) {
            case 'python':
                return this.parsePythonSymbols(content);
            case 'typescript':
            case 'javascript':
                return this.parseJavaScriptSymbols(content);
            default:
                return this.parseGenericSymbols(content);
        }
    }
    // Definition and References
    async findDefinition(uri, position) {
        const content = this.openDocuments.get(uri);
        if (!content) {
            throw new Error(`Document not open: ${uri}`);
        }
        const lines = content.split('\n');
        const line = lines[position.line];
        if (!line) {
            return [];
        }
        // Extract word at position
        const word = this.getWordAtPosition(line, position.character);
        if (!word) {
            return [];
        }
        // Find definitions in the same file
        const definitions = this.findWordDefinitions(content, word);
        return definitions.map(def => ({
            uri,
            range: def
        }));
    }
    async findReferences(uri, position, includeDeclaration = true) {
        const content = this.openDocuments.get(uri);
        if (!content) {
            throw new Error(`Document not open: ${uri}`);
        }
        const lines = content.split('\n');
        const line = lines[position.line];
        if (!line) {
            return [];
        }
        const word = this.getWordAtPosition(line, position.character);
        if (!word) {
            return [];
        }
        const references = this.findWordReferences(content, word);
        return references.map(ref => ({
            uri,
            range: ref
        }));
    }
    // Code Completion
    async getCompletions(uri, position) {
        const content = this.openDocuments.get(uri);
        if (!content) {
            throw new Error(`Document not open: ${uri}`);
        }
        const language = this.getLanguageFromUri(uri);
        const lines = content.split('\n');
        const currentLine = lines[position.line]?.substring(0, position.character) || '';
        switch (language) {
            case 'python':
                return this.getPythonCompletions(currentLine, content);
            case 'typescript':
            case 'javascript':
                return this.getJavaScriptCompletions(currentLine, content);
            default:
                return this.getGenericCompletions(currentLine, content);
        }
    }
    // Hover Information
    async getHoverInfo(uri, position) {
        const content = this.openDocuments.get(uri);
        if (!content) {
            throw new Error(`Document not open: ${uri}`);
        }
        const lines = content.split('\n');
        const line = lines[position.line];
        if (!line) {
            return null;
        }
        const word = this.getWordAtPosition(line, position.character);
        if (!word) {
            return null;
        }
        const language = this.getLanguageFromUri(uri);
        return {
            contents: this.generateHoverInfo(word, language, content)
        };
    }
    // Diagnostics
    async getDiagnostics(uri) {
        return this.diagnosticsCache.get(uri) || [];
    }
    // Private Helper Methods
    getLanguageFromUri(uri) {
        const ext = path.extname(uri).toLowerCase();
        const languageMap = {
            '.py': 'python',
            '.ts': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.java': 'java',
            '.cpp': 'cpp',
            '.cc': 'cpp',
            '.cxx': 'cpp',
            '.c': 'c'
        };
        return languageMap[ext] || 'plaintext';
    }
    getWordAtPosition(line, character) {
        const wordPattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        let match;
        while ((match = wordPattern.exec(line)) !== null) {
            if (match.index <= character && character <= match.index + match[0].length) {
                return match[0];
            }
        }
        return null;
    }
    parsePythonSymbols(content) {
        const symbols = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Class definitions
            const classMatch = line.match(/^(\s*)class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (classMatch) {
                const range = {
                    start: { line: i, character: classMatch[1].length },
                    end: { line: i, character: line.length }
                };
                symbols.push({
                    name: classMatch[2],
                    kind: 5, // Class
                    range,
                    selectionRange: range,
                    detail: 'class',
                    children: this.findClassMethods(lines, i + 1, classMatch[1].length)
                });
            }
            // Function definitions
            const funcMatch = line.match(/^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (funcMatch) {
                const range = {
                    start: { line: i, character: funcMatch[1].length },
                    end: { line: i, character: line.length }
                };
                symbols.push({
                    name: funcMatch[2],
                    kind: 12, // Function
                    range,
                    selectionRange: range,
                    detail: 'function'
                });
            }
        }
        return symbols;
    }
    parseJavaScriptSymbols(content) {
        const symbols = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Class definitions
            const classMatch = line.match(/^(\s*)class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (classMatch) {
                const range = {
                    start: { line: i, character: classMatch[1].length },
                    end: { line: i, character: line.length }
                };
                symbols.push({
                    name: classMatch[2],
                    kind: 5, // Class
                    range,
                    selectionRange: range,
                    detail: 'class'
                });
            }
            // Function definitions
            const funcMatch = line.match(/^(\s*)(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))/);
            if (funcMatch) {
                const name = funcMatch[2] || funcMatch[3];
                const range = {
                    start: { line: i, character: funcMatch[1].length },
                    end: { line: i, character: line.length }
                };
                symbols.push({
                    name,
                    kind: 12, // Function
                    range,
                    selectionRange: range,
                    detail: 'function'
                });
            }
        }
        return symbols;
    }
    parseGenericSymbols(content) {
        const symbols = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Generic function-like patterns
            const funcMatch = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
            if (funcMatch) {
                const range = {
                    start: { line: i, character: funcMatch[1].length },
                    end: { line: i, character: line.length }
                };
                symbols.push({
                    name: funcMatch[2],
                    kind: 12, // Function
                    range,
                    selectionRange: range,
                    detail: 'function'
                });
            }
        }
        return symbols;
    }
    findClassMethods(lines, startLine, baseIndent) {
        const methods = [];
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            // Stop if we've left the class (same or less indentation)
            const indent = line.match(/^(\s*)/)?.[1].length || 0;
            if (line.trim() && indent <= baseIndent) {
                break;
            }
            // Find method definitions
            const methodMatch = line.match(/^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (methodMatch) {
                const range = {
                    start: { line: i, character: methodMatch[1].length },
                    end: { line: i, character: line.length }
                };
                methods.push({
                    name: methodMatch[2],
                    kind: 6, // Method
                    range,
                    selectionRange: range,
                    detail: 'method'
                });
            }
        }
        return methods;
    }
    findWordDefinitions(content, word) {
        const definitions = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Python: class and def definitions
            if (line.includes(`class ${word}`) || line.includes(`def ${word}`)) {
                const index = line.indexOf(word);
                if (index >= 0) {
                    definitions.push({
                        start: { line: i, character: index },
                        end: { line: i, character: index + word.length }
                    });
                }
            }
            // Variable assignments
            const assignMatch = line.match(new RegExp(`\\b${word}\\s*[=:]`));
            if (assignMatch) {
                const index = line.indexOf(word);
                if (index >= 0) {
                    definitions.push({
                        start: { line: i, character: index },
                        end: { line: i, character: index + word.length }
                    });
                }
            }
        }
        return definitions;
    }
    findWordReferences(content, word) {
        const references = [];
        const lines = content.split('\n');
        const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match;
            while ((match = wordRegex.exec(line)) !== null) {
                references.push({
                    start: { line: i, character: match.index },
                    end: { line: i, character: match.index + word.length }
                });
            }
            wordRegex.lastIndex = 0; // Reset regex
        }
        return references;
    }
    getPythonCompletions(currentLine, content) {
        const completions = [];
        // Built-in Python keywords and functions
        const pythonKeywords = [
            'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
            'import', 'from', 'as', 'return', 'yield', 'lambda', 'with', 'async', 'await'
        ];
        const pythonBuiltins = [
            'print', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple',
            'range', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed'
        ];
        // Add keywords
        pythonKeywords.forEach(keyword => {
            if (keyword.startsWith(currentLine.split(/\\s+/).pop() || '')) {
                completions.push({
                    label: keyword,
                    kind: 14, // Keyword
                    detail: 'keyword',
                    insertText: keyword
                });
            }
        });
        // Add built-in functions
        pythonBuiltins.forEach(builtin => {
            if (builtin.startsWith(currentLine.split(/\\s+/).pop() || '')) {
                completions.push({
                    label: builtin,
                    kind: 3, // Function
                    detail: 'built-in function',
                    insertText: `${builtin}($1)`,
                    documentation: `Python built-in function: ${builtin}`
                });
            }
        });
        // Extract symbols from current document
        const symbols = this.extractSymbolNames(content);
        const partial = currentLine.split(/\\s+/).pop() || '';
        symbols.forEach(symbol => {
            if (symbol.startsWith(partial) && symbol !== partial) {
                completions.push({
                    label: symbol,
                    kind: 6, // Variable/Method
                    detail: 'symbol',
                    insertText: symbol
                });
            }
        });
        return completions.slice(0, 25); // Limit results
    }
    getJavaScriptCompletions(currentLine, content) {
        const completions = [];
        const jsKeywords = [
            'function', 'class', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally',
            'const', 'let', 'var', 'return', 'async', 'await', 'import', 'export'
        ];
        const partial = currentLine.split(/\\s+/).pop() || '';
        jsKeywords.forEach(keyword => {
            if (keyword.startsWith(partial)) {
                completions.push({
                    label: keyword,
                    kind: 14, // Keyword
                    detail: 'keyword',
                    insertText: keyword
                });
            }
        });
        return completions.slice(0, 25);
    }
    getGenericCompletions(currentLine, content) {
        const symbols = this.extractSymbolNames(content);
        const partial = currentLine.split(/\\s+/).pop() || '';
        return symbols
            .filter(symbol => symbol.startsWith(partial) && symbol !== partial)
            .slice(0, 25)
            .map(symbol => ({
            label: symbol,
            kind: 1, // Text
            detail: 'symbol',
            insertText: symbol
        }));
    }
    extractSymbolNames(content) {
        const symbols = new Set();
        const symbolRegex = /[a-zA-Z_][a-zA-Z0-9_]+/g;
        let match;
        while ((match = symbolRegex.exec(content)) !== null) {
            if (match[0].length > 2) { // Ignore very short symbols
                symbols.add(match[0]);
            }
        }
        return Array.from(symbols);
    }
    generateHoverInfo(word, language, content) {
        // Generate contextual hover information
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check for function definitions
            if (line.includes(`def ${word}`) || line.includes(`function ${word}`)) {
                return `**${word}** (function)\\n\\nDefined at line ${i + 1}`;
            }
            // Check for class definitions
            if (line.includes(`class ${word}`)) {
                return `**${word}** (class)\\n\\nDefined at line ${i + 1}`;
            }
            // Check for variable assignments
            if (line.includes(`${word} =`) || line.includes(`${word}:`)) {
                return `**${word}** (variable)\\n\\nAssigned at line ${i + 1}`;
            }
        }
        return `**${word}**\\n\\nSymbol found in ${language} file`;
    }
    async generateDiagnostics(uri, content, languageId) {
        const diagnostics = [];
        const lines = content.split('\n');
        // Simple syntax checking
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (languageId === 'python') {
                // Check for missing colons in Python
                if (line.trim().match(/^(if|elif|else|for|while|def|class|try|except|finally|with)\\b.*[^:]$/)) {
                    diagnostics.push({
                        range: {
                            start: { line: i, character: 0 },
                            end: { line: i, character: line.length }
                        },
                        severity: 1, // Error
                        message: 'Missing colon at end of statement',
                        source: 'pylsp-stub'
                    });
                }
                // Check for undefined variables (simple heuristic)
                const undefinedMatch = line.match(/\\bundefined_variable\\b/);
                if (undefinedMatch) {
                    diagnostics.push({
                        range: {
                            start: { line: i, character: undefinedMatch.index || 0 },
                            end: { line: i, character: (undefinedMatch.index || 0) + undefinedMatch[0].length }
                        },
                        severity: 1, // Error
                        message: 'Undefined variable',
                        source: 'pylsp-stub'
                    });
                }
            }
            // Generic warnings for TODO comments
            if (line.includes('TODO') || line.includes('FIXME')) {
                const index = line.indexOf('TODO') >= 0 ? line.indexOf('TODO') : line.indexOf('FIXME');
                diagnostics.push({
                    range: {
                        start: { line: i, character: index },
                        end: { line: i, character: line.length }
                    },
                    severity: 3, // Information
                    message: 'TODO comment found',
                    source: 'lsp-stub'
                });
            }
        }
        this.diagnosticsCache.set(uri, diagnostics);
    }
}
