/**
 * Error Monitoring and Logging Utility
 *
 * Centralized error tracking for production monitoring
 * Can be integrated with Sentry, LogRocket, or other services
 */

export interface ErrorContext {
  userId?: string;
  page?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Log an error to monitoring service
   */
  public logError(error: Error, context?: ErrorContext): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      env: process.env.NODE_ENV,
    };

    // Log to console in development
    if (!this.isProduction) {
      console.error('[ErrorMonitor]', errorData);
      return;
    }

    // In production, send to monitoring service
    // TODO: Integrate with Sentry, LogRocket, or custom endpoint
    this.sendToMonitoringService(errorData);
  }

  /**
   * Log a warning (non-critical error)
   */
  public logWarning(message: string, context?: ErrorContext): void {
    const warningData = {
      level: 'warning',
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (!this.isProduction) {
      console.warn('[ErrorMonitor]', warningData);
      return;
    }

    this.sendToMonitoringService(warningData);
  }

  /**
   * Log an info message
   */
  public logInfo(message: string, context?: ErrorContext): void {
    const infoData = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (!this.isProduction) {
      console.info('[ErrorMonitor]', infoData);
      return;
    }

    this.sendToMonitoringService(infoData);
  }

  /**
   * Send error data to monitoring service
   * Replace this with your actual monitoring service integration
   */
  private async sendToMonitoringService(data: any): Promise<void> {
    try {
      // Option 1: Send to custom API endpoint
      await fetch('/api/admin/devops/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Option 2: Integrate with Sentry
      // if (typeof window !== 'undefined' && window.Sentry) {
      //   window.Sentry.captureException(data);
      // }

      // Option 3: Integrate with LogRocket
      // if (typeof window !== 'undefined' && window.LogRocket) {
      //   window.LogRocket.captureException(data);
      // }
    } catch (err) {
      // Fail silently to avoid infinite error loops
      console.error('Failed to send error to monitoring service:', err);
    }
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metric: string, value: number, context?: ErrorContext): void {
    const perfData = {
      metric,
      value,
      timestamp: new Date().toISOString(),
      context,
    };

    if (!this.isProduction) {
      console.log('[Performance]', perfData);
      return;
    }

    this.sendToMonitoringService({ type: 'performance', ...perfData });
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorMonitor.logError(new Error(event.reason), {
      component: 'GlobalErrorHandler',
      action: 'unhandledRejection',
    });
  });
}
