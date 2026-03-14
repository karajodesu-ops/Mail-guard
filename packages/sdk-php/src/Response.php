<?php

declare(strict_types=1);

namespace MailGuard\Sdk;

/**
 * OTP send response.
 */
final readonly class OtpSendResponse
{
    /**
     * Create a new OTP send response.
     *
     * @param string $id Unique OTP record ID
     * @param string $status Delivery status ('sent' or 'queued')
     * @param int $expiresIn Seconds until OTP expires
     * @param string $maskedEmail Masked email address for display
     */
    public function __construct(
        public string $id,
        public string $status,
        public int $expiresIn,
        public string $maskedEmail,
    ) {}

    /**
     * Create from API response data.
     *
     * @param array<string, mixed> $data Response data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) $data['id'],
            status: (string) $data['status'],
            expiresIn: (int) $data['expires_in'],
            maskedEmail: (string) $data['masked_email'],
        );
    }
}

/**
 * OTP verify success response.
 */
final readonly class OtpVerifySuccessResponse
{
    /**
     * Create a new OTP verify success response.
     *
     * @param string $token JWT token for authenticated session
     * @param string $expiresAt Token expiration timestamp
     */
    public function __construct(
        public string $token,
        public string $expiresAt,
    ) {}

    /**
     * Create from API response data.
     *
     * @param array<string, mixed> $data Response data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            token: (string) $data['token'],
            expiresAt: (string) $data['expires_at'],
        );
    }
}

/**
 * OTP verify failure response.
 */
final readonly class OtpVerifyFailureResponse
{
    /**
     * Create a new OTP verify failure response.
     *
     * @param string $error Error message
     * @param int|null $attemptsRemaining Remaining attempts
     */
    public function __construct(
        public string $error,
        public ?int $attemptsRemaining = null,
    ) {}

    /**
     * Create from API response data.
     *
     * @param array<string, mixed> $data Response data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            error: (string) $data['error'],
            attemptsRemaining: isset($data['attempts_remaining']) ? (int) $data['attempts_remaining'] : null,
        );
    }
}

/**
 * Email send response.
 */
final readonly class EmailSendResponse
{
    /**
     * Create a new email send response.
     *
     * @param string $id Unique email log ID
     * @param string $status Email queue status
     */
    public function __construct(
        public string $id,
        public string $status,
    ) {}

    /**
     * Create from API response data.
     *
     * @param array<string, mixed> $data Response data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) $data['id'],
            status: (string) $data['status'],
        );
    }
}

/**
 * Health check response.
 */
final readonly class HealthResponse
{
    /**
     * Create a new health response.
     *
     * @param string $status Overall system status
     * @param string $db Database status
     * @param string $redis Redis status
     * @param string $bot Bot status
     * @param array{waiting: int, active: int} $queue Queue statistics
     * @param array<int, array{id: string, email: string, provider: string, status: string, daily_limit: int, sent_today: int}> $senders Sender health info
     */
    public function __construct(
        public string $status,
        public string $db,
        public string $redis,
        public string $bot,
        public array $queue,
        public array $senders = [],
    ) {}

    /**
     * Create from API response data.
     *
     * @param array<string, mixed> $data Response data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            status: (string) $data['status'],
            db: (string) $data['db'],
            redis: (string) $data['redis'],
            bot: (string) $data['bot'],
            queue: [
                'waiting' => (int) ($data['queue']['waiting'] ?? 0),
                'active' => (int) ($data['queue']['active'] ?? 0),
            ],
            senders: array_map(
                fn(array $sender): array => [
                    'id' => (string) $sender['id'],
                    'email' => (string) $sender['email'],
                    'provider' => (string) $sender['provider'],
                    'status' => (string) $sender['status'],
                    'daily_limit' => (int) $sender['daily_limit'],
                    'sent_today' => (int) $sender['sent_today'],
                ],
                $data['senders'] ?? []
            ),
        );
    }
}