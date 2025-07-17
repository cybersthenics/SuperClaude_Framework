# MCP.md - SuperClaude MCP Server Reference

MCP (Model Context Protocol) server integration and orchestration system for Claude Code SuperClaude framework.

## Server Selection Algorithm

**Priority Matrix**:
1. Task-Server Affinity: Match tasks to optimal servers based on capability matrix
2. Performance Metrics: Server response time, success rate, resource utilization
3. Context Awareness: Current persona, command depth, session state
4. Load Distribution: Prevent server overload through intelligent queuing
5. Fallback Readiness: Maintain backup servers for critical operations

**Selection Process**: Task Analysis → Server Capability Match → Performance Check → Load Assessment → Final Selection

## Context7 Integration (Documentation & Research)

**Purpose**: Official library documentation, code examples, best practices, localization standards

**Activation Patterns**: 
- Automatic: External library imports detected, framework-specific questions, scribe persona active
- Manual: `--c7`, `--context7` flags
- Smart: Commands detect need for official documentation patterns

**Workflow Process**:
1. Library Detection: Scan imports, dependencies, package.json for library references
2. ID Resolution: Use `resolve-library-id` to find Context7-compatible library ID
3. Documentation Retrieval: Call `get-library-docs` with specific topic focus
4. Pattern Extraction: Extract relevant code patterns and implementation examples
5. Implementation: Apply patterns with proper attribution and version compatibility
6. Validation: Verify implementation against official documentation
7. Caching: Store successful patterns for session reuse

**Integration Commands**: `/build`, `/analyze`, `/improve`, `/design`, `/document`, `/explain`, `/git`

**Error Recovery**:
- Library not found → WebSearch for alternatives → Manual implementation
- Documentation timeout → Use cached knowledge → Note limitations
- Invalid library ID → Retry with broader search terms → Fallback to WebSearch
- Version mismatch → Find compatible version → Suggest upgrade path
- Server unavailable → Activate backup Context7 instances → Graceful degradation

## Sequential Integration (Complex Analysis & Thinking)

**Purpose**: Multi-step problem solving, architectural analysis, systematic debugging

**Activation Patterns**:
- Automatic: Complex debugging scenarios, system design questions, `--think` flags
- Manual: `--seq`, `--sequential` flags
- Smart: Multi-step problems requiring systematic analysis

**Workflow Process**:
1. Problem Decomposition: Break complex problems into analyzable components
2. Server Coordination: Coordinate with Context7 for documentation, Magic for UI insights, Playwright for testing
3. Systematic Analysis: Apply structured thinking to each component
4. Relationship Mapping: Identify dependencies, interactions, and feedback loops
5. Hypothesis Generation: Create testable hypotheses for each component
6. Evidence Gathering: Collect supporting evidence through tool usage
7. Multi-Server Synthesis: Combine findings from multiple servers
8. Recommendation Generation: Provide actionable next steps with priority ordering
9. Validation: Check reasoning for logical consistency

**Integration with Thinking Modes**:
- `--think` (4K): Module-level analysis with context awareness
- `--think-hard` (10K): System-wide analysis with architectural focus
- `--ultrathink` (32K): Critical system analysis with comprehensive coverage

**Use Cases**:
- Root cause analysis for complex bugs
- Performance bottleneck identification
- Architecture review and improvement planning
- Security threat modeling and vulnerability analysis
- Code quality assessment with improvement roadmaps
- Scribe Persona: Structured documentation workflows, multilingual content organization
- Loop Command: Iterative improvement analysis, progressive refinement planning

## Magic Integration (UI Components & Design)

**Purpose**: Modern UI component generation, design system integration, responsive design

**Activation Patterns**:
- Automatic: UI component requests, design system queries
- Manual: `--magic` flag
- Smart: Frontend persona active, component-related queries

**Workflow Process**:
1. Requirement Parsing: Extract component specifications and design system requirements
2. Pattern Search: Find similar components and design patterns from 21st.dev database
3. Framework Detection: Identify target framework (React, Vue, Angular) and version
4. Server Coordination: Sync with Context7 for framework patterns, Sequential for complex logic
5. Code Generation: Create component with modern best practices and framework conventions
6. Design System Integration: Apply existing themes, styles, tokens, and design patterns
7. Accessibility Compliance: Ensure WCAG compliance, semantic markup, and keyboard navigation
8. Responsive Design: Implement mobile-first responsive patterns
9. Optimization: Apply performance optimizations and code splitting
10. Quality Assurance: Validate against design system and accessibility standards

