import { QualityValidator, QualityValidationContext, ValidationResult, QualityGateType } from '../types/index.js';
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
export declare class SyntaxValidator implements QualityValidator {
    private logger;
    private supportedLanguages;
    constructor();
    getName(): string;
    getType(): QualityGateType;
    isEnabled(): boolean;
    validate(context: QualityValidationContext): Promise<ValidationResult>;
    private validateFileSync;
    private detectLanguage;
    private readFile;
    private parseFile;
    private parseJavaScript;
    private parsePython;
    private parseGeneric;
    private hasUnmatchedBraces;
    private hasMissingSemicolon;
    private hasIndentationError;
    private getSuggestionForError;
    private isAutoFixable;
    private calculateSyntaxScore;
    private determineStatus;
}
//# sourceMappingURL=SyntaxValidator.d.ts.map