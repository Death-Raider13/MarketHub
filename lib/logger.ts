/**
 * Production-Ready Logging System
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ip?: string
  path?: string
  method?: string
  [key: string]: any
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel
  }

  private formatMessage(level: string, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    }

    return JSON.stringify(logEntry)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context, error))
      
      // In production, you might want to send to external logging service
      if (process.env.NODE_ENV === 'production') {
        this.sendToExternalLogger('ERROR', message, context, error)
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  private sendToExternalLogger(level: string, message: string, context?: LogContext, error?: Error): void {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
    // For now, we'll just ensure the error is logged to console
  }
}

// Create singleton logger instance
export const logger = new Logger()

/**
 * Create a logger with predefined context
 */
export function createContextLogger(baseContext: LogContext) {
  return {
    error: (message: string, additionalContext?: LogContext, error?: Error) =>
      logger.error(message, { ...baseContext, ...additionalContext }, error),
    warn: (message: string, additionalContext?: LogContext) =>
      logger.warn(message, { ...baseContext, ...additionalContext }),
    info: (message: string, additionalContext?: LogContext) =>
      logger.info(message, { ...baseContext, ...additionalContext }),
    debug: (message: string, additionalContext?: LogContext) =>
      logger.debug(message, { ...baseContext, ...additionalContext }),
  }
}

/**
 * API route logger middleware
 */
export function createApiLogger(request: Request, route: string) {
  const context: LogContext = {
    path: route,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    requestId: crypto.randomUUID(),
  }

  return createContextLogger(context)
}

/**
 * Security event logger
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: LogContext,
  details?: any
) {
  const securityContext = {
    ...context,
    securityEvent: event,
    severity,
    details,
  }

  if (severity === 'critical' || severity === 'high') {
    logger.error(`Security Event: ${event}`, securityContext)
  } else {
    logger.warn(`Security Event: ${event}`, securityContext)
  }
}

/**
 * Performance logger
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: LogContext
) {
  const perfContext = {
    ...context,
    operation,
    duration,
    performance: true,
  }

  if (duration > 5000) { // Log slow operations (>5s)
    logger.warn(`Slow operation detected: ${operation}`, perfContext)
  } else {
    logger.debug(`Performance: ${operation}`, perfContext)
  }
}

/**
 * Business event logger
 */
export function logBusinessEvent(
  event: string,
  context: LogContext,
  data?: any
) {
  const businessContext = {
    ...context,
    businessEvent: event,
    data,
  }

  logger.info(`Business Event: ${event}`, businessContext)
}
