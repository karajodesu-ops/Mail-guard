import * as nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';
import { decrypt, getLogger, type SmtpVerificationResult } from '@mailguard/core';
import { ProviderDetector, ProviderDetectionError } from './provider';
import type { ProviderConfig } from '@mailguard/core';

const logger = getLogger('smtp:mailer');

/**
 * SMTP configuration for creating a transporter
 */
export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

/**
 * Email send options
 */
export interface EmailOptions {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  latency?: number;
}

/**
 * Mailer class - wraps Nodemailer with provider auto-detection
 */
export class Mailer {
  private transporters: Map<string, Transporter> = new Map();
  
  /**
   * Create a transporter for an email account
   * 
   * @param email - Sender email address
   * @param appPasswordEnc - Encrypted app password
   * @param encryptionKey - Key to decrypt the password
   * @param providerConfig - Optional provider config (auto-detected if not provided)
   */
  async createTransporter(
    email: string,
    appPasswordEnc: string,
    encryptionKey: string,
    providerConfig?: ProviderConfig
  ): Promise<Transporter> {
    // Check if transporter already exists
    const existingTransporter = this.transporters.get(email);
    if (existingTransporter) {
      return existingTransporter;
    }
    
    // Detect provider if not provided
    const config = providerConfig ?? this.detectProvider(email);
    
    // Decrypt password
    const password = decrypt(appPasswordEnc, encryptionKey);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false, // STARTTLS
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
    
    // Cache transporter
    this.transporters.set(email, transporter);
    
    // Clear password from memory
    // Note: In JavaScript, strings are immutable, so we can't truly clear them
    // But we can at least not hold references to the decrypted password
    
    return transporter;
  }
  
  /**
   * Verify SMTP connection for an email account
   * 
   * @param email - Sender email address
   * @param appPasswordEnc - Encrypted app password
   * @param encryptionKey - Key to decrypt the password
   */
  async verifyConnection(
    email: string,
    appPasswordEnc: string,
    encryptionKey: string
  ): Promise<SmtpVerificationResult> {
    const startTime = Date.now();
    
    try {
      const transporter = await this.createTransporter(email, appPasswordEnc, encryptionKey);
      await transporter.verify();
      
      const latency = Date.now() - startTime;
      logger.info({ email: this.maskEmail(email), latency }, 'SMTP connection verified');
      
      return { success: true, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn({ email: this.maskEmail(email), error: errorMessage }, 'SMTP connection failed');
      
      return { success: false, error: errorMessage, latency };
    }
  }
  
  /**
   * Send an email
   * 
   * @param options - Email options
   * @param smtpConfig - SMTP configuration
   */
  async sendEmail(
    options: EmailOptions,
    smtpConfig: {
      email: string;
      appPasswordEnc: string;
      encryptionKey: string;
      smtpHost: string;
      smtpPort: number;
    }
  ): Promise<EmailSendResult> {
    const startTime = Date.now();
    
    try {
      // Detect provider for this email
      const detection = ProviderDetector.detectFromEmail(smtpConfig.email);
      const providerConfig: ProviderConfig = detection.config ?? {
        provider: 'other',
        smtpHost: smtpConfig.smtpHost,
        smtpPort: smtpConfig.smtpPort,
        dailyLimit: 0,
      };
      
      // Override with provided SMTP settings if detection failed
      if (!detection.detected) {
        providerConfig.smtpHost = smtpConfig.smtpHost;
        providerConfig.smtpPort = smtpConfig.smtpPort;
      }
      
      // Create transporter
      const transporter = await this.createTransporter(
        smtpConfig.email,
        smtpConfig.appPasswordEnc,
        smtpConfig.encryptionKey,
        providerConfig
      );
      
      // Prepare mail options
      const mailOptions: SendMailOptions = {
        from: options.fromName 
          ? `"${options.fromName}" <${options.from}>`
          : options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      };
      
      // Send email
      const info: SentMessageInfo = await transporter.sendMail(mailOptions);
      
      const latency = Date.now() - startTime;
      
      logger.info({
        from: this.maskEmail(options.from),
        to: this.maskEmail(options.to),
        messageId: info.messageId,
        latency,
      }, 'Email sent successfully');
      
      return {
        success: true,
        messageId: info.messageId,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error({
        from: this.maskEmail(options.from),
        to: this.maskEmail(options.to),
        error: errorMessage,
        latency,
      }, 'Failed to send email');
      
      return {
        success: false,
        error: errorMessage,
        latency,
      };
    }
  }
  
  /**
   * Send a test email to verify the connection
   */
  async sendTestEmail(
    email: string,
    appPasswordEnc: string,
    encryptionKey: string
  ): Promise<SmtpVerificationResult> {
    try {
      const transporter = await this.createTransporter(email, appPasswordEnc, encryptionKey);
      
      const startTime = Date.now();
      
      // Send a test email to the sender's own address
      await transporter.sendMail({
        from: email,
        to: email,
        subject: 'MailGuard SMTP Test',
        text: 'This is a test email from MailGuard. If you received this, your SMTP configuration is working correctly.',
      });
      
      const latency = Date.now() - startTime;
      
      logger.info({ email: this.maskEmail(email), latency }, 'Test email sent successfully');
      
      return { success: true, latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.warn({ email: this.maskEmail(email), error: errorMessage }, 'Test email failed');
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Close all transporters
   */
  async closeAll(): Promise<void> {
    for (const [email, transporter] of this.transporters) {
      try {
        transporter.close();
        logger.debug({ email: this.maskEmail(email) }, 'Transporter closed');
      } catch (error) {
        logger.warn({ email: this.maskEmail(email), error }, 'Failed to close transporter');
      }
    }
    this.transporters.clear();
  }
  
  /**
   * Close a specific transporter
   */
  closeTransporter(email: string): void {
    const transporter = this.transporters.get(email);
    if (transporter) {
      transporter.close();
      this.transporters.delete(email);
    }
  }
  
  /**
   * Detect provider from email
   */
  private detectProvider(email: string): ProviderConfig {
    const result = ProviderDetector.detectFromEmail(email);
    
    if (!result.detected || !result.config) {
      throw new ProviderDetectionError(
        result.error ?? 'Unknown email provider',
        result.domain
      );
    }
    
    return result.config;
  }
  
  /**
   * Mask email for logging (privacy)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain || !local) return '***@***';
    return `${local[0]}***@${domain}`;
  }
}

// Singleton instance
let mailerInstance: Mailer | null = null;

/**
 * Get the mailer singleton
 */
export function getMailer(): Mailer {
  if (!mailerInstance) {
    mailerInstance = new Mailer();
  }
  return mailerInstance;
}

/**
 * Close the mailer singleton
 */
export async function closeMailer(): Promise<void> {
  if (mailerInstance) {
    await mailerInstance.closeAll();
    mailerInstance = null;
  }
}