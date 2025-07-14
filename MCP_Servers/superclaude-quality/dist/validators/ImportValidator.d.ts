import { QualityValidator, QualityValidationContext, ValidationResult, QualityGateType } from '../types/index.js';
export declare class ImportValidator implements QualityValidator {
    private logger;
    constructor();
    getName(): string;
    getType(): QualityGateType;
    isEnabled(): boolean;
    validate(context: QualityValidationContext): Promise<ValidationResult>;
}
//# sourceMappingURL=ImportValidator.d.ts.map