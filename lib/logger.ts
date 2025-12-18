/**
 * Production-ready logging utility for SUCCESS Magazine platform
 * 
 * Features:
 * - Environment-aware (silent in production for debug/info levels)
 * - Structured logging with context
 * - Consistent formatting
 * - Safe for both client and server
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Payment failed', { error: err.message, orderId: '456' });
 *   logger.debug('API response', { data }); // Only in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }
  
  return `${prefix} ${message}`;
}

/**
 * Safely stringify errors for logging
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }
  return { error: String(error) };
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Debug level - only logs in development
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (!isProduction) {
      console.log(formatMessage('debug', message, context));
    }
  },

  /**
   * Info level - only logs in development
   * Use for general operational information
   */
  info(message: string, context?: LogContext): void {
    if (!isProduction) {
      console.info(formatMessage('info', message, context));
    }
  },

  /**
   * Warn level - logs in all environments
   * Use for potentially problematic situations
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },

  /**
   * Error level - logs in all environments
   * Use for errors that need attention
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = error ? { ...serializeError(error), ...context } : context;
    console.error(formatMessage('error', message, errorContext));
  },

  /**
   * API request logger - for tracking API calls
   * Only logs in development unless there's an error
   */
  api(method: string, path: string, statusCode?: number, duration?: number): void {
    const context: LogContext = { method, path };
    if (statusCode !== undefined) context.statusCode = statusCode;
    if (duration !== undefined) context.duration = `${duration}ms`;
    
    // Log errors in all environments, success only in development
    if (statusCode && statusCode >= 400) {
      console.warn(formatMessage('warn', 'API Request', context));
    } else if (!isProduction) {
      console.log(formatMessage('info', 'API Request', context));
    }
  },

  /**
   * Database query logger - for tracking DB operations
   * Only logs in development
   */
  db(operation: string, model: string, duration?: number): void {
    if (!isProduction) {
      const context: LogContext = { operation, model };
      if (duration !== undefined) context.duration = `${duration}ms`;
      console.log(formatMessage('debug', 'DB Query', context));
    }
  },
};

/**
 * Create a scoped logger with a module prefix
 * 
 * Usage:
 *   const log = createLogger('StripeWebhook');
 *   log.info('Processing event', { eventType });
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(`[${module}] ${message}`, context),
    info: (message: string, context?: LogContext) => 
      logger.info(`[${module}] ${message}`, context),
    warn: (message: string, context?: LogContext) => 
      logger.warn(`[${module}] ${message}`, context),
    error: (message: string, error?: unknown, context?: LogContext) => 
      logger.error(`[${module}] ${message}`, error, context),
  };
}

export default logger;

