<?php

declare(strict_types=1);

namespace MailGuard\Sdk;

/**
 * Base exception class for MailGuard SDK.
 */
class MailGuardException extends \Exception
{
    /**
     * Create a new MailGuard exception.
     *
     * @param ErrorCode $code Error code from the API
     * @param string $message Human-readable error message
     * @param int|null $retryAfter Seconds to wait before retry
     * @param int|null $attemptsRemaining Remaining attempts
     */
    public function __construct(
        public readonly ErrorCode $errorCode,
        string $message = '',
        public readonly ?int $retryAfter = null,
        public readonly ?int $attemptsRemaining = null,
    ) {
        parent::__construct($message);
    }

    /**
     * Get string representation of the error.
     */
    public function __toString(): string
    {
        $parts = "[{$this->errorCode->value}] {$this->message}";
        if ($this->retryAfter !== null) {
            $parts .= " (retry after {$this->retryAfter}s)";
        }
        return $parts;
    }
}

/**
 * Rate limit exceeded exception.
 */
class RateLimitException extends MailGuardException
{
    /**
     * Create a new rate limit exception.
     *
     * @param int $retryAfter Seconds to wait before retry
     */
    public function __construct(int $retryAfter)
    {
        parent::__construct(
            ErrorCode::RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded. Retry after {$retryAfter} seconds.",
            retryAfter: $retryAfter
        );
    }
}

/**
 * Invalid email exception.
 */
class InvalidEmailException extends MailGuardException
{
    /**
     * Create a new invalid email exception.
     *
     * @param string $message Error message
     */
    public function __construct(string $message = 'Invalid email address')
    {
        parent::__construct(ErrorCode::INVALID_EMAIL, $message);
    }
}

/**
 * OTP expired exception.
 */
class OtpExpiredException extends MailGuardException
{
    /**
     * Create a new OTP expired exception.
     *
     * @param string $message Error message
     */
    public function __construct(string $message = 'OTP has expired')
    {
        parent::__construct(ErrorCode::OTP_EXPIRED, $message);
    }
}

/**
 * Account locked exception (too many failed attempts).
 */
class OtpLockedException extends MailGuardException
{
    /**
     * Create a new OTP locked exception.
     *
     * @param string $message Error message
     */
    public function __construct(string $message = 'Account locked due to too many failed attempts')
    {
        parent::__construct(ErrorCode::ACCOUNT_LOCKED, $message);
    }
}

/**
 * Invalid OTP code exception.
 */
class InvalidCodeException extends MailGuardException
{
    /**
     * Create a new invalid code exception.
     *
     * @param int|null $attemptsRemaining Remaining attempts
     */
    public function __construct(?int $attemptsRemaining = null)
    {
        $message = 'Invalid OTP code';
        if ($attemptsRemaining !== null) {
            $message .= ". {$attemptsRemaining} attempts remaining.";
        }
        parent::__construct(ErrorCode::INVALID_CODE, $message, attemptsRemaining: $attemptsRemaining);
    }
}

/**
 * Unauthorized exception (invalid API key).
 */
class UnauthorizedException extends MailGuardException
{
    /**
     * Create a new unauthorized exception.
     *
     * @param string $message Error message
     */
    public function __construct(string $message = 'Unauthorized: Invalid API key')
    {
        parent::__construct(ErrorCode::UNAUTHORIZED, $message);
    }
}

/**
 * Network exception.
 */
class NetworkException extends MailGuardException
{
    /**
     * Create a new network exception.
     *
     * @param string $message Error message
     */
    public function __construct(string $message = 'Network error')
    {
        parent::__construct(ErrorCode::INTERNAL_ERROR, $message);
    }
}

/**
 * Factory to create exceptions from API responses.
 */
class ExceptionFactory
{
    /**
     * Create an appropriate exception from an API response.
     *
     * @param int $statusCode HTTP status code
     * @param array<string, mixed> $body Response body
     */
    public static function createFromResponse(int $statusCode, array $body): MailGuardException
    {
        $errorCodeStr = $body['error'] ?? null;
        $message = $body['message'] ?? null;
        $retryAfter = $body['retry_after'] ?? null;
        $attemptsRemaining = $body['attempts_remaining'] ?? null;

        $errorCode = ErrorCode::tryFrom($errorCodeStr ?? '') ?? ErrorCode::INTERNAL_ERROR;

        return match ($errorCode) {
            ErrorCode::RATE_LIMIT_EXCEEDED => new RateLimitException(is_int($retryAfter) ? $retryAfter : 60),
            ErrorCode::INVALID_EMAIL => new InvalidEmailException(is_string($message) ? $message : null),
            ErrorCode::OTP_EXPIRED => new OtpExpiredException(is_string($message) ? $message : null),
            ErrorCode::ACCOUNT_LOCKED => new OtpLockedException(is_string($message) ? $message : null),
            ErrorCode::INVALID_CODE => new InvalidCodeException(is_int($attemptsRemaining) ? $attemptsRemaining : null),
            ErrorCode::UNAUTHORIZED,
            ErrorCode::INVALID_API_KEY,
            ErrorCode::KEY_REVOKED,
            ErrorCode::KEY_EXPIRED => new UnauthorizedException(is_string($message) ? $message : null),
            default => new MailGuardException(
                $errorCode,
                is_string($message) ? $message : 'An error occurred',
                is_int($retryAfter) ? $retryAfter : null,
                is_int($attemptsRemaining) ? $attemptsRemaining : null
            ),
        };
    }
}