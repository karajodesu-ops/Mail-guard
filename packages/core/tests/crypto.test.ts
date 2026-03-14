import { describe, it, expect, beforeEach } from 'vitest';
import {
  encrypt,
  decrypt,
  validateEncryptionKey,
  generateEncryptionKey,
} from '../src/crypto';

describe('Crypto Module', () => {
  describe('validateEncryptionKey', () => {
    it('should accept a valid 32-byte hex key', () => {
      const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      expect(() => validateEncryptionKey(validKey)).not.toThrow();
    });

    it('should reject empty key', () => {
      expect(() => validateEncryptionKey('')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should reject null/undefined key', () => {
      expect(() => validateEncryptionKey(null as unknown as string)).toThrow('ENCRYPTION_KEY environment variable is not set');
      expect(() => validateEncryptionKey(undefined as unknown as string)).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should reject key with wrong length', () => {
      const shortKey = '0123456789abcdef';
      expect(() => validateEncryptionKey(shortKey)).toThrow('ENCRYPTION_KEY must be a 32-byte hex string');
    });

    it('should reject key with invalid characters', () => {
      const invalidKey = 'g'.repeat(64);
      expect(() => validateEncryptionKey(invalidKey)).toThrow('ENCRYPTION_KEY must be a valid hex string');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-fA-F]+$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateEncryptionKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('encrypt and decrypt', () => {
    const testKey = generateEncryptionKey();

    it('should encrypt plaintext', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext, testKey);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      
      // Check format: iv_hex:authTag_hex:ciphertext_hex
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // 16 bytes IV = 32 hex chars
      expect(parts[1]).toHaveLength(32); // 16 bytes auth tag = 32 hex chars
    });

    it('should decrypt ciphertext correctly', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext', () => {
      const plaintext = 'Same message';
      const encrypted1 = encrypt(plaintext, testKey);
      const encrypted2 = encrypt(plaintext, testKey);
      
      // Due to random IV, encrypted values should differ
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should decrypt both ciphertexts correctly', () => {
      const plaintext = 'Same message';
      const encrypted1 = encrypt(plaintext, testKey);
      const encrypted2 = encrypt(plaintext, testKey);
      
      expect(decrypt(encrypted1, testKey)).toBe(plaintext);
      expect(decrypt(encrypted2, testKey)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special: 你好 🎉 @#$%^&*()\n\t\r';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should reject invalid encrypted data format', () => {
      expect(() => decrypt('invalid', testKey)).toThrow('Invalid encrypted data format');
      expect(() => decrypt('invalid:format', testKey)).toThrow('Invalid encrypted data format');
    });

    it('should reject tampered ciphertext', () => {
      const plaintext = 'Original message';
      const encrypted = encrypt(plaintext, testKey);
      
      // Tamper with the ciphertext
      const parts = encrypted.split(':');
      const tamperedCiphertext = parts[2].replace(/a/g, 'b');
      const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;
      
      expect(() => decrypt(tampered, testKey)).toThrow();
    });

    it('should reject tampered auth tag', () => {
      const plaintext = 'Original message';
      const encrypted = encrypt(plaintext, testKey);
      
      // Tamper with the auth tag
      const parts = encrypted.split(':');
      const tamperedAuthTag = parts[1].replace(/0/g, 'f');
      const tampered = `${parts[0]}:${tamperedAuthTag}:${parts[2]}`;
      
      expect(() => decrypt(tampered, testKey)).toThrow();
    });

    it('should fail to decrypt with wrong key', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext, testKey);
      const wrongKey = generateEncryptionKey();
      
      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });
  });

  describe('round-trip encryption', () => {
    it('should handle multiple encrypt/decrypt cycles', () => {
      const testKey = generateEncryptionKey();
      const messages = [
        'First message',
        'Second message with more text',
        'Third: 你好世界 🌍',
        JSON.stringify({ key: 'value', nested: { data: [1, 2, 3] } }),
      ];

      for (const msg of messages) {
        const encrypted = encrypt(msg, testKey);
        const decrypted = decrypt(encrypted, testKey);
        expect(decrypted).toBe(msg);
      }
    });
  });
});