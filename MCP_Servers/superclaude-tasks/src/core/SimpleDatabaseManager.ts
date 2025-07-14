// SuperClaude Tasks Server - SimpleDatabaseManager
// Simple in-memory database for testing

export class SimpleDatabaseManager {
  private data: Map<string, any> = new Map();

  async save(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }

  async get(key: string): Promise<any> {
    return this.data.get(key);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async list(): Promise<any[]> {
    return Array.from(this.data.values());
  }
}