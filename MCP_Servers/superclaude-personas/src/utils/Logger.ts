// SuperClaude Personas - Logger
// Comprehensive logging system for personas server

import winston from 'winston';

export interface LogMetadata {
  persona?: string;
  operation?: string;
  chainId?: string;
  stepNumber?: number;
  confidence?: number;
  executionTime?: number;
  [key: string]: any;
}

export class Logger {
  private logger: winston.Logger;
  private component: string;

  constructor(component: string = 'PersonasServer') {
    this.component = component;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
          const logEntry = {
            timestamp,
            level,
            component: this.component,
            message,
            ...(stack && { stack }),
            ...metadata
          };
          return JSON.stringify(logEntry);
        })
      ),
      defaultMeta: {
        service: 'superclaude-personas',
        component: this.component
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/personas-error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/personas-combined.log',
          maxsize: 5242880, // 5MB
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

  /**
   * Log debug information
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug(message, metadata);
  }

  /**
   * Log informational messages
   */
  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, metadata);
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn(message, metadata);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
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

  /**
   * Log persona activation events
   */
  logPersonaActivation(
    persona: string,
    context: any,
    result: any,
    metadata?: LogMetadata
  ): void {
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

  /**
   * Log collaboration events
   */
  logCollaboration(
    personas: string[],
    mode: string,
    result: any,
    metadata?: LogMetadata
  ): void {
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

  /**
   * Log chain execution events
   */
  logChainExecution(
    chainId: string,
    steps: any[],
    results: any[],
    metadata?: LogMetadata
  ): void {
    this.info('Chain execution', {
      chainId,
      steps: steps.length,
      results: results.length,
      personas: steps.map(s => s.persona),
      preservationScore: metadata?.preservationScore,
      ...metadata
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    executionTime: number,
    metadata?: LogMetadata
  ): void {
    this.info('Performance metric', {
      operation,
      executionTime,
      ...metadata
    });
  }

  /**
   * Log expertise sharing events
   */
  logExpertiseSharing(
    fromPersona: string,
    toPersona: string,
    expertise: any,
    success: boolean,
    metadata?: LogMetadata
  ): void {
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

  /**
   * Log auto-activation decisions
   */
  logAutoActivation(
    persona: string,
    confidence: number,
    reasoning: string,
    activated: boolean,
    metadata?: LogMetadata
  ): void {
    this.info('Auto-activation decision', {
      persona,
      confidence,
      reasoning,
      activated,
      ...metadata
    });
  }

  /**
   * Log priority conflict resolutions
   */
  logConflictResolution(
    conflictId: string,
    participants: string[],
    resolution: any,
    metadata?: LogMetadata
  ): void {
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

  /**
   * Log context preservation metrics
   */
  logContextPreservation(
    chainId: string,
    preservationScore: number,
    preservedElements: string[],
    metadata?: LogMetadata
  ): void {
    this.info('Context preservation', {
      chainId,
      preservationScore,
      preservedElements,
      threshold: 0.95,
      success: preservationScore >= 0.95,
      ...metadata
    });
  }

  /**
   * Log validation results
   */
  logValidation(
    operation: string,
    isValid: boolean,
    issues: string[],
    recommendations: string[],
    metadata?: LogMetadata
  ): void {
    this.info('Validation result', {
      operation,
      isValid,
      issues,
      recommendations,
      ...metadata
    });
  }

  /**
   * Log system health metrics
   */
  logSystemHealth(
    component: string,
    status: string,
    metrics: any,
    metadata?: LogMetadata
  ): void {
    this.info('System health', {
      component,
      status,
      metrics,
      ...metadata
    });
  }

  /**
   * Create a child logger for a specific component
   */
  createChildLogger(childComponent: string): Logger {
    return new Logger(`${this.component}:${childComponent}`);
  }

  /**
   * Set log level
   */
  setLevel(level: string): void {
    this.logger.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.logger.level;
  }

  /**
   * Close logger and cleanup resources
   */
  close(): void {
    this.logger.close();
  }
}