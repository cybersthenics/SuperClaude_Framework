// SuperClaude Tasks Server - Project Memory Manager
// Semantic context preservation and cross-session state management

import {
  ProjectMemoryState,
  SemanticCache,
  SymbolIndex,
  AnalysisRecord,
  TaskRecord,
  PerformanceBaseline,
  ContextSnapshot,
  SymbolInfo,
  DependencyInfo,
  PatternInfo,
  FileInfo,
  ValidationError
} from '../types/working.js';
import { SimpleLogger, SimpleCache } from '../core/SimpleStubs.js';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectMemoryManager {
  private logger: SimpleLogger;
  private cache: SimpleCache;
  private memoryStates: Map<string, ProjectMemoryState> = new Map();
  private dataDir: string;

  constructor(dataDir: string = './data/memory') {
    this.logger = new SimpleLogger();
    this.cache = new SimpleCache();
    this.dataDir = dataDir;
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private getMemoryFilePath(projectId: string): string {
    return path.join(this.dataDir, `${projectId}.memory.json`);
  }

  // Create new project memory state
  async createProjectMemory(projectId: string): Promise<ProjectMemoryState> {
    try {
      const memoryState: ProjectMemoryState = {
        projectId,
        lastUpdated: new Date(),
        version: '1.0.0',
        semanticCache: this.createEmptySemanticCache(),
        symbolIndex: this.createEmptySymbolIndex(),
        analysisHistory: [],
        taskHistory: [],
        performanceBaseline: this.createEmptyPerformanceBaseline(),
        contextSnapshots: []
      };

      this.memoryStates.set(projectId, memoryState);
      await this.saveMemoryState(projectId, memoryState);
      
      this.logger.info(`Created project memory for ${projectId}`);
      return memoryState;
    } catch (error) {
      this.logger.error(`Failed to create project memory for ${projectId}:`, error);
      throw new ValidationError(`Failed to create project memory: ${(error as Error).message}`);
    }
  }

  // Load project memory state
  async loadProjectMemory(projectId: string): Promise<ProjectMemoryState> {
    try {
      // Check cache first
      const cacheKey = `memory:${projectId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Check memory states
      const memoryState = this.memoryStates.get(projectId);
      if (memoryState) {
        this.cache.set(cacheKey, memoryState);
        return memoryState;
      }

      // Load from disk
      const filePath = this.getMemoryFilePath(projectId);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const loadedState = JSON.parse(data);
        
        // Restore Date objects and Maps
        loadedState.lastUpdated = new Date(loadedState.lastUpdated);
        loadedState.semanticCache.lastUpdated = new Date(loadedState.semanticCache.lastUpdated);
        loadedState.symbolIndex.lastUpdated = new Date(loadedState.symbolIndex.lastUpdated);
        loadedState.performanceBaseline.lastUpdated = new Date(loadedState.performanceBaseline.lastUpdated);
        
        // Restore Maps from objects
        loadedState.semanticCache.symbols = new Map(Object.entries(loadedState.semanticCache.symbols || {}));
        loadedState.semanticCache.dependencies = new Map(Object.entries(loadedState.semanticCache.dependencies || {}));
        loadedState.semanticCache.patterns = new Map(Object.entries(loadedState.semanticCache.patterns || {}));
        loadedState.symbolIndex.files = new Map(Object.entries(loadedState.symbolIndex.files || {}));
        loadedState.symbolIndex.symbols = new Map(Object.entries(loadedState.symbolIndex.symbols || {}));
        
        this.memoryStates.set(projectId, loadedState);
        this.cache.set(cacheKey, loadedState);
        
        this.logger.info(`Loaded project memory for ${projectId}`);
        return loadedState;
      }

      // Create new if doesn't exist
      return await this.createProjectMemory(projectId);
    } catch (error) {
      this.logger.error(`Failed to load project memory for ${projectId}:`, error);
      throw new ValidationError(`Failed to load project memory: ${(error as Error).message}`);
    }
  }

  // Save project memory state
  async saveProjectMemory(projectId: string, memoryState?: ProjectMemoryState): Promise<void> {
    try {
      const state = memoryState || this.memoryStates.get(projectId);
      if (!state) {
        throw new ValidationError(`No memory state found for project ${projectId}`);
      }

      state.lastUpdated = new Date();
      await this.saveMemoryState(projectId, state);
      
      // Update cache
      const cacheKey = `memory:${projectId}`;
      this.cache.set(cacheKey, state);
      
      this.logger.info(`Saved project memory for ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to save project memory for ${projectId}:`, error);
      throw new ValidationError(`Failed to save project memory: ${(error as Error).message}`);
    }
  }

  // Add symbol to semantic cache
  async addSymbolInfo(projectId: string, symbol: SymbolInfo): Promise<void> {
    try {
      const memoryState = await this.loadProjectMemory(projectId);
      
      memoryState.semanticCache.symbols.set(symbol.name, {
        ...symbol,
        lastModified: new Date()
      });
      
      memoryState.symbolIndex.symbols.set(symbol.name, symbol);
      memoryState.semanticCache.lastUpdated = new Date();
      memoryState.symbolIndex.lastUpdated = new Date();
      
      await this.saveProjectMemory(projectId, memoryState);
    } catch (error) {
      this.logger.error(`Failed to add symbol info for ${projectId}:`, error);
      throw new ValidationError(`Failed to add symbol info: ${(error as Error).message}`);
    }
  }

  // Add dependency info
  async addDependencyInfo(projectId: string, dependency: DependencyInfo): Promise<void> {
    try {
      const memoryState = await this.loadProjectMemory(projectId);
      
      const key = `${dependency.source}:${dependency.target}`;
      memoryState.semanticCache.dependencies.set(key, {
        ...dependency,
        lastUpdated: new Date()
      });
      
      memoryState.semanticCache.lastUpdated = new Date();
      await this.saveProjectMemory(projectId, memoryState);
    } catch (error) {
      this.logger.error(`Failed to add dependency info for ${projectId}:`, error);
      throw new ValidationError(`Failed to add dependency info: ${(error as Error).message}`);
    }
  }

  // Add pattern info
  async addPatternInfo(projectId: string, pattern: PatternInfo): Promise<void> {
    try {
      const memoryState = await this.loadProjectMemory(projectId);
      
      memoryState.semanticCache.patterns.set(pattern.name, {
        ...pattern,
        lastDetected: new Date()
      });
      
      memoryState.semanticCache.lastUpdated = new Date();
      await this.saveProjectMemory(projectId, memoryState);
    } catch (error) {
      this.logger.error(`Failed to add pattern info for ${projectId}:`, error);
      throw new ValidationError(`Failed to add pattern info: ${(error as Error).message}`);
    }
  }

  // Add analysis record
  async addAnalysisRecord(projectId: string, analysis: Omit<AnalysisRecord, 'id'>): Promise<void> {
    try {
      const memoryState = await this.loadProjectMemory(projectId);
      
      const record: AnalysisRecord = {
        id: uuid(),
        ...analysis,
        timestamp: new Date()
      };
      
      memoryState.analysisHistory.push(record);
      
      // Keep only last 100 records
      if (memoryState.analysisHistory.length > 100) {
        memoryState.analysisHistory = memoryState.analysisHistory.slice(-100);
      }
      
      await this.saveProjectMemory(projectId, memoryState);
    } catch (error) {
      this.logger.error(`Failed to add analysis record for ${projectId}:`, error);
      throw new ValidationError(`Failed to add analysis record: ${(error as Error).message}`);
    }
  }

  // Add task record
  async addTaskRecord(projectId: string, taskRecord: Omit<TaskRecord, 'timestamp'>): Promise<void> {
    try {
      const memoryState = await this.loadProjectMemory(projectId);
      
      const record: TaskRecord = {
        ...taskRecord,
        timestamp: new Date()
      };
      
      memoryState.taskHistory.push(record);
      
      // Keep only last 1000 records
      if (memoryState.taskHistory.length > 1000) {
        memoryState.taskHistory = memoryState.taskHistory.slice(-1000);
      }
      
      await this.saveProjectMemory(projectId, memoryState);
    } catch (error) {
      this.logger.error(`Failed to add task record for ${projectId}:`, error);
      throw new ValidationError(`Failed to add task record: ${(error as Error).message}`);
    }
  }

  // Update performance baseline
  async updatePerformanceBaseline(projectId: string, metrics: Partial<PerformanceBaseline>): Promise<void> {
    try {
      const memoryState = await this.loadProjectMemory(projectId);
      
      memoryState.performanceBaseline = {
        ...memoryState.performanceBaseline,
        ...metrics,
        lastUpdated: new Date()
      };
      
      await this.saveProjectMemory(projectId, memoryState);
    } catch (error) {
      this.logger.error(`Failed to update performance baseline for ${projectId}:`, error);
      throw new ValidationError(`Failed to update performance baseline: ${(error as Error).message}`);
    }
  }

  // Get semantic cache
  async getSemanticCache(projectId: string): Promise<SemanticCache> {
    const memoryState = await this.loadProjectMemory(projectId);
    return memoryState.semanticCache;
  }

  // Get symbol index
  async getSymbolIndex(projectId: string): Promise<SymbolIndex> {
    const memoryState = await this.loadProjectMemory(projectId);
    return memoryState.symbolIndex;
  }

  // Get analysis history
  async getAnalysisHistory(projectId: string, limit: number = 50): Promise<AnalysisRecord[]> {
    const memoryState = await this.loadProjectMemory(projectId);
    return memoryState.analysisHistory.slice(-limit);
  }

  // Get task history
  async getTaskHistory(projectId: string, limit: number = 100): Promise<TaskRecord[]> {
    const memoryState = await this.loadProjectMemory(projectId);
    return memoryState.taskHistory.slice(-limit);
  }

  // Get performance baseline
  async getPerformanceBaseline(projectId: string): Promise<PerformanceBaseline> {
    const memoryState = await this.loadProjectMemory(projectId);
    return memoryState.performanceBaseline;
  }

  // Search patterns
  async searchPatterns(projectId: string, query: string): Promise<PatternInfo[]> {
    const memoryState = await this.loadProjectMemory(projectId);
    const patterns = Array.from(memoryState.semanticCache.patterns.values());
    
    return patterns.filter(pattern => 
      pattern.name.toLowerCase().includes(query.toLowerCase()) ||
      pattern.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Search symbols
  async searchSymbols(projectId: string, query: string): Promise<SymbolInfo[]> {
    const memoryState = await this.loadProjectMemory(projectId);
    const symbols = Array.from(memoryState.semanticCache.symbols.values());
    
    return symbols.filter(symbol => 
      symbol.name.toLowerCase().includes(query.toLowerCase()) ||
      symbol.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Clear project memory
  async clearProjectMemory(projectId: string): Promise<void> {
    try {
      this.memoryStates.delete(projectId);
      this.cache.delete(`memory:${projectId}`);
      
      const filePath = this.getMemoryFilePath(projectId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      this.logger.info(`Cleared project memory for ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to clear project memory for ${projectId}:`, error);
      throw new ValidationError(`Failed to clear project memory: ${(error as Error).message}`);
    }
  }

  // Private helper methods
  private async saveMemoryState(projectId: string, state: ProjectMemoryState): Promise<void> {
    const filePath = this.getMemoryFilePath(projectId);
    
    // Convert Maps to objects for JSON serialization
    const serializableState = {
      ...state,
      semanticCache: {
        ...state.semanticCache,
        symbols: Object.fromEntries(state.semanticCache.symbols),
        dependencies: Object.fromEntries(state.semanticCache.dependencies),
        patterns: Object.fromEntries(state.semanticCache.patterns)
      },
      symbolIndex: {
        ...state.symbolIndex,
        files: Object.fromEntries(state.symbolIndex.files),
        symbols: Object.fromEntries(state.symbolIndex.symbols)
      }
    };
    
    fs.writeFileSync(filePath, JSON.stringify(serializableState, null, 2));
  }

  private createEmptySemanticCache(): SemanticCache {
    return {
      symbols: new Map(),
      dependencies: new Map(),
      patterns: new Map(),
      lastUpdated: new Date()
    };
  }

  private createEmptySymbolIndex(): SymbolIndex {
    return {
      files: new Map(),
      symbols: new Map(),
      lastUpdated: new Date(),
      version: '1.0.0'
    };
  }

  private createEmptyPerformanceBaseline(): PerformanceBaseline {
    return {
      averageTaskTime: 0,
      estimationAccuracy: 0,
      resourceUtilization: 0,
      throughput: 0,
      lastUpdated: new Date()
    };
  }
}