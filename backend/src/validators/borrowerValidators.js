const { z } = require('zod');

const createBorrowerSchema = z.object({
  borrowerFirstName: z.string().min(1),
  borrowerLastName: z.string().optional(),
  borrowerEmail: z.string().email().optional(),
  borrowerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

const updateBorrowerSchema = createBorrowerSchema.partial();

module.exports = {
  createBorrowerSchema,
  updateBorrowerSchema,
};