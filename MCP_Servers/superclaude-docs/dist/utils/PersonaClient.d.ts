import { DocsServerConfig } from '../types/index.js';
export declare class PersonaClient {
    private logger;
    private config;
    private isEnabled;
    private activePersonas;
    constructor(config: DocsServerConfig);
    activatePersona(personaType: string, context: any): Promise<PersonaInstance>;
    deactivatePersona(personaId: string): Promise<void>;
    getPersonaGuidance(personaId: string, task: string): Promise<PersonaGuidance>;
    enhanceContentWithPersona(personaId: string, content: string, enhancementType: string): Promise<string>;
    getPersonaRecommendations(personaType: string, context: any): Promise<string[]>;
    validatePersonaAlignment(personaId: string, content: string): Promise<PersonaValidation>;
    private createPersonaInstance;
    private getPersonaName;
    private getPersonaDescription;
    private getPersonaCapabilities;
    private getPersonaPreferences;
    private getPersonaSpecializations;
    private generateGuidance;
    private getTaskRecommendations;
    private getTaskApproach;
    private getTaskConsiderations;
    private getTaskResources;
    private applyPersonaEnhancements;
    private applyScribeEnhancements;
    private applyMentorEnhancements;
    private applyArchitectEnhancements;
    private applyAnalyzerEnhancements;
    private applySecurityEnhancements;
    private generateRecommendations;
    private performPersonaValidation;
    private getMockPersona;
    private getMockGuidance;
    private getMockRecommendations;
    private getMockValidation;
    getActivePersonas(): PersonaInstance[];
    isIntegrationEnabled(): boolean;
    getHealth(): Promise<{
        status: string;
        lastCheck: Date;
        activePersonas: number;
    }>;
}
interface PersonaInstance {
    id: string;
    type: string;
    name: string;
    description: string;
    context: any;
    activatedAt: Date;
    capabilities: string[];
    preferences: any;
    specializations: string[];
}
interface PersonaGuidance {
    type: 'guidance';
    personaId: string;
    task: string;
    recommendations: string[];
    approach: string;
    considerations: string[];
    resources: string[];
    generatedAt: Date;
}
interface PersonaValidation {
    passed: boolean;
    alignmentScore: number;
    issues: string[];
    suggestions: string[];
    validatedAt: Date;
}
export {};
//# sourceMappingURL=PersonaClient.d.ts.map