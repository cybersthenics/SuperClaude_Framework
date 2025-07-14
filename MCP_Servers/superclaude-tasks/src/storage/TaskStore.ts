// SuperClaude Tasks Server - TaskStore Implementation
// Persistent storage for task management with SQLite backend

import { Task, TaskStatus, TaskType, TaskPriority } from '../types/index.js';
import { Database } from 'sqlite3';
import { Logger } from '../utils/Logger.js';
import { promisify } from 'util';
import path from 'path';

export class TaskStore {
  private db: Database;
  private logger: Logger;
  private initialized = false;

  constructor(dbPath: string, logger: Logger) {
    this.db = new Database(dbPath);
    this.logger = logger;
  }

  // ================================
  // Initialization
  // ================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.createTables();
      this.initialized = true;
      this.logger.info('TaskStore initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TaskStore', { error: error.message });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));

    // Tasks table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        complexity TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        parent_id TEXT,
        assigned_to TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        
        -- Estimated effort
        estimated_hours REAL,
        estimated_complexity TEXT,
        estimated_confidence REAL,
        
        -- Actual effort
        actual_hours REAL,
        actual_start_time DATETIME,
        actual_end_time DATETIME,
        actual_efficiency REAL,
        
        -- Metadata
        project_id TEXT,
        session_id TEXT,
        created_by TEXT,
        tags TEXT, -- JSON array
        semantic_context TEXT, -- JSON object
        performance_metrics TEXT, -- JSON object
        quality_metrics TEXT, -- JSON object
        custom_fields TEXT, -- JSON object
        
        FOREIGN KEY (parent_id) REFERENCES tasks(id)
      )
    `);

    // Task dependencies table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id TEXT PRIMARY KEY,
        dependent_task_id TEXT NOT NULL,
        dependency_task_id TEXT NOT NULL,
        type TEXT NOT NULL,
        constraint_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        reason TEXT,
        estimated_delay REAL,
        
        FOREIGN KEY (dependent_task_id) REFERENCES tasks(id),
        FOREIGN KEY (dependency_task_id) REFERENCES tasks(id),
        UNIQUE(dependent_task_id, dependency_task_id)
      )
    `);

    // Task children table (for quick hierarchy lookups)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS task_children (
        parent_id TEXT NOT NULL,
        child_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        PRIMARY KEY (parent_id, child_id),
        FOREIGN KEY (parent_id) REFERENCES tasks(id),
        FOREIGN KEY (child_id) REFERENCES tasks(id)
      )
    `);

    // Task estimation factors table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS task_estimation_factors (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        name TEXT NOT NULL,
        impact REAL NOT NULL,
        confidence REAL NOT NULL,
        description TEXT,
        
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);

    // Task time logs table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS task_time_logs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        description TEXT,
        assigned_to TEXT,
        
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);

    // Create indexes for better performance
    await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependency ON task_dependencies(dependency_task_id)');
  }

  // ================================
  // Task CRUD Operations
  // ================================

  async saveTask(task: Task): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));
    
    try {
      await runAsync(`
        INSERT OR REPLACE INTO tasks (
          id, title, description, type, status, priority, complexity, progress,
          parent_id, assigned_to, created_at, updated_at, completed_at,
          estimated_hours, estimated_complexity, estimated_confidence,
          actual_hours, actual_start_time, actual_end_time, actual_efficiency,
          project_id, session_id, created_by, tags, semantic_context,
          performance_metrics, quality_metrics, custom_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id,
        task.title,
        task.description,
        task.type,
        task.status,
        task.priority,
        task.complexity,
        task.progress,
        task.parentId,
        task.assignedTo,
        task.createdAt.toISOString(),
        task.updatedAt.toISOString(),
        task.completedAt?.toISOString(),
        task.estimatedEffort?.hours,
        task.estimatedEffort?.complexity,
        task.estimatedEffort?.confidence,
        task.actualEffort?.hours,
        task.actualEffort?.startTime?.toISOString(),
        task.actualEffort?.endTime?.toISOString(),
        task.actualEffort?.efficiency,
        task.metadata.projectId,
        task.metadata.sessionId,
        task.metadata.createdBy,
        JSON.stringify(task.metadata.tags),
        JSON.stringify(task.metadata.semanticContext),
        JSON.stringify(task.metadata.performanceMetrics),
        JSON.stringify(task.metadata.qualityMetrics),
        JSON.stringify(task.metadata.customFields)
      ]);

      // Update task dependencies
      await this.updateTaskDependencies(task.id, task.dependencies);

      // Update task children relationships
      await this.updateTaskChildren(task.id, task.childrenIds);

      this.logger.debug('Task saved successfully', { taskId: task.id });
      
    } catch (error) {
      this.logger.error('Failed to save task', { taskId: task.id, error: error.message });
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    const getAsync = promisify(this.db.get.bind(this.db));
    
    try {
      const row = await getAsync('SELECT * FROM tasks WHERE id = ?', [taskId]);
      
      if (!row) {
        return null;
      }

      // Get dependencies
      const dependencies = await this.getTaskDependencies(taskId);
      
      // Get children
      const children = await this.getTaskChildren(taskId);

      return this.rowToTask(row, dependencies, children);
      
    } catch (error) {
      this.logger.error('Failed to get task', { taskId, error: error.message });
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));
    
    try {
      const existingTask = await this.getTask(taskId);
      if (!existingTask) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const updatedTask = { ...existingTask, ...updates, updatedAt: new Date() };
      await this.saveTask(updatedTask);
      
      this.logger.debug('Task updated successfully', { taskId });
      
    } catch (error) {
      this.logger.error('Failed to update task', { taskId, error: error.message });
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));
    
    try {
      // Delete related records first
      await runAsync('DELETE FROM task_dependencies WHERE dependent_task_id = ? OR dependency_task_id = ?', [taskId, taskId]);
      await runAsync('DELETE FROM task_children WHERE parent_id = ? OR child_id = ?', [taskId, taskId]);
      await runAsync('DELETE FROM task_estimation_factors WHERE task_id = ?', [taskId]);
      await runAsync('DELETE FROM task_time_logs WHERE task_id = ?', [taskId]);
      
      // Delete the task
      await runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);
      
      this.logger.debug('Task deleted successfully', { taskId });
      
    } catch (error) {
      this.logger.error('Failed to delete task', { taskId, error: error.message });
      throw error;
    }
  }

  // ================================
  // Task Queries
  // ================================

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      const rows = await allAsync('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', [status]);
      return Promise.all(rows.map(row => this.rowToTaskWithRelations(row)));
      
    } catch (error) {
      this.logger.error('Failed to get tasks by status', { status, error: error.message });
      throw error;
    }
  }

  async getTasksByType(type: TaskType): Promise<Task[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      const rows = await allAsync('SELECT * FROM tasks WHERE type = ? ORDER BY created_at DESC', [type]);
      return Promise.all(rows.map(row => this.rowToTaskWithRelations(row)));
      
    } catch (error) {
      this.logger.error('Failed to get tasks by type', { type, error: error.message });
      throw error;
    }
  }

  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      const rows = await allAsync('SELECT * FROM tasks WHERE priority = ? ORDER BY created_at DESC', [priority]);
      return Promise.all(rows.map(row => this.rowToTaskWithRelations(row)));
      
    } catch (error) {
      this.logger.error('Failed to get tasks by priority', { priority, error: error.message });
      throw error;
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      const rows = await allAsync('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
      return Promise.all(rows.map(row => this.rowToTaskWithRelations(row)));
      
    } catch (error) {
      this.logger.error('Failed to get tasks by project', { projectId, error: error.message });
      throw error;
    }
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      const rows = await allAsync('SELECT * FROM tasks WHERE parent_id = ? ORDER BY created_at ASC', [parentId]);
      return Promise.all(rows.map(row => this.rowToTaskWithRelations(row)));
      
    } catch (error) {
      this.logger.error('Failed to get subtasks', { parentId, error: error.message });
      throw error;
    }
  }

  async searchTasks(query: string, filters?: {
    status?: TaskStatus[];
    type?: TaskType[];
    priority?: TaskPriority[];
    projectId?: string;
  }): Promise<Task[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      let sql = `
        SELECT * FROM tasks 
        WHERE (title LIKE ? OR description LIKE ?)
      `;
      const params = [`%${query}%`, `%${query}%`];

      if (filters?.status && filters.status.length > 0) {
        sql += ` AND status IN (${filters.status.map(() => '?').join(',')})`;
        params.push(...filters.status);
      }

      if (filters?.type && filters.type.length > 0) {
        sql += ` AND type IN (${filters.type.map(() => '?').join(',')})`;
        params.push(...filters.type);
      }

      if (filters?.priority && filters.priority.length > 0) {
        sql += ` AND priority IN (${filters.priority.map(() => '?').join(',')})`;
        params.push(...filters.priority);
      }

      if (filters?.projectId) {
        sql += ` AND project_id = ?`;
        params.push(filters.projectId);
      }

      sql += ' ORDER BY created_at DESC LIMIT 100';

      const rows = await allAsync(sql, params);
      return Promise.all(rows.map(row => this.rowToTaskWithRelations(row)));
      
    } catch (error) {
      this.logger.error('Failed to search tasks', { query, error: error.message });
      throw error;
    }
  }

  // ================================
  // Statistics and Analytics
  // ================================

  async getTaskStats(): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byType: Record<TaskType, number>;
    byPriority: Record<TaskPriority, number>;
  }> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    try {
      const [totalResult, statusStats, typeStats, priorityStats] = await Promise.all([
        allAsync('SELECT COUNT(*) as total FROM tasks'),
        allAsync('SELECT status, COUNT(*) as count FROM tasks GROUP BY status'),
        allAsync('SELECT type, COUNT(*) as count FROM tasks GROUP BY type'),
        allAsync('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority')
      ]);

      const byStatus = {} as Record<TaskStatus, number>;
      const byType = {} as Record<TaskType, number>;
      const byPriority = {} as Record<TaskPriority, number>;

      statusStats.forEach(row => byStatus[row.status] = row.count);
      typeStats.forEach(row => byType[row.type] = row.count);
      priorityStats.forEach(row => byPriority[row.priority] = row.count);

      return {
        total: totalResult[0]?.total || 0,
        byStatus,
        byType,
        byPriority
      };
      
    } catch (error) {
      this.logger.error('Failed to get task stats', { error: error.message });
      throw error;
    }
  }

  // ================================
  // Private Helper Methods
  // ================================

  private async updateTaskDependencies(taskId: string, dependencies: Task['dependencies']): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));
    
    // Delete existing dependencies
    await runAsync('DELETE FROM task_dependencies WHERE dependent_task_id = ?', [taskId]);
    
    // Insert new dependencies
    for (const dep of dependencies) {
      await runAsync(`
        INSERT INTO task_dependencies (
          id, dependent_task_id, dependency_task_id, type, constraint_type,
          created_at, created_by, reason, estimated_delay
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `${taskId}-${dep.dependencyTaskId}`,
        dep.dependentTaskId,
        dep.dependencyTaskId,
        dep.type,
        dep.constraint,
        dep.metadata.createdAt.toISOString(),
        dep.metadata.createdBy,
        dep.metadata.reason,
        dep.metadata.estimatedDelay
      ]);
    }
  }

  private async updateTaskChildren(taskId: string, childrenIds: string[]): Promise<void> {
    const runAsync = promisify(this.db.run.bind(this.db));
    
    // Delete existing children relationships
    await runAsync('DELETE FROM task_children WHERE parent_id = ?', [taskId]);
    
    // Insert new children relationships
    for (const childId of childrenIds) {
      await runAsync(`
        INSERT INTO task_children (parent_id, child_id, created_at)
        VALUES (?, ?, ?)
      `, [taskId, childId, new Date().toISOString()]);
    }
  }

  private async getTaskDependencies(taskId: string): Promise<Task['dependencies']> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    const rows = await allAsync(`
      SELECT * FROM task_dependencies 
      WHERE dependent_task_id = ?
    `, [taskId]);

    return rows.map(row => ({
      dependentTaskId: row.dependent_task_id,
      dependencyTaskId: row.dependency_task_id,
      type: row.type,
      constraint: row.constraint_type,
      metadata: {
        createdAt: new Date(row.created_at),
        createdBy: row.created_by,
        reason: row.reason,
        estimatedDelay: row.estimated_delay
      }
    }));
  }

  private async getTaskChildren(taskId: string): Promise<string[]> {
    const allAsync = promisify(this.db.all.bind(this.db));
    
    const rows = await allAsync(`
      SELECT child_id FROM task_children 
      WHERE parent_id = ?
      ORDER BY created_at ASC
    `, [taskId]);

    return rows.map(row => row.child_id);
  }

  private async rowToTaskWithRelations(row: any): Promise<Task> {
    const dependencies = await this.getTaskDependencies(row.id);
    const children = await this.getTaskChildren(row.id);
    return this.rowToTask(row, dependencies, children);
  }

  private rowToTask(row: any, dependencies: Task['dependencies'], children: string[]): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      priority: row.priority,
      complexity: row.complexity,
      progress: row.progress,
      parentId: row.parent_id,
      childrenIds: children,
      dependencies,
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      estimatedEffort: row.estimated_hours ? {
        hours: row.estimated_hours,
        complexity: row.estimated_complexity,
        confidence: row.estimated_confidence,
        factors: []
      } : undefined,
      actualEffort: row.actual_hours ? {
        hours: row.actual_hours,
        startTime: new Date(row.actual_start_time),
        endTime: new Date(row.actual_end_time),
        timeLog: [],
        efficiency: row.actual_efficiency
      } : undefined,
      metadata: {
        projectId: row.project_id,
        sessionId: row.session_id,
        createdBy: row.created_by,
        tags: row.tags ? JSON.parse(row.tags) : [],
        semanticContext: row.semantic_context ? JSON.parse(row.semantic_context) : undefined,
        performanceMetrics: row.performance_metrics ? JSON.parse(row.performance_metrics) : undefined,
        qualityMetrics: row.quality_metrics ? JSON.parse(row.quality_metrics) : undefined,
        customFields: row.custom_fields ? JSON.parse(row.custom_fields) : undefined
      }
    };
  }

  // ================================
  // Cleanup and Maintenance
  // ================================

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          this.logger.error('Failed to close database', { error: err.message });
          reject(err);
        } else {
          this.logger.info('Database closed successfully');
          resolve();
        }
      });
    });
  }
}