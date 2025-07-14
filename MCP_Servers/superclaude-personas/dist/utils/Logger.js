import winston from 'winston';
export class Logger {
    logger;
    component;
    constructor(component = 'PersonasServer') {
        this.component = component;
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
                const logEntry = {
                    timestamp,
                    level,
                    component: this.component,
                    message,
                    ...(stack && { stack }),
                    ...metadata
                };
                return JSON.stringify(logEntry);
            })),
            defaultMeta: {
                service: 'superclaude-personas',
                component: this.component
            },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
                }),
                new winston.transports.File({
                    filename: 'logs/personas-error.log',
                    level: 'error',
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                new winston.transports.File({
                    filename: 'logs/personas-combined.log',
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ],
            exceptionHandlers: [
                new winston.transports.File({ filename: 'logs/personas-exceptions.log' })
            ],
            rejectionHandlers: [
                new winston.transports.File({ filename: 'logs/personas-rejections.log' })
            ]
        });
    }
    debug(message, metadata) {
        this.logger.debug(message, metadata);
    }
    info(message, metadata) {
        this.logger.info(message, metadata);
    }
    warn(message, metadata) {
        this.logger.warn(message, metadata);
    }
    error(message, error, metadata) {
        const errorMetadata = {
            ...metadata,
            ...(error && {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    ...(error.code && { code: error.code })
                }
            })
        };
        this.logger.error(message, errorMetadata);
    }
    logPersonaActivation(persona, context, result, metadata) {
        this.info('Persona activated', {
            persona,
            context: {
                domain: context.domain,
                complexity: context.complexity,
                userIntent: context.userIntent
            },
            result: {
                confidence: result.confidence,
                transformations: result.transformations?.length || 0,
                recommendations: result.recommendations?.length || 0
            },
            ...metadata
        });
    }
    logCollaboration(personas, mode, result, metadata) {
        this.info('Persona collaboration', {
            personas,
            mode,
            result: {
                success: result.success,
                conflicts: result.conflictResolutions?.length || 0,
                executionTime: result.metadata?.executionTime
            },
            ...metadata
        });
    }
    logChainExecution(chainId, steps, results, metadata) {
        this.info('Chain execution', {
            chainId,
            steps: steps.length,
            results: results.length,
            personas: steps.map(s => s.persona),
            preservationScore: metadata?.preservationScore,
            ...metadata
        });
    }
    logPerformance(operation, executionTime, metadata) {
        this.info('Performance metric', {
            operation,
            executionTime,
            ...metadata
        });
    }
    logExpertiseSharing(fromPersona, toPersona, expertise, success, metadata) {
        this.info('Expertise sharing', {
            fromPersona,
            toPersona,
            expertise: {
                domain: expertise.domain,
                confidence: expertise.confidence,
                insights: expertise.insights?.length || 0
            },
            success,
            ...metadata
        });
    }
    logAutoActivation(persona, confidence, reasoning, activated, metadata) {
        this.info('Auto-activation decision', {
            persona,
            confidence,
            reasoning,
            activated,
            ...metadata
        });
    }
    logConflictResolution(conflictId, participants, resolution, metadata) {
        this.info('Priority conflict resolution', {
            conflictId,
            participants,
            resolution: {
                type: resolution.conflictType,
                reasoning: resolution.reasoning,
                satisfaction: metadata?.satisfactionScore
            },
            ...metadata
        });
    }
    logContextPreservation(chainId, preservationScore, preservedElements, metadata) {
        this.info('Context preservation', {
            chainId,
            preservationScore,
            preservedElements,
            threshold: 0.95,
            success: preservationScore >= 0.95,
            ...metadata
        });
    }
    logValidation(operation, isValid, issues, recommendations, metadata) {
        this.info('Validation result', {
            operation,
            isValid,
            issues,
            recommendations,
            ...metadata
        });
    }
    logSystemHealth(component, status, metrics, metadata) {
        this.info('System health', {
            component,
            status,
            metrics,
            ...metadata
        });
    }
    createChildLogger(childComponent) {
        return new Logger(`${this.component}:${childComponent}`);
    }
    setLevel(level) {
        this.logger.level = level;
    }
    getLevel() {
        return this.logger.level;
    }
    close() {
        this.logger.close();
    }
}
//# sourceMappingURL=Logger.js.map