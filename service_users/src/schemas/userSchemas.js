const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email format' }).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};

