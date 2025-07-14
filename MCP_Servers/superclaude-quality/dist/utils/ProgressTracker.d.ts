export interface ProgressUpdate {
    totalSteps: number;
    completedSteps: number;
    currentStep: string;
    percentage: number;
    estimatedTimeRemaining: number;
    elapsedTime: number;
}
export interface GateProgress {
    gateName: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
}
export declare class ProgressTracker {
    private totalSteps;
    private completedSteps;
    private currentStep;
    private startTime;
    private gateProgress;
    private logger;
    private progressCallbacks;
    constructor();
    start(totalSteps: number): void;
    updateProgress(completedSteps: number, currentStep?: string): void;
    updateGateProgress(gateName: string, progress: number): void;
    startGate(gateName: string): void;
    completeGate(gateName: string): void;
    failGate(gateName: string, error?: string): void;
    complete(): void;
    fail(reason: string): void;
    getCurrentProgress(): ProgressUpdate;
    getGateProgress(): GateProgress[];
    getProgressSummary(): Record<string, any>;
    onProgress(callback: (update: ProgressUpdate) => void): void;
    offProgress(callback: (update: ProgressUpdate) => void): void;
    private getPercentage;
    private getElapsedTime;
    private getEstimatedTimeRemaining;
    private notifyProgress;
}
//# sourceMappingURL=ProgressTracker.d.ts.map