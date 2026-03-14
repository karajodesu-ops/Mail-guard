import { createClient, RedisClientType } from 'redis';
import { getLogger } from './logger';

let redisClient: RedisClientType | null = null;

const logger = getLogger('core:redis');

/**
 * Get or create the Redis client singleton
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 10000,
      },
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Close the Redis client connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return false;
  }
}

/**
 * Get cached API key data
 */
export async function getCachedApiKey(keyHash: string): Promise<string | null> {
  const client = await getRedisClient();
  const key = `apikey:${keyHash}`;
  return client.get(key);
}

/**
 * Cache API key data
 */
export async function setCachedApiKey(keyHash: string, data: string, ttlSeconds: number = 60): Promise<void> {
  const client = await getRedisClient();
  const key = `apikey:${keyHash}`;
  await client.setEx(key, ttlSeconds, data);
}

/**
 * Invalidate cached API key
 */
export async function invalidateCachedApiKey(keyHash: string): Promise<void> {
  const client = await getRedisClient();
  const key = `apikey:${keyHash}`;
  await client.del(key);
}

export type { RedisClientType } from 'redis';