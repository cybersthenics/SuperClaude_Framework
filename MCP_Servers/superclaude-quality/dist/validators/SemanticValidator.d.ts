import { QualityValidator, QualityValidationContext, ValidationResult, QualityGateType } from '../types/index.js';
export declare class SemanticValidator implements QualityValidator {
    private logger;
    constructor();
    getName(): string;
    getType(): QualityGateType;
    isEnabled(): boolean;
    validate(context: QualityValidationContext): Promise<ValidationResult>;
}
//# sourceMappingURL=SemanticValidator.d.ts.map