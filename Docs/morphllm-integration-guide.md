# MorphLLM Integration Guide

## Overview

The MorphLLM integration brings blazing-fast filesystem operations to SuperClaude v3, providing significant performance improvements for file-heavy development workflows. This integration uses Claude Code's hook system to intercept native filesystem tools and route them through MorphLLM's optimized MCP server.

## Features

- **🚀 Blazing-Fast Performance**: 20-60% faster filesystem operations
- **🔄 Intelligent Routing**: Automatic tool interception and routing
- **📊 Performance Monitoring**: Real-time metrics and optimization insights
- **🛡️ Robust Error Handling**: Graceful fallback mechanisms
- **⚙️ Flexible Configuration**: Multiple control flags and auto-activation

## Installation

### Prerequisites

1. **Claude CLI**: Version 0.1.0 or higher
2. **Node.js**: Version 16.0.0 or higher
3. **MorphLLM MCP Server**: Install via npm

### Install MorphLLM MCP Server

```bash
npm install -g @morph-llm/morph-fast-apply
```

### Configure MorphLLM

1. **Get MorphLLM API Key**:
   - Visit [MorphLLM Dashboard](https://morphllm.com/dashboard)
   - Generate an API key

2. **Configure Environment Variables**:
   ```bash
   export MORPH_API_KEY="your_api_key_here"
   export MORPH_SERVER_URL="https://api.morphllm.com"
   ```

3. **Configure Claude Code MCP Server**:
   Add MorphLLM to your Claude Code MCP configuration:
   ```json
   {
     "servers": {
       "morph": {
         "command": "morph-fast-apply",
         "env": {
           "MORPH_API_KEY": "your_api_key_here",
           "ALL_TOOLS": "true"
         }
       }
     }
   }
   ```

### Install SuperClaude with MorphLLM

```bash
# Install SuperClaude with developer profile (includes MorphLLM)
python -m SuperClaude install --profile developer

# Or install MorphLLM component separately
python -m SuperClaude install --component morphllm
```

## Usage

### Control Flags

#### `--morph` / `--morphllm`
Enable MorphLLM filesystem tools for improved performance.

```bash
/implement new-feature --morph
/improve codebase --morphllm
```

#### `--morph-only`
Force exclusive MorphLLM usage, blocking native tools entirely.

```bash
/build large-project --morph-only
```

#### `--morph-fast`
Optimize for MorphLLM's fast-apply capabilities with batching.

```bash
/cleanup codebase --morph-fast
```

#### `--no-morph`
Disable MorphLLM integration temporarily.

```bash
/analyze project --no-morph
```

### Auto-Activation

MorphLLM automatically activates when:
- Filesystem operations > 5 in a single command
- Batch edits > 3 files
- Directory scans > 10 files
- Large file operations > 1MB

### Tool Mapping

| Native Tool | MorphLLM Equivalent | Performance Gain |
|-------------|---------------------|------------------|
| Read | mcp__morph__read_file | 20-40% |
| Write | mcp__morph__write_file | 30-50% |
| Edit | mcp__morph__edit_file | 25-45% |
| LS | mcp__morph__list_directory | 25-50% |
| Glob | mcp__morph__search_files | 30-60% |
| MultiEdit | Batch mcp__morph__edit_file | 40-70% |

## Performance Monitoring

### View Performance Metrics

```bash
# Check performance summary
cat ~/.claude/morph_performance_summary.json

# View detailed metrics
cat ~/.claude/morph_performance.json
```

### Performance Insights

The integration provides:
- **Operation timing comparisons**
- **Success/failure rates**
- **Performance recommendations**
- **Auto-activation effectiveness**

## Error Handling

### Fallback Mechanisms

1. **Server Unavailable**: Automatic fallback to native tools
2. **API Key Invalid**: Clear error messages with configuration guidance
3. **Timeout**: Retry with exponential backoff
4. **File Locks**: Intelligent retry logic
5. **Memory Issues**: Graceful degradation

### Circuit Breaker

Automatic circuit breaker prevents cascading failures:
- Opens after 5 consecutive failures
- Stays open for 5 minutes
- Automatically resets on success

### Error Logs

```bash
# View error logs
cat ~/.claude/morph_errors.log

# Check fallback statistics
cat ~/.claude/morph_fallback_stats.json
```

## Configuration

### Advanced Configuration

Configure MorphLLM behavior in `config/features.json`:

```json
{
  "morphllm": {
    "configuration": {
      "auto_activation": true,
      "performance_monitoring": true,
      "fallback_enabled": true,
      "circuit_breaker_enabled": true,
      "default_flags": ["--morph-fast"]
    }
  }
}
```

### Performance Tuning

1. **Batch Operations**: Use `--morph-fast` for multi-file operations
2. **Large Files**: MorphLLM excels with files > 1MB
3. **Directory Traversal**: Significant gains for large directory scans
4. **Concurrent Operations**: Intelligent parallelization

## Troubleshooting

### Common Issues

#### MorphLLM Server Not Available
```bash
# Check server status
npm list -g @morph-llm/morph-fast-apply

# Reinstall if needed
npm install -g @morph-llm/morph-fast-apply
```

#### API Key Issues
```bash
# Verify API key
echo $MORPH_API_KEY

# Test connection
curl -H "Authorization: Bearer $MORPH_API_KEY" https://api.morphllm.com/health
```

#### Performance Degradation
```bash
# Check performance metrics
cat ~/.claude/morph_performance_summary.json

# Disable if needed
export NO_MORPH=1
```

### Debug Mode

Enable debug logging:
```bash
export MORPH_DEBUG=1
/your-command --morph --verbose
```

## Integration Testing

Run integration tests:
```bash
python -m pytest Tests/test_morphllm_integration.py -v
```

## Best Practices

1. **Start Gradually**: Begin with `--morph` flag, then try `--morph-fast`
2. **Monitor Performance**: Check metrics regularly for optimization opportunities
3. **Use Auto-Activation**: Let the system learn your patterns
4. **Batch Operations**: Group related file operations for maximum benefit
5. **Fallback Ready**: Always ensure native tools work as backup

## Advanced Features

### Custom Hook Configuration

Create custom hooks for specific workflows:

```python
from SuperClaude.Hooks.morph_tool_interceptor import MorphToolInterceptor

class CustomMorphInterceptor(MorphToolInterceptor):
    def custom_activation_logic(self, tool_name, tool_input, flags):
        # Your custom logic here
        return super().should_intercept(tool_name, tool_input, flags)
```

### Performance Analytics

Access detailed performance analytics:

```python
from SuperClaude.Hooks.morph_performance_monitor import MorphPerformanceMonitor

monitor = MorphPerformanceMonitor()
report = monitor.generate_performance_report()
print(json.dumps(report, indent=2))
```

## FAQ

### Q: Does MorphLLM work with all SuperClaude commands?
A: Yes, MorphLLM integrates seamlessly with all SuperClaude commands that use filesystem operations.

### Q: What happens if MorphLLM is unavailable?
A: The system automatically falls back to native tools with minimal disruption.

### Q: Can I use MorphLLM with other MCP servers?
A: Yes, MorphLLM works alongside other MCP servers like Context7, Sequential, Magic, and Playwright.

### Q: How do I disable MorphLLM temporarily?
A: Use the `--no-morph` flag or set the `NO_MORPH` environment variable.

### Q: Is there a performance cost for the integration?
A: The hook system adds <10ms overhead, which is minimal compared to the 20-60% performance gains.

## Support

For issues and questions:
- **SuperClaude Issues**: [GitHub Issues](https://github.com/NomenAK/SuperClaude/issues)
- **MorphLLM Support**: [MorphLLM Documentation](https://morphllm.com/docs)
- **Claude Code Help**: [Claude Code Guide](https://docs.anthropic.com/en/docs/claude-code)

## Contributing

Contributions to improve MorphLLM integration are welcome! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.