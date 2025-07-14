import { CodeGenerator } from '../core/CodeGenerator';
import { CodeGenerationContext, ComponentSpecification, Framework } from '../types/index';

// Mock dependencies
const mockFrameworkDetector = {
  detectFramework: jest.fn(),
  getFrameworkConventions: jest.fn()
};

const mockTemplateEngine = {
  loadTemplate: jest.fn(),
  renderTemplate: jest.fn(),
  getAvailableTemplates: jest.fn()
};

const mockContextAnalyzer = {
  analyzeContext: jest.fn(),
  inferRequirements: jest.fn(),
  analyzeExistingCode: jest.fn()
};

const mockSemanticValidator = {
  validateGeneratedCode: jest.fn(),
  validateSyntax: jest.fn(),
  validateSemantics: jest.fn()
};

describe('CodeGenerator', () => {
  let codeGenerator: CodeGenerator;

  beforeEach(() => {
    codeGenerator = new CodeGenerator(
      mockFrameworkDetector,
      mockTemplateEngine,
      mockContextAnalyzer,
      mockSemanticValidator
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateCode', () => {
    const mockContext: CodeGenerationContext = {
      projectType: { language: 'typescript' },
      framework: null,
      language: 'typescript',
      targetLocation: {
        uri: 'file:///test.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 0 }
        }
      },
      existingCode: {
        imports: [],
        exports: [],
        symbols: [],
        dependencies: []
      },
      requirements: {
        type: 'function',
        name: 'testFunction',
        description: 'A test function'
      },
      constraints: {
        maxLines: 100,
        conventions: {},
        dependencies: [],
        performance: {}
      }
    };

    const mockTemplate = {
      name: 'function',
      template: 'function {{name}}() {\n  // {{description}}\n}',
      variables: {},
      language: 'typescript'
    };

    it('should successfully generate code', async () => {
      // Setup mocks
      mockContextAnalyzer.analyzeContext.mockResolvedValue({
        language: 'typescript',
        complexity: 'medium'
      });

      mockTemplateEngine.renderTemplate.mockResolvedValue(
        'function testFunction() {\n  // A test function\n}'
      );

      mockSemanticValidator.validateGeneratedCode.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      const result = await codeGenerator.generateCode(mockContext, mockTemplate);

      expect(result.generatedCode).toContain('function testFunction()');
      expect(result.metadata.language).toBe('typescript');
      expect(mockContextAnalyzer.analyzeContext).toHaveBeenCalled();
      expect(mockTemplateEngine.renderTemplate).toHaveBeenCalled();
      expect(mockSemanticValidator.validateGeneratedCode).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({
        language: 'typescript',
        complexity: 'medium'
      });

      mockTemplateEngine.renderTemplate.mockResolvedValue(
        'invalid code syntax'
      );

      mockSemanticValidator.validateGeneratedCode.mockResolvedValue({
        isValid: false,
        errors: ['Syntax error'],
        warnings: [],
        suggestions: []
      });

      await expect(codeGenerator.generateCode(mockContext, mockTemplate))
        .rejects.toThrow('Generated code validation failed');
    });

    it('should handle template rendering errors', async () => {
      mockContextAnalyzer.analyzeContext.mockResolvedValue({
        language: 'typescript',
        complexity: 'medium'
      });

      mockTemplateEngine.renderTemplate.mockRejectedValue(
        new Error('Template rendering failed')
      );

      await expect(codeGenerator.generateCode(mockContext, mockTemplate))
        .rejects.toThrow('Code generation failed');
    });
  });

  describe('generateUIComponent', () => {
    const mockFramework: Framework = {
      name: 'react',
      version: '18.0.0',
      conventions: {
        naming: { component: 'PascalCase' },
        structure: { props: 'interface' },
        patterns: {}
      },
      patterns: [],
      generators: [],
      validators: []
    };

    const mockSpecs: ComponentSpecification = {
      name: 'TestComponent',
      props: [
        { name: 'title', type: 'string', optional: false },
        { name: 'onClick', type: 'function', optional: true }
      ],
      includeTests: true,
      includeStyles: true,
      includeDocs: true
    };

    it('should successfully generate a UI component', async () => {
      mockTemplateEngine.loadTemplate.mockResolvedValue({
        name: 'component',
        template: 'const {{componentName}} = (props) => {\n  return <div>{{componentName}}</div>;\n};',
        variables: {},
        language: 'typescript'
      });

      mockTemplateEngine.renderTemplate.mockResolvedValue(
        'const TestComponent = (props) => {\n  return <div>TestComponent</div>;\n};'
      );

      const result = await codeGenerator.generateUIComponent(mockSpecs, mockFramework);

      expect(result.componentCode).toContain('TestComponent');
      expect(result.propsInterface).toContain('TestComponentProps');
      expect(result.tests).toContain('TestComponent');
      expect(result.styles).toContain('testcomponent');
      expect(mockTemplateEngine.loadTemplate).toHaveBeenCalledWith('component', 'typescript', 'react');
      expect(mockTemplateEngine.renderTemplate).toHaveBeenCalled();
    });

    it('should handle component generation errors', async () => {
      mockTemplateEngine.loadTemplate.mockRejectedValue(
        new Error('Template not found')
      );

      await expect(codeGenerator.generateUIComponent(mockSpecs, mockFramework))
        .rejects.toThrow('UI component generation failed');
    });

    it('should generate component without optional features', async () => {
      const minimalSpecs: ComponentSpecification = {
        name: 'MinimalComponent',
        props: [],
        includeTests: false,
        includeStyles: false,
        includeDocs: false
      };

      mockTemplateEngine.loadTemplate.mockResolvedValue({
        name: 'component',
        template: 'const {{componentName}} = () => <div>{{componentName}}</div>;',
        variables: {},
        language: 'typescript'
      });

      mockTemplateEngine.renderTemplate.mockResolvedValue(
        'const MinimalComponent = () => <div>MinimalComponent</div>;'
      );

      const result = await codeGenerator.generateUIComponent(minimalSpecs, mockFramework);

      expect(result.componentCode).toContain('MinimalComponent');
      expect(result.tests).toBeUndefined();
      expect(result.styles).toBeUndefined();
    });
  });

  describe('implementInterface', () => {
    const mockInterfaceDef = {
      name: 'ITestInterface',
      methods: [
        {
          name: 'testMethod',
          parameters: [{ name: 'param1', type: 'string' }],
          returnType: 'boolean',
          accessibility: 'public'
        }
      ],
      properties: [
        {
          name: 'testProperty',
          type: 'number',
          accessibility: 'public'
        }
      ],
      extends: []
    };

    it('should successfully implement an interface', async () => {
      const result = await codeGenerator.implementInterface(mockInterfaceDef, {
        generateStubs: true,
        includeComments: true
      });

      expect(result.implementation).toContain('ITestInterface');
      expect(result.methods).toHaveLength(1);
      expect(result.methods[0]).toContain('testMethod');
      expect(result.properties).toHaveLength(1);
      expect(result.properties[0]).toContain('testProperty');
    });

    it('should handle empty interface', async () => {
      const emptyInterface = {
        name: 'IEmptyInterface',
        methods: [],
        properties: [],
        extends: []
      };

      const result = await codeGenerator.implementInterface(emptyInterface);

      expect(result.implementation).toContain('IEmptyInterface');
      expect(result.methods).toHaveLength(0);
      expect(result.properties).toHaveLength(0);
    });
  });

  describe('generateTests', () => {
    const mockTarget = {
      uri: 'file:///test.ts',
      symbolName: 'testFunction',
      symbolType: 'function' as const,
      testType: 'unit' as const
    };

    const mockFramework = {
      name: 'jest',
      version: '29.0.0',
      testFileExtension: '.test.ts',
      generateTestTemplate: jest.fn()
    };

    it('should successfully generate tests', async () => {
      mockFramework.generateTestTemplate.mockResolvedValue(
        'describe("{{TARGET_NAME}}", () => {\n  it("should work", () => {\n    // Test implementation\n  });\n});'
      );

      const result = await codeGenerator.generateTests(mockTarget, mockFramework);

      expect(result.testCode).toContain('testFunction');
      expect(result.testCode).toContain('describe');
      expect(result.imports).toContain('testFunction');
      expect(result.setup).toContain('beforeEach');
      expect(result.teardown).toContain('afterEach');
    });
  });

  describe('generateAPIEndpoints', () => {
    const mockSpecification = {
      endpoints: [
        {
          method: 'GET',
          path: '/api/test',
          handler: 'getTest'
        },
        {
          method: 'POST',
          path: '/api/test',
          handler: 'postTest'
        }
      ],
      middleware: [
        {
          name: 'authMiddleware',
          type: 'authentication'
        }
      ],
      schemas: [
        {
          name: 'TestSchema',
          type: 'object'
        }
      ],
      errorHandling: {
        type: 'standard',
        includeStackTrace: false
      }
    };

    it('should successfully generate API endpoints', async () => {
      const result = await codeGenerator.generateAPIEndpoints(mockSpecification);

      expect(result.routeHandlers).toHaveLength(2);
      expect(result.routeHandlers[0]).toContain('router.get');
      expect(result.routeHandlers[1]).toContain('router.post');
      expect(result.middleware).toHaveLength(1);
      expect(result.middleware[0]).toContain('authMiddleware');
      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0]).toContain('TestSchema');
      expect(result.errorHandlers).toHaveLength(1);
      expect(result.routerConfig).toContain('express.Router');
      expect(result.documentation).toContain('API Documentation');
    });

    it('should handle empty specification', async () => {
      const emptySpec = {
        endpoints: []
      };

      const result = await codeGenerator.generateAPIEndpoints(emptySpec);

      expect(result.routeHandlers).toHaveLength(0);
      expect(result.middleware).toHaveLength(0);
      expect(result.schemas).toHaveLength(0);
      expect(result.errorHandlers).toHaveLength(0);
    });
  });

  describe('generateStubs', () => {
    const mockUsagePatterns = [
      {
        symbolName: 'testFunction',
        usageType: 'function_call' as const,
        expectedSignature: { parameters: [], returnType: 'void' }
      },
      {
        symbolName: 'testMethod',
        usageType: 'method_call' as const,
        expectedSignature: { parameters: [{ name: 'param', type: 'string' }], returnType: 'boolean' }
      },
      {
        symbolName: 'testProperty',
        usageType: 'property_access' as const
      }
    ];

    it('should successfully generate stubs', async () => {
      const result = await codeGenerator.generateStubs(mockUsagePatterns, {
        includeTypes: true,
        generateDocumentation: true,
        throwNotImplemented: true
      });

      expect(result.stubs).toHaveLength(3);
      expect(result.stubs[0]).toContain('testFunction');
      expect(result.stubs[1]).toContain('testMethod');
      expect(result.stubs[2]).toContain('testProperty');
      expect(result.implementations).toHaveLength(3);
      expect(result.implementations[0]).toContain('Not implemented');
    });

    it('should handle empty usage patterns', async () => {
      const result = await codeGenerator.generateStubs([]);

      expect(result.stubs).toHaveLength(0);
      expect(result.implementations).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle context analyzer errors', async () => {
      const mockContext: CodeGenerationContext = {
        projectType: { language: 'typescript' },
        framework: null,
        language: 'typescript',
        targetLocation: {
          uri: 'file:///test.ts',
          range: {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 0 }
          }
        },
        existingCode: {
          imports: [],
          exports: [],
          symbols: [],
          dependencies: []
        },
        requirements: {
          type: 'function',
          name: 'testFunction',
          description: 'A test function'
        },
        constraints: {
          maxLines: 100,
          conventions: {},
          dependencies: [],
          performance: {}
        }
      };

      const mockTemplate = {
        name: 'function',
        template: 'function {{name}}() {}',
        variables: {},
        language: 'typescript'
      };

      mockContextAnalyzer.analyzeContext.mockRejectedValue(
        new Error('Context analysis failed')
      );

      await expect(codeGenerator.generateCode(mockContext, mockTemplate))
        .rejects.toThrow('Code generation failed');
    });

    it('should handle template engine errors', async () => {
      mockTemplateEngine.getAvailableTemplates.mockRejectedValue(
        new Error('Template service unavailable')
      );

      // This would be tested in a method that uses getAvailableTemplates
      await expect(mockTemplateEngine.getAvailableTemplates('typescript'))
        .rejects.toThrow('Template service unavailable');
    });
  });
});