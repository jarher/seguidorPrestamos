/**
 * BcryptService Tests
 * 
 * Tests for password hashing, verification, and validation.
 * 
 * @module BcryptServiceTests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  validatePasswordConfirmation,
  getPasswordStrength,
  PASSWORD_REQUIREMENTS,
  PASSWORD_ERROR_MESSAGES
} from '../server/services/BcryptService.js';

describe('Password Validation', () => {
  describe('validatePasswordStrength', () => {
    it('should reject empty passwords', () => {
      const result = validatePasswordStrength('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.empty);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('short');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.minLength);
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.uppercase);
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.lowercase);
    });

    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.number);
    });

    it('should reject passwords without special characters', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.specialChar);
    });

    it('should accept valid strong passwords', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept passwords with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '{', '}', '[', ']', ';', ':', '"', "'", '<', '>', ',', '.', '?', '/', '|', '\\'];

      specialChars.forEach(char => {
        const password = `Password123${char}`;
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('getPasswordStrength', () => {
    it('should return empty state for null/undefined', () => {
      const result = getPasswordStrength(null);
      expect(result).toEqual({ score: 0, label: 'empty', color: 'gray' });
    });

    it('should return weak for short passwords', () => {
      const result = getPasswordStrength('pass');
      expect(result.label).toBe('Débil');
      expect(result.color).toBe('red');
    });

    it('should return moderate for medium passwords', () => {
      const result = getPasswordStrength('Password123');
      expect(result.label).toBe('Moderada');
      expect(result.color).toBe('orange');
    });

    it('should return strong for long passwords', () => {
      const result = getPasswordStrength('MyStr0ng!Passw0rd!2024');
      expect(result.label).toBe('Fuerte');
      expect(result.color).toBe('green');
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('should reject empty confirmation', () => {
      const result = validatePasswordConfirmation('Password123!', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Por favor confirme su contraseña');
    });

    it('should reject mismatched passwords', () => {
      const result = validatePasswordConfirmation('Password123!', 'Password1234!');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(PASSWORD_ERROR_MESSAGES.mismatch);
    });

    it('should accept matching passwords', () => {
      const result = validatePasswordConfirmation('Password123!', 'Password123!');
      expect(result.valid).toBe(true);
    });
  });
});

describe('Password Hashing', () => {
  it('should hash a password successfully', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(password.length);
  });

  it('should produce different hashes for same password (due to random salt)', async () => {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    // Verify both hashes can verify the same password
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  }, 10000);

  it('should reject weak passwords during hashing', async () => {
    await expect(hashPassword('short')).rejects.toThrow();
    await expect(hashPassword('password')).rejects.toThrow();
  });
});

describe('Password Verification', () => {
  it('should verify correct password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'TestPassword123!';
    const wrongPassword = 'WrongPassword123!';
    const hash = await hashPassword(password);

    const isMatch = await verifyPassword(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });

  it('should handle empty password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    const isMatch = await verifyPassword('', hash);
    expect(isMatch).toBe(false);
  });

  it('should handle empty hash', async () => {
    const password = 'TestPassword123!';

    const isMatch = await verifyPassword(password, '');
    expect(isMatch).toBe(false);
  });
});
