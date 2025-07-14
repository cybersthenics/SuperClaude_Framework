import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PersonaName } from '../types';
export declare const ActivatePersonaSchema: z.ZodObject<{
    persona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
    context: z.ZodObject<{
        domain: z.ZodString;
        complexity: z.ZodNumber;
        userIntent: z.ZodString;
        projectContext: z.ZodOptional<z.ZodObject<{
            projectType: z.ZodString;
            framework: z.ZodString;
            language: z.ZodString;
            environment: z.ZodString;
            phase: z.ZodString;
            constraints: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        }, {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        }>>;
        sessionHistory: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        qualityRequirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            requirement: z.ZodString;
            priority: z.ZodNumber;
            validationMethod: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }, {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    }, {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        forceActivation: z.ZodOptional<z.ZodBoolean>;
        preserveStack: z.ZodOptional<z.ZodBoolean>;
        collaborationMode: z.ZodOptional<z.ZodEnum<["single", "parallel", "chain"]>>;
    }, "strip", z.ZodTypeAny, {
        forceActivation?: boolean | undefined;
        preserveStack?: boolean | undefined;
        collaborationMode?: "parallel" | "single" | "chain" | undefined;
    }, {
        forceActivation?: boolean | undefined;
        preserveStack?: boolean | undefined;
        collaborationMode?: "parallel" | "single" | "chain" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    persona: PersonaName;
    context: {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    };
    options?: {
        forceActivation?: boolean | undefined;
        preserveStack?: boolean | undefined;
        collaborationMode?: "parallel" | "single" | "chain" | undefined;
    } | undefined;
}, {
    persona: PersonaName;
    context: {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    };
    options?: {
        forceActivation?: boolean | undefined;
        preserveStack?: boolean | undefined;
        collaborationMode?: "parallel" | "single" | "chain" | undefined;
    } | undefined;
}>;
export declare const GetPersonaRecommendationSchema: z.ZodObject<{
    taskDescription: z.ZodString;
    projectContext: z.ZodOptional<z.ZodObject<{
        projectType: z.ZodString;
        framework: z.ZodString;
        language: z.ZodString;
        environment: z.ZodString;
        phase: z.ZodString;
        constraints: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        projectType: string;
        framework: string;
        language: string;
        environment: string;
        phase: string;
        constraints: string[];
    }, {
        projectType: string;
        framework: string;
        language: string;
        environment: string;
        phase: string;
        constraints: string[];
    }>>;
    userHistory: z.ZodOptional<z.ZodObject<{
        recentCommands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        personaPreferences: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        successfulPatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        feedbackHistory: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        recentCommands?: string[] | undefined;
        personaPreferences?: any[] | undefined;
        successfulPatterns?: string[] | undefined;
        feedbackHistory?: any[] | undefined;
    }, {
        recentCommands?: string[] | undefined;
        personaPreferences?: any[] | undefined;
        successfulPatterns?: string[] | undefined;
        feedbackHistory?: any[] | undefined;
    }>>;
    systemState: z.ZodOptional<z.ZodObject<{
        performance: z.ZodOptional<z.ZodObject<{
            responseTime: z.ZodNumber;
            throughput: z.ZodNumber;
            errorRate: z.ZodNumber;
            cpuUsage: z.ZodNumber;
            memoryUsage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            cpuUsage: number;
        }, {
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            cpuUsage: number;
        }>>;
        resourceUsage: z.ZodOptional<z.ZodObject<{
            cpu: z.ZodNumber;
            memory: z.ZodNumber;
            disk: z.ZodNumber;
            network: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            memory: number;
            cpu: number;
            disk: number;
            network: number;
        }, {
            memory: number;
            cpu: number;
            disk: number;
            network: number;
        }>>;
        errorRate: z.ZodOptional<z.ZodNumber>;
        activeConnections: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        performance?: {
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            cpuUsage: number;
        } | undefined;
        errorRate?: number | undefined;
        resourceUsage?: {
            memory: number;
            cpu: number;
            disk: number;
            network: number;
        } | undefined;
        activeConnections?: number | undefined;
    }, {
        performance?: {
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            cpuUsage: number;
        } | undefined;
        errorRate?: number | undefined;
        resourceUsage?: {
            memory: number;
            cpu: number;
            disk: number;
            network: number;
        } | undefined;
        activeConnections?: number | undefined;
    }>>;
    currentPersona: z.ZodOptional<z.ZodEnum<[PersonaName, ...PersonaName[]]>>;
    options: z.ZodOptional<z.ZodObject<{
        includeConfidenceBreakdown: z.ZodOptional<z.ZodBoolean>;
        maxRecommendations: z.ZodOptional<z.ZodNumber>;
        excludePersonas: z.ZodOptional<z.ZodArray<z.ZodEnum<[PersonaName, ...PersonaName[]]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxRecommendations?: number | undefined;
        includeConfidenceBreakdown?: boolean | undefined;
        excludePersonas?: PersonaName[] | undefined;
    }, {
        maxRecommendations?: number | undefined;
        includeConfidenceBreakdown?: boolean | undefined;
        excludePersonas?: PersonaName[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    taskDescription: string;
    options?: {
        maxRecommendations?: number | undefined;
        includeConfidenceBreakdown?: boolean | undefined;
        excludePersonas?: PersonaName[] | undefined;
    } | undefined;
    projectContext?: {
        projectType: string;
        framework: string;
        language: string;
        environment: string;
        phase: string;
        constraints: string[];
    } | undefined;
    userHistory?: {
        recentCommands?: string[] | undefined;
        personaPreferences?: any[] | undefined;
        successfulPatterns?: string[] | undefined;
        feedbackHistory?: any[] | undefined;
    } | undefined;
    systemState?: {
        performance?: {
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            cpuUsage: number;
        } | undefined;
        errorRate?: number | undefined;
        resourceUsage?: {
            memory: number;
            cpu: number;
            disk: number;
            network: number;
        } | undefined;
        activeConnections?: number | undefined;
    } | undefined;
    currentPersona?: PersonaName | undefined;
}, {
    taskDescription: string;
    options?: {
        maxRecommendations?: number | undefined;
        includeConfidenceBreakdown?: boolean | undefined;
        excludePersonas?: PersonaName[] | undefined;
    } | undefined;
    projectContext?: {
        projectType: string;
        framework: string;
        language: string;
        environment: string;
        phase: string;
        constraints: string[];
    } | undefined;
    userHistory?: {
        recentCommands?: string[] | undefined;
        personaPreferences?: any[] | undefined;
        successfulPatterns?: string[] | undefined;
        feedbackHistory?: any[] | undefined;
    } | undefined;
    systemState?: {
        performance?: {
            memoryUsage: number;
            responseTime: number;
            throughput: number;
            errorRate: number;
            cpuUsage: number;
        } | undefined;
        errorRate?: number | undefined;
        resourceUsage?: {
            memory: number;
            cpu: number;
            disk: number;
            network: number;
        } | undefined;
        activeConnections?: number | undefined;
    } | undefined;
    currentPersona?: PersonaName | undefined;
}>;
export declare const ApplyPersonaBehaviorSchema: z.ZodObject<{
    persona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
    operation: z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodAny;
        context: z.ZodOptional<z.ZodAny>;
        requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    }, {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    }>;
    context: z.ZodOptional<z.ZodObject<{
        domain: z.ZodString;
        complexity: z.ZodNumber;
        userIntent: z.ZodString;
        projectContext: z.ZodOptional<z.ZodObject<{
            projectType: z.ZodString;
            framework: z.ZodString;
            language: z.ZodString;
            environment: z.ZodString;
            phase: z.ZodString;
            constraints: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        }, {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        }>>;
        sessionHistory: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        qualityRequirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            requirement: z.ZodString;
            priority: z.ZodNumber;
            validationMethod: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }, {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    }, {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        preserveOriginal: z.ZodOptional<z.ZodBoolean>;
        applyOptimizations: z.ZodOptional<z.ZodBoolean>;
        generateExplanation: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        preserveOriginal?: boolean | undefined;
        applyOptimizations?: boolean | undefined;
        generateExplanation?: boolean | undefined;
    }, {
        preserveOriginal?: boolean | undefined;
        applyOptimizations?: boolean | undefined;
        generateExplanation?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    persona: PersonaName;
    operation: {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    };
    options?: {
        preserveOriginal?: boolean | undefined;
        applyOptimizations?: boolean | undefined;
        generateExplanation?: boolean | undefined;
    } | undefined;
    context?: {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    } | undefined;
}, {
    persona: PersonaName;
    operation: {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    };
    options?: {
        preserveOriginal?: boolean | undefined;
        applyOptimizations?: boolean | undefined;
        generateExplanation?: boolean | undefined;
    } | undefined;
    context?: {
        domain: string;
        complexity: number;
        userIntent: string;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        sessionHistory?: any[] | undefined;
        qualityRequirements?: {
            priority: number;
            category: string;
            requirement: string;
            validationMethod: string;
        }[] | undefined;
    } | undefined;
}>;
export declare const CoordinatePersonasSchema: z.ZodObject<{
    personas: z.ZodArray<z.ZodEnum<[PersonaName, ...PersonaName[]]>, "many">;
    operation: z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodAny;
        context: z.ZodOptional<z.ZodAny>;
        requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    }, {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    }>;
    coordinationMode: z.ZodOptional<z.ZodEnum<["parallel", "sequential", "hierarchical"]>>;
    options: z.ZodOptional<z.ZodObject<{
        enableExpertiseSharing: z.ZodOptional<z.ZodBoolean>;
        resolvePriorityConflicts: z.ZodOptional<z.ZodBoolean>;
        generateSynthesis: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enableExpertiseSharing?: boolean | undefined;
        resolvePriorityConflicts?: boolean | undefined;
        generateSynthesis?: boolean | undefined;
    }, {
        enableExpertiseSharing?: boolean | undefined;
        resolvePriorityConflicts?: boolean | undefined;
        generateSynthesis?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    personas: PersonaName[];
    operation: {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    };
    options?: {
        enableExpertiseSharing?: boolean | undefined;
        resolvePriorityConflicts?: boolean | undefined;
        generateSynthesis?: boolean | undefined;
    } | undefined;
    coordinationMode?: "sequential" | "parallel" | "hierarchical" | undefined;
}, {
    personas: PersonaName[];
    operation: {
        type: string;
        description: string;
        context?: any;
        parameters?: any;
        requirements?: string[] | undefined;
    };
    options?: {
        enableExpertiseSharing?: boolean | undefined;
        resolvePriorityConflicts?: boolean | undefined;
        generateSynthesis?: boolean | undefined;
    } | undefined;
    coordinationMode?: "sequential" | "parallel" | "hierarchical" | undefined;
}>;
export declare const GetPersonaPrioritiesSchema: z.ZodObject<{
    persona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
    decisionContext: z.ZodOptional<z.ZodObject<{
        situation: z.ZodString;
        constraints: z.ZodArray<z.ZodString, "many">;
        objectives: z.ZodArray<z.ZodString, "many">;
        stakeholders: z.ZodArray<z.ZodString, "many">;
        timeline: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        constraints: string[];
        situation: string;
        objectives: string[];
        stakeholders: string[];
        timeline: string;
    }, {
        constraints: string[];
        situation: string;
        objectives: string[];
        stakeholders: string[];
        timeline: string;
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        includeReasoning: z.ZodOptional<z.ZodBoolean>;
        comparativeAnalysis: z.ZodOptional<z.ZodArray<z.ZodEnum<[PersonaName, ...PersonaName[]]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        includeReasoning?: boolean | undefined;
        comparativeAnalysis?: PersonaName[] | undefined;
    }, {
        includeReasoning?: boolean | undefined;
        comparativeAnalysis?: PersonaName[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    persona: PersonaName;
    options?: {
        includeReasoning?: boolean | undefined;
        comparativeAnalysis?: PersonaName[] | undefined;
    } | undefined;
    decisionContext?: {
        constraints: string[];
        situation: string;
        objectives: string[];
        stakeholders: string[];
        timeline: string;
    } | undefined;
}, {
    persona: PersonaName;
    options?: {
        includeReasoning?: boolean | undefined;
        comparativeAnalysis?: PersonaName[] | undefined;
    } | undefined;
    decisionContext?: {
        constraints: string[];
        situation: string;
        objectives: string[];
        stakeholders: string[];
        timeline: string;
    } | undefined;
}>;
export declare const ShareExpertiseSchema: z.ZodObject<{
    fromPersona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
    toPersona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
    expertise: z.ZodObject<{
        fromPersona: z.ZodString;
        domain: z.ZodString;
        insights: z.ZodArray<z.ZodString, "many">;
        recommendations: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodNumber;
        timestamp: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        domain: string;
        confidence: number;
        recommendations: string[];
        fromPersona: string;
        insights: string[];
        timestamp?: Date | undefined;
    }, {
        domain: string;
        confidence: number;
        recommendations: string[];
        fromPersona: string;
        insights: string[];
        timestamp?: Date | undefined;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        preserveContext: z.ZodOptional<z.ZodBoolean>;
        enableTranslation: z.ZodOptional<z.ZodBoolean>;
        validateCompatibility: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        preserveContext?: boolean | undefined;
        enableTranslation?: boolean | undefined;
        validateCompatibility?: boolean | undefined;
    }, {
        preserveContext?: boolean | undefined;
        enableTranslation?: boolean | undefined;
        validateCompatibility?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    fromPersona: PersonaName;
    toPersona: PersonaName;
    expertise: {
        domain: string;
        confidence: number;
        recommendations: string[];
        fromPersona: string;
        insights: string[];
        timestamp?: Date | undefined;
    };
    options?: {
        preserveContext?: boolean | undefined;
        enableTranslation?: boolean | undefined;
        validateCompatibility?: boolean | undefined;
    } | undefined;
}, {
    fromPersona: PersonaName;
    toPersona: PersonaName;
    expertise: {
        domain: string;
        confidence: number;
        recommendations: string[];
        fromPersona: string;
        insights: string[];
        timestamp?: Date | undefined;
    };
    options?: {
        preserveContext?: boolean | undefined;
        enableTranslation?: boolean | undefined;
        validateCompatibility?: boolean | undefined;
    } | undefined;
}>;
export declare const activatePersonaTool: Tool;
export declare const getPersonaRecommendationTool: Tool;
export declare const applyPersonaBehaviorTool: Tool;
export declare const coordinatePersonasTool: Tool;
export declare const getPersonaPrioritiesTool: Tool;
export declare const shareExpertiseTool: Tool;
export declare const tools: Tool[];
export declare const schemas: {
    ActivatePersonaSchema: z.ZodObject<{
        persona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
        context: z.ZodObject<{
            domain: z.ZodString;
            complexity: z.ZodNumber;
            userIntent: z.ZodString;
            projectContext: z.ZodOptional<z.ZodObject<{
                projectType: z.ZodString;
                framework: z.ZodString;
                language: z.ZodString;
                environment: z.ZodString;
                phase: z.ZodString;
                constraints: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            }, {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            }>>;
            sessionHistory: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            qualityRequirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
                category: z.ZodString;
                requirement: z.ZodString;
                priority: z.ZodNumber;
                validationMethod: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }, {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        }, {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        }>;
        options: z.ZodOptional<z.ZodObject<{
            forceActivation: z.ZodOptional<z.ZodBoolean>;
            preserveStack: z.ZodOptional<z.ZodBoolean>;
            collaborationMode: z.ZodOptional<z.ZodEnum<["single", "parallel", "chain"]>>;
        }, "strip", z.ZodTypeAny, {
            forceActivation?: boolean | undefined;
            preserveStack?: boolean | undefined;
            collaborationMode?: "parallel" | "single" | "chain" | undefined;
        }, {
            forceActivation?: boolean | undefined;
            preserveStack?: boolean | undefined;
            collaborationMode?: "parallel" | "single" | "chain" | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        persona: PersonaName;
        context: {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        };
        options?: {
            forceActivation?: boolean | undefined;
            preserveStack?: boolean | undefined;
            collaborationMode?: "parallel" | "single" | "chain" | undefined;
        } | undefined;
    }, {
        persona: PersonaName;
        context: {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        };
        options?: {
            forceActivation?: boolean | undefined;
            preserveStack?: boolean | undefined;
            collaborationMode?: "parallel" | "single" | "chain" | undefined;
        } | undefined;
    }>;
    GetPersonaRecommendationSchema: z.ZodObject<{
        taskDescription: z.ZodString;
        projectContext: z.ZodOptional<z.ZodObject<{
            projectType: z.ZodString;
            framework: z.ZodString;
            language: z.ZodString;
            environment: z.ZodString;
            phase: z.ZodString;
            constraints: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        }, {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        }>>;
        userHistory: z.ZodOptional<z.ZodObject<{
            recentCommands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            personaPreferences: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            successfulPatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            feedbackHistory: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        }, "strip", z.ZodTypeAny, {
            recentCommands?: string[] | undefined;
            personaPreferences?: any[] | undefined;
            successfulPatterns?: string[] | undefined;
            feedbackHistory?: any[] | undefined;
        }, {
            recentCommands?: string[] | undefined;
            personaPreferences?: any[] | undefined;
            successfulPatterns?: string[] | undefined;
            feedbackHistory?: any[] | undefined;
        }>>;
        systemState: z.ZodOptional<z.ZodObject<{
            performance: z.ZodOptional<z.ZodObject<{
                responseTime: z.ZodNumber;
                throughput: z.ZodNumber;
                errorRate: z.ZodNumber;
                cpuUsage: z.ZodNumber;
                memoryUsage: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                memoryUsage: number;
                responseTime: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
            }, {
                memoryUsage: number;
                responseTime: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
            }>>;
            resourceUsage: z.ZodOptional<z.ZodObject<{
                cpu: z.ZodNumber;
                memory: z.ZodNumber;
                disk: z.ZodNumber;
                network: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                memory: number;
                cpu: number;
                disk: number;
                network: number;
            }, {
                memory: number;
                cpu: number;
                disk: number;
                network: number;
            }>>;
            errorRate: z.ZodOptional<z.ZodNumber>;
            activeConnections: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            performance?: {
                memoryUsage: number;
                responseTime: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
            } | undefined;
            errorRate?: number | undefined;
            resourceUsage?: {
                memory: number;
                cpu: number;
                disk: number;
                network: number;
            } | undefined;
            activeConnections?: number | undefined;
        }, {
            performance?: {
                memoryUsage: number;
                responseTime: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
            } | undefined;
            errorRate?: number | undefined;
            resourceUsage?: {
                memory: number;
                cpu: number;
                disk: number;
                network: number;
            } | undefined;
            activeConnections?: number | undefined;
        }>>;
        currentPersona: z.ZodOptional<z.ZodEnum<[PersonaName, ...PersonaName[]]>>;
        options: z.ZodOptional<z.ZodObject<{
            includeConfidenceBreakdown: z.ZodOptional<z.ZodBoolean>;
            maxRecommendations: z.ZodOptional<z.ZodNumber>;
            excludePersonas: z.ZodOptional<z.ZodArray<z.ZodEnum<[PersonaName, ...PersonaName[]]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            maxRecommendations?: number | undefined;
            includeConfidenceBreakdown?: boolean | undefined;
            excludePersonas?: PersonaName[] | undefined;
        }, {
            maxRecommendations?: number | undefined;
            includeConfidenceBreakdown?: boolean | undefined;
            excludePersonas?: PersonaName[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        taskDescription: string;
        options?: {
            maxRecommendations?: number | undefined;
            includeConfidenceBreakdown?: boolean | undefined;
            excludePersonas?: PersonaName[] | undefined;
        } | undefined;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        userHistory?: {
            recentCommands?: string[] | undefined;
            personaPreferences?: any[] | undefined;
            successfulPatterns?: string[] | undefined;
            feedbackHistory?: any[] | undefined;
        } | undefined;
        systemState?: {
            performance?: {
                memoryUsage: number;
                responseTime: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
            } | undefined;
            errorRate?: number | undefined;
            resourceUsage?: {
                memory: number;
                cpu: number;
                disk: number;
                network: number;
            } | undefined;
            activeConnections?: number | undefined;
        } | undefined;
        currentPersona?: PersonaName | undefined;
    }, {
        taskDescription: string;
        options?: {
            maxRecommendations?: number | undefined;
            includeConfidenceBreakdown?: boolean | undefined;
            excludePersonas?: PersonaName[] | undefined;
        } | undefined;
        projectContext?: {
            projectType: string;
            framework: string;
            language: string;
            environment: string;
            phase: string;
            constraints: string[];
        } | undefined;
        userHistory?: {
            recentCommands?: string[] | undefined;
            personaPreferences?: any[] | undefined;
            successfulPatterns?: string[] | undefined;
            feedbackHistory?: any[] | undefined;
        } | undefined;
        systemState?: {
            performance?: {
                memoryUsage: number;
                responseTime: number;
                throughput: number;
                errorRate: number;
                cpuUsage: number;
            } | undefined;
            errorRate?: number | undefined;
            resourceUsage?: {
                memory: number;
                cpu: number;
                disk: number;
                network: number;
            } | undefined;
            activeConnections?: number | undefined;
        } | undefined;
        currentPersona?: PersonaName | undefined;
    }>;
    ApplyPersonaBehaviorSchema: z.ZodObject<{
        persona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
        operation: z.ZodObject<{
            type: z.ZodString;
            description: z.ZodString;
            parameters: z.ZodAny;
            context: z.ZodOptional<z.ZodAny>;
            requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        }, {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        }>;
        context: z.ZodOptional<z.ZodObject<{
            domain: z.ZodString;
            complexity: z.ZodNumber;
            userIntent: z.ZodString;
            projectContext: z.ZodOptional<z.ZodObject<{
                projectType: z.ZodString;
                framework: z.ZodString;
                language: z.ZodString;
                environment: z.ZodString;
                phase: z.ZodString;
                constraints: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            }, {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            }>>;
            sessionHistory: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
            qualityRequirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
                category: z.ZodString;
                requirement: z.ZodString;
                priority: z.ZodNumber;
                validationMethod: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }, {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        }, {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        }>>;
        options: z.ZodOptional<z.ZodObject<{
            preserveOriginal: z.ZodOptional<z.ZodBoolean>;
            applyOptimizations: z.ZodOptional<z.ZodBoolean>;
            generateExplanation: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            preserveOriginal?: boolean | undefined;
            applyOptimizations?: boolean | undefined;
            generateExplanation?: boolean | undefined;
        }, {
            preserveOriginal?: boolean | undefined;
            applyOptimizations?: boolean | undefined;
            generateExplanation?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        persona: PersonaName;
        operation: {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        };
        options?: {
            preserveOriginal?: boolean | undefined;
            applyOptimizations?: boolean | undefined;
            generateExplanation?: boolean | undefined;
        } | undefined;
        context?: {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        } | undefined;
    }, {
        persona: PersonaName;
        operation: {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        };
        options?: {
            preserveOriginal?: boolean | undefined;
            applyOptimizations?: boolean | undefined;
            generateExplanation?: boolean | undefined;
        } | undefined;
        context?: {
            domain: string;
            complexity: number;
            userIntent: string;
            projectContext?: {
                projectType: string;
                framework: string;
                language: string;
                environment: string;
                phase: string;
                constraints: string[];
            } | undefined;
            sessionHistory?: any[] | undefined;
            qualityRequirements?: {
                priority: number;
                category: string;
                requirement: string;
                validationMethod: string;
            }[] | undefined;
        } | undefined;
    }>;
    CoordinatePersonasSchema: z.ZodObject<{
        personas: z.ZodArray<z.ZodEnum<[PersonaName, ...PersonaName[]]>, "many">;
        operation: z.ZodObject<{
            type: z.ZodString;
            description: z.ZodString;
            parameters: z.ZodAny;
            context: z.ZodOptional<z.ZodAny>;
            requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        }, {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        }>;
        coordinationMode: z.ZodOptional<z.ZodEnum<["parallel", "sequential", "hierarchical"]>>;
        options: z.ZodOptional<z.ZodObject<{
            enableExpertiseSharing: z.ZodOptional<z.ZodBoolean>;
            resolvePriorityConflicts: z.ZodOptional<z.ZodBoolean>;
            generateSynthesis: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enableExpertiseSharing?: boolean | undefined;
            resolvePriorityConflicts?: boolean | undefined;
            generateSynthesis?: boolean | undefined;
        }, {
            enableExpertiseSharing?: boolean | undefined;
            resolvePriorityConflicts?: boolean | undefined;
            generateSynthesis?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        personas: PersonaName[];
        operation: {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        };
        options?: {
            enableExpertiseSharing?: boolean | undefined;
            resolvePriorityConflicts?: boolean | undefined;
            generateSynthesis?: boolean | undefined;
        } | undefined;
        coordinationMode?: "sequential" | "parallel" | "hierarchical" | undefined;
    }, {
        personas: PersonaName[];
        operation: {
            type: string;
            description: string;
            context?: any;
            parameters?: any;
            requirements?: string[] | undefined;
        };
        options?: {
            enableExpertiseSharing?: boolean | undefined;
            resolvePriorityConflicts?: boolean | undefined;
            generateSynthesis?: boolean | undefined;
        } | undefined;
        coordinationMode?: "sequential" | "parallel" | "hierarchical" | undefined;
    }>;
    GetPersonaPrioritiesSchema: z.ZodObject<{
        persona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
        decisionContext: z.ZodOptional<z.ZodObject<{
            situation: z.ZodString;
            constraints: z.ZodArray<z.ZodString, "many">;
            objectives: z.ZodArray<z.ZodString, "many">;
            stakeholders: z.ZodArray<z.ZodString, "many">;
            timeline: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            constraints: string[];
            situation: string;
            objectives: string[];
            stakeholders: string[];
            timeline: string;
        }, {
            constraints: string[];
            situation: string;
            objectives: string[];
            stakeholders: string[];
            timeline: string;
        }>>;
        options: z.ZodOptional<z.ZodObject<{
            includeReasoning: z.ZodOptional<z.ZodBoolean>;
            comparativeAnalysis: z.ZodOptional<z.ZodArray<z.ZodEnum<[PersonaName, ...PersonaName[]]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            includeReasoning?: boolean | undefined;
            comparativeAnalysis?: PersonaName[] | undefined;
        }, {
            includeReasoning?: boolean | undefined;
            comparativeAnalysis?: PersonaName[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        persona: PersonaName;
        options?: {
            includeReasoning?: boolean | undefined;
            comparativeAnalysis?: PersonaName[] | undefined;
        } | undefined;
        decisionContext?: {
            constraints: string[];
            situation: string;
            objectives: string[];
            stakeholders: string[];
            timeline: string;
        } | undefined;
    }, {
        persona: PersonaName;
        options?: {
            includeReasoning?: boolean | undefined;
            comparativeAnalysis?: PersonaName[] | undefined;
        } | undefined;
        decisionContext?: {
            constraints: string[];
            situation: string;
            objectives: string[];
            stakeholders: string[];
            timeline: string;
        } | undefined;
    }>;
    ShareExpertiseSchema: z.ZodObject<{
        fromPersona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
        toPersona: z.ZodEnum<[PersonaName, ...PersonaName[]]>;
        expertise: z.ZodObject<{
            fromPersona: z.ZodString;
            domain: z.ZodString;
            insights: z.ZodArray<z.ZodString, "many">;
            recommendations: z.ZodArray<z.ZodString, "many">;
            confidence: z.ZodNumber;
            timestamp: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            domain: string;
            confidence: number;
            recommendations: string[];
            fromPersona: string;
            insights: string[];
            timestamp?: Date | undefined;
        }, {
            domain: string;
            confidence: number;
            recommendations: string[];
            fromPersona: string;
            insights: string[];
            timestamp?: Date | undefined;
        }>;
        options: z.ZodOptional<z.ZodObject<{
            preserveContext: z.ZodOptional<z.ZodBoolean>;
            enableTranslation: z.ZodOptional<z.ZodBoolean>;
            validateCompatibility: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            preserveContext?: boolean | undefined;
            enableTranslation?: boolean | undefined;
            validateCompatibility?: boolean | undefined;
        }, {
            preserveContext?: boolean | undefined;
            enableTranslation?: boolean | undefined;
            validateCompatibility?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        fromPersona: PersonaName;
        toPersona: PersonaName;
        expertise: {
            domain: string;
            confidence: number;
            recommendations: string[];
            fromPersona: string;
            insights: string[];
            timestamp?: Date | undefined;
        };
        options?: {
            preserveContext?: boolean | undefined;
            enableTranslation?: boolean | undefined;
            validateCompatibility?: boolean | undefined;
        } | undefined;
    }, {
        fromPersona: PersonaName;
        toPersona: PersonaName;
        expertise: {
            domain: string;
            confidence: number;
            recommendations: string[];
            fromPersona: string;
            insights: string[];
            timestamp?: Date | undefined;
        };
        options?: {
            preserveContext?: boolean | undefined;
            enableTranslation?: boolean | undefined;
            validateCompatibility?: boolean | undefined;
        } | undefined;
    }>;
};
//# sourceMappingURL=index.d.ts.map