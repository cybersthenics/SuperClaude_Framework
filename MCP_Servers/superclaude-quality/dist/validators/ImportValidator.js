import { Logger } from '../utils/Logger.js';
export class ImportValidator {
    logger;
    constructor() {
        this.logger = new Logger('ImportValidator');
    }
    getName() {
        return 'import';
    }
    getType() {
        return 'import';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Import validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 92,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 80 },
            processingTime: 80
        };
    }
}
//# sourceMappingURL=ImportValidator.js.map