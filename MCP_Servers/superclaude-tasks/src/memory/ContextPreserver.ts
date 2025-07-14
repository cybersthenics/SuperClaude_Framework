// SuperClaude Tasks Server - Context Preserver
// Serialization/deserialization and context snapshot management

import {
  ContextSnapshot,
  ProjectMemoryState,
  ValidationError
} from '../types/working.js';
import { SimpleLogger } from '../core/SimpleStubs.js';
import { ProjectMemoryManager } from './ProjectMemoryManager.js';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

export interface ContextData {
  type: string;
  data: any;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface CompressionOptions {
  enabled: boolean;
  level: number;
  threshold: number; // bytes
}

export interface SerializationOptions {
  includeMetadata: boolean;
  compression: CompressionOptions;
  maxSize: number; // bytes
}

export class ContextPreserver {
  private logger: SimpleLogger;
  private memoryManager: ProjectMemoryManager;
  private snapshotDir: string;
  private defaultOptions: SerializationOptions;

  constructor(
    memoryManager: ProjectMemoryManager,
    snapshotDir: string = './data/snapshots'
  ) {
    this.logger = new SimpleLogger();
    this.memoryManager = memoryManager;
    this.snapshotDir = snapshotDir;
    this.defaultOptions = {
      includeMetadata: true,
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024 // 1KB
      },
      maxSize: 10 * 1024 * 1024 // 10MB
    };
    
    this.ensureSnapshotDirectory();
  }

