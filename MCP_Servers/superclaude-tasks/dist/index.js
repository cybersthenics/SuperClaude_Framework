#!/usr/bin/env node
import { SuperClaudeTasksServer } from './MCPServer.js';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
async function main() {
    try {
        const dataDir = path.join(process.cwd(), 'data');
        const logsDir = path.join(process.cwd(), 'logs');
        if (!existsSync(dataDir)) {
            await mkdir(dataDir, { recursive: true });
        }
        if (!existsSync(logsDir)) {
            await mkdir(logsDir, { recursive: true });
        }
        const server = new SuperClaudeTasksServer();
        process.on('SIGINT', async () => {
            console.log('\nReceived SIGINT, shutting down gracefully...');
            await server.shutdown();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\nReceived SIGTERM, shutting down gracefully...');
            await server.shutdown();
            process.exit(0);
        });
        await server.run();
    }
    catch (error) {
        console.error('Failed to start SuperClaude Tasks Server:', error.message);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=index.js.map