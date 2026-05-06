import { z } from 'zod';

export const loginSchema = z.object({
  userEmail: z.string().email('Correo electrónico inválido'),
  userPassword: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z.object({
  userEmail: z.string().email('Correo electrónico inválido'),
  userPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  userFirstName: z.string().min(1, 'El nombre es requerido'),
  userLastName: z.string().min(1, 'El apellido es requerido'),
});

export const createBorrowerSchema = z.object({
  borrowerFirstName: z.string().min(1, 'El nombre es requerido'),
  borrowerLastName: z.string().optional(),
  borrowerEmail: z.string().email('Correo inválido').optional().or(z.literal('')),
  borrowerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido').optional().or(z.literal('')),
});

export const updateBorrowerSchema = createBorrowerSchema.partial();

export const createLoanSchema = z.object({
  borrowerId: z.string().uuid(),
  principalLoan: z.number().positive('El monto debe ser mayor a 0'),
  monthlyRate: z.number().min(0).max(1, 'La tasa debe estar entre 0 y 100%'),
  loanScheme: z.enum(['FIXED_INSTALLMENT', 'DECREASING_INSTALLMENT', 'NO_INTEREST']),
  totalMonths: z.number().int().positive('Los meses deben ser mayores a 0'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DEFAULTED', 'PAID']),
});