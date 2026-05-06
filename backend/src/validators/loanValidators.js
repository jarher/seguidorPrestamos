const { z } = require('zod');

const createLoanSchema = z.object({
  borrowerId: z.string().uuid(),
  principalLoan: z.number().positive(),
  monthlyRate: z.number().min(0).max(1),
  loanScheme: z.enum(['FIXED_INSTALLMENT', 'DECREASING_INSTALLMENT', 'NO_INTEREST']),
  totalMonths: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DEFAULTED', 'PAID']),
});

module.exports = {
  createLoanSchema,
  updateStatusSchema,
};