import {
  RefactoringTransaction,
  RefactoringOperation,
  RefactoringScope,
  RefactoringResult,
  RefactoringPreview,
  RollbackResult,
  ConflictReport,
  RollbackData,
  TransactionStatus,
  AtomicityValidation,
  IntegrityResult,
  ApplicationResult,
  ValidationResult
} from '../types/index.js';

export interface TransactionManager {
  createTransaction(scope: RefactoringScope): Promise<RefactoringTransaction>;
  addOperation(transaction: RefactoringTransaction, operation: RefactoringOperation): Promise<void>;
  validateTransaction(transaction: RefactoringTransaction): Promise<ValidationResult>;
  executeTransaction(transaction: RefactoringTransaction): Promise<ApplicationResult>;
  getTransaction(transactionId: string): Promise<RefactoringTransaction | null>;
}

export interface ConflictDetector {
  detectConflicts(transaction: RefactoringTransaction): Promise<ConflictReport>;
  resolveConflicts(conflicts: ConflictReport): Promise<RefactoringOperation[]>;
}

export interface RollbackManager {
  createRollbackData(transaction: RefactoringTransaction): Promise<RollbackData>;
  executeRollback(rollbackData: RollbackData): Promise<RollbackResult>;
  validateRollback(rollbackData: RollbackData): Promise<ValidationResult>;
}

export interface PreviewGenerator {
  generatePreview(transaction: RefactoringTransaction): Promise<RefactoringPreview>;
  estimateImpact(transaction: RefactoringTransaction): Promise<string>;
}

export class RefactoringEngine {
  private transactions: Map<string, RefactoringTransaction> = new Map();

  constructor(
    private transactionManager: TransactionManager,
    private conflictDetector: ConflictDetector,
    private rollbackManager: RollbackManager,
    private previewGenerator: PreviewGenerator
  ) {}

