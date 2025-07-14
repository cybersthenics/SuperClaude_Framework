import { 
  RoutingEngineInterface, 
  ParsedCommand, 
  SuperClaudeContext, 
  RoutingDecision, 
  ServerMatch, 
  HealthStatus 
} from '../types/index.js';
import { RoutingTable } from '../routing/RoutingTable.js';
import { ServerHealth } from '../routing/ServerHealth.js';
import { CircuitBreaker } from '../routing/CircuitBreaker.js';

export class RoutingEngine implements RoutingEngineInterface {
  private routingTable: RoutingTable;
  private serverHealth: ServerHealth;
  private circuitBreaker: CircuitBreaker;

  constructor(
    routingTable: RoutingTable,
    serverHealth: ServerHealth,
    circuitBreaker: CircuitBreaker
  ) {
    this.routingTable = routingTable;
    this.serverHealth = serverHealth;
    this.circuitBreaker = circuitBreaker;
  }

  async determineTargetServer(
    command: ParsedCommand, 
    context: SuperClaudeContext
  ): Promise<RoutingDecision> {
    const startTime = Date.now();
    
    const rule = this.routingTable.getRoutingRule(command.command);
    if (!rule) {
      return this.createFallbackDecision(command, 'No routing rule found');
    }

    const complexity = this.calculateComplexity(command, context);
    const matches = this.evaluateRoutingRules(command.command, command.flags);
    
    const primaryServer = await this.selectOptimalServer(matches, rule.primary);
    const fallbackServers = await this.selectFallbackServers(rule.fallback || []);
    
    const estimatedLatency = Date.now() - startTime;
    
    return {
      targetServer: primaryServer,
      confidence: this.calculateConfidence(rule, complexity, matches),
      routingReason: this.generateRoutingReason(rule, complexity, command),
      fallbackServers,
      estimatedLatency
    };
  }

