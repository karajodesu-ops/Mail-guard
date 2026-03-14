import { maskEmail, NOTIFICATION_TYPES } from '@mailguard/core';
import type { TelegramNotificationJobData } from '@mailguard/core';

/**
 * Build notification message based on type
 */
export function buildNotificationMessage(
  type: TelegramNotificationJobData['type'],
  data: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case NOTIFICATION_TYPES.SMTP_FAILURE: {
      const recipient = typeof data.recipient === 'string' ? maskEmail(data.recipient) : 'unknown';
      const project = typeof data.project === 'string' ? data.project : 'unknown';
      const error = typeof data.error === 'string' ? data.error : 'Unknown error';
      const attempts = typeof data.attempts === 'number' ? data.attempts : 0;
      
      return `🚨 *SMTP Delivery Failure*

📧 Recipient: \`${recipient}\`
📁 Project: ${project}
🔄 Attempts: ${attempts}/3
❌ Error: \`${error.substring(0, 200)}\`
🕐 Time: ${timestamp}`;
    }
    
    case NOTIFICATION_TYPES.RATE_LIMIT_HIT: {
      const tier = typeof data.tier === 'string' ? data.tier : 'unknown';
      const project = typeof data.project === 'string' ? data.project : 'unknown';
      const email = typeof data.email === 'string' ? maskEmail(data.email) : undefined;
      
      return `⚠️ *Rate Limit Triggered*

📊 Tier: ${tier}
📁 Project: ${project}
${email ? `📧 Email: \`${email}\`` : ''}
🕐 Time: ${timestamp}`;
    }
    
    case NOTIFICATION_TYPES.API_KEY_CREATED: {
      const prefix = typeof data.prefix === 'string' ? data.prefix : 'unknown';
      const label = typeof data.label === 'string' ? data.label : 'No label';
      const project = typeof data.project === 'string' ? data.project : 'unknown';
      const isTest = data.isTest === true;
      
      return `🔑 *New API Key Created*

📁 Project: ${project}
🏷 Label: ${label}
🔤 Prefix: \`${prefix}\`
${isTest ? '🧪 Test/Sandbox Key' : '✅ Live Key'}
🕐 Time: ${timestamp}`;
    }
    
    case NOTIFICATION_TYPES.DAILY_SUMMARY: {
      const totalSent = typeof data.totalSent === 'number' ? data.totalSent : 0;
      const delivered = typeof data.delivered === 'number' ? data.delivered : 0;
      const failed = typeof data.failed === 'number' ? data.failed : 0;
      const activeSenders = typeof data.activeSenders === 'number' ? data.activeSenders : 0;
      const queueDepth = typeof data.queueDepth === 'number' ? data.queueDepth : 0;
      
      return `📊 *Daily Summary*

📧 Total Sent: ${totalSent}
✅ Delivered: ${delivered}
❌ Failed: ${failed}
📤 Active Senders: ${activeSenders}
📬 Queue Depth: ${queueDepth}
🕐 Generated: ${timestamp}`;
    }
    
    default:
      return `📢 *Notification*\n\nTime: ${timestamp}`;
  }
}

/**
 * Build help message
 */
export function buildHelpMessage(): string {
  return `❓ *MailGuard Help*

*Setup Commands*
/addemail — Add a sender email account
/newproject — Create a new project
/setotp <slug> — Configure OTP email template
/genkey <slug> <label> [--test] — Generate API key

*List Commands*
/senders — List all sender emails
/projects — List all projects
/keys <slug> — List API keys for a project
/logs [slug] [--failed] [--today] — View email logs

*Management Commands*
/revokekey <prefix> — Revoke an API key
/testsender <id> — Test a sender email
/removesender <id> — Remove a sender email

*Info Commands*
/start — Show system status and main menu
/health — Check system health
/help — Show this help message

*Need more help?*
Check the documentation at:
https://github.com/your-org/mailguard`;
}

/**
 * Build settings message
 */
export function buildSettingsMessage(settings: {
  notificationEnabled: boolean;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
}): string {
  return `⚙️ *Settings*

📢 Notifications: ${settings.notificationEnabled ? '✅ Enabled' : '❌ Disabled'}
📊 Daily Summary: ${settings.dailySummaryEnabled ? '✅ Enabled' : '❌ Disabled'}
🕐 Summary Time: ${settings.dailySummaryTime} UTC

Select an option to toggle:`;
}