  async startRefactoringTransaction(scope: RefactoringScope): Promise<RefactoringTransaction> {
    try {
      const transaction = await this.transactionManager.createTransaction(scope);
      this.transactions.set(transaction.transactionId, transaction);
      
      return transaction;
    } catch (error) {
      throw new Error(`Failed to start refactoring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addRefactoringOperation(
    transaction: RefactoringTransaction, 
    operation: RefactoringOperation
  ): Promise<void> {
    try {
      await this.transactionManager.addOperation(transaction, operation);
      
      // Update the stored transaction
      this.transactions.set(transaction.transactionId, transaction);
    } catch (error) {
      throw new Error(`Failed to add refactoring operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async previewRefactoring(transaction: RefactoringTransaction): Promise<RefactoringPreview> {
    try {
      // Validate transaction before generating preview
      const validation = await this.transactionManager.validateTransaction(transaction);
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
      }

      // Detect conflicts
      const conflicts = await this.conflictDetector.detectConflicts(transaction);
      if (conflicts.hasConflicts) {
        console.warn(`Conflicts detected in transaction ${transaction.transactionId}:`, conflicts);
      }

      // Generate preview
      const preview = await this.previewGenerator.generatePreview(transaction);
      
      return {
        ...preview,
        potentialIssues: conflicts.hasConflicts 
          ? [...(preview.potentialIssues || []), ...conflicts.conflicts.map(c => c.description)]
          : preview.potentialIssues || []
      };
    } catch (error) {
      throw new Error(`Failed to generate refactoring preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeRefactoring(transaction: RefactoringTransaction): Promise<RefactoringResult> {
    try {
      // Update transaction status
      transaction.status.status = 'executing';
      transaction.status.progress = 0;

      // Validate atomicity
      const atomicityCheck = await this.validateAtomicity(transaction);
      if (!atomicityCheck.isAtomic) {
        throw new Error(`Transaction is not atomic: ${atomicityCheck.conflicts.join(', ')}`);
      }

      // Create rollback data before execution
      const rollbackData = await this.rollbackManager.createRollbackData(transaction);
      transaction.rollbackData = rollbackData;

      // Detect and resolve conflicts
      const conflicts = await this.conflictDetector.detectConflicts(transaction);
      if (conflicts.hasConflicts) {
        const resolutions = await this.conflictDetector.resolveConflicts(conflicts);
        // Add conflict resolutions to transaction
        for (const resolution of resolutions) {
          await this.addRefactoringOperation(transaction, resolution);
        }
      }

      // Execute transaction operations
      const applicationResult = await this.transactionManager.executeTransaction(transaction);
      
      // Update progress
      transaction.status.progress = 50;

      // Verify transaction integrity
      const integrityResult = await this.verifyTransactionIntegrity(transaction);
      if (!integrityResult.isValid) {
        // Rollback on integrity failure
        await this.rollbackRefactoring(transaction.transactionId);
        throw new Error(`Transaction integrity check failed: ${integrityResult.issues.join(', ')}`);
      }

      // Mark transaction as completed
      transaction.status.status = 'completed';
      transaction.status.progress = 100;

      return {
        success: applicationResult.success,
        affectedFiles: transaction.affectedFiles,
        changes: transaction.operations,
        rollbackId: rollbackData.transactionId
      };
    } catch (error) {
      // Mark transaction as failed and attempt rollback
      transaction.status.status = 'failed';
      transaction.status.message = error instanceof Error ? error.message : 'Unknown error';

      try {
        await this.rollbackRefactoring(transaction.transactionId);
      } catch (rollbackError) {
        console.error(`Rollback failed for transaction ${transaction.transactionId}:`, rollbackError);
      }

      throw new Error(`Refactoring execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async rollbackRefactoring(transactionId: string): Promise<RollbackResult> {
    try {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      if (!transaction.rollbackData) {
        throw new Error(`No rollback data available for transaction ${transactionId}`);
      }

      // Validate rollback data
      const rollbackValidation = await this.rollbackManager.validateRollback(transaction.rollbackData);
      if (!rollbackValidation.isValid) {
        throw new Error(`Rollback validation failed: ${rollbackValidation.errors.join(', ')}`);
      }

      // Execute rollback
      const rollbackResult = await this.rollbackManager.executeRollback(transaction.rollbackData);

      // Update transaction status
      transaction.status.status = 'rolled_back';
      transaction.status.message = 'Transaction rolled back successfully';

      return rollbackResult;
    } catch (error) {
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectConflicts(transaction: RefactoringTransaction): Promise<ConflictReport> {
    try {
      return await this.conflictDetector.detectConflicts(transaction);
    } catch (error) {
      throw new Error(`Conflict detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private async validateAtomicity(transaction: RefactoringTransaction): Promise<AtomicityValidation> {
    try {
      // Check for circular dependencies
      const dependencies = await this.analyzeDependencies(transaction);
      const circularDeps = this.detectCircularDependencies(dependencies);

      // Check for conflicting operations
      const conflicts = await this.detectOperationConflicts(transaction.operations);

      return {
        isAtomic: circularDeps.length === 0 && conflicts.length === 0,
        conflicts: [...circularDeps, ...conflicts],
        dependencies: dependencies.map(dep => dep.toString())
      };
    } catch (error) {
      return {
        isAtomic: false,
        conflicts: [`Atomicity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        dependencies: []
      };
    }
  }

  private async createRollbackData(transaction: RefactoringTransaction): Promise<RollbackData> {
    try {
      return await this.rollbackManager.createRollbackData(transaction);
    } catch (error) {
      throw new Error(`Failed to create rollback data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async applyTransactionOperations(transaction: RefactoringTransaction): Promise<ApplicationResult> {
    try {
      return await this.transactionManager.executeTransaction(transaction);
    } catch (error) {
      throw new Error(`Failed to apply transaction operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async verifyTransactionIntegrity(transaction: RefactoringTransaction): Promise<IntegrityResult> {
    try {
      // Verify that all operations were applied successfully
      const appliedOperations = transaction.operations.filter(op => 
        this.verifyOperationApplication(op)
      );

      // Check for data consistency
      const consistencyCheck = await this.checkDataConsistency(transaction);

      // Verify semantic correctness
      const semanticCheck = await this.checkSemanticCorrectness(transaction);

      const issues = [];
      if (appliedOperations.length !== transaction.operations.length) {
        issues.push(`Only ${appliedOperations.length} of ${transaction.operations.length} operations applied`);
      }

      if (!consistencyCheck.isConsistent) {
        issues.push(...consistencyCheck.issues);
      }

      if (!semanticCheck.isValid) {
        issues.push(...semanticCheck.errors);
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations: [
          ...(consistencyCheck.recommendations || []),
          ...(semanticCheck.suggestions || [])
        ]
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Integrity verification error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: []
      };
    }
  }

  private async analyzeDependencies(transaction: RefactoringTransaction): Promise<string[]> {
    // Analyze operation dependencies
    const dependencies: string[] = [];
    
    for (const operation of transaction.operations) {
      // Simple dependency analysis based on file and location
      const depKey = `${operation.location.uri}:${operation.location.range.start.line}`;
      dependencies.push(depKey);
    }

    return dependencies;
  }

  private detectCircularDependencies(dependencies: string[]): string[] {
    // Simple circular dependency detection
    const seen = new Set<string>();
    const circular: string[] = [];

    for (const dep of dependencies) {
      if (seen.has(dep)) {
        circular.push(`Circular dependency detected: ${dep}`);
      }
      seen.add(dep);
    }

    return circular;
  }

  private async detectOperationConflicts(operations: RefactoringOperation[]): Promise<string[]> {
    const conflicts: string[] = [];
    
    // Check for overlapping operations on the same location
    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const op1 = operations[i];
        const op2 = operations[j];
        
        if (this.operationsOverlap(op1, op2)) {
          conflicts.push(`Operations ${i} and ${j} overlap at ${op1.location.uri}`);
        }
      }
    }

    return conflicts;
  }

  private operationsOverlap(op1: RefactoringOperation, op2: RefactoringOperation): boolean {
    if (op1.location.uri !== op2.location.uri) {
      return false;
    }

    const range1 = op1.location.range;
    const range2 = op2.location.range;

    // Check if ranges overlap
    return !(
      range1.end.line < range2.start.line ||
      range2.end.line < range1.start.line ||
      (range1.end.line === range2.start.line && range1.end.character <= range2.start.character) ||
      (range2.end.line === range1.start.line && range2.end.character <= range1.start.character)
    );
  }

  private verifyOperationApplication(operation: RefactoringOperation): boolean {
    // Placeholder for operation application verification
    return true;
  }

  private async checkDataConsistency(transaction: RefactoringTransaction): Promise<{
    isConsistent: boolean;
    issues: string[];
    recommendations?: string[];
  }> {
    // Placeholder for data consistency check
    return {
      isConsistent: true,
      issues: [],
      recommendations: []
    };
  }

  private async checkSemanticCorrectness(transaction: RefactoringTransaction): Promise<ValidationResult> {
    // Placeholder for semantic correctness check
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }

  // Public utility methods
  getTransaction(transactionId: string): RefactoringTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  getAllTransactions(): RefactoringTransaction[] {
    return Array.from(this.transactions.values());
  }

  getActiveTransactions(): RefactoringTransaction[] {
    return Array.from(this.transactions.values()).filter(
      t => t.status.status === 'executing' || t.status.status === 'pending'
    );
  }

  async cleanupCompletedTransactions(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;

    for (const [id, transaction] of this.transactions.entries()) {
      if (
        (transaction.status.status === 'completed' || transaction.status.status === 'failed') &&
        transaction.rollbackData.timestamp < cutoff
      ) {
        this.transactions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}