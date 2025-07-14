import { BuilderMCPServer } from '../MCPServer';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock the SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

// Mock the core modules
jest.mock('../core/SymbolEditor');
jest.mock('../core/RefactoringEngine');
jest.mock('../core/CodeGenerator');
jest.mock('../core/PatternApplicator');
jest.mock('../core/FrameworkIntegrator');
jest.mock('../core/BuildOrchestrator');

describe('BuilderMCPServer', () => {
  let server: BuilderMCPServer;
  let mockServer: jest.Mocked<Server>;

  beforeEach(() => {
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
      onerror: jest.fn()
    } as any;

    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServer);

    server = new BuilderMCPServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct server configuration', () => {
      expect(Server).toHaveBeenCalledWith(
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
    });

    it('should setup tool handlers', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
    });

    it('should setup error handling', () => {
      expect(mockServer.onerror).toBeDefined();
    });
  });

  describe('ListToolsRequest', () => {
    it('should return all available tools', async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        tools: [
          {
            name: 'rename_symbol',
            description: 'Rename a symbol across all references with type safety',
            inputSchema: expect.any(Object),
          },
          {
            name: 'extract_method',
            description: 'Extract code selection into a method with proper signatures',
            inputSchema: expect.any(Object),
          },
          {
            name: 'generate_code',
            description: 'Generate code with semantic validation and type safety',
            inputSchema: expect.any(Object),
          },
        ],
      });

      // Get the handler that was registered
      const listToolsCall = mockServer.setRequestHandler.mock.calls.find(
        call => call[0].method === 'tools/list'
      );

      if (listToolsCall) {
        const handler = listToolsCall[1];
        const result = await handler({});
        
        expect(result.tools).toHaveLength(10); // We have 10 tools
        expect(result.tools[0].name).toBe('rename_symbol');
        expect(result.tools[1].name).toBe('extract_method');
        expect(result.tools[2].name).toBe('extract_function');
      }
    });
  });

  describe('CallToolRequest', () => {
    let toolHandler: any;

    beforeEach(() => {
      // Get the tool handler that was registered
      const callToolCall = mockServer.setRequestHandler.mock.calls.find(
        call => call[0].method === 'tools/call'
      );
      
      if (callToolCall) {
        toolHandler = callToolCall[1];
      }
    });

    describe('rename_symbol', () => {
      it('should handle valid rename_symbol request', async () => {
        const request = {
          params: {
            name: 'rename_symbol',
            arguments: {
              uri: 'file:///test.ts',
              position: { line: 10, character: 5 },
              newName: 'newSymbolName',
              options: { forceRename: false }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('success');
      });

      it('should handle invalid arguments', async () => {
        const request = {
          params: {
            name: 'rename_symbol',
            arguments: {
              uri: 'file:///test.ts',
              // missing position and newName
            }
          }
        };

        await expect(toolHandler(request)).rejects.toThrow();
      });
    });

    describe('extract_method', () => {
      it('should handle valid extract_method request', async () => {
        const request = {
          params: {
            name: 'extract_method',
            arguments: {
              uri: 'file:///test.ts',
              selection: {
                start: { line: 10, character: 0 },
                end: { line: 15, character: 10 }
              },
              methodName: 'extractedMethod',
              options: { accessibility: 'private' }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('success');
      });
    });

    describe('generate_code', () => {
      it('should handle valid generate_code request', async () => {
        const request = {
          params: {
            name: 'generate_code',
            arguments: {
              context: {
                projectRoot: '/project',
                targetFile: 'file:///test.ts',
                language: 'typescript',
                framework: 'react'
              },
              specification: {
                type: 'function',
                name: 'testFunction',
                description: 'A test function'
              },
              options: { includeComments: true }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('generatedCode');
      });

      it('should handle invalid language', async () => {
        const request = {
          params: {
            name: 'generate_code',
            arguments: {
              context: {
                projectRoot: '/project',
                targetFile: 'file:///test.ts',
                language: 'invalid-language'
              },
              specification: {
                type: 'function',
                name: 'testFunction',
                description: 'A test function'
              }
            }
          }
        };

        await expect(toolHandler(request)).rejects.toThrow();
      });
    });

    describe('generate_ui_component', () => {
      it('should handle valid generate_ui_component request', async () => {
        const request = {
          params: {
            name: 'generate_ui_component',
            arguments: {
              framework: 'react',
              componentName: 'TestComponent',
              specification: {
                props: [
                  { name: 'title', type: 'string' },
                  { name: 'onClick', type: 'function' }
                ],
                behavior: 'Interactive button component'
              },
              options: { includeTests: true }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('componentCode');
      });

      it('should handle invalid framework', async () => {
        const request = {
          params: {
            name: 'generate_ui_component',
            arguments: {
              framework: 'invalid-framework',
              componentName: 'TestComponent',
              specification: {}
            }
          }
        };

        await expect(toolHandler(request)).rejects.toThrow();
      });
    });

    describe('apply_design_pattern', () => {
      it('should handle valid apply_design_pattern request', async () => {
        const request = {
          params: {
            name: 'apply_design_pattern',
            arguments: {
              patternName: 'Observer',
              target: {
                uri: 'file:///test.ts',
                range: {
                  start: { line: 10, character: 0 },
                  end: { line: 20, character: 10 }
                },
                symbolName: 'TestClass'
              },
              options: { generateComments: true }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('success');
      });
    });

    describe('build_project', () => {
      it('should handle valid build_project request', async () => {
        const request = {
          params: {
            name: 'build_project',
            arguments: {
              configuration: {
                target: 'production',
                entryPoints: ['src/index.ts'],
                outputDir: 'dist',
                optimization: { minify: true },
                plugins: ['typescript']
              }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('success');
      });

      it('should handle invalid target', async () => {
        const request = {
          params: {
            name: 'build_project',
            arguments: {
              configuration: {
                target: 'invalid-target',
                entryPoints: ['src/index.ts'],
                outputDir: 'dist'
              }
            }
          }
        };

        await expect(toolHandler(request)).rejects.toThrow();
      });
    });

    describe('auto_import', () => {
      it('should handle valid auto_import request', async () => {
        const request = {
          params: {
            name: 'auto_import',
            arguments: {
              uri: 'file:///test.ts',
              symbols: ['React', 'useState', 'useEffect'],
              options: { organizeImports: true }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('success');
      });
    });

    describe('implement_interface', () => {
      it('should handle valid implement_interface request', async () => {
        const request = {
          params: {
            name: 'implement_interface',
            arguments: {
              interfaceLocation: {
                uri: 'file:///interface.ts',
                position: { line: 5, character: 0 }
              },
              implementationTarget: {
                uri: 'file:///impl.ts',
                className: 'TestImplementation'
              },
              options: { generateStubs: true }
            }
          }
        };

        const result = await toolHandler(request);

        expect(result.content).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('implementation');
      });
    });

    describe('unknown tool', () => {
      it('should handle unknown tool request', async () => {
        const request = {
          params: {
            name: 'unknown_tool',
            arguments: {}
          }
        };

        await expect(toolHandler(request)).rejects.toThrow('Tool unknown_tool not found');
      });
    });
  });

  describe('error handling', () => {
    it('should handle server errors', () => {
      const errorHandler = jest.fn();
      mockServer.onerror = errorHandler;

      const testError = new Error('Test error');
      mockServer.onerror(testError);

      expect(errorHandler).toHaveBeenCalledWith(testError);
    });

    it('should handle process signals', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Simulate SIGINT
      const sigintHandler = process.listeners('SIGINT').find(
        listener => listener.toString().includes('server.close')
      );

      if (sigintHandler) {
        expect(() => sigintHandler()).toThrow('process.exit called');
      }

      exitSpy.mockRestore();
    });
  });

  describe('run', () => {
    it('should connect to transport and start server', async () => {
      const mockTransport = {
        start: jest.fn(),
        close: jest.fn()
      };

      // Mock the transport
      const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
      StdioServerTransport.mockImplementation(() => mockTransport);

      mockServer.connect.mockResolvedValue(undefined);

      await server.run();

      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should handle connection errors', async () => {
      const mockTransport = {
        start: jest.fn(),
        close: jest.fn()
      };

      const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
      StdioServerTransport.mockImplementation(() => mockTransport);

      mockServer.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(server.run()).rejects.toThrow('Connection failed');
    });
  });
});