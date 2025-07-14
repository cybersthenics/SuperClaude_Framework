# SuperClaude Builder

**The Semantic Code Generation Engine** - Advanced code generation and modification server with semantic understanding for the SuperClaude MCP ecosystem.

## Overview

SuperClaude Builder is a specialized MCP server that provides intelligent code generation, semantic editing, refactoring, and pattern application capabilities. It integrates deeply with the SuperClaude Intelligence server for semantic understanding and delivers enterprise-grade code modification tools.

## Key Features

### 🔧 Semantic Code Editing
- **Symbol Manipulation**: Intelligent symbol renaming with conflict detection
- **Code Extraction**: Extract methods and functions with dependency analysis
- **Refactoring Engine**: Advanced refactoring with semantic preservation
- **Auto-Import**: Intelligent import management and resolution

### 🏗️ Code Generation
- **Intelligent Generation**: Context-aware code generation with semantic understanding
- **UI Components**: React/Vue/Angular component generation with design system integration
- **Pattern Application**: Apply design patterns with framework-specific implementations
- **Interface Implementation**: Automatic interface and abstract class implementation

### 🎯 Framework Integration
- **Multi-Framework**: React, Vue, Angular, Node.js, and framework-agnostic support
- **Build Operations**: Intelligent build orchestration and optimization
- **Project Cleanup**: Automated cleanup with dependency tracking
- **Magic Integration**: Seamless UI component generation via Magic MCP server

### 🧠 Semantic Understanding
- **Intelligence Integration**: Deep integration with SuperClaude Intelligence server
- **Type Safety**: Preserve type safety and semantic correctness during modifications
- **Context Awareness**: Understanding of codebase structure and relationships
- **Quality Validation**: Integration with SuperClaude Quality server for validation

## Architecture

### Core Components

```
SuperClaude Builder Server
├── SymbolEditor           # Symbol manipulation and renaming
├── RefactoringEngine      # Advanced refactoring operations
├── CodeGenerator          # Intelligent code generation
├── PatternApplicator      # Design pattern application
├── FrameworkIntegrator    # Framework-specific operations
├── BuildOrchestrator      # Build and cleanup coordination
└── Integration Clients    # External service connections
```

### Integration Points

- **SuperClaude Intelligence**: Semantic analysis and code understanding
- **SuperClaude Quality**: Code validation and quality gates
- **Magic MCP Server**: UI component generation and design systems
- **Context7 MCP Server**: Framework patterns and best practices

## Available Tools

### `rename_symbol`
Intelligently rename symbols across the codebase with conflict detection.

```typescript
{
  uri: string,                    // File URI containing the symbol
  position: {
    line: number,                 // Line number (0-based)
    character: number             // Character position (0-based)
  },
  newName: string,               // New name for the symbol
  options?: {
    forceRename?: boolean,        // Force rename even if conflicts exist
    includeComments?: boolean,    // Include symbol in comments
    previewMode?: boolean         // Generate preview without applying changes
  }
}
```

### `extract_method`
Extract code selections into new methods with intelligent parameter detection.

```typescript
{
  uri: string,                    // File URI containing the code
  selection: {
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
  },
  methodName: string,            // Name for the extracted method
  options?: {
    makeStatic?: boolean,         // Create static method if possible
    preserveComments?: boolean,   // Include comments in extraction
    generateTests?: boolean       // Generate unit tests for extracted method
  }
}
```

### `extract_function`
Extract code into standalone functions with dependency analysis.

```typescript
{
  uri: string,                    // File URI containing the code
  selection: {
    startLine: number,
    startCharacter: number,
    endLine: number,
    endCharacter: number
  },
  functionName: string,          // Name for the extracted function
  options?: {
    exportFunction?: boolean,     // Export the function
    addDocumentation?: boolean,   // Generate JSDoc/documentation
    optimizeImports?: boolean     // Optimize import statements
  }
}
```

### `generate_code`
Generate code based on specifications and context.

```typescript
{
  context: {
    uri: string,                  // Target file URI
    position: {
      line: number,
      character: number
    },
    codeType: "function" | "class" | "component" | "module" | "test",
    language: string              // Programming language
  },
  specifications: {
    name: string,                 // Code element name
    description?: string,         // Functional description
    parameters?: Array<{          // Function/method parameters
      name: string,
      type: string,
      optional?: boolean
    }>,
    returnType?: string,          // Return type specification
    framework?: string            // Target framework (React, Vue, etc.)
  },
  options?: {
    includeDocumentation?: boolean,
    generateTests?: boolean,
    validateSyntax?: boolean
  }
}
```

### `generate_ui_component`
Generate UI components with design system integration.

```typescript
{
  component: {
    name: string,                 // Component name
    type: "functional" | "class", // Component type
    framework: "react" | "vue" | "angular"
  },
  specifications: {
    props?: Array<{               // Component properties
      name: string,
      type: string,
      required?: boolean,
      defaultValue?: any
    }>,
    styling: "css" | "styled-components" | "emotion" | "tailwind",
    accessibility?: boolean,      // Include accessibility features
    responsive?: boolean          // Include responsive design
  },
  designSystem?: {
    theme: string,                // Design system theme
    components: string[]          // Base components to extend
  }
}
```

### `apply_design_pattern`
Apply design patterns to existing code.

```typescript
{
  pattern: {
    type: "singleton" | "factory" | "observer" | "strategy" | "decorator" | "adapter",
    targetUri: string,            // File to apply pattern to
    scope: "class" | "module" | "function"
  },
  configuration: {
    preserveExisting?: boolean,   // Preserve existing functionality
    generateInterfaces?: boolean, // Generate necessary interfaces
    addDocumentation?: boolean   // Include pattern documentation
  }
}
```

