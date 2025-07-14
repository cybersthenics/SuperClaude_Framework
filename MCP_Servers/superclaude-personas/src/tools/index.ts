// SuperClaude Personas - Tools Index
// Export all MCP tools for the personas server

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PersonaName, PERSONA_NAMES } from '../types';

// Tool input schemas
export const ActivatePersonaSchema = z.object({
  persona: z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]]),
  context: z.object({
    domain: z.string(),
    complexity: z.number().min(0).max(1),
    userIntent: z.string(),
    projectContext: z.object({
      projectType: z.string(),
      framework: z.string(),
      language: z.string(),
      environment: z.string(),
      phase: z.string(),
      constraints: z.array(z.string())
    }).optional(),
    sessionHistory: z.array(z.any()).optional(),
    qualityRequirements: z.array(z.object({
      category: z.string(),
      requirement: z.string(),
      priority: z.number(),
      validationMethod: z.string()
    })).optional()
  }),
  options: z.object({
    forceActivation: z.boolean().optional(),
    preserveStack: z.boolean().optional(),
    collaborationMode: z.enum(['single', 'parallel', 'chain']).optional()
  }).optional()
});

export const GetPersonaRecommendationSchema = z.object({
  taskDescription: z.string(),
  projectContext: z.object({
    projectType: z.string(),
    framework: z.string(),
    language: z.string(),
    environment: z.string(),
    phase: z.string(),
    constraints: z.array(z.string())
  }).optional(),
  userHistory: z.object({
    recentCommands: z.array(z.string()).optional(),
    personaPreferences: z.array(z.any()).optional(),
    successfulPatterns: z.array(z.string()).optional(),
    feedbackHistory: z.array(z.any()).optional()
  }).optional(),
  systemState: z.object({
    performance: z.object({
      responseTime: z.number(),
      throughput: z.number(),
      errorRate: z.number(),
      cpuUsage: z.number(),
      memoryUsage: z.number()
    }).optional(),
    resourceUsage: z.object({
      cpu: z.number(),
      memory: z.number(),
      disk: z.number(),
      network: z.number()
    }).optional(),
    errorRate: z.number().optional(),
    activeConnections: z.number().optional()
  }).optional(),
  currentPersona: z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]]).optional(),
  options: z.object({
    includeConfidenceBreakdown: z.boolean().optional(),
    maxRecommendations: z.number().optional(),
    excludePersonas: z.array(z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]])).optional()
  }).optional()
});

export const ApplyPersonaBehaviorSchema = z.object({
  persona: z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]]),
  operation: z.object({
    type: z.string(),
    description: z.string(),
    parameters: z.any(),
    context: z.any().optional(),
    requirements: z.array(z.string()).optional()
  }),
  context: z.object({
    domain: z.string(),
    complexity: z.number().min(0).max(1),
    userIntent: z.string(),
    projectContext: z.object({
      projectType: z.string(),
      framework: z.string(),
      language: z.string(),
      environment: z.string(),
      phase: z.string(),
      constraints: z.array(z.string())
    }).optional(),
    sessionHistory: z.array(z.any()).optional(),
    qualityRequirements: z.array(z.object({
      category: z.string(),
      requirement: z.string(),
      priority: z.number(),
      validationMethod: z.string()
    })).optional()
  }).optional(),
  options: z.object({
    preserveOriginal: z.boolean().optional(),
    applyOptimizations: z.boolean().optional(),
    generateExplanation: z.boolean().optional()
  }).optional()
});

export const CoordinatePersonasSchema = z.object({
  personas: z.array(z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]])),
  operation: z.object({
    type: z.string(),
    description: z.string(),
    parameters: z.any(),
    context: z.any().optional(),
    requirements: z.array(z.string()).optional()
  }),
  coordinationMode: z.enum(['parallel', 'sequential', 'hierarchical']).optional(),
  options: z.object({
    enableExpertiseSharing: z.boolean().optional(),
    resolvePriorityConflicts: z.boolean().optional(),
    generateSynthesis: z.boolean().optional()
  }).optional()
});

export const GetPersonaPrioritiesSchema = z.object({
  persona: z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]]),
  decisionContext: z.object({
    situation: z.string(),
    constraints: z.array(z.string()),
    objectives: z.array(z.string()),
    stakeholders: z.array(z.string()),
    timeline: z.string()
  }).optional(),
  options: z.object({
    includeReasoning: z.boolean().optional(),
    comparativeAnalysis: z.array(z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]])).optional()
  }).optional()
});

export const ShareExpertiseSchema = z.object({
  fromPersona: z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]]),
  toPersona: z.enum(PERSONA_NAMES as [PersonaName, ...PersonaName[]]),
  expertise: z.object({
    fromPersona: z.string(),
    domain: z.string(),
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    timestamp: z.date().optional()
  }),
  options: z.object({
    preserveContext: z.boolean().optional(),
    enableTranslation: z.boolean().optional(),
    validateCompatibility: z.boolean().optional()
  }).optional()
});

// Tool definitions
export const activatePersonaTool: Tool = {
  name: 'activate_persona',
  description: 'Activate specific persona with context for behavioral transformation',
  inputSchema: ActivatePersonaSchema.describe('Activate persona tool schema')
};

export const getPersonaRecommendationTool: Tool = {
  name: 'get_persona_recommendation',
  description: 'Get recommended persona for task with confidence scoring',
  inputSchema: GetPersonaRecommendationSchema.describe('Get persona recommendation tool schema')
};

export const applyPersonaBehaviorTool: Tool = {
  name: 'apply_persona_behavior',
  description: 'Apply persona-specific transformations to operations',
  inputSchema: ApplyPersonaBehaviorSchema.describe('Apply persona behavior tool schema')
};

export const coordinatePersonasTool: Tool = {
  name: 'coordinate_personas',
  description: 'Manage multi-persona collaboration and coordination',
  inputSchema: CoordinatePersonasSchema.describe('Coordinate personas tool schema')
};

export const getPersonaPrioritiesTool: Tool = {
  name: 'get_persona_priorities',
  description: 'Get priority hierarchy for persona decision making',
  inputSchema: GetPersonaPrioritiesSchema.describe('Get persona priorities tool schema')
};

export const shareExpertiseTool: Tool = {
  name: 'share_expertise',
  description: 'Share insights and expertise between personas',
  inputSchema: ShareExpertiseSchema.describe('Share expertise tool schema')
};

// Export all tools
export const tools: Tool[] = [
  activatePersonaTool,
  getPersonaRecommendationTool,
  applyPersonaBehaviorTool,
  coordinatePersonasTool,
  getPersonaPrioritiesTool,
  shareExpertiseTool
];

// Export schemas for use in handlers
export const schemas = {
  ActivatePersonaSchema,
  GetPersonaRecommendationSchema,
  ApplyPersonaBehaviorSchema,
  CoordinatePersonasSchema,
  GetPersonaPrioritiesSchema,
  ShareExpertiseSchema
};