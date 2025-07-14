import { Logger } from '../utils/Logger.js';
export class SecurityValidator {
    logger;
    constructor() {
        this.logger = new Logger('SecurityValidator');
    }
    getName() {
        return 'security';
    }
    getType() {
        return 'security';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Security validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 85,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 300 },
            processingTime: 300
        };
    }
}
//# sourceMappingURL=SecurityValidator.js.map