import type { ErrorCode } from './types';

/**
 * Base error class for MailGuard SDK
 */
export class MailGuardError extends Error {
  public readonly code: ErrorCode;
  public readonly retryAfter?: number;
  public readonly attemptsRemaining?: number;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { retryAfter?: number; attemptsRemaining?: number }
  ) {
    super(message);
    this.name = 'MailGuardError';
    this.code = code;
    this.retryAfter = options?.retryAfter;
    this.attemptsRemaining = options?.attemptsRemaining;
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends MailGuardError {
  constructor(retryAfter: number) {
    super('rate_limit_exceeded', `Rate limit exceeded. Retry after ${retryAfter} seconds.`, {
      retryAfter,
    });
    this.name = 'RateLimitError';
  }
}

/**
 * Invalid email error
 */
export class InvalidEmailError extends MailGuardError {
  constructor(message: string = 'Invalid email address') {
    super('invalid_email', message);
    this.name = 'InvalidEmailError';
  }
}

/**
 * OTP expired error
 */
export class OtpExpiredError extends MailGuardError {
  constructor(message: string = 'OTP has expired') {
    super('otp_expired', message);
    this.name = 'OtpExpiredError';
  }
}

/**
 * OTP locked error (too many failed attempts)
 */
export class OtpLockedError extends MailGuardError {
  constructor(message: string = 'Account locked due to too many failed attempts') {
    super('account_locked', message);
    this.name = 'OtpLockedError';
  }
}

/**
 * Invalid OTP code error
 */
export class InvalidCodeError extends MailGuardError {
  public readonly attemptsRemaining?: number;

  constructor(attemptsRemaining?: number) {
    super('invalid_code', `Invalid OTP code${attemptsRemaining !== undefined ? `. ${attemptsRemaining} attempts remaining.` : ''}`, {
      attemptsRemaining,
    });
    this.name = 'InvalidCodeError';
    this.attemptsRemaining = attemptsRemaining;
  }
}

/**
 * Unauthorized error (invalid API key)
 */
export class UnauthorizedError extends MailGuardError {
  constructor(message: string = 'Unauthorized: Invalid API key') {
    super('unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Network error
 */
export class NetworkError extends MailGuardError {
  constructor(message: string = 'Network error') {
    super('internal_error', message);
    this.name = 'NetworkError';
  }
}

/**
 * Create appropriate error from API response
 */
export function createErrorFromResponse(status: number, body: any): MailGuardError {
  const code = body?.error as ErrorCode | undefined;
  const message = body?.message as string | undefined;
  const retryAfter = body?.retry_after as number | undefined;
  const attemptsRemaining = body?.attempts_remaining as number | undefined;

  switch (code) {
    case 'rate_limit_exceeded':
      return new RateLimitError(retryAfter ?? 60);
    case 'invalid_email':
      return new InvalidEmailError(message);
    case 'otp_expired':
      return new OtpExpiredError(message);
    case 'account_locked':
      return new OtpLockedError(message);
    case 'invalid_code':
      return new InvalidCodeError(attemptsRemaining);
    case 'unauthorized':
    case 'invalid_api_key':
    case 'key_revoked':
    case 'key_expired':
      return new UnauthorizedError(message);
    default:
      return new MailGuardError(code ?? 'internal_error', message ?? 'An error occurred', {
        retryAfter,
        attemptsRemaining,
      });
  }
}