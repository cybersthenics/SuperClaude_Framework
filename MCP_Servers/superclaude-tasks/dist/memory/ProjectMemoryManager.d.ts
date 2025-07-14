import { ProjectMemoryState, SemanticCache, SymbolIndex, AnalysisRecord, TaskRecord, PerformanceBaseline, SymbolInfo, DependencyInfo, PatternInfo } from '../types/working.js';
export declare class ProjectMemoryManager {
    private logger;
    private cache;
    private memoryStates;
    private dataDir;
    constructor(dataDir?: string);
    private ensureDataDirectory;
    private getMemoryFilePath;
    createProjectMemory(projectId: string): Promise<ProjectMemoryState>;
    loadProjectMemory(projectId: string): Promise<ProjectMemoryState>;
    saveProjectMemory(projectId: string, memoryState?: ProjectMemoryState): Promise<void>;
    addSymbolInfo(projectId: string, symbol: SymbolInfo): Promise<void>;
    addDependencyInfo(projectId: string, dependency: DependencyInfo): Promise<void>;
    addPatternInfo(projectId: string, pattern: PatternInfo): Promise<void>;
    addAnalysisRecord(projectId: string, analysis: Omit<AnalysisRecord, 'id'>): Promise<void>;
    addTaskRecord(projectId: string, taskRecord: Omit<TaskRecord, 'timestamp'>): Promise<void>;
    updatePerformanceBaseline(projectId: string, metrics: Partial<PerformanceBaseline>): Promise<void>;
    getSemanticCache(projectId: string): Promise<SemanticCache>;
    getSymbolIndex(projectId: string): Promise<SymbolIndex>;
    getAnalysisHistory(projectId: string, limit?: number): Promise<AnalysisRecord[]>;
    getTaskHistory(projectId: string, limit?: number): Promise<TaskRecord[]>;
    getPerformanceBaseline(projectId: string): Promise<PerformanceBaseline>;
    searchPatterns(projectId: string, query: string): Promise<PatternInfo[]>;
    searchSymbols(projectId: string, query: string): Promise<SymbolInfo[]>;
    clearProjectMemory(projectId: string): Promise<void>;
    private saveMemoryState;
    private createEmptySemanticCache;
    private createEmptySymbolIndex;
    private createEmptyPerformanceBaseline;
}
//# sourceMappingURL=ProjectMemoryManager.d.ts.map