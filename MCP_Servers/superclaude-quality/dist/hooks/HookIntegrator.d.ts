import { HookContext, ValidationTarget, QualityIssue, QualityRecommendation } from '../types/index.js';
import { RealTimeValidationResult } from '../core/QualityOrchestrator.js';
export interface HookResult {
    success: boolean;
    validationResult?: RealTimeValidationResult;
    message: string;
    metadata: Record<string, any>;
}
export interface QualityFeedback {
    issues: QualityIssue[];
    recommendations: QualityRecommendation[];
    score: number;
    actionable: boolean;
}
export interface HookClient {
    sendHookResponse(hookType: string, result: HookResult): Promise<void>;
    subscribeToHooks(callback: (hookContext: HookContext) => Promise<void>): Promise<void>;
    unsubscribeFromHooks(): Promise<void>;
}
export declare class HookIntegrator {
    private hookClient;
    private realTimeValidator;
    private validationCache;
    private logger;
    private isRealTimeEnabled;
    private activeTargets;
    constructor();
    handlePreToolUseHook(hookContext: HookContext): Promise<HookResult>;
    handlePostToolUseHook(hookContext: HookContext): Promise<HookResult>;
    handleStopHook(hookContext: HookContext): Promise<HookResult>;
    enableRealTimeValidation(target: ValidationTarget): Promise<void>;
    disableRealTimeValidation(target: ValidationTarget): Promise<void>;
    private initializeHookSubscriptions;
    private validateToolOperation;
    private getOperationValidationRules;
    private generateQualityFeedback;
    private updateQualityMetrics;
    private cacheValidationResults;
    private generateSessionQualityReport;
    private getTopIssues;
    private getSessionRecommendations;
}
//# sourceMappingURL=HookIntegrator.d.ts.map