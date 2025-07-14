// SuperClaude Personas - PersonaRegistry
// Central registry for all persona implementations

import { PersonaName, PersonaImplementation } from '../types';
import { ArchitectPersona } from './ArchitectPersona';
import { FrontendPersona } from './FrontendPersona';
import { AnalyzerPersona } from './AnalyzerPersona';
// TODO: Import other personas as they are implemented

export class PersonaRegistry {
  private static instance: PersonaRegistry;
  private personas: Map<PersonaName, PersonaImplementation> = new Map();

  private constructor() {
    this.initializePersonas();
  }

  public static getInstance(): PersonaRegistry {
    if (!PersonaRegistry.instance) {
      PersonaRegistry.instance = new PersonaRegistry();
    }
    return PersonaRegistry.instance;
  }

  private initializePersonas(): void {
    // Initialize implemented personas
    this.personas.set('architect', new ArchitectPersona());
    this.personas.set('frontend', new FrontendPersona());
    this.personas.set('analyzer', new AnalyzerPersona());
    
    // TODO: Initialize other personas as they are implemented
    // this.personas.set('backend', new BackendPersona());
    // this.personas.set('security', new SecurityPersona());
    // this.personas.set('performance', new PerformancePersona());
    // this.personas.set('qa', new QAPersona());
    // this.personas.set('refactorer', new RefactorerPersona());
    // this.personas.set('devops', new DevOpsPersona());
    // this.personas.set('mentor', new MentorPersona());
    // this.personas.set('scribe', new ScribePersona());
    
    // Add placeholder personas for now
    this.addPlaceholderPersonas();
  }

  private addPlaceholderPersonas(): void {
    const placeholderPersonas: PersonaName[] = [
      'backend', 'security', 'performance', 'qa', 'refactorer', 'devops', 'mentor', 'scribe'
    ];

    for (const personaName of placeholderPersonas) {
      if (!this.personas.has(personaName)) {
        this.personas.set(personaName, this.createPlaceholderPersona(personaName));
      }
    }
  }

  private createPlaceholderPersona(name: PersonaName): PersonaImplementation {
    // Create a basic placeholder implementation
    return {
      identity: `${name} persona (placeholder implementation)`,
      priorityHierarchy: ['Placeholder priority'],
      coreStrategies: [],
      mcpPreferences: [],
      autoActivationTriggers: [],
      qualityStandards: [],
      collaborationPatterns: [],

      async applyBehavior(context) {
        return {
          transformations: [],
          qualityAdjustments: [],
          confidence: 0.5,
          recommendations: [`${name} persona recommendations would go here`],
          optimizations: []
        };
      },

      async makeDecision(options, context) {
        return {
          selectedOption: options[0]?.id || 'default',
          reasoning: `${name} persona decision reasoning`,
          confidence: 0.5,
          alternativeRecommendations: []
        };
      },

      async transformOperation(operation, behaviorResult) {
        return operation;
      },

      async generateOptimizations(operation) {
        return [];
      },

      async receiveExpertise(expertise, fromPersona) {
        return {
          applied: false,
          modifications: [],
          reasoning: `${name} persona not fully implemented`,
          confidence: 0.1
        };
      },

      async applyContextToPriorities(priorities, context) {
        return priorities;
      }
    };
  }

  public getPersona(name: PersonaName): PersonaImplementation | undefined {
    return this.personas.get(name);
  }

  public getAllPersonas(): Map<PersonaName, PersonaImplementation> {
    return new Map(this.personas);
  }

  public getPersonaNames(): PersonaName[] {
    return Array.from(this.personas.keys());
  }

  public hasPersona(name: PersonaName): boolean {
    return this.personas.has(name);
  }

  public getImplementedPersonas(): PersonaName[] {
    const implemented: PersonaName[] = [];
    
    for (const [name, persona] of this.personas) {
      // Check if it's a real implementation (not placeholder)
      if (!persona.identity.includes('placeholder')) {
        implemented.push(name);
      }
    }
    
    return implemented;
  }

  public getPlaceholderPersonas(): PersonaName[] {
    const placeholders: PersonaName[] = [];
    
    for (const [name, persona] of this.personas) {
      if (persona.identity.includes('placeholder')) {
        placeholders.push(name);
      }
    }
    
    return placeholders;
  }

  public registerPersona(name: PersonaName, implementation: PersonaImplementation): void {
    this.personas.set(name, implementation);
  }

  public getPersonaDefinitions(): Record<PersonaName, any> {
    const definitions: Record<string, any> = {};
    
    for (const [name, persona] of this.personas) {
      definitions[name] = {
        identity: persona.identity,
        priorityHierarchy: persona.priorityHierarchy,
        coreStrategies: persona.coreStrategies,
        mcpPreferences: persona.mcpPreferences,
        autoActivationTriggers: persona.autoActivationTriggers,
        qualityStandards: persona.qualityStandards,
        collaborationPatterns: persona.collaborationPatterns
      };
    }
    
    return definitions as Record<PersonaName, any>;
  }
}

// Export singleton instance
export const personaRegistry = PersonaRegistry.getInstance();