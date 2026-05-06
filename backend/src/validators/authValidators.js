const { z } = require('zod');

const registerSchema = z.object({
  userEmail: z.string().email(),
  userPassword: z.string().min(8),
  userFirstName: z.string().min(1),
  userLastName: z.string().min(1),
});

const loginSchema = z.object({
  userEmail: z.string().email(),
  userPassword: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
};