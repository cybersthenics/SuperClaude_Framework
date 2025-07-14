#!/usr/bin/env node
import { SimpleIntelligenceServer } from './MCPServerSimple.js';
import { logger } from './services/Logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
const server = new SimpleIntelligenceServer();
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
server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});
logger.info('Simple SuperClaude Intelligence Server starting...');
//# sourceMappingURL=indexSimple.js.map