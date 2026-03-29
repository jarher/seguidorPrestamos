import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

export const JWT_CONFIG = {
  access: {
    expiresIn: '24h',
  },
  refresh: {
    expiresIn: '7d',
  },
};

export const ERROR_MESSAGES = {
  invalidToken: 'Token inválido',
  missingToken: 'Token ausente',
  expiredToken: 'Token expirado',
};

const DEFAULT_SECRET = 'jwt-secret-test-default';
const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    return DEFAULT_SECRET;
  }
  return process.env.JWT_SECRET;
};

export function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  return token.split('.').length === 3;
}

export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  return jwt.decode(token);
}

export function getTokenExpiration(token) {
  const payload = decodeToken(token);
  if (!payload || typeof payload !== 'object') return null;
  return payload.exp || null;
}

export function isTokenExpired(token) {
  const exp = getTokenExpiration(token);
  if (!exp) return false;
  return Math.floor(Date.now() / 1000) >= exp;
}

export function generateAccessToken(userId, email, options = {}) {
  return jwt.sign(
    { sub: userId, email },
    getSecret(),
    {
      expiresIn: options.expiresIn || JWT_CONFIG.access.expiresIn,
    },
  );
}

export function generateRefreshToken(userId, email) {
  const jti = randomUUID();
  const token = jwt.sign(
    {
      sub: userId,
      email,
      type: 'refresh',
      jti,
    },
    getSecret(),
    {
      expiresIn: JWT_CONFIG.refresh.expiresIn,
    },
  );
  return { token, jti };
}

export function getTokenType(token) {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded !== 'object') return null;
  return decoded.type === 'refresh' ? 'refresh' : 'access';
}

export function verifyToken(token) {
  if (!token) {
    return { valid: false, payload: null, error: ERROR_MESSAGES.missingToken };
  }

  if (!isValidTokenFormat(token)) {
    return { valid: false, payload: null, error: ERROR_MESSAGES.invalidToken };
  }

  try {
    const payload = jwt.verify(token, getSecret());
    return { valid: true, payload, error: null };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, payload: null, error: ERROR_MESSAGES.expiredToken };
    }
    return { valid: false, payload: null, error: ERROR_MESSAGES.invalidToken };
  }
}

export async function refreshAccessToken(refreshToken) {
  const verification = verifyToken(refreshToken);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  if (verification.payload?.type !== 'refresh') {
    return { success: false, error: 'Token inválido' };
  }

  const newAccessToken = generateAccessToken(
    verification.payload.sub,
    verification.payload.email,
  );

  return { success: true, accessToken: newAccessToken, error: null };
}
