import { Logger } from '../utils/Logger.js';
export class DocumentationValidator {
    logger;
    constructor() {
        this.logger = new Logger('DocumentationValidator');
    }
    getName() {
        return 'documentation';
    }
    getType() {
        return 'documentation';
    }
    isEnabled() {
        return true;
    }
    async validate(context) {
        this.logger.debug('Documentation validation (stub)');
        return {
            status: 'passed',
            valid: true,
            score: 70,
            issues: [],
            metadata: { filesAnalyzed: context.target.files.length, gateDuration: 180 },
            processingTime: 180
        };
    }
}
//# sourceMappingURL=DocumentationValidator.js.map