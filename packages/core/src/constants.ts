/**
 * API Key prefixes
 */
export const API_KEY_PREFIXES = {
  LIVE: 'mg_live_',
  TEST: 'mg_test_',
} as const;

/**
 * Default OTP configuration
 */
export const OTP_DEFAULTS = {
  LENGTH: 6,
  EXPIRY_SECONDS: 600, // 10 minutes
  MAX_ATTEMPTS: 5,
  VALID_LENGTHS: [4, 6, 8] as const,
} as const;

/**
 * Rate limit defaults
 */
export const RATE_LIMITS = {
  OTP_PER_EMAIL: {
    limit: 10,
    windowSeconds: 3600, // 1 hour
  },
  OTP_PER_IP: {
    limit: 5,
    windowSeconds: 60, // 1 minute
  },
  VERIFY_ATTEMPTS: 5,
  API_KEY_PER_MINUTE: {
    limit: 60,
    windowSeconds: 60,
  },
  EMAIL_PER_PROJECT: {
    limit: 200,
    windowSeconds: 3600, // 1 hour
  },
} as const;

/**
 * Email provider configurations
 */
export const EMAIL_PROVIDERS = {
  GMAIL: {
    name: 'gmail',
    displayName: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    dailyLimit: 500,
  },
  OUTLOOK: {
    name: 'outlook',
    displayName: 'Outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com'],
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587,
    dailyLimit: 300,
  },
  ZOHO: {
    name: 'zoho',
    displayName: 'Zoho Mail',
    domains: ['zoho.com'],
    smtpHost: 'smtp.zoho.com',
    smtpPort: 587,
    dailyLimit: 200,
  },
  YAHOO: {
    name: 'yahoo',
    displayName: 'Yahoo Mail',
    domains: ['yahoo.com', 'ymail.com'],
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    dailyLimit: 500,
  },
} as const;

/**
 * Queue job names
 */
export const QUEUE_JOBS = {
  SEND_EMAIL: 'send_email',
  CLEANUP_OTP: 'cleanup_otp',
  SEND_TELEGRAM_NOTIFICATION: 'send_telegram_notification',
} as const;

/**
 * Queue configurations
 */
export const QUEUE_CONFIG = {
  EMAIL_QUEUE: 'mailguard:emails',
  CLEANUP_QUEUE: 'mailguard:cleanup',
  NOTIFICATION_QUEUE: 'mailguard:notifications',
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 5000, 30000], // 1s, 5s, 30s exponential backoff
} as const;

/**
 * JWT configuration
 */
export const JWT_CONFIG = {
  OTP_TOKEN_EXPIRY: '15m',
  ALGORITHM: 'HS256',
} as const;

/**
 * HTTP Status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // OTP errors
  INVALID_EMAIL: 'invalid_email',
  OTP_EXPIRED: 'otp_expired',
  ACCOUNT_LOCKED: 'account_locked',
  INVALID_CODE: 'invalid_code',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  
  // Auth errors
  UNAUTHORIZED: 'unauthorized',
  INVALID_API_KEY: 'invalid_api_key',
  KEY_REVOKED: 'key_revoked',
  KEY_EXPIRED: 'key_expired',
  
  // Sender errors
  PROVIDER_DETECTION_FAILED: 'provider_detection_failed',
  SMTP_CONNECTION_FAILED: 'smtp_connection_failed',
  
  // Project errors
  PROJECT_NOT_FOUND: 'project_not_found',
  PROJECT_INACTIVE: 'project_inactive',
  SENDER_NOT_FOUND: 'sender_not_found',
  SENDER_INACTIVE: 'sender_inactive',
  
  // System errors
  INTERNAL_ERROR: 'internal_error',
  DATABASE_ERROR: 'database_error',
  REDIS_ERROR: 'redis_error',
} as const;

/**
 * Telegram notification types
 */
export const NOTIFICATION_TYPES = {
  SMTP_FAILURE: 'smtp_failure',
  RATE_LIMIT_HIT: 'rate_limit_hit',
  API_KEY_CREATED: 'api_key_created',
  DAILY_SUMMARY: 'daily_summary',
} as const;

/**
 * Email template placeholders
 */
export const TEMPLATE_PLACEHOLDERS = {
  OTP_CODE: '{{otp_code}}',
  APP_NAME: '{{app_name}}',
  EXPIRY_MINUTES: '{{expiry_minutes}}',
  EXPIRY_SECONDS: '{{expiry_seconds}}',
  RECIPIENT_EMAIL: '{{recipient_email}}',
  PURPOSE: '{{purpose}}',
} as const;

/**
 * Default OTP email template
 */
export const DEFAULT_OTP_TEMPLATE = {
  subject: 'Your verification code',
  body: `Your one-time verification code is:

    {{otp_code}}

This code expires in {{expiry_minutes}} minutes.
Do not share this code with anyone.`,
  format: 'text' as const,
};

/**
 * OTP Cleanup interval in milliseconds (15 minutes)
 */
export const OTP_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

/**
 * API Key cache TTL in seconds
 */
export const API_KEY_CACHE_TTL = 60;

/**
 * Redis key prefixes
 */
export const REDIS_KEYS = {
  API_KEY_CACHE: 'apikey',
  RATE_LIMIT: 'rl',
  SESSION: 'session',
} as const;

/**
 * Daily summary time (08:00 UTC)
 */
export const DAILY_SUMMARY_HOUR = 8;