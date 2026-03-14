<?php

declare(strict_types=1);

namespace MailGuard\Sdk;

/**
 * Error codes returned by the MailGuard API.
 */
enum ErrorCode: string
{
    case RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded';
    case INVALID_EMAIL = 'invalid_email';
    case OTP_EXPIRED = 'otp_expired';
    case ACCOUNT_LOCKED = 'account_locked';
    case INVALID_CODE = 'invalid_code';
    case UNAUTHORIZED = 'unauthorized';
    case INVALID_API_KEY = 'invalid_api_key';
    case KEY_REVOKED = 'key_revoked';
    case KEY_EXPIRED = 'key_expired';
    case INTERNAL_ERROR = 'internal_error';
}