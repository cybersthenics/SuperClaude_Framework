export interface LogMetadata {
    persona?: string;
    operation?: string;
    chainId?: string;
    stepNumber?: number;
    confidence?: number;
    executionTime?: number;
    [key: string]: any;
}
export declare class Logger {
    private logger;
    private component;
    constructor(component?: string);
    debug(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, error?: Error | any, metadata?: LogMetadata): void;
    logPersonaActivation(persona: string, context: any, result: any, metadata?: LogMetadata): void;
    logCollaboration(personas: string[], mode: string, result: any, metadata?: LogMetadata): void;
    logChainExecution(chainId: string, steps: any[], results: any[], metadata?: LogMetadata): void;
    logPerformance(operation: string, executionTime: number, metadata?: LogMetadata): void;
    logExpertiseSharing(fromPersona: string, toPersona: string, expertise: any, success: boolean, metadata?: LogMetadata): void;
    logAutoActivation(persona: string, confidence: number, reasoning: string, activated: boolean, metadata?: LogMetadata): void;
    logConflictResolution(conflictId: string, participants: string[], resolution: any, metadata?: LogMetadata): void;
    logContextPreservation(chainId: string, preservationScore: number, preservedElements: string[], metadata?: LogMetadata): void;
    logValidation(operation: string, isValid: boolean, issues: string[], recommendations: string[], metadata?: LogMetadata): void;
    logSystemHealth(component: string, status: string, metrics: any, metadata?: LogMetadata): void;
    createChildLogger(childComponent: string): Logger;
    setLevel(level: string): void;
    getLevel(): string;
    close(): void;
}
//# sourceMappingURL=Logger.d.ts.map