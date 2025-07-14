export class SimpleDatabaseManager {
    data = new Map();
    async save(key, value) {
        this.data.set(key, value);
    }
    async get(key) {
        return this.data.get(key);
    }
    async delete(key) {
        this.data.delete(key);
    }
    async list() {
        return Array.from(this.data.values());
    }
}
//# sourceMappingURL=SimpleDatabaseManager.js.map