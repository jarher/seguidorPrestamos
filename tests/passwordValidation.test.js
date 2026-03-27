import { describe, it, expect } from 'vitest';

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const validatePassword = (value, minlength = 8) => {
    const errors = [];
    
    if (!value) {
        return { valid: false, error: 'La contraseña es requerida.' };
    }
    
    if (!minlength || value.length < minlength) {
        errors.push(`La contraseña debe tener al menos ${minlength} caracteres.`);
    }
    if (!/[A-Z]/.test(value)) {
        errors.push('Debe contener al menos una mayúscula.');
    }
    if (!/[a-z]/.test(value)) {
        errors.push('Debe contener al menos una minúscula.');
    }
    if (!/\d/.test(value)) {
        errors.push('Debe contener al menos un número.');
    }
    if (!SPECIAL_CHARS.test(value)) {
        errors.push('Debe contener al menos un carácter especial (@#$%^&*!).');
    }
    
    return errors.length > 0 
        ? { valid: false, error: errors[0] }
        : { valid: true, error: null };
};

const validatePasswordMatch = (confirmPassword, originalPassword) => {
    if (!confirmPassword) {
        return { valid: false, error: 'Confirma tu contraseña.' };
    }
    if (confirmPassword !== originalPassword) {
        return { valid: false, error: 'Las contraseñas no coinciden.' };
    }
    return { valid: true, error: null };
};

describe('Password Validation', () => {
    it('should accept valid password with all requirements including special char', () => {
        const result = validatePassword('Password123@');
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should accept password with 8 characters exactly and special char', () => {
        const result = validatePassword('Pass123@');
        expect(result.valid).toBe(true);
    });

    it('should reject password with less than 8 characters', () => {
        const result = validatePassword('Pass1@');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('8 caracteres');
    });

    it('should reject password without uppercase', () => {
        const result = validatePassword('password123@');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('mayúscula');
    });

    it('should reject password without lowercase', () => {
        const result = validatePassword('PASSWORD123@');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('minúscula');
    });

    it('should reject password without number', () => {
        const result = validatePassword('Passwordabc@');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('número');
    });

    it('should reject password without special character', () => {
        const result = validatePassword('Password123');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('carácter especial');
    });

    it('should reject empty password', () => {
        const result = validatePassword('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('La contraseña es requerida.');
    });

    it('should reject null password', () => {
        const result = validatePassword(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('La contraseña es requerida.');
    });

    it('should reject password with only spaces', () => {
        const result = validatePassword('        ');
        expect(result.valid).toBe(false);
    });

    it('should accept password with @ symbol', () => {
        const result = validatePassword('Pass@word123');
        expect(result.valid).toBe(true);
    });

    it('should accept password with # symbol', () => {
        const result = validatePassword('Pass#word123');
        expect(result.valid).toBe(true);
    });

    it('should accept password with $ symbol', () => {
        const result = validatePassword('Pass$word123');
        expect(result.valid).toBe(true);
    });

    it('should accept password with ! symbol', () => {
        const result = validatePassword('Pass!word123');
        expect(result.valid).toBe(true);
    });

    it('should accept password with * symbol', () => {
        const result = validatePassword('Pass*word123');
        expect(result.valid).toBe(true);
    });

    it('should accept long password with all requirements', () => {
        const result = validatePassword('MiSuperPasswordSegura123@', 8);
        expect(result.valid).toBe(true);
    });

    it('should respect custom minlength parameter', () => {
        const result = validatePassword('Pass12@', 10);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('10 caracteres');
    });
});

describe('Password Examples from Real Users', () => {
    const validExamples = [
        'Password123@',
        'Admin2024!',
        'Usuario1abc#',
        'Seguridad99$',
        'MiClave123*'
    ];

    validExamples.forEach(password => {
        it(`should accept: ${password}`, () => {
            const result = validatePassword(password);
            expect(result.valid).toBe(true);
        });
    });

    const invalidExamples = [
        { pass: 'password', reason: 'sin mayúscula, número ni especial' },
        { pass: 'PASSWORD', reason: 'sin minúscula, número ni especial' },
        { pass: 'Pass123', reason: 'sin carácter especial' },
        { pass: 'Pass@abc', reason: 'sin número' },
        { pass: '12345678@', reason: 'sin letras minúsculas' },
        { pass: 'abcdefgh@', reason: 'sin mayúscula ni número' }
    ];

    invalidExamples.forEach(({ pass, reason }) => {
        it(`should reject "${pass}" (${reason})`, () => {
            const result = validatePassword(pass);
            expect(result.valid).toBe(false);
        });
    });
});

describe('Password Confirmation Validation', () => {
    it('should accept matching passwords', () => {
        const result = validatePasswordMatch('Password123@', 'Password123@');
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should reject when passwords do not match', () => {
        const result = validatePasswordMatch('Password123@', 'Password123#');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Las contraseñas no coinciden.');
    });

    it('should reject empty confirmation', () => {
        const result = validatePasswordMatch('', 'Password123@');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Confirma tu contraseña.');
    });

    it('should reject null confirmation', () => {
        const result = validatePasswordMatch(null, 'Password123@');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Confirma tu contraseña.');
    });

    it('should reject when confirmation does not match original', () => {
        const result = validatePasswordMatch('Password123@', '');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Las contraseñas no coinciden.');
    });

    it('should reject case-sensitive mismatch', () => {
        const result = validatePasswordMatch('Password123@', 'password123@');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Las contraseñas no coinciden.');
    });

    it('should reject partial match', () => {
        const result = validatePasswordMatch('Password123', 'Password123@');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Las contraseñas no coinciden.');
    });
});
