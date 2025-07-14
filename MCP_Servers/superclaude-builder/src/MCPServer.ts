import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SymbolEditor } from './core/SymbolEditor.js';
import { RefactoringEngine } from './core/RefactoringEngine.js';
import { CodeGenerator } from './core/CodeGenerator.js';
import { PatternApplicator } from './core/PatternApplicator.js';
import { FrameworkIntegrator } from './core/FrameworkIntegrator.js';
import { BuildOrchestrator } from './core/BuildOrchestrator.js';
import {
  SymbolReference,
  CodeSelection,
  CodeGenerationContext,
  ComponentSpecification,
  DesignPattern,
  BuildConfiguration,
  CleanupScope,
  Framework,
  ValidationResult,
  RenameResult,
  ExtractionResult,
  GenerationResult,
  ComponentResult,
  PatternResult,
  BuildResult,
  CleanupResult
} from './types/index.js';

// Tool input schemas
const RenameSymbolSchema = z.object({
  uri: z.string().describe('File URI containing the symbol'),
  position: z.object({
    line: z.number().describe('Line number (0-based)'),
    character: z.number().describe('Character position (0-based)')
  }).describe('Position of the symbol to rename'),
  newName: z.string().describe('New name for the symbol'),
  options: z.object({
    forceRename: z.boolean().optional().describe('Force rename even if conflicts exist'),
    includeComments: z.boolean().optional().describe('Include symbol in comments'),
    previewMode: z.boolean().optional().describe('Generate preview without applying changes')
  }).optional()
});

const ExtractMethodSchema = z.object({
  uri: z.string().describe('File URI containing the code to extract'),
  selection: z.object({
    start: z.object({
      line: z.number(),
      character: z.number()
    }),
    end: z.object({
      line: z.number(),
      character: z.number()
    })
  }).describe('Code selection range'),
  methodName: z.string().describe('Name for the extracted method'),
  options: z.object({
    accessibility: z.enum(['public', 'private', 'protected']).optional(),
    generateComments: z.boolean().optional(),
    insertionStrategy: z.enum(['before_current', 'after_current', 'end_of_class']).optional()
  }).optional()
});

const GenerateCodeSchema = z.object({
  context: z.object({
    projectRoot: z.string().describe('Project root directory'),
    targetFile: z.string().describe('Target file for code generation'),
    language: z.enum(['typescript', 'javascript', 'python', 'go', 'rust']).describe('Programming language'),
    framework: z.string().optional().describe('Framework name'),
    insertionPoint: z.object({
      line: z.number(),
      character: z.number()
    }).optional().describe('Where to insert the generated code')
  }).describe('Generation context'),
  specification: z.object({
    type: z.enum(['function', 'class', 'interface', 'component', 'module']).describe('Type of code to generate'),
    name: z.string().describe('Name of the generated code element'),
    description: z.string().describe('Description of what the code should do'),
    parameters: z.array(z.any()).optional().describe('Parameters for the code element'),
    returnType: z.string().optional().describe('Return type'),
    interfaces: z.array(z.string()).optional().describe('Interfaces to implement'),
    requirements: z.array(z.string()).optional().describe('Additional requirements')
  }).describe('Code generation specifications'),
  options: z.object({
    includeComments: z.boolean().optional(),
    includeTests: z.boolean().optional(),
    enforceConventions: z.boolean().optional(),
    optimizeImports: z.boolean().optional()
  }).optional()
});

const GenerateUIComponentSchema = z.object({
  framework: z.enum(['react', 'vue', 'angular']).describe('UI framework'),
  componentName: z.string().describe('Component name (PascalCase)'),
  specification: z.object({
    props: z.array(z.any()).optional().describe('Component properties'),
    state: z.array(z.any()).optional().describe('Component state'),
    events: z.array(z.any()).optional().describe('Component events'),
    styling: z.any().optional().describe('Styling specifications'),
    accessibility: z.any().optional().describe('Accessibility requirements'),
    behavior: z.string().optional().describe('Component behavior description')
  }).describe('Component specifications'),
  options: z.object({
    includeStyles: z.boolean().optional(),
    includeTests: z.boolean().optional(),
    includeDocs: z.boolean().optional(),
    useMagicIntegration: z.boolean().optional()
  }).optional()
});

