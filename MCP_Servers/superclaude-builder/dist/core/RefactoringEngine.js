export class RefactoringEngine {
    transactionManager;
    conflictDetector;
    rollbackManager;
    previewGenerator;
    transactions = new Map();
    constructor(transactionManager, conflictDetector, rollbackManager, previewGenerator) {
        this.transactionManager = transactionManager;
        this.conflictDetector = conflictDetector;
        this.rollbackManager = rollbackManager;
        this.previewGenerator = previewGenerator;
    }
    async startRefactoringTransaction(scope) {
        try {
            const transaction = await this.transactionManager.createTransaction(scope);
            this.transactions.set(transaction.transactionId, transaction);
            return transaction;
        }
        catch (error) {
            throw new Error(`Failed to start refactoring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async addRefactoringOperation(transaction, operation) {
        try {
            await this.transactionManager.addOperation(transaction, operation);
            this.transactions.set(transaction.transactionId, transaction);
        }
        catch (error) {
            throw new Error(`Failed to add refactoring operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async previewRefactoring(transaction) {
        try {
            const validation = await this.transactionManager.validateTransaction(transaction);
            if (!validation.isValid) {
                throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
            }
            const conflicts = await this.conflictDetector.detectConflicts(transaction);
            if (conflicts.hasConflicts) {
                console.warn(`Conflicts detected in transaction ${transaction.transactionId}:`, conflicts);
            }
            const preview = await this.previewGenerator.generatePreview(transaction);
            return {
                ...preview,
                potentialIssues: conflicts.hasConflicts
                    ? [...(preview.potentialIssues || []), ...conflicts.conflicts.map(c => c.description)]
                    : preview.potentialIssues || []
            };
        }
        catch (error) {
            throw new Error(`Failed to generate refactoring preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeRefactoring(transaction) {
        try {
            transaction.status.status = 'executing';
            transaction.status.progress = 0;
            const atomicityCheck = await this.validateAtomicity(transaction);
            if (!atomicityCheck.isAtomic) {
                throw new Error(`Transaction is not atomic: ${atomicityCheck.conflicts.join(', ')}`);
            }
            const rollbackData = await this.rollbackManager.createRollbackData(transaction);
            transaction.rollbackData = rollbackData;
            const conflicts = await this.conflictDetector.detectConflicts(transaction);
            if (conflicts.hasConflicts) {
                const resolutions = await this.conflictDetector.resolveConflicts(conflicts);
                for (const resolution of resolutions) {
                    await this.addRefactoringOperation(transaction, resolution);
                }
            }
            const applicationResult = await this.transactionManager.executeTransaction(transaction);
            transaction.status.progress = 50;
            const integrityResult = await this.verifyTransactionIntegrity(transaction);
            if (!integrityResult.isValid) {
                await this.rollbackRefactoring(transaction.transactionId);
                throw new Error(`Transaction integrity check failed: ${integrityResult.issues.join(', ')}`);
            }
            transaction.status.status = 'completed';
            transaction.status.progress = 100;
            return {
                success: applicationResult.success,
                affectedFiles: transaction.affectedFiles,
                changes: transaction.operations,
                rollbackId: rollbackData.transactionId
            };
        }
        catch (error) {
            transaction.status.status = 'failed';
            transaction.status.message = error instanceof Error ? error.message : 'Unknown error';
            try {
                await this.rollbackRefactoring(transaction.transactionId);
            }
            catch (rollbackError) {
                console.error(`Rollback failed for transaction ${transaction.transactionId}:`, rollbackError);
            }
            throw new Error(`Refactoring execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async rollbackRefactoring(transactionId) {
        try {
            const transaction = this.transactions.get(transactionId);
            if (!transaction) {
                throw new Error(`Transaction ${transactionId} not found`);
            }
            if (!transaction.rollbackData) {
                throw new Error(`No rollback data available for transaction ${transactionId}`);
            }
            const rollbackValidation = await this.rollbackManager.validateRollback(transaction.rollbackData);
            if (!rollbackValidation.isValid) {
                throw new Error(`Rollback validation failed: ${rollbackValidation.errors.join(', ')}`);
            }
            const rollbackResult = await this.rollbackManager.executeRollback(transaction.rollbackData);
            transaction.status.status = 'rolled_back';
            transaction.status.message = 'Transaction rolled back successfully';
            return rollbackResult;
        }
        catch (error) {
            throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async detectConflicts(transaction) {
        try {
            return await this.conflictDetector.detectConflicts(transaction);
        }
        catch (error) {
            throw new Error(`Conflict detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validateAtomicity(transaction) {
        try {
            const dependencies = await this.analyzeDependencies(transaction);
            const circularDeps = this.detectCircularDependencies(dependencies);
            const conflicts = await this.detectOperationConflicts(transaction.operations);
            return {
                isAtomic: circularDeps.length === 0 && conflicts.length === 0,
                conflicts: [...circularDeps, ...conflicts],
                dependencies: dependencies.map(dep => dep.toString())
            };
        }
        catch (error) {
            return {
                isAtomic: false,
                conflicts: [`Atomicity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                dependencies: []
            };
        }
    }
    async createRollbackData(transaction) {
        try {
            return await this.rollbackManager.createRollbackData(transaction);
        }
        catch (error) {
            throw new Error(`Failed to create rollback data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async applyTransactionOperations(transaction) {
        try {
            return await this.transactionManager.executeTransaction(transaction);
        }
        catch (error) {
            throw new Error(`Failed to apply transaction operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyTransactionIntegrity(transaction) {
        try {
            const appliedOperations = transaction.operations.filter(op => this.verifyOperationApplication(op));
            const consistencyCheck = await this.checkDataConsistency(transaction);
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
        }
        catch (error) {
            return {
                isValid: false,
                issues: [`Integrity verification error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                recommendations: []
            };
        }
    }
    async analyzeDependencies(transaction) {
        const dependencies = [];
        for (const operation of transaction.operations) {
            const depKey = `${operation.location.uri}:${operation.location.range.start.line}`;
            dependencies.push(depKey);
        }
        return dependencies;
    }
    detectCircularDependencies(dependencies) {
        const seen = new Set();
        const circular = [];
        for (const dep of dependencies) {
            if (seen.has(dep)) {
                circular.push(`Circular dependency detected: ${dep}`);
            }
            seen.add(dep);
        }
        return circular;
    }
    async detectOperationConflicts(operations) {
        const conflicts = [];
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
    operationsOverlap(op1, op2) {
        if (op1.location.uri !== op2.location.uri) {
            return false;
        }
        const range1 = op1.location.range;
        const range2 = op2.location.range;
        return !(range1.end.line < range2.start.line ||
            range2.end.line < range1.start.line ||
            (range1.end.line === range2.start.line && range1.end.character <= range2.start.character) ||
            (range2.end.line === range1.start.line && range2.end.character <= range1.start.character));
    }
    verifyOperationApplication(operation) {
        return true;
    }
    async checkDataConsistency(transaction) {
        return {
            isConsistent: true,
            issues: [],
            recommendations: []
        };
    }
    async checkSemanticCorrectness(transaction) {
        return {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };
    }
    getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }
    getAllTransactions() {
        return Array.from(this.transactions.values());
    }
    getActiveTransactions() {
        return Array.from(this.transactions.values()).filter(t => t.status.status === 'executing' || t.status.status === 'pending');
    }
    async cleanupCompletedTransactions(olderThanMs = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        let cleaned = 0;
        for (const [id, transaction] of this.transactions.entries()) {
            if ((transaction.status.status === 'completed' || transaction.status.status === 'failed') &&
                transaction.rollbackData.timestamp < cutoff) {
                this.transactions.delete(id);
                cleaned++;
            }
        }
        return cleaned;
    }
}
//# sourceMappingURL=RefactoringEngine.js.map