/**
 * ProjectMemoryManager - Cross-session persistence of semantic analysis state
 * Manages project context, symbol indexes, and analysis history
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { 
  ProjectMemoryState, 
  SymbolIndex, 
  TypeCache, 
  DependencyGraph,
  AnalysisRecord,
  ContextSnapshot,
  SnapshotMetadata,
  IntelligenceServerConfig,
  MemoryChange,
  ProjectInsight,
  RetentionPolicy,
  SerializedContext,
  CompressedState,
  ValidationResult
} from '../types/index.js';
import { logger } from '../services/Logger.js';
import { CacheManager } from '../services/SharedStubs.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

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

export class ProjectMemoryManager {
  private memoryStore: Map<string, ProjectMemoryState> = new Map();
  private persistenceQueue: Map<string, ProjectMemoryState> = new Map();
  private isPersisting = false;
  private memoryDir: string;
  private cacheManager: CacheManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private config: IntelligenceServerConfig['projectMemory']) {
    this.memoryDir = path.join(process.cwd(), 'memory');
    this.cacheManager = new CacheManager({
      maxSize: 100,
      ttl: 300000 // 5 minutes
    });
    
    this.initializeStorage();
    this.startPeriodicPersistence();
    this.startCleanupSchedule();
  }

  async saveProjectMemory(projectId: string, state: ProjectMemoryState): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate state
      const validation = await this.validateMemoryState(state);
      if (!validation.isValid) {
        throw new Error(`Invalid memory state: ${validation.errors.join(', ')}`);
      }

      // Update in-memory store
      this.memoryStore.set(projectId, state);
      
      // Queue for persistence
      this.persistenceQueue.set(projectId, state);
      
      // Trigger persistence if not already running
      if (!this.isPersisting) {
        this.processPersistenceQueue();
      }

      logger.debug(`Project memory saved for ${projectId}`, {
        symbolCount: state.symbolIndex?.size || 0,
        typeCount: state.typeCache?.size || 0,
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      logger.error(`Failed to save project memory for ${projectId}`, error);
      throw error;
    }
  }

  async loadProjectMemory(projectId: string): Promise<ProjectMemoryState | null> {
    const startTime = Date.now();
    
    try {
      // Check in-memory store first
      const memoryState = this.memoryStore.get(projectId);
      if (memoryState) {
        return memoryState;
      }

      // Check cache
      const cached = this.cacheManager.get<ProjectMemoryState>(`memory:${projectId}`);
      if (cached) {
        return cached;
      }

      // Load from disk
      const filePath = this.getMemoryFilePath(projectId);
      
      try {
        const fileContent = await fs.readFile(filePath);
        const compressed = JSON.parse(fileContent.toString());
        const decompressed = await gunzipAsync(Buffer.from(compressed.data, 'base64'));
        const state = JSON.parse(decompressed.toString()) as ProjectMemoryState;
        
        // Validate loaded state
        const validation = await this.validateMemoryState(state);
        if (!validation.isValid) {
          logger.warn(`Loaded memory state has issues for ${projectId}`, validation.warnings);
        }

        // Store in memory and cache
        this.memoryStore.set(projectId, state);
        this.cacheManager.set(`memory:${projectId}`, state);

        logger.debug(`Project memory loaded for ${projectId}`, {
          symbolCount: state.symbolIndex?.size || 0,
          typeCount: state.typeCache?.size || 0,
          executionTime: Date.now() - startTime
        });

        return state;
      } catch (fileError) {
        logger.debug(`No memory file found for ${projectId}`);
        return null;
      }
    } catch (error) {
      logger.error(`Failed to load project memory for ${projectId}`, error);
      return null;
    }
  }

  async updateMemoryIncremental(projectId: string, changes: MemoryChange[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      let state = this.memoryStore.get(projectId);
      if (!state) {
        state = await this.loadProjectMemory(projectId);
        if (!state) {
          logger.warn(`No existing memory state found for incremental update: ${projectId}`);
          return;
        }
      }

      // Apply changes
      for (const change of changes) {
        await this.applyMemoryChange(state, change);
      }

      // Update timestamp
      state.lastUpdated = new Date();

      // Save updated state
      await this.saveProjectMemory(projectId, state);

      logger.debug(`Incremental memory update applied for ${projectId}`, {
        changeCount: changes.length,
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      logger.error(`Failed to update memory incrementally for ${projectId}`, error);
      throw error;
    }
  }

  async getProjectInsights(projectId: string): Promise<ProjectInsight[]> {
    const startTime = Date.now();
    
    try {
      const state = await this.loadProjectMemory(projectId);
      if (!state) {
        return [];
      }

      const insights: ProjectInsight[] = [];

      // Generate insights from analysis history
      const recentAnalyses = state.analysisHistory.slice(-10);
      
      // Performance insights
      const avgExecutionTime = recentAnalyses.reduce((sum, analysis) => 
        sum + analysis.performance.duration, 0) / recentAnalyses.length;
      
      if (avgExecutionTime > 1000) {
        insights.push({
          id: `performance-${projectId}`,
          type: 'performance',
          title: 'Slow Analysis Performance',
          description: `Average analysis time is ${avgExecutionTime.toFixed(0)}ms, consider optimization`,
          confidence: 0.8,
          timestamp: new Date(),
          metadata: {
            avgExecutionTime,
            analysisCount: recentAnalyses.length
          }
        });
      }

      // Symbol growth insights
      if (state.symbolIndex && state.symbolIndex.size > 10000) {
        insights.push({
          id: `symbols-${projectId}`,
          type: 'scale',
          title: 'Large Symbol Index',
          description: `Project has ${state.symbolIndex.size} symbols, consider modularization`,
          confidence: 0.7,
          timestamp: new Date(),
          metadata: {
            symbolCount: state.symbolIndex.size
          }
        });
      }

      // Cache efficiency insights
      const cacheHitRates = recentAnalyses.map(a => a.performance.cacheHitRate);
      const avgCacheHitRate = cacheHitRates.reduce((sum, rate) => sum + rate, 0) / cacheHitRates.length;
      
      if (avgCacheHitRate < 0.5) {
        insights.push({
          id: `cache-${projectId}`,
          type: 'performance',
          title: 'Low Cache Hit Rate',
          description: `Cache hit rate is ${(avgCacheHitRate * 100).toFixed(1)}%, consider cache optimization`,
          confidence: 0.6,
          timestamp: new Date(),
          metadata: {
            avgCacheHitRate,
            analysisCount: recentAnalyses.length
          }
        });
      }

      logger.debug(`Generated ${insights.length} insights for ${projectId}`, {
        executionTime: Date.now() - startTime
      });

      return insights;
    } catch (error) {
      logger.error(`Failed to generate insights for ${projectId}`, error);
      return [];
    }
  }

  async cleanupMemory(projectId: string, retentionPolicy: RetentionPolicy): Promise<void> {
    const startTime = Date.now();
    
    try {
      const state = await this.loadProjectMemory(projectId);
      if (!state) {
        return;
      }

      let cleaned = false;

      // Clean old analysis records
      const cutoffTime = new Date(Date.now() - retentionPolicy.maxAgeMs);
      const originalCount = state.analysisHistory.length;
      state.analysisHistory = state.analysisHistory.filter(
        analysis => analysis.timestamp > cutoffTime
      );
      
      if (state.analysisHistory.length < originalCount) {
        cleaned = true;
        logger.debug(`Cleaned ${originalCount - state.analysisHistory.length} old analysis records`);
      }

      // Clean old context snapshots
      const originalSnapshots = state.contextPreservation.length;
      state.contextPreservation = state.contextPreservation.filter(
        snapshot => snapshot.timestamp > cutoffTime
      );
      
      if (state.contextPreservation.length < originalSnapshots) {
        cleaned = true;
        logger.debug(`Cleaned ${originalSnapshots - state.contextPreservation.length} old context snapshots`);
      }

      // Clean up symbol index if too large
      if (state.symbolIndex && state.symbolIndex.size > retentionPolicy.maxSize) {
        // Remove least recently used symbols
        const symbolEntries = Array.from(state.symbolIndex.symbols.entries());
        const sortedEntries = symbolEntries.sort((a, b) => {
          // Sort by usage frequency (simplified)
          const aRefs = a[1].references.length;
          const bRefs = b[1].references.length;
          return aRefs - bRefs;
        });

        const keepCount = Math.floor(retentionPolicy.maxSize * 0.8);
        const keptEntries = sortedEntries.slice(-keepCount);
        
        state.symbolIndex.symbols = new Map(keptEntries);
        state.symbolIndex.size = keptEntries.length;
        cleaned = true;
        
        logger.debug(`Cleaned symbol index from ${symbolEntries.length} to ${keptEntries.length} symbols`);
      }

      if (cleaned) {
        state.lastUpdated = new Date();
        await this.saveProjectMemory(projectId, state);
      }

      logger.debug(`Memory cleanup completed for ${projectId}`, {
        executionTime: Date.now() - startTime,
        changesApplied: cleaned
      });
    } catch (error) {
      logger.error(`Failed to cleanup memory for ${projectId}`, error);
      throw error;
    }
  }

  async serializeContext(context: any): Promise<SerializedContext> {
    try {
      const jsonData = JSON.stringify(context);
      const compressed = await gzipAsync(Buffer.from(jsonData));
      
      return {
        version: '1.0',
        data: compressed,
        metadata: {
          originalSize: jsonData.length,
          compressedSize: compressed.length,
          compressionRatio: compressed.length / jsonData.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to serialize context', error);
      throw error;
    }
  }

  async deserializeContext(serialized: SerializedContext): Promise<any> {
    try {
      const decompressed = await gunzipAsync(serialized.data);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      logger.error('Failed to deserialize context', error);
      throw error;
    }
  }

  async compressMemory(state: ProjectMemoryState): Promise<CompressedState> {
    try {
      const jsonData = JSON.stringify(state);
      const compressed = await gzipAsync(Buffer.from(jsonData));
      const checksum = createHash('sha256').update(compressed).digest('hex');
      
      return {
        originalSize: jsonData.length,
        compressedSize: compressed.length,
        data: compressed,
        checksum
      };
    } catch (error) {
      logger.error('Failed to compress memory', error);
      throw error;
    }
  }

  async validateMemoryIntegrity(state: ProjectMemoryState): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate basic structure
      if (!state.projectId) {
        errors.push('Missing project ID');
      }

      if (!state.lastUpdated) {
        errors.push('Missing last updated timestamp');
      }

      // Validate symbol index
      if (state.symbolIndex) {
        if (state.symbolIndex.size !== state.symbolIndex.symbols.size) {
          warnings.push('Symbol index size mismatch');
        }

        if (!state.symbolIndex.lastUpdate) {
          warnings.push('Symbol index missing last update timestamp');
        }
      }

      // Validate type cache
      if (state.typeCache) {
        if (state.typeCache.size !== state.typeCache.types.size) {
          warnings.push('Type cache size mismatch');
        }
      }

      // Validate analysis history
      if (state.analysisHistory) {
        for (let i = 0; i < state.analysisHistory.length; i++) {
          const analysis = state.analysisHistory[i];
          if (!analysis.id || !analysis.timestamp) {
            warnings.push(`Analysis record ${i} missing required fields`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
      logger.debug(`Memory storage initialized at ${this.memoryDir}`);
    } catch (error) {
      logger.error('Failed to initialize memory storage', error);
      throw error;
    }
  }

  private startPeriodicPersistence(): void {
    if (this.config.enablePersistence) {
      setInterval(() => {
        this.processPersistenceQueue();
      }, this.config.persistenceInterval);
    }
  }

  private startCleanupSchedule(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      await this.runScheduledCleanup();
    }, 3600000);
  }

  private async processPersistenceQueue(): Promise<void> {
    if (this.isPersisting || this.persistenceQueue.size === 0) {
      return;
    }

    this.isPersisting = true;

    try {
      const entries = Array.from(this.persistenceQueue.entries());
      this.persistenceQueue.clear();

      for (const [projectId, state] of entries) {
        await this.persistMemoryState(projectId, state);
      }

      logger.debug(`Persisted ${entries.length} memory states`);
    } catch (error) {
      logger.error('Failed to process persistence queue', error);
    } finally {
      this.isPersisting = false;
    }
  }

  private async persistMemoryState(projectId: string, state: ProjectMemoryState): Promise<void> {
    try {
      const filePath = this.getMemoryFilePath(projectId);
      const compressed = await this.compressMemory(state);
      
      const fileData = {
        projectId,
        timestamp: new Date().toISOString(),
        checksum: compressed.checksum,
        data: compressed.data.toString('base64')
      };

      await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
      
      logger.debug(`Memory state persisted for ${projectId}`);
    } catch (error) {
      logger.error(`Failed to persist memory state for ${projectId}`, error);
      throw error;
    }
  }

  private async validateMemoryState(state: ProjectMemoryState): Promise<ValidationResult> {
    return this.validateMemoryIntegrity(state);
  }

  private async applyMemoryChange(state: ProjectMemoryState, change: MemoryChange): Promise<void> {
    switch (change.type) {
      case 'symbol_added':
        if (state.symbolIndex && change.data.symbol) {
          state.symbolIndex.symbols.set(change.data.symbolId, change.data.symbol);
          state.symbolIndex.size = state.symbolIndex.symbols.size;
        }
        break;

      case 'symbol_removed':
        if (state.symbolIndex && change.data.symbolId) {
          state.symbolIndex.symbols.delete(change.data.symbolId);
          state.symbolIndex.size = state.symbolIndex.symbols.size;
        }
        break;

      case 'symbol_updated':
        if (state.symbolIndex && change.data.symbolId && change.data.symbol) {
          state.symbolIndex.symbols.set(change.data.symbolId, change.data.symbol);
        }
        break;

      case 'analysis_added':
        if (change.data.analysis) {
          state.analysisHistory.push(change.data.analysis);
          // Keep only recent analyses
          if (state.analysisHistory.length > 100) {
            state.analysisHistory = state.analysisHistory.slice(-100);
          }
        }
        break;

      case 'context_updated':
        if (change.data.context) {
          const snapshot: ContextSnapshot = {
            timestamp: change.timestamp,
            context: change.data.context,
            compressedData: await gzipAsync(Buffer.from(JSON.stringify(change.data.context))),
            metadata: {
              version: '1.0',
              compressionType: 'gzip',
              originalSize: JSON.stringify(change.data.context).length,
              compressedSize: 0,
              checksum: ''
            }
          };
          
          snapshot.metadata.compressedSize = snapshot.compressedData.length;
          snapshot.metadata.checksum = createHash('sha256').update(snapshot.compressedData).digest('hex');
          
          state.contextPreservation.push(snapshot);
          
          // Keep only recent snapshots
          if (state.contextPreservation.length > 50) {
            state.contextPreservation = state.contextPreservation.slice(-50);
          }
        }
        break;
    }
  }

  private async runScheduledCleanup(): Promise<void> {
    const retentionPolicy: RetentionPolicy = {
      maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 10000,
      cleanupThreshold: 0.8
    };

    for (const projectId of this.memoryStore.keys()) {
      try {
        await this.cleanupMemory(projectId, retentionPolicy);
      } catch (error) {
        logger.error(`Scheduled cleanup failed for ${projectId}`, error);
      }
    }
  }

  private getMemoryFilePath(projectId: string): string {
    const safeProjectId = projectId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.memoryDir, `${safeProjectId}.json`);
  }

  async saveProjectContext(projectId: string, context: any, options: any = {}): Promise<any> {
    const memoryState: ProjectMemoryState = {
      projectId,
      lastUpdated: new Date(),
      symbolIndex: null,
      typeCache: null,
      dependencyGraph: null,
      analysisHistory: [],
      contextPreservation: []
    };

    await this.saveProjectMemory(projectId, memoryState);
    
    return {
      success: true,
      projectId,
      savedSize: 1000, // Mock size
      metadata: {
        symbolCount: 0,
        typeCount: 0,
        dependencyCount: 0,
        processingTime: 100
      }
    };
  }

  async loadProjectContext(projectId: string, options: any = {}): Promise<any> {
    const state = await this.loadProjectMemory(projectId);
    
    if (!state) {
      return {
        success: false,
        reason: 'Project memory not found',
        projectId
      };
    }

    return {
      success: true,
      projectId,
      restoredContext: {},
      age: Date.now() - state.lastUpdated.getTime(),
      metadata: {
        symbolCount: state.symbolIndex?.size || 0,
        typeCount: state.typeCache?.size || 0,
        dependencyCount: state.dependencyGraph?.edges.length || 0,
        processingTime: 100
      }
    };
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Process any remaining persistence queue
    await this.processPersistenceQueue();

    logger.info('Project memory manager shutdown completed');
  }
}