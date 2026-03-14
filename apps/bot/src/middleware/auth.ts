import type { Context, MiddlewareFn } from 'grammy';
import { getLogger } from '@mailguard/core';

const logger = getLogger('bot:auth');

/**
 * Admin gate middleware
 * Only allows the configured admin user to interact with the bot
 */
export function adminGateMiddleware(adminUid: number): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    
    if (!userId) {
      logger.warn('Message without user ID, ignoring');
      return; // Silent drop
    }
    
    if (userId !== adminUid) {
      logger.warn({ userId }, 'Unauthorized user attempted to use bot');
      return; // Silent drop, no response
    }
    
    // User is authorized, proceed
    await next();
  };
}