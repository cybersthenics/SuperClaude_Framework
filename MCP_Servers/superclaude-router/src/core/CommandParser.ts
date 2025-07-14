import { 
  CommandParserInterface, 
  ParsedCommand, 
  ValidationResult, 
  FlagSet, 
  SuperClaudeContext 
} from '../types/index.js';

export class CommandParser implements CommandParserInterface {
  private readonly VALID_COMMANDS = [
    '/analyze', '/build', '/improve', '/scan', '/review', '/design',
    '/troubleshoot', '/task', '/explain', '/document', '/estimate',
    '/test', '/deploy', '/git', '/migrate', '/cleanup', '/dev-setup',
    '/index', '/load', '/spawn'
  ];

  private readonly VALID_FLAGS = [
    '--plan', '--think', '--think-hard', '--ultrathink', '--uc', '--ultracompressed',
    '--answer-only', '--validate', '--safe-mode', '--verbose', '--c7', '--context7',
    '--seq', '--sequential', '--magic', '--play', '--playwright', '--all-mcp',
    '--no-mcp', '--delegate', '--concurrency', '--wave-mode', '--wave-strategy',
    '--wave-delegation', '--scope', '--focus', '--loop', '--iterations',
    '--interactive', '--introspect', '--introspection'
  ];

  private readonly PERSONA_FLAGS = [
    '--persona-architect', '--persona-frontend', '--persona-backend',
    '--persona-analyzer', '--persona-security', '--persona-mentor',
    '--persona-refactorer', '--persona-performance', '--persona-qa',
    '--persona-devops', '--persona-scribe'
  ];

  parseCommand(input: string): ParsedCommand {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      throw new Error('Empty command input');
    }

    const parts = this.tokenizeInput(trimmedInput);
    const command = parts[0];
    
    if (!this.isValidCommand(command)) {
      throw new Error(`Invalid command: ${command}`);
    }

    const { args, flags } = this.separateArgsAndFlags(parts.slice(1));
    const target = this.extractTarget(args);
    const scope = this.extractScope(flags);

