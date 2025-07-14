import { 
  RoutingTableInterface, 
  RoutingRule, 
  RoutingTable as RoutingTableType, 
  ValidationResult 
} from '../types/index.js';

export class RoutingTable implements RoutingTableInterface {
  private routingTable: RoutingTableType;

  constructor() {
    this.routingTable = this.getDefaultRoutingTable();
    this.loadRoutingRules();
  }

  loadRoutingRules(): void {
    this.routingTable = {
      commands: {
        '/analyze': {
          command: '/analyze',
          primary: 'superclaude-intelligence',
          fallback: ['superclaude-orchestrator'],
          personas: ['analyzer', 'architect'],
          complexityThreshold: 0.6
        },
        '/build': {
          command: '/build',
          primary: 'superclaude-builder',
          fallback: ['superclaude-orchestrator'],
          personas: ['frontend', 'backend', 'architect'],
          flagsRequired: []
        },
        '/improve': {
          command: '/improve',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-builder'],
          personas: ['refactorer', 'performance', 'architect'],
          complexityThreshold: 0.7
        },
        '/scan': {
          command: '/scan',
          primary: 'superclaude-quality',
          fallback: ['superclaude-orchestrator'],
          personas: ['security', 'qa'],
          flagsInfluence: ['--security', '--focus']
        },
        '/review': {
          command: '/review',
          primary: 'superclaude-quality',
          fallback: ['superclaude-intelligence'],
          personas: ['qa', 'analyzer', 'architect'],
          complexityThreshold: 0.5
        },
        '/design': {
          command: '/design',
          primary: 'superclaude-ui',
          fallback: ['superclaude-orchestrator'],
          personas: ['architect', 'frontend'],
          flagsInfluence: ['--magic']
        },
        '/troubleshoot': {
          command: '/troubleshoot',
          primary: 'superclaude-intelligence',
          fallback: ['superclaude-orchestrator'],
          personas: ['analyzer', 'qa'],
          complexityThreshold: 0.6
        },
        '/task': {
          command: '/task',
          primary: 'superclaude-tasks',
          fallback: ['superclaude-orchestrator'],
          personas: ['architect', 'analyzer'],
          complexityThreshold: 0.7
        },
        '/explain': {
          command: '/explain',
          primary: 'superclaude-intelligence',
          fallback: ['superclaude-orchestrator'],
          personas: ['mentor', 'scribe'],
          complexityThreshold: 0.3
        },
        '/document': {
          command: '/document',
          primary: 'superclaude-docs',
          fallback: ['superclaude-orchestrator'],
          personas: ['scribe', 'mentor'],
          flagsInfluence: ['--persona-scribe']
        },
        '/estimate': {
          command: '/estimate',
          primary: 'superclaude-intelligence',
          fallback: ['superclaude-orchestrator'],
          personas: ['analyzer', 'architect'],
          complexityThreshold: 0.5
        },
        '/test': {
          command: '/test',
          primary: 'superclaude-quality',
          fallback: ['superclaude-orchestrator'],
          personas: ['qa'],
          flagsInfluence: ['--playwright']
        },
        '/deploy': {
          command: '/deploy',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-tasks'],
          personas: ['devops', 'backend'],
          complexityThreshold: 0.8
        },
        '/git': {
          command: '/git',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-tasks'],
          personas: ['devops', 'scribe', 'qa'],
          complexityThreshold: 0.3
        },
        '/migrate': {
          command: '/migrate',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-tasks'],
          personas: ['backend', 'devops'],
          complexityThreshold: 0.8
        },
        '/cleanup': {
          command: '/cleanup',
          primary: 'superclaude-quality',
          fallback: ['superclaude-orchestrator'],
          personas: ['refactorer'],
          complexityThreshold: 0.5
        },
        '/dev-setup': {
          command: '/dev-setup',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-tasks'],
          personas: ['devops', 'backend'],
          complexityThreshold: 0.6
        },
        '/index': {
          command: '/index',
          primary: 'superclaude-intelligence',
          fallback: ['superclaude-orchestrator'],
          personas: ['mentor', 'analyzer'],
          complexityThreshold: 0.3
        },
        '/load': {
          command: '/load',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-intelligence'],
          personas: ['analyzer', 'architect', 'scribe'],
          complexityThreshold: 0.4
        },
        '/spawn': {
          command: '/spawn',
          primary: 'superclaude-orchestrator',
          fallback: ['superclaude-tasks'],
          personas: ['analyzer', 'architect', 'devops'],
          complexityThreshold: 0.8
        }
      },
      externalMcp: {
        context7Patterns: [
          'documentation', 'patterns', 'library', 'framework', 'api-docs',
          'best-practices', 'standards', 'conventions', 'examples', 'guides'
        ],
        sequentialPatterns: [
          'complex', 'analysis', 'multi-step', 'systematic', 'debugging',
          'investigation', 'reasoning', 'problem-solving', 'planning', 'strategy'
        ],
        magicPatterns: [
          'component', 'ui', 'design', 'interface', 'frontend', 'react',
          'vue', 'angular', 'css', 'styling', 'responsive', 'accessibility'
        ],
        playwrightPatterns: [
          'test', 'e2e', 'browser', 'automation', 'testing', 'validation',
          'performance', 'user-interaction', 'ui-testing', 'cross-browser'
        ]
      }
    };
  }

