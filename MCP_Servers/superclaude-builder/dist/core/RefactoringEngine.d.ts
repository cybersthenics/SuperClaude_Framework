import { RefactoringTransaction, RefactoringOperation, RefactoringScope, RefactoringResult, RefactoringPreview, RollbackResult, ConflictReport, RollbackData, ApplicationResult, ValidationResult } from '../types/index.js';
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
export declare class RefactoringEngine {
    private transactionManager;
    private conflictDetector;
    private rollbackManager;
    private previewGenerator;
    private transactions;
    constructor(transactionManager: TransactionManager, conflictDetector: ConflictDetector, rollbackManager: RollbackManager, previewGenerator: PreviewGenerator);
    startRefactoringTransaction(scope: RefactoringScope): Promise<RefactoringTransaction>;
    addRefactoringOperation(transaction: RefactoringTransaction, operation: RefactoringOperation): Promise<void>;
    previewRefactoring(transaction: RefactoringTransaction): Promise<RefactoringPreview>;
    executeRefactoring(transaction: RefactoringTransaction): Promise<RefactoringResult>;
    rollbackRefactoring(transactionId: string): Promise<RollbackResult>;
    detectConflicts(transaction: RefactoringTransaction): Promise<ConflictReport>;
    private validateAtomicity;
    private createRollbackData;
    private applyTransactionOperations;
    private verifyTransactionIntegrity;
    private analyzeDependencies;
    private detectCircularDependencies;
    private detectOperationConflicts;
    private operationsOverlap;
    private verifyOperationApplication;
    private checkDataConsistency;
    private checkSemanticCorrectness;
    getTransaction(transactionId: string): RefactoringTransaction | undefined;
    getAllTransactions(): RefactoringTransaction[];
    getActiveTransactions(): RefactoringTransaction[];
    cleanupCompletedTransactions(olderThanMs?: number): Promise<number>;
}
//# sourceMappingURL=RefactoringEngine.d.ts.map