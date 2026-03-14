import * as jwt from 'jsonwebtoken';
import { JWT_CONFIG, ERROR_CODES } from './constants';
import type { OtpTokenPayload } from './types';

/**
 * Sign an OTP verification token
 * 
 * @param payload - Token payload
 * @param secret - JWT secret
 * @returns Signed JWT token
 */
export function signOtpToken(
  payload: {
    sub: string;
    projectId: string;
    purpose: string;
    otpRecordId: string;
  },
  secret: string
): string {
  return jwt.sign(payload, secret, {
    expiresIn: JWT_CONFIG.OTP_TOKEN_EXPIRY,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Verify an OTP verification token
 * 
 * @param token - JWT token to verify
 * @param secret - JWT secret
 * @returns Decoded token payload or throws error
 */
export function verifyOtpToken(token: string, secret: string): OtpTokenPayload {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as OtpTokenPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const err = new Error('Token expired');
      (err as Error & { code: string }).code = ERROR_CODES.OTP_EXPIRED;
      throw err;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const err = new Error('Invalid token');
      (err as Error & { code: string }).code = ERROR_CODES.INVALID_CODE;
      throw err;
    }
    throw error;
  }
}

/**
 * Decode a token without verification (for inspection only)
 * 
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): OtpTokenPayload | null {
  try {
    return jwt.decode(token) as OtpTokenPayload | null;
  } catch {
    return null;
  }
}

/**
 * Get token expiration time
 * 
 * @param token - JWT token
 * @returns Expiration timestamp or null
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
}