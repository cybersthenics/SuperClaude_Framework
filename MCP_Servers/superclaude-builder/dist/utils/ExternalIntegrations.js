export class MagicIntegration {
    serverUrl;
    timeout;
    apiKey;
    constructor(serverUrl = 'http://localhost:8002', apiKey) {
        this.serverUrl = serverUrl;
        this.timeout = 10000;
        this.apiKey = apiKey;
    }
    async generateComponent(specs) {
        try {
            const response = await this.makeRequest('/component/generate', specs);
            if (!response.success) {
                throw new Error(`Magic component generation failed: ${response.error}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('Magic component generation failed:', error);
            return {
                success: false,
                component: '',
                styles: '',
                accessibility: { score: 0, issues: [], recommendations: [] },
                performance: { score: 0, metrics: {}, optimizations: [] }
            };
        }
    }
    async getDesignSystem(framework) {
        try {
            const response = await this.makeRequest('/design-system', { framework });
            if (!response.success) {
                throw new Error(`Failed to get design system: ${response.error}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to get design system:', error);
            return {
                name: 'default',
                version: '1.0.0',
                tokens: {},
                components: [],
                patterns: [],
                guidelines: []
            };
        }
    }
    async validateDesign(component, constraints) {
        try {
            const response = await this.makeRequest('/component/validate', {
                component,
                constraints
            });
            if (!response.success) {
                return {
                    isValid: false,
                    errors: [response.error || 'Design validation failed'],
                    warnings: [],
                    suggestions: []
                };
            }
            return response.data;
        }
        catch (error) {
            return {
                isValid: false,
                errors: [`Design validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
                suggestions: []
            };
        }
    }
    async optimizeComponent(component, target) {
        try {
            const response = await this.makeRequest('/component/optimize', {
                component,
                target
            });
            if (!response.success) {
                throw new Error(`Component optimization failed: ${response.error}`);
            }
            return response.data.optimizedComponent;
        }
        catch (error) {
            console.error('Component optimization failed:', error);
            return component;
        }
    }
    async makeRequest(endpoint, payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'SuperClaude-Builder/1.0.0'
            };
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            const response = await fetch(`${this.serverUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}
export class Context7Integration {
    serverUrl;
    timeout;
    apiKey;
    constructor(serverUrl = 'http://localhost:8003', apiKey) {
        this.serverUrl = serverUrl;
        this.timeout = 15000;
        this.apiKey = apiKey;
    }
    async getPatternDocumentation(patternName) {
        try {
            const response = await this.makeRequest('/pattern/documentation', {
                name: patternName
            });
            if (!response.success) {
                throw new Error(`Failed to get pattern documentation: ${response.error}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to get pattern documentation:', error);
            return {
                name: patternName,
                description: `Pattern: ${patternName}`,
                category: 'unknown',
                intent: 'Not available',
                structure: {},
                participants: [],
                collaborations: [],
                consequences: [],
                implementation: [],
                examples: [],
                relatedPatterns: [],
                benefits: [],
                drawbacks: [],
                whenToUse: [],
                whenNotToUse: []
            };
        }
    }
    async getFrameworkPatterns(framework) {
        try {
            const response = await this.makeRequest('/framework/patterns', {
                framework
            });
            if (!response.success) {
                throw new Error(`Failed to get framework patterns: ${response.error}`);
            }
            return response.data.patterns || [];
        }
        catch (error) {
            console.error('Failed to get framework patterns:', error);
            return [];
        }
    }
    async getBestPractices(domain) {
        try {
            const response = await this.makeRequest('/best-practices', {
                domain
            });
            if (!response.success) {
                throw new Error(`Failed to get best practices: ${response.error}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to get best practices:', error);
            return {
                domain,
                practices: [],
                guidelines: [],
                resources: []
            };
        }
    }
    async searchPatterns(query) {
        try {
            const response = await this.makeRequest('/pattern/search', {
                query
            });
            if (!response.success) {
                throw new Error(`Pattern search failed: ${response.error}`);
            }
            return response.data.results || [];
        }
        catch (error) {
            console.error('Pattern search failed:', error);
            return [];
        }
    }
    async getLibraryDocumentation(libraryName) {
        try {
            const response = await this.makeRequest('/library/documentation', {
                name: libraryName
            });
            if (!response.success) {
                throw new Error(`Failed to get library documentation: ${response.error}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('Failed to get library documentation:', error);
            return {
                name: libraryName,
                version: '1.0.0',
                description: 'Library documentation not available',
                installation: '',
                usage: {
                    quickStart: '',
                    examples: []
                },
                api: {
                    functions: [],
                    classes: [],
                    interfaces: [],
                    types: []
                },
                patterns: [],
                bestPractices: []
            };
        }
    }
    async makeRequest(endpoint, payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'SuperClaude-Builder/1.0.0'
            };
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            const response = await fetch(`${this.serverUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}
export class ExternalIntegrations {
    magicClient;
    context7Client;
    constructor(config = {}) {
        this.magicClient = new MagicIntegration(config.magic?.url, config.magic?.apiKey);
        this.context7Client = new Context7Integration(config.context7?.url, config.context7?.apiKey);
    }
    getMagicClient() {
        return this.magicClient;
    }
    getContext7Client() {
        return this.context7Client;
    }
    async healthCheck() {
        const results = await Promise.allSettled([
            this.checkMagicHealth(),
            this.checkContext7Health()
        ]);
        return {
            magic: results[0].status === 'fulfilled' && results[0].value,
            context7: results[1].status === 'fulfilled' && results[1].value
        };
    }
    async checkMagicHealth() {
        try {
            await this.magicClient.getDesignSystem('react');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkContext7Health() {
        try {
            await this.context7Client.searchPatterns('test');
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=ExternalIntegrations.js.map