### `build_project`
Orchestrate build operations with intelligent optimization.

```typescript
{
  project: {
    rootPath: string,             // Project root directory
    buildTool: "npm" | "yarn" | "webpack" | "vite" | "rollup" | "esbuild"
  },
  configuration: {
    target: "development" | "production" | "test",
    optimize?: boolean,           // Enable optimizations
    bundleAnalysis?: boolean,     // Generate bundle analysis
    typeCheck?: boolean           // Enable type checking
  },
  options?: {
    parallel?: boolean,           // Use parallel processing
    cache?: boolean,              // Enable build caching
    watch?: boolean               // Enable watch mode
  }
}
```

### `cleanup_project`
Perform intelligent project cleanup and optimization.

```typescript
{
  scope: {
    path: string,                 // Target path for cleanup
    type: "unused-imports" | "dead-code" | "dependencies" | "comprehensive"
  },
  options: {
    dryRun?: boolean,            // Preview changes without applying
    preserveComments?: boolean,   // Keep comments during cleanup
    updateDependencies?: boolean, // Update package dependencies
    generateReport?: boolean      // Generate cleanup report
  }
}
```

### `auto_import`
Automatically manage and optimize import statements.

```typescript
{
  uri: string,                    // Target file URI
  operation: "organize" | "add" | "remove" | "optimize",
  symbol?: string,               // Specific symbol to import (for 'add' operation)
  options?: {
    sortImports?: boolean,        // Sort import statements
    removeUnused?: boolean,       // Remove unused imports
    groupImports?: boolean,       // Group imports by type
    addMissingImports?: boolean   // Add missing imports automatically
  }
}
```

### `implement_interface`
Automatically implement interfaces and abstract classes.

```typescript
{
  target: {
    uri: string,                  // File containing the class
    className: string,            // Class to implement interface for
    interfaceName: string         // Interface/abstract class to implement
  },
  options: {
    generateStubs?: boolean,      // Generate method stubs
    addDocumentation?: boolean,   // Include JSDoc/documentation
    throwNotImplemented?: boolean, // Throw NotImplementedError in stubs
    preserveExisting?: boolean    // Preserve existing method implementations
  }
}
```

## Performance Targets

- **Symbol Operations**: <200ms for rename/extract operations
- **Code Generation**: <500ms for typical code generation
- **Pattern Application**: <300ms for design pattern application
- **Build Operations**: Framework-dependent, optimized for parallel execution
- **Type Safety Preservation**: >95% semantic correctness maintained
- **Syntactic Correctness**: 100% valid syntax generation

## Quality Standards

- **Semantic Preservation**: >98% semantic correctness during refactoring
- **Type Safety**: >95% type safety preservation in TypeScript projects
- **Syntactic Correctness**: 100% syntactically valid code generation
- **Framework Compliance**: 100% compliance with target framework patterns

## Configuration

The server supports comprehensive configuration through environment variables:

```typescript
{
  codeGeneration: {
    enableSemanticAnalysis: true,
    maxGenerationSize: 50000,      // Maximum generated code size
    validateSyntax: true,
    enableTypeChecking: true
  },
  refactoring: {
    enableConflictDetection: true,
    preserveComments: true,
    enablePreviewMode: true
  },
  integration: {
    intelligenceServer: "superclaude-intelligence",
    qualityServer: "superclaude-quality",
    magicServer: "magic",
    context7Server: "context7"
  },
  performance: {
    enableCaching: true,
    maxConcurrentOperations: 5,
    cacheTTL: 300
  }
}
```

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5.0+
- npm or yarn

### Setup
```bash
cd MCP_Servers/superclaude-builder
npm install
npm run build
npm run dev
```

### Testing
```bash
npm test
npm run test:coverage
```

### Building
```bash
npm run build
npm run lint
```

## Integration with SuperClaude

The SuperClaude Builder server integrates seamlessly with the SuperClaude ecosystem:

### Intelligence Integration
- **Semantic Analysis**: Deep code understanding for intelligent modifications
- **Symbol Resolution**: Accurate symbol and dependency tracking
- **Type Inference**: Intelligent type handling and preservation

### Quality Integration  
- **Validation Pipeline**: Automatic validation of generated/modified code
- **Security Scanning**: Security analysis of generated code
- **Performance Analysis**: Performance impact assessment

### Magic Integration
- **UI Generation**: Seamless UI component generation with modern patterns
- **Design Systems**: Integration with design system components
- **Accessibility**: Automatic accessibility feature integration

### External Dependencies
- **Context7**: Framework patterns and best practices lookup
- **Magic**: UI component generation and design system integration

## Security

- **Code Safety**: Secure code generation with vulnerability prevention
- **Input Validation**: Comprehensive validation of all tool inputs
- **Access Control**: Secure access to code modification operations
- **Audit Logging**: Comprehensive logging of all code modifications

## Monitoring & Observability

- **Performance Metrics**: Real-time performance monitoring of all operations
- **Code Quality Metrics**: Quality tracking for generated/modified code
- **Usage Analytics**: Code generation patterns and effectiveness tracking
- **Health Checks**: Comprehensive health monitoring and diagnostics

## Contributing

Please see the main SuperClaude contribution guidelines for information on contributing to this server.

## License

This project is part of the SuperClaude MCP ecosystem and follows the same licensing terms.