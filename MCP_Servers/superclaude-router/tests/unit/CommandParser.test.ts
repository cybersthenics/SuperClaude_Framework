import { describe, it, expect, beforeEach } from 'vitest';
import { CommandParser } from '../../src/core/CommandParser.js';

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  describe('parseCommand', () => {
    it('should parse basic commands correctly', () => {
      const result = parser.parseCommand('/analyze @src/api');
      
      expect(result.command).toBe('/analyze');
      expect(result.arguments).toContain('@src/api');
      expect(result.target).toBe('src/api');
    });

    it('should extract flags correctly', () => {
      const result = parser.parseCommand('/improve --loop --iterations=5');
      
      expect(result.command).toBe('/improve');
      expect(result.flags).toContain('--loop');
      expect(result.flags).toContain('--iterations=5');
    });

    it('should handle commands with quotes', () => {
      const result = parser.parseCommand('/document "API Reference" --persona-scribe=en');
      
      expect(result.command).toBe('/document');
      expect(result.arguments).toContain('API Reference');
      expect(result.flags).toContain('--persona-scribe=en');
    });

    it('should throw error for empty input', () => {
      expect(() => parser.parseCommand('')).toThrow('Empty command input');
    });

    it('should throw error for invalid command', () => {
      expect(() => parser.parseCommand('/invalid-command')).toThrow('Invalid command: /invalid-command');
    });
  });

  describe('validateSyntax', () => {
    it('should validate correct command syntax', () => {
      const command = parser.parseCommand('/analyze @src --think');
      const result = parser.validateSyntax(command);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid flags', () => {
      const command = {
        command: '/analyze',
        arguments: [],
        flags: ['--invalid-flag'],
        rawInput: '/analyze --invalid-flag'
      };
      
      const result = parser.validateSyntax(command);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid flag: --invalid-flag');
    });

    it('should detect flag conflicts', () => {
      const command = {
        command: '/analyze',
        arguments: [],
        flags: ['--no-mcp', '--seq'],
        rawInput: '/analyze --no-mcp --seq'
      };
      
      const result = parser.validateSyntax(command);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Cannot use --no-mcp with specific MCP server flags'))).toBe(true);
    });

    it('should detect multiple persona flags', () => {
      const command = {
        command: '/analyze',
        arguments: [],
        flags: ['--persona-analyst', '--persona-architect'],
        rawInput: '/analyze --persona-analyst --persona-architect'
      };
      
      const result = parser.validateSyntax(command);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Multiple persona flags not allowed'))).toBe(true);
    });
  });

  describe('extractFlags', () => {
    it('should extract boolean flags', () => {
      const command = parser.parseCommand('/analyze --think --verbose');
      const flags = parser.extractFlags(command);
      
      expect(flags['--think']).toBe(true);
      expect(flags['--verbose']).toBe(true);
    });

    it('should extract flags with values', () => {
      const command = parser.parseCommand('/improve --iterations=3 --scope=module');
      const flags = parser.extractFlags(command);
      
      expect(flags['--iterations']).toBe(3);
      expect(flags['--scope']).toBe('module');
    });

    it('should handle flag precedence', () => {
      const command = parser.parseCommand('/analyze --safe-mode --verbose');
      const flags = parser.extractFlags(command);
      
      expect(flags['--safe-mode']).toBe(true);
      expect(flags['--validate']).toBe(true);
      expect(flags['--verbose']).toBeUndefined(); // Should be removed by safe mode
    });
  });

  describe('resolvePersona', () => {
    it('should return explicit persona', () => {
      const command = parser.parseCommand('/analyze --persona-security');
      const persona = parser.resolvePersona(command, {});
      
      expect(persona).toBe('security');
    });

    it('should infer persona from command', () => {
      const command = parser.parseCommand('/scan --focus=security');
      const persona = parser.resolvePersona(command, {});
      
      expect(persona).toBe('security');
    });

    it('should infer persona from content', () => {
      const command = parser.parseCommand('/build component ui');
      const persona = parser.resolvePersona(command, {});
      
      expect(persona).toBe('frontend');
    });

    it('should handle scribe persona with language', () => {
      const command = parser.parseCommand('/document --persona-scribe=es');
      const persona = parser.resolvePersona(command, {});
      
      expect(persona).toBe('scribe=es');
    });
  });

  describe('edge cases', () => {
    it('should handle complex command with multiple flags and arguments', () => {
      const input = '/improve @src/api --think-hard --persona-backend --iterations=5 --scope=project "fix performance issues"';
      const result = parser.parseCommand(input);
      
      expect(result.command).toBe('/improve');
      expect(result.target).toBe('src/api');
      expect(result.flags).toContain('--think-hard');
      expect(result.flags).toContain('--persona-backend');
      expect(result.flags).toContain('--iterations=5');
      expect(result.flags).toContain('--scope=project');
      expect(result.arguments).toContain('fix performance issues');
    });

    it('should handle commands with no arguments', () => {
      const result = parser.parseCommand('/index');
      
      expect(result.command).toBe('/index');
      expect(result.arguments).toHaveLength(0);
      expect(result.flags).toHaveLength(0);
    });

    it('should handle mixed quotes', () => {
      const result = parser.parseCommand('/document "API Guide" \'User Manual\' --format=md');
      
      expect(result.arguments).toContain('API Guide');
      expect(result.arguments).toContain('User Manual');
      expect(result.flags).toContain('--format=md');
    });
  });
});