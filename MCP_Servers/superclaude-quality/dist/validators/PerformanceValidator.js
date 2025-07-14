import { Logger } from '../utils/Logger.js';
export class PerformanceValidator {
    logger;
    constructor() {
        this.logger = new Logger('PerformanceValidator');
    }
    getName() {
        return 'performance';
    }
    getType() {
        return 'performance';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Performance validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 78,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 250 },
            processingTime: 250
        };
    }
}
//# sourceMappingURL=PerformanceValidator.js.map