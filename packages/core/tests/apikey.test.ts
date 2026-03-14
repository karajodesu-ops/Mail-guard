import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  isTestApiKey,
} from '../src/apikey';
import { API_KEY_PREFIXES } from '../src/constants';

describe('API Key Module', () => {
  describe('generateApiKey', () => {
    it('should generate a live API key by default', () => {
      const result = generateApiKey();
      
      expect(result.fullKey).toBeDefined();
      expect(result.fullKey.startsWith(API_KEY_PREFIXES.LIVE)).toBe(true);
      expect(result.keyPrefix).toBeDefined();
      expect(result.keyHash).toBeDefined();
    });

    it('should generate a test API key when isTest is true', () => {
      const result = generateApiKey(true);
      
      expect(result.fullKey).toBeDefined();
      expect(result.fullKey.startsWith(API_KEY_PREFIXES.TEST)).toBe(true);
      expect(result.keyPrefix).toBeDefined();
      expect(result.keyHash).toBeDefined();
    });

    it('should generate unique API keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateApiKey().fullKey);
      }
      expect(keys.size).toBe(100);
    });

    it('should generate correct key prefix', () => {
      const result = generateApiKey();
      // Prefix should be first 12 characters
      expect(result.keyPrefix).toBe(result.fullKey.substring(0, 12));
      expect(result.keyPrefix.startsWith('mg_')).toBe(true);
    });

    it('should generate consistent hash for the same key', () => {
      const result = generateApiKey();
      const hash1 = hashApiKey(result.fullKey);
      const hash2 = hashApiKey(result.fullKey);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBe(result.keyHash);
    });

    it('should generate different hashes for different keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      
      expect(key1.keyHash).not.toBe(key2.keyHash);
    });
  });

  describe('hashApiKey', () => {
    it('should return a SHA-256 hash', () => {
      const apiKey = 'mg_live_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const hash = hashApiKey(apiKey);
      
      // SHA-256 produces 64 hex characters
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-fA-F]+$/.test(hash)).toBe(true);
    });

    it('should be deterministic', () => {
      const apiKey = 'mg_test_testkey123';
      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashApiKey('key1');
      const hash2 = hashApiKey('key2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isTestApiKey', () => {
    it('should return true for test keys', () => {
      expect(isTestApiKey('mg_test_abc123')).toBe(true);
      expect(isTestApiKey('mg_test_')).toBe(true);
    });

    it('should return false for live keys', () => {
      expect(isTestApiKey('mg_live_abc123')).toBe(false);
      expect(isTestApiKey('mg_live_')).toBe(false);
    });

    it('should return false for invalid prefixes', () => {
      expect(isTestApiKey('invalid')).toBe(false);
      expect(isTestApiKey('mg_')).toBe(false);
      expect(isTestApiKey('')).toBe(false);
    });
  });

  describe('API Key format validation', () => {
    it('should have correct live prefix format', () => {
      expect(API_KEY_PREFIXES.LIVE).toBe('mg_live_');
    });

    it('should have correct test prefix format', () => {
      expect(API_KEY_PREFIXES.TEST).toBe('mg_test_');
    });

    it('should generate keys with correct total length', () => {
      // Prefix (9 chars) + 64 hex chars = 73 characters
      const liveKey = generateApiKey(false);
      const testKey = generateApiKey(true);
      
      expect(liveKey.fullKey).toHaveLength(73);
      expect(testKey.fullKey).toHaveLength(73);
    });
  });
});