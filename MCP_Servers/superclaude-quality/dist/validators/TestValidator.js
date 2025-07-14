import { Logger } from '../utils/Logger.js';
export class TestValidator {
    logger;
    constructor() {
        this.logger = new Logger('TestValidator');
    }
    getName() {
        return 'test';
    }
    getType() {
        return 'test';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Test validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 75,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 400 },
            processingTime: 400
        };
    }
}
//# sourceMappingURL=TestValidator.js.map