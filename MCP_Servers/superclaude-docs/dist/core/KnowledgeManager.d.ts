import { DocumentationContent, IndexingResult, DocsServerConfig } from '../types/index.js';
export declare class KnowledgeManager {
    private logger;
    private performanceMonitor;
    private config;
    constructor(config: DocsServerConfig);
    indexKnowledge(content: DocumentationContent): Promise<IndexingResult>;
    getDocument(documentId: string): Promise<DocumentationContent | null>;
    updateDocument(documentId: string, content: DocumentationContent): Promise<void>;
    getSize(): Promise<number>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=KnowledgeManager.d.ts.map