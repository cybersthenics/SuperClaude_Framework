export declare class SimpleDatabaseManager {
    private data;
    save(key: string, value: any): Promise<void>;
    get(key: string): Promise<any>;
    delete(key: string): Promise<void>;
    list(): Promise<any[]>;
}
//# sourceMappingURL=SimpleDatabaseManager.d.ts.map