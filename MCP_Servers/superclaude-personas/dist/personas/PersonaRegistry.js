import { ArchitectPersona } from './ArchitectPersona';
import { FrontendPersona } from './FrontendPersona';
import { AnalyzerPersona } from './AnalyzerPersona';
export class PersonaRegistry {
    static instance;
    personas = new Map();
    constructor() {
        this.initializePersonas();
    }
    static getInstance() {
        if (!PersonaRegistry.instance) {
            PersonaRegistry.instance = new PersonaRegistry();
        }
        return PersonaRegistry.instance;
    }
    initializePersonas() {
        this.personas.set('architect', new ArchitectPersona());
        this.personas.set('frontend', new FrontendPersona());
        this.personas.set('analyzer', new AnalyzerPersona());
        this.addPlaceholderPersonas();
    }
    addPlaceholderPersonas() {
        const placeholderPersonas = [
            'backend', 'security', 'performance', 'qa', 'refactorer', 'devops', 'mentor', 'scribe'
        ];
        for (const personaName of placeholderPersonas) {
            if (!this.personas.has(personaName)) {
                this.personas.set(personaName, this.createPlaceholderPersona(personaName));
            }
        }
    }
    createPlaceholderPersona(name) {
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
    getPersona(name) {
        return this.personas.get(name);
    }
    getAllPersonas() {
        return new Map(this.personas);
    }
    getPersonaNames() {
        return Array.from(this.personas.keys());
    }
    hasPersona(name) {
        return this.personas.has(name);
    }
    getImplementedPersonas() {
        const implemented = [];
        for (const [name, persona] of this.personas) {
            if (!persona.identity.includes('placeholder')) {
                implemented.push(name);
            }
        }
        return implemented;
    }
    getPlaceholderPersonas() {
        const placeholders = [];
        for (const [name, persona] of this.personas) {
            if (persona.identity.includes('placeholder')) {
                placeholders.push(name);
            }
        }
        return placeholders;
    }
    registerPersona(name, implementation) {
        this.personas.set(name, implementation);
    }
    getPersonaDefinitions() {
        const definitions = {};
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
        return definitions;
    }
}
export const personaRegistry = PersonaRegistry.getInstance();
//# sourceMappingURL=PersonaRegistry.js.map