    return {
      command,
      arguments: args,
      flags,
      target,
      scope,
      rawInput: trimmedInput
    };
  }

  validateSyntax(command: ParsedCommand): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isValidCommand(command.command)) {
      errors.push(`Invalid command: ${command.command}`);
    }

    const flagValidation = this.validateFlags(command.flags);
    if (!flagValidation.isValid) {
      errors.push(...flagValidation.errors);
    }
    if (flagValidation.warnings) {
      warnings.push(...flagValidation.warnings);
    }

    const conflictValidation = this.checkFlagConflicts(command.flags);
    if (!conflictValidation.isValid) {
      errors.push(...conflictValidation.errors);
    }

    const argumentValidation = this.validateArguments(command);
    if (!argumentValidation.isValid) {
      errors.push(...argumentValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  extractFlags(command: ParsedCommand): FlagSet {
    const flagSet: FlagSet = {};
    
    for (const flag of command.flags) {
      if (flag.includes('=')) {
        const [key, value] = flag.split('=', 2);
        flagSet[key] = this.parseValue(value);
      } else {
        flagSet[flag] = true;
      }
    }

    return this.resolveFlagPrecedence(flagSet);
  }

  resolvePersona(command: ParsedCommand, context: SuperClaudeContext): string {
    // First check raw flags for persona patterns
    for (const flag of command.flags) {
      if (flag.startsWith('--persona-scribe=')) {
        const lang = flag.split('=')[1];
        return `scribe=${lang}`;
      } else if (flag.startsWith('--persona-')) {
        return flag.substring(10); // Remove '--persona-' prefix
      }
    }
    
    const flags = this.extractFlags(command);
    const explicitPersona = this.getExplicitPersona(flags);
    if (explicitPersona) {
      return explicitPersona;
    }

    return this.inferPersonaFromCommand(command, context);
  }

  private tokenizeInput(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens;
  }

  private isValidCommand(command: string): boolean {
    return this.VALID_COMMANDS.includes(command);
  }

  private separateArgsAndFlags(parts: string[]): { args: string[], flags: string[] } {
    const args: string[] = [];
    const flags: string[] = [];

    for (const part of parts) {
      if (part.startsWith('--')) {
        flags.push(part);
      } else {
        args.push(part);
      }
    }

    return { args, flags };
  }

  private extractTarget(args: string[]): string | undefined {
    const targetArg = args.find(arg => arg.startsWith('@'));
    return targetArg ? targetArg.substring(1) : undefined;
  }

  private extractScope(flags: string[]): string | undefined {
    const scopeFlag = flags.find(flag => flag.startsWith('--scope='));
    return scopeFlag ? scopeFlag.split('=')[1] : undefined;
  }

  private validateFlags(flags: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const flag of flags) {
      const flagName = flag.split('=')[0];
      
      if (!this.isValidFlag(flagName)) {
        errors.push(`Invalid flag: ${flagName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private isValidFlag(flag: string): boolean {
    return this.VALID_FLAGS.includes(flag) || 
           this.PERSONA_FLAGS.includes(flag) ||
           flag.startsWith('--persona-scribe=');
  }

  private checkFlagConflicts(flags: string[]): ValidationResult {
    const errors: string[] = [];
    const flagNames = flags.map(f => f.split('=')[0]);

    if (flagNames.includes('--no-mcp') && 
        (flagNames.includes('--c7') || flagNames.includes('--seq') || 
         flagNames.includes('--magic') || flagNames.includes('--play'))) {
      errors.push('Cannot use --no-mcp with specific MCP server flags');
    }

    if (flagNames.includes('--answer-only') && flagNames.includes('--plan')) {
      errors.push('Cannot use --answer-only with --plan flag');
    }

    if (flagNames.includes('--uc') && flagNames.includes('--verbose')) {
      errors.push('Cannot use --uc with --verbose flag (conflicting verbosity levels)');
    }

    const thinkingFlags = flagNames.filter(f => ['--think', '--think-hard', '--ultrathink'].includes(f));
    if (thinkingFlags.length > 1) {
      errors.push(`Multiple thinking flags not allowed: ${thinkingFlags.join(', ')}`);
    }

    const personaFlags = flagNames.filter(f => f.startsWith('--persona-'));
    if (personaFlags.length > 1) {
      errors.push(`Multiple persona flags not allowed: ${personaFlags.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateArguments(command: ParsedCommand): ValidationResult {
    const errors: string[] = [];

    switch (command.command) {
      case '/analyze':
      case '/build':
      case '/improve':
        if (command.arguments.length === 0 && !command.target) {
          errors.push(`${command.command} requires a target argument or @target`);
        }
        break;
      
      case '/scan':
        if (!command.flags.some(f => f.startsWith('--focus='))) {
          errors.push('/scan requires --focus flag (security, quality, performance)');
        }
        break;
      
      case '/persona-scribe':
        const scribeFlag = command.flags.find(f => f.startsWith('--persona-scribe='));
        if (scribeFlag) {
          const lang = scribeFlag.split('=')[1];
          if (!this.isValidLanguage(lang)) {
            errors.push(`Invalid language for scribe persona: ${lang}`);
          }
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private parseValue(value: string): string | number | boolean {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    const num = Number(value);
    if (!isNaN(num)) return num;
    
    return value;
  }

  private resolveFlagPrecedence(flagSet: FlagSet): FlagSet {
    const resolved = { ...flagSet };

    if (resolved['--safe-mode']) {
      delete resolved['--uc'];
      delete resolved['--verbose'];
      resolved['--validate'] = true;
    }

    if (resolved['--no-mcp']) {
      delete resolved['--c7'];
      delete resolved['--seq'];
      delete resolved['--magic'];
      delete resolved['--play'];
      delete resolved['--all-mcp'];
    }

    if (resolved['--ultrathink']) {
      resolved['--seq'] = true;
      resolved['--c7'] = true;
    }

    if (resolved['--think-hard']) {
      resolved['--seq'] = true;
    }

    return resolved;
  }

  private getExplicitPersona(flags: FlagSet): string | undefined {
    for (const [flag, value] of Object.entries(flags)) {
      if (flag.startsWith('--persona-')) {
        if (flag.startsWith('--persona-scribe=')) {
          const lang = flag.split('=')[1];
          return `scribe=${lang}`;
        } else if (flag === '--persona-scribe' && typeof value === 'string') {
          return `scribe=${value}`;
        } else {
          return flag.substring(10); // Remove '--persona-' prefix
        }
      }
    }
    
    return undefined;
  }

  private inferPersonaFromCommand(command: ParsedCommand, context: SuperClaudeContext): string {
    const cmdName = command.command;
    const flags = command.flags;
    const hasSecurityFocus = flags.some(f => f.includes('security'));
    const hasPerformanceFocus = flags.some(f => f.includes('performance'));
    const hasQualityFocus = flags.some(f => f.includes('quality'));

    switch (cmdName) {
      case '/analyze':
        if (hasSecurityFocus) return 'security';
        if (hasPerformanceFocus) return 'performance';
        return 'analyzer';
      
      case '/build':
        if (this.hasUIIndicators(command)) return 'frontend';
        if (this.hasBackendIndicators(command)) return 'backend';
        return 'architect';
      
      case '/improve':
        if (hasPerformanceFocus) return 'performance';
        if (hasQualityFocus) return 'refactorer';
        return 'architect';
      
      case '/scan':
        if (hasSecurityFocus) return 'security';
        return 'qa';
      
      case '/test':
        return 'qa';
      
      case '/deploy':
        return 'devops';
      
      case '/document':
        return 'scribe=en';
      
      case '/design':
        return 'frontend';
      
      default:
        return 'architect';
    }
  }

  private hasUIIndicators(command: ParsedCommand): boolean {
    const uiKeywords = ['component', 'ui', 'frontend', 'react', 'vue', 'angular', 'css'];
    const text = command.arguments.join(' ').toLowerCase();
    return uiKeywords.some(keyword => text.includes(keyword));
  }

  private hasBackendIndicators(command: ParsedCommand): boolean {
    const backendKeywords = ['api', 'server', 'database', 'backend', 'service', 'endpoint'];
    const text = command.arguments.join(' ').toLowerCase();
    return backendKeywords.some(keyword => text.includes(keyword));
  }

  private isValidLanguage(lang: string): boolean {
    const validLanguages = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'it', 'ru', 'ko'];
    return validLanguages.includes(lang);
  }
}