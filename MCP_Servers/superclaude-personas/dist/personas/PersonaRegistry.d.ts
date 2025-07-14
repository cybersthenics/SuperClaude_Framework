import { PersonaName, PersonaImplementation } from '../types';
export declare class PersonaRegistry {
    private static instance;
    private personas;
    private constructor();
    static getInstance(): PersonaRegistry;
    private initializePersonas;
    private addPlaceholderPersonas;
    private createPlaceholderPersona;
    getPersona(name: PersonaName): PersonaImplementation | undefined;
    getAllPersonas(): Map<PersonaName, PersonaImplementation>;
    getPersonaNames(): PersonaName[];
    hasPersona(name: PersonaName): boolean;
    getImplementedPersonas(): PersonaName[];
    getPlaceholderPersonas(): PersonaName[];
    registerPersona(name: PersonaName, implementation: PersonaImplementation): void;
    getPersonaDefinitions(): Record<PersonaName, any>;
}
export declare const personaRegistry: PersonaRegistry;
//# sourceMappingURL=PersonaRegistry.d.ts.map