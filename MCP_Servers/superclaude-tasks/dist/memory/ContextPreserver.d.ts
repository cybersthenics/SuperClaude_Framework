import { ContextSnapshot } from '../types/working.js';
import { ProjectMemoryManager } from './ProjectMemoryManager.js';
export interface ContextData {
    type: string;
    data: any;
    timestamp: Date;
    metadata: Record<string, any>;
}
export interface CompressionOptions {
    enabled: boolean;
    level: number;
    threshold: number;
}
export interface SerializationOptions {
    includeMetadata: boolean;
    compression: CompressionOptions;
    maxSize: number;
}
export declare class ContextPreserver {
    private logger;
    private memoryManager;
    private snapshotDir;
    private defaultOptions;
    constructor(memoryManager: ProjectMemoryManager, snapshotDir?: string);
    private ensureSnapshotDirectory;
    private getSnapshotFilePath;
    createContextSnapshot(projectId: string, contextData: ContextData[], description?: string, options?: Partial<SerializationOptions>): Promise<ContextSnapshot>;
    loadContextSnapshot(projectId: string, snapshotId: string): Promise<ContextData[]>;
    listContextSnapshots(projectId: string): Promise<ContextSnapshot[]>;
    deleteContextSnapshot(projectId: string, snapshotId: string): Promise<void>;
    serializeContextData(contextData: ContextData[], options?: Partial<SerializationOptions>): Promise<string>;
    deserializeContextData(serializedData: string, compressed?: boolean): Promise<ContextData[]>;
    createIncrementalSnapshot(projectId: string, contextData: ContextData[], baseSnapshotId?: string, description?: string): Promise<ContextSnapshot>;
    restoreFromIncrementalSnapshots(projectId: string, snapshotIds: string[]): Promise<ContextData[]>;
    getSnapshotStatistics(projectId: string): Promise<{
        totalSnapshots: number;
        totalSize: number;
        averageSize: number;
        oldestSnapshot?: Date;
        newestSnapshot?: Date;
        compressionRatio: number;
    }>;
    private deleteSnapshot;
    private compressData;
    private decompressData;
    private calculateIncrementalChanges;
    private mergeContextData;
}
//# sourceMappingURL=ContextPreserver.d.ts.map