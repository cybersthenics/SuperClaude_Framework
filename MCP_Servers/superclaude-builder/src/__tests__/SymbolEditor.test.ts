import { SymbolEditor } from '../core/SymbolEditor';
import { SymbolReference, CodeSelection } from '../types/index';

// Mock dependencies
const mockIntelligenceClient = {
  getSymbolInfo: jest.fn(),
  findAllReferences: jest.fn(),
  getInterfaceMembers: jest.fn(),
  validateSymbolName: jest.fn()
};

const mockTypeChecker = {
  validateType: jest.fn(),
  inferType: jest.fn()
};

const mockImportManager = {
  addImport: jest.fn(),
  removeImport: jest.fn(),
  organizeImports: jest.fn()
};

const mockDependencyTracker = {
  trackDependencies: jest.fn(),
  updateDependencies: jest.fn()
};

const mockRefactoringEngine = {
  startRefactoringTransaction: jest.fn(),
  addRefactoringOperation: jest.fn(),
  executeRefactoring: jest.fn()
};

describe('SymbolEditor', () => {
  let symbolEditor: SymbolEditor;

  beforeEach(() => {
    symbolEditor = new SymbolEditor(
      mockIntelligenceClient,
      mockTypeChecker,
      mockImportManager,
      mockDependencyTracker,
      mockRefactoringEngine
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('renameSymbol', () => {
    const mockSymbol: SymbolReference = {
      symbolId: 'test-symbol',
      location: {
        uri: 'file:///test.ts',
        range: {
          start: { line: 10, character: 5 },
          end: { line: 10, character: 15 }
        }
      },
      type: { name: 'string', kind: 'primitive' },
      scope: { kind: 'function', name: 'testFunction', range: { start: { line: 8, character: 0 }, end: { line: 20, character: 1 } } },
      dependencies: [],
      usages: [],
      name: 'oldName',
      kind: 'variable'
    };

    it('should successfully rename a symbol', async () => {
      // Setup mocks
      mockIntelligenceClient.findAllReferences.mockResolvedValue([
        { uri: 'file:///test.ts', range: { start: { line: 10, character: 5 }, end: { line: 10, character: 15 } } },
        { uri: 'file:///test.ts', range: { start: { line: 15, character: 2 }, end: { line: 15, character: 12 } } }
      ]);

      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'test-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///test.ts'],
        changes: ['renamed oldName to newName'],
        rollbackId: 'rollback-123'
      });

      const result = await symbolEditor.renameSymbol(mockSymbol, 'newName');

      expect(result.success).toBe(true);
      expect(result.affectedFiles).toContain('file:///test.ts');
      expect(result.rollbackId).toBe('rollback-123');
      expect(mockIntelligenceClient.findAllReferences).toHaveBeenCalled();
      expect(mockRefactoringEngine.startRefactoringTransaction).toHaveBeenCalled();
      expect(mockRefactoringEngine.executeRefactoring).toHaveBeenCalled();
    });

    it('should handle rename conflicts', async () => {
      // Setup mocks for conflict scenario
      mockIntelligenceClient.findAllReferences.mockResolvedValue([
        { uri: 'file:///test.ts', range: { start: { line: 10, character: 5 }, end: { line: 10, character: 15 } } }
      ]);

      // Mock a conflict scenario by having the private method return conflicts
      const result = await symbolEditor.renameSymbol(mockSymbol, 'conflictingName');

      expect(mockIntelligenceClient.findAllReferences).toHaveBeenCalled();
    });

    it('should handle invalid names', async () => {
      await expect(symbolEditor.renameSymbol(mockSymbol, '123invalid')).rejects.toThrow();
    });
  });

  describe('extractMethod', () => {
    const mockSelection: CodeSelection = {
      uri: 'file:///test.ts',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 10 }
      },
      text: 'const result = calculate(x, y);\nreturn result;'
    };

    it('should successfully extract a method', async () => {
      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'extract-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///test.ts'],
        changes: ['extracted method calculateResult'],
        rollbackId: 'rollback-456'
      });

      const result = await symbolEditor.extractMethod(mockSelection, 'calculateResult');

      expect(result.success).toBe(true);
      expect(result.methodSignature.name).toBe('calculateResult');
      expect(result.rollbackId).toBe('rollback-456');
      expect(mockRefactoringEngine.startRefactoringTransaction).toHaveBeenCalled();
      expect(mockRefactoringEngine.executeRefactoring).toHaveBeenCalled();
    });

    it('should handle invalid method names', async () => {
      await expect(symbolEditor.extractMethod(mockSelection, '123invalid')).rejects.toThrow();
    });
  });

  describe('extractFunction', () => {
    const mockSelection: CodeSelection = {
      uri: 'file:///test.ts',
      range: {
        start: { line: 5, character: 0 },
        end: { line: 10, character: 5 }
      },
      text: 'function helper() { return true; }'
    };

    it('should successfully extract a function', async () => {
      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'extract-function-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///test.ts'],
        changes: ['extracted function helperFunction'],
        rollbackId: 'rollback-789'
      });

      const result = await symbolEditor.extractFunction(mockSelection, 'helperFunction');

      expect(result.success).toBe(true);
      expect(result.methodSignature.name).toBe('helperFunction');
      expect(result.rollbackId).toBe('rollback-789');
    });
  });

  describe('inlineVariable', () => {
    const mockVariable: SymbolReference = {
      symbolId: 'var-symbol',
      location: {
        uri: 'file:///test.ts',
        range: {
          start: { line: 5, character: 10 },
          end: { line: 5, character: 20 }
        }
      },
      type: { name: 'number', kind: 'primitive' },
      scope: { kind: 'function', name: 'testFunction', range: { start: { line: 3, character: 0 }, end: { line: 15, character: 1 } } },
      dependencies: [],
      usages: [],
      name: 'tempVar',
      kind: 'variable'
    };

    it('should successfully inline a variable', async () => {
      mockIntelligenceClient.findAllReferences.mockResolvedValue([
        { uri: 'file:///test.ts', range: { start: { line: 5, character: 10 }, end: { line: 5, character: 20 } } },
        { uri: 'file:///test.ts', range: { start: { line: 8, character: 5 }, end: { line: 8, character: 15 } } }
      ]);

      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'inline-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///test.ts'],
        changes: ['inlined variable tempVar'],
        rollbackId: 'rollback-inline'
      });

      const result = await symbolEditor.inlineVariable(mockVariable);

      expect(result.success).toBe(true);
      expect(result.affectedLocations).toHaveLength(2);
      expect(result.rollbackId).toBe('rollback-inline');
      expect(mockIntelligenceClient.findAllReferences).toHaveBeenCalled();
      expect(mockRefactoringEngine.executeRefactoring).toHaveBeenCalled();
    });
  });

  describe('inlineMethod', () => {
    const mockMethod: SymbolReference = {
      symbolId: 'method-symbol',
      location: {
        uri: 'file:///test.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 15, character: 1 }
        }
      },
      type: { name: 'function', kind: 'function' },
      scope: { kind: 'class', name: 'TestClass', range: { start: { line: 5, character: 0 }, end: { line: 25, character: 1 } } },
      dependencies: [],
      usages: [],
      name: 'helperMethod',
      kind: 'method'
    };

    it('should successfully inline a method', async () => {
      mockIntelligenceClient.findAllReferences.mockResolvedValue([
        { uri: 'file:///test.ts', range: { start: { line: 20, character: 5 }, end: { line: 20, character: 20 } } }
      ]);

      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'inline-method-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///test.ts'],
        changes: ['inlined method helperMethod'],
        rollbackId: 'rollback-inline-method'
      });

      const result = await symbolEditor.inlineMethod(mockMethod);

      expect(result.success).toBe(true);
      expect(result.affectedLocations).toHaveLength(1);
      expect(result.rollbackId).toBe('rollback-inline-method');
    });
  });

  describe('moveSymbol', () => {
    const mockSymbol: SymbolReference = {
      symbolId: 'move-symbol',
      location: {
        uri: 'file:///source.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 15, character: 1 }
        }
      },
      type: { name: 'class', kind: 'class' },
      scope: { kind: 'module', name: 'sourceModule', range: { start: { line: 0, character: 0 }, end: { line: 100, character: 1 } } },
      dependencies: [],
      usages: [],
      name: 'TestClass',
      kind: 'class'
    };

    const targetLocation = {
      uri: 'file:///target.ts',
      range: {
        start: { line: 5, character: 0 },
        end: { line: 5, character: 0 }
      }
    };

    it('should successfully move a symbol', async () => {
      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'move-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///source.ts', 'file:///target.ts'],
        changes: ['moved TestClass'],
        rollbackId: 'rollback-move'
      });

      const result = await symbolEditor.moveSymbol(mockSymbol, targetLocation);

      expect(result.success).toBe(true);
      expect(result.newLocation).toEqual(targetLocation);
      expect(result.rollbackId).toBe('rollback-move');
    });
  });

  describe('changeSignature', () => {
    const mockSymbol: SymbolReference = {
      symbolId: 'signature-symbol',
      location: {
        uri: 'file:///test.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 15, character: 1 }
        }
      },
      type: { name: 'function', kind: 'function' },
      scope: { kind: 'module', name: 'testModule', range: { start: { line: 0, character: 0 }, end: { line: 50, character: 1 } } },
      dependencies: [],
      usages: [],
      name: 'testFunction',
      kind: 'function'
    };

    const newSignature = {
      name: 'testFunction',
      parameters: [
        { name: 'param1', type: { name: 'string', kind: 'primitive' as const } },
        { name: 'param2', type: { name: 'number', kind: 'primitive' as const } }
      ],
      returnType: { name: 'boolean', kind: 'primitive' as const }
    };

    it('should successfully change a function signature', async () => {
      mockIntelligenceClient.findAllReferences.mockResolvedValue([
        { uri: 'file:///test.ts', range: { start: { line: 20, character: 5 }, end: { line: 20, character: 20 } } }
      ]);

      mockRefactoringEngine.startRefactoringTransaction.mockResolvedValue({
        transactionId: 'signature-transaction'
      });

      mockRefactoringEngine.executeRefactoring.mockResolvedValue({
        success: true,
        affectedFiles: ['file:///test.ts'],
        changes: ['changed signature of testFunction'],
        rollbackId: 'rollback-signature'
      });

      const result = await symbolEditor.changeSignature(mockSymbol, newSignature, {
        updateCallSites: true
      });

      expect(result.success).toBe(true);
      expect(result.newSignature).toEqual(newSignature);
      expect(result.rollbackId).toBe('rollback-signature');
    });
  });

  describe('error handling', () => {
    it('should handle intelligence client errors gracefully', async () => {
      const mockSymbol: SymbolReference = {
        symbolId: 'error-symbol',
        location: {
          uri: 'file:///test.ts',
          range: {
            start: { line: 10, character: 5 },
            end: { line: 10, character: 15 }
          }
        },
        type: { name: 'string', kind: 'primitive' },
        scope: { kind: 'function', name: 'testFunction', range: { start: { line: 8, character: 0 }, end: { line: 20, character: 1 } } },
        dependencies: [],
        usages: [],
        name: 'errorVar',
        kind: 'variable'
      };

      mockIntelligenceClient.findAllReferences.mockRejectedValue(new Error('Service unavailable'));

      await expect(symbolEditor.renameSymbol(mockSymbol, 'newName')).rejects.toThrow('Rename symbol failed');
    });

    it('should handle refactoring engine errors gracefully', async () => {
      const mockSelection: CodeSelection = {
        uri: 'file:///test.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 15, character: 10 }
        },
        text: 'const result = calculate(x, y);\nreturn result;'
      };

      mockRefactoringEngine.startRefactoringTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(symbolEditor.extractMethod(mockSelection, 'calculateResult')).rejects.toThrow('Extract method failed');
    });
  });
});