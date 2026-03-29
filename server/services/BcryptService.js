import bcrypt from 'bcrypt';

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  uppercase: true,
  lowercase: true,
  number: true,
  specialChar: true,
};

export const PASSWORD_ERROR_MESSAGES = {
  empty: 'La contraseña es requerida.',
  minLength: `La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres.`,
  uppercase: 'Debe contener al menos una mayúscula.',
  lowercase: 'Debe contener al menos una minúscula.',
  number: 'Debe contener al menos un número.',
  specialChar: 'Debe contener al menos un carácter especial (@#$%^&*!).',
  mismatch: 'Las contraseñas no coinciden.',
};

const normalizePassword = (value) => (typeof value === 'string' ? value : String(value || ''));

export function validatePasswordStrength(value) {
  const password = normalizePassword(value).trim();
  const errors = [];

  if (!password) {
    return { valid: false, errors: [PASSWORD_ERROR_MESSAGES.empty] };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(PASSWORD_ERROR_MESSAGES.minLength);
  }
  if (PASSWORD_REQUIREMENTS.uppercase && !/[A-Z]/.test(password)) {
    errors.push(PASSWORD_ERROR_MESSAGES.uppercase);
  }
  if (PASSWORD_REQUIREMENTS.lowercase && !/[a-z]/.test(password)) {
    errors.push(PASSWORD_ERROR_MESSAGES.lowercase);
  }
  if (PASSWORD_REQUIREMENTS.number && !/\d/.test(password)) {
    errors.push(PASSWORD_ERROR_MESSAGES.number);
  }
  if (PASSWORD_REQUIREMENTS.specialChar && !SPECIAL_CHARS.test(password)) {
    errors.push(PASSWORD_ERROR_MESSAGES.specialChar);
  }

  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(value) {
  const password = normalizePassword(value);
  if (!password) {
    return { score: 0, label: 'empty', color: 'gray' };
  }

  let score = 0;
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (SPECIAL_CHARS.test(password)) score += 1;

  if (score <= 2) {
    return { score, label: 'Débil', color: 'red' };
  }
  if (score <= 4) {
    return { score, label: 'Moderada', color: 'orange' };
  }

  return { score, label: 'Fuerte', color: 'green' };
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) {
    return { valid: false, error: 'Por favor confirme su contraseña' };
  }
  if (password !== confirmation) {
    return { valid: false, error: PASSWORD_ERROR_MESSAGES.mismatch };
  }
  return { valid: true, error: null };
}

export async function hashPassword(password) {
  const trimmed = normalizePassword(password);
  const validation = validatePasswordStrength(trimmed);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return bcrypt.hash(trimmed, rounds);
}

export async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }

  try {
    return bcrypt.compare(password, hash);
  } catch (error) {
    console.warn('Failed to verify password:', error);
    return false;
  }
}
