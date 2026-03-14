import { EMAIL_PROVIDERS } from '@mailguard/core';
import type { ProviderConfig } from '@mailguard/core';

/**
 * Provider detection result
 */
export interface ProviderDetectionResult {
  detected: boolean;
  config: ProviderConfig | null;
  domain: string;
  error?: string;
}

/**
 * Known provider configurations
 */
const PROVIDER_MAP: Record<string, ProviderConfig> = {
  // Gmail
  'gmail.com': {
    provider: EMAIL_PROVIDERS.GMAIL.name,
    smtpHost: EMAIL_PROVIDERS.GMAIL.smtpHost,
    smtpPort: EMAIL_PROVIDERS.GMAIL.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.GMAIL.dailyLimit,
  },
  'googlemail.com': {
    provider: EMAIL_PROVIDERS.GMAIL.name,
    smtpHost: EMAIL_PROVIDERS.GMAIL.smtpHost,
    smtpPort: EMAIL_PROVIDERS.GMAIL.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.GMAIL.dailyLimit,
  },
  // Outlook / Microsoft 365
  'outlook.com': {
    provider: EMAIL_PROVIDERS.OUTLOOK.name,
    smtpHost: EMAIL_PROVIDERS.OUTLOOK.smtpHost,
    smtpPort: EMAIL_PROVIDERS.OUTLOOK.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.OUTLOOK.dailyLimit,
  },
  'hotmail.com': {
    provider: EMAIL_PROVIDERS.OUTLOOK.name,
    smtpHost: EMAIL_PROVIDERS.OUTLOOK.smtpHost,
    smtpPort: EMAIL_PROVIDERS.OUTLOOK.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.OUTLOOK.dailyLimit,
  },
  'live.com': {
    provider: EMAIL_PROVIDERS.OUTLOOK.name,
    smtpHost: EMAIL_PROVIDERS.OUTLOOK.smtpHost,
    smtpPort: EMAIL_PROVIDERS.OUTLOOK.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.OUTLOOK.dailyLimit,
  },
  // Zoho
  'zoho.com': {
    provider: EMAIL_PROVIDERS.ZOHO.name,
    smtpHost: EMAIL_PROVIDERS.ZOHO.smtpHost,
    smtpPort: EMAIL_PROVIDERS.ZOHO.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.ZOHO.dailyLimit,
  },
  // Yahoo
  'yahoo.com': {
    provider: EMAIL_PROVIDERS.YAHOO.name,
    smtpHost: EMAIL_PROVIDERS.YAHOO.smtpHost,
    smtpPort: EMAIL_PROVIDERS.YAHOO.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.YAHOO.dailyLimit,
  },
  'ymail.com': {
    provider: EMAIL_PROVIDERS.YAHOO.name,
    smtpHost: EMAIL_PROVIDERS.YAHOO.smtpHost,
    smtpPort: EMAIL_PROVIDERS.YAHOO.smtpPort,
    dailyLimit: EMAIL_PROVIDERS.YAHOO.dailyLimit,
  },
};

/**
 * Provider Detector class
 * Auto-detects email provider from domain and returns SMTP configuration
 */
export class ProviderDetector {
  /**
   * Detect provider from email address domain
   * 
   * @param email - Full email address
   * @returns Detection result with provider config
   */
  static detectFromEmail(email: string): ProviderDetectionResult {
    const domain = this.extractDomain(email);
    
    if (!domain) {
      return {
        detected: false,
        config: null,
        domain: '',
        error: 'Invalid email address format',
      };
    }
    
    const config = PROVIDER_MAP[domain];
    
    if (config) {
      return {
        detected: true,
        config,
        domain,
      };
    }
    
    // Unknown domain - would need probing
    return {
      detected: false,
      config: null,
      domain,
      error: `Unknown email provider for domain: ${domain}. Supported providers: Gmail, Outlook, Zoho, Yahoo.`,
    };
  }
  
  /**
   * Check if a domain is a known provider
   */
  static isKnownProvider(domain: string): boolean {
    return domain.toLowerCase() in PROVIDER_MAP;
  }
  
  /**
   * Get provider config for a known domain
   */
  static getProviderConfig(domain: string): ProviderConfig | null {
    return PROVIDER_MAP[domain.toLowerCase()] ?? null;
  }
  
  /**
   * Get all supported domains
   */
  static getSupportedDomains(): string[] {
    return Object.keys(PROVIDER_MAP);
  }
  
  /**
   * Get provider display name
   */
  static getProviderDisplayName(provider: string): string {
    switch (provider) {
      case 'gmail':
        return EMAIL_PROVIDERS.GMAIL.displayName;
      case 'outlook':
        return EMAIL_PROVIDERS.OUTLOOK.displayName;
      case 'zoho':
        return EMAIL_PROVIDERS.ZOHO.displayName;
      case 'yahoo':
        return EMAIL_PROVIDERS.YAHOO.displayName;
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  }
  
  /**
   * Extract domain from email address
   */
  private static extractDomain(email: string): string | null {
    const parts = email.toLowerCase().split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }
    return parts[1]!;
  }
}

/**
 * Provider Detection Error
 */
export class ProviderDetectionError extends Error {
  public readonly domain: string;
  
  constructor(message: string, domain: string) {
    super(message);
    this.name = 'ProviderDetectionError';
    this.domain = domain;
  }
}