  private ensureSnapshotDirectory(): void {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  private getSnapshotFilePath(projectId: string, snapshotId: string): string {
    return path.join(this.snapshotDir, `${projectId}_${snapshotId}.snapshot`);
  }

  // Create context snapshot
  async createContextSnapshot(
    projectId: string,
    contextData: ContextData[],
    description: string = 'Context snapshot',
    options: Partial<SerializationOptions> = {}
  ): Promise<ContextSnapshot> {
    try {
      const snapshotId = uuid();
      const finalOptions = { ...this.defaultOptions, ...options };
      
      // Validate size
      const serializedData = JSON.stringify(contextData);
      if (serializedData.length > finalOptions.maxSize) {
        throw new ValidationError(`Context data too large: ${serializedData.length} bytes`);
      }

      // Create snapshot metadata
      const snapshot: ContextSnapshot = {
        id: snapshotId,
        projectId,
        description,
        timestamp: new Date(),
        size: serializedData.length,
        compressed: false,
        metadata: {
          contextItems: contextData.length,
          types: [...new Set(contextData.map(item => item.type))],
          createdBy: 'system',
          version: '1.0.0'
        }
      };

      // Serialize and optionally compress
      let finalData = serializedData;
      if (finalOptions.compression.enabled && 
          serializedData.length > finalOptions.compression.threshold) {
        
        finalData = await this.compressData(serializedData, finalOptions.compression.level);
        snapshot.compressed = true;
        snapshot.size = finalData.length;
      }

      // Save snapshot data
      const filePath = this.getSnapshotFilePath(projectId, snapshotId);
      fs.writeFileSync(filePath, finalData);

      // Add to project memory
      const memoryState = await this.memoryManager.loadProjectMemory(projectId);
      memoryState.contextSnapshots.push(snapshot);
      
      // Keep only last 50 snapshots
      if (memoryState.contextSnapshots.length > 50) {
        const oldSnapshots = memoryState.contextSnapshots.slice(0, -50);
        for (const oldSnapshot of oldSnapshots) {
          await this.deleteSnapshot(projectId, oldSnapshot.id);
        }
        memoryState.contextSnapshots = memoryState.contextSnapshots.slice(-50);
      }

      await this.memoryManager.saveProjectMemory(projectId, memoryState);
      
      this.logger.info(`Created context snapshot ${snapshotId} for project ${projectId}`);
      return snapshot;
    } catch (error) {
      this.logger.error(`Failed to create context snapshot:`, error);
      throw new ValidationError(`Failed to create context snapshot: ${(error as Error).message}`);
    }
  }

  // Load context snapshot
  async loadContextSnapshot(projectId: string, snapshotId: string): Promise<ContextData[]> {
    try {
      const filePath = this.getSnapshotFilePath(projectId, snapshotId);
      if (!fs.existsSync(filePath)) {
        throw new ValidationError(`Snapshot not found: ${snapshotId}`);
      }

      // Get snapshot metadata
      const memoryState = await this.memoryManager.loadProjectMemory(projectId);
      const snapshot = memoryState.contextSnapshots.find(s => s.id === snapshotId);
      
      if (!snapshot) {
        throw new ValidationError(`Snapshot metadata not found: ${snapshotId}`);
      }

      // Load and deserialize data
      let rawData = fs.readFileSync(filePath, 'utf8');
      
      if (snapshot.compressed) {
        rawData = await this.decompressData(rawData);
      }

      const contextData: ContextData[] = JSON.parse(rawData);
      
      // Restore Date objects
      contextData.forEach(item => {
        if (item.timestamp) {
          item.timestamp = new Date(item.timestamp);
        }
      });

      this.logger.info(`Loaded context snapshot ${snapshotId} for project ${projectId}`);
      return contextData;
    } catch (error) {
      this.logger.error(`Failed to load context snapshot:`, error);
      throw new ValidationError(`Failed to load context snapshot: ${(error as Error).message}`);
    }
  }

  // List context snapshots
  async listContextSnapshots(projectId: string): Promise<ContextSnapshot[]> {
    try {
      const memoryState = await this.memoryManager.loadProjectMemory(projectId);
      return memoryState.contextSnapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error(`Failed to list context snapshots:`, error);
      throw new ValidationError(`Failed to list context snapshots: ${(error as Error).message}`);
    }
  }

  // Delete context snapshot
  async deleteContextSnapshot(projectId: string, snapshotId: string): Promise<void> {
    try {
      await this.deleteSnapshot(projectId, snapshotId);
      
      // Remove from project memory
      const memoryState = await this.memoryManager.loadProjectMemory(projectId);
      memoryState.contextSnapshots = memoryState.contextSnapshots.filter(s => s.id !== snapshotId);
      await this.memoryManager.saveProjectMemory(projectId, memoryState);
      
      this.logger.info(`Deleted context snapshot ${snapshotId} for project ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to delete context snapshot:`, error);
      throw new ValidationError(`Failed to delete context snapshot: ${(error as Error).message}`);
    }
  }

  // Serialize context data
  async serializeContextData(
    contextData: ContextData[],
    options: Partial<SerializationOptions> = {}
  ): Promise<string> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      
      // Prepare data for serialization
      const serializableData = finalOptions.includeMetadata 
        ? contextData 
        : contextData.map(item => ({ type: item.type, data: item.data }));

      const serialized = JSON.stringify(serializableData, null, 2);
      
      // Validate size
      if (serialized.length > finalOptions.maxSize) {
        throw new ValidationError(`Serialized data too large: ${serialized.length} bytes`);
      }

      // Optionally compress
      if (finalOptions.compression.enabled && 
          serialized.length > finalOptions.compression.threshold) {
        return await this.compressData(serialized, finalOptions.compression.level);
      }

      return serialized;
    } catch (error) {
      this.logger.error(`Failed to serialize context data:`, error);
      throw new ValidationError(`Failed to serialize context data: ${(error as Error).message}`);
    }
  }

  // Deserialize context data
  async deserializeContextData(
    serializedData: string,
    compressed: boolean = false
  ): Promise<ContextData[]> {
    try {
      let rawData = serializedData;
      
      if (compressed) {
        rawData = await this.decompressData(serializedData);
      }

      const contextData: ContextData[] = JSON.parse(rawData);
      
      // Restore Date objects
      contextData.forEach(item => {
        if (item.timestamp) {
          item.timestamp = new Date(item.timestamp);
        }
      });

      return contextData;
    } catch (error) {
      this.logger.error(`Failed to deserialize context data:`, error);
      throw new ValidationError(`Failed to deserialize context data: ${(error as Error).message}`);
    }
  }

  // Create incremental snapshot
  async createIncrementalSnapshot(
    projectId: string,
    contextData: ContextData[],
    baseSnapshotId?: string,
    description: string = 'Incremental snapshot'
  ): Promise<ContextSnapshot> {
    try {
      let incrementalData = contextData;
      
      if (baseSnapshotId) {
        // Load base snapshot
        const baseData = await this.loadContextSnapshot(projectId, baseSnapshotId);
        
        // Calculate incremental changes
        incrementalData = this.calculateIncrementalChanges(baseData, contextData);
      }

      return await this.createContextSnapshot(
        projectId,
        incrementalData,
        description
      );
    } catch (error) {
      this.logger.error(`Failed to create incremental snapshot:`, error);
      throw new ValidationError(`Failed to create incremental snapshot: ${(error as Error).message}`);
    }
  }

  // Restore from incremental snapshots
  async restoreFromIncrementalSnapshots(
    projectId: string,
    snapshotIds: string[]
  ): Promise<ContextData[]> {
    try {
      let restoredData: ContextData[] = [];
      
      for (const snapshotId of snapshotIds) {
        const snapshotData = await this.loadContextSnapshot(projectId, snapshotId);
        restoredData = this.mergeContextData(restoredData, snapshotData);
      }

      return restoredData;
    } catch (error) {
      this.logger.error(`Failed to restore from incremental snapshots:`, error);
      throw new ValidationError(`Failed to restore from incremental snapshots: ${(error as Error).message}`);
    }
  }

  // Get snapshot statistics
  async getSnapshotStatistics(projectId: string): Promise<{
    totalSnapshots: number;
    totalSize: number;
    averageSize: number;
    oldestSnapshot?: Date;
    newestSnapshot?: Date;
    compressionRatio: number;
  }> {
    try {
      const snapshots = await this.listContextSnapshots(projectId);
      
      if (snapshots.length === 0) {
        return {
          totalSnapshots: 0,
          totalSize: 0,
          averageSize: 0,
          compressionRatio: 0
        };
      }

      const totalSize = snapshots.reduce((sum, snapshot) => sum + snapshot.size, 0);
      const compressedSnapshots = snapshots.filter(s => s.compressed);
      const compressionRatio = compressedSnapshots.length / snapshots.length;

      return {
        totalSnapshots: snapshots.length,
        totalSize,
        averageSize: totalSize / snapshots.length,
        oldestSnapshot: snapshots[snapshots.length - 1]?.timestamp,
        newestSnapshot: snapshots[0]?.timestamp,
        compressionRatio
      };
    } catch (error) {
      this.logger.error(`Failed to get snapshot statistics:`, error);
      throw new ValidationError(`Failed to get snapshot statistics: ${(error as Error).message}`);
    }
  }

  // Private helper methods
  private async deleteSnapshot(projectId: string, snapshotId: string): Promise<void> {
    const filePath = this.getSnapshotFilePath(projectId, snapshotId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private async compressData(data: string, level: number): Promise<string> {
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data), { level }, (err, result) => {
        if (err) reject(err);
        else resolve(result.toString('base64'));
      });
    });
  }

  private async decompressData(compressedData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(compressedData, 'base64');
      zlib.gunzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result.toString());
      });
    });
  }

  private calculateIncrementalChanges(
    baseData: ContextData[],
    newData: ContextData[]
  ): ContextData[] {
    // Simple implementation - in practice would use more sophisticated diffing
    const baseMap = new Map(baseData.map(item => [`${item.type}:${JSON.stringify(item.data)}`, item]));
    
    return newData.filter(item => {
      const key = `${item.type}:${JSON.stringify(item.data)}`;
      return !baseMap.has(key);
    });
  }

  private mergeContextData(base: ContextData[], incremental: ContextData[]): ContextData[] {
    const merged = [...base];
    
    for (const item of incremental) {
      // Simple merge - in practice would use more sophisticated merging
      const existingIndex = merged.findIndex(
        existing => existing.type === item.type && 
        JSON.stringify(existing.data) === JSON.stringify(item.data)
      );
      
      if (existingIndex >= 0) {
        merged[existingIndex] = item;
      } else {
        merged.push(item);
      }
    }
    
    return merged;
  }
}