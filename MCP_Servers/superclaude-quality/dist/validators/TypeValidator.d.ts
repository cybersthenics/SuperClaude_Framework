import { QualityValidator, QualityValidationContext, ValidationResult, QualityGateType } from '../types/index.js';
export declare class TypeValidator implements QualityValidator {
    private logger;
    constructor();
    getName(): string;
    getType(): QualityGateType;
    isEnabled(): boolean;
    validate(context: QualityValidationContext): Promise<ValidationResult>;
}
//# sourceMappingURL=TypeValidator.d.ts.map