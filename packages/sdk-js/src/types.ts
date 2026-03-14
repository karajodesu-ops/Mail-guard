// Request types
export interface OtpSendRequest {
  email: string;
  purpose?: string;
}

export interface OtpVerifyRequest {
  email: string;
  code: string;
}

export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  format?: 'text' | 'html';
}

export interface MagicLinkSendRequest {
  email: string;
  purpose?: string;
  redirectUrl?: string;
}

// Response types
export interface OtpSendResponse {
  id: string;
  status: 'sent' | 'queued';
  expires_in: number;
  masked_email: string;
}

export interface OtpVerifySuccessResponse {
  verified: true;
  token: string;
  expires_at: string;
}

export interface OtpVerifyFailureResponse {
  verified: false;
  error: string;
  attempts_remaining?: number;
}

export type OtpVerifyResponse = OtpVerifySuccessResponse | OtpVerifyFailureResponse;

export interface EmailSendResponse {
  id: string;
  status: 'queued';
}

export interface MagicLinkSendResponse {
  id: string;
  status: 'sent';
  expires_in: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  db: 'ok' | 'error';
  redis: 'ok' | 'error';
  bot: 'ok' | 'error' | 'not_configured';
  queue: {
    waiting: number;
    active: number;
  };
  senders: Array<{
    id: string;
    email: string;
    provider: string;
    status: 'ok' | 'error';
    daily_limit: number;
    sent_today: number;
  }>;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Error types
export type ErrorCode =
  | 'rate_limit_exceeded'
  | 'invalid_email'
  | 'otp_expired'
  | 'account_locked'
  | 'invalid_code'
  | 'unauthorized'
  | 'invalid_api_key'
  | 'key_revoked'
  | 'key_expired'
  | 'internal_error';

export interface ErrorResponse {
  error: ErrorCode;
  message?: string;
  retry_after?: number;
  attempts_remaining?: number;
}

// Config type
export interface MailGuardConfig {
  apiKey: string;
  baseUrl: string;
}