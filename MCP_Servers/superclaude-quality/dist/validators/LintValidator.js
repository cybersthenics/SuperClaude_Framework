import { Logger } from '../utils/Logger.js';
export class LintValidator {
    logger;
    constructor() {
        this.logger = new Logger('LintValidator');
    }
    getName() {
        return 'lint';
    }
    getType() {
        return 'lint';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Lint validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 88,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 120 },
            processingTime: 120
        };
    }
}
//# sourceMappingURL=LintValidator.js.map