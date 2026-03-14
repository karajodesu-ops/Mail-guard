import type { Job } from 'bullmq';
import {
  getLogger,
  maskEmail,
  NOTIFICATION_TYPES,
} from '@mailguard/core';
import type { TelegramNotificationJobData } from '@mailguard/core';

const logger = getLogger('worker:notification');

/**
 * Telegram notification job processor
 * Sends notifications to admin Telegram
 */
export async function processNotificationJob(job: Job<TelegramNotificationJobData>): Promise<void> {
  const { type, data } = job.data;
  
  logger.info({ jobId: job.id, type }, 'Processing notification job');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminUid = process.env.TELEGRAM_ADMIN_UID;
  
  if (!botToken || !adminUid) {
    logger.warn('Telegram configuration missing, skipping notification');
    return;
  }
  
  // Build message based on notification type
  const message = buildNotificationMessage(type, data);
  
  // Send to Telegram
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminUid,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${errorText}`);
    }
    
    logger.info({ jobId: job.id, type }, 'Notification sent successfully');
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Failed to send notification');
    throw error;
  }
}

/**
 * Build notification message based on type
 */
function buildNotificationMessage(
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