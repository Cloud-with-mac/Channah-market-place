/**
 * Centralized logging service for Admin Dashboard
 * Easy to replace with Sentry, LogRocket, or other error tracking service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class AdminLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logPrefix = '[ADMIN]'

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) return
    console.debug(`${this.logPrefix} [DEBUG] ${message}`, context || '')
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext) {
    if (!this.isDevelopment) return
    console.info(`${this.logPrefix} [INFO] ${message}`, context || '')
  }

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext) {
    console.warn(`${this.logPrefix} [WARN] ${message}`, context || '')

    // Send to error tracking service in production
    if (!this.isDevelopment) {
      this.sendToErrorService('warn', message, context)
    }
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`${this.logPrefix} [ERROR] ${message}`, error, context || '')

    // Send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorService('error', message, {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      })
    }
  }

  /**
   * Log API error with request details
   */
  apiError(endpoint: string, error: any, context?: LogContext) {
    const message = `API Error: ${endpoint}`
    const errorContext = {
      ...context,
      endpoint,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    }

    this.error(message, error, errorContext)
  }

  /**
   * Log admin action for audit trail
   */
  adminAction(action: string, details?: LogContext) {
    const message = `Admin Action: ${action}`

    if (this.isDevelopment) {
      console.log(`${this.logPrefix} [ACTION] ${message}`, details || '')
    }

    // In production, send to audit logging service
    if (!this.isDevelopment) {
      this.sendToAuditLog(action, details)
    }
  }

  /**
   * Send log to error tracking service
   * TODO: Integrate with Sentry, LogRocket, or similar
   */
  private sendToErrorService(level: LogLevel, message: string, context?: LogContext) {
    // Example Sentry integration:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(message, {
    //     level: level as SeverityLevel,
    //     tags: { app: 'admin' },
    //     extra: context
    //   })
    // }
  }

  /**
   * Send to audit log service
   * Important for compliance and security monitoring
   */
  private sendToAuditLog(action: string, details?: LogContext) {
    // TODO: Send to backend audit log endpoint
    // Example:
    // fetch('/api/v1/admin/audit-log', {
    //   method: 'POST',
    //   body: JSON.stringify({ action, details, timestamp: new Date().toISOString() })
    // })
  }

  /**
   * Track custom event
   */
  event(eventName: string, properties?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`${this.logPrefix} [EVENT] ${eventName}`, properties || '')
    }
  }
}

// Export singleton instance
export const logger = new AdminLogger()

// Export type for use in other files
export type { LogContext }
