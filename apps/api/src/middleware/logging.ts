import { Request, Response, NextFunction } from 'express';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// Log context interface
export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  module?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  error?: Error | string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

// Structured logger class
export class StructuredLogger {
  private serviceName: string;
  private environment: string;
  private version: string;

  constructor(serviceName = 'fuep-api', environment = process.env.NODE_ENV || 'development', version = '1.0.0') {
    this.serviceName = serviceName;
    this.environment = environment;
    this.version = version;
  }

  private formatLog(level: LogLevel, message: string, context: LogContext = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      message,
      ...context,
      // Add correlation ID for distributed tracing
      correlationId: context.requestId || this.generateCorrelationId()
    };

    // Sanitize sensitive information
    const sanitizedEntry = this.sanitizeLogEntry(logEntry);

    // Output to console (in production, this would go to a logging service)
    const logOutput = JSON.stringify(sanitizedEntry, null, this.environment === 'development' ? 2 : 0);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logOutput);
        break;
      case LogLevel.WARN:
        console.warn(logOutput);
        break;
      case LogLevel.DEBUG:
        if (this.environment === 'development') {
          console.debug(logOutput);
        }
        break;
      case LogLevel.TRACE:
        if (this.environment === 'development') {
          console.log(logOutput);
        }
        break;
      default:
        console.log(logOutput);
    }
  }

  private sanitizeLogEntry(entry: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    const sanitized = { ...entry };

    // Recursively sanitize nested objects
    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result: any = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public logging methods
  public error(message: string, context: LogContext = {}): void {
    this.formatLog(LogLevel.ERROR, message, context);
  }

  public warn(message: string, context: LogContext = {}): void {
    this.formatLog(LogLevel.WARN, message, context);
  }

  public info(message: string, context: LogContext = {}): void {
    this.formatLog(LogLevel.INFO, message, context);
  }

  public debug(message: string, context: LogContext = {}): void {
    this.formatLog(LogLevel.DEBUG, message, context);
  }

  public trace(message: string, context: LogContext = {}): void {
    this.formatLog(LogLevel.TRACE, message, context);
  }

  // Specialized logging methods
  public logRequest(req: Request, res: Response, duration: number): void {
    const context: LogContext = {
      requestId: (req as any).requestId,
      module: this.getModuleFromPath(req.path),
      operation: `${req.method} ${req.path}`,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query,
        params: req.params,
        contentLength: req.get('Content-Length'),
        referer: req.get('Referer')
      }
    };

    const level = res.statusCode >= 500 ? LogLevel.ERROR : 
                  res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.formatLog(level, `HTTP Request Completed`, context);
  }

  public logDatabaseOperation(operation: string, table: string, duration: number, context: LogContext = {}): void {
    this.info(`Database Operation: ${operation}`, {
      ...context,
      module: 'database',
      operation,
      duration,
      metadata: {
        table,
        type: 'database'
      }
    });
  }

  public logPaymentEvent(event: string, paymentId: string, provider: string, context: LogContext = {}): void {
    this.info(`Payment Event: ${event}`, {
      ...context,
      module: 'payments',
      operation: event,
      metadata: {
        paymentId,
        provider,
        type: 'payment'
      }
    });
  }

  public logAdminAction(action: string, targetResource: string, adminUserId: string, context: LogContext = {}): void {
    this.info(`Admin Action: ${action}`, {
      ...context,
      userId: adminUserId,
      module: 'admin',
      operation: action,
      metadata: {
        targetResource,
        type: 'admin_action'
      }
    });
  }

  public logCandidateAction(action: string, candidateId: string, context: LogContext = {}): void {
    this.info(`Candidate Action: ${action}`, {
      ...context,
      userId: candidateId,
      module: 'candidates',
      operation: action,
      metadata: {
        type: 'candidate_action'
      }
    });
  }

  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context: LogContext = {}): void {
    const level = severity === 'high' ? LogLevel.ERROR : 
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    this.formatLog(level, `Security Event: ${event}`, {
      ...context,
      module: 'security',
      operation: event,
      metadata: {
        severity,
        type: 'security'
      }
    });
  }

  private getModuleFromPath(path: string): string {
    if (path.startsWith('/api/admin')) return 'admin';
    if (path.startsWith('/api/candidates')) return 'candidates';
    if (path.startsWith('/api/payments')) return 'payments';
    if (path.startsWith('/api/documents')) return 'documents';
    if (path.startsWith('/api/auth')) return 'auth';
    return 'api';
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

// Global logger instance
export const logger = new StructuredLogger();

// HTTP request logging middleware
export const httpLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.trace('HTTP Request Started', {
    requestId: (req as any).requestId,
    module: logger['getModuleFromPath'](req.path),
    operation: `${req.method} ${req.path}`,
    ip: logger['getClientIP'](req),
    userAgent: req.get('User-Agent'),
    metadata: {
      method: req.method,
      path: req.path,
      query: req.query,
      contentType: req.get('Content-Type')
    }
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
  });

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled Error', {
    requestId: (req as any).requestId,
    module: logger['getModuleFromPath'](req.path),
    operation: `${req.method} ${req.path}`,
    ip: logger['getClientIP'](req),
    error: err,
    metadata: {
      stack: err.stack,
      type: 'unhandled_error'
    }
  });

  next(err);
};

// Database operation logger helper
export const withDatabaseLogging = async <T>(
  operation: string,
  table: string,
  asyncOperation: () => Promise<T>,
  context: LogContext = {}
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    logger.debug(`Database Operation Started: ${operation}`, {
      ...context,
      module: 'database',
      operation,
      metadata: { table, status: 'started' }
    });

    const result = await asyncOperation();
    const duration = Date.now() - startTime;
    
    logger.logDatabaseOperation(operation, table, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Database Operation Failed: ${operation}`, {
      ...context,
      module: 'database',
      operation,
      duration,
      error: error instanceof Error ? error : String(error),
      metadata: { table, status: 'failed' }
    });
    
    throw error;
  }
};

// Performance monitoring decorator
export const withPerformanceLogging = async <T>(
  operationName: string,
  asyncOperation: () => Promise<T>,
  context: LogContext = {}
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await asyncOperation();
    const duration = Date.now() - startTime;
    
    // Log slow operations (>1000ms)
    if (duration > 1000) {
      logger.warn(`Slow Operation Detected: ${operationName}`, {
        ...context,
        duration,
        metadata: { type: 'performance', threshold: 1000 }
      });
    } else {
      logger.debug(`Operation Completed: ${operationName}`, {
        ...context,
        duration,
        metadata: { type: 'performance' }
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Operation Failed: ${operationName}`, {
      ...context,
      duration,
      error: error instanceof Error ? error : String(error),
      metadata: { type: 'performance_error' }
    });
    
    throw error;
  }
};
