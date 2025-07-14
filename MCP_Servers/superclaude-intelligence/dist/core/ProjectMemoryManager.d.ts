import { ProjectMemoryState, IntelligenceServerConfig, MemoryChange, ProjectInsight, RetentionPolicy, SerializedContext, CompressedState, ValidationResult } from '../types/index.js';
export interface MemoryChange {
    type: 'symbol_added' | 'symbol_removed' | 'symbol_updated' | 'analysis_added' | 'context_updated';
    data: any;
    timestamp: Date;
}
export interface ProjectInsight {
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    timestamp: Date;
    metadata: Record<string, any>;
}
export interface RetentionPolicy {
    maxAgeMs: number;
    maxSize: number;
    cleanupThreshold: number;
}
export interface SerializedContext {
    version: string;
    data: Buffer;
    metadata: Record<string, any>;
}
export interface CompressedState {
    originalSize: number;
    compressedSize: number;
    data: Buffer;
    checksum: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class ProjectMemoryManager {
    private config;
    private memoryStore;
    private persistenceQueue;
    private isPersisting;
    private memoryDir;
    private cacheManager;
    private cleanupInterval;
    constructor(config: IntelligenceServerConfig['projectMemory']);
    saveProjectMemory(projectId: string, state: ProjectMemoryState): Promise<void>;
    loadProjectMemory(projectId: string): Promise<ProjectMemoryState | null>;
    updateMemoryIncremental(projectId: string, changes: MemoryChange[]): Promise<void>;
    getProjectInsights(projectId: string): Promise<ProjectInsight[]>;
    cleanupMemory(projectId: string, retentionPolicy: RetentionPolicy): Promise<void>;
    serializeContext(context: any): Promise<SerializedContext>;
    deserializeContext(serialized: SerializedContext): Promise<any>;
    compressMemory(state: ProjectMemoryState): Promise<CompressedState>;
    validateMemoryIntegrity(state: ProjectMemoryState): Promise<ValidationResult>;
    private initializeStorage;
    private startPeriodicPersistence;
    private startCleanupSchedule;
    private processPersistenceQueue;
    private persistMemoryState;
    private validateMemoryState;
    private applyMemoryChange;
    private runScheduledCleanup;
    private getMemoryFilePath;
    saveProjectContext(projectId: string, context: any, options?: any): Promise<any>;
    loadProjectContext(projectId: string, options?: any): Promise<any>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ProjectMemoryManager.d.ts.map