**Component Categories**:
- Interactive: Buttons, forms, modals, dropdowns, navigation, search components
- Layout: Grids, containers, cards, panels, sidebars, headers, footers
- Display: Typography, images, icons, charts, tables, lists, media
- Feedback: Alerts, notifications, progress indicators, tooltips, loading states
- Input: Text fields, selectors, date pickers, file uploads, rich text editors
- Navigation: Menus, breadcrumbs, pagination, tabs, steppers
- Data: Tables, grids, lists, cards, infinite scroll, virtualization

**Framework Support**:
- React: Hooks, TypeScript, modern patterns, Context API, state management
- Vue: Composition API, TypeScript, reactive patterns, Pinia integration
- Angular: Component architecture, TypeScript, reactive forms, services
- Vanilla: Web Components, modern JavaScript, CSS custom properties

## Playwright Integration (Browser Automation & Testing)

**Purpose**: Cross-browser E2E testing, performance monitoring, automation, visual testing

**Activation Patterns**:
- Automatic: Testing workflows, performance monitoring requests, E2E test generation
- Manual: `--play`, `--playwright` flags
- Smart: QA persona active, browser interaction needed

**Workflow Process**:
1. Browser Connection: Connect to Chrome, Firefox, Safari, or Edge instances
2. Environment Setup: Configure viewport, user agent, network conditions, device emulation
3. Navigation: Navigate to target URLs with proper waiting and error handling
4. Server Coordination: Sync with Sequential for test planning, Magic for UI validation
5. Interaction: Perform user actions (clicks, form fills, navigation) across browsers
6. Data Collection: Capture screenshots, videos, performance metrics, console logs
7. Validation: Verify expected behaviors, visual states, and performance thresholds
8. Multi-Server Analysis: Coordinate with other servers for comprehensive test analysis
9. Reporting: Generate test reports with evidence, metrics, and actionable insights
10. Cleanup: Properly close browser connections and clean up resources

**Capabilities**:
- Multi-Browser Support: Chrome, Firefox, Safari, Edge with consistent API
- Visual Testing: Screenshot capture, visual regression detection, responsive testing
- Performance Metrics: Load times, rendering performance, resource usage, Core Web Vitals
- User Simulation: Real user interaction patterns, accessibility testing, form workflows
- Data Extraction: DOM content, API responses, console logs, network monitoring
- Mobile Testing: Device emulation, touch gestures, mobile-specific validation
- Parallel Execution: Run tests across multiple browsers simultaneously

**Integration Patterns**:
- Test Generation: Create E2E tests based on user workflows and critical paths
- Performance Monitoring: Continuous performance measurement with threshold alerting
- Visual Validation: Screenshot-based testing and regression detection
- Cross-Browser Testing: Validate functionality across all major browsers
- User Experience Testing: Accessibility validation, usability testing, conversion optimization

## MorphLLM Integration (Fast Filesystem Operations)

**Purpose**: Blazing-fast file editing and filesystem operations, optimized for rapid code transformations

**Activation Patterns**:
- Automatic: Filesystem-heavy operations, batch file edits, large directory scans
- Manual: `--morph`, `--morphllm` flags
- Smart: Multiple file operations, edit chains, directory traversal patterns
- Exclusive: `--morph-only` for maximum performance mode

**Workflow Process**:
1. Server Validation: Verify MorphLLM MCP server availability and API key authentication
2. Tool Mapping: Map native Claude Code tools to MorphLLM equivalents
3. Operation Batching: Group related filesystem operations for optimal performance
4. Fast Execution: Execute operations using MorphLLM's optimized filesystem tools
5. Context Preservation: Maintain operation context across tool switches
6. Performance Monitoring: Track execution times and compare against native tools
7. Error Handling: Implement graceful fallback to native tools on failures
8. Result Validation: Verify operation success and data integrity
9. Cache Management: Optimize repeated operations through intelligent caching
10. Cleanup: Ensure proper resource cleanup after operations

**Tool Mapping**:
- `Read` → `mcp__morph__read_file`: Fast file reading with optimized encoding
- `Write` → `mcp__morph__write_file`: High-speed file writing with atomic operations
- `Edit` → `mcp__morph__edit_file`: Rapid code editing with fast-apply technology
- `LS` → `mcp__morph__list_directory`: Optimized directory listing with metadata
- `Glob` → `mcp__morph__search_files`: High-performance file pattern matching
- `MultiEdit` → Batch `mcp__morph__edit_file`: Coordinated multi-file editing

