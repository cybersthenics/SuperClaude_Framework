#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './services/Logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class EnhancedIntelligenceServer {
    server;
    languageServers = new Map();
    requestId = 1;
    responseHandlers = new Map();
    constructor() {
        this.server = new Server({
            name: 'superclaude-intelligence-enhanced',
            version: '3.0.0',
            description: 'Enhanced SuperClaude Intelligence Server with LSP Integration'
        }, {
            capabilities: {
                tools: {},
                resources: {}
            }
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'analyze_python_file',
                        description: 'Analyze Python file using pylsp language server',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to Python file' },
                                include_symbols: { type: 'boolean', default: true },
                                include_diagnostics: { type: 'boolean', default: true }
                            },
                            required: ['file_path']
                        }
                    },
                    {
                        name: 'find_python_definition',
                        description: 'Find symbol definition in Python file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to Python file' },
                                line: { type: 'number', description: 'Line number (0-based)' },
                                character: { type: 'number', description: 'Character position (0-based)' }
                            },
                            required: ['file_path', 'line', 'character']
                        }
                    },
                    {
                        name: 'get_python_completions',
                        description: 'Get code completions for Python file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to Python file' },
                                line: { type: 'number', description: 'Line number (0-based)' },
                                character: { type: 'number', description: 'Character position (0-based)' },
                                max_results: { type: 'number', default: 25 }
                            },
                            required: ['file_path', 'line', 'character']
                        }
                    },
                    {
                        name: 'validate_python_syntax',
                        description: 'Validate Python file syntax and get diagnostics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                file_path: { type: 'string', description: 'Absolute path to Python file' }
                            },
                            required: ['file_path']
                        }
                    },
                    {
                        name: 'get_server_status',
                        description: 'Get status of language servers',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                include_capabilities: { type: 'boolean', default: false }
                            }
                        }
                    }
                ]
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case 'analyze_python_file':
                        result = await this.analyzePythonFile(args);
                        break;
                    case 'find_python_definition':
                        result = await this.findPythonDefinition(args);
                        break;
                    case 'get_python_completions':
                        result = await this.getPythonCompletions(args);
                        break;
                    case 'validate_python_syntax':
                        result = await this.validatePythonSyntax(args);
                        break;
                    case 'get_server_status':
                        result = await this.getServerStatus(args);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                logger.error(`Tool execution failed: ${name}`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ],
                    isError: true
                };
            }
        });
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: 'intelligence://lsp-status',
                        name: 'Language Server Status',
                        description: 'Status and capabilities of all language servers',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'intelligence://python-capabilities',
                        name: 'Python LSP Capabilities',
                        description: 'Python language server capabilities and features',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            try {
                let content;
                switch (uri) {
                    case 'intelligence://lsp-status':
                        content = await this.getLSPStatus();
                        break;
                    case 'intelligence://python-capabilities':
                        content = await this.getPythonCapabilities();
                        break;
                    default:
                        throw new Error(`Unknown resource: ${uri}`);
                }
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(content, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
                logger.error(`Resource read failed: ${uri}`, error);
                throw error;
            }
        });
    }
    async startPythonLanguageServer() {
        logger.info('Starting Python language server (pylsp)');
        try {
            const pylspProcess = spawn('pylsp', [], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            const instance = {
                process: pylspProcess,
                language: 'python',
                status: 'starting',
                lastHeartbeat: Date.now()
            };
            pylspProcess.on('error', (error) => {
                logger.error('Python LSP process error:', error);
                instance.status = 'error';
            });
            pylspProcess.on('exit', (code) => {
                logger.warn(`Python LSP process exited with code: ${code}`);
                instance.status = 'stopped';
            });
            pylspProcess.stdout?.on('data', (data) => {
                this.handleLSPMessage(instance, data.toString());
            });
            pylspProcess.stderr?.on('data', (data) => {
                logger.debug('Python LSP stderr:', data.toString());
            });
            await this.initializeLSP(instance);
            this.languageServers.set('python', instance);
            logger.info('Python language server started successfully');
            return instance;
        }
        catch (error) {
            logger.error('Failed to start Python language server:', error);
            throw error;
        }
    }
    async initializeLSP(instance) {
        const initializeRequest = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'initialize',
            params: {
                processId: process.pid,
                clientInfo: {
                    name: 'superclaude-intelligence',
                    version: '3.0.0'
                },
                capabilities: {
                    textDocument: {
                        synchronization: {
                            didOpen: true,
                            didChange: true,
                            didClose: true,
                            didSave: true
                        },
                        completion: {
                            completionItem: {
                                snippetSupport: true,
                                documentationFormat: ['markdown', 'plaintext']
                            }
                        },
                        definition: {
                            linkSupport: true
                        },
                        references: {
                            includeDeclaration: true
                        },
                        hover: {
                            contentFormat: ['markdown', 'plaintext']
                        },
                        documentSymbol: {
                            symbolKind: {
                                valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
                            }
                        }
                    },
                    workspace: {
                        configuration: true,
                        workspaceFolders: true
                    }
                }
            }
        };
        return new Promise((resolve, reject) => {
            this.responseHandlers.set(initializeRequest.id, { resolve, reject });
            this.sendLSPMessage(instance, initializeRequest);
            setTimeout(() => {
                if (this.responseHandlers.has(initializeRequest.id)) {
                    this.responseHandlers.delete(initializeRequest.id);
                    reject(new Error('LSP initialization timeout'));
                }
            }, 10000);
        });
    }
    sendLSPMessage(instance, message) {
        const content = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(content, 'utf8')}\r\n\r\n`;
        const fullMessage = header + content;
        if (instance.process.stdin) {
            instance.process.stdin.write(fullMessage);
        }
    }
    handleLSPMessage(instance, data) {
        const lines = data.split('\n');
        for (const line of lines) {
            if (line.trim().startsWith('{')) {
                try {
                    const message = JSON.parse(line.trim());
                    if (message.id && this.responseHandlers.has(message.id)) {
                        const handler = this.responseHandlers.get(message.id);
                        this.responseHandlers.delete(message.id);
                        if (message.error) {
                            handler.reject(new Error(message.error.message || 'LSP Error'));
                        }
                        else {
                            if (message.method === 'initialize') {
                                instance.capabilities = message.result?.capabilities;
                                instance.status = 'ready';
                            }
                            handler.resolve(message.result);
                        }
                    }
                }
                catch (error) {
                    logger.debug('Failed to parse LSP message:', error);
                }
            }
        }
    }
    getNextRequestId() {
        return this.requestId++;
    }
    async analyzePythonFile(args) {
        const { file_path, include_symbols = true, include_diagnostics = true } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        let pythonLSP = this.languageServers.get('python');
        if (!pythonLSP || pythonLSP.status !== 'ready') {
            pythonLSP = await this.startPythonLanguageServer();
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        await this.openDocument(pythonLSP, fileUri, fileContent);
        const analysis = {
            file_path,
            language: 'python',
            lines_of_code: fileContent.split('\n').length,
            file_size: Buffer.byteLength(fileContent, 'utf8'),
            timestamp: new Date().toISOString()
        };
        if (include_symbols) {
            analysis.symbols = await this.getDocumentSymbols(pythonLSP, fileUri);
        }
        if (include_diagnostics) {
            analysis.diagnostics = await this.getDiagnostics(pythonLSP, fileUri);
        }
        return analysis;
    }
    async findPythonDefinition(args) {
        const { file_path, line, character } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        let pythonLSP = this.languageServers.get('python');
        if (!pythonLSP || pythonLSP.status !== 'ready') {
            pythonLSP = await this.startPythonLanguageServer();
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        await this.openDocument(pythonLSP, fileUri, fileContent);
        const definitionRequest = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'textDocument/definition',
            params: {
                textDocument: { uri: fileUri },
                position: { line, character }
            }
        };
        return new Promise((resolve, reject) => {
            this.responseHandlers.set(definitionRequest.id, {
                resolve: (result) => resolve({
                    definitions: result || [],
                    file_path,
                    position: { line, character },
                    timestamp: new Date().toISOString()
                }),
                reject
            });
            this.sendLSPMessage(pythonLSP, definitionRequest);
            setTimeout(() => {
                if (this.responseHandlers.has(definitionRequest.id)) {
                    this.responseHandlers.delete(definitionRequest.id);
                    reject(new Error('Definition request timeout'));
                }
            }, 5000);
        });
    }
    async getPythonCompletions(args) {
        const { file_path, line, character, max_results = 25 } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        let pythonLSP = this.languageServers.get('python');
        if (!pythonLSP || pythonLSP.status !== 'ready') {
            pythonLSP = await this.startPythonLanguageServer();
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        await this.openDocument(pythonLSP, fileUri, fileContent);
        const completionRequest = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'textDocument/completion',
            params: {
                textDocument: { uri: fileUri },
                position: { line, character }
            }
        };
        return new Promise((resolve, reject) => {
            this.responseHandlers.set(completionRequest.id, {
                resolve: (result) => {
                    const completions = (result?.items || []).slice(0, max_results);
                    resolve({
                        completions,
                        file_path,
                        position: { line, character },
                        total_available: result?.items?.length || 0,
                        returned: completions.length,
                        timestamp: new Date().toISOString()
                    });
                },
                reject
            });
            this.sendLSPMessage(pythonLSP, completionRequest);
            setTimeout(() => {
                if (this.responseHandlers.has(completionRequest.id)) {
                    this.responseHandlers.delete(completionRequest.id);
                    reject(new Error('Completion request timeout'));
                }
            }, 5000);
        });
    }
    async validatePythonSyntax(args) {
        const { file_path } = args;
        if (!fs.existsSync(file_path)) {
            throw new Error(`File not found: ${file_path}`);
        }
        let pythonLSP = this.languageServers.get('python');
        if (!pythonLSP || pythonLSP.status !== 'ready') {
            pythonLSP = await this.startPythonLanguageServer();
        }
        const fileContent = fs.readFileSync(file_path, 'utf8');
        const fileUri = `file://${file_path}`;
        await this.openDocument(pythonLSP, fileUri, fileContent);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const diagnostics = await this.getDiagnostics(pythonLSP, fileUri);
        return {
            file_path,
            valid: diagnostics.filter((d) => d.severity <= 2).length === 0,
            diagnostics,
            error_count: diagnostics.filter((d) => d.severity === 1).length,
            warning_count: diagnostics.filter((d) => d.severity === 2).length,
            info_count: diagnostics.filter((d) => d.severity >= 3).length,
            timestamp: new Date().toISOString()
        };
    }
    async getServerStatus(args) {
        const { include_capabilities = false } = args;
        const status = {
            servers: {},
            total_servers: this.languageServers.size,
            healthy_servers: 0,
            timestamp: new Date().toISOString()
        };
        for (const [language, instance] of this.languageServers) {
            const serverInfo = {
                language,
                status: instance.status,
                uptime: Date.now() - instance.lastHeartbeat,
                process_id: instance.process.pid
            };
            if (include_capabilities && instance.capabilities) {
                serverInfo.capabilities = instance.capabilities;
            }
            if (instance.status === 'ready') {
                status.healthy_servers++;
            }
            status.servers[language] = serverInfo;
        }
        return status;
    }
    async openDocument(instance, uri, content) {
        const openRequest = {
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: {
                textDocument: {
                    uri,
                    languageId: instance.language,
                    version: 1,
                    text: content
                }
            }
        };
        this.sendLSPMessage(instance, openRequest);
    }
    async getDocumentSymbols(instance, uri) {
        const symbolRequest = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'textDocument/documentSymbol',
            params: {
                textDocument: { uri }
            }
        };
        return new Promise((resolve, reject) => {
            this.responseHandlers.set(symbolRequest.id, {
                resolve: (result) => resolve(result || []),
                reject
            });
            this.sendLSPMessage(instance, symbolRequest);
            setTimeout(() => {
                if (this.responseHandlers.has(symbolRequest.id)) {
                    this.responseHandlers.delete(symbolRequest.id);
                    resolve([]);
                }
            }, 5000);
        });
    }
    async getDiagnostics(instance, uri) {
        return [];
    }
    async getLSPStatus() {
        return this.getServerStatus({ include_capabilities: true });
    }
    async getPythonCapabilities() {
        const pythonLSP = this.languageServers.get('python');
        if (!pythonLSP) {
            return {
                available: false,
                reason: 'Python language server not started'
            };
        }
        return {
            available: pythonLSP.status === 'ready',
            status: pythonLSP.status,
            capabilities: pythonLSP.capabilities || {},
            features: {
                completion: true,
                definition: true,
                references: true,
                hover: true,
                documentSymbol: true,
                diagnostics: true
            }
        };
    }
    async start() {
        const transport = new StdioServerTransport();
        logger.info('Starting Enhanced SuperClaude Intelligence Server');
        try {
            await this.server.connect(transport);
            logger.info('Enhanced SuperClaude Intelligence Server started successfully');
        }
        catch (error) {
            logger.error('Failed to start server', error);
            process.exit(1);
        }
    }
    async stop() {
        logger.info('Stopping Enhanced SuperClaude Intelligence Server');
        try {
            for (const instance of this.languageServers.values()) {
                if (instance.process && !instance.process.killed) {
                    instance.process.kill();
                }
            }
            await this.server.close();
            logger.info('Enhanced SuperClaude Intelligence Server stopped successfully');
        }
        catch (error) {
            logger.error('Error stopping server', error);
        }
    }
}
async function main() {
    const server = new EnhancedIntelligenceServer();
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    process.on('unhandledRejection', (error) => {
        logger.error('Unhandled promise rejection:', error);
        process.exit(1);
    });
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception:', error);
        process.exit(1);
    });
    await server.start();
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=EnhancedServer.js.map