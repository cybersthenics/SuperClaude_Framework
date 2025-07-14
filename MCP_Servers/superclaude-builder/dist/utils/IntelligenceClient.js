export class IntelligenceClient {
    serverUrl;
    timeout;
    retryCount;
    constructor(serverUrl = 'http://localhost:8001', timeout = 5000) {
        this.serverUrl = serverUrl;
        this.timeout = timeout;
        this.retryCount = 3;
    }
    async getSymbolInfo(uri, position) {
        try {
            const response = await this.makeRequest('/symbol/info', {
                uri,
                position
            });
            if (!response.success || !response.data) {
                return null;
            }
            return this.parseSymbolReference(response.data);
        }
        catch (error) {
            console.error('Failed to get symbol info:', error);
            return null;
        }
    }
    async findAllReferences(uri, position) {
        try {
            const response = await this.makeRequest('/symbol/references', {
                uri,
                position
            });
            if (!response.success || !response.data) {
                return [];
            }
            return response.data.references || [];
        }
        catch (error) {
            console.error('Failed to find references:', error);
            return [];
        }
    }
    async getInterfaceMembers(symbol) {
        try {
            const response = await this.makeRequest('/interface/members', {
                symbolId: symbol.symbolId,
                location: symbol.location
            });
            if (!response.success || !response.data) {
                return { methods: [], properties: [] };
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to get interface members:', error);
            return { methods: [], properties: [] };
        }
    }
    async validateSymbolName(name, kind, scope) {
        try {
            const response = await this.makeRequest('/symbol/validate-name', {
                name,
                kind,
                scope
            });
            if (!response.success) {
                return {
                    isValid: false,
                    errors: [response.error || 'Validation failed'],
                    warnings: [],
                    suggestions: []
                };
            }
            return response.data || {
                isValid: true,
                errors: [],
                warnings: [],
                suggestions: []
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
                suggestions: []
            };
        }
    }
    async analyzeCode(uri, content) {
        try {
            const response = await this.makeRequest('/code/analyze', {
                uri,
                content
            });
            if (!response.success || !response.data) {
                return {
                    symbols: [],
                    dependencies: {},
                    types: {},
                    issues: []
                };
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to analyze code:', error);
            return {
                symbols: [],
                dependencies: {},
                types: {},
                issues: []
            };
        }
    }
    async inferType(expression, context) {
        try {
            const response = await this.makeRequest('/type/infer', {
                expression,
                context
            });
            if (!response.success || !response.data) {
                return {
                    inferredType: 'unknown',
                    confidence: 0,
                    alternatives: [],
                    reasoning: 'Type inference failed'
                };
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to infer type:', error);
            return {
                inferredType: 'unknown',
                confidence: 0,
                alternatives: [],
                reasoning: `Type inference error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async validateSemantics(uri, content) {
        try {
            const response = await this.makeRequest('/code/validate-semantics', {
                uri,
                content
            });
            if (!response.success) {
                return {
                    isValid: false,
                    errors: [response.error || 'Semantic validation failed'],
                    warnings: [],
                    suggestions: []
                };
            }
            return response.data || {
                isValid: true,
                errors: [],
                warnings: [],
                suggestions: []
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [`Semantic validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
                suggestions: []
            };
        }
    }
    async getDefinition(uri, position) {
        try {
            const response = await this.makeRequest('/symbol/definition', {
                uri,
                position
            });
            if (!response.success || !response.data) {
                return null;
            }
            return response.data.definition;
        }
        catch (error) {
            console.error('Failed to get definition:', error);
            return null;
        }
    }
    async getHover(uri, position) {
        try {
            const response = await this.makeRequest('/symbol/hover', {
                uri,
                position
            });
            if (!response.success || !response.data) {
                return null;
            }
            return response.data.hover;
        }
        catch (error) {
            console.error('Failed to get hover info:', error);
            return null;
        }
    }
    async getCompletions(uri, position) {
        try {
            const response = await this.makeRequest('/symbol/completions', {
                uri,
                position
            });
            if (!response.success || !response.data) {
                return [];
            }
            return response.data.completions || [];
        }
        catch (error) {
            console.error('Failed to get completions:', error);
            return [];
        }
    }
    async getSignatureHelp(uri, position) {
        try {
            const response = await this.makeRequest('/symbol/signature-help', {
                uri,
                position
            });
            if (!response.success || !response.data) {
                return null;
            }
            return response.data.signatureHelp;
        }
        catch (error) {
            console.error('Failed to get signature help:', error);
            return null;
        }
    }
    async getDiagnostics(uri) {
        try {
            const response = await this.makeRequest('/code/diagnostics', {
                uri
            });
            if (!response.success || !response.data) {
                return [];
            }
            return response.data.diagnostics || [];
        }
        catch (error) {
            console.error('Failed to get diagnostics:', error);
            return [];
        }
    }
    async makeRequest(endpoint, payload, retries = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(`${this.serverUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SuperClaude-Builder/1.0.0'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (retries < this.retryCount) {
                console.warn(`Request failed, retrying (${retries + 1}/${this.retryCount}):`, error);
                await this.delay(1000 * Math.pow(2, retries));
                return this.makeRequest(endpoint, payload, retries + 1);
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    parseSymbolReference(data) {
        return {
            symbolId: data.symbolId || 'unknown',
            location: data.location || { uri: '', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
            type: data.type || { name: 'unknown', kind: 'primitive' },
            scope: data.scope || { kind: 'module', name: 'unknown', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
            dependencies: data.dependencies || [],
            usages: data.usages || [],
            name: data.name || 'unknown',
            kind: data.kind || 'unknown',
            isExported: data.isExported || false
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async isHealthy() {
        try {
            const response = await this.makeRequest('/health', {});
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
    async getServerInfo() {
        try {
            const response = await this.makeRequest('/info', {});
            return response.data;
        }
        catch (error) {
            return null;
        }
    }
    setServerUrl(url) {
        this.serverUrl = url;
    }
    setTimeout(timeout) {
        this.timeout = timeout;
    }
    setRetryCount(count) {
        this.retryCount = count;
    }
    async clearCache() {
        try {
            await this.makeRequest('/cache/clear', {});
        }
        catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
    async getCacheStats() {
        try {
            const response = await this.makeRequest('/cache/stats', {});
            return response.data;
        }
        catch (error) {
            return null;
        }
    }
}
//# sourceMappingURL=IntelligenceClient.js.map