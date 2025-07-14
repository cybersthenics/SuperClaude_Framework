#!/usr/bin/env node
import { IntelligenceServer } from './MCPServer.js';
import { logger } from './services/Logger.js';
import * as fs from 'fs';
import * as path from 'path';
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
const server = new IntelligenceServer();
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
logger.info('SuperClaude Intelligence Server starting...');
//# sourceMappingURL=index.js.map