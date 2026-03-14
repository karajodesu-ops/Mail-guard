import * as crypto from 'crypto';
import { API_KEY_PREFIXES, API_KEY_CACHE_TTL, ERROR_CODES } from './constants';
import type { GeneratedApiKey, ApiKeyWithProject, ApiKeyValidation } from './types';
import { getPrismaClient } from './prisma';
import { getCachedApiKey, setCachedApiKey, invalidateCachedApiKey, getRedisClient } from './redis';
import { getLogger } from './logger';

const logger = getLogger('core:apikey');

/**
 * Generate a secure API key with specified prefix
 * 
 * @param isTest - Whether to generate a test key (mg_test_) or live key (mg_live_)
 * @returns Generated API key with hash and prefix
 */
export function generateApiKey(isTest: boolean = false): GeneratedApiKey {
  const prefix = isTest ? API_KEY_PREFIXES.TEST : API_KEY_PREFIXES.LIVE;
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const fullKey = `${prefix}${randomBytes}`;
  
  return {
    fullKey,
    keyHash: hashApiKey(fullKey),
    keyPrefix: fullKey.substring(0, 12), // e.g., "mg_live_3f9a"
  };
}

/**
 * Hash an API key using SHA-256
 * 
 * @param apiKey - Full API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validate and retrieve API key data from cache or database
 * 
 * @param apiKey - Full API key to validate
 * @returns Validation result with key data or error
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidation> {
  try {
    const keyHash = hashApiKey(apiKey);
    
    // Check Redis cache first
    const cachedData = await getCachedApiKey(keyHash);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData) as ApiKeyWithProject;
        
        // Check if key is still active and not expired
        if (!parsed.isActive) {
          return { valid: false, error: ERROR_CODES.KEY_REVOKED };
        }
        
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          return { valid: false, error: ERROR_CODES.KEY_EXPIRED };
        }
        
        return { valid: true, apiKey: parsed };
      } catch {
        // Invalid cache data, fall through to database lookup
        logger.warn('Invalid cached API key data, falling back to database');
      }
    }
    
    // Query database
    const prisma = getPrismaClient();
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        project: {
          include: {
            senderEmail: true,
          },
        },
      },
    });
    
    if (!keyRecord) {
      return { valid: false, error: ERROR_CODES.INVALID_API_KEY };
    }
    
    if (!keyRecord.isActive) {
      return { valid: false, error: ERROR_CODES.KEY_REVOKED };
    }
    
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return { valid: false, error: ERROR_CODES.KEY_EXPIRED };
    }
    
    // Cache the result
    await setCachedApiKey(keyHash, JSON.stringify(keyRecord), API_KEY_CACHE_TTL);
    
    // Update lastUsedAt asynchronously (don't await)
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch((err) => {
      logger.warn({ err }, 'Failed to update lastUsedAt for API key');
    });
    
    return { valid: true, apiKey: keyRecord };
  } catch (error) {
    logger.error({ error }, 'Error validating API key');
    return { valid: false, error: ERROR_CODES.INTERNAL_ERROR };
  }
}

/**
 * Revoke an API key by prefix
 * 
 * @param keyPrefix - The prefix of the key to revoke
 * @param projectId - Project ID for verification
 * @returns true if revoked, false if not found
 */
export async function revokeApiKeyByPrefix(keyPrefix: string, projectId: string): Promise<boolean> {
  const prisma = getPrismaClient();
  
  const keyRecord = await prisma.apiKey.findFirst({
    where: { keyPrefix, projectId },
  });
  
  if (!keyRecord) {
    return false;
  }
  
  // Update database
  await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { isActive: false },
  });
  
  // Invalidate cache
  await invalidateCachedApiKey(keyRecord.keyHash);
  
  return true;
}

/**
 * List API keys for a project
 * 
 * @param projectId - Project ID
 * @returns List of API keys (without sensitive data)
 */
export async function listApiKeys(projectId: string): Promise<Array<{
  id: string;
  keyPrefix: string;
  label: string | null;
  isSandbox: boolean;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}>> {
  const prisma = getPrismaClient();
  
  return prisma.apiKey.findMany({
    where: { projectId },
    select: {
      id: true,
      keyPrefix: true,
      label: true,
      isSandbox: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if an API key is a test key
 */
export function isTestApiKey(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIXES.TEST);
}