  updateRoutingRules(rules: RoutingRule[]): void {
    const validation = this.validateRules(rules);
    if (!validation.isValid) {
      throw new Error(`Invalid routing rules: ${validation.errors.join(', ')}`);
    }

    for (const rule of rules) {
      this.routingTable.commands[rule.command] = rule;
    }
  }

  getConfiguration(): RoutingTableType {
    return { ...this.routingTable };
  }

  getAllServerNames(): string[] {
    const servers = new Set<string>();
    
    Object.values(this.routingTable.commands).forEach(rule => {
      servers.add(rule.primary);
      if (rule.fallback) {
        rule.fallback.forEach(server => servers.add(server));
      }
    });

    return Array.from(servers);
  }

  validateRules(rules: RoutingRule[]): ValidationResult {
    const errors: string[] = [];
    const validServers = this.getValidServerNames();
    const validCommands = this.getValidCommands();

    for (const rule of rules) {
      if (!validCommands.includes(rule.command)) {
        errors.push(`Invalid command: ${rule.command}`);
      }

      if (!validServers.includes(rule.primary)) {
        errors.push(`Invalid primary server: ${rule.primary}`);
      }

      if (rule.fallback) {
        for (const fallbackServer of rule.fallback) {
          if (!validServers.includes(fallbackServer)) {
            errors.push(`Invalid fallback server: ${fallbackServer}`);
          }
        }
      }

      if (rule.complexityThreshold !== undefined) {
        if (rule.complexityThreshold < 0 || rule.complexityThreshold > 1) {
          errors.push(`Invalid complexity threshold: ${rule.complexityThreshold} (must be 0-1)`);
        }
      }

      if (rule.personas) {
        const validPersonas = this.getValidPersonas();
        for (const persona of rule.personas) {
          if (!validPersonas.includes(persona)) {
            errors.push(`Invalid persona: ${persona}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRoutingRule(command: string): RoutingRule | undefined {
    return this.routingTable.commands[command];
  }

  getExternalMCPPatterns(): RoutingTableType['externalMcp'] {
    return this.routingTable.externalMcp;
  }

  private getDefaultRoutingTable(): RoutingTableType {
    return {
      commands: {},
      externalMcp: {
        context7Patterns: [],
        sequentialPatterns: [],
        magicPatterns: [],
        playwrightPatterns: []
      }
    };
  }

  private getValidServerNames(): string[] {
    return [
      'superclaude-orchestrator',
      'superclaude-intelligence',
      'superclaude-builder',
      'superclaude-quality',
      'superclaude-personas',
      'superclaude-tasks',
      'superclaude-docs',
      'superclaude-ui',
      'superclaude-performance'
    ];
  }

  private getValidCommands(): string[] {
    return [
      '/analyze', '/build', '/improve', '/scan', '/review', '/design',
      '/troubleshoot', '/task', '/explain', '/document', '/estimate',
      '/test', '/deploy', '/git', '/migrate', '/cleanup', '/dev-setup',
      '/index', '/load', '/spawn'
    ];
  }

  private getValidPersonas(): string[] {
    return [
      'architect', 'frontend', 'backend', 'analyzer', 'security',
      'mentor', 'refactorer', 'performance', 'qa', 'devops', 'scribe'
    ];
  }
}