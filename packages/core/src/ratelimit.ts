export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  retryAfter: number;
}

export interface RedisClient {
  multi(): RedisMulti;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number; PX?: number; NX?: boolean; XX?: boolean }): Promise<string | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
}

export interface RedisMulti {
  incr(key: string): RedisMulti;
  expire(key: string, seconds: number): RedisMulti;
  ttl(key: string): RedisMulti;
  exec(): Promise<[error: Error | null, result: unknown][]>;
}

/**
 * Redis Sliding Window Rate Limiter
 * Uses a sliding window counter with atomic operations
 */
export class RateLimiter {
  private redis: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redis = redisClient;
  }

  /**
   * Check rate limit and increment counter atomically
   * 
   * @param config - Rate limit configuration
   * @returns Rate limit result with current count and allowance status
   */
  async checkAndIncrement(config: RateLimitConfig): Promise<RateLimitResult> {
    const { key, limit, windowSeconds } = config;
    
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    multi.ttl(key);
    
    const results = await multi.exec();
    
    const incrResult = results[0];
    const expireResult = results[1];
    const ttlResult = results[2];
    
    if (!incrResult || !expireResult || !ttlResult) {
      throw new Error('Redis multi command failed');
    }
    
    const [incrErr, count] = incrResult;
    const [expireErr] = expireResult;
    const [ttlErr, ttl] = ttlResult;
    
    if (incrErr || expireErr || ttlErr) {
      throw new Error(`Redis error: ${incrErr?.message || expireErr?.message || ttlErr?.message}`);
    }
    
    const currentCount = typeof count === 'number' ? count : parseInt(String(count), 10);
    const ttlValue = typeof ttl === 'number' ? ttl : parseInt(String(ttl), 10);
    
    const allowed = currentCount <= limit;
    const retryAfter = ttlValue > 0 ? ttlValue : windowSeconds;
    
    // If this is the first request, the counter was just created
    // If over limit, we still incremented, so the count might be > limit
    return {
      allowed,
      current: currentCount,
      limit,
      retryAfter,
    };
  }

  /**
   * Check rate limit without incrementing (read-only check)
   * 
   * @param key - Redis key
   * @param limit - Maximum allowed requests
   * @param windowSeconds - Window duration in seconds
   * @returns Rate limit result
   */
  async checkOnly(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const currentStr = await this.redis.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const ttl = await this.redis.ttl(key);
    
    return {
      allowed: current < limit,
      current,
      limit,
      retryAfter: ttl > 0 ? ttl : windowSeconds,
    };
  }

  /**
   * Reset rate limit counter for a key
   * 
   * @param key - Redis key to reset
   */
  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

/**
 * Rate limit key generators
 */
export const RateLimitKeys = {
  /**
   * OTP sends per email per hour (per project)
   */
  otpPerEmail(projectId: string, emailHash: string): string {
    return `rl:otp:email:${projectId}:${emailHash}`;
  },

  /**
   * OTP sends per IP per minute
   */
  otpPerIp(ip: string): string {
    return `rl:otp:ip:${ip}`;
  },

  /**
   * API calls per key per minute
   */
  apiKeyPerMinute(keyHash: string): string {
    return `rl:api:${keyHash}`;
  },

  /**
   * Emails per project per hour
   */
  emailPerProject(projectId: string): string {
    return `rl:email:project:${projectId}`;
  },
};

/**
 * Rate limit tiers with default configurations
 */
export const RateLimitTiers = {
  OTP_PER_EMAIL: {
    limit: 10,
    windowSeconds: 3600, // 1 hour
  },
  OTP_PER_IP: {
    limit: 5,
    windowSeconds: 60, // 1 minute
  },
  API_KEY_PER_MINUTE: {
    limit: 60,
    windowSeconds: 60,
  },
  EMAIL_PER_PROJECT: {
    limit: 200,
    windowSeconds: 3600, // 1 hour
  },
} as const;

/**
 * Hash email address for rate limit key (privacy)
 */
export function hashEmailForRateLimit(email: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 16);
}

/**
 * Hash API key for cache/rate limit key
 */
export function hashKeyForCache(key: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(key).digest('hex');
}