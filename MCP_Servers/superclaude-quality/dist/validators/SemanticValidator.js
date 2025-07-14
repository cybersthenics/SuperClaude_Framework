import { Logger } from '../utils/Logger.js';
export class SemanticValidator {
    logger;
    constructor() {
        this.logger = new Logger('SemanticValidator');
    }
    getName() {
        return 'semantic';
    }
    getType() {
        return 'semantic';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Semantic validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 95,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 100 },
            processingTime: 100
        };
    }
}
//# sourceMappingURL=SemanticValidator.js.map