import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiters for auth
const registerLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_REGISTER_MAX) || 5,
  message: { message: 'Demasiadas cuentas creadas desde esta IP, intente más tarde' },
});

const loginLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_LOGIN_MAX) || 10,
  message: { message: 'Demasiados intentos de inicio de sesión, intente más tarde' },
});

// Generate access token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '24h' }
  );
};

// Helper to validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper to validate password strength
const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  if (password && !/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  if (password && !/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  return errors;
};

// Build user response object
const userResponse = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const validationErrors = [];
    if (!email || !isValidEmail(email)) {
      validationErrors.push('Correo electrónico no válido');
    }
    if (!fullName || fullName.trim().length < 3) {
      validationErrors.push('El nombre debe tener al menos 3 caracteres');
    }
    if (!password) {
      validationErrors.push('La contraseña es requerida');
    } else {
      validationErrors.push(...validatePassword(password));
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors[0], errors: validationErrors });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(409).json({ message: 'Ya existe una cuenta con este correo electrónico' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash: password,
      fullName: fullName.trim(),
    });

    res.status(201).json({
      token: generateToken(user),
      user: userResponse(user),
    });
  } catch (error) {
    console.error('Register error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] || 'Datos inválidos' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ya existe una cuenta con este correo electrónico' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    res.json({
      token: generateToken(user),
      user: userResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', async (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente' });
});

export default router;
