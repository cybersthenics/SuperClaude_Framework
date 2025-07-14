import { Logger } from '../utils/Logger.js';
export class SyntaxValidator {
    logger;
    supportedLanguages;
    constructor() {
        this.logger = new Logger('SyntaxValidator');
        this.supportedLanguages = new Set([
            'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp'
        ]);
    }
    getName() {
        return 'syntax';
    }
    getType() {
        return 'syntax';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        const startTime = Date.now();
        this.logger.debug('Starting syntax validation', {
            files: context.target.files.length
        });
        try {
            const issues = [];
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
                    languageSupport: Object.fromEntries(Array.from(this.supportedLanguages).map(lang => [lang, true]))
                },
                processingTime
            };
        }
        catch (error) {
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
    async validateFileSync(filePath) {
        const issues = [];
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
        }
        catch (error) {
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
    detectLanguage(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase() || '';
        const extensionMap = {
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
    async readFile(filePath) {
        return `// Mock content for ${filePath}`;
    }
    async parseFile(content, language, filePath) {
        const errors = [];
        switch (language) {
            case 'javascript':
            case 'typescript':
                errors.push(...this.parseJavaScript(content));
                break;
            case 'python':
                errors.push(...this.parsePython(content));
                break;
            default:
                errors.push(...this.parseGeneric(content));
        }
        return errors;
    }
    parseJavaScript(content) {
        const errors = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
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
    parsePython(content) {
        const errors = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
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
    parseGeneric(content) {
        const errors = [];
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
    hasUnmatchedBraces(line) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        return openBraces !== closeBraces;
    }
    hasMissingSemicolon(line) {
        const trimmed = line.trim();
        return trimmed.length > 0 &&
            !trimmed.endsWith(';') &&
            !trimmed.endsWith('{') &&
            !trimmed.endsWith('}') &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('/*');
    }
    hasIndentationError(line, index, lines) {
        if (index === 0)
            return false;
        const currentIndent = line.length - line.trimStart().length;
        const prevLine = lines[index - 1];
        const prevIndent = prevLine.length - prevLine.trimStart().length;
        return currentIndent % 4 !== 0 && line.trim().length > 0;
    }
    getSuggestionForError(error) {
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
    isAutoFixable(error) {
        return error.message.includes('semicolon') || error.message.includes('indentation');
    }
    calculateSyntaxScore(issues) {
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const highIssues = issues.filter(i => i.severity === 'high').length;
        const mediumIssues = issues.filter(i => i.severity === 'medium').length;
        let score = 100;
        score -= criticalIssues * 20;
        score -= highIssues * 10;
        score -= mediumIssues * 5;
        return Math.max(0, score);
    }
    determineStatus(issues) {
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const highIssues = issues.filter(i => i.severity === 'high').length;
        if (criticalIssues > 0)
            return 'failed';
        if (highIssues > 0)
            return 'warning';
        return 'passed';
    }
}
//# sourceMappingURL=SyntaxValidator.js.map