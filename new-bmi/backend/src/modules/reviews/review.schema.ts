import { z } from 'zod';

export const createReviewSchema = z.object({
  order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000).optional(),
});

export const replyReviewSchema = z.object({
  reply: z.string().min(2).max(500),
});