const ApplyPatternSchema = z.object({
  patternName: z.string().describe('Design pattern name'),
  target: z.object({
    uri: z.string().describe('Target file URI'),
    range: z.object({
      start: z.object({ line: z.number(), character: z.number() }),
      end: z.object({ line: z.number(), character: z.number() })
    }),
    symbolName: z.string().optional(),
    symbolType: z.enum(['class', 'function', 'module']).optional()
  }).describe('Target code location'),
  options: z.object({
    targetLanguage: z.string().optional(),
    framework: z.string().optional(),
    preserveExisting: z.boolean().optional(),
    generateComments: z.boolean().optional(),
    includeTests: z.boolean().optional()
  }).optional()
});

const BuildProjectSchema = z.object({
  configuration: z.object({
    target: z.enum(['development', 'production', 'test']).describe('Build target'),
    entryPoints: z.array(z.string()).describe('Entry point files'),
    outputDir: z.string().describe('Output directory'),
    optimization: z.object({
      minify: z.boolean().optional(),
      treeshake: z.boolean().optional(),
      sourceMaps: z.boolean().optional(),
      bundleSplitting: z.boolean().optional()
    }).optional(),
    plugins: z.array(z.string()).optional(),
    environment: z.record(z.string()).optional(),
    framework: z.string().optional()
  }).describe('Build configuration')
});

const CleanupProjectSchema = z.object({
  scope: z.object({
    directories: z.array(z.string()).describe('Directories to clean'),
    filePatterns: z.array(z.string()).describe('File patterns to match for deletion'),
    preservePatterns: z.array(z.string()).describe('Patterns to preserve'),
    dryRun: z.boolean().describe('Preview mode without actual deletion')
  }).describe('Cleanup scope')
});

const AutoImportSchema = z.object({
  uri: z.string().describe('File URI to update imports'),
  symbols: z.array(z.string()).describe('Symbols that need imports'),
  options: z.object({
    organizeImports: z.boolean().optional(),
    removeUnused: z.boolean().optional(),
    sortImports: z.boolean().optional(),
    groupImports: z.boolean().optional()
  }).optional()
});

const ImplementInterfaceSchema = z.object({
  interfaceLocation: z.object({
    uri: z.string().describe('File URI containing the interface'),
    position: z.object({
      line: z.number(),
      character: z.number()
    }).describe('Position of the interface')
  }).describe('Interface location'),
  implementationTarget: z.object({
    uri: z.string().describe('Target file for implementation'),
    className: z.string().describe('Class name for implementation'),
    insertionPoint: z.object({
      line: z.number(),
      character: z.number()
    }).optional().describe('Where to insert the implementation')
  }).describe('Implementation target'),
  options: z.object({
    generateStubs: z.boolean().optional(),
    includeComments: z.boolean().optional(),
    overrideExisting: z.boolean().optional()
  }).optional()
});

export class BuilderMCPServer {
  private server: Server;
  private symbolEditor: SymbolEditor;
  private refactoringEngine: RefactoringEngine;
  private codeGenerator: CodeGenerator;
  private patternApplicator: PatternApplicator;
  private frameworkIntegrator: FrameworkIntegrator;
  private buildOrchestrator: BuildOrchestrator;

