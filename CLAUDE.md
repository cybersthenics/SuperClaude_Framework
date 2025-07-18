# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## SuperClaude Framework v3.0

SuperClaude is a Python-based framework that extends Claude Code with specialized commands, personas, and MCP server integration. It provides intelligent routing, multi-stage orchestration, and context-aware assistance for development workflows.

## Build, Test, and Development Commands

### Installation and Setup
```bash
# Install SuperClaude with recommended settings
python3 SuperClaude.py install --quick

# Install with development components (includes MCP servers)
python3 SuperClaude.py install --profile developer

# See what would be installed (dry run)
python3 SuperClaude.py install --quick --dry-run

# List available components
python3 SuperClaude.py install --list-components

# Run system diagnostics
python3 SuperClaude.py install --diagnose
```

### Management Commands
```bash
# Update existing installation
python3 SuperClaude.py update

# Create backup before changes
python3 SuperClaude.py backup --create

# Remove SuperClaude installation
python3 SuperClaude.py uninstall

# View all available management options
python3 SuperClaude.py --help
```

### Development Setup
```bash
# Developer installation with all components
python3 SuperClaude.py install --profile developer

# Install in development mode (symlinks instead of copies)
python3 SuperClaude.py install --profile developer --dev-mode
```

## Architecture Overview

SuperClaude follows a modular architecture designed for extensibility and maintainability:

### Core Framework Structure
```
SuperClaude/
├── SuperClaude.py              # Main CLI entry point
├── SuperClaude/
│   ├── Core/                   # Framework behavior documentation
│   │   ├── CLAUDE.md          # Entry point referencing all components
│   │   ├── COMMANDS.md        # Command system architecture
│   │   ├── FLAGS.md           # Flag system and auto-activation
│   │   ├── PERSONAS.md        # 11 domain-specific AI personalities
│   │   ├── PRINCIPLES.md      # Development principles and philosophy
│   │   ├── RULES.md           # Operational rules and guidelines
│   │   ├── MCP.md             # MCP server integration patterns
│   │   ├── MODES.md           # Task management and efficiency modes
│   │   └── ORCHESTRATOR.md    # Intelligent routing system
│   ├── Commands/              # 16 specialized slash commands
│   └── Hooks/                 # Event system (placeholder for v4)
├── setup/                     # Installation and management system
│   ├── base/                  # Base classes and installer
│   ├── components/            # Component management
│   ├── core/                  # Configuration and validation
│   ├── operations/            # Install, update, uninstall operations
│   └── utils/                 # Logging, UI, and utilities
├── config/                    # Configuration files
├── profiles/                  # Installation profiles
└── Docs/                      # User documentation
```

### Key Architectural Components

#### 1. Command System
- **16 specialized commands** for development workflows
- **Wave-enabled commands** for complex multi-stage operations
- **Auto-persona activation** based on context analysis
- **MCP server integration** for enhanced capabilities

#### 2. Persona System
- **11 domain-specific personas** (architect, frontend, backend, security, etc.)
- **Auto-activation** based on context, keywords, and complexity
- **Cross-persona collaboration** for complex tasks
- **Priority hierarchies** for conflict resolution

#### 3. MCP Server Integration
- **Context7**: Official documentation and library patterns
- **Sequential**: Complex multi-step analysis and reasoning
- **Magic**: Modern UI component generation
- **Playwright**: Browser automation and E2E testing

#### 4. Orchestration Engine
- **Intelligent routing** based on complexity and domain detection
- **Wave orchestration** for multi-stage compound operations
- **Sub-agent delegation** for parallel processing
- **Resource management** with adaptive optimization

#### 5. Installation System
- **Component-based architecture** with dependency resolution
- **Profile-based installation** (quick, minimal, developer)
- **Backup and restore** capabilities
- **System validation** and diagnostics

## Key Features and Capabilities

### Smart Command Routing
The framework automatically detects operation complexity, domain, and requirements to route requests to appropriate tools and personas:

