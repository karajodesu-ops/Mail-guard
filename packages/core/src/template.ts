import { TEMPLATE_PLACEHOLDERS, DEFAULT_OTP_TEMPLATE } from './constants';
import type { OtpTemplateData } from './types';

/**
 * Render a template string by replacing placeholders with actual values
 * 
 * @param template - Template string with {{placeholder}} syntax
 * @param data - Data object with values to inject
 * @returns Rendered string with placeholders replaced
 */
export function renderTemplate(template: string, data: Record<string, string | number>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(String(value));
  }
  
  return result;
}

/**
 * Render OTP email subject
 * 
 * @param subjectTmpl - Subject template (or null for default)
 * @param data - Template data
 * @returns Rendered subject line
 */
export function renderOtpSubject(subjectTmpl: string | null, data: OtpTemplateData): string {
  const template = subjectTmpl ?? DEFAULT_OTP_TEMPLATE.subject;
  return renderTemplate(template, {
    otp_code: data.otp_code,
    app_name: data.app_name,
    expiry_minutes: data.expiry_minutes,
    expiry_seconds: data.expiry_seconds,
    recipient_email: data.recipient_email,
    purpose: data.purpose,
  });
}

/**
 * Render OTP email body
 * 
 * @param bodyTmpl - Body template (or null for default)
 * @param data - Template data
 * @returns Rendered body content
 */
export function renderOtpBody(bodyTmpl: string | null, data: OtpTemplateData): string {
  const template = bodyTmpl ?? DEFAULT_OTP_TEMPLATE.body;
  return renderTemplate(template, {
    otp_code: data.otp_code,
    app_name: data.app_name,
    expiry_minutes: data.expiry_minutes,
    expiry_seconds: data.expiry_seconds,
    recipient_email: data.recipient_email,
    purpose: data.purpose,
  });
}

/**
 * Validate template for required placeholders
 * 
 * @param template - Template string to validate
 * @returns true if valid, error message if invalid
 */
export function validateTemplate(template: string): { valid: boolean; error?: string } {
  // Check that otp_code placeholder exists
  if (!template.includes(TEMPLATE_PLACEHOLDERS.OTP_CODE)) {
    return {
      valid: false,
      error: `Template must contain ${TEMPLATE_PLACEHOLDERS.OTP_CODE} placeholder`,
    };
  }
  
  return { valid: true };
}

/**
 * Get available template placeholders for display
 */
export function getAvailablePlaceholders(): Array<{ placeholder: string; description: string; example: string }> {
  return [
    {
      placeholder: TEMPLATE_PLACEHOLDERS.OTP_CODE,
      description: 'The generated OTP code',
      example: '483920',
    },
    {
      placeholder: TEMPLATE_PLACEHOLDERS.APP_NAME,
      description: 'Project name',
      example: 'My App',
    },
    {
      placeholder: TEMPLATE_PLACEHOLDERS.EXPIRY_MINUTES,
      description: 'OTP expiry in minutes',
      example: '10',
    },
    {
      placeholder: TEMPLATE_PLACEHOLDERS.EXPIRY_SECONDS,
      description: 'OTP expiry in seconds',
      example: '600',
    },
    {
      placeholder: TEMPLATE_PLACEHOLDERS.RECIPIENT_EMAIL,
      description: "Recipient's email address",
      example: 'user@example.com',
    },
    {
      placeholder: TEMPLATE_PLACEHOLDERS.PURPOSE,
      description: 'Purpose of the OTP',
      example: 'registration',
    },
  ];
}

/**
 * Mask email address for display (privacy)
 * e.g., "user@example.com" -> "u***@example.com"
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain || localPart.length === 0) {
    return '***@***.***';
  }
  
  const maskedLocal = localPart[0] + '***';
  return `${maskedLocal}@${domain}`;
}