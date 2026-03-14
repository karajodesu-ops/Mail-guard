import * as crypto from 'crypto';

/**
 * Validates that the encryption key is a valid 32-byte hex string (64 hex characters)
 */
export function validateEncryptionKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  if (key.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be a 32-byte hex string (64 hex characters). Got ${key.length} characters.`
    );
  }
  
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be a valid hex string (0-9, a-f, A-F characters only)');
  }
}

/**
 * Encrypts plaintext using AES-256-GCM
 * 
 * @param plaintext - The data to encrypt
 * @param key - 32-byte hex string encryption key (64 hex characters)
 * @returns Encrypted data in format: iv_hex:authTag_hex:ciphertext_hex
 */
export function encrypt(plaintext: string, key: string): string {
  validateEncryptionKey(key);
  
  // Generate a fresh random 16-byte IV for each encryption
  const iv = crypto.randomBytes(16);
  
  // Convert hex key to buffer
  const keyBuffer = Buffer.from(key, 'hex');
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Return format: iv_hex:authTag_hex:ciphertext_hex
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts ciphertext that was encrypted with AES-256-GCM
 * 
 * @param ciphertext - Encrypted data in format: iv_hex:authTag_hex:ciphertext_hex
 * @param key - 32-byte hex string encryption key (64 hex characters)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string, key: string): string {
  validateEncryptionKey(key);
  
  // Parse the encrypted format
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv_hex:authTag_hex:ciphertext_hex');
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format. Missing components.');
  }
  
  // Convert from hex
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  
  // Convert hex key to buffer
  const keyBuffer = Buffer.from(key, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  
  // Set auth tag for verification
  decipher.setAuthTag(authTag);
  
  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Generates a random encryption key suitable for AES-256-GCM
 * @returns 32-byte hex string (64 hex characters)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}