const { z } = require('zod');

const itemSchema = z.object({
  name: z.string().min(1, { message: 'Item name is required' }),
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
  price: z.number().positive({ message: 'Price must be positive' }),
});

const createOrderSchema = z.object({
  items: z.array(itemSchema).min(1, { message: 'At least one item is required' }),
});

const updateStatusSchema = z.object({
  status: z.enum(['created', 'in_progress', 'completed', 'cancelled'], {
    message: 'Invalid status',
  }),
});

module.exports = {
  createOrderSchema,
  updateStatusSchema,
};

