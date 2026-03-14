<?php

declare(strict_types=1);

namespace MailGuard\Sdk;

/**
 * HTTP client for MailGuard API.
 */
final class HttpClient
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    /**
     * Create a new HTTP client.
     *
     * @param string $baseUrl Base URL of the MailGuard API
     * @param string $apiKey API key for authentication
     * @param int $timeout Request timeout in seconds
     */
    public function __construct(string $baseUrl, string $apiKey, int $timeout = 30)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
        $this->timeout = $timeout;
    }

    /**
     * Make a GET request.
     *
     * @param string $path API path
     * @return array<string, mixed> Response data
     * @throws MailGuardException If request fails
     */
    public function get(string $path): array
    {
        return $this->request('GET', $path);
    }

    /**
     * Make a POST request.
     *
     * @param string $path API path
     * @param array<string, mixed> $data Request body data
     * @return array<string, mixed> Response data
     * @throws MailGuardException If request fails
     */
    public function post(string $path, array $data = []): array
    {
        return $this->request('POST', $path, $data);
    }

    /**
     * Make an HTTP request with error handling.
     *
     * @param string $method HTTP method
     * @param string $path API path
     * @param array<string, mixed> $data Request body data
     * @return array<string, mixed> Response data
     * @throws MailGuardException If request fails
     */
    private function request(string $method, string $path, array $data = []): array
    {
        $url = "{$this->baseUrl}{$path}";
        $headers = [
            'Content-Type: application/json',
            "X-API-Key: {$this->apiKey}",
        ];

        $ch = curl_init();
        if ($ch === false) {
            throw new NetworkException('Failed to initialize cURL');
        }

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method,
        ];

        if ($method === 'POST' && !empty($data)) {
            $jsonData = json_encode($data);
            if ($jsonData === false) {
                throw new NetworkException('Failed to encode request data');
            }
            $options[CURLOPT_POSTFIELDS] = $jsonData;
        }

        curl_setopt_array($ch, $options);

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        curl_close($ch);

        if ($error) {
            throw new NetworkException($error);
        }

        if (!is_string($response)) {
            throw new NetworkException('Empty response received');
        }

        $body = json_decode($response, true);
        if (!is_array($body)) {
            $body = [];
        }

        if ($statusCode >= 400) {
            throw ExceptionFactory::createFromResponse($statusCode, $body);
        }

        return $body;
    }
}

/**
 * OTP operations module.
 */
final class OtpModule
{
    private HttpClient $client;

    /**
     * Create a new OTP module.
     *
     * @param HttpClient $client HTTP client instance
     */
    public function __construct(HttpClient $client)
    {
        $this->client = $client;
    }

    /**
     * Send an OTP code to an email address.
     *
     * @param string $email Email address to send OTP to
     * @param string|null $purpose Optional purpose for the OTP
     * @return OtpSendResponse OTP send response
     * @throws RateLimitException If rate limit is exceeded
     * @throws InvalidEmailException If email is invalid
     * @throws UnauthorizedException If API key is invalid
     * @throws NetworkException If network error occurs
     */
    public function send(string $email, ?string $purpose = null): OtpSendResponse
    {
        $data = ['email' => $email];
        if ($purpose !== null) {
            $data['purpose'] = $purpose;
        }

        $response = $this->client->post('/api/v1/otp/send', $data);
        return OtpSendResponse::fromArray($response);
    }

    /**
     * Verify an OTP code.
     *
     * @param string $email Email address
     * @param string $code OTP code to verify
     * @return OtpVerifySuccessResponse|OtpVerifyFailureResponse OTP verify response
     * @throws InvalidCodeException If code is invalid
     * @throws OtpExpiredException If OTP has expired
     * @throws OtpLockedException If account is locked
     * @throws UnauthorizedException If API key is invalid
     * @throws NetworkException If network error occurs
     */
    public function verify(string $email, string $code): OtpVerifySuccessResponse|OtpVerifyFailureResponse
    {
        $response = $this->client->post('/api/v1/otp/verify', [
            'email' => $email,
            'code' => $code,
        ]);

        if (isset($response['verified']) && $response['verified'] === true) {
            return OtpVerifySuccessResponse::fromArray($response);
        }

        return OtpVerifyFailureResponse::fromArray($response);
    }
}

