import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
} from './services/BcryptService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  ERROR_MESSAGES,
} from './services/JWTService.js';

const createError = (message = 'Request failed', status = 400) => ({ message, status });

const sanitizeLoan = (doc) => {
  const { _id, ...rest } = doc || {};
  return {
    ...rest,
    id: _id,
  };
};

const applyLoanUpdates = (original, updates = {}) => {
  const updated = { ...original, ...updates };
  if (updates.$push) {
    Object.entries(updates.$push).forEach(([key, value]) => {
      const target = Array.isArray(updated[key]) ? [...updated[key]] : [];
      if (Array.isArray(value)) {
        target.push(...value);
      } else {
        target.push(value);
      }
      updated[key] = target;
    });
  }
  delete updated.$push;
  updated._id = original._id;
  updated.id = original.id || original._id;
  updated.userId = original.userId;
  return updated;
};

const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, token] = auth.split(' ');
  if (type !== 'Bearer') return null;
  return token;
};

export function createApp({
  db,
  corsOrigin = '*',
} = {}) {
  if (!db) {
    throw createError('Database instance is required', 500);
  }

  const usersCollection = db.collection('users');
  const loansCollection = db.collection('loans');

  const app = express();
  app.use(cors({
    origin: corsOrigin,
  }));
  app.use(express.json());

  const authRouter = express.Router();

  authRouter.post('/register', async (req, res) => {
    try {
      const { email, password, fullName } = req.body || {};
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, contraseña y nombre completo son obligatorios' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await usersCollection.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'Usuario ya existe' });
      }

      const passwordHash = await hashPassword(password);
      const user = {
        _id: randomUUID(),
        email: normalizedEmail,
        fullName: fullName.trim(),
        passwordHash,
        role: 'lender',
        createdAt: new Date().toISOString(),
      };

      await usersCollection.insertOne(user);

      const token = generateAccessToken(user._id, user.email);
      const refreshResult = generateRefreshToken(user._id, user.email);

      return res.status(200).json({
        success: true,
        token,
        refreshToken: refreshResult.token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Falló el registro' });
    }
  });

  authRouter.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await usersCollection.findOne({ email: normalizedEmail });
      const isValid = user && await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateAccessToken(user._id, user.email);
      const refreshResult = generateRefreshToken(user._id, user.email);

      return res.json({
        success: true,
        token,
        refreshToken: refreshResult.token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
    }
  });

  authRouter.post('/validate', (req, res) => {
    const token = getTokenFromHeader(req);
    const verification = verifyToken(token);
    return res.status(200).json({ valid: verification.valid });
  });

  app.use('/api/auth', authRouter);

  const requireAuth = (req, res, next) => {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: ERROR_MESSAGES.missingToken });
    }

    const verification = verifyToken(token);
    if (!verification.valid) {
      return res.status(401).json({ error: verification.error });
    }

    req.user = {
      id: verification.payload.sub,
      email: verification.payload.email,
    };
    next();
  };

  const loansRouter = express.Router();
  loansRouter.use(requireAuth);

  loansRouter.get('/', async (req, res) => {
    const cursor = loansCollection.find({ userId: req.user.id });
    const loans = await cursor.toArray();
    return res.json({ loans: loans.map(sanitizeLoan) });
  });

  loansRouter.post('/', async (req, res) => {
    const payload = req.body?.loan;
    if (!payload) {
      return res.status(400).json({ error: 'Loan payload is required' });
    }

    const loanId = payload.id || randomUUID();
    const stored = {
      ...payload,
      _id: loanId,
      id: loanId,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
    };

    await loansCollection.insertOne(stored);
    return res.status(201).json({ loan: sanitizeLoan(stored) });
  });

  loansRouter.put('/:id', async (req, res) => {
    const loanId = req.params.id;
    const { updates } = req.body || {};
    if (!updates) {
      return res.status(400).json({ error: 'Updates object is required' });
    }

    const existing = await loansCollection.findOne({ _id: loanId, userId: req.user.id });
    if (!existing) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const updatedLoan = applyLoanUpdates(existing, updates);
    await loansCollection.replaceOne({ _id: loanId, userId: req.user.id }, updatedLoan);
    return res.json({ loan: sanitizeLoan(updatedLoan) });
  });

  loansRouter.delete('/:id', async (req, res) => {
    const loanId = req.params.id;
    const deletion = await loansCollection.deleteOne({ _id: loanId, userId: req.user.id });

    if (deletion.deletedCount === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    return res.json({ message: 'Loan removed' });
  });

  app.use('/api/loans', loansRouter);

  return app;
}
