import type { Context } from 'grammy';
import { getPrismaClient, checkDatabaseHealth, checkRedisHealth, getLogger } from '@mailguard/core';

const logger = getLogger('bot:commands:start');

/**
 * /start command handler
 * Shows system status and main menu
 */
export async function handleStart(ctx: Context): Promise<void> {
  const prisma = getPrismaClient();
  
  // Check system health
  const dbOk = await checkDatabaseHealth();
  const redisOk = await checkRedisHealth();
  
  // Get counts
  let senderCount = 0;
  let projectCount = 0;
  let apiKeyCount = 0;
  
  try {
    senderCount = await prisma.senderEmail.count({ where: { isActive: true } });
    projectCount = await prisma.project.count({ where: { isActive: true } });
    apiKeyCount = await prisma.apiKey.count({ where: { isActive: true } });
  } catch (error) {
    logger.error({ error }, 'Failed to get counts');
  }
  
  const allHealthy = dbOk && redisOk;
  
  const statusIcon = (ok: boolean) => ok ? '✅' : '❌';
  
  let message = `🤖 *MailGuard Admin*\n\n`;
  message += `*System Status*\n`;
  message += `  Database (Supabase)   ${statusIcon(dbOk)} ${dbOk ? 'Connected' : 'Error'}\n`;
  message += `  Cache (Upstash)       ${statusIcon(redisOk)} ${redisOk ? 'Connected' : 'Error'}\n`;
  message += `  Bot                   ✅ Online\n`;
  message += `\n`;
  
  if (allHealthy) {
    message += `*Configuration*\n`;
    message += `  Sender Emails    ${senderCount} / 10\n`;
    message += `  Projects         ${projectCount}\n`;
    message += `  API Keys         ${apiKeyCount}\n`;
    
    if (senderCount === 0) {
      message += `\n⚠️ Setup incomplete\n`;
      message += `  Sender Emails  ← Add these first\n`;
    }
  } else {
    message += `⚠️ *Degraded Status*\n`;
    message += `Some services are unavailable. Check your environment variables.\n`;
  }
  
  // Create inline keyboard with main actions
  const keyboard = {
    inline_keyboard: [
      [
        { text: '➕ Add Sender Email', callback_data: 'addemail' },
        { text: '📁 Projects', callback_data: 'projects' },
      ],
      [
        { text: '🔑 Generate API Key', callback_data: 'genkey' },
        { text: '📊 View Logs', callback_data: 'logs' },
      ],
      [
        { text: '⚙️ Settings', callback_data: 'settings' },
        { text: '❓ Help', callback_data: 'help' },
      ],
    ],
  };
  
  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}