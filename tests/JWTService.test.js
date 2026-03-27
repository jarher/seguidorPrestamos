/**
 * JWTService Tests
 * 
 * Tests for JWT token generation, validation, and verification.
 * 
 * @module JWTServiceTests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  refreshAccessToken,
  isValidTokenFormat,
  getTokenType,
  JWT_CONFIG,
  ERROR_MESSAGES
} from '../server/services/JWTService.js';

// Mock date for consistent testing
const fixedDate = new Date('2024-01-15T12:00:00Z');
vi.setSystemTime(fixedDate);

describe('Token Generation', () => {
  it('should generate access token with correct payload', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(isValidTokenFormat(token)).toBe(true);

    const decoded = decodeToken(token);
    expect(decoded.sub).toBe(userId);
    expect(decoded.email).toBe(email);
    expect(decoded.type).toBeUndefined();
  });

  it('should generate refresh token with correct payload', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const result = generateRefreshToken(userId, email);

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.jti).toBeDefined();
    expect(isValidTokenFormat(result.token)).toBe(true);

    const decoded = decodeToken(result.token);
    expect(decoded.sub).toBe(userId);
    expect(decoded.email).toBe(email);
    expect(decoded.type).toBe('refresh');
  });

  it('should set correct expiration times', () => {
    const userId = 'user123';
    const email = 'test@example.com';

    const accessToken = generateAccessToken(userId, email);
    const refreshResult = generateRefreshToken(userId, email);
    const refreshToken = refreshResult.token;

    const accessExpiration = getTokenExpiration(accessToken);
    const refreshExpiration = getTokenExpiration(refreshToken);

    // Access token expires in 24 hours (86400 seconds)
    expect(accessExpiration).toBeGreaterThan(fixedDate.getTime() / 1000);
    expect(accessExpiration).toBeLessThanOrEqual(fixedDate.getTime() / 1000 + 86400);

    // Refresh token expires in 7 days (604800 seconds)
    expect(refreshExpiration).toBeGreaterThan(fixedDate.getTime() / 1000);
    expect(refreshExpiration).toBeLessThanOrEqual(fixedDate.getTime() / 1000 + 604800);
  });

  it('should use custom JWT secret from environment', () => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'custom-test-secret';

    const userId = 'user123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    // Verify token was signed with custom secret
    const decoded = decodeToken(token);
    expect(decoded).toBeDefined();

    process.env.JWT_SECRET = originalSecret;
  });
});

describe('Token Verification', () => {
  it('should verify valid access token', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    const result = verifyToken(token);
    expect(result.valid).toBe(true);
    expect(result.payload.sub).toBe(userId);
    expect(result.payload.email).toBe(email);
    expect(result.error).toBeNull();
  });

  it('should verify valid refresh token', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const refreshResult = generateRefreshToken(userId, email);
    const token = refreshResult.token;

    const result = verifyToken(token);
    expect(result.valid).toBe(true);
    expect(result.payload.sub).toBe(userId);
    expect(result.payload.email).toBe(email);
    expect(result.payload.type).toBe('refresh');
  });

  it('should reject invalid token format', () => {
    const result = verifyToken('invalid-token');
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES.invalidToken);
  });

  it('should reject empty token', () => {
    const result = verifyToken('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES.missingToken);
  });

  it('should reject null token', () => {
    const result = verifyToken(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES.missingToken);
  });

  it('should reject tampered token', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    // Tamper with the token
    const parts = token.split('.');
    const tamperedPayload = btoa(JSON.stringify({ sub: 'hacker123', email: 'hacker@example.com' }));
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const result = verifyToken(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES.invalidToken);
  });
});

describe('Token Expiration', () => {
  it('should detect expired token', () => {
    const userId = 'user123';
    const email = 'test@example.com';

    // Create a token with a very short expiration
    const token = generateAccessToken(userId, email, { expiresIn: '1s' });

    // Wait for token to expire
    vi.setSystemTime(new Date('2024-01-15T12:00:02Z'));

    const result = verifyToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES.expiredToken);
  });

  it('should return correct expiration time', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    const expiration = getTokenExpiration(token);
    expect(expiration).toBeDefined();
    expect(typeof expiration).toBe('number');
    expect(expiration).toBeGreaterThan(fixedDate.getTime() / 1000);
  });
});

describe('Token Refresh', () => {
  it('should refresh access token with valid refresh token', async () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const refreshResult = generateRefreshToken(userId, email);
    const refreshToken = refreshResult.token;

    const result = await refreshAccessToken(refreshToken);
    expect(result.success).toBe(true);
    expect(result.accessToken).toBeDefined();
    expect(result.error).toBeNull();

    // Verify new access token is valid
    const accessResult = verifyToken(result.accessToken);
    expect(accessResult.valid).toBe(true);
    expect(accessResult.payload.sub).toBe(userId);
  });

  it('should reject invalid refresh token', async () => {
    const result = await refreshAccessToken('invalid-token');
    expect(result.success).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES.invalidToken);
  });

  it('should reject access token as refresh token', async () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const accessToken = generateAccessToken(userId, email);

    const result = await refreshAccessToken(accessToken);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Token inválido');
  });
});

describe('Token Utilities', () => {
  it('should validate token format', () => {
    expect(isValidTokenFormat('valid.token.format')).toBe(true);
    expect(isValidTokenFormat('invalid')).toBe(false);
    expect(isValidTokenFormat('')).toBe(false);
    expect(isValidTokenFormat(null)).toBe(false);
  });

  it('should get token type', () => {
    const userId = 'user123';
    const email = 'test@example.com';

    const accessToken = generateAccessToken(userId, email);
    expect(getTokenType(accessToken)).toBe('access');

    const refreshResult = generateRefreshToken(userId, email);
    expect(getTokenType(refreshResult.token)).toBe('refresh');
  });

  it('should decode token without verification', () => {
    const userId = 'user123';
    const email = 'test@example.com';
    const token = generateAccessToken(userId, email);

    const decoded = decodeToken(token);
    expect(decoded.sub).toBe(userId);
    expect(decoded.email).toBe(email);
  });
});
