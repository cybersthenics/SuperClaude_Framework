#!/usr/bin/env node
/**
 * SuperClaude Orchestrator MCP Server Entry Point
 */
import { OrchestratorServer } from './core/OrchestratorServer.js';
async function main() {
    const server = new OrchestratorServer();
    await server.run();
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('SuperClaude Orchestrator failed to start:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map