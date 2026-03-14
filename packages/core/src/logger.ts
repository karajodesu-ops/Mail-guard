import pino, { type Logger } from 'pino';

let logger: Logger | null = null;

/**
 * Get or create the logger singleton
 */
export function getLogger(service: string): Logger {
  if (!logger) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    logger = pino({
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      base: {
        service,
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
      serializers: {
        req: () => undefined, // Don't log full request objects
        res: () => undefined, // Don't log full response objects
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
      redact: {
        paths: [
          'password',
          'appPassword',
          'app_password_enc',
          'key',
          'apiKey',
          'token',
          'authorization',
          'otp_code',
          'otpCode',
          '*.password',
          '*.appPassword',
          '*.app_password_enc',
          '*.key',
          '*.apiKey',
          '*.token',
          '*.authorization',
          '*.otp_code',
          '*.otpCode',
        ],
        censor: '[REDACTED]',
      },
    });
  }
  
  return logger.child({ service });
}

/**
 * Create a request-scoped logger with requestId
 */
export function createRequestLogger(service: string, requestId: string): Logger {
  const baseLogger = getLogger(service);
  return baseLogger.child({ requestId });
}

export type { Logger } from 'pino';