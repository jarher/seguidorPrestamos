import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import compression from 'compression';


// Route imports
import authRoutes from './routes/auth.js';
import loanRoutes from './routes/loans.js';
import lenderRoutes from './routes/lender.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Connect to Database
connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simplicity if needed, or configure it properly
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

// Body Parser
app.use(express.json());

// Compression
app.use(compression());


// Idempotency Middleware
app.use(idempotencyMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/lender', lenderRoutes);

// Static Files & SPA Routing
const isProd = process.env.NODE_ENV === 'production';
const clientPath = isProd 
  ? path.join(__dirname, '..', 'client') // In production, this file is in dist/api/index.js, so client is in dist/client
  : path.join(__dirname, '..', 'client'); 

// Actually, in the final structure:
// dist/
//   api/index.js
//   client/index.html
// So ../client is correct for BOTH if we maintain relative structure in dist.

app.use(express.static(clientPath));


// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// SPA Fallback: send index.html for any non-API routes
app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API Route Not Found' });
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
