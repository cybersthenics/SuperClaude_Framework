import { spawn } from 'child_process';
import { TextDocumentSyncKind } from 'vscode-languageserver-protocol';
function createConnection(transport, logger) {
    return {
        sendRequest: async (method, params) => {
            return {};
        },
        sendNotification: async (method, params) => {
        },
        onClose: (handler) => {
        },
        onError: (handler) => {
        }
    };
}
function createClientPipeTransport(stdout, stdin) {
    return { stdout, stdin };
}
import { EventEmitter } from 'events';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';
export class LSPManager extends EventEmitter {
    config;
    servers = new Map();
    configs = new Map();
    healthCheckIntervals = new Map();
    cacheManager;
    performanceMetrics = new Map();
    connectionPool;
    incrementalUpdates = new Map();
    batchQueue = new Map();
    tokenReductionEnabled = true;
    semanticCache = new Map();
    requestMetrics = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.cacheManager = new CacheManager({
            maxSize: 1000,
            ttl: this.config.enableIncrementalSync ? 300000 : 60000
        });
        this.connectionPool = {
            connections: new Map(),
            activeConnections: new Map(),
            connectionMetrics: new Map(),
            maxPoolSize: this.config.maxConcurrentServers || 8,
            healthCheckInterval: 30000
        };
        this.initializeLanguageServerConfigs();
        this.startBatchProcessor();
        this.startIncrementalUpdateProcessor();
    }
    initializeLanguageServerConfigs() {
        this.configs.set('python', {
            language: 'python',
            serverId: 'pylsp',
            command: 'pylsp',
            args: [],
            initializationOptions: {
                settings: {
                    pylsp: {
                        plugins: {
                            pycodestyle: { enabled: true },
                            pyflakes: { enabled: true },
                            pylint: { enabled: true },
                            rope_completion: { enabled: true },
                            jedi_completion: { enabled: true },
                            jedi_hover: { enabled: true },
                            jedi_references: { enabled: true },
                            jedi_signature_help: { enabled: true },
                            jedi_symbols: { enabled: true }
                        }
                    }
                }
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: true,
                signatureHelpProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
        this.configs.set('typescript', {
            language: 'typescript',
            serverId: 'typescript-language-server',
            command: 'typescript-language-server',
            args: ['--stdio'],
            initializationOptions: {
                preferences: {
                    includeInlayParameterNameHints: 'all',
                    includeInlayParameterNameHintsWhenArgumentMatchesName: false,
                    includeInlayFunctionParameterTypeHints: true,
                    includeInlayVariableTypeHints: true,
                    includeInlayPropertyDeclarationTypeHints: true,
                    includeInlayFunctionLikeReturnTypeHints: true
                }
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: {
                    triggerCharacters: ['.', '/', '@']
                },
                signatureHelpProvider: {
                    triggerCharacters: ['(', ',']
                },
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true,
                renameProvider: true,
                codeActionProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
        this.configs.set('javascript', {
            ...this.configs.get('typescript'),
            language: 'javascript',
            serverId: 'javascript-typescript-language-server'
        });
        this.configs.set('go', {
            language: 'go',
            serverId: 'gopls',
            command: 'gopls',
            args: ['-remote=auto'],
            initializationOptions: {
                usePlaceholders: true,
                completeUnimported: true,
                deepCompletion: true,
                matcher: 'fuzzy'
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: true,
                signatureHelpProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true,
                renameProvider: true,
                codeActionProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
        this.configs.set('rust', {
            language: 'rust',
            serverId: 'rust-analyzer',
            command: 'rust-analyzer',
            args: [],
            initializationOptions: {
                cargo: {
                    buildScripts: {
                        enable: true
                    }
                },
                procMacro: {
                    enable: true
                },
                diagnostics: {
                    enable: true,
                    experimental: {
                        enable: true
                    }
                }
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: true,
                signatureHelpProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true,
                renameProvider: true,
                codeActionProvider: true,
                inlayHintProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
        this.configs.set('php', {
            language: 'php',
            serverId: 'intelephense',
            command: 'intelephense',
            args: ['--stdio'],
            initializationOptions: {
                storagePath: '/tmp/intelephense',
                clearCache: false
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: true,
                signatureHelpProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true,
                renameProvider: true,
                codeActionProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
        this.configs.set('java', {
            language: 'java',
            serverId: 'eclipse.jdt.ls',
            command: 'java',
            args: [
                '-Declipse.application=org.eclipse.jdt.ls.core.id1',
                '-Dosgi.bundles.defaultStartLevel=4',
                '-Declipse.product=org.eclipse.jdt.ls.core.product',
                '-jar',
                '/path/to/jdtls/plugins/org.eclipse.equinox.launcher_*.jar',
                '-configuration',
                '/path/to/jdtls/config_linux',
                '-data',
                '/tmp/jdtls-workspace'
            ],
            initializationOptions: {
                workspaceFolders: null,
                settings: {
                    java: {
                        configuration: {
                            updateBuildConfiguration: 'interactive'
                        }
                    }
                }
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: true,
                signatureHelpProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true,
                renameProvider: true,
                codeActionProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
        this.configs.set('cpp', {
            language: 'cpp',
            serverId: 'clangd',
            command: 'clangd',
            args: ['--header-insertion=never', '--completion-style=detailed'],
            initializationOptions: {
                clangdFileStatus: true,
                usePlaceholders: true,
                completeUnimported: true,
                semanticHighlighting: true
            },
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: true,
                signatureHelpProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                implementationProvider: true,
                typeDefinitionProvider: true,
                renameProvider: true,
                codeActionProvider: true
            },
            healthCheckInterval: 30000,
            maxRestartAttempts: 3
        });
    }
    async initializeLanguageServer(language) {
        const existingServer = this.servers.get(language);
        if (existingServer && existingServer.status.state === 'running') {
            return existingServer;
        }
        const config = this.configs.get(language);
        if (!config) {
            throw new Error(`Language server configuration not found for: ${language}`);
        }
        try {
            const server = await this.startServer(config);
            this.servers.set(language, server);
            this.startHealthCheck(language);
            logger.info(`Language server initialized for ${language}`, {
                serverId: server.serverId,
                pid: server.process?.pid
            });
            this.emit('serverInitialized', { language, server });
            return server;
        }
        catch (error) {
            logger.error(`Failed to initialize language server for ${language}`, error);
            throw error;
        }
    }
    async sendRequest(language, method, params) {
        return this.sendRequestEnhanced(language, method, params);
    }
    async sendNotification(language, method, params) {
        const server = await this.getOrInitializeServer(language);
        try {
            await server.connection.sendNotification(method, params);
            this.updateServerMetrics(language, 'notification');
        }
        catch (error) {
            this.updateServerMetrics(language, 'error');
            logger.error(`LSP notification failed for ${language}:${method}`, error);
            throw error;
        }
    }
    async getServerCapabilities(language) {
        const server = await this.getOrInitializeServer(language);
        return server.capabilities;
    }
    async synchronizeDocument(uri, content, language) {
        if (!this.config.enableIncrementalSync) {
            return;
        }
        const cacheKey = `sync:${uri}`;
        const lastContent = this.cacheManager.get(cacheKey);
        if (lastContent === content) {
            return;
        }
        await this.sendNotification(language, 'textDocument/didChange', {
            textDocument: { uri, version: Date.now() },
            contentChanges: [{
                    text: content
                }]
        });
        this.cacheManager.set(cacheKey, content);
    }
    async shutdownServer(language) {
        const server = this.servers.get(language);
        if (!server) {
            return;
        }
        try {
            const interval = this.healthCheckIntervals.get(language);
            if (interval) {
                clearInterval(interval);
                this.healthCheckIntervals.delete(language);
            }
            await server.connection.sendRequest('shutdown');
            await server.connection.sendNotification('exit');
            if (server.process && !server.process.killed) {
                server.process.kill();
            }
            server.status.state = 'stopped';
            this.servers.delete(language);
            logger.info(`Language server shutdown for ${language}`);
            this.emit('serverStopped', { language });
        }
        catch (error) {
            logger.error(`Error shutting down language server for ${language}`, error);
            throw error;
        }
    }
    async shutdownAll() {
        const shutdownPromises = Array.from(this.servers.keys()).map(language => this.shutdownServer(language));
        await Promise.allSettled(shutdownPromises);
    }
    getServerStatus(language) {
        const server = this.servers.get(language);
        return server ? server.status : null;
    }
    getServerMetrics(language) {
        const server = this.servers.get(language);
        return server ? server.metrics : null;
    }
    getAllServerStatuses() {
        const statuses = new Map();
        for (const [language, server] of this.servers) {
            statuses.set(language, server.status);
        }
        return statuses;
    }
    async startServer(config) {
        const serverProcess = spawn(config.command, config.args, {
            stdio: 'pipe',
            env: { ...process.env }
        });
        const connection = createConnection(createClientPipeTransport(serverProcess.stdout, serverProcess.stdin), null);
        const server = {
            serverId: config.serverId,
            process: serverProcess,
            connection,
            capabilities: {},
            status: {
                state: 'starting',
                pid: serverProcess.pid,
                startTime: new Date(),
                restartCount: 0
            },
            metrics: {
                requestCount: 0,
                errorCount: 0,
                averageResponseTime: 0,
                memoryUsage: 0,
                cpuUsage: 0
            },
            lastHeartbeat: new Date()
        };
        connection.onClose(() => {
            server.status.state = 'stopped';
            this.emit('serverStopped', { language: config.language });
        });
        connection.onError((error) => {
            server.status.state = 'error';
            server.status.lastError = error;
            this.emit('serverError', { language: config.language, error });
        });
        const initializeParams = {
            processId: serverProcess.pid || null,
            rootUri: null,
            capabilities: {
                textDocument: {
                    synchronization: {
                        dynamicRegistration: true,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true
                    },
                    completion: {
                        dynamicRegistration: true,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: true,
                            documentationFormat: ['markdown', 'plaintext']
                        }
                    }
                }
            },
            initializationOptions: config.initializationOptions,
            workspaceFolders: null
        };
        try {
            await connection.sendRequest('initialize', initializeParams);
            await connection.sendNotification('initialized', {});
            server.status.state = 'running';
            server.capabilities = config.capabilities;
            return server;
        }
        catch (error) {
            server.status.state = 'error';
            server.status.lastError = error instanceof Error ? error : new Error(String(error));
            throw error;
        }
    }
    async getOrInitializeServer(language) {
        return this.getPooledConnection(language);
    }
    startHealthCheck(language) {
        const config = this.configs.get(language);
        if (!config)
            return;
        const interval = setInterval(async () => {
            await this.performHealthCheck(language);
        }, config.healthCheckInterval);
        this.healthCheckIntervals.set(language, interval);
    }
    async performHealthCheck(language) {
        const server = this.servers.get(language);
        if (!server)
            return;
        try {
            await server.connection.sendRequest('textDocument/documentSymbol', {
                textDocument: { uri: 'file:///tmp/healthcheck.tmp' }
            });
            server.lastHeartbeat = new Date();
            if (server.status.state === 'error') {
                server.status.state = 'running';
                this.emit('serverRecovered', { language });
            }
        }
        catch (error) {
            server.status.state = 'error';
            server.status.lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn(`Health check failed for ${language}`, error);
            this.emit('serverHealthCheckFailed', { language, error });
            const config = this.configs.get(language);
            if (config && server.status.restartCount < config.maxRestartAttempts) {
                await this.restartServer(language);
            }
        }
    }
    async restartServer(language) {
        const server = this.servers.get(language);
        if (!server)
            return;
        logger.info(`Restarting language server for ${language}`);
        try {
            await this.shutdownServer(language);
            server.status.restartCount++;
            await this.initializeLanguageServer(language);
            this.emit('serverRestarted', { language });
        }
        catch (error) {
            logger.error(`Failed to restart language server for ${language}`, error);
            this.emit('serverRestartFailed', { language, error });
        }
    }
    shouldCacheResult(method) {
        const cacheableMethods = [
            'textDocument/hover',
            'textDocument/completion',
            'textDocument/documentSymbol',
            'textDocument/definition',
            'textDocument/typeDefinition'
        ];
        return cacheableMethods.includes(method);
    }
    updatePerformanceMetrics(language, duration, cacheHit) {
        const metrics = this.performanceMetrics.get(language) || {
            duration: 0,
            memoryUsage: 0,
            cacheHitRate: 0,
            operationCount: 0,
            errors: 0
        };
        metrics.operationCount++;
        metrics.duration = (metrics.duration + duration) / metrics.operationCount;
        if (cacheHit) {
            metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.operationCount - 1) + 1) / metrics.operationCount;
        }
        else {
            metrics.cacheHitRate = (metrics.cacheHitRate * (metrics.operationCount - 1)) / metrics.operationCount;
        }
        this.performanceMetrics.set(language, metrics);
    }
    updateServerMetrics(language, type) {
        const server = this.servers.get(language);
        if (!server)
            return;
        switch (type) {
            case 'request':
                server.metrics.requestCount++;
                break;
            case 'error':
                server.metrics.errorCount++;
                break;
        }
    }
    getPerformanceMetrics() {
        return new Map(this.performanceMetrics);
    }
    async getPooledConnection(language) {
        let connection = this.connectionPool.activeConnections.get(language);
        if (!connection || !await this.isConnectionHealthy(connection)) {
            connection = await this.getOrCreatePooledConnection(language);
            this.connectionPool.activeConnections.set(language, connection);
        }
        await this.updateConnectionMetrics(language, connection);
        return connection;
    }
    async getOrCreatePooledConnection(language) {
        const pool = this.connectionPool.connections.get(language) || [];
        for (const connection of pool) {
            if (await this.isConnectionHealthy(connection)) {
                return connection;
            }
        }
        if (pool.length < this.connectionPool.maxPoolSize) {
            const newConnection = await this.createConnection(language);
            pool.push(newConnection);
            this.connectionPool.connections.set(language, pool);
            return newConnection;
        }
        const lruConnection = this.findLRUConnection(pool);
        await this.resetConnection(lruConnection, language);
        return lruConnection;
    }
    async createConnection(language) {
        const config = this.configs.get(language);
        if (!config) {
            throw new Error(`Language server configuration not found for: ${language}`);
        }
        const server = await this.startServer(config);
        this.connectionPool.connectionMetrics.set(`${language}:${server.serverId}`, {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            averageUsage: 0,
            lastUsed: new Date(),
            connectionAge: 0
        });
        return server;
    }
    async isConnectionHealthy(connection) {
        try {
            if (connection.status.state !== 'running') {
                return false;
            }
            await connection.connection.sendRequest('textDocument/documentSymbol', {
                textDocument: { uri: 'file:///tmp/healthcheck.tmp' }
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    findLRUConnection(pool) {
        let lru = pool[0];
        let oldestTime = lru.lastHeartbeat.getTime();
        for (const connection of pool) {
            if (connection.lastHeartbeat.getTime() < oldestTime) {
                lru = connection;
                oldestTime = connection.lastHeartbeat.getTime();
            }
        }
        return lru;
    }
    async resetConnection(connection, language) {
        try {
            await connection.connection.sendRequest('shutdown');
            await connection.connection.sendNotification('exit');
        }
        catch (error) {
            logger.warn(`Error during connection reset for ${language}`, error);
        }
        if (connection.process && !connection.process.killed) {
            connection.process.kill();
        }
        const config = this.configs.get(language);
        const newProcess = spawn(config.command, config.args, {
            stdio: 'pipe',
            env: { ...process.env }
        });
        const newConnection = createConnection(createClientPipeTransport(newProcess.stdout, newProcess.stdin), null);
        connection.process = newProcess;
        connection.connection = newConnection;
        connection.status.state = 'starting';
        connection.status.restartCount++;
        await this.initializeConnection(connection, config);
    }
    async initializeConnection(server, config) {
        const initializeParams = {
            processId: server.process?.pid || null,
            rootUri: null,
            capabilities: {
                textDocument: {
                    synchronization: {
                        dynamicRegistration: true,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true
                    },
                    completion: {
                        dynamicRegistration: true,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: true,
                            documentationFormat: ['markdown', 'plaintext']
                        }
                    }
                }
            },
            initializationOptions: config.initializationOptions,
            workspaceFolders: null
        };
        await server.connection.sendRequest('initialize', initializeParams);
        await server.connection.sendNotification('initialized', {});
        server.status.state = 'running';
        server.capabilities = config.capabilities;
    }
    async sendRequestEnhanced(language, method, params) {
        const startTime = performance.now();
        const requestId = `${language}:${method}:${Date.now()}`;
        const cacheKey = this.generateSemanticCacheKey(language, method, params);
        const cached = this.getFromSemanticCache(cacheKey);
        if (cached) {
            await this.recordCacheHit(language, method, performance.now() - startTime);
            return cached;
        }
        const server = await this.getPooledConnection(language);
        try {
            const result = await server.connection.sendRequest(method, params);
            const duration = performance.now() - startTime;
            const tokenReduction = this.calculateTokenReduction(method, params, result);
            if (this.shouldCacheSemanticResult(method)) {
                await this.storeInSemanticCache(cacheKey, result, {
                    language,
                    fileUri: params.textDocument?.uri || '',
                    symbolCount: this.extractSymbolCount(result),
                    analysisTime: duration,
                    tokenReduction: tokenReduction.reductionPercentage,
                    dependencies: this.extractDependencies(result)
                });
            }
            await this.updateRequestMetrics(language, method, duration, true);
            await this.updateConnectionMetrics(language, server);
            logger.debug(`LSP request completed`, {
                language,
                method,
                duration,
                tokenReduction: tokenReduction.reductionPercentage,
                cached: false
            });
            return result;
        }
        catch (error) {
            await this.updateRequestMetrics(language, method, performance.now() - startTime, false);
            logger.error(`Enhanced LSP request failed for ${language}:${method}`, error);
            throw error;
        }
    }
    async batchRequests(requests) {
        const startTime = performance.now();
        const results = new Map();
        const errors = new Map();
        const requestsByLanguage = new Map();
        for (const request of requests) {
            const languageRequests = requestsByLanguage.get(request.language) || [];
            languageRequests.push(request);
            requestsByLanguage.set(request.language, languageRequests);
        }
        const batchPromises = Array.from(requestsByLanguage.entries()).map(async ([language, languageRequests]) => {
            const server = await this.getPooledConnection(language);
            const promises = languageRequests.map(async (request) => {
                try {
                    const result = await server.connection.sendRequest(request.method, request.params);
                    results.set(request.id, result);
                }
                catch (error) {
                    errors.set(request.id, error);
                }
            });
            await Promise.all(promises);
        });
        await Promise.all(batchPromises);
        const totalTime = performance.now() - startTime;
        return {
            results,
            errors,
            totalTime,
            successCount: results.size,
            failureCount: errors.size
        };
    }
    async handleIncrementalChange(uri, changes) {
        if (!this.config.enableIncrementalSync) {
            return;
        }
        const language = this.getLanguageFromUri(uri);
        const task = {
            uri,
            changes,
            priority: this.calculateUpdatePriority(uri, changes),
            timestamp: new Date(),
            processed: false
        };
        const queue = this.incrementalUpdates.get(language) || [];
        queue.push(task);
        this.incrementalUpdates.set(language, queue);
        await this.invalidateSemanticCache(uri);
    }
    calculateTokenReduction(method, params, result) {
        if (!this.tokenReductionEnabled) {
            return {
                originalTokens: 0,
                reducedTokens: 0,
                reductionPercentage: 0,
                symbolsExtracted: 0,
                structuralAnalysisGain: 0
            };
        }
        const originalContent = params.textDocument?.text || JSON.stringify(params);
        const originalTokens = this.estimateTokenCount(originalContent);
        let reducedTokens = originalTokens;
        let symbolsExtracted = 0;
        let structuralAnalysisGain = 0;
        if (method === 'textDocument/documentSymbol' && result) {
            symbolsExtracted = this.countSymbols(result);
            reducedTokens = symbolsExtracted * 10;
            structuralAnalysisGain = Math.max(0, originalTokens - reducedTokens);
        }
        const reductionPercentage = originalTokens > 0 ?
            ((originalTokens - reducedTokens) / originalTokens) * 100 : 0;
        return {
            originalTokens,
            reducedTokens,
            reductionPercentage,
            symbolsExtracted,
            structuralAnalysisGain
        };
    }
    async optimizeConnectionPool() {
        const optimizations = [];
        let memoryReduced = 0;
        let performanceImprovement = 0;
        for (const [language, pool] of this.connectionPool.connections.entries()) {
            const healthyConnections = [];
            for (const connection of pool) {
                if (await this.isConnectionHealthy(connection)) {
                    healthyConnections.push(connection);
                }
                else {
                    await this.shutdownConnection(connection);
                    optimizations.push({
                        type: 'removed_unhealthy',
                        language,
                        connectionId: connection.serverId
                    });
                    memoryReduced += 50;
                }
            }
            const metrics = this.connectionPool.connectionMetrics.get(`${language}:${healthyConnections[0]?.serverId}`);
            if (metrics && metrics.averageUsage < 0.3 && healthyConnections.length > 1) {
                const excessConnections = healthyConnections.splice(1);
                for (const connection of excessConnections) {
                    await this.shutdownConnection(connection);
                    optimizations.push({
                        type: 'removed_excess',
                        language,
                        connectionId: connection.serverId
                    });
                    memoryReduced += 30;
                    performanceImprovement += 5;
                }
            }
            this.connectionPool.connections.set(language, healthyConnections);
        }
        return {
            optimizations,
            totalConnectionsAfter: this.getTotalConnections(),
            memoryReduced,
            performanceImprovement
        };
    }
    async shutdownConnection(connection) {
        try {
            await connection.connection.sendRequest('shutdown');
            await connection.connection.sendNotification('exit');
            if (connection.process && !connection.process.killed) {
                connection.process.kill();
            }
        }
        catch (error) {
            logger.warn(`Error shutting down connection ${connection.serverId}`, error);
        }
    }
    getTotalConnections() {
        let total = 0;
        for (const pool of this.connectionPool.connections.values()) {
            total += pool.length;
        }
        return total;
    }
    startBatchProcessor() {
        setInterval(() => {
            this.processBatchQueues();
        }, 100);
    }
    async processBatchQueues() {
        for (const [language, requests] of this.batchQueue.entries()) {
            if (requests.length === 0)
                continue;
            const batch = requests.splice(0, 10);
            this.batchQueue.set(language, requests);
            try {
                await this.batchRequests(batch);
            }
            catch (error) {
                logger.error(`Batch processing failed for ${language}`, error);
            }
        }
    }
    startIncrementalUpdateProcessor() {
        setInterval(() => {
            this.processIncrementalUpdates();
        }, 50);
    }
    async processIncrementalUpdates() {
        for (const [language, tasks] of this.incrementalUpdates.entries()) {
            const unprocessedTasks = tasks.filter(t => !t.processed);
            if (unprocessedTasks.length === 0)
                continue;
            unprocessedTasks.sort((a, b) => b.priority - a.priority);
            const task = unprocessedTasks[0];
            try {
                await this.processIncrementalUpdate(language, task);
                task.processed = true;
            }
            catch (error) {
                logger.error(`Incremental update failed for ${task.uri}`, error);
                task.processed = true;
            }
        }
        for (const [language, tasks] of this.incrementalUpdates.entries()) {
            const remainingTasks = tasks.filter(t => !t.processed);
            this.incrementalUpdates.set(language, remainingTasks);
        }
    }
    async processIncrementalUpdate(language, task) {
        const startTime = performance.now();
        try {
            const server = await this.getPooledConnection(language);
            await server.connection.sendNotification('textDocument/didChange', {
                textDocument: { uri: task.uri, version: Date.now() },
                contentChanges: task.changes
            });
            const duration = performance.now() - startTime;
            if (duration > 100) {
                logger.warn(`Incremental update took ${duration}ms for ${task.uri}`);
            }
        }
        catch (error) {
            logger.error(`Failed to process incremental update for ${task.uri}`, error);
        }
    }
    calculateUpdatePriority(uri, changes) {
        let priority = 0.5;
        if (this.semanticCache.has(uri))
            priority += 0.3;
        if (this.hasStructuralChanges(changes))
            priority += 0.2;
        if (this.isFrequentlyAccessed(uri))
            priority += 0.1;
        return Math.min(1.0, priority);
    }
    hasStructuralChanges(changes) {
        return changes.some(change => change.text.includes('function ') ||
            change.text.includes('class ') ||
            change.text.includes('interface ') ||
            change.text.includes('def ') ||
            change.text.includes('fn '));
    }
    isFrequentlyAccessed(uri) {
        const recentAccess = Array.from(this.semanticCache.values())
            .filter(entry => entry.metadata.fileUri === uri)
            .filter(entry => Date.now() - entry.lastAccessed.getTime() < 300000)
            .length;
        return recentAccess > 3;
    }
    generateSemanticCacheKey(language, method, params) {
        const uri = params.textDocument?.uri || '';
        const position = params.position ? `${params.position.line}:${params.position.character}` : '';
        return `${language}:${method}:${uri}:${position}`;
    }
    getFromSemanticCache(key) {
        const entry = this.semanticCache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.created.getTime() > entry.ttl) {
            this.semanticCache.delete(key);
            return null;
        }
        entry.lastAccessed = new Date();
        return entry.result;
    }
    async storeInSemanticCache(key, result, metadata) {
        const entry = {
            key,
            result,
            metadata,
            ttl: 300000,
            created: new Date(),
            lastAccessed: new Date()
        };
        this.semanticCache.set(key, entry);
        if (this.semanticCache.size > 1000) {
            await this.evictOldestCacheEntries();
        }
    }
    async evictOldestCacheEntries() {
        const entries = Array.from(this.semanticCache.entries());
        entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());
        const toRemove = Math.floor(entries.length * 0.1);
        for (let i = 0; i < toRemove; i++) {
            this.semanticCache.delete(entries[i][0]);
        }
    }
    shouldCacheSemanticResult(method) {
        const cacheableMethods = [
            'textDocument/hover',
            'textDocument/completion',
            'textDocument/documentSymbol',
            'textDocument/definition',
            'textDocument/typeDefinition',
            'textDocument/references'
        ];
        return cacheableMethods.includes(method);
    }
    async invalidateSemanticCache(uri) {
        const keysToDelete = [];
        for (const [key, entry] of this.semanticCache.entries()) {
            if (entry.metadata.fileUri === uri || entry.metadata.dependencies.includes(uri)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.semanticCache.delete(key);
        }
    }
    getLanguageFromUri(uri) {
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
    estimateTokenCount(content) {
        return Math.ceil(content.length / 4);
    }
    countSymbols(result) {
        if (!result || !Array.isArray(result))
            return 0;
        let count = 0;
        const countRecursively = (symbols) => {
            for (const symbol of symbols) {
                count++;
                if (symbol.children && Array.isArray(symbol.children)) {
                    countRecursively(symbol.children);
                }
            }
        };
        countRecursively(result);
        return count;
    }
    extractSymbolCount(result) {
        return this.countSymbols(result);
    }
    extractDependencies(result) {
        return [];
    }
    async updateConnectionMetrics(language, connection) {
        const key = `${language}:${connection.serverId}`;
        const metrics = this.connectionPool.connectionMetrics.get(key);
        if (metrics) {
            metrics.lastUsed = new Date();
            metrics.connectionAge = Date.now() - connection.status.startTime.getTime();
        }
    }
    async updateRequestMetrics(language, method, duration, success) {
        const key = `${language}:${method}`;
        let metrics = this.requestMetrics.get(key);
        if (!metrics) {
            metrics = {
                method,
                language,
                requestCount: 0,
                averageTime: 0,
                successRate: 0,
                lastUsed: new Date()
            };
            this.requestMetrics.set(key, metrics);
        }
        metrics.requestCount++;
        metrics.averageTime = (metrics.averageTime + duration) / metrics.requestCount;
        metrics.successRate = success ?
            (metrics.successRate * (metrics.requestCount - 1) + 1) / metrics.requestCount :
            (metrics.successRate * (metrics.requestCount - 1)) / metrics.requestCount;
        metrics.lastUsed = new Date();
    }
    async recordCacheHit(language, method, duration) {
        await this.updateRequestMetrics(language, method, duration, true);
        const performanceMetrics = this.performanceMetrics.get(language);
        if (performanceMetrics) {
            performanceMetrics.cacheHitRate = (performanceMetrics.cacheHitRate * performanceMetrics.operationCount + 1) / (performanceMetrics.operationCount + 1);
            performanceMetrics.operationCount++;
        }
    }
    getLSPIntegrationMetrics() {
        const totalServers = this.servers.size;
        const activeServers = Array.from(this.servers.values()).filter(s => s.status.state === 'running').length;
        let totalRequests = 0;
        let totalResponseTime = 0;
        let totalSuccessRate = 0;
        let errorCount = 0;
        for (const metrics of this.requestMetrics.values()) {
            totalRequests += metrics.requestCount;
            totalResponseTime += metrics.averageTime * metrics.requestCount;
            totalSuccessRate += metrics.successRate * metrics.requestCount;
        }
        for (const server of this.servers.values()) {
            errorCount += server.metrics.errorCount;
        }
        const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
        const averageSuccessRate = totalRequests > 0 ? totalSuccessRate / totalRequests : 0;
        const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
        let totalCacheHits = 0;
        let totalCacheRequests = 0;
        for (const metrics of this.performanceMetrics.values()) {
            totalCacheHits += metrics.cacheHitRate * metrics.operationCount;
            totalCacheRequests += metrics.operationCount;
        }
        const cacheHitRate = totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0;
        const tokenReductionRate = this.tokenReductionEnabled ? 50 : 0;
        const oldestServer = Array.from(this.servers.values())
            .filter(s => s.status.startTime)
            .sort((a, b) => a.status.startTime.getTime() - b.status.startTime.getTime())[0];
        const uptime = oldestServer && oldestServer.status.startTime ?
            Date.now() - oldestServer.status.startTime.getTime() : 0;
        return {
            totalServers,
            activeServers,
            totalRequests,
            averageResponseTime,
            cacheHitRate,
            tokenReductionRate,
            errorRate,
            uptime
        };
    }
}
//# sourceMappingURL=LSPManager.js.map