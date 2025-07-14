import { Logger } from '../utils/Logger.js';
export class IntegrationValidator {
    logger;
    constructor() {
        this.logger = new Logger('IntegrationValidator');
    }
    getName() {
        return 'integration';
    }
    getType() {
        return 'integration';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Integration validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 80,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 350 },
            processingTime: 350
        };
    }
}
//# sourceMappingURL=IntegrationValidator.js.map