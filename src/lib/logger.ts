/**
 * Centralized logging service with environment-aware output and sensitive data sanitization
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger'
 *
 * logger.error('Failed to load user', {
 *   component: 'DashboardPage',
 *   action: 'loadProfile',
 *   userId: user?.id,
 *   error: error instanceof Error ? error.message : String(error)
 * })
 * ```
 */

/**
 * Log level type for categorizing log messages
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

/**
 * Metadata structure for providing context to log messages
 *
 * @property component - The component/module where the log originated (e.g., 'DashboardPage', 'GENIAChat')
 * @property action - The specific action being performed (e.g., 'loadProfile', 'refreshQuotas')
 * @property userId - The ID of the user associated with the action (optional)
 * @property [key: string] - Any additional context-specific metadata
 */
export interface LogMetadata {
  component?: string
  action?: string
  userId?: string
  [key: string]: any
}

/**
 * Type for logger method signature
 */
export type LoggerMethod = (message: string, metadata?: LogMetadata) => void

/**
 * Sensitive field names that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'privateKey',
  'private_key',
  'creditCard',
  'ssn',
  'authorization',
  'email',
  'emailAddress',
  'email_address'
]

/**
 * Sanitizes metadata by redacting sensitive fields
 */
function sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return metadata
  }

  const sanitized = { ...metadata }

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase()

    // Check if key matches any sensitive field pattern
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    )

    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Formats log message with metadata for structured output
 */
function formatLogMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
  const timestamp = new Date().toISOString()
  const sanitized = sanitizeMetadata(metadata)

  if (sanitized && Object.keys(sanitized).length > 0) {
    return `[${timestamp}] [${level.toUpperCase()}] ${message} | ${JSON.stringify(sanitized)}`
  }

  return `[${timestamp}] [${level.toUpperCase()}] ${message}`
}

/**
 * Determines if we're in development environment
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Core logging function that handles environment-aware output
 */
function log(level: LogLevel, message: string, metadata?: LogMetadata): void {
  const formattedMessage = formatLogMessage(level, message, metadata)
  const sanitized = sanitizeMetadata(metadata)

  if (isDevelopment()) {
    // Development: use appropriate console method with full formatting
    switch (level) {
      case 'error':
        console.error(formattedMessage, sanitized || '')
        break
      case 'warn':
        console.warn(formattedMessage, sanitized || '')
        break
      case 'info':
        console.info(formattedMessage, sanitized || '')
        break
      case 'debug':
        console.debug(formattedMessage, sanitized || '')
        break
    }
  } else {
    // Production: use console.error for all levels (can be replaced with external service)
    // TODO: Integrate with Sentry/LogRocket when available
    console.error(formattedMessage, sanitized || '')
  }
}

/**
 * Centralized logger instance
 */
export const logger: {
  error: LoggerMethod
  warn: LoggerMethod
  info: LoggerMethod
  debug: LoggerMethod
} = {
  /**
   * Log error-level messages (e.g., exceptions, critical failures)
   */
  error: (message: string, metadata?: LogMetadata): void => {
    log('error', message, metadata)
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(metadata?.error || new Error(message));
      if (metadata) Sentry.setContext("metadata", sanitizeMetadata(metadata));
    } catch {}
  },

  /**
   * Log warning-level messages (e.g., deprecated API usage, recoverable errors)
   */
  warn: (message: string, metadata?: LogMetadata): void => {
    log('warn', message, metadata)
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.captureMessage(message, "warning");
      if (metadata) Sentry.setContext("metadata", sanitizeMetadata(metadata));
    } catch {}
  },

  /**
   * Log info-level messages (e.g., important state changes, user actions)
   */
  info: (message: string, metadata?: LogMetadata): void => {
    log('info', message, metadata)
  },

  /**
   * Log debug-level messages (e.g., detailed diagnostic information)
   */
  debug: (message: string, metadata?: LogMetadata): void => {
    log('debug', message, metadata)
  }
}

// Export type for Logger interface
export type Logger = typeof logger
