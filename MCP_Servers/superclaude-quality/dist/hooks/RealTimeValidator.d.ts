import { HookContext } from '../types/index.js';
import { RealTimeValidationResult } from '../core/QualityOrchestrator.js';
export interface FastValidationRule {
    name: string;
    pattern: RegExp | string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    message: string;
    suggestion: string;
}
export declare class RealTimeValidator {
    private logger;
    private preOperationRules;
    private postOperationRules;
    constructor();
    validatePreOperation(hookContext: HookContext): Promise<RealTimeValidationResult>;
    validatePostOperation(hookContext: HookContext): Promise<RealTimeValidationResult>;
    private validateFileWithRules;
    private applyRule;
    private validateOperation;
    private validateOperationSideEffects;
    private initializeValidationRules;
    private generateQuickRecommendations;
    private determineValidationStatus;
    private createErrorResult;
    private readFileContent;
    private fileExists;
    private quickSyntaxCheck;
    private getLineNumber;
    private getLineStart;
}
//# sourceMappingURL=RealTimeValidator.d.ts.map