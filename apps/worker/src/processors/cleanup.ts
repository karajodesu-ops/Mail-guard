import type { Job } from 'bullmq';
import { getPrismaClient, getLogger } from '@mailguard/core';

const logger = getLogger('worker:cleanup');

/**
 * OTP cleanup job processor
 * Deletes expired OTP records that are unverified and not invalidated
 * Runs every 15 minutes
 */
export async function processCleanupJob(job: Job): Promise<{ deleted: number }> {
  logger.info({ jobId: job.id }, 'Running OTP cleanup');
  
  const prisma = getPrismaClient();
  
  try {
    const result = await prisma.otpRecord.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        isVerified: false,
        isInvalidated: false,
      },
    });
    
    logger.info({ deleted: result.count }, 'OTP cleanup completed');
    
    return { deleted: result.count };
  } catch (error) {
    logger.error({ error }, 'OTP cleanup failed');
    throw error;
  }
}