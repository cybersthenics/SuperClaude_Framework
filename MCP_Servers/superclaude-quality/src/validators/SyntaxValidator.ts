/**
 * SuperClaude Quality Syntax Validator
 * Validates syntax correctness across multiple languages
 */

import {
  QualityValidator,
  QualityValidationContext,
  ValidationResult,
  QualityGateType,
  QualityIssue,
  ValidationStatus
} from '../types/index.js';

import { Logger } from '../utils/Logger.js';

export interface SyntaxValidationResult extends ValidationResult {
  syntaxErrors: SyntaxError[];
  parseErrors: ParseError[];
  languageSupport: Record<string, boolean>;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

export class SyntaxValidator implements QualityValidator {
  private logger: Logger;
  private supportedLanguages: Set<string>;

  constructor() {
    this.logger = new Logger('SyntaxValidator');
    this.supportedLanguages = new Set([
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp'
    ]);
  }

  getName(): string {
    return 'syntax';
  }

  getType(): QualityGateType {
    return 'syntax';
  }

  isEnabled(): boolean {
    return true;
  }

  async validate(context: QualityValidationContext): Promise<ValidationResult> {
    const startTime = Date.now();
    this.logger.debug('Starting syntax validation', { 
      files: context.target.files.length 
    });

    try {
      const issues: QualityIssue[] = [];
      let filesAnalyzed = 0;

      for (const file of context.target.files) {
        const fileIssues = await this.validateFileSync(file);
        issues.push(...fileIssues);
        filesAnalyzed++;
      }

      const processingTime = Date.now() - startTime;
      const score = this.calculateSyntaxScore(issues);
      const status = this.determineStatus(issues);

      this.logger.info('Syntax validation completed', {
        filesAnalyzed,
        issuesFound: issues.length,
        score,
        processingTime
      });

      return {
        status,
        valid: status === 'passed',
        score,
        issues,
        metadata: {
          filesAnalyzed,
          gateDuration: processingTime,
          languageSupport: Object.fromEntries(
            Array.from(this.supportedLanguages).map(lang => [lang, true])
          )
        },
        processingTime
      };

    } catch (error) {
      this.logger.error('Syntax validation failed', { error });
      
      return {
        status: 'failed',
        valid: false,
        score: 0,
        issues: [{
          id: 'syntax-validation-error',
          severity: 'critical',
          category: 'syntax',
          message: `Syntax validation failed: ${error.message}`,
          location: { file: '', line: 0, column: 0 },
          suggestion: 'Check file accessibility and syntax validator configuration',
          autoFixable: false,
          ruleId: 'syntax-validator-error'
        }],
        metadata: {
          filesAnalyzed: 0,
          gateDuration: Date.now() - startTime,
          error: error.message
        },
        processingTime: Date.now() - startTime
      };
    }
  }

  private async validateFileSync(filePath: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    try {
      const language = this.detectLanguage(filePath);
      
      if (!this.supportedLanguages.has(language)) {
        this.logger.debug('Unsupported language, skipping', { file: filePath, language });
        return issues;
      }

      const content = await this.readFile(filePath);
      const parseErrors = await this.parseFile(content, language, filePath);

      for (const error of parseErrors) {
        issues.push({
          id: `syntax-${Date.now()}-${Math.random()}`,
          severity: error.severity === 'error' ? 'critical' : 'medium',
          category: 'syntax',
          message: error.message,
          location: {
            file: filePath,
            line: error.line,
            column: error.column
          },
          suggestion: this.getSuggestionForError(error),
          autoFixable: this.isAutoFixable(error),
          ruleId: 'syntax-error'
        });
      }

    } catch (error) {
      this.logger.warn('File syntax validation failed', { file: filePath, error });
      
      issues.push({
        id: `syntax-file-error-${Date.now()}`,
        severity: 'medium',
        category: 'syntax',
        message: `Could not parse file: ${error.message}`,
        location: { file: filePath, line: 0, column: 0 },
        suggestion: 'Check file format and encoding',
        autoFixable: false,
        ruleId: 'file-parse-error'
      });
    }

    return issues;
  }

  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp'
    };

    return extensionMap[extension] || 'unknown';
  }

  private async readFile(filePath: string): Promise<string> {
    // Mock file reading - in real implementation would use fs
    return `// Mock content for ${filePath}`;
  }

  private async parseFile(content: string, language: string, filePath: string): Promise<ParseError[]> {
    const errors: ParseError[] = [];

    // Basic syntax checking based on language
    switch (language) {
      case 'javascript':
      case 'typescript':
        errors.push(...this.parseJavaScript(content));
        break;
      case 'python':
        errors.push(...this.parsePython(content));
        break;
      default:
        // Generic parsing
        errors.push(...this.parseGeneric(content));
    }

    return errors;
  }

  private parseJavaScript(content: string): ParseError[] {
    const errors: ParseError[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for common syntax errors
      if (this.hasUnmatchedBraces(line)) {
        errors.push({
          message: 'Unmatched braces',
          line: i + 1,
          column: line.indexOf('{') + 1,
          severity: 'error'
        });
      }

      if (this.hasMissingSemicolon(line)) {
        errors.push({
          message: 'Missing semicolon',
          line: i + 1,
          column: line.length,
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  private parsePython(content: string): ParseError[] {
    const errors: ParseError[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for indentation errors
      if (this.hasIndentationError(line, i, lines)) {
        errors.push({
          message: 'Indentation error',
          line: i + 1,
          column: 1,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  private parseGeneric(content: string): ParseError[] {
    const errors: ParseError[] = [];
    
    // Basic checks that apply to most languages
    if (content.includes('SyntaxError')) {
      errors.push({
        message: 'Syntax error detected in content',
        line: 1,
        column: 1,
        severity: 'error'
      });
    }

    return errors;
  }

  private hasUnmatchedBraces(line: string): boolean {
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    return openBraces !== closeBraces;
  }

  private hasMissingSemicolon(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.endsWith(';') && 
           !trimmed.endsWith('{') && 
           !trimmed.endsWith('}') &&
           !trimmed.startsWith('//') &&
           !trimmed.startsWith('/*');
  }

  private hasIndentationError(line: string, index: number, lines: string[]): boolean {
    // Simplified Python indentation check
    if (index === 0) return false;
    
    const currentIndent = line.length - line.trimStart().length;
    const prevLine = lines[index - 1];
    const prevIndent = prevLine.length - prevLine.trimStart().length;
    
    // Check if indentation is not a multiple of standard (4 spaces)
    return currentIndent % 4 !== 0 && line.trim().length > 0;
  }

  private getSuggestionForError(error: ParseError): string {
    if (error.message.includes('brace')) {
      return 'Check for matching opening and closing braces';
    }
    if (error.message.includes('semicolon')) {
      return 'Add missing semicolon at end of statement';
    }
    if (error.message.includes('indentation')) {
      return 'Use consistent indentation (4 spaces recommended)';
    }
    return 'Review syntax and fix the error';
  }

  private isAutoFixable(error: ParseError): boolean {
    return error.message.includes('semicolon') || error.message.includes('indentation');
  }

  private calculateSyntaxScore(issues: QualityIssue[]): number {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    // Score calculation: start at 100, deduct points for issues
    let score = 100;
    score -= criticalIssues * 20;
    score -= highIssues * 10;
    score -= mediumIssues * 5;

    return Math.max(0, score);
  }

  private determineStatus(issues: QualityIssue[]): ValidationStatus {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) return 'failed';
    if (highIssues > 0) return 'warning';
    return 'passed';
  }
}