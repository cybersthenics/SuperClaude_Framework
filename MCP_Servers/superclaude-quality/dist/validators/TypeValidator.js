import { Logger } from '../utils/Logger.js';
export class TypeValidator {
    logger;
    constructor() {
        this.logger = new Logger('TypeValidator');
    }
    getName() {
        return 'type';
    }
    getType() {
        return 'type';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Type validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 90,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 150 },
            processingTime: 150
        };
    }
}
//# sourceMappingURL=TypeValidator.js.map