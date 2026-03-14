import type {
  MailGuardConfig,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  EmailSendRequest,
  EmailSendResponse,
  HealthResponse,
  ErrorResponse,
} from './types';

import {
  MailGuardError,
  RateLimitError,
  InvalidEmailError,
  OtpExpiredError,
  OtpLockedError,
  InvalidCodeError,
  UnauthorizedError,
  NetworkError,
  createErrorFromResponse,
} from './errors';

/**
 * OTP module for sending and verifying OTP codes
 */
export class OtpModule {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /**
   * Send an OTP code to an email address
   * @param request - The OTP send request
   * @returns The OTP send response
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {InvalidEmailError} If email is invalid
   * @throws {UnauthorizedError} If API key is invalid
   * @throws {NetworkError} If network error occurs
   */
  async send(request: OtpSendRequest): Promise<OtpSendResponse> {
    return this.client.post<OtpSendResponse>('/api/v1/otp/send', request);
  }

  /**
   * Verify an OTP code
   * @param request - The OTP verify request
   * @returns The OTP verify response
   * @throws {InvalidCodeError} If code is invalid
   * @throws {OtpExpiredError} If OTP has expired
   * @throws {OtpLockedError} If account is locked
   * @throws {UnauthorizedError} If API key is invalid
   * @throws {NetworkError} If network error occurs
   */
  async verify(request: OtpVerifyRequest): Promise<OtpVerifyResponse> {
    return this.client.post<OtpVerifyResponse>('/api/v1/otp/verify', request);
  }
}

/**
 * Email module for sending emails
 */
export class EmailModule {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /**
   * Send an email
   * @param request - The email send request
   * @returns The email send response
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {InvalidEmailError} If email is invalid
   * @throws {UnauthorizedError} If API key is invalid
   * @throws {NetworkError} If network error occurs
   */
  async send(request: EmailSendRequest): Promise<EmailSendResponse> {
    return this.client.post<EmailSendResponse>('/api/v1/email/send', request);
  }
}

/**
 * HTTP Client for making API requests
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: MailGuardConfig, timeout: number = 30000) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = timeout;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Make an HTTP request with error handling
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw createErrorFromResponse(response.status, responseBody);
      }

      return responseBody as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof MailGuardError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timed out');
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError('Unknown error occurred');
    }
  }
}

/**
 * Main MailGuard SDK client
 * 
 * @example
 * ```typescript
 * import { MailGuard } from '@mailguard/sdk-js';
 * 
 * // Initialize the SDK
 * const mg = MailGuard.init({
 *   apiKey: 'mg_live_xxxxxxxxxxxx',
 *   baseUrl: 'https://api.mailguard.example.com',
 * });
 * 
 * // Send an OTP
 * const result = await mg.otp.send({
 *   email: 'user@example.com',
 *   purpose: 'login',
 * });
 * 
 * // Verify an OTP
 * const verifyResult = await mg.otp.verify({
 *   email: 'user@example.com',
 *   code: '123456',
 * });
 * ```
 */
export class MailGuard {
  private static instance: MailGuard | null = null;

  private readonly client: HttpClient;
  public readonly otp: OtpModule;
  public readonly email: EmailModule;

  private constructor(config: MailGuardConfig) {
    this.client = new HttpClient(config);
    this.otp = new OtpModule(this.client);
    this.email = new EmailModule(this.client);
  }

  /**
   * Initialize the MailGuard SDK singleton
   * @param config - The SDK configuration
   * @returns The MailGuard instance
   */
  static init(config: MailGuardConfig): MailGuard {
    if (MailGuard.instance) {
      console.warn('MailGuard SDK already initialized. Returning existing instance.');
      return MailGuard.instance;
    }

    if (!config.apiKey) {
      throw new Error('MailGuard SDK requires an API key');
    }

    if (!config.baseUrl) {
      throw new Error('MailGuard SDK requires a base URL');
    }

    MailGuard.instance = new MailGuard(config);
    return MailGuard.instance;
  }

  /**
   * Get the current MailGuard instance
   * @returns The MailGuard instance or null if not initialized
   */
  static getInstance(): MailGuard | null {
    return MailGuard.instance;
  }

  /**
   * Reset the MailGuard instance (useful for testing)
   */
  static reset(): void {
    MailGuard.instance = null;
  }

  /**
   * Check the health of the MailGuard API
   * @returns The health response
   */
  async health(): Promise<HealthResponse> {
    return this.client.get<HealthResponse>('/health');
  }

  /**
   * Create a new MailGuard instance without singleton pattern
   * Useful for multi-tenant scenarios or testing
   * @param config - The SDK configuration
   * @returns A new MailGuard instance
   */
  static create(config: MailGuardConfig): MailGuard {
    if (!config.apiKey) {
      throw new Error('MailGuard SDK requires an API key');
    }

    if (!config.baseUrl) {
      throw new Error('MailGuard SDK requires a base URL');
    }

    return new MailGuard(config);
  }
}

// Export all types
export * from './types';

// Export all errors
export * from './errors';

// Default export
export default MailGuard;