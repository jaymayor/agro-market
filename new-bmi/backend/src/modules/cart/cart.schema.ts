import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().positive(),
});
