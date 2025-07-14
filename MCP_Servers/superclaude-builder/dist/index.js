#!/usr/bin/env node
import { SimpleBuildServerMCP } from './MCPServerSimple.js';
async function main() {
    const server = new SimpleBuildServerMCP();
    await server.run();
}
main().catch((error) => {
    console.error('Failed to start SuperClaude Builder MCP server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map