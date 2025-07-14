import { QualityValidator, QualityValidationContext, ValidationResult, QualityGateType } from '../types/index.js';
export declare class IntegrationValidator implements QualityValidator {
    private logger;
    constructor();
    getName(): string;
    getType(): QualityGateType;
    isEnabled(): boolean;
    validate(context: QualityValidationContext): Promise<ValidationResult>;
}
//# sourceMappingURL=IntegrationValidator.d.ts.map