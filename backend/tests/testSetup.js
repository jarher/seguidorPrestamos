import 'dotenv/config';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testDir = __dirname;
const projectRoot = join(testDir, '..');
const require = createRequire(import.meta.url);

const { sequelize, LenderUser, Borrower, Loan, PaymentSchedule, Notification } = require(join(projectRoot, 'src/models'));
const authRoutes = require(join(projectRoot, 'src/routes/auth'));
const borrowerRoutes = require(join(projectRoot, 'src/routes/borrowers'));
const loanRoutes = require(join(projectRoot, 'src/routes/loans'));
const notificationRoutes = require(join(projectRoot, 'src/routes/notifications'));
const reportRoutes = require(join(projectRoot, 'src/routes/reports'));

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export { app, sequelize, LenderUser, Borrower, Loan, PaymentSchedule, Notification };