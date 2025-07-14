#!/usr/bin/env node

// SuperClaude Personas - Simplified MCP Server
// Basic implementation for immediate deployment

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { personaRegistry } from './personas/PersonaRegistry.js';
import { PERSONA_NAMES } from './types/index.js';

class SimplePersonasServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'superclaude-personas',
        version: '1.0.0',
        description: 'SuperClaude Personas - Behavioral Intelligence Engine (Simple)'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'activate_persona',
            description: 'Activate specific persona with context',
            inputSchema: {
              type: 'object',
              properties: {
                persona: {
                  type: 'string',
                  enum: PERSONA_NAMES
                },
                context: {
                  type: 'object',
                  properties: {
                    domain: { type: 'string' },
                    complexity: { type: 'number' },
                    userIntent: { type: 'string' }
                  },
                  required: ['domain', 'complexity', 'userIntent']
                }
              },
              required: ['persona', 'context']
            }
          },
          {
            name: 'get_persona_recommendation',
            description: 'Get recommended persona for task',
            inputSchema: {
              type: 'object',
              properties: {
                taskDescription: { type: 'string' }
              },
              required: ['taskDescription']
            }
          },
          {
            name: 'get_persona_priorities',
            description: 'Get priority hierarchy for persona',
            inputSchema: {
              type: 'object',
              properties: {
                persona: {
                  type: 'string',
                  enum: PERSONA_NAMES
                }
              },
              required: ['persona']
            }
          }
        ]
      };
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'personas://definitions',
            name: 'Persona Definitions',
            description: 'Complete definitions of all SuperClaude personas',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'personas://definitions') {
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(personaRegistry.getPersonaDefinitions(), null, 2)
          }]
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;
        switch (name) {
          case 'activate_persona':
            result = await this.handleActivatePersona(args);
            break;
          case 'get_persona_recommendation':
            result = await this.handleGetPersonaRecommendation(args);
            break;
          case 'get_persona_priorities':
            result = await this.handleGetPersonaPriorities(args);
            break;
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

      } catch (error) {
        throw error;
      }
    });
  }

  private async handleActivatePersona(args: any): Promise<any> {
    const { persona, context } = args;
    
    const personaImpl = personaRegistry.getPersona(persona);
    if (!personaImpl) {
      throw new McpError(ErrorCode.InvalidRequest, `Persona ${persona} not found`);
    }

    const behaviorResult = await personaImpl.applyBehavior(context);

    return {
      success: true,
      persona,
      behaviorTransformations: behaviorResult.transformations,
      mcpPreferences: personaImpl.mcpPreferences,
      qualityStandards: personaImpl.qualityStandards,
      metadata: {
        confidenceScore: behaviorResult.confidence
      }
    };
  }

  private async handleGetPersonaRecommendation(args: any): Promise<any> {
    const { taskDescription } = args;
    
    // Simple recommendation based on keywords
    const recommendations = [];
    
    for (const personaName of PERSONA_NAMES) {
      const persona = personaRegistry.getPersona(personaName);
      if (!persona) continue;

      let confidence = 0.5;
      
      // Simple keyword matching
      if (taskDescription.toLowerCase().includes(personaName)) {
        confidence += 0.3;
      }
      
      // Check triggers
      for (const trigger of persona.autoActivationTriggers) {
        for (const pattern of trigger.patterns) {
          if (taskDescription.toLowerCase().includes(pattern)) {
            confidence += 0.2;
          }
        }
      }

      if (confidence > 0.6) {
        recommendations.push({
          persona: personaName,
          confidence: Math.min(confidence, 1),
          reasoning: `Matches ${personaName} persona patterns`,
          expectedBehaviors: persona.coreStrategies.map(s => s.approach)
        });
      }
    }

    return {
      recommendations: recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
    };
  }

  private async handleGetPersonaPriorities(args: any): Promise<any> {
    const { persona } = args;
    
    const personaImpl = personaRegistry.getPersona(persona);
    if (!personaImpl) {
      throw new McpError(ErrorCode.InvalidRequest, `Persona ${persona} not found`);
    }

    return {
      persona,
      priorities: personaImpl.priorityHierarchy,
      metadata: {
        priorityCount: personaImpl.priorityHierarchy.length
      }
    };
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SuperClaude Personas server started (simple mode)');
  }
}

// Start the server
const server = new SimplePersonasServer();
server.run().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});