**Performance Characteristics**:
- File Operations: 20-40% faster than native tools for most operations
- Batch Edits: 30-60% improvement for multi-file operations
- Directory Scans: 25-50% faster directory traversal and listing
- Large Files: Optimized handling of files >1MB with streaming support
- Concurrent Operations: Intelligent parallelization for independent file operations

**Integration Commands**: `/implement`, `/improve`, `/build`, `/analyze`, `/cleanup`, `/git`

**Error Recovery**:
- Server unavailable → Graceful fallback to native tools → Log performance impact
- API key invalid → Display clear error message → Provide configuration guidance
- Operation timeout → Retry with native tools → Monitor for systematic issues
- File lock conflicts → Implement retry logic → Fallback to native tools
- Memory constraints → Optimize batch sizes → Use streaming for large operations

**Auto-Activation Triggers**:
- Filesystem operations >5 in single command execution
- Batch edits >3 files in coordinated operation
- Directory scans >10 files or >2 directory levels
- Large file operations >1MB total data processed
- Multi-file refactoring or code transformation tasks

## MCP Server Use Cases by Command Category

**Development Commands**:
- Context7: Framework patterns, library documentation
- Magic: UI component generation
- Sequential: Complex setup workflows
- MorphLLM: Fast filesystem operations, batch code editing

**Analysis Commands**:
- Context7: Best practices, patterns
- Sequential: Deep analysis, systematic review
- Playwright: Issue reproduction, visual testing
- MorphLLM: Fast codebase analysis, multi-file inspection

**Quality Commands**:
- Context7: Security patterns, improvement patterns
- Sequential: Code analysis, cleanup strategies
- MorphLLM: Fast refactoring, batch code improvements

**Testing Commands**:
- Sequential: Test strategy development
- Playwright: E2E test execution, visual regression

**Documentation Commands**:
- Context7: Documentation patterns, style guides, localization standards
- Sequential: Content analysis, structured writing, multilingual documentation workflows
- Scribe Persona: Professional writing with cultural adaptation and language-specific conventions

**Planning Commands**:
- Context7: Benchmarks and patterns
- Sequential: Complex planning and estimation

**Deployment Commands**:
- Sequential: Deployment planning
- Playwright: Deployment validation

**Meta Commands**:
- Sequential: Search intelligence, task orchestration, iterative improvement analysis
- All MCP: Comprehensive analysis and orchestration
- Loop Command: Iterative workflows with Sequential (primary) and Context7 (patterns)

## Server Orchestration Patterns

**Multi-Server Coordination**:
- Task Distribution: Intelligent task splitting across servers based on capabilities
- Dependency Management: Handle inter-server dependencies and data flow
- Synchronization: Coordinate server responses for unified solutions
- Load Balancing: Distribute workload based on server performance and capacity
- Failover Management: Automatic failover to backup servers during outages

**Caching Strategies**:
- Context7 Cache: Documentation lookups with version-aware caching
- Sequential Cache: Analysis results with pattern matching
- Magic Cache: Component patterns with design system versioning
- Playwright Cache: Test results and screenshots with environment-specific caching
- MorphLLM Cache: Filesystem operation results with intelligent file monitoring
- Cross-Server Cache: Shared cache for multi-server operations
- Loop Optimization: Cache iterative analysis results, reuse improvement patterns

**Error Handling and Recovery**:
- Context7 unavailable → WebSearch for documentation → Manual implementation
- Sequential timeout → Use native Claude Code analysis → Note limitations
- Magic failure → Generate basic component → Suggest manual enhancement
- Playwright connection lost → Suggest manual testing → Provide test cases
- MorphLLM unavailable → Fallback to native filesystem tools → Log performance impact

**Recovery Strategies**:
- Exponential Backoff: Automatic retry with exponential backoff and jitter
- Circuit Breaker: Prevent cascading failures with circuit breaker pattern
- Graceful Degradation: Maintain core functionality when servers are unavailable
- Alternative Routing: Route requests to backup servers automatically
- Partial Result Handling: Process and utilize partial results from failed operations

**Integration Patterns**:
- Minimal Start: Start with minimal MCP usage and expand based on needs
- Progressive Enhancement: Progressively enhance with additional servers
- Result Combination: Combine MCP results for comprehensive solutions
- Graceful Fallback: Fallback gracefully when servers unavailable
- Loop Integration: Sequential for iterative analysis, Context7 for improvement patterns
- Dependency Orchestration: Manage inter-server dependencies and data flow