  evaluateRoutingRules(command: string, flags: string[]): ServerMatch[] {
    const rule = this.routingTable.getRoutingRule(command);
    if (!rule) {
      return [];
    }

    const matches: ServerMatch[] = [];
    
    const primaryMatch: ServerMatch = {
      serverName: rule.primary,
      score: this.calculateServerScore(rule.primary, flags, rule),
      reason: `Primary server for ${command}`
    };
    matches.push(primaryMatch);

    if (rule.fallback) {
      for (const fallbackServer of rule.fallback) {
        const fallbackMatch: ServerMatch = {
          serverName: fallbackServer,
          score: this.calculateServerScore(fallbackServer, flags, rule) * 0.8,
          reason: `Fallback server for ${command}`
        };
        matches.push(fallbackMatch);
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  async selectOptimalServer(matches: ServerMatch[], preferredServer?: string): Promise<string> {
    if (preferredServer && this.circuitBreaker.checkServerAvailability(preferredServer)) {
      const isHealthy = this.serverHealth.isServerHealthy(preferredServer);
      if (isHealthy) {
        return preferredServer;
      }
    }

    for (const match of matches) {
      if (this.circuitBreaker.checkServerAvailability(match.serverName)) {
        const isHealthy = this.serverHealth.isServerHealthy(match.serverName);
        if (isHealthy) {
          return match.serverName;
        }
      }
    }

    return matches.length > 0 ? matches[0].serverName : 'superclaude-orchestrator';
  }

  async checkServerHealth(serverName: string): Promise<HealthStatus> {
    return await this.serverHealth.checkServerHealth(serverName);
  }

  shouldUseExternalMCP(command: ParsedCommand, flags: string[]): {
    context7: boolean;
    sequential: boolean;
    magic: boolean;
    playwright: boolean;
  } {
    const patterns = this.routingTable.getExternalMCPPatterns();
    const commandText = `${command.command} ${command.arguments.join(' ')}`.toLowerCase();
    const flagText = flags.join(' ').toLowerCase();
    const allText = `${commandText} ${flagText}`;

    return {
      context7: this.matchesPatterns(allText, patterns.context7Patterns) || 
                flags.includes('--c7') || flags.includes('--context7'),
      sequential: this.matchesPatterns(allText, patterns.sequentialPatterns) || 
                  flags.includes('--seq') || flags.includes('--sequential') ||
                  flags.some(f => f.startsWith('--think')),
      magic: this.matchesPatterns(allText, patterns.magicPatterns) || 
             flags.includes('--magic'),
      playwright: this.matchesPatterns(allText, patterns.playwrightPatterns) || 
                  flags.includes('--play') || flags.includes('--playwright')
    };
  }

  private calculateComplexity(command: ParsedCommand, context: SuperClaudeContext): number {
    let complexity = 0.3; // Base complexity

    if (command.arguments.length > 3) complexity += 0.2;
    if (command.flags.length > 2) complexity += 0.1;
    
    const complexFlags = ['--think-hard', '--ultrathink', '--all-mcp', '--wave-mode'];
    if (command.flags.some(flag => complexFlags.includes(flag))) {
      complexity += 0.3;
    }

    const complexCommands = ['/analyze', '/improve', '/design', '/deploy', '/migrate'];
    if (complexCommands.includes(command.command)) {
      complexity += 0.2;
    }

    if (command.target && command.target.includes('*')) {
      complexity += 0.2;
    }

    return Math.min(complexity, 1.0);
  }

  private calculateServerScore(
    serverName: string, 
    flags: string[], 
    rule: any
  ): number {
    let score = 1.0;

    if (!this.circuitBreaker.checkServerAvailability(serverName)) {
      score *= 0.1;
    }

    if (!this.serverHealth.isServerHealthy(serverName)) {
      score *= 0.5;
    }

    if (rule.flagsInfluence) {
      const hasInfluentialFlags = flags.some(flag => 
        rule.flagsInfluence.some((influenceFlag: string) => flag.includes(influenceFlag))
      );
      if (hasInfluentialFlags) {
        score *= 1.2;
      }
    }

    const serverLoad = this.getServerLoad(serverName);
    score *= (1 - serverLoad * 0.3);

    return Math.max(score, 0.1);
  }

  private async selectFallbackServers(fallbackList: string[]): Promise<string[]> {
    const availableFallbacks: string[] = [];
    
    for (const server of fallbackList) {
      if (this.circuitBreaker.checkServerAvailability(server) && 
          this.serverHealth.isServerHealthy(server)) {
        availableFallbacks.push(server);
      }
    }

    if (availableFallbacks.length === 0 && fallbackList.length > 0) {
      availableFallbacks.push('superclaude-orchestrator');
    }

    return availableFallbacks;
  }

  private calculateConfidence(rule: any, complexity: number, matches: ServerMatch[]): number {
    let confidence = 0.8; // Base confidence

    if (rule.complexityThreshold && complexity > rule.complexityThreshold) {
      confidence *= 0.9;
    }

    const primaryMatch = matches.find(m => m.serverName === rule.primary);
    if (primaryMatch && primaryMatch.score > 0.8) {
      confidence *= 1.1;
    }

    if (matches.length < 2) {
      confidence *= 0.9;
    }

    return Math.min(confidence, 1.0);
  }

  private generateRoutingReason(rule: any, complexity: number, command: ParsedCommand): string {
    const reasons: string[] = [];
    
    reasons.push(`Command ${command.command} routed to ${rule.primary}`);
    
    if (rule.complexityThreshold && complexity > rule.complexityThreshold) {
      reasons.push(`complexity score ${complexity.toFixed(2)} above threshold ${rule.complexityThreshold}`);
    }

    if (command.flags.length > 0) {
      const relevantFlags = command.flags.filter(flag => 
        rule.flagsInfluence?.includes(flag) || 
        ['--think', '--seq', '--magic', '--c7'].some(f => flag.includes(f))
      );
      if (relevantFlags.length > 0) {
        reasons.push(`flags: ${relevantFlags.join(', ')}`);
      }
    }

    return reasons.join('; ');
  }

  private createFallbackDecision(command: ParsedCommand, reason: string): RoutingDecision {
    return {
      targetServer: 'superclaude-orchestrator',
      confidence: 0.5,
      routingReason: `Fallback routing: ${reason}`,
      fallbackServers: [],
      estimatedLatency: 0
    };
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern.toLowerCase()));
  }

  private getServerLoad(serverName: string): number {
    const healthStatus = this.serverHealth.getHealthStatus(serverName);
    if (!healthStatus?.metrics) {
      return 0.3; // Default moderate load
    }

    const { averageResponseTime, errorRate } = healthStatus.metrics;
    const responseTimeLoad = Math.min(averageResponseTime / 1000, 1); // Normalize to 0-1
    const errorLoad = Math.min(errorRate * 10, 1); // Scale error rate
    
    return (responseTimeLoad + errorLoad) / 2;
  }
}