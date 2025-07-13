# SuperClaude MCP (Model Context Protocol) v3.0

A modern MCP implementation for SuperClaude, featuring a hybrid architecture with 7 internal servers and 4 external server integrations. This replaces the legacy 15-hook system with a scalable, high-performance architecture.

**Migration Status**: Phase 5/6 Complete - Ready for deployment testing

## Why SuperClaude v3?

The framework evolved to address several needs:
- **Claude Code Updates**: Anthropic's parsing changes and new hooks feature opened new possibilities
- **Cross-CLI Compatibility**: Architecture designed to work with other agent CLIs beyond Claude Code
- **User Choice**: Modular system lets users pick only the features they need
- **Maintainability**: Reduced over-engineering for easier maintenance

## What's New in v3

### New Modes
- **Sub Agent Mode**: Delegate complex tasks to specialized sub-agents for parallel processing
- **Wave Mode**: Multi-stage execution with compound intelligence across operations
- **Loop Mode**: Iterative refinement for progressive improvements

### Improved Modes
- **Task Management**: Enhanced with cross-session persistence and better state tracking
- **Introspection**: Now includes framework troubleshooting and meta-cognitive analysis
- **Token Reduction**: Smarter compression achieving realistic 30-50% reduction

### Core Architecture Changes
- **Orchestrator**: New intelligent routing system for optimal tool and persona selection
- **Split Core**: Separated Rules (actionable directives) from Principles (philosophy)
- **Scribe Persona**: Professional documentation specialist with localization support
- **Hook System**: 15 specialized hooks for event-driven enhancements

## Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/user/SuperClaude_MCP.git
cd SuperClaude_MCP

# Run the deployment script
./deploy.sh

# Configure environment (add your API keys)
cp .env.example .env
nano .env

# Start monitoring
./monitor.sh
```

### Manual Installation

1. **Install Dependencies**:
   ```bash
   # Python dependencies
   cd SuperClaude/Hooks
   ./setup.sh
   
   # Node dependencies
   cd ../../MCP_Servers/bridge-hooks
   npm install
   npm run build
   ```

2. **Configure Claude Code**:
   ```bash
   ln -sf $(pwd)/SuperClaude/Hooks/config.json ~/.claude/hooks/config.json
   ```

3. **Start Services**:
   ```bash
   cd MCP_Servers/bridge-hooks
   npm run server
   ```

## MCP Architecture Implementation

The framework now uses a modern MCP (Model Context Protocol) architecture:

### Server Architecture (11 Total)

**Internal Servers (7)**:
- `superclaude-code` - Code analysis and generation
- `superclaude-intelligence` - Complex reasoning and analysis
- `superclaude-orchestrator` - Task routing and coordination
- `superclaude-performance` - Performance optimization
- `superclaude-quality` - Code quality and testing
- `superclaude-tasks` - Task management
- `superclaude-ui` - UI component generation

**External Servers (4)**:
- **Context7** - Official library documentation and patterns
- **Sequential** - Multi-step problem solving and analysis
- **Magic** - Modern UI component generation (21st.dev)
- **Playwright** - Browser automation and E2E testing

### Hook System (Simplified to 3)

Python-based hooks that intercept Claude Code operations:
- `pre_tool_use.py` - Validates and routes operations to appropriate MCP servers
- `post_tool_use.py` - Processes results and triggers quality gates
- `notification.py` - Handles permissions and system notifications

### Key Features
- **Circuit Breaker Pattern**: Graceful degradation when external services fail
- **Intelligent Routing**: Automatic server selection based on task complexity
- **Performance Optimization**: Sub-100ms hook execution with intelligent caching
- **Hybrid Operation**: Seamless fallback from external to internal servers

## Command Consolidation

Streamlined from 20+ commands to 14 essential ones:

### Development
- `/build` - Project building with framework detection
- `/dev-setup` - Environment configuration

### Analysis
- `/analyze` - Multi-dimensional analysis (wave-enabled)
- `/review` - Code review and quality analysis (wave-enabled)
- `/troubleshoot` - Problem investigation

### Quality
- `/improve` - Evidence-based enhancement (wave-enabled)
- `/scan` - Security and quality scanning (wave-enabled)
- `/test` - Testing workflows

### Others
- `/document`, `/deploy`, `/git`, `/migrate`, `/estimate`, `/task`

## Configuration

### Environment Variables
Configure in `.env` file:
```bash
# External server API keys
CONTEXT7_API_KEY=your-api-key
SEQUENTIAL_TOKEN=your-token
MAGIC_API_KEY=your-api-key

# Performance settings
MCP_TIMEOUT_MS=5000
CIRCUIT_BREAKER_THRESHOLD=5
```

### Hook Configuration
The framework uses `~/.claude/hooks/config.json` for Claude Code integration.

### Customization
- Edit `MCP_Servers/mcp-servers.json` for external server settings
- Modify `SuperClaude/Core/*.md` files for framework behavior
- Adjust orchestrator settings in `ORCHESTRATOR.md`

## Testing

```bash
# Run all tests
./run-integration-tests.sh

# Test specific components
python3 SuperClaude/Hooks/test_hooks.py
python3 Tests/test_external_servers.py
python3 Tests/test_circuit_breaker.py
```

## Monitoring

```bash
# Real-time health monitoring
./monitor.sh

# Check service health
curl http://localhost:8080/health

# View MCP server status
curl http://localhost:8080/mcp-status
```

## Roadmap

### Phase 6: Optimization & Polish (Next)
- Performance tuning for sub-50ms hook execution
- Enhanced caching strategies
- Improved error messages
- Comprehensive documentation

### Future Enhancements
- Additional external server integrations
- Cross-CLI compatibility layer
- Plugin system for custom servers
- Advanced monitoring dashboard

## Contributing

We welcome contributions! Key areas:
- Test coverage for hooks and modes
- Documentation and examples
- Performance optimizations
- Cross-CLI compatibility

## Architecture Notes

The v3 architecture prioritizes:
- **Modularity**: Pick only what you need
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Hook-based plugin system
- **Performance**: Sub-100ms operation targets
- **Compatibility**: Works with Claude Code updates

Each component follows single-responsibility principle with graceful degradation when dependencies are unavailable.

## License

MIT - See LICENSE file for details