/**
 * Email operations module.
 */
final class EmailModule
{
    private HttpClient $client;

    /**
     * Create a new Email module.
     *
     * @param HttpClient $client HTTP client instance
     */
    public function __construct(HttpClient $client)
    {
        $this->client = $client;
    }

    /**
     * Send an email.
     *
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $body Email body content
     * @param string $format Email format ('text' or 'html')
     * @return EmailSendResponse Email send response
     * @throws RateLimitException If rate limit is exceeded
     * @throws InvalidEmailException If email is invalid
     * @throws UnauthorizedException If API key is invalid
     * @throws NetworkException If network error occurs
     */
    public function send(string $to, string $subject, string $body, string $format = 'text'): EmailSendResponse
    {
        $response = $this->client->post('/api/v1/email/send', [
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'format' => $format,
        ]);

        return EmailSendResponse::fromArray($response);
    }
}

/**
 * Main MailGuard SDK client.
 *
 * @example
 * ```php
 * use MailGuard\Sdk\MailGuard;
 *
 * // Initialize the SDK
 * $mg = MailGuard::init([
 *     'api_key' => 'mg_live_xxxxxxxxxxxx',
 *     'base_url' => 'https://api.mailguard.example.com',
 * ]);
 *
 * // Send an OTP
 * $result = $mg->otp->send('user@example.com', 'login');
 * echo "OTP sent: {$result->id}\n";
 *
 * // Verify an OTP
 * $verifyResult = $mg->otp->verify('user@example.com', '123456');
 * if ($verifyResult instanceof OtpVerifySuccessResponse) {
 *     echo "Verified! Token: {$verifyResult->token}\n";
 * }
 * ```
 */
final class MailGuard
{
    private static ?MailGuard $instance = null;

    private HttpClient $client;
    public readonly OtpModule $otp;
    public readonly EmailModule $email;

    /**
     * Create a new MailGuard client.
     *
     * @param array{api_key: string, base_url: string, timeout?: int} $config SDK configuration
     */
    private function __construct(array $config)
    {
        $timeout = $config['timeout'] ?? 30;
        $this->client = new HttpClient($config['base_url'], $config['api_key'], $timeout);
        $this->otp = new OtpModule($this->client);
        $this->email = new EmailModule($this->client);
    }

    /**
     * Initialize the MailGuard SDK singleton.
     *
     * @param array{api_key: string, base_url: string, timeout?: int} $config SDK configuration
     * @return MailGuard MailGuard instance
     * @throws \InvalidArgumentException If config is invalid
     */
    public static function init(array $config): MailGuard
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        if (empty($config['api_key'])) {
            throw new \InvalidArgumentException('MailGuard SDK requires an API key');
        }

        if (empty($config['base_url'])) {
            throw new \InvalidArgumentException('MailGuard SDK requires a base URL');
        }

        self::$instance = new self($config);
        return self::$instance;
    }

    /**
     * Get the current MailGuard instance.
     *
     * @return MailGuard|null MailGuard instance or null if not initialized
     */
    public static function getInstance(): ?MailGuard
    {
        return self::$instance;
    }

    /**
     * Reset the MailGuard instance (useful for testing).
     */
    public static function reset(): void
    {
        self::$instance = null;
    }

    /**
     * Create a new MailGuard instance without singleton pattern.
     *
     * Useful for multi-tenant scenarios or testing.
     *
     * @param array{api_key: string, base_url: string, timeout?: int} $config SDK configuration
     * @return MailGuard New MailGuard instance
     * @throws \InvalidArgumentException If config is invalid
     */
    public static function create(array $config): MailGuard
    {
        if (empty($config['api_key'])) {
            throw new \InvalidArgumentException('MailGuard SDK requires an API key');
        }

        if (empty($config['base_url'])) {
            throw new \InvalidArgumentException('MailGuard SDK requires a base URL');
        }

        return new self($config);
    }

    /**
     * Check the health of the MailGuard API.
     *
     * @return HealthResponse Health response with system status
     * @throws NetworkException If network error occurs
     */
    public function health(): HealthResponse
    {
        $response = $this->client->get('/health');
        return HealthResponse::fromArray($response);
    }
}