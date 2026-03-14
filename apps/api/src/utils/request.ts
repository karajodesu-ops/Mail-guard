import type { FastifyRequest } from 'fastify';
import { extractClientIp } from '@mailguard/core';

/**
 * Get client IP address from request
 */
export function getRequestIp(request: FastifyRequest): string {
  const headers = request.headers as Record<string, string | undefined>;
  return extractClientIp(headers);
}

/**
 * Get authorization token from request headers
 */
export function getAuthToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  
  if (!auth) {
    return null;
  }
  
  const parts = auth.split(' ');
  
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1] ?? null;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(16).toString('hex');
}