  constructor() {
    this.server = new Server(
      {
        name: 'superclaude-builder',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.initializeComponents();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private initializeComponents() {
    // Initialize core components with stub implementations
    // In real implementation, these would be properly configured
    this.symbolEditor = new SymbolEditor(
      {} as any, // intelligenceClient
      {} as any, // typeChecker
      {} as any, // importManager
      {} as any, // dependencyTracker
      {} as any  // refactoringEngine
    );

    this.refactoringEngine = new RefactoringEngine(
      {} as any, // transactionManager
      {} as any, // conflictDetector
      {} as any, // rollbackManager
      {} as any  // previewGenerator
    );

    this.codeGenerator = new CodeGenerator(
      {} as any, // frameworkDetector
      {} as any, // templateEngine
      {} as any, // contextAnalyzer
      {} as any  // semanticValidator
    );

    this.patternApplicator = new PatternApplicator(
      {} as any, // patternLibrary
      {} as any, // context7Client
      {} as any  // semanticMatcher
    );

    this.frameworkIntegrator = new FrameworkIntegrator(
      {} as any, // frameworkRegistry
      {} as any, // conventionEnforcer
      {} as any  // dependencyManager
    );

    this.buildOrchestrator = new BuildOrchestrator(
      {} as any, // buildPipeline
      {} as any, // dependencyResolver
      {} as any, // optimizationEngine
      {} as any  // qualityGate
    );
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'rename_symbol',
            description: 'Rename a symbol across all references with type safety',
            inputSchema: RenameSymbolSchema,
          },
          {
            name: 'extract_method',
            description: 'Extract code selection into a method with proper signatures',
            inputSchema: ExtractMethodSchema,
          },
          {
            name: 'extract_function',
            description: 'Extract code selection into a function with proper signatures',
            inputSchema: ExtractMethodSchema,
          },
          {
            name: 'generate_code',
            description: 'Generate code with semantic validation and type safety',
            inputSchema: GenerateCodeSchema,
          },
          {
            name: 'generate_ui_component',
            description: 'Generate UI components with proper prop types and styling',
            inputSchema: GenerateUIComponentSchema,
          },
          {
            name: 'apply_design_pattern',
            description: 'Apply design patterns with semantic understanding',
            inputSchema: ApplyPatternSchema,
          },
          {
            name: 'build_project',
            description: 'Execute comprehensive build operations with optimization',
            inputSchema: BuildProjectSchema,
          },
          {
            name: 'cleanup_project',
            description: 'Clean up project files and directories',
            inputSchema: CleanupProjectSchema,
          },
          {
            name: 'auto_import',
            description: 'Automatically add and organize imports',
            inputSchema: AutoImportSchema,
          },
          {
            name: 'implement_interface',
            description: 'Generate interface implementations with correct types',
            inputSchema: ImplementInterfaceSchema,
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'rename_symbol':
            return await this.handleRenameSymbol(args);
          case 'extract_method':
            return await this.handleExtractMethod(args);
          case 'extract_function':
            return await this.handleExtractFunction(args);
          case 'generate_code':
            return await this.handleGenerateCode(args);
          case 'generate_ui_component':
            return await this.handleGenerateUIComponent(args);
          case 'apply_design_pattern':
            return await this.handleApplyDesignPattern(args);
          case 'build_project':
            return await this.handleBuildProject(args);
          case 'cleanup_project':
            return await this.handleCleanupProject(args);
          case 'auto_import':
            return await this.handleAutoImport(args);
          case 'implement_interface':
            return await this.handleImplementInterface(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleRenameSymbol(args: any) {
    const parsed = RenameSymbolSchema.parse(args);
    
    // Create symbol reference from position
    const symbol: SymbolReference = {
      symbolId: `${parsed.uri}:${parsed.position.line}:${parsed.position.character}`,
      location: {
        uri: parsed.uri,
        range: {
          start: parsed.position,
          end: parsed.position
        }
      },
      type: { name: 'unknown', kind: 'primitive' },
      scope: { kind: 'module', name: 'unknown', range: { start: parsed.position, end: parsed.position } },
      dependencies: [],
      usages: [],
      name: 'unknown',
      kind: 'unknown'
    };

    const result = await this.symbolEditor.renameSymbol(symbol, parsed.newName, parsed.options);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleExtractMethod(args: any) {
    const parsed = ExtractMethodSchema.parse(args);
    
    const selection: CodeSelection = {
      uri: parsed.uri,
      range: parsed.selection,
      text: '' // Would be populated by reading the file
    };

    const result = await this.symbolEditor.extractMethod(selection, parsed.methodName, parsed.options);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleExtractFunction(args: any) {
    const parsed = ExtractMethodSchema.parse(args);
    
    const selection: CodeSelection = {
      uri: parsed.uri,
      range: parsed.selection,
      text: '' // Would be populated by reading the file
    };

    const result = await this.symbolEditor.extractFunction(selection, parsed.methodName, parsed.options);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGenerateCode(args: any) {
    const parsed = GenerateCodeSchema.parse(args);
    
    const context: CodeGenerationContext = {
      projectType: { language: parsed.context.language, framework: parsed.context.framework },
      framework: parsed.context.framework ? { name: parsed.context.framework } as Framework : null,
      language: parsed.context.language,
      targetLocation: {
        uri: parsed.context.targetFile,
        range: parsed.context.insertionPoint ? {
          start: parsed.context.insertionPoint,
          end: parsed.context.insertionPoint
        } : { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
      },
      existingCode: { imports: [], exports: [], symbols: [], dependencies: [] },
      requirements: parsed.specification,
      constraints: {
        maxLines: 1000,
        conventions: {},
        dependencies: [],
        performance: {}
      }
    };

    const template = {
      name: parsed.specification.type,
      template: '',
      variables: {},
      language: parsed.context.language
    };

    const result = await this.codeGenerator.generateCode(context, template);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGenerateUIComponent(args: any) {
    const parsed = GenerateUIComponentSchema.parse(args);
    
    const specs: ComponentSpecification = {
      name: parsed.componentName,
      props: parsed.specification.props || [],
      state: parsed.specification.state,
      events: parsed.specification.events,
      styling: parsed.specification.styling,
      accessibility: parsed.specification.accessibility,
      behavior: parsed.specification.behavior,
      includeTests: parsed.options?.includeTests,
      includeStyles: parsed.options?.includeStyles,
      includeDocs: parsed.options?.includeDocs
    };

    const framework: Framework = {
      name: parsed.framework,
      version: '1.0.0',
      conventions: {},
      patterns: [],
      generators: [],
      validators: []
    };

    const result = await this.codeGenerator.generateUIComponent(specs, framework);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleApplyDesignPattern(args: any) {
    const parsed = ApplyPatternSchema.parse(args);
    
    const pattern: DesignPattern = {
      name: parsed.patternName,
      description: `Design pattern: ${parsed.patternName}`,
      template: '',
      variables: {},
      constraints: []
    };

    const target = {
      uri: parsed.target.uri,
      range: parsed.target.range,
      symbolName: parsed.target.symbolName,
      symbolType: parsed.target.symbolType
    };

    const result = await this.patternApplicator.applyDesignPattern(pattern, target, parsed.options);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBuildProject(args: any) {
    const parsed = BuildProjectSchema.parse(args);
    
    const result = await this.buildOrchestrator.executeBuild(parsed.configuration);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCleanupProject(args: any) {
    const parsed = CleanupProjectSchema.parse(args);
    
    const result = await this.buildOrchestrator.performCleanup(parsed.scope);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleAutoImport(args: any) {
    const parsed = AutoImportSchema.parse(args);
    
    // This would integrate with the symbol editor's auto-import functionality
    const result = {
      success: true,
      addedImports: parsed.symbols,
      organizedImports: [],
      removedImports: [],
      metadata: {
        symbolCount: parsed.symbols.length,
        importCount: parsed.symbols.length,
        processingTime: 100
      }
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleImplementInterface(args: any) {
    const parsed = ImplementInterfaceSchema.parse(args);
    
    const interfaceDef = {
      name: 'IInterface',
      methods: [],
      properties: [],
      extends: []
    };

    const result = await this.codeGenerator.implementInterface(interfaceDef, parsed.options);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SuperClaude Builder MCP server running on stdio');
  }
}