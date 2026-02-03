/**
 * Centralized logging service
 * Easy to replace with Sentry, LogRocket, or other error tracking service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) return
    console.debug(`[DEBUG] ${message}`, context || '')
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext) {
    if (!this.isDevelopment) return
    console.info(`[INFO] ${message}`, context || '')
  }

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || '')

    // TODO: Send to error tracking service in production
    if (!this.isDevelopment) {
      this.sendToErrorService('warn', message, context)
    }
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error, context || '')

    // TODO: Send to error tracking service
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
   * Send log to error tracking service
   * TODO: Integrate with Sentry, LogRocket, or similar
   */
  private sendToErrorService(level: LogLevel, message: string, context?: LogContext) {
    // Example Sentry integration:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(message, {
    //     level: level as SeverityLevel,
    //     extra: context
    //   })
    // }

    // Example LogRocket integration:
    // if (window.LogRocket) {
    //   window.LogRocket.captureMessage(message, {
    //     tags: { level },
    //     extra: context
    //   })
    // }

    // For now, just console in production (should be replaced)
    // In production, you want to avoid console.log for sensitive data
  }

  /**
   * Track custom event (analytics, monitoring)
   */
  event(eventName: string, properties?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`[EVENT] ${eventName}`, properties || '')
    }

    // TODO: Send to analytics service
    // Example: window.analytics?.track(eventName, properties)
  }

  /**
   * Track page view
   */
  pageView(pageName: string, properties?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`[PAGE_VIEW] ${pageName}`, properties || '')
    }

    // TODO: Send to analytics service
    // Example: window.analytics?.page(pageName, properties)
  }

  /**
   * Track user action
   */
  userAction(action: string, properties?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`[USER_ACTION] ${action}`, properties || '')
    }

    // TODO: Send to analytics service
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for use in other files
export type { LogContext }