- **Complexity scoring** (0.0-1.0) determines tool selection
- **Domain identification** activates relevant personas
- **Wave orchestration** for operations requiring multiple stages
- **Auto-delegation** to sub-agents for large-scale operations

### Token Efficiency
- **Adaptive compression** with 30-50% token reduction
- **Symbol system** for structured output
- **Context-aware abbreviations** based on domain and familiarity
- **Progressive compression levels** from minimal to emergency

### Quality Assurance
- **8-step validation cycle** with integrated quality gates
- **Evidence-based decision making** with measurable outcomes
- **Automated testing integration** with coverage requirements
- **Security validation** with OWASP compliance

## Development Workflow

### Working with SuperClaude Code
1. **Use existing patterns**: Follow the established component architecture
2. **Respect dependencies**: Components have clear dependency relationships
3. **Validate early**: Use the built-in validation system for configuration
4. **Test incrementally**: Each component can be tested independently
5. **Document thoroughly**: Update relevant Core/*.md files for behavior changes

### Adding New Components
1. Extend the base Component class in `setup/base/component.py`
2. Register the component in `setup/components/`
3. Add metadata and dependencies to configuration files
4. Update installation profiles as needed
5. Test with `--dry-run` before committing

### Code Quality Standards
- **Python 3.8+** compatibility maintained
- **Type hints** used throughout new code
- **Error handling** with graceful degradation
- **Logging** with structured output
- **Security** validation for all file operations

## Requirements and Dependencies

### System Requirements
- **Python 3.8+** (required)
- **Claude CLI** (required) - SuperClaude enhances Claude Code
- **Node.js 16+** (optional) - for MCP server integration
- **Git** (optional) - for development workflows

### Python Dependencies
The framework uses only standard library modules to minimize dependencies:
- `pathlib` for cross-platform path handling
- `argparse` for CLI interface
- `subprocess` for external tool integration
- `json` for configuration management

### External Tool Integration
- **Claude CLI** for MCP server management
- **npm** for MCP server installation
- **git** for version control workflows

## Configuration and Customization

### Installation Profiles
- **minimal**: Core framework only (~20MB)
- **quick**: Core + commands (~50MB) - recommended
- **developer**: Everything including MCP servers (~100MB)

### Configuration Files
- `config/requirements.json`: System requirements and installation commands
- `config/features.json`: Feature flags and capabilities
- `profiles/*.json`: Installation profile definitions
- `~/.claude/settings.json`: User configuration (created at install)

### Customization Points
- **Persona priorities**: Can be adjusted in PERSONAS.md
- **Command behaviors**: Individual command definitions in Commands/
- **MCP server selection**: Configurable in MCP.md
- **Quality gates**: Validation thresholds in ORCHESTRATOR.md

## Security Considerations

### File System Security
- **Absolute paths only** to prevent path traversal
- **Permission validation** before file operations
- **Backup creation** before destructive operations
- **Dry-run mode** for safe testing

### External Tool Safety
- **Command validation** before subprocess execution
- **Version checking** for external dependencies
- **Graceful degradation** when tools unavailable
- **Error containment** to prevent cascading failures

## Troubleshooting Common Issues

### Installation Problems
- Run `python3 SuperClaude.py install --diagnose` for system analysis
- Check Python version compatibility (`python3 --version`)
- Verify Claude CLI installation (`claude --version`)
- Use `--dry-run` to preview changes before installation

### Runtime Issues
- Check `~/.claude/settings.json` for configuration problems
- Review logs in the installation directory
- Test with minimal installation first
- Use `--verbose` flag for detailed output

### MCP Server Problems
- Verify Node.js installation (`node --version`)
- Check npm availability (`npm --version`)
- Install without MCP servers first, then add them separately
- Review MCP server logs for connection issues

This framework is designed to be self-documenting and self-maintaining, with extensive validation and error handling to ensure reliable operation across different environments.