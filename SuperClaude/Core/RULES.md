# RULES.md - SuperClaude Framework Actionable Rules

Simple actionable rules for Claude Code SuperClaude framework operation.

## Core Operational Rules

### Task Management Rules
- TodoRead() → TodoWrite(3+ tasks) → Execute → Track progress
- Use batch tool calls when possible, sequential only when dependencies exist
- Always validate before execution, verify after completion
- Run lint/typecheck before marking tasks complete
- Use /spawn and /task for complex multi-session workflows
- Maintain ≥90% context retention across operations

### File Operation Security
- Always use Read tool before Write or Edit operations
- Use absolute paths only, prevent path traversal attacks
- Prefer batch operations and transaction-like behavior
- Never commit automatically unless explicitly requested

### Framework Compliance
- Check package.json/pyproject.toml before using libraries
- Follow existing project patterns and conventions
- Use project's existing import styles and organization
- Respect framework lifecycles and best practices

### Systematic Codebase Changes
- **MANDATORY**: Complete project-wide discovery before any changes
- Search ALL file types for ALL variations of target terms
- Document all references with context and impact assessment
- Plan update sequence based on dependencies and relationships
- Execute changes in coordinated manner following plan
- Verify completion with comprehensive post-change search
- Validate related functionality remains working
- Use Task tool for comprehensive searches when scope uncertain

### MorphLLM Integration Rules
- **MANDATORY**: Validate MorphLLM MCP server availability before routing filesystem operations
- Implement graceful fallback to native tools on MorphLLM server failures
- Batch filesystem operations when using MorphLLM for optimal performance
- Monitor performance metrics to ensure MorphLLM provides measurable speed benefits
- Use --morph-only flag cautiously - ensure proper error handling and fallback mechanisms
- Preserve operation context when switching between MorphLLM and native tools
- Log performance comparisons between MorphLLM and native tools for optimization
- Validate file integrity after MorphLLM operations before marking tasks complete
- Never block user operations due to MorphLLM unavailability - always provide fallback
- Maintain tool mapping accuracy between native and MorphLLM equivalents

## Quick Reference

### Do
✅ Read before Write/Edit/Update
✅ Use absolute paths
✅ Batch tool calls
✅ Validate before execution
✅ Check framework compatibility
✅ Auto-activate personas
✅ Preserve context across operations
✅ Use quality gates (see ORCHESTRATOR.md)
✅ Complete discovery before codebase changes
✅ Verify completion with evidence
✅ Validate MorphLLM server before routing
✅ Implement fallback for MorphLLM failures
✅ Monitor MorphLLM performance metrics

### Don't
❌ Skip Read operations
❌ Use relative paths
❌ Auto-commit without permission
❌ Ignore framework patterns
❌ Skip validation steps
❌ Mix user-facing content in config
❌ Override safety protocols
❌ Make reactive codebase changes
❌ Mark complete without verification
❌ Use --morph-only without fallback handling
❌ Route to MorphLLM without server validation
❌ Ignore MorphLLM performance degradation

### Auto-Triggers
- Wave mode: complexity ≥0.7 + multiple domains
- Personas: domain keywords + complexity assessment  
- MCP servers: task type + performance requirements
- MorphLLM: filesystem operations >5 OR batch edits >3 OR directory scans >10 files
- Quality gates: all operations apply 8-step validation